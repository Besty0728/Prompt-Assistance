<script lang="ts">
    import { appState, type AppSettings } from "../lib/state.svelte";
    import { translations } from "../lib/i18n";
    import { deepClone } from "../lib/utils";
    import {
        X,
        Eye,
        EyeOff,
        Save,
        Globe,
        Sun,
        Moon,
        Sparkles,
        Cpu,
        Bot,
        Zap,
        Command,
    } from "lucide-svelte";
    import { fade, fly, scale } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import openaiIcon from "../assets/icons/openai-2.svg";
    import anthropicIcon from "../assets/icons/claude-color.svg";
    import geminiIcon from "../assets/icons/gemini-color.svg";
    import { Upload, RefreshCw, ChevronDown } from "lucide-svelte";

    let { onClose } = $props();

    // Create temporary state for editing using TRUE DEEP CLONE
    // This prevents nested object mutations from leaking to global state before save
    let settings = $state<AppSettings>(
        deepClone($state.snapshot(appState.settings)),
    );

    let showKey = $state<Record<string, boolean>>({});
    let isFetching = $state(false);
    let showModelDropdown = $state(false);
    let showSuffixDropdown = $state(false);

    let testResults = $state<
        Record<
            string,
            {
                status: "idle" | "testing" | "success" | "error";
                message?: string;
            }
        >
    >({
        openai: { status: "idle" },
        anthropic: { status: "idle" },
        gemini: { status: "idle" },
        custom: { status: "idle" },
    });

    async function testConnection(provider: keyof typeof testResults) {
        testResults[provider] = { status: "testing" };
        try {
            if (provider === "openai" || provider === "custom") {
                const baseUrl = (
                    settings.baseUrls[provider] ||
                    (provider === "openai" ? "https://api.openai.com/v1" : "")
                ).replace(/\/$/, "");

                let url = baseUrl;
                if (settings.useEndpointSuffixes[provider]) {
                    const suffix =
                        settings.endpointSuffixes[provider] || "/models";
                    url = baseUrl.endsWith(suffix)
                        ? baseUrl
                        : `${baseUrl}${suffix.startsWith("/") ? "" : "/"}${suffix}`;
                } else {
                    url = `${baseUrl}/models`;
                }

                const key =
                    provider === "openai"
                        ? settings.openaiKey
                        : settings.customKey;

                const res = await fetch(url, {
                    headers: key ? { Authorization: `Bearer ${key}` } : {},
                });
                if (res.ok) {
                    testResults[provider] = { status: "success" };
                } else {
                    const txt = await res.text();
                    testResults[provider] = {
                        status: "error",
                        message: `HTTP ${res.status}: ${txt.slice(0, 50)}...`,
                    };
                }
            } else if (provider === "gemini") {
                const baseUrl = settings.baseUrls.gemini.replace(/\/$/, "");
                const url = `${baseUrl}/models?key=${settings.geminiKey}`;
                const res = await fetch(url);
                if (res.ok) {
                    testResults[provider] = { status: "success" };
                } else {
                    testResults[provider] = {
                        status: "error",
                        message: `HTTP ${res.status}`,
                    };
                }
            } else if (provider === "anthropic") {
                const baseUrl = settings.baseUrls.anthropic.replace(/\/$/, "");
                let url = baseUrl;
                if (settings.useEndpointSuffixes.anthropic) {
                    const suffix =
                        settings.endpointSuffixes.anthropic || "/messages";
                    url = baseUrl.endsWith(suffix)
                        ? baseUrl
                        : `${baseUrl}${suffix.startsWith("/") ? "" : "/"}${suffix}`;
                }

                const res = await fetch(url, {
                    method: "POST",
                    headers: {
                        "x-api-key": settings.anthropicKey,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json",
                    },
                    body: JSON.stringify({
                        model: settings.models.anthropic,
                        max_tokens: 1,
                        messages: [{ role: "user", content: "ping" }],
                    }),
                });
                // Anthropic will return 200 even for max_tokens: 1
                if (res.ok) {
                    testResults[provider] = { status: "success" };
                } else {
                    const txt = await res.text();
                    testResults[provider] = {
                        status: "error",
                        message: `HTTP ${res.status}: ${txt.slice(0, 50)}...`,
                    };
                }
            }
        } catch (e: any) {
            testResults[provider] = { status: "error", message: e.message };
        }
    }

    function toggleKey(provider: string) {
        showKey[provider] = !showKey[provider];
    }

    function clickOutside(
        node: HTMLElement,
        { enabled, callback }: { enabled: boolean; callback: () => void },
    ) {
        const handleClick = (e: MouseEvent) => {
            if (
                enabled &&
                node &&
                !node.contains(e.target as Node) &&
                !e.defaultPrevented
            ) {
                callback();
            }
        };

        document.addEventListener("click", handleClick, true);

        return {
            update({ enabled: newEnabled }: { enabled: boolean }) {
                enabled = newEnabled;
            },
            destroy() {
                document.removeEventListener("click", handleClick, true);
            },
        };
    }

    function selectSuffix(provider: string, suffix: string) {
        if (settings.endpointSuffixes) {
            (settings.endpointSuffixes as any)[provider] = suffix;
        }
        showSuffixDropdown = false;
    }

    const commonSuffixes: Record<string, string[]> = {
        openai: [
            "/v1/chat/completions",
            "/chat/completions",
            "/v1/completions",
            "/completions",
            "/v1/responses",
            "/responses",
        ],
        anthropic: ["/v1/messages", "/messages"],
        gemini: [":streamGenerateContent", ":generateContent"],
        custom: [
            "/v1/chat/completions",
            "/chat/completions",
            "/v1/messages",
            "/messages",
        ],
    };

    async function fetchModels(
        provider: "openai" | "anthropic" | "gemini" | "custom",
    ) {
        isFetching = true;
        showModelDropdown = false;

        try {
            let url = "";
            let headers: Record<string, string> = {};

            if (provider === "openai" || provider === "custom") {
                const baseUrl =
                    settings.baseUrls[provider] ||
                    (provider === "openai" ? "https://api.openai.com/v1" : "");
                const apiKey =
                    provider === "openai"
                        ? settings.openaiKey
                        : settings.customKey;

                url = `${baseUrl}/models`;
                // Allow fetch without APi Key if baseUrl is present (for local proxies)
                if (apiKey) {
                    headers["Authorization"] = `Bearer ${apiKey}`;
                }
            } else if (provider === "gemini") {
                const baseUrl = settings.baseUrls.gemini;
                const apiKey = settings.geminiKey;
                url = `${baseUrl}/models`;
                if (apiKey) {
                    url += `?key=${apiKey}`;
                }
            }

            if (!url) throw new Error("Invalid configuration");

            const res = await fetch(url, { headers });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();
            let newModels: { id: string; name: string }[] = [];

            if (provider === "gemini") {
                if (data.models) {
                    newModels = data.models.map((m: any) => ({
                        id: m.name.split("/").pop() ?? m.name,
                        name: m.displayName || m.name,
                    }));
                }
            } else {
                if (data.data) {
                    newModels = data.data
                        .map((m: any) => ({
                            id: m.id,
                            name: m.id,
                        }))
                        .sort((a: { id: string }, b: { id: string }) =>
                            a.id.localeCompare(b.id),
                        );
                }
            }

            if (newModels.length > 0) {
                // Update local settings only (will persist on save)
                if (provider === "openai")
                    settings.availableModels.openai = newModels;
                if (provider === "gemini")
                    settings.availableModels.gemini = newModels;
                if (provider === "custom")
                    settings.availableModels.custom = newModels;

                showModelDropdown = true;
            }
        } catch (e) {
            console.error("Failed to fetch models", e);
            // Optionally show error toast
        } finally {
            isFetching = false;
        }
    }

    function selectModel(provider: string, modelId: string) {
        if (provider === "openai") settings.models.openai = modelId;
        if (provider === "anthropic") settings.models.anthropic = modelId;
        if (provider === "gemini") settings.models.gemini = modelId;
        if (provider === "custom") settings.models.custom = modelId;
        showModelDropdown = false;
    }

    function handleIconUpload(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                settings.customIcon = result;
            };
            reader.readAsDataURL(input.files[0]);
        }
    }

    function save() {
        // Atomic update: replace entire appState.settings with our local copy
        appState.settings = deepClone(settings);
        onClose();
    }

    let t = $derived(translations[settings.language]);

    const providers: {
        id: "openai" | "anthropic" | "gemini" | "custom";
        name: string;
        icon: any;
        color: string;
        isSvg: boolean;
    }[] = [
        {
            id: "openai",
            name: "OpenAI",
            icon: openaiIcon,
            color: "from-green-400 to-emerald-600",
            isSvg: true,
        },
        {
            id: "anthropic",
            name: "Anthropic",
            icon: anthropicIcon,
            color: "from-orange-400 to-red-600",
            isSvg: true,
        },
        {
            id: "gemini",
            name: "Gemini",
            icon: geminiIcon,
            color: "from-blue-400 to-indigo-600",
            isSvg: true,
        },
        {
            id: "custom",
            name: "Custom",
            icon: Command,
            color: "from-purple-400 to-pink-600",
            isSvg: false,
        },
    ];
