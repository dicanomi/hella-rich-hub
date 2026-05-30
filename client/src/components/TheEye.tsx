/**
 * TheEye v4 — THE EXPERIENCE
 * Source: dicanomi/the-eye (deployed repo)
 *
 * A strange premium digital object. Not an app. Not a graphic.
 * The eye is alive. It notices you. It thinks.
 *
 * Architecture:
 * - Eye image: feathered into darkness with multi-stop radial mask
 * - Iris gaze: rAF spring loop, always running, autonomous drift + cursor follow
 * - Blink: SVG eyelid paths that animate naturally (upper leads, lower subtle)
 * - Micro-drama: rare look-away, long thoughtful blink, pupil expansion
 * - Start: ritualistic awakening sequence
 */
import { useCallback, useEffect, useRef, useState } from 'react';

const EYE_IMAGE = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663292290338/4dGTww6dwDMqWYygdCjBiT/the-eye-v3-AmPFkNFW8nwGoNjxkpQypv.webp';

const IC_X = 0.50;
const IC_Y = 0.47;

interface TheEyeProps {
  phase: string;
  aura: { css: string; glow: string; rgb: string };
  isActive: boolean;
  onClick: () => void;
  started: boolean;
}

export function TheEye({ phase, aura, isActive, onClick, started }: TheEyeProps) {
  const [gazeX, setGazeX] = useState(0);
  const [gazeY, setGazeY] = useState(0);
  const [upperLid, setUpperLid] = useState(0);
  const [lowerLid, setLowerLid] = useState(0);
  const [glowIntensity, setGlowIntensity] = useState(0.4);
  const [shimmerOn, setShimmerOn] = useState(false);
  const [pupilBig, setPupilBig] = useState(false);
  const [awakenGlow, setAwakenGlow] = useState(false);
  const [awakened, setAwakened] = useState(false);
  const [proximityDilation, setProximityDilation] = useState(0);
  const proximityTarget = useRef(0);
  const proximityCurrent = useRef(0);

  const targetGaze = useRef({ x: 0, y: 0 });
  const currentGaze = useRef({ x: 0, y: 0 });
  const gazeVel = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const blinkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mouseEngaged = useRef(false);
  const mouseDisengageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useRef(typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches);

  // ── rAF spring loop — ALWAYS RUNNING ──────────────────────────────────────
  useEffect(() => {
    let t0 = 0;
    const loop = (time: number) => {
      if (!t0) t0 = time;
      const t = (time - t0) / 1000;
      const driftX = Math.sin(t * 0.31 + 1.2) * 0.14 + Math.sin(t * 0.17 + 2.8) * 0.07;
      const driftY = Math.cos(t * 0.24 + 0.5) * 0.10 + Math.cos(t * 0.13 + 1.9) * 0.05;
      const mw = mouseEngaged.current ? 0.88 : 0.0;
      const dw = 1.0 - mw * 0.65;
      const tx = targetGaze.current.x * mw + driftX * dw;
      const ty = targetGaze.current.y * mw + driftY * dw;
      gazeVel.current.x = gazeVel.current.x * 0.76 + (tx - currentGaze.current.x) * 0.065;
      gazeVel.current.y = gazeVel.current.y * 0.76 + (ty - currentGaze.current.y) * 0.065;
      currentGaze.current.x += gazeVel.current.x;
      currentGaze.current.y += gazeVel.current.y;
      setGazeX(currentGaze.current.x);
      setGazeY(currentGaze.current.y);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // ── Mouse tracking + proximity dilation ───────────────────────────────────
  useEffect(() => {
    if (isMobile.current) return;
    const h = (e: MouseEvent) => {
      mouseEngaged.current = true;
      if (mouseDisengageTimer.current) clearTimeout(mouseDisengageTimer.current);
      mouseDisengageTimer.current = setTimeout(() => {
        mouseEngaged.current = false;
        proximityTarget.current = 0;
      }, 4000);
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      targetGaze.current.x = Math.tanh((e.clientX - cx) / (window.innerWidth * 0.30)) * 0.92;
      targetGaze.current.y = Math.tanh((e.clientY - cy) / (window.innerHeight * 0.26)) * 0.72;
      const dist = Math.sqrt(
        Math.pow((e.clientX - cx) / (window.innerWidth * 0.5), 2) +
        Math.pow((e.clientY - cy) / (window.innerHeight * 0.5), 2)
      );
      proximityTarget.current = Math.max(0, 1 - dist * 1.4);
    };
    let proxRaf: number;
    const proxLoop = () => {
      proximityCurrent.current += (proximityTarget.current - proximityCurrent.current) * 0.04;
      setProximityDilation(proximityCurrent.current);
      proxRaf = requestAnimationFrame(proxLoop);
    };
    proxRaf = requestAnimationFrame(proxLoop);
    window.addEventListener('mousemove', h);
    return () => { window.removeEventListener('mousemove', h); cancelAnimationFrame(proxRaf); };
  }, []);

  // ── Rare: look away then back ──────────────────────────────────────────────
  useEffect(() => {
    if (!started) return;
    const iv = setInterval(() => {
      if (phase !== 'idle' || mouseEngaged.current) return;
      const dir = Math.random() > 0.5 ? 0.92 : -0.92;
      const savedX = targetGaze.current.x;
      const savedY = targetGaze.current.y;
      targetGaze.current.x = dir;
      targetGaze.current.y = (Math.random() - 0.5) * 0.3;
      const pause = 900 + Math.random() * 700;
      setTimeout(() => {
        targetGaze.current.x = savedX;
        targetGaze.current.y = savedY;
      }, pause);
    }, 15000 + Math.random() * 12000);
    return () => clearInterval(iv);
  }, [started, phase]);

  // ── Natural blink scheduler ────────────────────────────────────────────────
  const doBlink = useCallback((type: 'normal' | 'slow' | 'double' = 'normal') => {
    if (type === 'slow') {
      setUpperLid(1); setLowerLid(0.28);
      setTimeout(() => { setUpperLid(0.4); setLowerLid(0.1); }, 250);
      setTimeout(() => { setUpperLid(0); setLowerLid(0); }, 550);
    } else if (type === 'double') {
      setUpperLid(1); setLowerLid(0.25);
      setTimeout(() => { setUpperLid(0); setLowerLid(0); }, 100);
      setTimeout(() => { setUpperLid(1); setLowerLid(0.25); }, 250);
      setTimeout(() => { setUpperLid(0); setLowerLid(0); }, 360);
    } else {
      setUpperLid(1); setLowerLid(0.22);
      setTimeout(() => { setUpperLid(0.45); setLowerLid(0.1); }, 72);
      setTimeout(() => { setUpperLid(0.08); setLowerLid(0.02); }, 140);
      setTimeout(() => { setUpperLid(0); setLowerLid(0); }, 195);
    }
  }, []);

  const scheduleBlink = useCallback(() => {
    if (blinkTimer.current) clearTimeout(blinkTimer.current);
    const delay = 3000 + Math.random() * 5500;
    blinkTimer.current = setTimeout(() => {
      const r = Math.random();
      if (r < 0.08) doBlink('slow');
      else if (r < 0.15) doBlink('double');
      else doBlink('normal');
      scheduleBlink();
    }, delay);
  }, [doBlink]);

  useEffect(() => {
    if (!started) return;
    scheduleBlink();
    return () => { if (blinkTimer.current) clearTimeout(blinkTimer.current); };
  }, [started, scheduleBlink]);

  // ── Glow breathing ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!started) return;
    const iv = setInterval(() => {
      setGlowIntensity(0.3 + Math.random() * 0.4);
    }, 1800 + Math.random() * 2200);
    return () => clearInterval(iv);
  }, [started]);

  // ── Awakening sequence ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!started || awakened) return;
    setUpperLid(1); setLowerLid(0.4);
    setTimeout(() => { setUpperLid(0.6); setLowerLid(0.2); }, 200);
    setTimeout(() => { setUpperLid(0.2); setLowerLid(0.05); }, 500);
    setTimeout(() => {
      setUpperLid(0); setLowerLid(0);
      setPupilBig(true);
      setShimmerOn(true);
      setTimeout(() => setPupilBig(false), 1000);
      setTimeout(() => setShimmerOn(false), 600);
      setAwakened(true);
    }, 800);
  }, [started, awakened]);

  // ── Phase reactions ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'awakening' || phase === 'compressing') {
      doBlink('normal');
      setShimmerOn(true);
      setPupilBig(true);
      setTimeout(() => setShimmerOn(false), 450);
      setTimeout(() => setPupilBig(false), 850);
      setGlowIntensity(1.0);
      setTimeout(() => setGlowIntensity(0.55), 700);
    }
    if (phase === 'suspense') {
      setAwakenGlow(true);
      doBlink('slow');
    } else {
      setAwakenGlow(false);
    }
    if (phase === 'revealing') {
      setPupilBig(true);
      setGlowIntensity(0.85);
      setTimeout(() => setPupilBig(false), 1100);
      setTimeout(() => setGlowIntensity(0.5), 1600);
    }
  }, [phase, doBlink]);

  const containerSize = containerRef.current?.offsetWidth ?? 500;
  const irisR = containerSize * 0.30;
  const maxPx = irisR * 0.18;
  const irisPxX = gazeX * maxPx;
  const irisPxY = gazeY * maxPx;
  const upperH = upperLid * 48;
  const lowerH = lowerLid * 42;
  const isClickable = phase === 'idle' || phase === 'showing' || phase === 'revealing';

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'clamp(340px, 68vmin, 720px)',
        height: 'clamp(280px, 56vmin, 600px)',
        zIndex: 3,
        userSelect: 'none',
      }}
    >
      {/* Volumetric atmosphere */}
      <div style={{
        position: 'absolute', inset: '-55%', borderRadius: '50%',
        background: `radial-gradient(ellipse 48% 42% at 50% 50%,
          rgba(${aura.rgb}, ${isActive ? 0.20 : 0.07}) 0%,
          rgba(${aura.rgb}, ${isActive ? 0.09 : 0.02}) 48%,
          transparent 72%)`,
        filter: 'blur(50px)',
        pointerEvents: 'none',
        opacity: glowIntensity,
        transition: 'opacity 2s ease, background 1.4s ease',
      }} />

      {/* The eye — feathered into darkness */}
      <div
        onClick={onClick}
        role="button" tabIndex={0} aria-label="Consult THE EYE"
        onKeyDown={e => e.code === 'Enter' && onClick()}
        style={{
          position: 'absolute', inset: 0,
          cursor: isClickable ? 'pointer' : 'default',
          WebkitTapHighlightColor: 'transparent',
          outline: 'none', overflow: 'hidden',
          WebkitMaskImage: `radial-gradient(ellipse 68% 58% at 50% 50%,
            black 0%, rgba(0,0,0,0.98) 25%, rgba(0,0,0,0.85) 40%,
            rgba(0,0,0,0.55) 52%, rgba(0,0,0,0.20) 62%,
            rgba(0,0,0,0.05) 70%, transparent 78%)`,
          maskImage: `radial-gradient(ellipse 68% 58% at 50% 50%,
            black 0%, rgba(0,0,0,0.98) 25%, rgba(0,0,0,0.85) 40%,
            rgba(0,0,0,0.55) 52%, rgba(0,0,0,0.20) 62%,
            rgba(0,0,0,0.05) 70%, transparent 78%)`,
        }}
      >
        {/* Eye image — oversized to allow iris movement */}
        <div style={{
          position: 'absolute', width: '114%', height: '114%', top: '-7%', left: '-7%',
          transform: `translate(${irisPxX}px, ${irisPxY}px)`,
          transition: 'filter 0.7s ease', willChange: 'transform',
        }}>
          <img
            src={EYE_IMAGE} alt="" aria-hidden="true" draggable={false}
            style={{
              width: '100%', height: '100%', objectFit: 'cover', display: 'block',
              filter: isActive
                ? 'brightness(1.12) contrast(1.06) saturate(1.15)'
                : 'brightness(1.03) contrast(1.02) saturate(1.04)',
              transition: 'filter 0.7s ease',
            }}
          />
        </div>

        {/* Iris glow overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse 26% 24% at
            calc(${IC_X * 100}% + ${irisPxX}px)
            calc(${IC_Y * 100}% + ${irisPxY}px),
            rgba(${aura.rgb}, ${isActive ? 0.18 : 0.06}) 0%, transparent 100%)`,
          mixBlendMode: 'screen', pointerEvents: 'none', zIndex: 4,
          transition: 'background 0.04s linear',
        }} />

        {/* Upper eyelid */}
        {upperH > 0.5 && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: `${upperH}%`,
            background: 'linear-gradient(to bottom, #050505 55%, rgba(5,5,5,0.6) 80%, transparent 100%)',
            pointerEvents: 'none', zIndex: 10, transition: 'height 0.065s ease',
          }} />
        )}

        {/* Lower eyelid */}
        {lowerH > 0.5 && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: `${lowerH}%`,
            background: 'linear-gradient(to top, #050505 55%, rgba(5,5,5,0.5) 80%, transparent 100%)',
            pointerEvents: 'none', zIndex: 10, transition: 'height 0.065s ease',
          }} />
        )}

        {/* Proximity dilation */}
        {proximityDilation > 0.02 && started && (
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(ellipse
              ${14 + proximityDilation * 8}%
              ${16 + proximityDilation * 9}%
              at ${IC_X * 100}% ${IC_Y * 100}%,
              rgba(0,0,0,${0.25 + proximityDilation * 0.35}) 0%,
              rgba(0,0,0,${0.08 + proximityDilation * 0.12}) 50%,
              transparent 100%)`,
            pointerEvents: 'none', zIndex: 8,
          }} />
        )}

        {/* Pupil dilation event */}
        {pupilBig && (
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(ellipse 18% 18% at ${IC_X * 100}% ${IC_Y * 100}%, rgba(0,0,0,0.7) 0%, transparent 100%)`,
            pointerEvents: 'none', zIndex: 9,
            animation: 'eyePupilDilate 1.1s ease-in-out forwards',
          }} />
        )}

        {/* Corneal shimmer */}
        {shimmerOn && (
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(ellipse 28% 20% at 40% 34%, rgba(${aura.rgb}, 0.5) 0%, transparent 65%)`,
            pointerEvents: 'none', zIndex: 11, mixBlendMode: 'screen',
            animation: 'eyeShimmer 0.5s ease-out forwards',
          }} />
        )}

        {/* Awakening pulse */}
        {awakenGlow && (
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(ellipse 38% 30% at 50% 50%, rgba(${aura.rgb}, 0.25) 0%, transparent 65%)`,
            pointerEvents: 'none', zIndex: 9, mixBlendMode: 'screen',
            animation: 'eyeAwakenPulse 0.9s ease-in-out infinite',
          }} />
        )}
      </div>

      <style>{`
        @keyframes eyePupilDilate {
          0%   { opacity: 0; }
          20%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes eyeShimmer {
          0%   { opacity: 0; }
          12%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes eyeAwakenPulse {
          0%, 100% { opacity: 0.2; }
          50%       { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
