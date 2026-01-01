<script lang="ts">
    import { appState } from "../lib/state.svelte";
    import { translations } from "../lib/i18n";
    import { PROMPTS, type ModelType } from "../lib/prompts";
    import { chatCompletion, type Message } from "../lib/llm";
    import {
        Wand2,
        Copy,
        Check,
        Loader2,
        AlertTriangle,
        Sparkles as SparklesIcon,
        Bot,
        Cpu,
        Zap,
        LayoutTemplate,
        SquareArrowOutUpRight,
        FileText,
        FileType,
        File,
        Trash2,
        Plus,
    } from "lucide-svelte";
    import { marked } from "marked";
    import { DEFAULT_REFERENCES } from "../lib/references";
    import { GEMINI_OPTIMIZER_PROMPT } from "../lib/prompts/gemini";

    let inputPrompt = $state("");
    let outputPrompt = $state("");
    let isOptimizing = $state(false);
    let error = $state<string | null>(null);
    let copied = $state(false);

    // Custom Reference Modal State
    let showRefModal = $state(false);
    let newRefTitle = $state("");
    let newRefContent = $state("");

    let t = $derived(translations[appState.settings.language]);
    let pillX = $state(50);
    let pillY = $state(50);

    function handlePillMouseMove(e: MouseEvent) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        pillX = ((e.clientX - rect.left) / rect.width) * 100;
        pillY = ((e.clientY - rect.top) / rect.height) * 100;
    }

    let activeProviderConfig = $derived.by(() => {
        const p = appState.settings.provider;
        const key =
            p === "anthropic"
                ? appState.settings.anthropicKey
                : p === "gemini"
                  ? appState.settings.geminiKey
                  : appState.settings.openaiKey;

        const baseUrl = appState.settings.baseUrls[p] || "";
        const model = appState.settings.models[p] || "";

        return { key, baseUrl, model, provider: p };
    });

    function escapeXmlTags(text: string): string {
        // Wrap XML tags in code blocks so they render nicely
        return text.replace(/<(\/?[a-z_]+)>/gi, "`<$1>`");
    }

    function estimateTokens(text: string) {
        if (!text) return 0;
        // Simple heuristic: CJK chars = 1 token, Words = 1.3 tokens
        const cjkRegex = /[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/g;
        const cjkMatch = text.match(cjkRegex);
        const cjkCount = cjkMatch ? cjkMatch.length : 0;

        const nonCjkText = text.replace(cjkRegex, " ");
        const wordCount = (nonCjkText.match(/[\w-]+/g) || []).length;

        return Math.floor(cjkCount + wordCount * 1.3);
    }

    let renderedOutput = $derived(
        marked.parse(escapeXmlTags(outputPrompt)) as string,
    );

    function compileReferences() {
        if (!appState.settings.references) return "";
        const activeRefs = appState.settings.references.filter(
            (r) =>
                r.enabled &&
                (r.targetId === "all" ||
                    r.targetId === appState.settings.targetModel),
        );
        if (activeRefs.length === 0) return "";

        return `\n<reference_context>\n${activeRefs.map((r) => `<reference title="${r.title}">\n${r.content}\n</reference>`).join("\n")}\n</reference_context>`;
    }

    async function optimize() {
        if (!inputPrompt.trim()) return;
        const { key, baseUrl, model, provider } = activeProviderConfig;

        if (!key) {
            error = `${t.missingKey} (${provider})`;
            return;
        }

        isOptimizing = true;
        error = null;
        outputPrompt = "";

        const systemPrompt = PROMPTS[appState.settings.targetModel];

        // Inject compiled references into the user prompt context
        const fullUserPrompt = `${inputPrompt}\n\n${compileReferences()}`;

        const messages: Message[] = [
            { role: "system", content: systemPrompt },
            { role: "user", content: fullUserPrompt },
        ];

        try {
            await chatCompletion(
                messages,
                {
                    apiKey: key,
                    baseURL: baseUrl,
                    model: model || "auto",
                    provider: provider,
                },
                (chunk) => {
                    outputPrompt += chunk;
                },
            );
        } catch (e: any) {
            error = e.message || "Optimization failed";
        } finally {
            isOptimizing = false;
        }
    }

    function copyToClipboard() {
        navigator.clipboard.writeText(outputPrompt);
        copied = true;
        setTimeout(() => (copied = false), 2000);
    }

    function setTarget(model: ModelType) {
        appState.settings.targetModel = model;
    }
</script>

<div
    class="w-full h-full flex flex-col bg-white/70 dark:bg-neutral-900/50 backdrop-blur-2xl backdrop-saturate-150 border border-white/50 dark:border-white/10 rounded-[40px] overflow-hidden shadow-[0_32px_80px_-16px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.5)] dark:shadow-[0_32px_80px_-16px_rgba(0,0,0,0.5)] transition-all duration-700"
>
    <!-- Inner Header -->
    <div
        class="shrink-0 h-20 px-8 flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-white/30 dark:bg-white/[0.02]"
    >
        <div class="flex items-center gap-8">
            <!-- macOS Traffic Lights -->
            <div class="flex items-center gap-2">
                <span
                    class="w-3 h-3 rounded-full bg-[#ff605c] hover:brightness-110 transition-all cursor-pointer"
                ></span>
                <span
                    class="w-3 h-3 rounded-full bg-[#ffbd44] hover:brightness-110 transition-all cursor-pointer"
                ></span>
                <span
                    class="w-3 h-3 rounded-full bg-[#00ca4e] hover:brightness-110 transition-all cursor-pointer"
                ></span>
            </div>

            <div
                class="glass-pill group cursor-default"
                onmousemove={handlePillMouseMove}
                style="--x: {pillX}%; --y: {pillY}%;"
            >
                <div class="pill-glow"></div>
                <div class="icon-container">
                    <LayoutTemplate
                        class="size-4 text-neutral-600 dark:text-neutral-400 relative z-10 animated-icon"
                    />
                </div>
                <span
                    class="text-[10px] font-black text-neutral-600 dark:text-neutral-400 uppercase tracking-[0.2em] relative z-10"
                    >{t.targetModel}</span
                >
            </div>

            <!-- Radio Model Selector -->
            <div class="radio-inputs">
                {#each [{ id: "claude", icon: "/icons/claude-color.svg" }, { id: "gpt", icon: "/icons/openai-2.svg" }, { id: "gemini", icon: "/icons/gemini-color.svg" }] as target}
                    <label class="radio">
                        <input
                            type="radio"
                            name="model"
                            checked={appState.settings.targetModel ===
                                target.id}
                            onchange={() => setTarget(target.id as ModelType)}
                        />
                        <span class="name">
                            <img
                                src={target.icon}
                                alt={target.id}
                                class="size-5 object-contain"
                            />
                            <span class="capitalize font-semibold"
                                >{target.id}</span
                            >
                        </span>
                    </label>
                {/each}
            </div>
        </div>

        <div class="flex items-center gap-8">
            <div class="flex flex-col items-end hidden xl:flex">
                <span
                    class="text-[10px] uppercase tracking-[0.4em] text-neutral-400 dark:text-neutral-600 font-black mb-1"
                    >{t.optimizingVia}</span
                >
                <span
                    class="text-xs font-black px-3 py-1 bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-lg"
                    >{activeProviderConfig.provider.toUpperCase()}</span
                >
            </div>

            <button
                onclick={optimize}
                disabled={isOptimizing || !inputPrompt.trim()}
                class="sparkle-button"
            >
                <div class="dots_border"></div>
                {#if isOptimizing}
                    <Loader2 class="sparkle-icon animate-spin" />
                {:else}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        class="sparkle"
                    >
                        <path
                            class="path"
                            stroke-linejoin="round"
                            stroke-linecap="round"
                            stroke="currentColor"
                            fill="currentColor"
                            d="M14.187 8.096L15 5.25L15.813 8.096C16.0231 8.83114 16.4171 9.50062 16.9577 10.0413C17.4984 10.5819 18.1679 10.9759 18.903 11.186L21.75 12L18.904 12.813C18.1689 13.0231 17.4994 13.4171 16.9587 13.9577C16.4181 14.4984 16.0241 15.1679 15.814 15.903L15 18.75L14.187 15.904C13.9769 15.1689 13.5829 14.4994 13.0423 13.9587C12.5016 13.4181 11.8321 13.0241 11.097 12.814L8.25 12L11.096 11.187C11.8311 10.9769 12.5006 10.5829 13.0413 10.0423C13.5819 9.50162 13.9759 8.83214 14.186 8.097L14.187 8.096Z"
                        ></path>
                        <path
                            class="path"
                            stroke-linejoin="round"
                            stroke-linecap="round"
                            stroke="currentColor"
                            fill="currentColor"
                            d="M6 14.25L5.741 15.285C5.59267 15.8785 5.28579 16.4206 4.85319 16.8532C4.42059 17.2858 3.87853 17.5927 3.285 17.741L2.25 18L3.285 18.259C3.87853 18.4073 4.42059 18.7142 4.85319 19.1468C5.28579 19.5794 5.59267 20.1215 5.741 20.715L6 21.75L6.259 20.715C6.40725 20.1216 6.71398 19.5796 7.14639 19.147C7.5788 18.7144 8.12065 18.4075 8.714 18.259L9.75 18L8.714 17.741C8.12065 17.5925 7.5788 17.2856 7.14639 16.853C6.71398 16.4204 6.40725 15.8784 6.259 15.285L6 14.25Z"
                        ></path>
                        <path
                            class="path"
                            stroke-linejoin="round"
                            stroke-linecap="round"
                            stroke="currentColor"
                            fill="currentColor"
                            d="M6.5 4L6.303 4.5915C6.24777 4.75718 6.15472 4.90774 6.03123 5.03123C5.90774 5.15472 5.75718 5.24777 5.5915 5.303L5 5.5L5.5915 5.697C5.75718 5.75223 5.90774 5.84528 6.03123 5.96877C6.15472 6.09226 6.24777 6.24282 6.303 6.4085L6.5 7L6.697 6.4085C6.75223 6.24282 6.84528 6.09226 6.96877 5.96877C7.09226 5.84528 7.24282 5.75223 7.4085 5.697L8 5.5L7.4085 5.303C7.24282 5.24777 7.09226 5.15472 6.96877 5.03123C6.84528 4.90774 6.75223 4.75718 6.697 4.5915L6.5 4Z"
                        ></path>
                    </svg>
                {/if}
                <span class="text_button"
                    >{isOptimizing ? t.optimizing : t.optimize}</span
                >
            </button>
        </div>
    </div>

    {#if error}
        <div
            class="bg-red-500/5 border-b border-red-500/10 p-3 text-center text-red-500 dark:text-red-400 text-[11px] font-black uppercase tracking-[0.2em] animate-in slide-in-from-top-4"
        >
            <AlertTriangle class="size-3.5 inline-block mr-2 -mt-1" />
            {error}
        </div>
    {/if}

    <div class="flex-1 flex flex-row min-h-0 overflow-hidden">
        <!-- INPUT SECTION -->
        <div
            class="flex-1 flex flex-col min-h-0 border-r border-black/[0.03] dark:border-white/5"
        >
            <!-- Animated Input Area -->
            <div class="p-8">
                <div class="form-control">
                    <input
                        type="text"
                        bind:value={inputPrompt}
                        required
                        class="prompt-input"
                    />
                    <label class="prompt-label">
                        <span style="transition-delay:0ms">E</span><span
                            style="transition-delay:50ms">n</span
                        ><span style="transition-delay:100ms">t</span><span
                            style="transition-delay:150ms">e</span
                        ><span style="transition-delay:200ms">r</span><span
                            style="transition-delay:250ms"
                        >
                        </span><span style="transition-delay:300ms">y</span
                        ><span style="transition-delay:350ms">o</span><span
                            style="transition-delay:400ms">u</span
                        ><span style="transition-delay:450ms">r</span><span
                            style="transition-delay:500ms"
                        >
                        </span><span style="transition-delay:550ms">p</span
                        ><span style="transition-delay:600ms">r</span><span
                            style="transition-delay:650ms">o</span
                        ><span style="transition-delay:700ms">m</span><span
                            style="transition-delay:750ms">p</span
                        ><span style="transition-delay:800ms">t</span><span
                            style="transition-delay:850ms">.</span
                        ><span style="transition-delay:900ms">.</span><span
                            style="transition-delay:950ms">.</span
                        >
                    </label>
                </div>
            </div>

            <!-- Reference Context Manager -->
            <div
                class="px-8 flex-1 min-h-0 flex flex-col gap-3 overflow-hidden"
            >
                <div class="flex items-center justify-between">
                    <h3
                        class="text-xs font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest"
                    >
                        {t.contextRefs}
                    </h3>
                    <div class="flex gap-2">
                        <button
                            class="text-[10px] uppercase font-bold text-neutral-400 hover:text-purple-500 transition-colors"
                            onclick={() => {
                                // Reset to default references for current target model
                                const target = appState.settings.targetModel;
                                const defaults = DEFAULT_REFERENCES.filter(
                                    (r) =>
                                        r.targetId === "all" ||
                                        r.targetId === target,
                                );

                                // Merge: keep other targets + custom, overwrite defaults for current target
                                const otherRefs =
                                    appState.settings.references.filter(
                                        (r) =>
                                            r.targetId !== "all" &&
                                            r.targetId !== target,
                                    );
                                const customRefs =
                                    appState.settings.references.filter(
                                        (r) =>
                                            r.isCustom &&
                                            (r.targetId === "all" ||
                                                r.targetId === target),
                                    );

                                appState.settings.references = [
                                    ...otherRefs,
                                    ...customRefs,
                                    ...defaults,
                                ];

                                // Ensure defaults are enabled
                                appState.settings.references.forEach((r) => {
                                    if (
                                        !r.isCustom &&
                                        (r.targetId === "all" ||
                                            r.targetId === target)
                                    )
                                        r.enabled = true;
                                });
                            }}
                            title={t.reset}
                        >
                            {t.reset}
                        </button>
                        <button
                            class="text-[10px] uppercase font-bold text-neutral-400 hover:text-red-500 transition-colors"
                            onclick={() => {
                                // Clear custom references
                                appState.settings.references =
                                    appState.settings.references.filter(
                                        (r) => !r.isCustom,
                                    );
                            }}
                            title={t.clearCustom}
                        >
                            {t.clearCustom}
                        </button>
                    </div>
                </div>

                <div
                    class="flex-1 min-h-0 overflow-y-auto pr-2 flex flex-col gap-2 custom-scrollbar"
                >
                    {#each appState.settings.references.filter((r) => r.targetId === "all" || r.targetId === appState.settings.targetModel) as ref (ref.id)}
                        <div
                            class="group flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/5 hover:border-purple-500/30 transition-all"
                        >
                            <!-- Checkbox -->
                            <input
                                type="checkbox"
                                bind:checked={ref.enabled}
                                class="w-4 h-4 rounded border-neutral-300 text-purple-600 focus:ring-purple-500 bg-transparent"
                            />

                            <!-- Icon -->
                            <div
                                class="p-2 rounded-lg bg-neutral-100 dark:bg-white/10 text-neutral-500 dark:text-neutral-400"
                            >
                                {#if ref.type === "md"}
                                    <FileText class="size-4" />
                                {:else if ref.type === "pdf"}
                                    <FileType class="size-4" />
                                {:else}
                                    <File class="size-4" />
                                {/if}
                            </div>

                            <!-- Info -->
                            <div class="flex-1 min-w-0">
                                <h4
                                    class="text-sm font-bold text-neutral-700 dark:text-neutral-200 truncate"
                                >
                                    {ref.title}
                                </h4>
                                <p
                                    class="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-medium"
                                >
                                    {ref.isCustom ? t.custom : t.official} • {estimateTokens(
                                        ref.content,
                                    )} Tokens
                                </p>
                            </div>

                            <!-- Delete (Custom Only) -->
                            {#if ref.isCustom}
                                <button
                                    class="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 text-neutral-400 hover:text-red-500 rounded-lg transition-all"
                                    onclick={() => {
                                        appState.settings.references =
                                            appState.settings.references.filter(
                                                (r) => r.id !== ref.id,
                                            );
                                    }}
                                >
                                    <Trash2 class="size-4" />
                                </button>
                            {/if}
                        </div>
                    {/each}

                    <!-- Add New Reference Button -->
                    <button
                        class="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-400 hover:text-purple-500 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all group"
                        onclick={() => {
                            newRefTitle = "";
                            newRefContent = "";
                            showRefModal = true;
                        }}
                    >
                        <Plus class="size-4" />
                        <span class="text-xs font-bold uppercase tracking-wider"
                            >{t.addRef}</span
                        >
                    </button>
                </div>
            </div>

            <!-- Fixed footer -->
            <div
                class="shrink-0 px-8 py-4 border-t border-black/[0.03] dark:border-white/5 flex justify-between items-center text-[10px] text-neutral-400 dark:text-neutral-600 font-black tracking-widest bg-white/30 dark:bg-black/20"
            >
                <span class="flex items-center gap-2"
                    ><SquareArrowOutUpRight class="size-3" /> SOURCE_INPUT</span
                >
                <span
                    class="bg-neutral-200/50 dark:bg-white/5 px-2.5 py-1 rounded-full cursor-help"
                    title="*Estimate only. Actual usage may vary."
                    >~{estimateTokens(inputPrompt)} {t.estTokens}</span
                >
            </div>
        </div>

        <!-- OUTPUT SECTION -->
        <div class="flex-1 flex flex-col min-h-0 bg-white/20 dark:bg-black/10">
            {#if outputPrompt}
                <!-- Container for absolute scroll area -->
                <div class="flex-1 relative">
                    <!-- Absolute scroll container - fills parent exactly -->
                    <div
                        class="absolute inset-0 overflow-y-auto p-8 custom-scrollbar"
                    >
                        <!-- Copy button - sticky -->
                        <button
                            onclick={copyToClipboard}
                            class="sticky top-0 float-right ml-4 mb-4 p-3 rounded-2xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-lg hover:scale-110 active:scale-95 transition-all border border-black/5 dark:border-white/10 group z-10"
                        >
                            {#if copied}<Check
                                    class="size-5 text-green-500"
                                />{:else}<Copy
                                    class="size-5 group-hover:text-purple-500 transition-colors"
                                />{/if}
                        </button>
                        <article
                            class="prose prose-neutral dark:prose-invert prose-base max-w-none prose-headings:font-black prose-headings:tracking-tighter prose-a:text-purple-600 dark:prose-a:text-purple-400 prose-code:text-purple-600 dark:prose-code:text-purple-400 prose-code:bg-purple-500/5 dark:prose-code:bg-purple-500/10 prose-pre:bg-neutral-50 dark:prose-pre:bg-black/30 prose-pre:border prose-pre:border-black/5 dark:prose-pre:border-white/10"
                        >
                            {@html renderedOutput}
                        </article>
                    </div>
                </div>
            {:else if isOptimizing}
                <div class="flex-1 flex flex-col items-center justify-center">
                    <!-- Generating Loader -->
                    <div class="loader-wrapper">
                        <span class="loader-letter">G</span>
                        <span class="loader-letter">e</span>
                        <span class="loader-letter">n</span>
                        <span class="loader-letter">e</span>
                        <span class="loader-letter">r</span>
                        <span class="loader-letter">a</span>
                        <span class="loader-letter">t</span>
                        <span class="loader-letter">i</span>
                        <span class="loader-letter">n</span>
                        <span class="loader-letter">g</span>
                        <div class="loader"></div>
                    </div>
                </div>
            {:else}
                <div
                    class="flex-1 flex flex-col items-center justify-center gap-10 p-20 select-none"
                >
                    <!-- Newton's Cradle Animation -->
                    <div class="newtons-cradle">
                        <div class="newtons-cradle__dot"></div>
                        <div class="newtons-cradle__dot"></div>
                        <div class="newtons-cradle__dot"></div>
                        <div class="newtons-cradle__dot"></div>
                    </div>
                    <div class="text-center space-y-4">
                        <h3
                            class="text-2xl font-black text-neutral-400 dark:text-neutral-600 tracking-tight"
                        >
                            {t.selectTarget}
                        </h3>
                        <p
                            class="text-sm text-neutral-400 dark:text-neutral-500 font-medium max-w-xs mx-auto leading-relaxed"
                        >
                            Select a generation engine to begin the
                            transformation.
                        </p>
                    </div>
                </div>
            {/if}

            <div
                class="shrink-0 px-10 py-4 border-t border-black/[0.03] dark:border-white/5 flex justify-between items-center text-[10px] text-neutral-400 dark:text-neutral-600 font-black tracking-widest bg-white/30 dark:bg-black/10"
            >
                <span class="flex items-center gap-3">OPTIMIZED_OUTPUT</span>
                {#if outputPrompt}
                    <span
                        class="flex items-center gap-3 text-green-600 dark:text-green-500 bg-green-500/5 px-3 py-1 rounded-full"
                    >
                        <span
                            class="size-2.5 rounded-full bg-current animate-pulse"
                        ></span>
                        DEPLOYMENT_READY
                    </span>
                {/if}
            </div>
        </div>
    </div>
</div>

<!-- Custom Reference Modal -->
{#if showRefModal}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onclick={(e) => {
            if (e.target === e.currentTarget) showRefModal = false;
        }}
        onkeydown={(e) => {
            if (e.key === "Escape") showRefModal = false;
        }}
        role="dialog"
        aria-modal="true"
        tabindex="-1"
    >
        <div
            class="w-full max-w-2xl mx-4 bg-white/95 dark:bg-neutral-900/95 rounded-3xl shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden"
        >
            <!-- Modal Header -->
            <div
                class="px-6 py-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between"
            >
                <h3 class="text-lg font-bold text-neutral-800 dark:text-white">
                    {t.addRef}
                </h3>
                <button
                    class="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-600 dark:hover:text-white transition-colors"
                    onclick={() => (showRefModal = false)}
                    aria-label="Close"
                >
                    <svg
                        class="size-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <!-- Modal Body -->
            <div class="p-6 space-y-4">
                <div>
                    <label
                        class="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2"
                        >{t.refTitle}</label
                    >
                    <input
                        type="text"
                        bind:value={newRefTitle}
                        placeholder="e.g., My Custom Guidelines"
                        class="w-full px-4 py-3 bg-neutral-100/80 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl text-neutral-800 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
                    />
                </div>
                <div>
                    <label
                        class="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2"
                        >{t.refContent}</label
                    >
                    <textarea
                        bind:value={newRefContent}
                        placeholder="Paste your reference content here (Markdown or plain text)..."
                        rows="12"
                        class="w-full px-4 py-3 bg-neutral-100/80 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl text-neutral-800 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all resize-none font-mono text-sm"
                    ></textarea>
                    <p
                        class="mt-2 text-xs text-neutral-400 dark:text-neutral-500"
                    >
                        ~{estimateTokens(newRefContent)}
                        {t.estTokens}
                    </p>
                </div>
            </div>

            <!-- Modal Footer -->
            <div
                class="px-6 py-4 border-t border-black/5 dark:border-white/5 flex justify-end gap-3"
            >
                <button
                    class="px-5 py-2.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                    onclick={() => (showRefModal = false)}
                >
                    {appState.settings.language === "zh" ? "取消" : "Cancel"}
                </button>
                <button
                    class="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 rounded-xl shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!newRefTitle.trim() || !newRefContent.trim()}
                    onclick={() => {
                        appState.settings.references.push({
                            id: crypto.randomUUID(),
                            title: newRefTitle.trim(),
                            type: "text",
                            content: newRefContent.trim(),
                            targetId: appState.settings.targetModel,
                            isCustom: true,
                            enabled: true,
                        });
                        showRefModal = false;
                    }}
                >
                    {appState.settings.language === "zh" ? "添加" : "Add"}
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    /* Glass Pill Styles */
    .glass-pill {
        position: relative;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.625rem 1.25rem;
        background: rgba(0, 0, 0, 0.03);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(0, 0, 0, 0.05);
        border-radius: 999px;
        box-shadow:
            0 2px 5px rgba(0, 0, 0, 0.02),
            inset 0 1px 0 rgba(255, 255, 255, 0.6);
        transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
        overflow: hidden;
    }
    :global(.dark) .glass-pill {
        background: rgba(255, 255, 255, 0.03);
        border-color: rgba(255, 255, 255, 0.08);
        box-shadow:
            0 10px 20px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
    }
    .glass-pill:hover {
        transform: translateY(-1px) scale(1.02);
        background: rgba(0, 0, 0, 0.05);
        border-color: rgba(124, 58, 237, 0.2);
    }
    :global(.dark) .glass-pill:hover {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(139, 92, 246, 0.3);
    }

    .pill-glow {
        position: absolute;
        inset: 0;
        background: radial-gradient(
            circle at var(--x, 50%) var(--y, 50%),
            rgba(124, 58, 237, 0.15) 0%,
            transparent 60%
        );
        opacity: 0;
        transition: opacity 0.3s;
        z-index: 1;
    }
    .glass-pill:hover .pill-glow {
        opacity: 1;
    }

    .icon-container {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .animated-icon {
        transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .glass-pill:hover .animated-icon {
        transform: rotate(15deg) scale(1.2);
        color: #7c3aed !important;
        filter: drop-shadow(0 0 8px rgba(124, 58, 237, 0.5));
    }
    :global(.dark) .glass-pill:hover .animated-icon {
        color: #a5b4fc !important;
        filter: drop-shadow(0 0 8px rgba(165, 180, 252, 0.5));
    }

    /* Generating Loader Styles */
    .loader-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 180px;
        height: 180px;
        font-family: "Inter", sans-serif;
        font-size: 1.2em;
        font-weight: 300;
        color: #7c3aed; /* Light mode: purple text */
        border-radius: 50%;
        background-color: transparent;
        user-select: none;
    }
    :global(.dark) .loader-wrapper {
        color: white; /* Dark mode: white text */
    }

    .loader {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        aspect-ratio: 1 / 1;
        border-radius: 50%;
        background-color: transparent;
        animation: loader-rotate 2s linear infinite;
        z-index: 0;
    }
    /* Light mode loader ring */
    .loader {
        box-shadow:
            0 10px 20px 0 rgba(124, 58, 237, 0.3) inset,
            0 20px 30px 0 rgba(139, 92, 246, 0.4) inset,
            0 60px 60px 0 rgba(167, 139, 250, 0.3) inset;
    }
    :global(.dark) .loader {
        box-shadow:
            0 10px 20px 0 #fff inset,
            0 20px 30px 0 #ad5fff inset,
            0 60px 60px 0 #471eec inset;
    }

    @keyframes loader-rotate {
        0% {
            transform: rotate(90deg);
        }
        50% {
            transform: rotate(270deg);
        }
        100% {
            transform: rotate(450deg);
        }
    }

    .loader-letter {
        display: inline-block;
        opacity: 0.4;
        transform: translateY(0);
        animation: loader-letter-anim 2s infinite;
        z-index: 1;
        border-radius: 50ch;
        border: none;
    }

    .loader-letter:nth-child(1) {
        animation-delay: 0s;
    }
    .loader-letter:nth-child(2) {
        animation-delay: 0.1s;
    }
    .loader-letter:nth-child(3) {
        animation-delay: 0.2s;
    }
    .loader-letter:nth-child(4) {
        animation-delay: 0.3s;
    }
    .loader-letter:nth-child(5) {
        animation-delay: 0.4s;
    }
    .loader-letter:nth-child(6) {
        animation-delay: 0.5s;
    }
    .loader-letter:nth-child(7) {
        animation-delay: 0.6s;
    }
    .loader-letter:nth-child(8) {
        animation-delay: 0.7s;
    }
    .loader-letter:nth-child(9) {
        animation-delay: 0.8s;
    }
    .loader-letter:nth-child(10) {
        animation-delay: 0.9s;
    }

    @keyframes loader-letter-anim {
        0%,
        100% {
            opacity: 0.4;
            transform: translateY(0);
        }
        20% {
            opacity: 1;
            transform: scale(1.15);
        }
        40% {
            opacity: 0.7;
            transform: translateY(0);
        }
    }

    /* Scrollbar Styles */
    .custom-scrollbar::-webkit-scrollbar {
        width: 12px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.05);
        border: 4px solid transparent;
        background-clip: content-box;
        border-radius: 99px;
    }
    :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.04);
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background-color: rgba(168, 85, 247, 0.2);
    }

    /* Newton's Cradle Animation */
    .newtons-cradle {
        --uib-size: 80px;
        --uib-speed: 1.2s;
        --uib-color: #1a1a1a; /* Light mode: black */
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: var(--uib-size);
        height: var(--uib-size);
    }
    :global(.dark) .newtons-cradle {
        --uib-color: #ffffff; /* Dark mode: white */
    }

    .newtons-cradle__dot {
        position: relative;
        display: flex;
        align-items: center;
        height: 100%;
        width: 25%;
        transform-origin: center top;
    }

    .newtons-cradle__dot::after {
        content: "";
        display: block;
        width: 100%;
        height: 25%;
        border-radius: 50%;
        background-color: var(--uib-color);
    }

    .newtons-cradle__dot:first-child {
        animation: swing var(--uib-speed) linear infinite;
    }

    .newtons-cradle__dot:last-child {
        animation: swing2 var(--uib-speed) linear infinite;
    }

    @keyframes swing {
        0% {
            transform: rotate(0deg);
            animation-timing-function: ease-out;
        }
        25% {
            transform: rotate(70deg);
            animation-timing-function: ease-in;
        }
        50% {
            transform: rotate(0deg);
            animation-timing-function: linear;
        }
    }

    @keyframes swing2 {
        0% {
            transform: rotate(0deg);
            animation-timing-function: linear;
        }
        50% {
            transform: rotate(0deg);
            animation-timing-function: ease-out;
        }
        75% {
            transform: rotate(-70deg);
            animation-timing-function: ease-in;
        }
    }

    /* Animated Input Form Styles */
    .form-control {
        position: relative;
        width: 100%;
    }

    .form-control .prompt-input {
        background-color: transparent;
        border: 0;
        border-bottom: 2px solid #d1d5db;
        display: block;
        width: 100%;
        padding: 15px 0;
        font-size: 18px;
        color: #1a1a1a;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            monospace;
    }
    :global(.dark) .form-control .prompt-input {
        border-bottom-color: #4b5563;
        color: #ffffff;
    }

    .form-control .prompt-input:focus,
    .form-control .prompt-input:valid {
        outline: 0;
        border-bottom-color: #7c3aed;
    }
    :global(.dark) .form-control .prompt-input:focus,
    :global(.dark) .form-control .prompt-input:valid {
        border-bottom-color: #a5b4fc;
    }

    .form-control .prompt-label {
        position: absolute;
        top: 15px;
        left: 0;
        pointer-events: none;
    }

    .form-control .prompt-label span {
        display: inline-block;
        font-size: 18px;
        min-width: 5px;
        color: #9ca3af;
        transition: 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }
    :global(.dark) .form-control .prompt-label span {
        color: #6b7280;
    }

    .form-control .prompt-input:focus + .prompt-label span,
    .form-control .prompt-input:valid + .prompt-label span {
        color: #7c3aed;
        transform: translateY(-30px);
    }
    :global(.dark) .form-control .prompt-input:valid + .prompt-label span {
        color: #a5b4fc;
    }

    /* Radio Model Selector Styles */
    .radio-inputs {
        position: relative;
        display: flex;
        flex-wrap: wrap;
        border-radius: 1rem;
        background-color: rgba(0, 0, 0, 0.03);
        box-shadow: 0 0 0px 1px rgba(0, 0, 0, 0.06);
        padding: 0.25rem;
        font-size: 14px;
    }
    :global(.dark) .radio-inputs {
        background-color: rgba(255, 255, 255, 0.05);
        box-shadow: 0 0 0px 1px rgba(255, 255, 255, 0.1);
    }

    .radio-inputs .radio {
        flex: 1 1 auto;
        text-align: center;
    }

    .radio-inputs .radio input {
        display: none;
    }

    .radio-inputs .radio .name {
        display: flex;
        cursor: pointer;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        border-radius: 0.75rem;
        border: none;
        padding: 0.625rem 1rem;
        color: #64748b;
        transition: all 0.15s ease-in-out;
    }
    :global(.dark) .radio-inputs .radio .name {
        color: #94a3b8;
    }

    .radio-inputs .radio input:checked + .name {
        background-color: #fff;
        color: #1a1a1a;
        font-weight: 600;
        position: relative;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        animation: radio-select 0.3s ease;
    }
    :global(.dark) .radio-inputs .radio input:checked + .name {
        background-color: rgba(255, 255, 255, 0.1);
        color: #ffffff;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .radio-inputs .radio:hover .name {
        background-color: rgba(255, 255, 255, 0.5);
    }
    :global(.dark) .radio-inputs .radio:hover .name {
        background-color: rgba(255, 255, 255, 0.08);
    }

    @keyframes radio-select {
        0% {
            transform: scale(0.95);
        }
        50% {
            transform: scale(1.05);
        }
        100% {
            transform: scale(1);
        }
    }

    /* Particles */
    .radio-inputs .radio input:checked + .name::before,
    .radio-inputs .radio input:checked + .name::after {
        content: "";
        position: absolute;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: #7c3aed;
        opacity: 0;
        animation: radio-particles 0.5s ease forwards;
    }
    :global(.dark) .radio-inputs .radio input:checked + .name::before,
    :global(.dark) .radio-inputs .radio input:checked + .name::after {
        background: #a5b4fc;
    }

    .radio-inputs .radio input:checked + .name::before {
        top: -8px;
        left: 50%;
        --direction: -10px;
    }

    .radio-inputs .radio input:checked + .name::after {
        bottom: -8px;
        left: 50%;
        --direction: 10px;
    }

    @keyframes radio-particles {
        0% {
            opacity: 0;
            transform: translateX(-50%) translateY(0);
        }
        50% {
            opacity: 1;
        }
        100% {
            opacity: 0;
            transform: translateX(-50%) translateY(var(--direction));
        }
    }

    /* Sparkle Button Styles */
    .sparkle-button {
        --black-700: hsla(0 0% 12% / 1);
        --border_radius: 9999px;
        --transtion: 0.3s ease-in-out;

        cursor: pointer;
        position: relative;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transform-origin: center;
        padding: 0.875rem 1.5rem;
        background-color: transparent;
        border: none;
        border-radius: var(--border_radius);
        transform: scale(calc(1 + (var(--active, 0) * 0.1)));
        transition: transform var(--transtion);
    }

    .sparkle-button:disabled {
        opacity: 0.4;
        cursor: not-allowed;
        --active: 0 !important;
    }

    .sparkle-button::before {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100%;
        height: 100%;
        background-color: var(--black-700);
        border-radius: var(--border_radius);
        box-shadow:
            inset 0 0.5px hsl(0, 0%, 100%),
            inset 0 -1px 2px 0 hsl(0, 0%, 0%),
            0px 4px 10px -4px hsla(0 0% 0% / calc(1 - var(--active, 0))),
            0 0 0 calc(var(--active, 0) * 0.375rem) hsl(260 97% 50% / 0.75);
        transition: all var(--transtion);
        z-index: 0;
    }

    .sparkle-button::after {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100%;
        height: 100%;
        background-color: hsla(260 97% 61% / 0.75);
        background-image: radial-gradient(
                at 51% 89%,
                hsla(266, 45%, 74%, 1) 0px,
                transparent 50%
            ),
            radial-gradient(
                at 100% 100%,
                hsla(266, 36%, 60%, 1) 0px,
                transparent 50%
            ),
            radial-gradient(
                at 22% 91%,
                hsla(266, 36%, 60%, 1) 0px,
                transparent 50%
            );
        background-position: top;
        opacity: var(--active, 0);
        border-radius: var(--border_radius);
        transition: opacity var(--transtion);
        z-index: 2;
    }

    .sparkle-button:is(:hover, :focus-visible):not(:disabled) {
        --active: 1;
    }
    .sparkle-button:active:not(:disabled) {
        transform: scale(1);
    }

    .sparkle-button .dots_border {
        --size_border: calc(100% + 2px);
        overflow: hidden;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: var(--size_border);
        height: var(--size_border);
        background-color: transparent;
        border-radius: var(--border_radius);
        z-index: -10;
    }

    .sparkle-button .dots_border::before {
        content: "";
        position: absolute;
        top: 30%;
        left: 50%;
        transform: rotate(0deg);
        transform-origin: left;
        width: 100%;
        height: 3rem;
        background: linear-gradient(90deg, #a855f7, #06b6d4, #a855f7);
        filter: blur(2px);
        opacity: 0.8;
        animation: sparkle-rotate 1.5s linear infinite;
    }

    @keyframes sparkle-rotate {
        to {
            transform: rotate(360deg);
        }
    }

    .sparkle-button .sparkle,
    .sparkle-button .sparkle-icon {
        position: relative;
        z-index: 10;
        width: 1.5rem;
        height: 1.5rem;
        color: hsl(0, 0%, 100%);
    }

    .sparkle-button:is(:hover, :focus):not(:disabled) .sparkle .path {
        animation: sparkle-path 1.5s linear 0.5s infinite;
    }

    .sparkle-button .sparkle .path:nth-child(1) {
        --scale_path_1: 1.2;
    }
    .sparkle-button .sparkle .path:nth-child(2) {
        --scale_path_2: 1.2;
    }
    .sparkle-button .sparkle .path:nth-child(3) {
        --scale_path_3: 1.2;
    }

    @keyframes sparkle-path {
        0%,
        34%,
        71%,
        100% {
            transform: scale(1);
        }
        17% {
            transform: scale(var(--scale_path_1, 1));
        }
        49% {
            transform: scale(var(--scale_path_2, 1));
        }
        83% {
            transform: scale(var(--scale_path_3, 1));
        }
    }

    .sparkle-button .text_button {
        position: relative;
        z-index: 10;
        background-image: linear-gradient(
            90deg,
            hsla(0 0% 100% / 1) 0%,
            hsla(0 0% 100% / var(--active, 0)) 120%
        );
        background-clip: text;
        -webkit-background-clip: text;
        font-size: 1rem;
        font-weight: 700;
        color: white;
    }
</style>
