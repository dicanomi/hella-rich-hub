import { useEffect, useRef } from 'react';

const POINT_COUNT = 96;
const RINGS = [
  { color: '#ff304f', radius: 0.34, phase: 0.2, speed: 0.86, opacity: 0.82 },
  { color: '#2dfdff', radius: 0.4, phase: 1.35, speed: -0.72, opacity: 0.78 },
  { color: '#f7f3ea', radius: 0.37, phase: 2.4, speed: 0.58, opacity: 0.88 },
];

export function HellaChatMark() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let animationFrame = 0;

    const resize = () => {
      const size = canvas.parentElement?.clientWidth || 30;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(size * pixelRatio);
      canvas.height = Math.round(size * pixelRatio);
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const scheduleDraw = () => {
      if (!reducedMotion && !document.hidden) {
        animationFrame = window.requestAnimationFrame(draw);
      }
    };

    const draw = () => {
      const size = canvas.clientWidth || 30;
      const center = size / 2;
      const scale = size * 0.78;
      context.clearRect(0, 0, size, size);
      context.lineWidth = Math.max(0.85, size / 30);

      RINGS.forEach((ring, ringIndex) => {
        const variant = ring.phase + frame * ring.speed;
        const tilt = 0.92 + Math.sin(frame * 0.54 + ringIndex) * 0.1;
        const rotation = variant * 0.04;
        context.beginPath();

        for (let index = 0; index <= POINT_COUNT; index += 1) {
          const angle = (index / POINT_COUNT) * Math.PI * 2;
          const pulse = Math.sin(angle * 4 + variant) * 0.006;
          const radius = ring.radius + pulse;
          const x = Math.cos(angle + rotation) * radius;
          const y = Math.sin(angle + rotation) * radius * tilt;
          const px = center + x * scale;
          const py = center + y * scale;
          if (index === 0) context.moveTo(px, py);
          else context.lineTo(px, py);
        }

        context.closePath();
        context.strokeStyle = ring.color;
        context.globalAlpha = ring.opacity;
        context.stroke();
      });

      context.globalAlpha = 1;
      if (!reducedMotion) {
        frame += 0.016;
        scheduleDraw();
      }
    };

    const handleResize = () => {
      resize();
      if (reducedMotion) draw();
    };

    const handleVisibilityChange = () => {
      window.cancelAnimationFrame(animationFrame);
      if (!document.hidden) scheduleDraw();
    };

    resize();
    draw();
    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" />;
}
