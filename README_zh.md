# ✨ Prompt-Assistance

[English](README.md) | **中文**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Svelte](https://img.shields.io/badge/Svelte-5-ff3e00.svg)](https://svelte.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8.svg)](https://tailwindcss.com/)

**Prompt-Assistance** 是一款极简、优雅且强大的 AI 提示词优化工具。专为创作者和开发者设计，通过多维度优化、引用上下文管理以及全平台 LLM 支持，让您的 AI 交互更高效、更专业。

---

## 🚀 核心特性

- **🌊 全平台支持**: 深度支持 OpenAI、Anthropic (Claude)、Google Gemini 以及自定义兼容端点。
- **🔍 智能优化引擎**: 内置针对不同模型的优化逻辑，自动补全指令、参数与上下文。
- **📂 引用管理**: 轻松管理 PDF, Markdown, Web 参考文档，实现精准的上下文注入。
- **⚡ 实时流式响应**: 基于 SSE 的稳健流式输出，极致的打字机交互体验。
- **🎨 极致视觉设计**: 采用玻璃拟态 (Glassmorphism) 与动态光效，深色/浅色模式完美适配。
- **🛠️ 高度自定义**: 支持端点后缀完全自定义，完美适配各种 API 代理与中转服务。
- **☁️ 静态部署友好**: 原生支持 Cloudflare Workers、EdgeOne Pages、Vercel 等现代边缘计算平台。

---

## 🛠️ 安装与开发

本项目基于 **Vite** + **Svelte 5** 构建。

### 1. 克隆项目
```bash
git clone https://github.com/Besty0728/Prompt-Assistance.git
cd prompt-max
```

### 2. 安装依赖
```bash
npm install
```

### 3. 启动开发服务器
```bash
npm run dev
```

---

## ☁️ 部署指引

本项目为纯静态 SPA 应用，可轻松部署于任何支持静态托管的平台。

### Vercel 部署 (推荐)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FBesty0728%2FPrompt-Assistance)

> 💡 **提示**：为便于后续更新，建议先 Fork 本仓库到您的账户，然后手动连接平台进行部署。

1. 点击上方的 **Deploy with Vercel** 按钮。
2. 关联并授权您的 GitHub 仓库。
3. 框架预设选择 **Vite**。
4. 构建命令：`npm run build`，输出目录：`dist`。

### Cloudflare Pages

[![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Besty0728/Prompt-Assistance)

> 💡 **提示**：为便于后续更新，建议先 Fork 本仓库到您的账户，然后手动连接平台进行部署。

1. 在 [Cloudflare 控制台](https://dash.cloudflare.com/)，进入 **Workers & Pages** → **创建** → **Pages**。
2. 连接您的 GitHub 仓库。
3. **构建设置**:
    - **框架预设**: `None`（或 `Vite`，如果可用）
    - **构建命令**: `npm run build`
    - **构建输出目录**: `dist`
4. 点击 **保存并部署**。

### Cloudflare Workers

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Besty0728/Prompt-Assistance)

> 💡 **提示**：为便于后续更新，建议先 Fork 本仓库到您的账户，然后手动连接平台进行部署。

1. 安装 Wrangler CLI：`npm install -g wrangler`
2. 登录 Cloudflare：`wrangler login`
3. 构建项目：`npm run build`
4. 部署：`wrangler pages deploy dist --project-name=prompt-assistance`

### EdgeOne Pages (腾讯云)

[![Deploy with EdgeOne](https://img.shields.io/badge/Deploy%20with-EdgeOne-blue?logo=tencent-cloud&logoColor=white)](https://console.cloud.tencent.com/edgeone/pages)

1. 在 [EdgeOne 控制台](https://console.cloud.tencent.com/edgeone) 新建站点并进入 **Pages** 页面。
2. 点击 **新建项目**，关联您的 GitHub 仓库。
3. **部署设置**:
    - **构建命令**: `npm run build`
    - **产物目录**: `dist`
    - **Node.js 版本**: 建议 18.x 或更高。
4. 保存并部署，EdgeOne 将自动完成后续的持续集成。

---

## 📄 开源协议

本项目采用 [MIT 协议](LICENSE) 开源。

---

## 🤝 贡献与反馈

如果您有任何想法或建议，欢迎提交 Issue。

- **作者**: [Betsy](https://micostar.cc)
- **博客**: [https://micostar.cc](https://micostar.cc)
- **项目地址**: [Prompt-Assistance](https://github.com/Besty0728/Prompt-Assistance)
