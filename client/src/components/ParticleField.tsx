/**
 * ParticleField — hella.rich homepage background
 *
 * Design: Cinematic Product Lab
 * Subtle animated dots. Felt more than noticed.
 * Canvas-based, pointer-events:none, reduced motion fallback.
 * Slight cursor parallax. Slow drift. No sparkle. No noise.
 */
import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  opacityTarget: number;
  opacitySpeed: number;
  parallaxFactor: number;
}

const PARTICLE_COUNT = 80;
const MAX_OPACITY = 0.20;
const MIN_OPACITY = 0.03;

export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const rafRef = useRef<number>(0);
  const reducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  useEffect(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const W = () => canvas.width;
    const H = () => canvas.height;

    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.16,
      vy: (Math.random() - 0.5) * 0.10,
      size: 0.7 + Math.random() * 1.1,
      opacity: MIN_OPACITY + Math.random() * (MAX_OPACITY - MIN_OPACITY),
      opacityTarget: MIN_OPACITY + Math.random() * (MAX_OPACITY - MIN_OPACITY),
      opacitySpeed: 0.0006 + Math.random() * 0.001,
      parallaxFactor: Math.random() * 0.35,
    }));

    const onMouse = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    };
    window.addEventListener('mousemove', onMouse);

    const loop = () => {
      ctx.clearRect(0, 0, W(), H());
      const mx = (mouseRef.current.x - 0.5) * 24;
      const my = (mouseRef.current.y - 0.5) * 16;

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = W() + 10;
        if (p.x > W() + 10) p.x = -10;
        if (p.y < -10) p.y = H() + 10;
        if (p.y > H() + 10) p.y = -10;

        // Opacity breathing
        if (Math.abs(p.opacity - p.opacityTarget) < 0.002) {
          p.opacityTarget = MIN_OPACITY + Math.random() * (MAX_OPACITY - MIN_OPACITY);
        }
        p.opacity += (p.opacityTarget - p.opacity) * p.opacitySpeed;

        const px = p.x + mx * p.parallaxFactor;
        const py = p.y + my * p.parallaxFactor;

        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.opacity.toFixed(3)})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, [reducedMotion]);

  if (reducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
