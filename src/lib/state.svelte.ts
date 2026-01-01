import { type Reference, DEFAULT_REFERENCES } from './references';

export interface AppSettings {
    openaiKey: string;
    anthropicKey: string;
    geminiKey: string;
    customKey: string;
    targetModel: 'claude' | 'gpt' | 'gemini';
    provider: 'openai' | 'anthropic' | 'gemini' | 'custom';
    language: 'zh' | 'en';
    theme: 'dark' | 'light';
    baseUrls: {
        openai: string;
        anthropic: string;
        gemini: string;
        custom: string;
    };
    models: {
        openai: string;
        anthropic: string;
        gemini: string;
        custom: string;
    };
    endpointSuffixes: {
        openai: string;
        anthropic: string;
        gemini: string;
        custom: string;
    };
    useEndpointSuffixes: {
        openai: boolean;
        anthropic: boolean;
        gemini: boolean;
        custom: boolean;
    };
    availableModels: {
        openai: { id: string; name: string }[];
        anthropic: { id: string; name: string }[];
        gemini: { id: string; name: string }[];
        custom: { id: string; name: string }[];
    };
    customIcon?: string;
    references: Reference[];
}

class AppState {
    settings = $state<AppSettings>({
        openaiKey: '',
        anthropicKey: '',
        geminiKey: '',
        customKey: '',
        targetModel: 'claude',
        provider: 'openai',
        language: 'zh',
        theme: 'dark',
        baseUrls: {
            openai: 'https://api.openai.com/v1',
            anthropic: 'https://api.anthropic.com/v1',
            gemini: 'https://generativelanguage.googleapis.com/v1beta',
            custom: '',
        },
        models: {
            openai: 'gpt-5.2',
            anthropic: 'claude-sonnet-4-5-20250929',
            gemini: 'gemini-3-flash-preview',
            custom: '',
        },
        endpointSuffixes: {
            openai: '/chat/completions',
            anthropic: '/messages',
            gemini: '',
            custom: '/chat/completions',
        },
        useEndpointSuffixes: {
            openai: true,
            anthropic: true,
            gemini: true,
            custom: true,
        },
        availableModels: {
            openai: [],
            anthropic: [],
            gemini: [],
            custom: [],
        },
        customIcon: '',
        references: [...DEFAULT_REFERENCES],
    });

    constructor() {
        this.load();
        $effect.root(() => {
            $effect(() => {
                localStorage.setItem('prompt-max-settings', JSON.stringify(this.settings));
                this.applyTheme();
            });
        });
    }

    applyTheme() {
        if (this.settings.theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }

    load() {
        const stored = localStorage.getItem('prompt-max-settings');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);

                const defaults: Partial<AppSettings> = {
                    theme: 'dark',
                    models: {
                        openai: 'gpt-5.2',
                        anthropic: 'claude-sonnet-4-5-20250929',
                        gemini: 'gemini-3-flash-preview',
                        custom: '',
                    }
                };

                if (!parsed.theme) parsed.theme = defaults.theme;
                if (!parsed.models) parsed.models = defaults.models;

                // Merge stored references with new defaults
                // Strategy: Keep stored references (to preserve custom ones and toggle state),
                // but inject any new DEFAULT references that might be missing from storage.
                let mergedReferences = parsed.references || [];
                if (mergedReferences.length === 0) {
                    mergedReferences = [...DEFAULT_REFERENCES];
                } else {
                    // Check if any default reference is missing from stored config (e.g. app update)
                    for (const defRef of DEFAULT_REFERENCES) {
                        if (!mergedReferences.find((r: Reference) => r.id === defRef.id)) {
                            mergedReferences.push(defRef);
                        }
                    }
                }
                parsed.references = mergedReferences;

                this.settings = { ...this.settings, ...parsed };
            } catch (e) {
                console.error('Failed to load settings', e);
            }
        }
    }
}

export const appState = new AppState();