</script>

<div
    class="flex flex-col h-full bg-neutral-50/50 dark:bg-[#0a0a0a]/50 text-neutral-900 dark:text-neutral-100 transition-colors duration-500 backdrop-blur-3xl"
    in:fade={{ duration: 300 }}
    out:fade={{ duration: 200 }}
>
    <!-- Settings Header -->
    <div
        class="flex items-center justify-between px-10 py-6 border-b border-white/20 dark:border-white/5 shrink-0 bg-white/40 dark:bg-black/20 backdrop-blur-xl z-20"
    >
        <div class="flex flex-col gap-1">
            <h2
                class="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-neutral-800 to-neutral-600 dark:from-white dark:to-neutral-400"
            >
                {t.settings}
            </h2>
            <span
                class="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400/80 dark:text-neutral-500"
                >Configuration</span
            >
        </div>
        <div class="flex items-center gap-4">
            <!-- Theme Toggle -->
            <button
                onclick={() => {
                    const newTheme =
                        appState.settings.theme === "dark" ? "light" : "dark";
                    appState.settings.theme = newTheme;
                    settings.theme = newTheme;
                }}
                class="group relative w-12 h-12 flex items-center justify-center rounded-xl bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border-2 border-neutral-200 dark:border-white/10 shadow-sm transition-all duration-300 hover:scale-105 active:scale-95"
            >
                <div
                    class="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-200/50 to-orange-200/50 dark:from-indigo-500/20 dark:to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                ></div>
                {#if settings.theme === "dark"}
                    <Sun
                        class="size-5 text-neutral-400 group-hover:text-amber-400 transition-colors"
                    />
                {:else}
                    <Moon
                        class="size-5 text-neutral-500 group-hover:text-indigo-500 transition-colors"
                    />
                {/if}
            </button>

            <!-- Language Toggle -->
            <button
                onclick={() => {
                    const newLang =
                        appState.settings.language === "zh" ? "en" : "zh";
                    appState.settings.language = newLang;
                    settings.language = newLang;
                }}
                class="group relative w-12 h-12 flex items-center justify-center rounded-xl bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border-2 border-neutral-200 dark:border-white/10 shadow-sm transition-all duration-300 hover:scale-105 active:scale-95"
            >
                <div
                    class="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-200/50 to-cyan-200/50 dark:from-blue-500/20 dark:to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                ></div>
                <Globe
                    class="size-5 text-neutral-500 dark:text-neutral-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors"
                />
                <span
                    class="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-neutral-900 dark:bg-white text-[8px] font-bold text-white dark:text-black shadow-sm"
                >
                    {settings.language === "zh" ? "中" : "En"}
                </span>
            </button>

            <div class="w-px h-8 bg-neutral-200 dark:bg-white/10 mx-2"></div>

            <button
                onclick={onClose}
                class="relative border-2 border-neutral-200 dark:border-white/10 group hover:border-red-500 w-12 h-12 duration-500 overflow-hidden rounded-xl"
                type="button"
            >
                <p
                    class="font-sans text-3xl h-full w-full flex items-center justify-center text-neutral-500 dark:text-neutral-400 duration-500 relative z-10 group-hover:scale-0 pb-1"
                >
                    ×
                </p>
                <!-- Shutter Spans - Exact positioning from user snippet -->
                <span
                    class="absolute w-full h-full bg-red-500 rotate-45 group-hover:top-9 duration-500 top-12 left-0"
                ></span>
                <span
                    class="absolute w-full h-full bg-red-500 rotate-45 top-0 group-hover:left-9 duration-500 left-12"
                ></span>
                <span
                    class="absolute w-full h-full bg-red-500 rotate-45 top-0 group-hover:right-9 duration-500 right-12"
                ></span>
                <span
                    class="absolute w-full h-full bg-red-500 rotate-45 group-hover:bottom-9 duration-500 bottom-12 right-0"
                ></span>
            </button>
        </div>
    </div>

    <!-- Settings Body -->
    <div
        class="p-6 md:p-10 overflow-y-auto flex-1 custom-scrollbar scroll-smooth space-y-10"
    >
        <!-- Provider Selection Cards -->
        <section class="space-y-4">
            <div class="flex items-center justify-between">
                <span
                    class="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest pl-1"
                    >{t.providerTitle}</span
                >
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                {#each providers as p, i}
                    <button
                        onclick={() => {
                            settings.provider = p.id as any;
                        }}
                        class="group relative flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border transition-all duration-300 {settings.provider ===
                        p.id
                            ? 'bg-white dark:bg-white/10 border-black/5 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] scale-[1.02]'
                            : 'bg-white/40 dark:bg-white/5 border-transparent hover:bg-white/60 dark:hover:bg-white/10 hover:border-black/5 dark:hover:border-white/5 hover:scale-[1.01]'}"
                        in:fly={{ y: 20, duration: 400, delay: i * 50 }}
                    >
                        {#if settings.provider === p.id}
                            <div
                                class="absolute inset-0 rounded-3xl bg-gradient-to-br {p.color} opacity-[0.03] dark:opacity-[0.1]"
                                in:fade={{ duration: 300 }}
                            ></div>
                            <div class="absolute top-3 right-3 flex size-2">
                                <span
                                    class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
                                ></span>
                                <span
                                    class="relative inline-flex rounded-full size-2 bg-green-500"
                                ></span>
                            </div>
                        {/if}

                        <div
                            class="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10 group-hover:scale-110 transition-transform duration-300"
                        >
                            {#if p.isSvg}
                                <img src={p.icon} alt={p.name} class="size-6" />
                            {:else if settings.customIcon && p.id === "custom"}
                                <img
                                    src={settings.customIcon}
                                    alt="Custom"
                                    class="size-8 rounded-full bg-white/10 p-0.5 object-cover"
                                />
                            {:else}
                                <p.icon
                                    class="size-6 text-neutral-600 dark:text-neutral-300"
                                />
                            {/if}
                        </div>
                        <span
                            class="text-sm font-bold {settings.provider === p.id
                                ? 'text-neutral-900 dark:text-white'
                                : 'text-neutral-600 dark:text-neutral-500'}"
                        >
                            {p.name}
                        </span>
                    </button>
                {/each}
            </div>
        </section>

        <!-- Configuration Section -->
        <section
            class="space-y-6 pt-6 border-t border-dashed border-neutral-200 dark:border-white/10"
            in:fly={{ y: 20, duration: 400, delay: 300 }}
        >
            <div class="flex items-center gap-3 pl-1">
                <div
                    class="flex size-6 items-center justify-center rounded-lg bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-neutral-400"
                >
                    <Cpu class="size-3.5" />
                </div>
                <h3
                    class="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-widest"
                >
                    {t.apiKeys} & {t.modelName}
                </h3>
            </div>

            <div
                class="relative bg-white/60 dark:bg-[#151515] backdrop-blur-md rounded-[32px] border border-white/40 dark:border-white/5 shadow-xl p-1"
            >
                <!-- Inner Glow -->
                <div
                    class="absolute inset-0 overflow-hidden rounded-[32px] pointer-events-none"
                >
                    <div
                        class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-blue-500/10 dark:from-purple-500/5 dark:to-blue-500/5 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3"
                    ></div>
                </div>

                <div class="p-6 md:p-8 space-y-6">
                    {#if settings.provider === "openai"}
                        <div
                            class="space-y-5"
                            in:fly={{ y: 10, duration: 300 }}
                        >
                            <div class="group relative">
                                <div
                                    class="flex items-center justify-between pl-1 mb-1.5"
                                >
                                    <label
                                        for="openai-key"
                                        class="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest transition-colors group-focus-within:text-purple-600"
                                        >API Key</label
                                    >
                                    <div class="flex items-center gap-2">
                                        {#if testResults.openai.status !== "idle"}
                                            <span
                                                class="text-[9px] font-bold uppercase tracking-wider {testResults
                                                    .openai.status === 'success'
                                                    ? 'text-green-500'
                                                    : testResults.openai
                                                            .status === 'error'
                                                      ? 'text-red-500'
                                                      : 'text-neutral-400'}"
                                            >
                                                {testResults.openai.status ===
                                                "testing"
                                                    ? t.testing
                                                    : testResults.openai
                                                            .status ===
                                                        "success"
                                                      ? t.connectionSuccess
                                                      : t.connectionFailed}
                                            </span>
                                        {/if}
                                        <button
                                            onclick={() =>
                                                testConnection("openai")}
                                            disabled={testResults.openai
                                                .status === "testing"}
                                            class="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 transition-all"
                                        >
                                            {t.testConnection}
                                        </button>
                                    </div>
                                </div>
                                <div class="relative">
                                    <input
                                        id="openai-key"
                                        type={showKey["openai"]
                                            ? "text"
                                            : "password"}
                                        bind:value={settings.openaiKey}
                                        placeholder="sk-..."
                                        class="w-full bg-neutral-100 dark:bg-black/40 border border-transparent focus:border-purple-500/30 focus:bg-white dark:focus:bg-black/60 rounded-2xl py-3.5 pl-5 pr-12 text-sm font-bold text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-4 focus:ring-purple-500/10 transition-all duration-300"
                                    />
                                    <button
                                        onclick={() => toggleKey("openai")}
                                        class="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10 transition-all"
                                    >
                                        {#if showKey["openai"]}<EyeOff
                                                class="size-4"
                                            />{:else}<Eye class="size-4" />{/if}
                                    </button>
                                </div>
                            </div>
                            <div class="grid md:grid-cols-2 gap-5">
                                <div class="group">
                                    <label
                                        for="openai-base-url"
                                        class="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5 ml-1 transition-colors group-focus-within:text-blue-600"
                                        >Base URL</label
                                    >
                                    <input
                                        id="openai-base-url"
                                        type="text"
                                        bind:value={settings.baseUrls.openai}
                                        placeholder="https://api.openai.com/v1"
                                        class="w-full bg-neutral-100 dark:bg-black/40 border border-transparent focus:border-blue-500/30 focus:bg-white dark:focus:bg-black/60 rounded-2xl py-3.5 px-5 text-sm font-mono font-medium text-blue-600 dark:text-blue-400 placeholder-neutral-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
                                    />
                                </div>
                                <div class="group">
                                    <label
                                        for="openai-model"
                                        class="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5 ml-1 transition-colors group-focus-within:text-purple-600"
                                        >{t.modelName}</label
                                    >
                                    <div
                                        class="relative w-full"
                                        use:clickOutside={{
                                            enabled: showModelDropdown,
                                            callback: () =>
                                                (showModelDropdown = false),
                                        }}
                                    >
                                        <input
                                            id="openai-model"
                                            type="text"
                                            bind:value={settings.models.openai}
                                            placeholder="gpt-4o"
                                            class="w-full bg-neutral-100 dark:bg-black/40 border border-transparent focus:border-purple-500/30 focus:bg-white dark:focus:bg-black/60 rounded-2xl py-3.5 pl-5 pr-10 text-sm font-mono font-medium text-purple-600 dark:text-purple-400 placeholder-neutral-400 focus:outline-none focus:ring-4 focus:ring-purple-500/10 transition-all duration-300"
                                            onfocus={() => {
                                                if (
                                                    settings.availableModels
                                                        .openai.length > 0
                                                )
                                                    showModelDropdown = true;
                                            }}
                                        />
                                        <button
                                            onclick={() =>
                                                fetchModels("openai")}
                                            class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-neutral-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={isFetching}
                                            title="Fetch Models"
                                        >
                                            <RefreshCw
                                                class="size-4 {isFetching
                                                    ? 'animate-spin'
                                                    : ''}"
                                            />
                                        </button>
                                        {#if showModelDropdown && settings.provider === "openai" && settings.availableModels.openai.length > 0}
                                            <div
                                                class="absolute top-full mt-2 w-full max-h-60 overflow-y-auto bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-neutral-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 p-1 flex flex-col gap-0.5 custom-scrollbar"
                                                in:fly={{
                                                    y: 10,
                                                    duration: 200,
                                                }}
                                            >
                                                {#each settings.availableModels.openai as model}
                                                    <button
                                                        class="text-left w-full px-3 py-2.5 rounded-xl text-xs font-mono text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/10 hover:text-purple-600 dark:hover:text-purple-400 transition-colors break-all whitespace-normal leading-relaxed"
                                                        onclick={() =>
                                                            selectModel(
                                                                "openai",
                                                                model.id,
                                                            )}
                                                    >
                                                        {model.name}
                                                    </button>
                                                {/each}
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                            </div>

                            <div class="group relative">
                                <div
                                    class="flex items-center justify-between pl-1 mb-1.5"
                                >
                                    <label
                                        for="openai-suffix"
                                        class="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest transition-colors group-focus-within:text-purple-600"
                                        >{t.endpointSuffix}</label
                                    >
                                    <label
                                        class="relative inline-flex items-center cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            bind:checked={
                                                settings.useEndpointSuffixes
                                                    .openai
                                            }
                                            class="sr-only peer"
                                        />
                                        <div
                                            class="w-7 h-4 bg-neutral-200 dark:bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-600"
                                        ></div>
                                        <span
                                            class="ml-2 text-[9px] font-bold text-neutral-500 uppercase tracking-widest leading-none"
                                            >{t.enableSuffix}</span
                                        >
                                    </label>
                                </div>
                                <div
                                    class="relative w-full"
                                    use:clickOutside={{
                                        enabled: showSuffixDropdown,
                                        callback: () =>
                                            (showSuffixDropdown = false),
                                    }}
                                >
                                    <input
                                        id="openai-suffix"
                                        type="text"
                                        bind:value={
                                            settings.endpointSuffixes.openai
                                        }
                                        disabled={!settings.useEndpointSuffixes
                                            .openai}
                                        placeholder="/chat/completions"
                                        class="w-full bg-neutral-100 dark:bg-black/40 border border-transparent focus:border-purple-500/30 focus:bg-white dark:focus:bg-black/60 rounded-2xl py-3.5 pl-5 pr-10 text-sm font-mono font-medium text-purple-600 dark:text-purple-400 placeholder-neutral-400 focus:outline-none focus:ring-4 focus:ring-purple-500/10 transition-all duration-300 disabled:opacity-50"
                                        onfocus={() =>
                                            (showSuffixDropdown = true)}
                                    />
                                    <button
                                        class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-neutral-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
                                        onclick={() =>
                                            (showSuffixDropdown =
                                                !showSuffixDropdown)}
                                    >
                                        <ChevronDown class="size-4" />
                                    </button>
                                    {#if showSuffixDropdown && settings.provider === "openai"}
                                        <div
                                            class="absolute top-full mt-2 w-full max-h-60 overflow-y-auto bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-neutral-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 p-1 flex flex-col gap-0.5 custom-scrollbar"
                                            in:fly={{
                                                y: 10,
                                                duration: 200,
                                            }}
                                        >
                                            {#each commonSuffixes.openai as suffix}
                                                <button
                                                    class="text-left w-full px-3 py-2.5 rounded-xl text-xs font-mono text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/10 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                                                    onclick={() =>
                                                        selectSuffix(
                                                            "openai",
                                                            suffix,
                                                        )}
                                                >
                                                    {suffix}
                                                </button>
                                            {/each}
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    {:else if settings.provider === "anthropic"}
                        <div
                            class="space-y-5"
                            in:fly={{ y: 10, duration: 300 }}
                        >
                            <div class="group relative">
                                <div
                                    class="flex items-center justify-between pl-1 mb-1.5"
                                >
                                    <label
                                        for="anthropic-key"
                                        class="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest transition-colors group-focus-within:text-orange-600"
                                        >API Key</label
                                    >
                                    <div class="flex items-center gap-2">
                                        {#if testResults.anthropic.status !== "idle"}
                                            <span
                                                class="text-[9px] font-bold uppercase tracking-wider {testResults
                                                    .anthropic.status ===
                                                'success'
                                                    ? 'text-green-500'
                                                    : testResults.anthropic
                                                            .status === 'error'
                                                      ? 'text-red-500'
                                                      : 'text-neutral-400'}"
                                            >
                                                {testResults.anthropic
                                                    .status === "testing"
                                                    ? t.testing
                                                    : testResults.anthropic
                                                            .status ===
                                                        "success"
                                                      ? t.connectionSuccess
                                                      : t.connectionFailed}
                                            </span>
                                        {/if}
                                        <button
                                            onclick={() =>
                                                testConnection("anthropic")}
                                            disabled={testResults.anthropic
                                                .status === "testing"}
                                            class="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 transition-all"
                                        >
                                            {t.testConnection}
                                        </button>
                                    </div>
                                </div>
                                <div class="relative">
                                    <input
                                        id="anthropic-key"
                                        type={showKey["anthropic"]
                                            ? "text"
                                            : "password"}
                                        bind:value={settings.anthropicKey}
                                        placeholder="sk-ant-..."
                                        class="w-full bg-neutral-100 dark:bg-black/40 border border-transparent focus:border-orange-500/30 focus:bg-white dark:focus:bg-black/60 rounded-2xl py-3.5 pl-5 pr-12 text-sm font-bold text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all duration-300"
                                    />
                                    <button
                                        onclick={() => toggleKey("anthropic")}
                                        class="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10 transition-all"
                                    >
                                        {#if showKey["anthropic"]}<EyeOff
                                                class="size-4"
                                            />{:else}<Eye class="size-4" />{/if}
                                    </button>
                                </div>
                            </div>
                            <div class="grid md:grid-cols-2 gap-5">
                                <div class="group">
                                    <label
                                        for="anthropic-base-url"
                                        class="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5 ml-1 transition-colors group-focus-within:text-blue-600"
                                        >Base URL</label
                                    >
                                    <input
                                        id="anthropic-base-url"
                                        type="text"
                                        bind:value={settings.baseUrls.anthropic}
                                        placeholder="https://api.anthropic.com/v1"
                                        class="w-full bg-neutral-100 dark:bg-black/40 border border-transparent focus:border-blue-500/30 focus:bg-white dark:focus:bg-black/60 rounded-2xl py-3.5 px-5 text-sm font-mono font-medium text-blue-600 dark:text-blue-400 placeholder-neutral-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
                                    />
                                </div>
                                <div class="group">
                                    <label
                                        for="anthropic-model"
                                        class="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5 ml-1 transition-colors group-focus-within:text-orange-600"
                                        >{t.modelName}</label
                                    >
                                    <div
                                        class="relative w-full"
                                        use:clickOutside={{
                                            enabled: showModelDropdown,
                                            callback: () =>
                                                (showModelDropdown = false),
                                        }}
                                    >
                                        <input
                                            id="anthropic-model"
                                            type="text"
                                            bind:value={
                                                settings.models.anthropic
                                            }
                                            placeholder="claude-3-5-sonnet-latest"
                                            class="w-full bg-neutral-100 dark:bg-black/40 border border-transparent focus:border-orange-500/30 focus:bg-white dark:focus:bg-black/60 rounded-2xl py-3.5 pl-5 pr-10 text-sm font-mono font-medium text-orange-600 dark:text-orange-400 placeholder-neutral-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all duration-300"
                                            onfocus={() => {
                                                if (
                                                    settings.availableModels
                                                        .anthropic.length > 0
                                                )
                                                    showModelDropdown = true;
                                            }}
                                        />
                                        <button
                                            onclick={() =>
                                                fetchModels("anthropic")}
                                            class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-neutral-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={isFetching}
                                            title="Fetch Models"
                                        >
                                            <RefreshCw
                                                class="size-4 {isFetching
                                                    ? 'animate-spin'
                                                    : ''}"
                                            />
                                        </button>
                                        {#if showModelDropdown && settings.provider === "anthropic" && settings.availableModels.anthropic.length > 0}
                                            <div
                                                class="absolute top-full mt-2 w-full max-h-60 overflow-y-auto bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-neutral-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 p-1 flex flex-col gap-0.5 custom-scrollbar"
                                                in:fly={{
                                                    y: 10,
                                                    duration: 200,
                                                }}
                                            >
                                                {#each settings.availableModels.anthropic as model}
                                                    <button
                                                        class="text-left w-full px-3 py-2.5 rounded-xl text-xs font-mono text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/10 hover:text-orange-600 dark:hover:text-orange-400 transition-colors break-all whitespace-normal leading-relaxed"
                                                        onclick={() =>
                                                            selectModel(
                                                                "anthropic",
                                                                model.id,
                                                            )}
                                                    >
                                                        {model.name}
                                                    </button>
                                                {/each}
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                            </div>

                            <div class="group relative">
                                <div
                                    class="flex items-center justify-between pl-1 mb-1.5"
                                >
                                    <label
                                        for="anthropic-suffix"
                                        class="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest transition-colors group-focus-within:text-orange-600"
                                        >{t.endpointSuffix}</label
                                    >
                                    <label
                                        class="relative inline-flex items-center cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            bind:checked={
                                                settings.useEndpointSuffixes
                                                    .anthropic
                                            }
                                            class="sr-only peer"
                                        />
                                        <div
                                            class="w-7 h-4 bg-neutral-200 dark:bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-orange-600"
                                        ></div>
                                        <span
                                            class="ml-2 text-[9px] font-bold text-neutral-500 uppercase tracking-widest leading-none"
                                            >{t.enableSuffix}</span
                                        >
                                    </label>
                                </div>
                                <div
                                    class="relative w-full"
                                    use:clickOutside={{
                                        enabled: showSuffixDropdown,
                                        callback: () =>
                                            (showSuffixDropdown = false),
                                    }}
                                >
                                    <input
                                        id="anthropic-suffix"
                                        type="text"
                                        bind:value={
                                            settings.endpointSuffixes.anthropic
                                        }
                                        disabled={!settings.useEndpointSuffixes
                                            .anthropic}
                                        placeholder="/messages"
                                        class="w-full bg-neutral-100 dark:bg-black/40 border border-transparent focus:border-orange-500/30 focus:bg-white dark:focus:bg-black/60 rounded-2xl py-3.5 pl-5 pr-10 text-sm font-mono font-medium text-orange-600 dark:text-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all duration-300 disabled:opacity-50"
                                        onfocus={() =>
                                            (showSuffixDropdown = true)}
                                    />
                                    <button
                                        class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-neutral-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all"
                                        onclick={() =>
                                            (showSuffixDropdown =
                                                !showSuffixDropdown)}
                                    >
                                        <ChevronDown class="size-4" />
                                    </button>
                                    {#if showSuffixDropdown && settings.provider === "anthropic"}
                                        <div
                                            class="absolute top-full mt-2 w-full max-h-60 overflow-y-auto bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-neutral-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 p-1 flex flex-col gap-0.5 custom-scrollbar"
                                            in:fly={{
                                                y: 10,
                                                duration: 200,
                                            }}
                                        >
                                            {#each commonSuffixes.anthropic as suffix}
                                                <button
                                                    class="text-left w-full px-3 py-2.5 rounded-xl text-xs font-mono text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/10 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                                                    onclick={() =>
                                                        selectSuffix(
                                                            "anthropic",
                                                            suffix,
                                                        )}
                                                >
                                                    {suffix}
                                                </button>
                                            {/each}
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    {:else if settings.provider === "gemini"}
                        <div
                            class="space-y-5"
                            in:fly={{ y: 10, duration: 300 }}
                        >
                            <div class="group relative">
                                <div
                                    class="flex items-center justify-between pl-1 mb-1.5"
                                >
                                    <label
                                        for="gemini-key"
                                        class="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest transition-colors group-focus-within:text-blue-600"
                                        >API Key</label
                                    >
                                    <div class="flex items-center gap-2">
                                        {#if testResults.gemini.status !== "idle"}
                                            <span
                                                class="text-[9px] font-bold uppercase tracking-wider {testResults
                                                    .gemini.status === 'success'
                                                    ? 'text-green-500'
                                                    : testResults.gemini
                                                            .status === 'error'
                                                      ? 'text-red-500'
                                                      : 'text-neutral-400'}"
                                            >
                                                {testResults.gemini.status ===
                                                "testing"
                                                    ? t.testing
                                                    : testResults.gemini
                                                            .status ===
                                                        "success"
                                                      ? t.connectionSuccess
                                                      : t.connectionFailed}
                                            </span>
                                        {/if}
                                        <button
                                            onclick={() =>
                                                testConnection("gemini")}
                                            disabled={testResults.gemini
                                                .status === "testing"}
                                            class="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-all"
                                        >
                                            {t.testConnection}
                                        </button>
                                    </div>
                                </div>
                                <div class="relative">
                                    <input
                                        id="gemini-key"
                                        type={showKey["gemini"]
                                            ? "text"
                                            : "password"}
                                        bind:value={settings.geminiKey}
                                        placeholder="AIza..."
                                        class="w-full bg-neutral-100 dark:bg-black/40 border border-transparent focus:border-blue-500/30 focus:bg-white dark:focus:bg-black/60 rounded-2xl py-3.5 pl-5 pr-12 text-sm font-bold text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
                                    />
                                    <button
                                        onclick={() => toggleKey("gemini")}
                                        class="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10 transition-all"
                                    >
                                        {#if showKey["gemini"]}<EyeOff
                                                class="size-4"
                                            />{:else}<Eye class="size-4" />{/if}
                                    </button>
                                </div>
                            </div>
                            <div class="grid md:grid-cols-2 gap-5">
                                <div class="group">
                                    <label
                                        for="gemini-base-url"
                                        class="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5 ml-1 transition-colors group-focus-within:text-indigo-600"
                                        >Base URL</label
                                    >
                                    <input
                                        id="gemini-base-url"
                                        type="text"
                                        bind:value={settings.baseUrls.gemini}
                                        placeholder="https://generativelanguage.googleapis.com/v1beta"
                                        class="w-full bg-neutral-100 dark:bg-black/40 border border-transparent focus:border-indigo-500/30 focus:bg-white dark:focus:bg-black/60 rounded-2xl py-3.5 px-5 text-sm font-mono font-medium text-indigo-600 dark:text-indigo-400 placeholder-neutral-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300"
                                    />
                                </div>
                                <div class="group">
                                    <label
                                        for="gemini-model"
                                        class="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5 ml-1 transition-colors group-focus-within:text-blue-600"
                                        >{t.modelName}</label
                                    >
                                    <div
                                        class="relative w-full"
                                        use:clickOutside={{
                                            enabled: showModelDropdown,
                                            callback: () =>
                                                (showModelDropdown = false),
                                        }}
                                    >
                                        <input
                                            id="gemini-model"
                                            type="text"
                                            bind:value={settings.models.gemini}
                                            placeholder="gemini-1.5-pro"
                                            class="w-full bg-neutral-100 dark:bg-black/40 border border-transparent focus:border-blue-500/30 focus:bg-white dark:focus:bg-black/60 rounded-2xl py-3.5 pl-5 pr-10 text-sm font-mono font-medium text-blue-600 dark:text-blue-400 placeholder-neutral-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
                                            onfocus={() => {
                                                if (
                                                    settings.availableModels
                                                        .gemini.length > 0
                                                )
                                                    showModelDropdown = true;
                                            }}
                                        />
                                        <button
                                            onclick={() =>
                                                fetchModels("gemini")}
                                            class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-neutral-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={isFetching}
                                            title="Fetch Models"
                                        >
                                            <RefreshCw
                                                class="size-4 {isFetching
                                                    ? 'animate-spin'
                                                    : ''}"
                                            />
                                        </button>
                                        {#if showModelDropdown && settings.provider === "gemini" && settings.availableModels.gemini.length > 0}
                                            <div
                                                class="absolute top-full mt-2 w-full max-h-60 overflow-y-auto bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-neutral-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 p-1 flex flex-col gap-0.5 custom-scrollbar"
                                                in:fly={{
                                                    y: 10,
                                                    duration: 200,
                                                }}
                                            >
                                                {#each settings.availableModels.gemini as model}
                                                    <button
                                                        class="text-left w-full px-3 py-2.5 rounded-xl text-xs font-mono text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/10 hover:text-blue-600 dark:hover:text-blue-400 transition-colors break-all whitespace-normal leading-relaxed"
                                                        onclick={() =>
                                                            selectModel(
                                                                "gemini",
                                                                model.id,
                                                            )}
                                                    >
                                                        {model.name}
                                                    </button>
                                                {/each}
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                            </div>

                            <div class="group relative">
                                <div
                                    class="flex items-center justify-between pl-1 mb-1.5"
                                >
                                    <label
                                        for="gemini-suffix"
                                        class="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest transition-colors group-focus-within:text-blue-600"
                                        >{t.endpointSuffix}</label
                                    >
                                    <label
                                        class="relative inline-flex items-center cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            bind:checked={
                                                settings.useEndpointSuffixes
                                                    .gemini
                                            }
                                            class="sr-only peer"
                                        />
                                        <div
                                            class="w-7 h-4 bg-neutral-200 dark:bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"
                                        ></div>
                                        <span
                                            class="ml-2 text-[9px] font-bold text-neutral-500 uppercase tracking-widest leading-none"
                                            >{t.enableSuffix}</span
                                        >
                                    </label>
                                </div>
                                <div
                                    class="relative w-full"
                                    use:clickOutside={{
                                        enabled: showSuffixDropdown,
                                        callback: () =>
                                            (showSuffixDropdown = false),
                                    }}
                                >
                                    <input
                                        id="gemini-suffix"
                                        type="text"
                                        bind:value={
                                            settings.endpointSuffixes.gemini
                                        }
                                        disabled={!settings.useEndpointSuffixes
                                            .gemini}
                                        placeholder=":streamGenerateContent"
                                        class="w-full bg-neutral-100 dark:bg-black/40 border border-transparent focus:border-blue-500/30 focus:bg-white dark:focus:bg-black/60 rounded-2xl py-3.5 pl-5 pr-10 text-sm font-mono font-medium text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 disabled:opacity-50"
                                        onfocus={() =>
                                            (showSuffixDropdown = true)}
                                    />
                                    <button
                                        class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-neutral-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                                        onclick={() =>
                                            (showSuffixDropdown =
                                                !showSuffixDropdown)}
                                    >
                                        <ChevronDown class="size-4" />
                                    </button>
                                    {#if showSuffixDropdown && settings.provider === "gemini"}
                                        <div
                                            class="absolute top-full mt-2 w-full max-h-60 overflow-y-auto bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-neutral-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 p-1 flex flex-col gap-0.5 custom-scrollbar"
                                            in:fly={{
                                                y: 10,
                                                duration: 200,
                                            }}
                                        >
                                            {#each commonSuffixes.gemini as suffix}
                                                <button
                                                    class="text-left w-full px-3 py-2.5 rounded-xl text-xs font-mono text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/10 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                    onclick={() =>
                                                        selectSuffix(
                                                            "gemini",
                                                            suffix,
                                                        )}
                                                >
                                                    {suffix}
                                                </button>
                                            {/each}
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    {:else if settings.provider === "custom"}
                        <div
                            class="space-y-5"
                            in:fly={{ y: 10, duration: 300 }}
                        >
                            <div class="group relative">
                                <div
                                    class="flex items-center justify-between pl-1 mb-1.5"
                                >
                                    <label
                                        for="custom-key"
                                        class="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest transition-colors group-focus-within:text-pink-600"
                                        >API Key</label
                                    >
                                    <div class="flex items-center gap-2">
                                        {#if testResults.custom.status !== "idle"}
                                            <span
                                                class="text-[9px] font-bold uppercase tracking-wider {testResults
                                                    .custom.status === 'success'
                                                    ? 'text-green-500'
                                                    : testResults.custom
                                                            .status === 'error'
                                                      ? 'text-red-500'
                                                      : 'text-neutral-400'}"
                                            >
                                                {testResults.custom.status ===
                                                "testing"
                                                    ? t.testing
                                                    : testResults.custom
                                                            .status ===
                                                        "success"
                                                      ? t.connectionSuccess
                                                      : testResults.custom
                                                              .status ===
                                                          "error"
                                                        ? t.connectionFailed
                                                        : ""}
                                            </span>
                                        {/if}
                                        <button
                                            onclick={() =>
                                                testConnection("custom")}
                                            disabled={testResults.custom
                                                .status === "testing"}
                                            class="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-pink-500/10 text-pink-600 hover:bg-pink-500/20 transition-all"
                                        >
                                            {t.testConnection}
                                        </button>
                                    </div>
                                </div>
                                <div class="relative">
                                    <input
                                        id="custom-key"
                                        type={showKey["custom"]
                                            ? "text"
                                            : "password"}
                                        bind:value={settings.customKey}
                                        placeholder="sk-..."
                                        class="w-full bg-neutral-100 dark:bg-black/40 border border-transparent focus:border-pink-500/30 focus:bg-white dark:focus:bg-black/60 rounded-2xl py-3.5 pl-5 pr-12 text-sm font-bold text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-4 focus:ring-pink-500/10 transition-all duration-300"
                                    />
                                    <button
                                        onclick={() => toggleKey("custom")}
                                        class="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10 transition-all"
                                    >
                                        {#if showKey["custom"]}<EyeOff
                                                class="size-4"
                                            />{:else}<Eye class="size-4" />{/if}
                                    </button>
                                </div>
                            </div>
                            <div class="grid md:grid-cols-2 gap-5">
                                <div class="group">
                                    <label
                                        for="custom-base-url"
                                        class="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5 ml-1 transition-colors group-focus-within:text-purple-600"
                                        >Base URL</label
                                    >
                                    <input
                                        id="custom-base-url"
                                        type="text"
                                        bind:value={settings.baseUrls.custom}
                                        placeholder="https://api.deepseek.com"
                                        class="w-full bg-neutral-100 dark:bg-black/40 border border-transparent focus:border-purple-500/30 focus:bg-white dark:focus:bg-black/60 rounded-2xl py-3.5 px-5 text-sm font-mono font-medium text-purple-600 dark:text-purple-400 placeholder-neutral-400 focus:outline-none focus:ring-4 focus:ring-purple-500/10 transition-all duration-300"
                                    />
                                </div>
                                <div class="group">
                                    <label
                                        for="custom-model-input"
                                        class="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5 ml-1 transition-colors group-focus-within:text-pink-600"
                                        >{t.modelName}</label
                                    >
                                    <div
                                        class="relative w-full"
                                        use:clickOutside={{
                                            enabled: showModelDropdown,
                                            callback: () =>
                                                (showModelDropdown = false),
                                        }}
                                    >
                                        <input
                                            id="custom-model-input"
                                            type="text"
                                            bind:value={settings.models.custom}
                                            placeholder="deepseek-chat"
                                            class="w-full bg-neutral-100 dark:bg-black/40 border border-transparent focus:border-pink-500/30 focus:bg-white dark:focus:bg-black/60 rounded-2xl py-3.5 pl-5 pr-10 text-sm font-mono font-medium text-pink-600 dark:text-pink-400 placeholder-neutral-400 focus:outline-none focus:ring-4 focus:ring-pink-500/10 transition-all duration-300"
                                            onfocus={() => {
                                                if (
                                                    settings.availableModels
                                                        .custom.length > 0
                                                )
                                                    showModelDropdown = true;
                                            }}
                                        />
                                        <button
                                            onclick={() =>
                                                fetchModels("custom")}
                                            class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-neutral-400 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={isFetching}
                                            title="Fetch Models"
                                        >
                                            <RefreshCw
                                                class="size-4 {isFetching
                                                    ? 'animate-spin'
                                                    : ''}"
                                            />
                                        </button>
                                        {#if showModelDropdown && settings.provider === "custom" && settings.availableModels.custom.length > 0}
                                            <div
                                                class="absolute top-full mt-2 w-full max-h-60 overflow-y-auto bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-neutral-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 p-1 flex flex-col gap-0.5 custom-scrollbar"
                                                in:fly={{
                                                    y: 10,
                                                    duration: 200,
                                                }}
                                            >
                                                {#each settings.availableModels.custom as model}
                                                    <button
                                                        class="text-left w-full px-3 py-2.5 rounded-xl text-xs font-mono text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/10 hover:text-pink-600 dark:hover:text-pink-400 transition-colors break-all whitespace-normal leading-relaxed"
                                                        onclick={() =>
                                                            selectModel(
                                                                "custom",
                                                                model.id,
                                                            )}
                                                    >
                                                        {model.name}
                                                    </button>
                                                {/each}
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                                <div class="group">
                                    <label
                                        for="icon-upload"
                                        class="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5 ml-1 transition-colors group-focus-within:text-pink-600"
                                        >Provider Icon</label
                                    >
                                    <div class="flex gap-2">
                                        <div class="relative w-full">
                                            <input
                                                type="file"
                                                accept="image/svg+xml,image/png,image/jpeg"
                                                onchange={handleIconUpload}
                                                class="hidden"
                                                id="icon-upload"
                                            />
                                            <label
                                                for="icon-upload"
                                                class="flex items-center gap-3 w-full bg-neutral-100 dark:bg-black/40 border border-transparent hover:border-pink-500/30 hover:bg-white dark:hover:bg-black/60 rounded-2xl py-3.5 px-5 text-sm font-medium text-neutral-600 dark:text-neutral-400 cursor-pointer transition-all duration-300"
                                            >
                                                <Upload class="size-4" />
                                                {settings.customIcon
                                                    ? "Change Icon"
                                                    : "Upload Icon"}
                                            </label>
                                        </div>
                                        {#if settings.customIcon}
                                            <button
                                                onclick={() => {
                                                    settings.customIcon =
                                                        undefined;
                                                    appState.settings.customIcon =
                                                        undefined;
                                                }}
                                                class="shrink-0 flex items-center justify-center size-[52px] rounded-2xl bg-neutral-100 dark:bg-black/40 hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-500 hover:text-red-500 transition-colors"
                                            >
                                                <X class="size-5" />
                                            </button>
                                        {/if}
                                    </div>
                                </div>
                            </div>

                            <div class="group relative">
                                <div
                                    class="flex items-center justify-between pl-1 mb-1.5"
                                >
                                    <label
                                        for="custom-suffix"
                                        class="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest transition-colors group-focus-within:text-pink-600"
                                        >{t.endpointSuffix}</label
                                    >
                                    <label
                                        class="relative inline-flex items-center cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            bind:checked={
                                                settings.useEndpointSuffixes
                                                    .custom
                                            }
                                            class="sr-only peer"
                                        />
                                        <div
                                            class="w-7 h-4 bg-neutral-200 dark:bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-pink-600"
                                        ></div>
                                        <span
                                            class="ml-2 text-[9px] font-bold text-neutral-500 uppercase tracking-widest leading-none"
                                            >{t.enableSuffix}</span
                                        >
                                    </label>
                                </div>
                                <div
                                    class="relative w-full"
                                    use:clickOutside={{
                                        enabled: showSuffixDropdown,
                                        callback: () =>
                                            (showSuffixDropdown = false),
                                    }}
                                >
                                    <input
                                        id="custom-suffix"
                                        type="text"
                                        bind:value={
                                            settings.endpointSuffixes.custom
                                        }
                                        disabled={!settings.useEndpointSuffixes
                                            .custom}
                                        placeholder="/chat/completions"
                                        class="w-full bg-neutral-100 dark:bg-black/40 border border-transparent focus:border-pink-500/30 focus:bg-white dark:focus:bg-black/60 rounded-2xl py-3.5 pl-5 pr-10 text-sm font-mono font-medium text-pink-600 dark:text-pink-400 focus:outline-none focus:ring-4 focus:ring-pink-500/10 transition-all duration-300 disabled:opacity-50"
                                        onfocus={() =>
                                            (showSuffixDropdown = true)}
                                    />
                                    <button
                                        class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-neutral-400 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all"
                                        onclick={() =>
                                            (showSuffixDropdown =
                                                !showSuffixDropdown)}
                                    >
                                        <ChevronDown class="size-4" />
                                    </button>
                                    {#if showSuffixDropdown && settings.provider === "custom"}
                                        <div
                                            class="absolute top-full mt-2 w-full max-h-60 overflow-y-auto bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-neutral-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 p-1 flex flex-col gap-0.5 custom-scrollbar"
                                            in:fly={{
                                                y: 10,
                                                duration: 200,
                                            }}
                                        >
                                            {#each commonSuffixes.custom as suffix}
                                                <button
                                                    class="text-left w-full px-3 py-2.5 rounded-xl text-xs font-mono text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/10 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                                                    onclick={() =>
                                                        selectSuffix(
                                                            "custom",
                                                            suffix,
                                                        )}
                                                >
                                                    {suffix}
                                                </button>
                                            {/each}
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
        </section>
    </div>

    <!-- Save Footer -->
    <div
        class="px-10 py-6 border-t border-white/20 dark:border-white/5 bg-white/40 dark:bg-black/20 backdrop-blur-xl shrink-0 z-20"
    >
        <button
            onclick={save}
            class="group w-full flex items-center justify-center gap-3 bg-neutral-900 dark:bg-white text-white dark:text-black font-black py-4 rounded-2xl hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl hover:shadow-2xl uppercase tracking-[0.2em] text-xs relative overflow-hidden"
        >
            <div
                class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none"
            ></div>
            <Save class="size-4" />
            {t.save}
        </button>
    </div>
</div>

<style>
    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 10px;
    }
    :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.2);
    }
    :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.2);
    }
</style>
