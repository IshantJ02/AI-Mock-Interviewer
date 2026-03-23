'use client';
import { useEffect, useRef } from 'react';

/**
 * Cozy cursor — soft pencil dot + gentle ring
 * Warm, subtle, not aggressive
 */
export default function CustomCursor() {
    const dotRef = useRef<HTMLDivElement>(null);
    const ringRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let mouseX = 0, mouseY = 0;
        let ringX = 0, ringY = 0;

        const onMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;

            if (dotRef.current) {
                dotRef.current.style.left = `${mouseX}px`;
                dotRef.current.style.top = `${mouseY}px`;
            }
        };

        // Smooth, lazy ring follow (like a lazy pen)
        const animateRing = () => {
            ringX += (mouseX - ringX) * 0.1;
            ringY += (mouseY - ringY) * 0.1;

            if (ringRef.current) {
                ringRef.current.style.left = `${ringX}px`;
                ringRef.current.style.top = `${ringY}px`;
            }
            requestAnimationFrame(animateRing);
        };

        const onMouseEnterInteractive = () => {
            if (ringRef.current) {
                ringRef.current.style.width = '48px';
                ringRef.current.style.height = '48px';
                ringRef.current.style.borderColor = 'rgba(124, 154, 110, 0.35)';
            }
            if (dotRef.current) {
                dotRef.current.style.opacity = '0.5';
            }
        };

        const onMouseLeaveInteractive = () => {
            if (ringRef.current) {
                ringRef.current.style.width = '36px';
                ringRef.current.style.height = '36px';
                ringRef.current.style.borderColor = 'rgba(45, 41, 38, 0.15)';
            }
            if (dotRef.current) {
                dotRef.current.style.opacity = '0.7';
            }
        };

        window.addEventListener('mousemove', onMouseMove);
        animateRing();

        const addHoverListeners = () => {
            document.querySelectorAll('a, button, [data-cursor="pointer"], input, select, textarea').forEach(el => {
                el.addEventListener('mouseenter', onMouseEnterInteractive);
                el.addEventListener('mouseleave', onMouseLeaveInteractive);
            });
        };

        addHoverListeners();
        const observer = new MutationObserver(addHoverListeners);
        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            observer.disconnect();
        };
    }, []);

    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
        return null;
    }

    return (
        <>
            <div ref={dotRef} className="custom-cursor hidden md:block" />
            <div ref={ringRef} className="custom-cursor-ring hidden md:block" />
        </>
    );
}
