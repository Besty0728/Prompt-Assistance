<script lang="ts">
    import { X, Trash2, RotateCcw, Clock, ChevronRight } from "lucide-svelte";
    import { fly, fade } from "svelte/transition";
    import { appState, type HistoryItem } from "../lib/state.svelte";
    import { translations } from "../lib/i18n";

    let { show = $bindable(false), onRestore } = $props<{
        show: boolean;
        onRestore: (item: HistoryItem) => void;
    }>();

    let t = $derived(translations[appState.settings.language]);

    // Get history for current target model
    let currentHistory = $derived(
        appState.settings.history[appState.settings.targetModel] || [],
    );

    // Sort by timestamp desc
    let sortedHistory = $derived(
        [...currentHistory].sort((a, b) => b.timestamp - a.timestamp),
    );

    function formatTime(timestamp: number) {
        return new Date(timestamp).toLocaleString(undefined, {
            month: "numeric",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function handleDelete(id: string) {
        const target = appState.settings.targetModel;
        appState.settings.history[target] = appState.settings.history[
            target
        ].filter((h) => h.id !== id);
    }

    function handleClearAll() {
        if (confirm(t.clearHistory + "?")) {
            const target = appState.settings.targetModel;
            appState.settings.history[target] = [];
        }
    }

    function handleRestore(item: HistoryItem) {
        onRestore(item);
        show = false;
    }
</script>

{#if show}
    <!-- Backdrop -->
    <div
        class="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-all duration-500"
        transition:fade={{ duration: 300 }}
        onclick={() => (show = false)}
        role="button"
        tabindex="0"
        onkeydown={(e) => e.key === "Escape" && (show = false)}
    ></div>

    <!-- Sidebar Drawer -->
    <div
        class="fixed top-0 left-0 h-full w-full max-w-[85vw] sm:max-w-sm sm:w-96 z-50 flex flex-col bg-white/80 dark:bg-[#121212]/80 backdrop-blur-2xl border-r border-white/20 dark:border-white/5 shadow-2xl"
        transition:fly={{ x: -100, duration: 400, opacity: 1 }}
        onclick={(e) => e.stopPropagation()}
    >
        <!-- Header -->
        <div
            class="shrink-0 h-20 px-6 flex items-center justify-between border-b border-black/5 dark:border-white/5"
        >
            <div>
                <h2
                    class="text-xl font-black text-neutral-800 dark:text-white tracking-tight"
                >
                    {t.history}
                </h2>
                <div class="flex items-center gap-1.5 mt-0.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                    <p
                        class="text-[10px] text-neutral-400 font-bold uppercase tracking-widest"
                    >
                        {appState.settings.targetModel}
                    </p>
                </div>
            </div>
            <button
                onclick={() => (show = false)}
                class="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all active:scale-95 text-neutral-400 hover:text-neutral-800 dark:hover:text-white"
            >
                <X class="size-5" />
            </button>
        </div>

        <!-- Content List -->
        <div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {#if sortedHistory.length === 0}
                <div
                    class="h-full flex flex-col items-center justify-center text-neutral-300 dark:text-neutral-700 gap-4"
                >
                    <Clock class="size-12 opacity-50" />
                    <p class="text-sm font-bold uppercase tracking-widest">
                        {t.noHistory}
                    </p>
                </div>
            {:else}
                <div class="space-y-3">
                    {#each sortedHistory as item (item.id)}
                        <div
                            class="group relative bg-white/40 dark:bg-white/5 border border-white/50 dark:border-white/5 rounded-2xl p-4 hover:bg-white/80 dark:hover:bg-white/10 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden pb-10"
                            role="button"
                            tabindex="0"
                            onclick={() => handleRestore(item)}
                            onkeydown={(e) =>
                                e.key === "Enter" && handleRestore(item)}
                        >
                            <!-- Hover Gradient border effect -->
                            <div
                                class="absolute inset-0 border-2 border-purple-500/0 group-hover:border-purple-500/10 rounded-2xl transition-all pointer-events-none"
                            ></div>

                            <!-- Header: Time -->
                            <div class="flex justify-between items-start mb-2">
                                <span
                                    class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-md"
                                >
                                    {formatTime(item.timestamp)}
                                </span>

                                <!-- Delete Button (Visible on Hover) -->
                                <button
                                    onclick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(item.id);
                                    }}
                                    class="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                    title={t.delete}
                                >
                                    <Trash2 class="size-3.5" />
                                </button>
                            </div>

                            <!-- Input Preview -->
                            <h4
                                class="text-xs font-semibold text-neutral-700 dark:text-neutral-200 line-clamp-2 mb-2 leading-relaxed"
                            >
                                {item.input}
                            </h4>

                            <!-- Output Preview -->
                            <p
                                class="text-[10px] text-neutral-500 dark:text-neutral-400 line-clamp-1 border-t border-black/5 dark:border-white/5 pt-2 mt-1 flex items-center gap-1"
                            >
                                <span
                                    class="bg-green-500/20 text-green-600 dark:text-green-400 px-1 rounded text-[9px] font-bold"
                                    >OUT</span
                                >
                                {item.output.slice(0, 50)}
                            </p>

                            <!-- Restore Action (Bottom Overlay) -->
                            <div
                                class="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-[#1e1e1e] to-transparent opacity-0 group-hover:opacity-100 flex items-end justify-center pb-2 transition-all"
                            >
                                <span
                                    class="text-[10px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 uppercase tracking-wider"
                                >
                                    <RotateCcw class="size-3" />
                                    {t.restore}
                                </span>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>

        <!-- Footer -->
        {#if sortedHistory.length > 0}
            <div
                class="shrink-0 p-4 border-t border-black/5 dark:border-white/5 bg-white/50 dark:bg-black/20 backdrop-blur-md"
            >
                <button
                    onclick={handleClearAll}
                    class="w-full py-3 rounded-xl border border-red-200 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                >
                    <Trash2 class="size-3.5" />
                    {t.clearHistory}
                </button>
            </div>
        {/if}
    </div>
{/if}

<style>
    /* Custom Scrollbar */
    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.05);
        border-radius: 99px;
    }
    :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background-color: rgba(124, 58, 237, 0.3);
    }
</style>
