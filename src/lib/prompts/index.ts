export * from './claude';
export * from './gpt';
export * from './gemini';

import { CLAUDE_OPTIMIZER_PROMPT } from './claude';
import { GPT_OPTIMIZER_PROMPT } from './gpt';
import { GEMINI_OPTIMIZER_PROMPT } from './gemini';

export const PROMPTS = {
    claude: CLAUDE_OPTIMIZER_PROMPT,
    gpt: GPT_OPTIMIZER_PROMPT,
    gemini: GEMINI_OPTIMIZER_PROMPT,
};

export type ModelType = keyof typeof PROMPTS;
