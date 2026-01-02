<script lang="ts">
    import { onMount } from "svelte";
    import { appState } from "../lib/state.svelte";

    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D | null;
    let animationFrame: number;

    // Mouse state with Lerp target
    const mouse = {
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        currentX: 0,
        currentY: 0,
    };

    // Particle configuration
    const PARTICLE_COUNT = 150;
    const CONNECT_DISTANCE = 140;
    const MOUSE_REPULSION = 180;
    const particles: Particle[] = [];

    // Colors
    const LIGHT_COLOR = "rgba(100, 116, 139, 0.45)"; // Slate-500 equivalent
    const DARK_COLOR = "rgba(148, 163, 184, 0.35)"; // Slate-400 equivalent
    const ACCENT_LIGHT = "rgba(168, 85, 247, 0.5)"; // Purple
    const ACCENT_DARK = "rgba(192, 132, 252, 0.5)"; // Lighter Purple

    class Particle {
        x: number;
        y: number;
        vx: number;
        vy: number;
        size: number;
        baseX: number;
        baseY: number;

        constructor(width: number, height: number) {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            // Constant subtle movement
            this.vx = (Math.random() - 0.5) * 0.4;
            this.vy = (Math.random() - 0.5) * 0.4;
            this.size = Math.random() * 2 + 1.2;
            this.baseX = this.x;
            this.baseY = this.y;
        }

        update(width: number, height: number) {
            // Apply mouse repulsion/attraction force
            const dx = mouse.currentX - this.x;
            const dy = mouse.currentY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Interactive flow field
            if (distance < MOUSE_REPULSION) {
                const forceDirectionX = dx / distance;
                const forceDirectionY = dy / distance;
                const maxDistance = MOUSE_REPULSION;
                const force = (maxDistance - distance) / maxDistance;
                const directionX = forceDirectionX * force * 3; // Repulsion strength
                const directionY = forceDirectionY * force * 3;

                this.x -= directionX;
                this.y -= directionY;
            } else {
                // Return to base flow (simple physics)
                if (this.x !== this.baseX) {
                    const dx = this.x - this.baseX;
                    this.x -= dx * 0.03;
                }
                if (this.y !== this.baseY) {
                    const dy = this.y - this.baseY;
                    this.y -= dy * 0.03;
                }
            }

            // Continue base movement
            this.x += this.vx;
            this.y += this.vy;
            this.baseX += this.vx;
            this.baseY += this.vy;

            // Wrap around screen
            if (this.x < 0) {
                this.x = width;
                this.baseX = width;
            }
            if (this.x > width) {
                this.x = 0;
                this.baseX = 0;
            }
            if (this.y < 0) {
                this.y = height;
                this.baseY = height;
            }
            if (this.y > height) {
                this.y = 0;
                this.baseY = 0;
            }
        }

        draw() {
            if (!ctx) return;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle =
                appState.settings.theme === "dark" ? DARK_COLOR : LIGHT_COLOR;
            ctx.fill();
        }
    }

    onMount(() => {
        if (!canvas) return;
        ctx = canvas.getContext("2d");
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            // Re-init particles on resize to prevent clustering
            particles.length = 0;
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                particles.push(new Particle(width, height));
            }
        };

        window.addEventListener("resize", resize);
        resize();

        const handleMouseMove = (e: MouseEvent) => {
            mouse.targetX = e.clientX;
            mouse.targetY = e.clientY;
        };
        window.addEventListener("mousemove", handleMouseMove);

        const animate = () => {
            // Lerp mouse position for smooth trailing
            mouse.currentX += (mouse.targetX - mouse.currentX) * 0.08;
            mouse.currentY += (mouse.targetY - mouse.currentY) * 0.08;

            ctx?.clearRect(0, 0, width, height);

            for (let i = 0; i < particles.length; i++) {
                particles[i].update(width, height);
                particles[i].draw();

                // Draw connections
                for (let j = i; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < CONNECT_DISTANCE) {
                        // Opacity based on distance
                        const opacity = 1 - distance / CONNECT_DISTANCE;
                        if (!ctx) break;
                        ctx.beginPath();

                        // Gradient line for depth
                        // const gradient = ctx.createLinearGradient(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
                        // gradient.addColorStop(0, appState.settings.theme === 'dark' ? 'rgba(192, 132, 252, ' + opacity * 0.2 + ')' : 'rgba(168, 85, 247, ' + opacity * 0.2 + ')');
                        // gradient.addColorStop(1, appState.settings.theme === 'dark' ? 'rgba(148, 163, 184, ' + opacity * 0.2 + ')' : 'rgba(100, 116, 139, ' + opacity * 0.2 + ')');

                        // Simple color for performance
                        ctx.strokeStyle =
                            appState.settings.theme === "dark"
                                ? `rgba(255, 255, 255, ${opacity * 0.25})`
                                : `rgba(0, 0, 0, ${opacity * 0.15})`;
                        ctx.lineWidth = 1;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            animationFrame = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener("resize", resize);
            window.removeEventListener("mousemove", handleMouseMove);
            cancelAnimationFrame(animationFrame);
        };
    });
</script>

<div
    class="fixed inset-0 z-[-1] overflow-hidden bg-[#f0f2f5] dark:bg-black transition-colors duration-700"
>
    <!-- Liquid Blobs (Ambient Layer) -->
    <div
        class="absolute top-0 -left-4 w-96 h-96 bg-purple-300 dark:bg-purple-900/50 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-60 animate-blob"
    ></div>
    <div
        class="absolute top-0 -right-4 w-96 h-96 bg-yellow-200 dark:bg-blue-900/50 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-60 animate-blob animation-delay-2000"
    ></div>
    <div
        class="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300 dark:bg-indigo-900/50 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-60 animate-blob animation-delay-4000"
    ></div>

    <!-- Extra dynamic blob for interaction hint or richness -->
    <div
        class="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-200 dark:bg-cyan-900/40 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-[80px] opacity-50 animate-blob animation-delay-6000"
    ></div>

    <!-- Antigravity Particles (Interactive Layer) -->
    <canvas
        bind:this={canvas}
        class="absolute inset-0 pointer-events-none opacity-60 dark:opacity-80"
    ></canvas>

    <!-- Heavy Grain Overlay for Texture -->
    <div
        class="absolute inset-0 opacity-[0.06] dark:opacity-[0.08] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]"
    ></div>
</div>

<style>
    /* 
      We define animation delay classes here since Tailwind doesn't have them by default 
      without a plugin.
    */
    .animation-delay-2000 {
        animation-delay: 2s;
    }
    .animation-delay-4000 {
        animation-delay: 4s;
    }
    .animation-delay-6000 {
        animation-delay: 6s;
    }
</style>
