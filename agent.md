# Prompt-Assistance - AI Agent Context

> 本文档帮助 AI Agent 快速理解项目架构与核心逻辑。

## Project Overview

**Prompt-Assistance** 是一个 Prompt 优化工具，使用 LLM 帮助用户将原始 Prompt 转化成结构化、高质量的 Prompt。

**技术栈:**
- **Framework:** Svelte 5 + Vite
- **Styling:** Tailwind CSS 4
- **Package Manager:** pnpm

---

## Directory Structure

```
src/
├── App.svelte              # 主应用入口
├── components/
│   ├── Optimizer.svelte    # 🔥 核心优化器 UI + 逻辑
│   └── Settings.svelte     # 设置面板 (API Keys, Models)
├── lib/
│   ├── state.svelte.ts     # 全局状态管理 (Svelte 5 runes)
│   ├── references.ts       # 参考文档数据 (gemini.md, claude.md, gpt.md)
│   ├── i18n.ts             # 国际化 (中/英)
│   ├── prompts/            # 各模型的 System Prompt
│   │   ├── gemini.ts
│   │   ├── claude.ts
│   │   └── openai.ts
│   └── llm/
│       └── api.ts          # LLM API 调用封装
└── assets/icons/           # SVG 图标资源
```

---

## Core Concepts

### 1. 三大目标模型

| 模型 ID | Provider | 用途 |
|---------|----------|------|
| `gemini` | Google | 生成 Gemini 优化 Prompt |
| `claude` | Anthropic | 生成 Claude 优化 Prompt |
| `gpt` | OpenAI | 生成 GPT 优化 Prompt |

### 2. Reference Context Manager

**原理:** 将模型专属的"提示工程指南"注入到用户请求中，让 LLM 参考这些指南进行优化。

**文件:** `src/lib/references.ts`

```typescript
interface Reference {
    id: string;
    title: string;           // 显示名 (gemini.md)
    type: 'md' | 'pdf' | 'text';
    content: string;         // 实际内容
    targetId: 'gemini' | 'claude' | 'gpt' | 'all';  // 绑定模型
    isCustom: boolean;
    enabled: boolean;
}
```

**流程:**
1. `compileReferences()` 过滤当前模型对应的 `enabled` 引用
2. 包裹成 `<reference_context>` XML 结构
3. 拼接到 `fullUserPrompt` 发送给 LLM

### 3. State Management

**文件:** `src/lib/state.svelte.ts`

使用 Svelte 5 的 `$state` rune 管理全局状态：

```typescript
class AppState {
    settings = $state<AppSettings>({
        targetModel: 'gemini',
        providers: { gemini: {...}, claude: {...}, openai: {...} },
        references: [...],
        theme: 'light',
        language: 'zh'
    });
}
```

状态自动持久化到 `localStorage`。

### 4. Optimization Flow

```
用户输入 → compileReferences() → 拼接 User Prompt
                                       ↓
                        System Prompt (from src/lib/prompts/)
                                       ↓
                               LLM API Call
                                       ↓
                              流式输出优化结果
```

---

## Key Files Quick Reference

| 文件 | 职责 |
|------|------|
| `Optimizer.svelte` | 优化器主 UI、`optimize()` 函数、`compileReferences()` |
| `Settings.svelte` | API Key 配置、模型选择、主题切换 |
| `state.svelte.ts` | 全局状态、持久化、默认值 |
| `references.ts` | 参考文档定义 (gemini.md, claude.md, gpt.md) |
| `api.ts` | `chatCompletion()` 流式调用 |
| `i18n.ts` | 中英文翻译键值对 |

---

## Development Commands

```bash
pnpm install    # 安装依赖
pnpm dev        # 启动开发服务器 (localhost:5173)
pnpm build      # 生产构建
```

---

## Common Tasks

### 修改 System Prompt
编辑 `src/lib/prompts/{model}.ts`

