export interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface CompletionOptions {
    apiKey: string;
    baseURL?: string;
    model: string;
    provider?: 'openai' | 'anthropic' | 'gemini' | 'custom';
    endpointSuffix?: string;
    useEndpointSuffix?: boolean;
}

export async function chatCompletion(
    messages: Message[],
    options: CompletionOptions,
    onChunk: (chunk: string) => void
) {
    const provider = options.provider || 'openai';
    if (provider === 'anthropic') {
        await streamAnthropic(messages, options, onChunk);
    } else if (provider === 'gemini') {
        await streamGemini(messages, options, onChunk);
    } else {
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
    // Priority: User defined suffix > Intelligent default
    let url = baseURL;
    const shouldAddSuffix = options.useEndpointSuffix !== false;

    if (shouldAddSuffix) {
        if (options.endpointSuffix) {
            url = baseURL.endsWith(options.endpointSuffix) ? baseURL : `${baseURL}${options.endpointSuffix.startsWith('/') ? '' : '/'}${options.endpointSuffix}`;
        } else {
            url = baseURL.endsWith('/chat/completions') ? baseURL : `${baseURL}/chat/completions`;
        }
    }

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

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`OpenAI API Error: ${err}`);
    }

    await parseSSE(response, (data) => {
        if (data === '[DONE]') return;
        try {
            const json = JSON.parse(data);
            const content = json.choices?.[0]?.delta?.content || '';
            if (content) onChunk(content);
        } catch (e) {
            console.warn('Failed to parse OpenAI chunk', e);
        }
    });
}

// --- Anthropic Implementation ---
async function streamAnthropic(
    messages: Message[],
    options: CompletionOptions,
    onChunk: (chunk: string) => void
) {
    const baseURL = (options.baseURL || 'https://api.anthropic.com/v1').replace(/\/$/, '');
    let url = baseURL;
    const shouldAddSuffix = options.useEndpointSuffix !== false;

    if (shouldAddSuffix) {
        if (options.endpointSuffix) {
            url = baseURL.endsWith(options.endpointSuffix) ? baseURL : `${baseURL}${options.endpointSuffix.startsWith('/') ? '' : '/'}${options.endpointSuffix}`;
        } else {
            url = baseURL.endsWith('/messages') ? baseURL : `${baseURL}/messages`;
        }
    }

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

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Anthropic API Error: ${err}`);
    }

    await parseSSE(response, (data, event) => {
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

// --- Gemini Implementation ---
async function streamGemini(
    messages: Message[],
    options: CompletionOptions,
    onChunk: (chunk: string) => void
) {
    const baseURL = (options.baseURL || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/$/, '');
    const url = `${baseURL}/models/${options.model}:streamGenerateContent?key=${options.apiKey}`;

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

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini API Error: ${err}`);
    }

    const reader = response.body?.getReader();
    if (!reader) return;
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Gemini stream returns objects in a JSON array like: [ { ... }, { ... } ]
        // We look for valid JSON objects within the stream.
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
                        const jsonStr = buffer.substring(startIndex, i + 1);
                        try {
                            const json = JSON.parse(jsonStr);
                            const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                            if (text) onChunk(text);
                        } catch (e) { }
                        // Note: We don't slice the buffer here to avoid messing up the loop
                    }
                }
            }
        }
        // Keep only the unprocessed part of the buffer (after the last complete '}')
        const lastBrace = buffer.lastIndexOf('}');
        if (lastBrace !== -1) {
            buffer = buffer.substring(lastBrace + 1);
        }
    }
}

// --- Robust SSE Parser ---
async function parseSSE(response: Response, onData: (data: string, event: string) => void) {
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
            let event = 'message';
            let data = '';

            for (const line of lines) {
                if (line.startsWith('event:')) {
                    event = line.slice(6).trim();
                } else if (line.startsWith('data:')) {
                    data += line.slice(5).trim();
                }
            }
            if (data) {
                onData(data, event);
            }
        }
    }
}
