/**
 * LOW BATTERY — Smoke Layer v4
 * Design: Braun + Teenage Engineering industrial restraint
 *
 * Cursor-reactive animated weed smoke.
 * - Particles drift upward naturally
 * - Mouse/touch creates a soft radial airflow push
 * - Chirp creates a brief outward ripple
 * - Seamless looping, no stutter, no memory leaks
 * - Performant: only animates opacity + transform, uses rAF
 */

import { useCallback, useEffect, useRef } from 'react';

interface SmokeLayerProps {
  isNightMode: boolean;
  chirpPulse: boolean;
}

interface Particle {
  // Position
  x: number;
  y: number;
  // Base velocity (natural drift)
  vx: number;
  vy: number;
  // Extra velocity from cursor/chirp influence
  evx: number;
  evy: number;
  // Visual
  radius: number;
  opacity: number;
  maxOpacity: number;
  // Life cycle 0..1
  life: number;
  lifeSpeed: number;
  // Sinusoidal wobble
  wobble: number;
  wobbleSpeed: number;
  wobbleAmp: number;
  // Ellipse shape for wispy look
  scaleX: number;
  scaleY: number;
  rotation: number;
  rotSpeed: number;
  // Depth layer
  layer: number;
}

const NUM_PARTICLES = 32;
// Cursor influence radius (fraction of canvas width)
const CURSOR_RADIUS_FRAC = 0.22;
// Max push strength per frame
const CURSOR_PUSH = 0.35;
// Chirp ripple strength
const CHIRP_PUSH = 0.7;

function makeParticle(w: number, h: number, isInitial: boolean, night: boolean): Particle {
  const layer = Math.floor(Math.random() * 3);
  const spawnX = w * (0.04 + Math.random() * 0.92);
  const spawnY = isInitial
    ? h * (0.04 + Math.random() * 0.92)
    : h * (0.42 + Math.random() * 0.52);

  const baseRadius = 55 + Math.random() * 95 + layer * 18;
  const baseMaxOpacity = night
    ? 0.15 + Math.random() * 0.14
    : 0.12 + Math.random() * 0.13;

  return {
    x: spawnX,
    y: spawnY,
    vx: (Math.random() - 0.5) * 0.25,
    vy: -(0.07 + Math.random() * 0.15),
    evx: 0,
    evy: 0,
    radius: baseRadius,
    opacity: isInitial ? baseMaxOpacity * Math.random() : 0,
    maxOpacity: baseMaxOpacity,
    life: isInitial ? Math.random() : 0,
    lifeSpeed: 0.0005 + Math.random() * 0.0009,
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.001 + Math.random() * 0.0025,
    wobbleAmp: 0.2 + Math.random() * 0.5,
    scaleX: 0.65 + Math.random() * 0.75,
    scaleY: 1.0 + Math.random() * 1.1,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.0018,
    layer,
  };
}

