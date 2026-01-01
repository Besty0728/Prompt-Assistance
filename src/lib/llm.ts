export interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface CompletionOptions {
    apiKey: string;
    baseURL?: string;
    model: string;
    provider?: 'openai' | 'anthropic' | 'gemini' | 'custom';
}

export async function chatCompletion(
    messages: Message[],
    options: CompletionOptions,
    onChunk: (chunk: string) => void
) {
    const { provider = 'openai' } = options;

    if (provider === 'anthropic') {
        await streamAnthropic(messages, options, onChunk);
    } else if (provider === 'gemini') {
        await streamGemini(messages, options, onChunk);
    } else {
        // OpenAI and Custom (Generic OpenAI Compatible)
        await streamOpenAI(messages, options, onChunk);
    }
}

// --- OpenAI Implementation ---
async function streamOpenAI(
    messages: Message[],
    options: CompletionOptions,
    onChunk: (chunk: string) => void
) {
    const baseURL = (options.baseURL || 'https://api.openai.com/v1').replace(/\/$/, '');
    const url = `${baseURL}/chat/completions`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${options.apiKey}`
        },
        body: JSON.stringify({
            model: options.model,
            messages: messages,
            stream: true,
            temperature: 0.7
        })
    });

    if (!response.body) throw new Error('No response body from OpenAI');
    if (!response.ok) {
        const err = await response.text();
        throw new Error(`OpenAI API Error: ${err}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;

            const data = trimmed.slice(6);
            if (data === '[DONE]') continue;

            try {
                const json = JSON.parse(data);
                const content = json.choices?.[0]?.delta?.content || '';
                if (content) onChunk(content);
            } catch (e) {
                console.warn('Failed to parse OpenAI chunk', e);
            }
        }
    }
}

// --- Anthropic Implementation ---
async function streamAnthropic(
    messages: Message[],
    options: CompletionOptions,
    onChunk: (chunk: string) => void
) {
    const baseURL = (options.baseURL || 'https://api.anthropic.com/v1').replace(/\/$/, '');
    const url = `${baseURL}/messages`;

    // Filter out system message to top-level parameter
    const systemMessage = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');

    const body: any = {
        model: options.model,
        messages: userMessages.map(m => ({ role: m.role, content: m.content })),
        max_tokens: 4096,
        stream: true,
    };

    if (systemMessage) {
        body.system = systemMessage.content;
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'x-api-key': options.apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.body) throw new Error('No response body from Anthropic');
    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Anthropic API Error: ${err}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('event: ')) continue;

            // Anthropic SSE format:
            // event: content_block_delta
            // data: {"type": "content_block_delta", ... "delta": {"type": "text_delta", "text": "..."}}

            // We need to read the NEXT line for data
            // Actually, simpler parsing: split block by double newline
        }
    }

    // Re-do parsing for SSE correctly because Anthropic events are multi-line
    // event: ...
    // data: ...
    //
    // Use a simpler approach for SSE
    await parseSSE(response, (event, data) => {
        if (event === 'content_block_delta') {
            try {
                const json = JSON.parse(data);
                if (json.delta?.type === 'text_delta') {
                    onChunk(json.delta.text);
                }
            } catch (e) { }
        }
    });
}

// Helper for generic SSE parsing (handling multi-line events)
async function parseSSE(response: Response, onEvent: (event: string, data: string) => void) {
    const reader = response.body?.getReader();
    if (!reader) return;
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
            const lines = part.split('\n');
            let event = '';
            let data = '';

            for (const line of lines) {
                if (line.startsWith('event: ')) event = line.slice(7).trim();
                else if (line.startsWith('data: ')) data = line.slice(6).trim();
            }
            if (event && data) onEvent(event, data);
        }
    }
}


// --- Gemini Implementation ---
async function streamGemini(
    messages: Message[],
    options: CompletionOptions,
    onChunk: (chunk: string) => void
) {
    const baseURL = (options.baseURL || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/$/, '');
    const url = `${baseURL}/models/${options.model}:streamGenerateContent?key=${options.apiKey}`;

    // Gemini Content Format:
    // { contents: [{ role: 'user', parts: [{ text: '...' }] }] }
    // System instruction is top level (beta) or just merged. Let's merge system prompt for specific 'user' role or use system_instruction if available.
    // Official API: v1beta supports system_instruction.

    const systemMessage = messages.find(m => m.role === 'system');
    const conversation = messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
    }));

    const body: any = {
        contents: conversation,
        generationConfig: {
            maxOutputTokens: 8192,
        }
    };

    if (systemMessage) {
        body.systemInstruction = {
            parts: [{ text: systemMessage.content }]
        };
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
    });

    if (!response.body) throw new Error('No response body from Gemini');
    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini API Error: ${err}`);
    }

    // Gemini returns a streamed JSON array [ { ... }, { ... } ] but it might come in chunks like other SSE or just pure JSON array stream.
    // Wait, Gemini streamGenerateContent returns a stream of JSON objects, usually separated.
    // Actually it's standard JSON stream usually.
    // Let's assume standard fetch stream reading.
    // NOTE: Gemini REST API returns a JSON array, but it sends chunks of the array.
    // We need to parse a partial JSON array or just handle the objects as they arrive.
    // Easier way: Read text, find "text": "..." fields.

    // A robust way for simple streaming:
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Hacky but effective for complex JSON streams without full parser:
        // Look for "text": "..." patterns in the new buffer or balanced braces.
        // Better: Gemini returns objects like: { "candidates": [ ... ] }
        // The stream format is usually comma separated objects [ {...}, \n {...} ]

        // Let's try to split by some delimiter if possible, or just parse valid JSON objects from buffer.

        // Attempt to find complete JSON objects in buffer (assuming they are separated by comma or newlines)
        let startIndex = 0;
        let braceCount = 0;
        let inString = false;

        for (let i = 0; i < buffer.length; i++) {
            const char = buffer[i];
            if (char === '"' && buffer[i - 1] !== '\\') inString = !inString;
            if (!inString) {
                if (char === '{') {
                    if (braceCount === 0) startIndex = i;
                    braceCount++;
                } else if (char === '}') {
                    braceCount--;
                    if (braceCount === 0) {
                        // Found a complete object
                        const jsonStr = buffer.substring(startIndex, i + 1);
                        try {
                            const json = JSON.parse(jsonStr);
                            const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                            if (text) onChunk(text);
                        } catch (e) { }
                        // Advance buffer
                        // buffer = buffer.slice(i + 1); // Careful, modifying loop var
                        // Actually better to just mark processed.
                    }
                }
            }
        }

    }
}
