/**
 * THE_MACHINE.EXE — Audio Controls
 *
 * 1. MachineAudioToggle — small PLAY/PAUSE control for the background Machine synth.
 *    Default OFF, persisted by the parent, 500ms fade handled by the sound engine.
 *
 * 2. ReferenceSignal — a small floating "intercepted broadcast" video window. Rendered
 *    through a portal to document.body so it always sits above every app layer. Header
 *    drag (pointer events, mouse + touch), clamped inside the viewport with 24px padding,
 *    responsive sizing, resize re-clamping, and sessionStorage position memory. The video
 *    keeps its analog visual overlay (pointer-events: none) and plays with sound — the
 *    player is pre-created so playback starts inside the click gesture. Audio untouched.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

const REFERENCE_VIDEO_ID = 'e7rU8EVlgC8';
const HEADER_H = 28;   // drag bar height (px)
const PAD = 24;        // min visible padding from every viewport edge (px)
const POS_KEY = 'refsig_pos_v1';

// Analog-noise texture (SVG turbulence) reused for grain + static bursts
const NOISE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='rn'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23rn)'/%3E%3C/svg%3E";

// Analog broadcast CSS — visual only, applied over the (cross-origin) video
const FX_CSS = `
.refsig-video{position:relative;width:100%;aspect-ratio:16/9;overflow:hidden;background:#000;border-radius:4px;}
.refsig-video iframe{position:absolute;inset:0;width:100%!important;height:100%!important;border:0;}
.rs-screen{position:absolute;inset:0;overflow:hidden;transform:scale(1.05);will-change:filter,transform;}
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

// ── Geometry helpers ─────────────────────────────────────────────────────────
type Size = { vw: number; vh: number; w: number; h: number };
type XY = { x: number; y: number };

function widthForViewport(vw: number): number {
  if (vw < 640) return Math.min(vw - 32, 320);           // mobile
  if (vw < 1024) return Math.max(220, Math.min(320, vw * 0.32)); // tablet
  return Math.max(220, Math.min(360, vw * 0.24));        // desktop
}
function measure(): Size {
  const vw = window.innerWidth, vh = window.innerHeight;
  const w = Math.round(widthForViewport(vw));
  const h = Math.round(HEADER_H + (w * 9) / 16);
  return { vw, vh, w, h };
}
function clampXY(x: number, y: number, s: Size): XY {
  const maxX = Math.max(PAD, s.vw - s.w - PAD);
  const maxY = Math.max(PAD, s.vh - s.h - PAD);
  return { x: Math.min(Math.max(PAD, x), maxX), y: Math.min(Math.max(PAD, y), maxY) };
}
function defaultPos(s: Size): XY {
  // desktop/tablet: bottom 72, right 32 · mobile (<640): centered, bottom 72
  const x = s.vw < 640 ? Math.round((s.vw - s.w) / 2) : (s.vw - s.w - 32);
  const y = s.vh - s.h - 72;
  return clampXY(x, y, s);
}
function isVisible(p: XY, s: Size): boolean {
  return p.x >= PAD && p.y >= PAD && p.x <= s.vw - s.w - PAD && p.y <= s.vh - s.h - PAD;
}
function loadSaved(): XY | null {
  try { const r = sessionStorage.getItem(POS_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}
function saveSaved(p: XY) { try { sessionStorage.setItem(POS_KEY, JSON.stringify(p)); } catch {} }

type YTPlayer = { playVideo?: () => void; pauseVideo?: () => void; unMute?: () => void; destroy?: () => void };

// ── 2. Reference Signal — floating broadcast window (portal) ─────────────────
export function ReferenceSignal() {
  const hasDoc = typeof document !== 'undefined';
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [size, setSize] = useState<Size>(() => (hasDoc ? measure() : { vw: 1200, vh: 800, w: 320, h: 208 }));
  const [pos, setPos] = useState<XY>(() => {
    if (!hasDoc) return { x: 800, y: 500 };
    const s = measure();
    const saved = loadSaved();
    return saved && isVisible(saved, s) ? saved : defaultPos(s);
  });

  const sizeRef = useRef(size);
  const posRef = useRef(pos);
  const openRef = useRef(false);
  const dragRef = useRef<{ on: boolean; id: number; sx: number; sy: number; ox: number; oy: number }>({ on: false, id: -1, sx: 0, sy: 0, ox: 0, oy: 0 });
  const playerRef = useRef<YTPlayer | null>(null);
  const screenRef = useRef<HTMLDivElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const setSizeR = useCallback((s: Size) => { sizeRef.current = s; setSize(s); }, []);
  const setPosR = useCallback((p: XY) => { posRef.current = p; setPos(p); }, []);

  useEffect(() => { openRef.current = open; }, [open]);

  // Pre-create the player (cued) so playback can be started from within the click
  // gesture — required for a cross-origin YouTube embed to play WITH SOUND.
  useEffect(() => {
    let cancelled = false;
    loadYouTubeApi().then(YT => {
      if (cancelled || !screenRef.current || playerRef.current) return;
      const YTApi = YT as { Player: new (el: HTMLElement, opts: unknown) => YTPlayer };
      try {
        const holder = document.createElement('div');
        holder.style.width = '100%'; holder.style.height = '100%';
        screenRef.current.appendChild(holder);
        playerRef.current = new YTApi.Player(holder, {
          width: '100%', height: '100%', videoId: REFERENCE_VIDEO_ID,
          playerVars: { autoplay: 0, controls: 1, playsinline: 1, rel: 0, modestbranding: 1 },
          events: { onError: (e: { data: number }) => { if ([2, 5, 100, 101, 150].includes(e.data)) setUnavailable(true); } },
        });
      } catch { setUnavailable(true); }
    }).catch(() => setUnavailable(true));
    return () => { cancelled = true; try { playerRef.current?.destroy?.(); } catch {} playerRef.current = null; };
  }, []);

  // Keep the window inside the viewport on resize; fall back to default if it can't fit
  useEffect(() => {
    const onResize = () => {
      const s = measure();
      setSizeR(s);
      const cur = posRef.current;
      setPosR(isVisible(cur, s) ? clampXY(cur.x, cur.y, s) : defaultPos(s));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [setSizeR, setPosR]);

  const openWin = useCallback(() => {
    const s = measure();
    setSizeR(s);
    const saved = loadSaved();
    setPosR(saved && isVisible(saved, s) ? saved : defaultPos(s));
    setOpen(true);
    // Inside the click gesture → the browser permits playback with sound
    try { playerRef.current?.unMute?.(); playerRef.current?.playVideo?.(); } catch {}
  }, [setPosR, setSizeR]);

  const close = useCallback(() => {
    setOpen(false);
    try { playerRef.current?.pauseVideo?.(); } catch {}
  }, []);

  const toggle = useCallback(() => { if (openRef.current) close(); else openWin(); }, [close, openWin]);

  // Esc closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  // ── Header drag (pointer events → mouse + touch); video area stays interactive ──
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button && e.button !== 0) return;
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
    dragRef.current = { on: true, id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: posRef.current.x, oy: posRef.current.y };
    setDragging(true);
    e.preventDefault();
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d.on || e.pointerId !== d.id) return;
    setPosR(clampXY(d.ox + (e.clientX - d.sx), d.oy + (e.clientY - d.sy), sizeRef.current));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d.on) return;
    d.on = false; setDragging(false); saveSaved(posRef.current);
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
  };

  // ── Analog broadcast FX — visual only; the YouTube audio is never touched ──
  useEffect(() => {
    if (!open) return;
    const wrap = wrapRef.current;
    const staticEl = wrap?.querySelector('.rs-static') as HTMLElement | null;
    const lossEl = wrap?.querySelector('.rs-loss') as HTMLElement | null;
    const bandEl = wrap?.querySelector('.rs-band') as HTMLElement | null;
    const flashEl = wrap?.querySelector('.rs-flash') as HTMLElement | null;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const push = (id: ReturnType<typeof setTimeout>) => timers.push(id);
    const pulse = (el: HTMLElement | null, peak: number, ms: number) => {
      if (!el) return;
      el.style.transition = 'none'; el.style.opacity = String(peak);
      requestAnimationFrame(() => { el.style.transition = `opacity ${ms}ms ease`; el.style.opacity = '0'; });
    };
    const burst = (p: number, ms: number) => pulse(staticEl, p, ms);
    const flash = (p: number, ms: number) => pulse(flashEl, p, ms);
    const sweepBand = () => {
      if (!bandEl) return;
      bandEl.style.transition = 'none'; bandEl.style.top = '-12%'; bandEl.style.opacity = '0.55';
      requestAnimationFrame(() => { bandEl.style.transition = 'top 0.45s linear, opacity 0.45s ease'; bandEl.style.top = '100%'; bandEl.style.opacity = '0'; });
    };
    const signalLoss = () => {
      if (!lossEl) return;
      const ms = 100 + Math.random() * 200;
      lossEl.style.transition = 'none'; lossEl.style.opacity = '1';
      push(setTimeout(() => { lossEl.style.transition = 'opacity 0.1s ease'; lossEl.style.opacity = '0'; burst(0.9, 300); }, ms));
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
    function schedule() { push(setTimeout(disturb, 15000 + Math.random() * 15000)); }

    wrap?.classList.add('rs-live');
    if (staticEl) { staticEl.style.transition = 'none'; staticEl.style.opacity = '0.85'; }
    wrap?.classList.add('rs-unstable');
    requestAnimationFrame(() => { if (staticEl) { staticEl.style.transition = 'opacity 1.9s ease'; staticEl.style.opacity = '0'; } });
    push(setTimeout(() => wrap?.classList.remove('rs-unstable'), 2000));
    sweepBand();
    schedule();

    return () => {
      timers.forEach(clearTimeout);
      wrap?.classList.remove('rs-live', 'rs-unstable', 'rs-glitch');
      [staticEl, lossEl, bandEl, flashEl].forEach(el => { if (el) el.style.opacity = '0'; });
    };
  }, [open]);

  const win = (
    <div
      role="dialog"
      aria-label="Reference signal"
      style={{
        position: 'fixed', left: pos.x, top: pos.y, width: size.w, zIndex: 99999,
        opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
        background: '#000', border: '1px solid rgba(244,241,234,0.18)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.7)', userSelect: 'none',
        transition: dragging ? 'none' : 'opacity 0.18s ease',
      }}
    >
      {/* Header — the drag handle */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          height: HEADER_H, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 5px 0 9px', background: '#0a0908', borderBottom: '1px solid rgba(244,241,234,0.12)',
          cursor: dragging ? 'grabbing' : 'grab', touchAction: 'none',
        }}
      >
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '8px', letterSpacing: '0.22em', color: '#8E877B', textTransform: 'uppercase', pointerEvents: 'none' }}>
          REFERENCE SIGNAL
        </span>
        <button
          onPointerDown={e => e.stopPropagation()}
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

      {/* Video container — 16:9, holds the iframe + analog overlay (overlay never blocks input) */}
      <div ref={wrapRef} className="refsig-video">
        <div ref={screenRef} className="rs-screen" />
        <div className="rs-l rs-tint" />
        <div className="rs-l rs-glow" />
        <div className="rs-l rs-roll" />
        <div className="rs-l rs-scan" />
        <div className="rs-l rs-grain" />
        <div className="rs-l rs-scratch" />
        <div className="rs-l rs-band" />
        <div className="rs-l rs-flash" />
        <div className="rs-l rs-static" />
        <div className="rs-l rs-loss" />
        <div className="rs-l rs-vig" />
        {unavailable && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '6px', background: '#000' }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '0.16em', color: 'rgba(210,90,90,0.9)', textTransform: 'uppercase' }}>
              REFERENCE SIGNAL UNAVAILABLE
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <style>{FX_CSS}</style>
      <SignalButton label="REFERENCE SIGNAL" active={open} onClick={toggle} />
      {hasDoc && createPortal(win, document.body)}
    </>
  );
}
