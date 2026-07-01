/**
 * THE_MACHINE.EXE — Audio Controls
 *
 * 1. MachineAudioToggle — small PLAY/PAUSE control for the background Machine synth.
 *    Default OFF, persisted by the parent, 500ms fade handled by the sound engine.
 *
 * 2. ReferenceSignal — a small floating YouTube video that opens when the user clicks
 *    REFERENCE SIGNAL. No TV shell — just the video in a minimal draggable panel with a
 *    thin drag bar and a clear close button, floating above every layer on the page.
 *    The player is pre-created on mount so playback starts from WITHIN the click gesture
 *    (unMute + playVideo), which is what lets the browser play it WITH SOUND. Draggable,
 *    closable, reopens from the button, remembers its position for the session. Nothing
 *    is downloaded, ripped, hidden, or opened in a new tab.
 */
import { useEffect, useRef, useState, useCallback } from 'react';

const REFERENCE_VIDEO_ID = 'e7rU8EVlgC8';
const VIDEO_WIDTH = 300;                                  // px — small
const VIDEO_HEIGHT = Math.round((VIDEO_WIDTH * 9) / 16);  // 16:9
const HANDLE_H = 26;                                      // drag bar height
const PANEL_H = HANDLE_H + VIDEO_HEIGHT;

// Analog-noise texture (SVG turbulence) reused for grain + static bursts
const NOISE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='rn'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23rn)'/%3E%3C/svg%3E";

// Analog broadcast CSS — visual only, applied over the (cross-origin) video
const FX_CSS = `
.rs-video{position:relative;overflow:hidden;background:#000;border-radius:6px;}
.rs-screen{position:absolute;inset:0;overflow:hidden;transform:scale(1.05);will-change:filter,transform;}
.rs-screen iframe{position:absolute;inset:0;width:100%!important;height:100%!important;border:0;}
.rs-l{position:absolute;inset:0;pointer-events:none;}
.rs-tint{background:linear-gradient(rgba(255,168,74,0.10),rgba(70,230,130,0.06));mix-blend-mode:overlay;}
.rs-glow{background:radial-gradient(ellipse at 50% 42%,rgba(255,190,110,0.14),transparent 68%);mix-blend-mode:screen;}
.rs-roll{top:0;left:0;right:0;height:220%;background:linear-gradient(to bottom,transparent 0%,rgba(255,255,255,0.05) 44%,rgba(255,255,255,0.12) 50%,rgba(0,0,0,0.12) 53%,transparent 60%);}
.rs-scan{background:repeating-linear-gradient(to bottom,rgba(0,0,0,0) 0,rgba(0,0,0,0) 1px,rgba(0,0,0,0.30) 2px,rgba(0,0,0,0.30) 3px);mix-blend-mode:multiply;}
.rs-grain{background-image:url("${NOISE}");background-size:130px 130px;opacity:0.12;mix-blend-mode:overlay;}
.rs-scratch{background-image:repeating-linear-gradient(to right,transparent 0,transparent 70px,rgba(255,255,255,0.06) 71px,transparent 72px,transparent 150px);opacity:0.22;}
.rs-vig{box-shadow:inset 0 0 34px 10px rgba(0,0,0,0.85);background:radial-gradient(ellipse at center,transparent 52%,rgba(0,0,0,0.55) 100%);border-radius:inherit;}
.rs-band{left:0;right:0;height:16px;top:-12%;opacity:0;background:linear-gradient(to bottom,transparent,rgba(255,255,255,0.20) 40%,rgba(255,255,255,0.30) 50%,rgba(0,0,0,0.22) 60%,transparent);mix-blend-mode:screen;}
.rs-flash{background:#fff;opacity:0;mix-blend-mode:screen;}
.rs-static{background-image:url("${NOISE}");background-size:110px 110px;opacity:0;mix-blend-mode:screen;}
.rs-loss{background:#050403;opacity:0;}
/* Animations run ONLY while the window is open (rs-live) — no CPU cost when closed */
.rs-live .rs-screen{animation:rsGrade 6.5s ease-in-out infinite, rsJit 0.18s steps(2) infinite;}
.rs-live .rs-roll{animation:rsRoll 8s linear infinite;}
.rs-live .rs-scan{animation:rsScan 7s linear infinite;}
.rs-live .rs-grain{animation:rsGrain 0.5s steps(4) infinite;}
.rs-live .rs-scratch{animation:rsScratch 6s linear infinite;}
.rs-live .rs-static{animation:rsGrain 0.12s steps(4) infinite;}
.rs-live.rs-unstable .rs-roll{animation-duration:1.1s;}
.rs-live.rs-unstable .rs-screen{animation-duration:5s,0.06s;}
.rs-live.rs-glitch .rs-roll{animation-duration:0.5s;}
.rs-live.rs-glitch .rs-screen{animation-duration:5s,0.05s;}
@keyframes rsRoll{from{transform:translateY(-55%)}to{transform:translateY(0%)}}
@keyframes rsScan{from{background-position:0 0}to{background-position:0 4px}}
@keyframes rsGrain{0%{background-position:0 0}25%{background-position:-40px 30px}50%{background-position:60px -20px}75%{background-position:-30px 50px}100%{background-position:20px 20px}}
@keyframes rsScratch{from{background-position:0 0}to{background-position:150px 0}}
@keyframes rsJit{0%{transform:translate(0,0) scale(1.05)}50%{transform:translate(-0.5px,0.3px) scale(1.05)}100%{transform:translate(0.5px,-0.3px) scale(1.05)}}
@keyframes rsGrade{0%{filter:sepia(.4) saturate(1.5) contrast(1.18) brightness(1.00) hue-rotate(-10deg)}35%{filter:sepia(.44) saturate(1.6) contrast(1.22) brightness(1.07) hue-rotate(-6deg)}65%{filter:sepia(.38) saturate(1.45) contrast(1.16) brightness(0.96) hue-rotate(-14deg)}100%{filter:sepia(.4) saturate(1.5) contrast(1.18) brightness(1.00) hue-rotate(-10deg)}}
`;

