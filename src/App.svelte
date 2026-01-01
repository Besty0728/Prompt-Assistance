<script lang="ts">
  import { appState } from "./lib/state.svelte";
  import { translations } from "./lib/i18n";
  import Optimizer from "./components/Optimizer.svelte";
  import Settings from "./components/Settings.svelte";
  import Background from "./components/Background.svelte";
  import { Settings as SettingsIcon, Sparkles, Sun, Moon } from "lucide-svelte";

  let showSettings = $state(false);
  let t = $derived(translations[appState.settings.language]);

  function toggleTheme() {
    appState.settings.theme =
      appState.settings.theme === "dark" ? "light" : "dark";
  }

  function toggleLanguage() {
    appState.settings.language =
      appState.settings.language === "zh" ? "en" : "zh";
  }
</script>

<Background />

<main
  class="h-screen w-screen overflow-hidden flex flex-col text-neutral-800 dark:text-neutral-100 font-sans selection:bg-purple-500/30 relative transition-colors duration-500"
>
  <!-- Header -->
  <header
    class="h-16 px-12 flex items-center justify-between z-50 transition-all duration-500 border-b border-black/5 dark:border-white/5 bg-white/40 dark:bg-black/50 backdrop-blur-2xl"
  >
    <div class="flex items-center gap-4 group cursor-pointer select-none">
      <div
        class="p-2.5 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 shadow-xl shadow-purple-500/30 group-hover:scale-110 transition-transform duration-500"
      >
        <Sparkles class="size-6 text-white" />
      </div>
      <div class="flex flex-col">
        <h1
          class="text-xl font-black tracking-tighter text-neutral-900 dark:text-white"
        >
          {t.title}
        </h1>
        <span
          class="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-500 dark:text-neutral-600 leading-none"
          >AI PRMPT OPTIMIZER</span
        >
      </div>
    </div>

    <div class="flex items-center gap-3">
      <!-- Animated Theme Switch -->
      <label class="theme-switch">
        <input
          type="checkbox"
          class="theme-switch__checkbox"
          checked={appState.settings.theme === "dark"}
          onchange={toggleTheme}
        />
        <div class="theme-switch__container">
          <div class="theme-switch__clouds"></div>
          <div class="theme-switch__stars-container">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 144 55"
              fill="none"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M135.831 3.00688C135.055 3.85027 134.111 4.29946 133 4.35447C134.111 4.40947 135.055 4.85867 135.831 5.71123C136.607 6.55462 136.996 7.56303 136.996 8.72727C136.996 7.95722 137.172 7.25134 137.525 6.59129C137.886 5.93124 138.372 5.39954 138.98 5.00535C139.598 4.60199 140.268 4.39114 141 4.35447C139.88 4.2903 138.936 3.85027 138.16 3.00688C137.384 2.16348 136.996 1.16425 136.996 0C136.996 1.16425 136.607 2.16348 135.831 3.00688ZM31 23.3545C32.1114 23.2995 33.0551 22.8503 33.8313 22.0069C34.6075 21.1635 34.9956 20.1642 34.9956 19C34.9956 20.1642 35.3837 21.1635 36.1599 22.0069C36.9361 22.8503 37.8798 23.2903 39 23.3545C38.2679 23.3911 37.5976 23.602 36.9802 24.0053C36.3716 24.3995 35.8864 24.9312 35.5248 25.5913C35.172 26.2513 34.9956 26.9572 34.9956 27.7273C34.9956 26.563 34.6075 25.5546 33.8313 24.7112C33.0551 23.8587 32.1114 23.4095 31 23.3545ZM0 36.3545C1.11136 36.2995 2.05513 35.8503 2.83131 35.0069C3.6075 34.1635 3.99559 33.1642 3.99559 32C3.99559 33.1642 4.38368 34.1635 5.15987 35.0069C5.93605 35.8503 6.87982 36.2903 8 36.3545C7.26792 36.3911 6.59757 36.602 5.98015 37.0053C5.37155 37.3995 4.88644 37.9312 4.52481 38.5913C4.172 39.2513 3.99559 39.9572 3.99559 40.7273C3.99559 39.563 3.6075 38.5546 2.83131 37.7112C2.05513 36.8587 1.11136 36.4095 0 36.3545ZM56.8313 24.0069C56.0551 24.8503 55.1114 25.2995 54 25.3545C55.1114 25.4095 56.0551 25.8587 56.8313 26.7112C57.6075 27.5546 57.9956 28.563 57.9956 29.7273C57.9956 28.9572 58.172 28.2513 58.5248 27.5913C58.8864 26.9312 59.3716 26.3995 59.9802 26.0053C60.5976 25.602 61.2679 25.3911 62 25.3545C60.8798 25.2903 59.9361 24.8503 59.1599 24.0069C58.3837 23.1635 57.9956 22.1642 57.9956 21C57.9956 22.1642 57.6075 23.1635 56.8313 24.0069ZM81 25.3545C82.1114 25.2995 83.0551 24.8503 83.8313 24.0069C84.6075 23.1635 84.9956 22.1642 84.9956 21C84.9956 22.1642 85.3837 23.1635 86.1599 24.0069C86.9361 24.8503 87.8798 25.2903 89 25.3545C88.2679 25.3911 87.5976 25.602 86.9802 26.0053C86.3716 26.3995 85.8864 26.9312 85.5248 27.5913C85.172 28.2513 84.9956 28.9572 84.9956 29.7273C84.9956 28.563 84.6075 27.5546 83.8313 26.7112C83.0551 25.8587 82.1114 25.4095 81 25.3545ZM136 36.3545C137.111 36.2995 138.055 35.8503 138.831 35.0069C139.607 34.1635 139.996 33.1642 139.996 32C139.996 33.1642 140.384 34.1635 141.16 35.0069C141.936 35.8503 142.88 36.2903 144 36.3545C143.268 36.3911 142.598 36.602 141.98 37.0053C141.372 37.3995 140.886 37.9312 140.525 38.5913C140.172 39.2513 139.996 39.9572 139.996 40.7273C139.996 39.563 139.607 38.5546 138.831 37.7112C138.055 36.8587 137.111 36.4095 136 36.3545ZM101.831 49.0069C101.055 49.8503 100.111 50.2995 99 50.3545C100.111 50.4095 101.055 50.8587 101.831 51.7112C102.607 52.5546 102.996 53.563 102.996 54.7273C102.996 53.9572 103.172 53.2513 103.525 52.5913C103.886 51.9312 104.372 51.3995 104.98 51.0053C105.598 50.602 106.268 50.3911 107 50.3545C105.88 50.2903 104.936 49.8503 104.16 49.0069C103.384 48.1635 102.996 47.1642 102.996 46C102.996 47.1642 102.607 48.1635 101.831 49.0069Z"
                fill="currentColor"
              ></path>
            </svg>
          </div>
          <div class="theme-switch__circle-container">
            <div class="theme-switch__sun-moon-container">
              <div class="theme-switch__moon">
                <div class="theme-switch__spot"></div>
                <div class="theme-switch__spot"></div>
                <div class="theme-switch__spot"></div>
              </div>
            </div>
          </div>
        </div>
      </label>

      <!-- Language Switch (Pill Style) -->
      <button
        onclick={toggleLanguage}
        class="lang-toggle"
        aria-label="Toggle Language"
      >
        <span
          class="lang-toggle__option {appState.settings.language === 'zh'
            ? 'active'
            : ''}">中</span
        >
        <span
          class="lang-toggle__option {appState.settings.language === 'en'
            ? 'active'
            : ''}">EN</span
        >
      </button>

      <button
        onclick={() => (showSettings = true)}
        class="settings-btn group p-2.5 rounded-xl bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all duration-300 shadow-sm border border-black/5 dark:border-white/5"
        aria-label="Open Settings"
      >
        <SettingsIcon
          class="size-5 transition-transform duration-300 group-hover:animate-spin"
        />
      </button>
    </div>
  </header>

  <div
    class="flex-1 w-full max-w-[1720px] mx-auto p-6 md:p-12 flex items-center justify-center"
  >
    <div
      class="w-full h-full animate-in fade-in slide-in-from-bottom-8 duration-1000"
    >
      <Optimizer />
    </div>
  </div>

  <!-- Settings Modal -->
  {#if showSettings}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div
        class="absolute inset-0 bg-neutral-900/20 dark:bg-black/70 backdrop-blur-md transition-opacity duration-500"
        onclick={() => (showSettings = false)}
        aria-hidden="true"
      ></div>
      <div
        class="relative w-full max-w-2xl bg-neutral-50 dark:bg-[#0a0a0a] border border-black/10 dark:border-white/10 rounded-[40px] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] dark:shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] overflow-hidden h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-300"
      >
        <Settings onClose={() => (showSettings = false)} />
      </div>
    </div>
  {/if}
</main>

<style>
  @keyframes spin-slow {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* Theme Switch Styles */
  .theme-switch {
    --toggle-size: 16px;
    --container-width: 5.625em;
    --container-height: 2.5em;
    --container-radius: 6.25em;
    --container-light-bg: #3d7eae;
    --container-night-bg: #1d1f2c;
    --circle-container-diameter: 3.375em;
    --sun-moon-diameter: 2.125em;
    --sun-bg: #ecca2f;
    --moon-bg: #c4c9d1;
    --spot-color: #959db1;
    --circle-container-offset: calc(
      (var(--circle-container-diameter) - var(--container-height)) / 2 * -1
    );
    --stars-color: #fff;
    --clouds-color: #f3fdff;
    --back-clouds-color: #aacadf;
    --transition: 0.5s cubic-bezier(0, -0.02, 0.4, 1.25);
    --circle-transition: 0.3s cubic-bezier(0, -0.02, 0.35, 1.17);
  }

  .theme-switch,
  .theme-switch *,
  .theme-switch *::before,
  .theme-switch *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-size: var(--toggle-size);
  }

  .theme-switch__container {
    width: var(--container-width);
    height: var(--container-height);
    background-color: var(--container-light-bg);
    border-radius: var(--container-radius);
    overflow: hidden;
    cursor: pointer;
    box-shadow:
      0em -0.062em 0.062em rgba(0, 0, 0, 0.25),
      0em 0.062em 0.125em rgba(255, 255, 255, 0.94);
    transition: var(--transition);
    position: relative;
  }

  .theme-switch__container::before {
    content: "";
    position: absolute;
    z-index: 1;
    inset: 0;
    box-shadow: 0em 0.05em 0.187em rgba(0, 0, 0, 0.25) inset;
    border-radius: var(--container-radius);
  }

  .theme-switch__checkbox {
    display: none;
  }

  .theme-switch__circle-container {
    width: var(--circle-container-diameter);
    height: var(--circle-container-diameter);
    background-color: rgba(255, 255, 255, 0.1);
    position: absolute;
    left: var(--circle-container-offset);
    top: var(--circle-container-offset);
    border-radius: var(--container-radius);
    box-shadow:
      inset 0 0 0 3.375em rgba(255, 255, 255, 0.1),
      0 0 0 0.625em rgba(255, 255, 255, 0.1),
      0 0 0 1.25em rgba(255, 255, 255, 0.1);
    display: flex;
    transition: var(--circle-transition);
    pointer-events: none;
  }

  .theme-switch__sun-moon-container {
    pointer-events: auto;
    position: relative;
    z-index: 2;
    width: var(--sun-moon-diameter);
    height: var(--sun-moon-diameter);
    margin: auto;
    border-radius: var(--container-radius);
    background-color: var(--sun-bg);
    box-shadow:
      0.062em 0.062em 0.062em 0em rgba(254, 255, 239, 0.61) inset,
      0em -0.062em 0.062em 0em #a1872a inset;
    filter: drop-shadow(0.062em 0.125em 0.125em rgba(0, 0, 0, 0.25));
    overflow: hidden;
    transition: var(--transition);
  }

  .theme-switch__moon {
    transform: translateX(100%);
    width: 100%;
    height: 100%;
    background-color: var(--moon-bg);
    border-radius: inherit;
    box-shadow:
      0.062em 0.062em 0.062em 0em rgba(254, 255, 239, 0.61) inset,
      0em -0.062em 0.062em 0em #969696 inset;
    transition: var(--transition);
    position: relative;
  }

  .theme-switch__spot {
    position: absolute;
    top: 0.75em;
    left: 0.312em;
    width: 0.75em;
    height: 0.75em;
    border-radius: var(--container-radius);
    background-color: var(--spot-color);
    box-shadow: 0em 0.0312em 0.062em rgba(0, 0, 0, 0.25) inset;
  }

  .theme-switch__spot:nth-of-type(2) {
    width: 0.375em;
    height: 0.375em;
    top: 0.937em;
    left: 1.375em;
  }

  .theme-switch__spot:nth-last-of-type(3) {
    width: 0.25em;
    height: 0.25em;
    top: 0.312em;
    left: 0.812em;
  }

  .theme-switch__clouds {
    width: 1.25em;
    height: 1.25em;
    background-color: var(--clouds-color);
    border-radius: var(--container-radius);
    position: absolute;
    bottom: -0.625em;
    left: 0.312em;
    box-shadow:
      0.937em 0.312em var(--clouds-color),
      -0.312em -0.312em var(--back-clouds-color),
      1.437em 0.375em var(--clouds-color),
      0.5em -0.125em var(--back-clouds-color),
      2.187em 0 var(--clouds-color),
      1.25em -0.062em var(--back-clouds-color),
      2.937em 0.312em var(--clouds-color),
      2em -0.312em var(--back-clouds-color),
      3.625em -0.062em var(--clouds-color),
      2.625em 0em var(--back-clouds-color),
      4.5em -0.312em var(--clouds-color),
      3.375em -0.437em var(--back-clouds-color),
      4.625em -1.75em 0 0.437em var(--clouds-color),
      4em -0.625em var(--back-clouds-color),
      4.125em -2.125em 0 0.437em var(--back-clouds-color);
    transition: 0.5s cubic-bezier(0, -0.02, 0.4, 1.25);
  }

  .theme-switch__stars-container {
    position: absolute;
    color: var(--stars-color);
    top: -100%;
    left: 0.312em;
    width: 2.75em;
    height: auto;
    transition: var(--transition);
  }

  .theme-switch__checkbox:checked + .theme-switch__container {
    background-color: var(--container-night-bg);
  }

  .theme-switch__checkbox:checked
    + .theme-switch__container
    .theme-switch__circle-container {
    left: calc(
      100% - var(--circle-container-offset) - var(--circle-container-diameter)
    );
  }

  .theme-switch__checkbox:checked
    + .theme-switch__container
    .theme-switch__circle-container:hover {
    left: calc(
      100% - var(--circle-container-offset) - var(--circle-container-diameter) -
        0.187em
    );
  }

  .theme-switch__circle-container:hover {
    left: calc(var(--circle-container-offset) + 0.187em);
  }

  .theme-switch__checkbox:checked
    + .theme-switch__container
    .theme-switch__moon {
    transform: translate(0);
  }

  .theme-switch__checkbox:checked
    + .theme-switch__container
    .theme-switch__clouds {
    bottom: -4.062em;
  }

  .theme-switch__checkbox:checked
    + .theme-switch__container
    .theme-switch__stars-container {
    top: 50%;
    transform: translateY(-50%);
  }

  /* Language Toggle Pill Style */
  .lang-toggle {
    display: flex;
    align-items: center;
    gap: 0;
    padding: 0.25rem;
    background: linear-gradient(135deg, #636f7c 0%, #5a6571 100%);
    border: none;
    border-radius: 6.25em;
    cursor: pointer;
    box-shadow:
      0em -0.062em 0.062em rgba(0, 0, 0, 0.25),
      0em 0.062em 0.125em rgba(255, 255, 255, 0.94),
      inset 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
    height: 40px;
  }

  .lang-toggle:hover {
    transform: scale(1.02);
  }

  .lang-toggle__option {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.5);
    border-radius: 6.25em;
    transition: all 0.3s cubic-bezier(0, -0.02, 0.4, 1.25);
    min-width: 2.5rem;
  }

  .lang-toggle__option.active {
    color: #fff;
    background: linear-gradient(135deg, #f4847d 0%, #e06b63 100%);
    box-shadow:
      0 2px 8px rgba(244, 132, 125, 0.5),
      inset 0 1px 1px rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
  }

  /* Slow spin for settings icon */
  .settings-btn:hover :global(svg) {
    animation: spin-slow 3s linear infinite;
  }

  @keyframes spin-slow {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
