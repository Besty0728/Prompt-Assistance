# ✨ Prompt-Assistance

**English** | [中文](README_zh.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Svelte](https://img.shields.io/badge/Svelte-5-ff3e00.svg)](https://svelte.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8.svg)](https://tailwindcss.com/)

**Prompt-Assistance** is a minimalist, elegant, and powerful AI prompt optimization tool. Designed for creators and developers, it offers multi-dimensional optimization, reference context management, and cross-platform LLM support to make your AI interactions more efficient and professional.

---

## 🚀 Core Features

- **🌊 Cross-Platform Support**: Deep integration with OpenAI, Anthropic (Claude), Google Gemini, and custom compatible endpoints.
- **🔍 Intelligent Optimization Engine**: Built-in optimization logic tailored for different models, automatically complementing instructions, parameters, and context.
- **📂 Reference Management**: Easily manage PDF, Markdown, and Web reference documents for precise context injection.
- **⚡ Real-time Streaming Response**: Robust streaming output based on SSE for an exceptional typewriter-like interactive experience.
- **🎨 Premium Visual Design**: Featuring Glassmorphism and dynamic lighting effects, perfectly adapted for both dark and light modes.
- **🛠️ Highly Customizable**: Fully customizable endpoint suffixes to adapt to various API proxies and relay services.
- **📜 Optimization History**: Automatically saves optimization history for each model, allowing easy restoration and review.
- **☁️ Cloud Sync**: Sync your optimization history across devices using GitHub Gist (requires a GitHub PAT with `gist` scope).
- **☁️ Deployment Friendly**: Native support for modern edge computing platforms like Cloudflare Workers, EdgeOne Pages, and Vercel.

---

## 🔒 Security & Privacy

Your API keys and settings are **100% secure**:

- **Local Storage Only**: All data (API keys, settings) is stored in your browser's `localStorage` — never sent to any server.
- **No Backend**: This is a pure static SPA. There is no backend server to collect or store your data.
- **Direct API Calls**: API requests go directly from your browser to OpenAI/Anthropic/Google — no proxy or middleman.
- **User Isolation**: Each user's data is completely isolated. Other users on the same deployed domain cannot see your data.
- **Persistent Storage**: Settings persist until you manually clear browser data. No need to re-enter API keys on each visit.

---

## 🛠️ Installation & Development

This project is built with **Vite** + **Svelte 5**.

### 1. Clone the Project
```bash
git clone https://github.com/Besty0728/Prompt-Assistance.git
cd prompt-max
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```

---

## ☁️ Deployment Guide

This project is a 100% static SPA application and can be easily deployed on any platform that supports static hosting.

### Vercel Deployment (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FBesty0728%2FPrompt-Assistance)

> 💡 **Tip**: For easier updates, we recommend forking this repository first, then manually connecting your fork to the platform.

1. Click the **Deploy with Vercel** button above.
2. Link and authorize your GitHub repository.
3. Select **Vite** as the framework preset.
4. Build Command: `npm run build`, Output Directory: `dist`.

### Cloudflare Pages

[![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Besty0728/Prompt-Assistance)

> 💡 **Tip**: For easier updates, we recommend forking this repository first, then manually connecting your fork to the platform.

1. In the [Cloudflare Dashboard](https://dash.cloudflare.com/), go to **Workers & Pages** → **Create** → **Pages**.
2. Connect your GitHub repository.
3. **Build Settings**:
    - **Framework preset**: `None` (or `Vite` if available)
    - **Build command**: `npm run build`
    - **Build output directory**: `dist`
4. Click **Save and Deploy**.

### Cloudflare Workers

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Besty0728/Prompt-Assistance)

> 💡 **Tip**: For easier updates, we recommend forking this repository first, then manually connecting your fork to the platform.

1. Install Wrangler CLI: `npm install -g wrangler`
2. Login to Cloudflare: `wrangler login`
3. Build the project: `npm run build`
4. Deploy: `wrangler pages deploy dist --project-name=prompt-assistance`

### EdgeOne Pages (Tencent Cloud)

[![Deploy with EdgeOne](https://img.shields.io/badge/Deploy%20with-EdgeOne-blue?logo=tencent-cloud&logoColor=white)](https://console.cloud.tencent.com/edgeone/pages)

1. In the [EdgeOne Console](https://console.cloud.tencent.com/edgeone), create a new site and enter the **Pages** section.
2. Click **New Project** and link your GitHub repository.
3. **Deployment Settings**:
    - **Build Command**: `npm run build`
    - **Output Directory**: `dist`
    - **Node.js Version**: 18.x or higher recommended.
4. Save and deploy; EdgeOne will automatically handle the subsequent CI/CD.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 🤝 Contribution & Feedback

If you have any ideas or suggestions, please feel free to submit an Issue.

- **Author**: [Betsy](https://micostar.cc)
- **Blog**: [https://micostar.cc](https://micostar.cc)
- **Project Link**: [Prompt-Assistance](https://github.com/Besty0728/Prompt-Assistance)