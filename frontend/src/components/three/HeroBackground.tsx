'use client';
import { useEffect, useRef } from 'react';

/**
 * Three.js animated particle sphere for the hero section
 * Creates a stunning 3D neural network visualization
 */
export default function HeroBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        let animationFrameId: number;
        let THREE: typeof import('three');

        const init = async () => {
            THREE = await import('three');
            const canvas = canvasRef.current;
            if (!canvas) return;

            const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.z = 3;

            // Create neural network-style particle system
            const particleCount = 3000;
            const positions = new Float32Array(particleCount * 3);
            const colors = new Float32Array(particleCount * 3);
            const sizes = new Float32Array(particleCount);

            const color1 = new THREE.Color('#8b5cf6'); // Purple
            const color2 = new THREE.Color('#06b6d4'); // Cyan

            for (let i = 0; i < particleCount; i++) {
                // Distribute on sphere surface
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                const radius = 1.5 + Math.random() * 0.5;

                positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
                positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
                positions[i * 3 + 2] = radius * Math.cos(phi);

                // Gradient color between purple and cyan
                const t = Math.random();
                const mixedColor = color1.clone().lerp(color2, t);
                colors[i * 3] = mixedColor.r;
                colors[i * 3 + 1] = mixedColor.g;
                colors[i * 3 + 2] = mixedColor.b;

                sizes[i] = Math.random() * 2 + 0.5;
            }

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

            const material = new THREE.PointsMaterial({
                size: 0.015,
                vertexColors: true,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending,
            });

            const particles = new THREE.Points(geometry, material);
            scene.add(particles);

            // Add connection lines (neural network effect)
            const lineGeometry = new THREE.BufferGeometry();
            const linePositions = new Float32Array(300 * 6);
            let lineIndex = 0;

            for (let i = 0; i < 150; i++) {
                const i1 = Math.floor(Math.random() * particleCount);
                const i2 = Math.floor(Math.random() * particleCount);

                linePositions[lineIndex++] = positions[i1 * 3];
                linePositions[lineIndex++] = positions[i1 * 3 + 1];
                linePositions[lineIndex++] = positions[i1 * 3 + 2];
                linePositions[lineIndex++] = positions[i2 * 3];
                linePositions[lineIndex++] = positions[i2 * 3 + 1];
                linePositions[lineIndex++] = positions[i2 * 3 + 2];
            }

            lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

            const lineMaterial = new THREE.LineBasicMaterial({
                color: '#8b5cf6',
                transparent: true,
                opacity: 0.1,
                blending: THREE.AdditiveBlending,
            });

            const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
            scene.add(lines);

            // Mouse interaction
            let mouseX = 0, mouseY = 0;
            const onMouseMove = (e: MouseEvent) => {
                mouseX = (e.clientX / window.innerWidth - 0.5) * 0.5;
                mouseY = (e.clientY / window.innerHeight - 0.5) * 0.5;
            };
            window.addEventListener('mousemove', onMouseMove);

            // Resize handler
            const onResize = () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            };
            window.addEventListener('resize', onResize);

            // Animation loop
            const clock = new THREE.Clock();
            const animate = () => {
                const elapsed = clock.getElapsedTime();

                particles.rotation.y = elapsed * 0.05 + mouseX;
                particles.rotation.x = elapsed * 0.03 - mouseY;
                lines.rotation.y = elapsed * 0.05 + mouseX;
                lines.rotation.x = elapsed * 0.03 - mouseY;

                // Pulsating size
                material.size = 0.015 + Math.sin(elapsed * 2) * 0.003;

                renderer.render(scene, camera);
                animationFrameId = requestAnimationFrame(animate);
            };

            animate();

            return () => {
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('resize', onResize);
                cancelAnimationFrame(animationFrameId);
                renderer.dispose();
                geometry.dispose();
                material.dispose();
            };
        };

        const cleanup = init();
        return () => {
            cancelAnimationFrame(animationFrameId);
            cleanup.then(fn => fn && fn());
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ opacity: 0.7 }}
        />
    );
}
