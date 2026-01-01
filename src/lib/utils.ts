/**
 * Deep clone an object.
 * Uses JSON parse/stringify to handle Svelte 5 state proxies which cannot be
 * cloned with structuredClone (throws DataCloneError on Proxy objects).
 */
export function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Estimate token count for a given text.
 * Uses a simple heuristic: CJK characters = 1 token, words = ~1.3 tokens.
 */
export function estimateTokens(text: string): number {
    if (!text) return 0;
    const cjkRegex = /[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/g;
    const cjkMatch = text.match(cjkRegex);
    const cjkCount = cjkMatch ? cjkMatch.length : 0;
    const nonCjkText = text.replace(cjkRegex, " ");
    const wordCount = (nonCjkText.match(/[\w-]+/g) || []).length;
    return Math.floor(cjkCount + wordCount * 1.3);
}
