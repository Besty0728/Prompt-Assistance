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
- **☁️ Deployment Friendly**: Native support for modern edge computing platforms like Cloudflare Workers, EdgeOne Pages, and Vercel.

---

## 🛠️ Installation & Development

This project is built with **Vite** + **Svelte 5**.

### 1. Clone the Project
```bash
git clone https://github.com/Besty0728/prompt-max.git
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

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FBesty0728%2Fprompt-max)

1. Click the **Deploy with Vercel** button above.
2. Link and authorize your GitHub repository.
3. Select **Vite** as the framework preset.
4. Build Command: `npm run build`, Output Directory: `dist`.

### Cloudflare Pages / Workers

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Besty0728/prompt-max)

1. **Pages**: Create a new project in the console, link GitHub, select `Vite` for build options, and set `dist` as the output directory.
2. **Workers**: After running `npm run build`, deploy using `wrangler pages deploy dist`.

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
- **Project Link**: [Prompt-Assistance](https://github.com/Besty0728/prompt-max)