// ── 1. Machine synth PLAY/PAUSE toggle ───────────────────────────────────────
export function MachineAudioToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const color = on ? '#FFA84A' : '#B8B2A7';
  const border = on ? 'rgba(255,168,74,0.35)' : 'rgba(244,241,234,0.14)';
  return (
    <button
      onClick={onToggle}
      aria-label={on ? 'Pause machine sound' : 'Play machine sound'}
      title={on ? 'Machine sound: on' : 'Machine sound: off'}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        background: 'none', border: `1px solid ${border}`, cursor: 'pointer',
        padding: '4px 9px',
        fontFamily: "'DM Mono', monospace", fontSize: 'clamp(7px,0.7vw,9px)',
        letterSpacing: '0.18em', color, textTransform: 'uppercase',
        transition: 'color 0.2s, border-color 0.2s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#F4F1EA'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(244,241,234,0.3)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = color; (e.currentTarget as HTMLElement).style.borderColor = border; }}
    >
      {on ? (
        <svg width="8" height="9" viewBox="0 0 8 9" fill="currentColor" aria-hidden="true"><rect x="0" y="0" width="3" height="9" /><rect x="5" y="0" width="3" height="9" /></svg>
      ) : (
        <svg width="8" height="9" viewBox="0 0 8 9" fill="currentColor" aria-hidden="true"><polygon points="0,0 8,4.5 0,9" /></svg>
      )}
      SOUND
    </button>
  );
}

