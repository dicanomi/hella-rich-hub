/**
 * LOW BATTERY — Main Page v9
 *
 * LED positioning fix:
 * - Clean image (no baked LED)
 * - Detector wrapper: position:relative, sized to fill viewport
 * - LED: position:absolute inside wrapper, percentage-based
 * - LED scales and moves WITH the detector at all viewport sizes
 * - No useImageRect, no viewport-relative math
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { FlyCanvas } from '../components/FlyCanvas';
import { StatsPanel } from '../components/StatsPanel';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { useFlySystem } from '../hooks/useFlySystem';

// Clean image — LED painted out, no baked dot
const HERO_IMAGE = '/manus-storage/detector-clean_ad5cd21a.png';

// LED position as % of the full image (1920x1072)
// Placed at 4 o'clock on the smooth plastic ring:
//   - 78% of outer radius from center (well outside vent grille at 57%)
//   - 30 degrees below horizontal-right
//   - Image coords: (1219, 632) = 63.51% x, 58.93% y
const LED_LEFT = '63.51%';
const LED_TOP  = '58.93%';

// Detector geometry as % of image (for fly system)
// Detector center: 50% x, 45% y; outer radius: 20% of image width
const DET_CX_PCT = 0.50;
const DET_CY_PCT = 0.45;
const DET_R_PCT  = 0.20; // fraction of image width

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [wrapperSize, setWrapperSize] = useState({ width: 0, height: 0 });

  const [isNightMode, setIsNightMode] = useState(false);
  const [started, setStarted] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [hintFading, setHintFading] = useState(false);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ledPulse, setLedPulse] = useState(false);
  const [wallPulse, setWallPulse] = useState(false);

  const [ignoredBeepSeconds, setIgnoredBeepSeconds] = useState(0);
  const [sanity, setSanity] = useState(0); // starts at 0%, climbs toward 100% (broken)
  const [fliesSplatted, setFliesSplatted] = useState(0);
  const [replaceBatteryState, setReplaceBatteryState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [showJudgment, setShowJudgment] = useState(false);

  // Detector geometry for fly system — derived from wrapper size
  const detectorCenter = {
    x: wrapperSize.width * DET_CX_PCT,
    y: wrapperSize.height * DET_CY_PCT,
  };
  const detectorRadius = wrapperSize.width * DET_R_PCT;

  // LED size scales with wrapper width
  const ledSize = Math.max(8, wrapperSize.width * 0.009);

  const ambientTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ONE callback — LED + wall pulse + sanity all fire simultaneously with the beep
  const handleChirp = useCallback(() => {
    setLedPulse(true);
    setWallPulse(true);
    setSanity(prev => Math.min(100, prev + 1.2));
    setTimeout(() => setLedPulse(false), 180);
    setTimeout(() => setWallPulse(false), 280);
  }, []);

  const { startEngine, playBuzz, playAmbient } = useAudioEngine({
    muted: false,
    onChirp: handleChirp,
  });

  const handleSplat = useCallback(() => setFliesSplatted(prev => prev + 1), []);
  const handleBuzz = useCallback((d: number) => playBuzz(d), [playBuzz]);

  const { fly, splats, splatFly } = useFlySystem({
    containerWidth: containerSize.width,
    containerHeight: containerSize.height,
    detectorCenterX: detectorCenter.x,
    detectorCenterY: detectorCenter.y,
    detectorRadius,
    onSplat: handleSplat,
    onBuzz: handleBuzz,
  });

  // Measure outer container
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Measure wrapper (the image container)
  useEffect(() => {
    const measure = () => {
      if (wrapperRef.current) {
        setWrapperSize({
          width: wrapperRef.current.offsetWidth,
          height: wrapperRef.current.offsetHeight,
        });
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const interval = setInterval(() => setIgnoredBeepSeconds(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const timer = setTimeout(() => setShowJudgment(true), 20 * 60 * 1000);
    return () => clearTimeout(timer);
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const schedule = () => {
      const delay = 45000 + Math.random() * 90000;
      ambientTimerRef.current = setTimeout(() => {
        const types: Array<'siren' | 'footsteps'> = ['siren', 'footsteps'];
        playAmbient(types[Math.floor(Math.random() * types.length)]);
        schedule();
      }, delay);
    };
    schedule();
    return () => { if (ambientTimerRef.current) clearTimeout(ambientTimerRef.current); };
  }, [started, playAmbient]);


  const handleNightModeToggle = useCallback(() => setIsNightMode(prev => !prev), []);

  const handleReplaceBattery = useCallback(() => {
    if (replaceBatteryState !== 'idle') return;
    setReplaceBatteryState('loading');
    setTimeout(() => setReplaceBatteryState('done'), 1800);
    setTimeout(() => setReplaceBatteryState('idle'), 8000);
  }, [replaceBatteryState]);

  const handleMute = useCallback(() => { /* does nothing */ }, []);

  const handleSurrenderSanity = useCallback(() => {
    setSanity(0);
  }, []);

  // handleBeginIgnoring — same pattern as Space Drone handlePower
  const handleBeginIgnoring = useCallback(async () => {
    if (started) return;
    setHintFading(true);
    hintTimerRef.current = setTimeout(() => setShowHint(false), 650);
    setStarted(true);
    await startEngine();
  }, [started, startEngine]);

  // Spacebar handler — same as Space Drone
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        if (!started) handleBeginIgnoring();
      }
    };
    window.addEventListener('keydown', onKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true });
  }, [started, handleBeginIgnoring]);

  // Cleanup hint timer
  useEffect(() => {
    return () => { if (hintTimerRef.current) clearTimeout(hintTimerRef.current); };
  }, []);

  return (
    <div
      ref={containerRef}
      
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden', // locks scroll for the immersive experience
        cursor: 'default',
        background: '#1a1714',
      }}
    >
      {/* ── Suppress Manus injected section + badge ── */}
      <style>{`
        #root > section { display: none !important; }
        [data-manus-badge], .manus-badge, a[href*="manus.im"]:not([data-keep]),
        [class*="preview-banner"], [class*="PreviewBanner"] {
          display: none !important;
        }
        @keyframes led-blink {
          0%   { opacity: 1; box-shadow: 0 0 8px 4px rgba(232,41,26,0.9), 0 0 20px 10px rgba(232,41,26,0.4); }
          50%  { opacity: 1; box-shadow: 0 0 16px 8px rgba(232,41,26,1),   0 0 36px 18px rgba(232,41,26,0.5); }
          100% { opacity: 0.15; box-shadow: 0 0 4px 2px rgba(232,41,26,0.4); }
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════════
          DETECTOR WRAPPER — position:relative, fills viewport
          The image is objectFit:cover inside this wrapper.
          The LED is position:absolute inside this wrapper.
          Everything scales together.
      ══════════════════════════════════════════════════════════════ */}
      <div
        ref={wrapperRef}
        style={{
          position: 'absolute',
          inset: 0,
          // This wrapper IS the full viewport
        }}
      >
        {/* ── Clean detector image (no baked LED) ── */}
        <img
          src={HERO_IMAGE}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 44%',
            display: 'block',
          }}
        />

        {/* ── Night Mode overlay ── */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(160deg, rgba(6,4,2,0.86) 0%, rgba(12,8,4,0.91) 100%)',
            opacity: isNightMode ? 1 : 0,
            transition: 'opacity 1.0s ease',
            pointerEvents: 'none',
            mixBlendMode: 'multiply',
          }}
        />

        {/* ── Wall shadow pulse on chirp ── */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse 30% 20% at 50% 45%, rgba(255,255,255,0.05) 0%, transparent 100%)`,
            opacity: wallPulse ? 1 : 0,
            transition: wallPulse ? 'opacity 0.04s ease' : 'opacity 0.3s ease',
            pointerEvents: 'none',
          }}
        />

        {/* ══════════════════════════════════════════════════════════
            THE LED — position:absolute INSIDE the wrapper
            left/top are percentages of the wrapper (= image content)
            This is the ONLY correct way to lock it to the detector.
        ══════════════════════════════════════════════════════════ */}

        {/* ONE LED — single element, glow via box-shadow only */}
        <div
          style={{
            position: 'absolute',
            left: LED_LEFT,
            top: LED_TOP,
            width: `${ledSize}px`,
            height: `${ledSize}px`,
            borderRadius: '50%',
            background: '#E8291A',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            animation: ledPulse ? 'led-blink 0.4s ease-out forwards' : undefined,
            boxShadow: ledPulse
              ? undefined
              : `0 0 ${ledSize * 0.8}px ${ledSize * 0.4}px rgba(232,41,26,0.65)`,
          }}
        />

        {/* ── Vignette ── */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.22) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
      {/* ══ end detector wrapper ══ */}

      {/* ── Fly canvas (outside wrapper, over everything) ── */}
      <FlyCanvas fly={fly} splats={splats} onFlyClick={splatFly} />


      {/* ── Night Mode toggle ── */}
      <div style={{ position: 'absolute', top: 'clamp(16px, 3vh, 32px)', right: 'clamp(16px, 3vw, 32px)', zIndex: 10 }}>
        <button
          onClick={(e) => { e.stopPropagation(); handleNightModeToggle(); }}
          className="btn-press"
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 14px',
            background: isNightMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.5)',
            border: `1px solid ${isNightMode ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.15)'}`,
            borderRadius: '20px', cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.25s var(--ease-snap)',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            {isNightMode ? (
              <>
                <circle cx="12" cy="12" r="4" stroke="rgba(255,255,255,0.85)" strokeWidth="2" />
                <line x1="12" y1="2" x2="12" y2="5" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" />
                <line x1="12" y1="19" x2="12" y2="22" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" />
                <line x1="2" y1="12" x2="5" y2="12" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" />
                <line x1="19" y1="12" x2="22" y2="12" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" />
              </>
            ) : (
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            )}
          </svg>
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(9px, 1vw, 11px)',
            fontWeight: 500, letterSpacing: '0.12em',
            color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase',
          }}>
            {isNightMode ? 'DAY MODE' : 'NIGHT MODE'}
          </span>
        </button>
      </div>

      {/* ── LOW BATTERY title — centered, above pill ── */}
      <div style={{
        position: 'absolute',
        top: 'clamp(56px, 7vh, 72px)',  /* comfortably below nav */
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        zIndex: 10,
        pointerEvents: 'none',
      }}>
        <div style={{
          fontFamily: "'ArenaGraffiti', 'GraffitiCity', 'Permanent Marker', cursive",
          fontSize: 'clamp(2rem, 5vw, 4rem)',
          fontWeight: 400,
          color: 'rgba(255,255,255,0.92)',
          letterSpacing: '0.02em',
          lineHeight: 1,
          textAlign: 'center',
        }}>
          LOW BATTERY
        </div>
      </div>

      {/* ── Start pill — centered between title and detector ── */}
      {showHint && (
        <button
          onClick={handleBeginIgnoring}
          style={{
            position: 'absolute',
            top: 'clamp(120px, 16vh, 180px)',  /* below nav + title, above detector */
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 30,
            fontFamily: "'DM Mono', monospace",
            fontSize: 'clamp(10px, 1.1vw, 13px)',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#F0EDE8',
            background: 'oklch(0.18 0.008 65 / 0.88)',
            border: '1.5px solid rgba(232,41,26,0.6)',
            borderRadius: '100px',
            padding: '12px 28px',
            cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: '0 0 24px rgba(232,41,26,0.2), 0 4px 16px rgba(0,0,0,0.5)',
            opacity: hintFading ? 0 : 1,
            transition: 'opacity 0.65s ease, box-shadow 0.2s ease, border-color 0.2s ease',
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.boxShadow = '0 0 36px rgba(232,41,26,0.35), 0 4px 20px rgba(0,0,0,0.6)';
            e.currentTarget.style.borderColor = 'rgba(232,41,26,0.85)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = '0 0 24px rgba(232,41,26,0.2), 0 4px 16px rgba(0,0,0,0.5)';
            e.currentTarget.style.borderColor = 'rgba(232,41,26,0.6)';
          }}
        >
          PRESS SPACE OR TAP PLAY
          <div style={{
            fontSize: 'clamp(8px, 0.85vw, 10px)',
            letterSpacing: '0.14em',
            color: 'rgba(232,41,26,0.8)',
            opacity: 0.9,
            marginTop: 6,
            textAlign: 'center',
          }}>
            BEGIN IGNORING
          </div>
        </button>
      )}

      {/* ── ONE stats panel ── */}
      {containerSize.width > 0 && (
        <StatsPanel
          ignoredBeepSeconds={ignoredBeepSeconds}
          sanity={sanity}
          isNightMode={isNightMode}
          onNightModeToggle={handleNightModeToggle}
          onReplaceBattery={handleReplaceBattery}
          onMute={handleMute}
          isMuted={false}
          replaceBatteryState={replaceBatteryState}
          showJudgment={showJudgment}
          onSurrenderSanity={handleSurrenderSanity}
        />
      )}

    </div>
  );
}