### 修改参考文档内容
编辑 `src/lib/references.ts` 中对应的 `content` 字段

### 添加新的 Provider
1. 在 `state.svelte.ts` 的 `providers` 对象中添加
2. 在 `Optimizer.svelte` 的 `activeProviderConfig` 中处理
3. 在 `Settings.svelte` 中添加 UI

### 修改 UI 样式
- 全局样式: `src/app.css`
- 组件内: 使用 Tailwind 工具类

---

## Design Decisions

1. **严格模型映射:** 每个参考文档通过 `targetId` 绑定到特定模型
2. **Universal Baseline 默认关闭:** 确保模型专属指南不被稀释
3. **流式输出:** 使用 SSE 实现实时反馈
4. **SVG 图标:** 使用 Vite 导入实现矢量清晰度
5. **护眼配色:** Light 模式使用 Muted Cement (#eceef0)
6. **自定义引用 Modal:** 使用 Modal 弹窗代替 `prompt()`，支持粘贴长文档

---

## Custom Reference Modal

**位置:** `Optimizer.svelte`

**状态变量:**
- `showRefModal`: 控制 Modal 显示
- `newRefTitle`: 引用标题
- `newRefContent`: 引用内容

**特性:**
- 大 `<textarea>` 支持粘贴长文档
- 实时 Token 估算显示
- 自动绑定到当前选中的目标模型
- 点击背景或按 Escape 关闭
- 验证：标题和内容都非空才能添加

---

## Smart URL Handling (API Endpoints)

### 概述
项目支持 OpenAI、Anthropic、Gemini 和 **Custom** 四种 Provider。Custom Provider 允许用户配置任意兼容 OpenAI API 的端点。

### 智能 URL 构建逻辑

**核心文件:**
- `src/lib/llm.ts` - 实际 API 请求
- `src/components/Settings.svelte` - `testConnection()` 和 `fetchModels()`

**问题场景:**
用户配置 `Base URL: https://api.siliconflow.cn` + `Suffix: /v1/chat/completions` 时，如果简单拼接会变成 `/v1/v1/...`。

**解决方案:**

1. **后缀解析:** 从 `/v1/chat/completions` 中提取版本前缀 `/v1`
2. **去重逻辑:** 如果 Base URL 已包含该前缀，则不再追加
3. **回退探测:** 如果 `/models` 失败，自动尝试 `/v1/models`

```typescript
// 示例：后缀解析
suffix = suffix.replace(/\/chat\/completions\/?$/, ''); // "/v1/chat/completions" → "/v1"

// 示例：去重
if (baseClean.endsWith(`/${suffixClean}`)) {
    url = `${baseClean}/models`;  // 不追加
} else {
    url = `${baseClean}/${suffixClean}/models`;  // 追加
}
```

### 无 API Key 获取模型

`fetchModels()` 支持在没有 API Key 的情况下请求模型列表：

```typescript
if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
}
// 即使没有 Key，仍会发送请求（适用于本地代理或开放端点）
```

### Custom Provider 配置

| 设置项 | 说明 |
|--------|------|
| `customKey` | API Key |
| `baseUrls.custom` | Base URL (如 `https://api.siliconflow.cn`) |
| `models.custom` | 模型 ID |
| `endpointSuffixes.custom` | 端点后缀 (如 `/v1/chat/completions`) |
| `useEndpointSuffixes.custom` | 是否启用后缀 |

---

## Provider 配置参考

| Provider | 默认 Base URL | 默认后缀 | 测试端点 |
|----------|---------------|----------|----------|
| OpenAI | `https://api.openai.com/v1` | `/chat/completions` | `/models` |
| Anthropic | `https://api.anthropic.com/v1` | `/messages` | POST `/messages` |
| Gemini | `https://generativelanguage.googleapis.com/v1beta` | `:streamGenerateContent` | `/models?key=` |
| Custom | 用户配置 | 用户配置 | `/models` (智能解析) |
