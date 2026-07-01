/**
 * THE_MACHINE.EXE — Audio Controls
 *
 * 1. MachineAudioToggle — small PLAY/PAUSE control for the background Machine synth.
 *    Default OFF, persisted by the parent, 500ms fade handled by the sound engine.
 *
 * 2. ReferenceSignal — a tiny floating CRT television that opens when the user clicks
 *    REFERENCE SIGNAL. The referenced track plays INSIDE the CRT screen via the official
 *    YouTube IFrame API (controls=1, playsinline=1). The player is pre-created on mount
 *    so playback can be started from WITHIN the user's click gesture (unMute + playVideo),
 *    which is what lets the browser play it WITH SOUND. Draggable, closable, reopens from
 *    the button, and remembers its position for the session. Nothing is downloaded,
 *    ripped, hidden, or opened in a new tab. If the browser still blocks it, the video
 *    stays visible and one click plays it.
 */
import { useEffect, useRef, useState, useCallback } from 'react';

const REFERENCE_VIDEO_ID = 'e7rU8EVlgC8';
const CRT_IMG = '/reference-crt.png';
const CRT_WIDTH = 260; // px — tiny haunted market monitor
// Screen-glass rectangle as % of the CRT frame image (reference-crt.png, 1792x1108)
const SCREEN = { top: 12.0, left: 7.0, width: 59.5, height: 74.5 };

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

// Remembered CRT position for the session (module-level — resets on full reload)
let crtSessionPos: { x: number; y: number } | null = null;

type YTPlayer = { playVideo?: () => void; pauseVideo?: () => void; unMute?: () => void; setVolume?: (v: number) => void; destroy?: () => void };

// ── 2. Reference Signal — tiny floating CRT television ───────────────────────
export function ReferenceSignal() {
  const [open, setOpen] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number }>(() => crtSessionPos ?? { x: -1, y: -1 });

  const posRef = useRef(pos);
  const dragRef = useRef<{ on: boolean; offX: number; offY: number }>({ on: false, offX: 0, offY: 0 });
  const playerRef = useRef<YTPlayer | null>(null);
  const screenRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);

  const setPosition = useCallback((p: { x: number; y: number }) => {
    posRef.current = p; crtSessionPos = p; setPos(p);
  }, []);

  // Create the player ONCE up-front (cued, not playing) so that playback can be
  // triggered from within the click gesture — the only way the browser lets a
  // cross-origin YouTube embed start WITH SOUND.
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

  const openAndPlay = useCallback(() => {
    if (posRef.current.x < 0) {
      const h = frameRef.current?.offsetHeight || Math.round(CRT_WIDTH / 1.617);
      setPosition({
        x: Math.max(12, window.innerWidth - CRT_WIDTH - 24),
        y: Math.max(12, window.innerHeight - h - 96),
      });
    }
    setOpen(true);
    // Runs inside the user's click gesture → the browser permits sound
    try { playerRef.current?.unMute?.(); playerRef.current?.playVideo?.(); } catch {}
  }, [setPosition]);

  const close = useCallback(() => {
    setOpen(false);
    try { playerRef.current?.pauseVideo?.(); } catch {}
  }, []);

  // Esc closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  // ── Dragging (grab the CRT frame; the cross-origin video keeps its own controls) ──
  const onMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current.on) return;
    const h = frameRef.current?.offsetHeight || 160;
    let x = e.clientX - dragRef.current.offX;
    let y = e.clientY - dragRef.current.offY;
    x = Math.min(Math.max(8, x), window.innerWidth - CRT_WIDTH - 8);
    y = Math.min(Math.max(8, y), window.innerHeight - h - 8);
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

  const screenBox: React.CSSProperties = {
    position: 'absolute', top: `${SCREEN.top}%`, left: `${SCREEN.left}%`,
    width: `${SCREEN.width}%`, height: `${SCREEN.height}%`,
  };

  return (
    <>
      <SignalButton label="REFERENCE SIGNAL" active={open} onClick={openAndPlay} />

      {/* The CRT stays mounted so the player is pre-loaded; visibility toggles on open */}
      <div
        ref={frameRef}
        role="dialog"
        aria-label="Reference signal — CRT"
        onMouseDown={onDown}
        style={{
          position: 'fixed',
          left: open && pos.x >= 0 ? pos.x : -99999,
          top: open && pos.y >= 0 ? pos.y : 0,
          width: CRT_WIDTH, zIndex: 9996,
          cursor: 'move', userSelect: 'none',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          filter: 'drop-shadow(0 16px 40px rgba(0,0,0,0.6))',
          transition: 'opacity 0.2s ease',
        }}
      >
        <img src={CRT_IMG} alt="" draggable={false} style={{ display: 'block', width: '100%', height: 'auto', pointerEvents: 'none' }} />

        {/* Screen glass — the video lives here */}
        <div ref={screenRef} style={{ ...screenBox, background: '#000', overflow: 'hidden', borderRadius: 6 }} />

        {unavailable && (
          <div style={{ ...screenBox, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '6px', background: '#000' }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '8px', letterSpacing: '0.16em', color: 'rgba(210,90,90,0.9)', textTransform: 'uppercase' }}>
              REFERENCE SIGNAL UNAVAILABLE
            </span>
          </div>
        )}

        {open && (
          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={close}
            aria-label="Close"
            style={{
              position: 'absolute', top: '2%', right: '1.5%',
              width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(244,241,234,0.25)', borderRadius: '50%',
              cursor: 'pointer', color: '#F4F1EA', padding: 0, lineHeight: 0,
            }}
          >
            <svg width="8" height="8" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><line x1="2" y1="2" x2="12" y2="12" /><line x1="12" y1="2" x2="2" y2="12" /></svg>
          </button>
        )}
      </div>
    </>
  );
}
