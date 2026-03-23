'use client';
import { useEffect, useRef } from 'react';

/**
 * Cozy Study Background — Paper Texture + Notebook Lines + Hand-drawn Doodles
 * No particles, no neon, no Three.js needed for this version.
 * Uses Canvas 2D for a warm, organic, hand-drawn feel.
 */
export default function HeroBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animFrameId: number;
        let time = 0;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        resize();
        window.addEventListener('resize', resize);

        // Draw hand-drawn style doodles
        const drawWobblyCircle = (cx: number, cy: number, r: number, color: string, lineWidth: number) => {
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            for (let angle = 0; angle <= Math.PI * 2 + 0.3; angle += 0.1) {
                const wobble = Math.sin(angle * 3 + time * 0.3) * (r * 0.04);
                const x = cx + (r + wobble) * Math.cos(angle);
                const y = cy + (r + wobble) * Math.sin(angle);
                if (angle === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        };

        const drawWobblyLine = (x1: number, y1: number, x2: number, y2: number, color: string, lw: number) => {
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = lw;
            ctx.lineCap = 'round';
            const steps = 20;
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const x = x1 + (x2 - x1) * t;
                const y = y1 + (y2 - y1) * t + Math.sin(t * Math.PI * 3 + time * 0.5) * 1.5;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        };

        const drawArrow = (x: number, y: number, angle: number, size: number, color: string) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // Arrow body
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(size, 0);
            ctx.stroke();

            // Arrow head
            ctx.beginPath();
            ctx.moveTo(size - 8, -5);
            ctx.lineTo(size, 0);
            ctx.lineTo(size - 8, 5);
            ctx.stroke();

            ctx.restore();
        };

        const drawStar = (cx: number, cy: number, size: number, color: string) => {
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.2;
            ctx.lineCap = 'round';
            for (let i = 0; i < 4; i++) {
                const angle = (i * Math.PI) / 4;
                ctx.beginPath();
                ctx.moveTo(cx - Math.cos(angle) * size, cy - Math.sin(angle) * size);
                ctx.lineTo(cx + Math.cos(angle) * size, cy + Math.sin(angle) * size);
                ctx.stroke();
            }
        };

        // Doodle positions (stable, computed once)
        const w = canvas.width;
        const h = canvas.height;

        const animate = () => {
            time += 0.005;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const cw = canvas.width;
            const ch = canvas.height;

            // Subtle notebook grid dots
            ctx.fillStyle = 'rgba(45, 41, 38, 0.035)';
            for (let x = 30; x < cw; x += 28) {
                for (let y = 30; y < ch; y += 28) {
                    ctx.beginPath();
                    ctx.arc(x, y, 0.8, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Hand-drawn doodles (very subtle, drift slowly)
            const baseAlpha = 0.04;

            // Wobbly circle top-right
            drawWobblyCircle(
                cw * 0.82 + Math.sin(time * 0.4) * 3,
                ch * 0.18 + Math.cos(time * 0.3) * 2,
                60, `rgba(124, 154, 110, ${baseAlpha + 0.01})`, 1.8
            );

            // Small circle
            drawWobblyCircle(
                cw * 0.15 + Math.sin(time * 0.5) * 2,
                ch * 0.7 + Math.cos(time * 0.4) * 2,
                30, `rgba(212, 165, 116, ${baseAlpha + 0.015})`, 1.5
            );

            // Arrow doodle
            drawArrow(
                cw * 0.72 + Math.sin(time * 0.3) * 2,
                ch * 0.65 + Math.cos(time * 0.4) * 1,
                -0.3, 50, `rgba(45, 41, 38, ${baseAlpha})`
            );

            // Curved underline doodle
            drawWobblyLine(
                cw * 0.1, ch * 0.35,
                cw * 0.3, ch * 0.35,
                `rgba(124, 154, 110, ${baseAlpha + 0.01})`, 1.5
            );

            // Small star doodle
            drawStar(
                cw * 0.9 + Math.cos(time * 0.3) * 2,
                ch * 0.45 + Math.sin(time * 0.5) * 2,
                12, `rgba(212, 165, 116, ${baseAlpha + 0.02})`
            );

            // Another underline
            drawWobblyLine(
                cw * 0.55, ch * 0.85,
                cw * 0.75, ch * 0.85,
                `rgba(45, 41, 38, ${baseAlpha})`, 1.2
            );

            // Tiny circle cluster
            drawWobblyCircle(
                cw * 0.4 + Math.sin(time * 0.6) * 1.5,
                ch * 0.15 + Math.cos(time * 0.4) * 1.5,
                18, `rgba(192, 84, 79, ${baseAlpha})`, 1.2
            );

            animFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ opacity: 1, pointerEvents: 'none' }}
        />
    );
}
