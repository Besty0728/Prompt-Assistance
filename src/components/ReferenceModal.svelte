<script lang="ts">
    import { appState } from "../lib/state.svelte";
    import { translations } from "../lib/i18n";
    import { Upload } from "lucide-svelte";

    let { show = $bindable(false) } = $props();

    let newRefTitle = $state("");
    let newRefContent = $state("");
    let isDragging = $state(false);
    let fileInputRef: HTMLInputElement | null = $state(null);

    let t = $derived(translations[appState.settings.language]);

    function estimateTokens(text: string) {
        if (!text) return 0;
        const cjkRegex = /[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/g;
        const cjkMatch = text.match(cjkRegex);
        const cjkCount = cjkMatch ? cjkMatch.length : 0;
        const nonCjkText = text.replace(cjkRegex, " ");
        const wordCount = (nonCjkText.match(/[\w-]+/g) || []).length;
        return Math.floor(cjkCount + wordCount * 1.3);
    }

    function handleFileUpload(file: File) {
        if (!file) return;

        // Validate file type
        const validExtensions = [".txt", ".md", ".markdown"];
        const ext = file.name
            .toLowerCase()
            .substring(file.name.lastIndexOf("."));
        if (!validExtensions.includes(ext)) {
            return;
        }

        // Read file content
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            if (content) {
                // Use filename without extension as title
                const titleWithoutExt = file.name.replace(
                    /\.(txt|md|markdown)$/i,
                    "",
                );
                newRefTitle = titleWithoutExt;
                newRefContent = content;
            }
        };
        reader.readAsText(file);
    }

    function handleDrop(e: DragEvent) {
        e.preventDefault();
        isDragging = false;
        const file = e.dataTransfer?.files[0];
        if (file) handleFileUpload(file);
    }

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
        isDragging = true;
    }

    function handleDragLeave(e: DragEvent) {
        e.preventDefault();
        isDragging = false;
    }

    function handleFileInputChange(e: Event) {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) handleFileUpload(file);
    }

    function handleAdd() {
        if (!newRefTitle.trim() || !newRefContent.trim()) return;
        appState.settings.references.push({
            id: crypto.randomUUID(),
            title: newRefTitle.trim(),
            type: "text",
            content: newRefContent.trim(),
            targetId: appState.settings.targetModel,
            isCustom: true,
            enabled: true,
        });
        newRefTitle = "";
        newRefContent = "";
        show = false;
    }

    function handleClose() {
        newRefTitle = "";
        newRefContent = "";
        show = false;
    }
</script>

{#if show}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onclick={(e) => {
            if (e.target === e.currentTarget) handleClose();
        }}
        onkeydown={(e) => {
            if (e.key === "Escape") handleClose();
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
                    onclick={handleClose}
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
                <!-- File Upload Drop Zone -->
                <div
                    class="relative border-2 border-dashed rounded-xl p-4 transition-all cursor-pointer {isDragging
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-neutral-300 dark:border-neutral-700 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-500/5'}"
                    ondrop={handleDrop}
                    ondragover={handleDragOver}
                    ondragleave={handleDragLeave}
                    onclick={() => fileInputRef?.click()}
                    onkeydown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                            fileInputRef?.click();
                    }}
                    role="button"
                    tabindex="0"
                >
                    <input
                        type="file"
                        accept=".txt,.md,.markdown"
                        class="hidden"
                        bind:this={fileInputRef}
                        onchange={handleFileInputChange}
                    />
                    <div
                        class="flex flex-col items-center justify-center gap-2 py-2"
                    >
                        <Upload
                            class="size-6 text-neutral-400 dark:text-neutral-500"
                        />
                        <p
                            class="text-sm text-neutral-500 dark:text-neutral-400 text-center"
                        >
                            {appState.settings.language === "zh"
                                ? "点击或拖拽文件到此处上传"
                                : "Click or drag file to upload"}
                        </p>
                        <p
                            class="text-xs text-neutral-400 dark:text-neutral-500"
                        >
                            {appState.settings.language === "zh"
                                ? "支持 .txt, .md 格式"
                                : "Supports .txt, .md files"}
                        </p>
                    </div>
                </div>

                <div>
                    <label
                        class="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2"
                    >
                        {t.refTitle}
                    </label>
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
                    >
                        {t.refContent}
                    </label>
                    <textarea
                        bind:value={newRefContent}
                        placeholder="Paste your reference content here (Markdown or plain text)..."
                        rows="10"
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
                    onclick={handleClose}
                >
                    {appState.settings.language === "zh" ? "取消" : "Cancel"}
                </button>
                <button
                    class="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 rounded-xl shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!newRefTitle.trim() || !newRefContent.trim()}
                    onclick={handleAdd}
                >
                    {appState.settings.language === "zh" ? "添加" : "Add"}
                </button>
            </div>
        </div>
    </div>
{/if}