export function SmokeLayer({ isNightMode, chirpPulse }: SmokeLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);
  const nightRef = useRef(isNightMode);
  const sizeRef = useRef({ w: 0, h: 0 });

  // Cursor state — smoothed position
  const cursorRef = useRef({ x: -9999, y: -9999, active: false });
  const smoothCursorRef = useRef({ x: -9999, y: -9999 });

  // Chirp ripple origin
  const chirpRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0, y: 0, active: false,
  });

  useEffect(() => { nightRef.current = isNightMode; }, [isNightMode]);

  // Chirp: fire a radial push from detector center
  useEffect(() => {
    if (!chirpPulse) return;
    const { w, h } = sizeRef.current;
    chirpRef.current = { x: w * 0.5, y: h * 0.42, active: true };
    // Apply immediate impulse to all particles
    particlesRef.current.forEach(p => {
      const dx = p.x - w * 0.5;
      const dy = p.y - h * 0.42;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const falloff = Math.max(0, 1 - dist / (w * 0.4));
      const push = CHIRP_PUSH * falloff;
      p.evx += (dx / dist) * push;
      p.evy += (dy / dist) * push;
    });
    setTimeout(() => { chirpRef.current.active = false; }, 400);
  }, [chirpPulse]);

  const initParticles = useCallback((w: number, h: number) => {
    particlesRef.current = Array.from({ length: NUM_PARTICLES }, () =>
      makeParticle(w, h, true, nightRef.current)
    );
  }, []);

  // Mouse / touch handlers
  useEffect(() => {
    const handleMove = (x: number, y: number) => {
      cursorRef.current = { x, y, active: true };
    };
    const handleLeave = () => {
      cursorRef.current = { x: -9999, y: -9999, active: false };
    };

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onTouchEnd = () => handleLeave();
    const onMouseLeave = () => handleLeave();

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('mouseleave', onMouseLeave, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = w;
      canvas.height = h;
      sizeRef.current = { w, h };
      if (particlesRef.current.length === 0 && w > 0 && h > 0) {
        initParticles(w, h);
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      const { w, h } = sizeRef.current;
      if (w === 0 || h === 0) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      if (particlesRef.current.length === 0) {
        initParticles(w, h);
      }

      // Smooth cursor interpolation (lerp toward raw cursor)
      const raw = cursorRef.current;
      const smooth = smoothCursorRef.current;
      if (raw.active) {
        smooth.x += (raw.x - smooth.x) * 0.08;
        smooth.y += (raw.y - smooth.y) * 0.08;
      }

      const cursorRadius = w * CURSOR_RADIUS_FRAC;

      ctx.clearRect(0, 0, w, h);

      // Sort back-to-front by layer for depth
      const sorted = [...particlesRef.current].sort((a, b) => a.layer - b.layer);

      for (const p of sorted) {
        // Age
        p.life += p.lifeSpeed;

        // Opacity envelope
        let targetOpacity: number;
        if (p.life < 0.18) {
          targetOpacity = p.maxOpacity * (p.life / 0.18);
        } else if (p.life < 0.72) {
          targetOpacity = p.maxOpacity;
        } else {
          targetOpacity = p.maxOpacity * (1 - (p.life - 0.72) / 0.28);
        }
        p.opacity += (targetOpacity - p.opacity) * 0.025;

        // Wobble
        p.wobble += p.wobbleSpeed;
        const wobbleX = Math.sin(p.wobble) * p.wobbleAmp;

        // Cursor influence — soft radial push
        if (raw.active) {
          const dx = p.x - smooth.x;
          const dy = p.y - smooth.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < cursorRadius) {
            // Falloff: strong near cursor, zero at edge
            const falloff = Math.pow(1 - dist / cursorRadius, 2);
            const push = CURSOR_PUSH * falloff;
            // Push away from cursor
            p.evx += (dx / dist) * push * 0.06;
            p.evy += (dy / dist) * push * 0.06;
          }
        }

        // Decay extra velocity
        p.evx *= 0.94;
        p.evy *= 0.94;

        // Rotation
        p.rotation += p.rotSpeed;

        // Move
        p.x += p.vx + wobbleX + p.evx;
        p.y += p.vy + p.evy;

        // Expand
        p.radius += 0.035;

        // Respawn
        if (p.life >= 1 || p.y < -p.radius * 2 || p.x < -p.radius * 2 || p.x > w + p.radius * 2) {
          Object.assign(p, makeParticle(w, h, false, nightRef.current));
          continue;
        }

        if (p.opacity < 0.003) continue;

        // Draw wispy elliptical smoke puff
        const night = nightRef.current;
        const r = night ? 208 : 225;
        const g = night ? 198 : 218;
        const b = night ? 186 : 208;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.scale(p.scaleX, p.scaleY);

        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.radius);
        grad.addColorStop(0,    `rgba(${r},${g},${b},${p.opacity})`);
        grad.addColorStop(0.28, `rgba(${r},${g},${b},${p.opacity * 0.72})`);
        grad.addColorStop(0.58, `rgba(${r},${g},${b},${p.opacity * 0.35})`);
        grad.addColorStop(0.82, `rgba(${r},${g},${b},${p.opacity * 0.1})`);
        grad.addColorStop(1,    `rgba(${r},${g},${b},0)`);

        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [initParticles]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 2,
        filter: 'blur(3.5px)',
        opacity: isNightMode ? 0.85 : 0.78,
        transition: 'opacity 1.2s ease',
      }}
    />
  );
}
