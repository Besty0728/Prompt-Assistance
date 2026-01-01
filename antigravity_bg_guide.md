# Antigravity 风格交互背景实现指南

本指南总结了还原 `antigravity.google` 高级感背景的核心技术实现，主要包含 **Canvas 2D 渲染**、**Lerp 平滑追踪**、**分层光斑渲染**以及**反馈式粒子流场**。

## 核心设计理念
1. **流动性 (Fluidity)**: 所有的移动都必须经过平滑处理（Lerp），避免生硬的跟随。
2. **深度感 (Depth)**: 通过不同的粒子速度（视差）营造 3D 空间。
3. **沉浸感 (Atmosphere)**: 分层渐变光斑营造出一种神秘的实验室氛围。

## 关键技术点

### 1. Lerp 平滑跟随逻辑 (Linear Interpolation)
不要直接将鼠标坐标赋给物体。使用以下逻辑让跟随具有“粘性”和“阻尼感”：
```javascript
// 每一帧更新
currentX += (targetX - currentX) * easing; // easing 通常取 0.05 ~ 0.1
```

### 2. 多层径向渐变 (Spotlight)
使用 `createRadialGradient` 创建两层或多层光斑：
- **底层 (Ambient)**: 极大范围、极低透明度，负责整体氛围。
- **顶层 (Core)**: 较小范围、高亮度，负责视觉聚焦。

### 3. 反馈式粒子流场 (Flow Field)
- **粒子属性**: 包含 `angle` (旋转), `speed` (基础速度), `depth` (视差倍率)。
- **鼠标交互**: 计算粒子与鼠标的距离 `dist`。如果 `dist < threshold`，则施加一个反向的加速度（Repulsion），使粒子产生避让效果。
- **运动模糊**: 粒子的 `length` 应随交互强度的增加而动态延长。

## 完整代码模板 (Svelte 5 示例)

```svelte
<script>
  import { onMount } from 'svelte';

  let canvas;
  let ctx;
  let animationFrame;
  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const particles = [];

  // 初始化粒子、Resize 逻辑、Draw 循环...
  // (见 Background.svelte 完整实现)
</script>

<div class="background-container">
  <canvas bind:this={canvas} />
  <div class="noise-overlay" />
</div>

<style>
  .background-container { position: fixed; inset: 0; z-index: -1; overflow: hidden; }
  canvas { width: 100%; height: 100%; filter: blur(0.4px); }
  .noise-overlay { position: absolute; inset: 0; opacity: 0.05; pointer-events: none; background: url('noise.png'); }
</style>
```

## 开发者建议
- **性能**: Canvas 2D 在处理 1000 个以内的简单线段时性能极佳，无需 WebGL。
- **细节**: 在 Canvas 之上覆盖一层 3% 透明度的 SVG Noise（噪点），能极大提升视觉的质感，消除色阶断层。
- **颜色**: 深色模式建议使用 `Indigo` (靛蓝) 与 `Purple` (紫色) 混合，浅色模式建议使用 `Sky` (天蓝) 与 `Violet` (紫罗兰) 混合。
