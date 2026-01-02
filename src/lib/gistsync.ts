import { appState, type AppSettings } from './state.svelte';

const GIST_DESC = 'Prompt-Assistance';
const GIST_DESC_LEGACY = 'prompt-max-sync'; // Backward compatibility
const GIST_FILE = 'settings.json';

// Helper to clean token
function getCleanToken(token: string): string {
    // 1. Remove prefixes
    let clean = token.replace(/^Bearer\s+/i, '').replace(/^token\s+/i, '');

    // 2. Aggressively remove invisible characters/whitespace (including non-breaking spaces)
    // Keep only: alphanumeric, underscore, hyphen
    const sanitized = clean.replace(/[^a-zA-Z0-9_-]/g, '');

    if (clean !== sanitized) {
        console.warn(`[Sync] Token sanitized. Removed ${clean.length - sanitized.length} hidden chars.`);
    }

    return sanitized;
}

// Determine auth scheme based on token prefix - NO API CALL
function getAuthScheme(token: string): 'Bearer' | 'token' {
    const clean = getCleanToken(token);
    // Classic tokens (ghp_) use 'token', Fine-grained (github_pat_) use 'Bearer'
    return clean.startsWith('ghp_') ? 'token' : 'Bearer';
}

// Validates token by making a single API call
export async function validateToken(token: string): Promise<'Bearer' | 'token' | null> {
    const cleanToken = getCleanToken(token);
    const scheme = getAuthScheme(token);

    console.log(`[Sync] Validating token: ${cleanToken.substring(0, 6)}... (len: ${cleanToken.length}, scheme: ${scheme})`);

    try {
        const res = await fetch('https://api.github.com/rate_limit', {
            headers: {
                Authorization: `${scheme} ${cleanToken}`,
                Accept: 'application/vnd.github.v3+json',
            },
        });

        console.log(`[Sync] Validation Result: ${res.status} ${res.statusText}`);

        if (res.ok) {
            return scheme;
        } else {
            const body = await res.text();
            console.warn(`[Sync] Validation Failed:`, body);
        }
    } catch (e) {
        console.error('[Sync] Validation network error', e);
    }

    return null;
}

export async function findGist(token: string, scheme?: string): Promise<string | null> {
    const actualScheme = scheme || getAuthScheme(token);
    try {
        const response = await fetch('https://api.github.com/gists', {
            headers: {
                Authorization: `${actualScheme} ${getCleanToken(token)}`,
                Accept: 'application/vnd.github.v3+json',
            },
        });
        if (!response.ok) return null;
        const gists = await response.json();
        // Search for new description, legacy description, or file match
        const found = gists.find((g: any) =>
            g.description === GIST_DESC ||
            g.description === GIST_DESC_LEGACY ||
            (g.files && g.files[GIST_FILE])
        );
        return found ? found.id : null;
    } catch (e) {
        console.error('Find Gist Error:', e);
        return null;
    }
}

export async function createGist(token: string, content: string, scheme?: string): Promise<string | null> {
    const actualScheme = scheme || getAuthScheme(token);
    try {
        const response = await fetch('https://api.github.com/gists', {
            method: 'POST',
            headers: {
                Authorization: `${actualScheme} ${getCleanToken(token)}`,
                Accept: 'application/vnd.github.v3+json',
            },
            body: JSON.stringify({
                description: GIST_DESC,
                public: false,
                files: {
                    [GIST_FILE]: {
                        content: content,
                    },
                },
            }),
        });
        if (!response.ok) {
            const body = await response.text();
            console.error('[Sync] Create Gist Failed:', response.status, body);
            return null;
        }
        const data = await response.json();
        return data.id;
    } catch (e) {
        console.error('Create Gist Error:', e);
        return null;
    }
}