// ── Small header button (shared style) ───────────────────────────────────────
function SignalButton({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) {
  const color = active ? '#FFA84A' : '#B8B2A7';
  const border = active ? 'rgba(255,168,74,0.35)' : 'rgba(244,241,234,0.14)';
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none', border: `1px solid ${border}`, cursor: 'pointer',
        padding: '4px 9px',
        fontFamily: "'DM Mono', monospace", fontSize: 'clamp(7px,0.7vw,9px)',
        letterSpacing: '0.18em', color, textTransform: 'uppercase',
        transition: 'color 0.2s, border-color 0.2s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#F4F1EA'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(244,241,234,0.3)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = color; (e.currentTarget as HTMLElement).style.borderColor = border; }}
    >
      {label}
    </button>
  );
}

// ── YouTube IFrame API loader (loads once) ───────────────────────────────────
let ytReadyPromise: Promise<unknown> | null = null;
function loadYouTubeApi(): Promise<unknown> {
  if (ytReadyPromise) return ytReadyPromise;
  ytReadyPromise = new Promise(resolve => {
    const w = window as unknown as { YT?: { Player?: unknown }; onYouTubeIframeAPIReady?: () => void };
    if (w.YT && w.YT.Player) { resolve(w.YT); return; }
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => { if (prev) prev(); resolve(w.YT); };
    if (!document.getElementById('yt-iframe-api')) {
      const s = document.createElement('script');
      s.id = 'yt-iframe-api';
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    }
  });
  return ytReadyPromise;
}

// Remembered position for the session (module-level — resets on full reload)
let refSessionPos: { x: number; y: number } | null = null;

type YTPlayer = { playVideo?: () => void; pauseVideo?: () => void; unMute?: () => void; setVolume?: (v: number) => void; destroy?: () => void };

