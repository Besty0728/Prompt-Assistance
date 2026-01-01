export interface Reference {
    id: string;
    title: string;
    type: 'md' | 'pdf' | 'text';
    content: string;
    targetId: 'claude' | 'gpt' | 'gemini' | 'all';
    isCustom: boolean;
    enabled: boolean;
}

export const DEFAULT_REFERENCES: Reference[] = [
    {
        id: 'gemini-md',
        title: 'gemini.md',
        type: 'md',
        targetId: 'gemini',
        isCustom: false,
        enabled: true,
        content: `# Prompt design

Prompt design is the process of creating prompts that elicit accurate, high quality responses from a language model.

## Core Principles for Gemini 3

- **Be precise and direct:** State your goal clearly. Avoid unnecessary language.
- **Use consistent structure:** XML-style tags (<context>, <task>) or Markdown headings.
- **Define parameters:** Explicitly explain ambiguous terms.
- **Control output verbosity:** Request detailed responses explicitly if needed.
- **Prioritize critical instructions:** Place constraints at the beginning of the prompt.
- **Structure for long contexts:** Provide context first, then instructions at the end.

## Clear and Specific Instructions

Instructions can be questions, step-by-step tasks, or user experience mappings.

### Input Types
| Type | Example |
|---|---|
| Question | "What's a good name for a flower shop?" |
| Task | "List 5 items for a camping trip." |
| Entity | "Classify: Elephant, Mouse, Snail → [large, small]" |

### Constraints
Specify what to do and not to do. Example: "Summarize in one sentence."

### Response Format
Request specific formats: table, bulleted list, JSON, paragraph.

## Few-Shot Prompts

Include examples that show the model the desired output pattern.
- Use specific and varied examples.
- Ensure consistent formatting across examples.

## Add Context

Provide necessary background information the model needs to solve the problem.

## Add Prefixes

- **Input prefix:** "English:", "French:" to demarcate sections.
- **Output prefix:** "JSON:" to signal expected format.

## Model Parameters

1. **Max output tokens:** ~100 tokens = 60-80 words.
2. **Temperature:** Keep at 1.0 for Gemini 3 (recommended).
3. **topK/topP:** Control token selection probability.
4. **stop_sequences:** Define when to stop generating.

## Gemini 3 Flash Strategies

- **Current day accuracy:** "Remember it is 2025 this year."
- **Knowledge cutoff:** "Your knowledge cutoff date is January 2025."
- **Grounding:** "Rely ONLY on facts in the provided context."

## Enhancing Reasoning

Prompt the model to plan or self-critique before answering.

**Explicit planning:**
1. Parse the goal into sub-tasks.
2. Check if input is complete.
3. Create structured outline.

**Self-critique:**
1. Did I answer the user's intent?
2. Is the tone authentic to the persona?

## Agentic Workflows

For complex agents, configure:
- **Reasoning:** Logical decomposition, problem diagnosis.
- **Execution:** Adaptability, persistence, risk assessment.
- **Interaction:** Ambiguity handling, verbosity, precision.

## Things to Avoid

- Don't rely on models for factual information.
- Use care on math and logic problems.`
    },
    {
        id: 'gemini-pdf',
        title: 'gemini.pdf',
        type: 'pdf',
        targetId: 'gemini',
        isCustom: false,
        enabled: true,
        content: `# Advanced Gemini 3.0 Prompting Strategies (PDF Summary)

## Complex Reasoning
- Use "Thinking" tags to force internal monologue.
- Break down tasks into sub-steps explicitly.

## Multimodal Inputs (PDF/Images)
- Reference specific pages or regions.
- Ask for structured extraction (JSON) from visual data.

## Tuning Stability
- Keep Temperature at 1.0 for Gemini 3.
- Use explicit constraints for output format verification.`
    },
    {
        id: 'claude-md',
        title: 'claude.md',
        type: 'md',
        targetId: 'claude',
        isCustom: false,
        enabled: true,
        content: `# Claude 3 Prompt Engineering

## Be Clear & Direct
Claude responds well to clear, direct instructions.

## Assign a Persona
"You are an expert physicist..."

## XML Tags
Use XML tags like <context>, <instructions>, <examples> to structure your prompt. Claude is fine-tuned to pay attention to these.

## Chain of Thought
Ask Claude to "think step by step" before answering.`
    },
    {
        id: 'gpt-md',
        title: 'gpt.md',
        type: 'md',
        targetId: 'gpt',
        isCustom: false,
        enabled: true,
        content: `# OpenAI Prompt Strategies

## Write clear instructions
- Include details in your query to get more relevant answers.
- Ask the model to adopt a persona.
- Use delimiters to clearly indicate distinct parts of the input.

## Provide reference text
- Ask the model to answer using a reference text.
- Ask the model to answer with citations.

## Split complex tasks
- Use intent classification to identify the most relevant instructions.
- Summarize or filter long dialogue.`
    },
    {
        id: 'universal-baseline',
        title: 'Universal Prompt Baseline',
        type: 'md',
        targetId: 'all',
        isCustom: false,
        enabled: false,
        content: `# Universal Principles
- **Clarity**: Ambiguity is the enemy.
- **Context**: Always provide necessary background.
- **Examples**: Show, don't just tell.`
    }
];