export async function updateGist(token: string, gistId: string, content: string, scheme?: string): Promise<boolean> {
    const actualScheme = scheme || getAuthScheme(token);
    try {
        const response = await fetch(`https://api.github.com/gists/${gistId}`, {
            method: 'PATCH',
            headers: {
                Authorization: `${actualScheme} ${getCleanToken(token)}`,
                Accept: 'application/vnd.github.v3+json',
            },
            body: JSON.stringify({
                files: {
                    [GIST_FILE]: {
                        content: content,
                    },
                },
            }),
        });
        if (!response.ok) {
            const body = await response.text();
            console.error('[Sync] Update Gist Failed:', response.status, body);
        }
        return response.ok;
    } catch (e) {
        console.error('Update Gist Error:', e);
        return false;
    }
}

export async function readGist(token: string, gistId: string, scheme?: string): Promise<Partial<AppSettings> | null> {
    const actualScheme = scheme || getAuthScheme(token);
    try {
        const response = await fetch(`https://api.github.com/gists/${gistId}`, {
            headers: {
                Authorization: `${actualScheme} ${getCleanToken(token)}`,
                Accept: 'application/vnd.github.v3+json',
            },
        });
        if (!response.ok) {
            const body = await response.text();
            console.error('[Sync] Read Gist Failed:', response.status, body);
            return null;
        }
        const data = await response.json();
        const file = data.files[GIST_FILE];
        if (!file || !file.content) return null;

        return JSON.parse(file.content);
    } catch (e) {
        console.error('Read Gist Error:', e);
        return null;
    }
}

export async function syncUpload(currentSettings?: AppSettings): Promise<boolean> {
    const s = currentSettings ? currentSettings.sync : appState.settings.sync;
    if (!s.githubToken) return false;

    const scheme = getAuthScheme(s.githubToken);
    const settings = currentSettings || appState.settings;

    // Only sync history (NOT api keys, references, or full config)
    const syncPayload = {
        version: 1,
        lastModified: Date.now(),
        history: settings.history,
    };

    const content = JSON.stringify(syncPayload, null, 2);
    console.log(`[Sync] Uploading payload (${content.length} chars)`);

    let gistId = s.gistId;

    // First try to find an existing gist for THIS token
    if (!gistId) {
        gistId = await findGist(s.githubToken, scheme) || '';
    }

    if (gistId) {
        const success = await updateGist(s.githubToken, gistId, content, scheme);
        if (success) {
            s.gistId = gistId;
            s.lastSyncTime = Date.now();
            s.authScheme = scheme;
            return true;
        } else {
            // Update failed (404 = gist not accessible by this token)
            // Clear the stale gistId and try to create new
            console.warn('[Sync] Stored gistId invalid, clearing and creating new...');
            s.gistId = '';
            gistId = '';
        }
    }

    // Create new gist
    const newId = await createGist(s.githubToken, content, scheme);
    if (newId) {
        s.gistId = newId;
        s.lastSyncTime = Date.now();
        s.authScheme = scheme;
        console.log(`[Sync] Created new gist: ${newId}`);
        return true;
    }

    return false;
}

export async function syncDownload(currentSettings?: AppSettings): Promise<boolean> {
    const s = currentSettings ? currentSettings.sync : appState.settings.sync;
    if (!s.githubToken) return false;

    const scheme = getAuthScheme(s.githubToken);

    let gistId = s.gistId;
    if (!gistId) {
        gistId = await findGist(s.githubToken, scheme) || '';
        if (gistId) s.gistId = gistId;
    }

    if (!gistId) return false;

    const remoteData = await readGist(s.githubToken, gistId, scheme);
    if (remoteData) {
        const targetSettings = currentSettings || appState.settings;

        // Only merge history from remote
        if (remoteData.history) {
            targetSettings.history = remoteData.history as typeof targetSettings.history;
        }

        s.lastSyncTime = Date.now();
        s.authScheme = scheme;
        console.log('[Sync] Downloaded and merged history');
        return true;
    }
    return false;
}
