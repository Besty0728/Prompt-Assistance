<script lang="ts">
    import { onMount } from "svelte";
    import { appState } from "../lib/state.svelte";

    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D | null;
    let animationFrame: number;

    const mouse = {
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
    };

    // Particles / Dashes
    interface Particle {
        x: number;
        y: number;
        lx: number;
        ly: number;
        angle: number;
        length: number;
        speed: number;
        depth: number; // For parallax hierarchy
        opacity: number;
    }

    let particles: Particle[] = [];
    const PARTICLE_COUNT = 480; // Subtle density

    function initParticles(width: number, height: number) {
        particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                lx: (Math.random() - 0.5) * 40,
                ly: (Math.random() - 0.5) * 40,
                angle: Math.random() * Math.PI * 2,
                length: 4 + Math.random() * 12,
                speed: 0.005 + Math.random() * 0.015,
                depth: 0.01 + Math.random() * 0.06,
                opacity: 0.1 + Math.random() * 0.3,
            });
        }
    }

    function resize() {
        if (!canvas) return;
        const width = window.innerWidth;
        const height = window.innerHeight;
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        if (ctx) ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        initParticles(width, height);
    }

    function draw() {
        if (!ctx || !canvas) return;

        const width = window.innerWidth;
        const height = window.innerHeight;

        // Smooth mouse movement (lerp)
        mouse.x += (mouse.targetX - mouse.x) * 0.08;
        mouse.y += (mouse.targetY - mouse.y) * 0.08;

        ctx.clearRect(0, 0, width, height);

        const isDark = appState.settings.theme === "dark";

        // 1. Draw Spotlight Layers (Final Intensity)
        const ambientGrad = ctx.createRadialGradient(
            mouse.x,
            mouse.y,
            0,
            mouse.x,
            mouse.y,
            Math.max(width, height) * 0.95,
        );
        if (isDark) {
            ambientGrad.addColorStop(0, "rgba(99, 102, 241, 0.18)");
            ambientGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        } else {
            ambientGrad.addColorStop(0, "rgba(139, 92, 246, 0.15)");
            ambientGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
        }
        ctx.fillStyle = ambientGrad;
        ctx.fillRect(0, 0, width, height);

        const coreGrad = ctx.createRadialGradient(
            mouse.x,
            mouse.y,
            0,
            mouse.x,
            mouse.y,
            Math.max(width, height) * 0.45,
        );
        if (isDark) {
            coreGrad.addColorStop(0, "rgba(168, 85, 247, 0.25)");
            coreGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        } else {
            coreGrad.addColorStop(0, "rgba(56, 189, 248, 0.2)");
            coreGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
        }
        ctx.fillStyle = coreGrad;
        ctx.fillRect(0, 0, width, height);

        // 2. Draw Particles (Ultra Bold & Ultra Dynamic)
        ctx.lineCap = "round";
        for (const p of particles) {
            p.angle += p.speed;

            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            let interactionX = 0;
            let interactionY = 0;
            if (dist < 450) {
                const force = (450 - dist) / 450;
                interactionX = (dx / dist) * force * 35; // Extreme push
                interactionY = (dy / dist) * force * 35;
            }

            const offsetX = (mouse.x - width / 2) * p.depth * -1.5;
            const offsetY = (mouse.y - height / 2) * p.depth * -1.5;

            const drawX = p.x + offsetX + interactionX + Math.cos(p.angle) * 5;
            const drawY = p.y + offsetY + interactionY + Math.sin(p.angle) * 5;

            // ULTRA Bold Stroke
            ctx.lineWidth = 2.8;
            ctx.strokeStyle = isDark
                ? `rgba(255, 255, 255, ${p.opacity * 1.15})`
                : `rgba(0, 0, 0, ${p.opacity * 0.9})`;

            // Extreme dynamic length (Motion Blur feel)
            const dynamicLength =
                p.length * (1 + (interactionX !== 0 ? 0.6 : 0));

            ctx.beginPath();
            ctx.moveTo(drawX, drawY);
            ctx.lineTo(
                drawX + Math.cos(p.angle) * dynamicLength,
                drawY + Math.sin(p.angle) * dynamicLength,
            );
            ctx.stroke();

            // Screen Wrap
            if (p.x < -200) p.x = width + 200;
            if (p.x > width + 200) p.x = -200;
            if (p.y < -200) p.y = height + 200;
            if (p.y > height + 200) p.y = -200;
        }

        animationFrame = requestAnimationFrame(draw);
    }

    onMount(() => {
        ctx = canvas.getContext("2d");
        resize();
        window.addEventListener("resize", resize);

        const moveHandler = (e: MouseEvent) => {
            mouse.targetX = e.clientX;
            mouse.targetY = e.clientY;
        };
        window.addEventListener("mousemove", moveHandler);

        mouse.x = mouse.targetX = window.innerWidth / 2;
        mouse.y = mouse.targetY = window.innerHeight / 2;

        draw();

        return () => {
            window.removeEventListener("resize", resize);
            window.removeEventListener("mousemove", moveHandler);
            cancelAnimationFrame(animationFrame);
        };
    });
</script>

<div
    class="fixed inset-0 z-[-1] overflow-hidden pointer-events-none transition-colors duration-1000 bg-neutral-50 dark:bg-[#050505]"
>
    <canvas bind:this={canvas} class="block w-full h-full"></canvas>

    <!-- Heavy Grain Overlay -->
    <div
        class="absolute inset-0 opacity-[0.05] dark:opacity-[0.08] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]"
    ></div>
</div>

<style>
    canvas {
        filter: blur(0.4px);
    }
</style>