// ── 2. Reference Signal — small floating draggable video ─────────────────────
export function ReferenceSignal() {
  const [open, setOpen] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number }>(() => refSessionPos ?? {
    x: Math.max(12, (typeof window !== 'undefined' ? window.innerWidth : 1200) - VIDEO_WIDTH - 24),
    y: Math.max(12, (typeof window !== 'undefined' ? window.innerHeight : 800) - PANEL_H - 80),
  });

  const posRef = useRef(pos);
  const dragRef = useRef<{ on: boolean; offX: number; offY: number }>({ on: false, offX: 0, offY: 0 });
  const playerRef = useRef<YTPlayer | null>(null);
  const screenRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const staticRef = useRef<HTMLDivElement | null>(null);
  const lossRef = useRef<HTMLDivElement | null>(null);
  const bandRef = useRef<HTMLDivElement | null>(null);
  const flashRef = useRef<HTMLDivElement | null>(null);
  const openRef = useRef(false);

  const setPosition = useCallback((p: { x: number; y: number }) => {
    posRef.current = p; refSessionPos = p; setPos(p);
  }, []);

  // Create the player ONCE up-front (cued, not playing) so playback can be triggered
  // from within the click gesture — the only way a cross-origin YouTube embed starts
  // WITH SOUND. Kept on-screen but invisible until open so it isn't throttled.
  useEffect(() => {
    let cancelled = false;
    loadYouTubeApi().then(YT => {
      if (cancelled || !screenRef.current || playerRef.current) return;
      const YTApi = YT as { Player: new (el: HTMLElement, opts: unknown) => YTPlayer };
      try {
        const holder = document.createElement('div');
        holder.style.width = '100%';
        holder.style.height = '100%';
        screenRef.current.appendChild(holder);
        playerRef.current = new YTApi.Player(holder, {
          width: '100%',
          height: '100%',
          videoId: REFERENCE_VIDEO_ID,
          playerVars: { autoplay: 0, controls: 1, playsinline: 1, rel: 0, modestbranding: 1 },
          events: {
            onError: (e: { data: number }) => {
              if ([2, 5, 100, 101, 150].includes(e.data)) setUnavailable(true);
            },
          },
        });
      } catch {
        setUnavailable(true);
      }
    }).catch(() => setUnavailable(true));
    return () => {
      cancelled = true;
      try { playerRef.current?.destroy?.(); } catch {}
      playerRef.current = null;
    };
  }, []);

  useEffect(() => { openRef.current = open; }, [open]);

  const clampPos = (p: { x: number; y: number }) => ({
    x: Math.min(Math.max(6, p.x), (window.innerWidth || 1200) - VIDEO_WIDTH - 6),
    y: Math.min(Math.max(6, p.y), (window.innerHeight || 800) - PANEL_H - 6),
  });

  const openPlayer = useCallback(() => {
    setPosition(clampPos(posRef.current)); // guarantee it opens fully on-screen
    setOpen(true);
    // Runs inside the user's click gesture → the browser permits playback with sound
    try { playerRef.current?.unMute?.(); playerRef.current?.playVideo?.(); } catch {}
  }, [setPosition]);

  const close = useCallback(() => {
    setOpen(false);
    try { playerRef.current?.pauseVideo?.(); } catch {}
  }, []);

  // The header REFERENCE SIGNAL button toggles the window open ↔ closed
  const toggle = useCallback(() => {
    if (openRef.current) close(); else openPlayer();
  }, [close, openPlayer]);

  // Esc closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  // ── Analog broadcast FX — visual only; the YouTube audio is never touched ──
  useEffect(() => {
    if (!open) return;
    const wrap = wrapRef.current;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const push = (id: ReturnType<typeof setTimeout>) => timers.push(id);
    const pulse = (el: HTMLElement | null, peak: number, ms: number) => {
      if (!el) return;
      el.style.transition = 'none'; el.style.opacity = String(peak);
      requestAnimationFrame(() => { el.style.transition = `opacity ${ms}ms ease`; el.style.opacity = '0'; });
    };
    const burst = (p: number, ms: number) => pulse(staticRef.current, p, ms);
    const flash = (p: number, ms: number) => pulse(flashRef.current, p, ms);
    const sweepBand = () => {
      const band = bandRef.current; if (!band) return;
      band.style.transition = 'none'; band.style.top = '-12%'; band.style.opacity = '0.55';
      requestAnimationFrame(() => { band.style.transition = 'top 0.45s linear, opacity 0.45s ease'; band.style.top = '100%'; band.style.opacity = '0'; });
    };
    const signalLoss = () => {
      const loss = lossRef.current; if (!loss) return;
      const ms = 100 + Math.random() * 200; // 100–300ms complete signal loss
      loss.style.transition = 'none'; loss.style.opacity = '1';
      push(setTimeout(() => { loss.style.transition = 'opacity 0.1s ease'; loss.style.opacity = '0'; burst(0.9, 300); }, ms));
    };
    function disturb() {
      wrap?.classList.add('rs-glitch');
      push(setTimeout(() => wrap?.classList.remove('rs-glitch'), 200 + Math.random() * 400));
      const r = Math.random();
      if (r < 0.28) sweepBand();
      else if (r < 0.5) burst(0.55, 220);
      else if (r < 0.68) flash(0.5, 180);
      else if (r < 0.8) signalLoss();
      else { sweepBand(); burst(0.4, 180); }
      schedule();
    }
    function schedule() { push(setTimeout(disturb, 15000 + Math.random() * 15000)); } // every 15–30s

    // Opening lock-in (~2s): heavy interference settling into a stable picture
    const stat = staticRef.current;
    if (stat) { stat.style.transition = 'none'; stat.style.opacity = '0.85'; }
    wrap?.classList.add('rs-unstable');
    requestAnimationFrame(() => { if (stat) { stat.style.transition = 'opacity 1.9s ease'; stat.style.opacity = '0'; } });
    push(setTimeout(() => wrap?.classList.remove('rs-unstable'), 2000));
    sweepBand();
    schedule();

    return () => {
      timers.forEach(clearTimeout);
      wrap?.classList.remove('rs-unstable', 'rs-glitch');
      [staticRef, lossRef, bandRef, flashRef].forEach(ref => { if (ref.current) ref.current.style.opacity = '0'; });
    };
  }, [open]);

  // ── Dragging (via the top bar; the cross-origin video keeps its own controls) ──
  const onMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current.on) return;
    const h = frameRef.current?.offsetHeight || PANEL_H;
    let x = e.clientX - dragRef.current.offX;
    let y = e.clientY - dragRef.current.offY;
    x = Math.min(Math.max(6, x), window.innerWidth - VIDEO_WIDTH - 6);
    y = Math.min(Math.max(6, y), window.innerHeight - h - 6);
    setPosition({ x, y });
  }, [setPosition]);

  const onUp = useCallback(() => {
    dragRef.current.on = false;
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  }, [onMove]);

  const onDown = useCallback((e: React.MouseEvent) => {
    dragRef.current = { on: true, offX: e.clientX - posRef.current.x, offY: e.clientY - posRef.current.y };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    e.preventDefault();
  }, [onMove, onUp]);

  useEffect(() => () => {
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  }, [onMove, onUp]);

  return (
    <>
      <style>{FX_CSS}</style>
      <SignalButton label="REFERENCE SIGNAL" active={open} onClick={toggle} />

      {/* Small floating video — stays mounted (player pre-loaded); visibility toggles on open */}
      <div
        ref={frameRef}
        role="dialog"
        aria-label="Reference signal"
        style={{
          position: 'fixed',
          left: pos.x, top: pos.y,
          width: VIDEO_WIDTH,
          zIndex: 2147483000, // above every layer on the page
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          userSelect: 'none',
          background: '#000',
          border: '1px solid rgba(244,241,234,0.18)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
          transition: 'opacity 0.18s ease',
        }}
      >
        {/* Drag bar (always visible so the window can always be closed) */}
        <div
          onMouseDown={onDown}
          style={{
            height: HANDLE_H, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 5px 0 9px', background: '#0a0908',
            borderBottom: '1px solid rgba(244,241,234,0.12)', cursor: 'move',
          }}
        >
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '8px', letterSpacing: '0.22em', color: '#8E877B', textTransform: 'uppercase' }}>
            REFERENCE SIGNAL
          </span>
          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={close}
            aria-label="Close"
            style={{
              width: 30, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'none', border: 'none', cursor: 'pointer', color: '#B8B2A7', padding: 0, lineHeight: 0,
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#F4F1EA')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#B8B2A7')}
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3.5" y1="3.5" x2="12.5" y2="12.5" /><line x1="12.5" y1="3.5" x2="3.5" y2="12.5" /></svg>
          </button>
        </div>

        {/* Video with analog broadcast FX (visual only) */}
        <div ref={wrapRef} className={`rs-video${open ? ' rs-live' : ''}`} style={{ width: '100%', height: VIDEO_HEIGHT }}>
          <div ref={screenRef} className="rs-screen" />
          <div className="rs-l rs-tint" />
          <div className="rs-l rs-glow" />
          <div className="rs-l rs-roll" />
          <div className="rs-l rs-scan" />
          <div className="rs-l rs-grain" />
          <div className="rs-l rs-scratch" />
          <div ref={bandRef} className="rs-l rs-band" />
          <div ref={flashRef} className="rs-l rs-flash" />
          <div ref={staticRef} className="rs-l rs-static" />
          <div ref={lossRef} className="rs-l rs-loss" />
          <div className="rs-l rs-vig" />
          {/* Transparent drag layer so the whole video can be dragged */}
          <div onMouseDown={onDown} style={{ position: 'absolute', inset: 0, cursor: 'move' }} />
        </div>

        {unavailable && (
          <div style={{ position: 'absolute', left: 0, right: 0, top: HANDLE_H, height: VIDEO_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '6px', background: '#000' }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '0.16em', color: 'rgba(210,90,90,0.9)', textTransform: 'uppercase' }}>
              REFERENCE SIGNAL UNAVAILABLE
            </span>
          </div>
        )}
      </div>
    </>
  );
}
