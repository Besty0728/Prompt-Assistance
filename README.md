# ✨ Prompt-Assistance

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Svelte](https://img.shields.io/badge/Svelte-5-ff3e00.svg)](https://svelte.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8.svg)](https://tailwindcss.com/)
[![Deployment](https://img.shields.io/badge/Deploy-Cloudflare%20|%20EdgeOne-orange.svg)](#-部署指引)

**Prompt-Assistance** 是一款极简、优雅且强大的 AI 提示词优化工具。专为创作者和开发者设计，支持多维度优化、引用上下文管理以及全平台 LLM 适配。

---

## 🚀 核心特性

- **🌊 全平台支持**: 深度支持 OpenAI、Anthropic (Claude)、Google Gemini 以及自定义兼容端点。
- **🔍 智能优化引擎**: 内置对不同模型的优化逻辑，自动补全指令、参数与上下文。
- **📂 引用管理**: 轻松管理 PDF, Markdown, Web 参考文档，实现精准上下文注入。
- **⚡ 实时流式响应**: 基于 SSE 的稳健流式输出，极致的打字机交互体验。
- **🎨 极致视觉设计**: 采用玻璃拟态 (Glassmorphism) 与动态光效。
- **🛠️ 高度自定义**: 支持端点后缀完全自定义，适配各种 API 代理。
- **☁️ 静态部署友好**: 原生支持 Cloudflare Workers、EdgeOne Pages 等现代边缘计算平台。

---

## 🛠️ 安装与开发

本项目基于 **Vite** + **Svelte 5** 构建。

### 1. 克隆项目
```bash
git clone https://github.com/Besty0728/prompt-max.git
cd prompt-max
```

### 2. 安装依赖
```bash
npm install
```

### 3. 实时预览
```bash
npm run dev
```

---

## ☁️ 部署指引

本项目设计为 100% 静态化 (SPA)，可极其简单地部署在边缘计算平台的静态托管服务中。

### Cloudflare Pages / Workers
1. 运行 `npm run build`。
2. 将 `dist` 目录上传至 Cloudflare Pages 或通过 Wrangler 部署至 Workers。

### EdgeOne Pages (腾讯云)
1. 在 EdgeOne 控制台新建站点。
2. 开启 Pages 静态网站托管。
3. 关联 GitHub 仓库或上传 `dist` 文件夹。

---

## 📄 开源协议

本项目采用 [MIT 协议](LICENSE) 开源。

---

## 🤝 贡献与反馈

如果您有任何想法或建议，欢迎提交 Issue。

- **作者**: [Betsy](https://micostar.cc)
- **博客**: [https://micostar.cc](https://micostar.cc)
- **项目地址**: [Prompt-Assistance](https://github.com/Besty0728/prompt-max)

---

<p align="center">
  Made with ❤️ by <a href="https://micostar.cc">Betsy</a> and AI
</p>
