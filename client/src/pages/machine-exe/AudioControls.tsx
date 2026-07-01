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

  const openAndPlay = useCallback(() => {
    setOpen(true);
    // Runs inside the user's click gesture → the browser permits playback with sound
    try { playerRef.current?.unMute?.(); playerRef.current?.playVideo?.(); } catch {}
  }, []);

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
      <SignalButton label="REFERENCE SIGNAL" active={open} onClick={openAndPlay} />

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
        {/* Drag bar */}
        <div
          onMouseDown={onDown}
          style={{
            height: HANDLE_H, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 4px 0 9px', background: '#0a0908',
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
              width: 26, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'none', border: 'none', cursor: 'pointer', color: '#B8B2A7', padding: 0, lineHeight: 0,
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#F4F1EA')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#B8B2A7')}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="3.5" y1="3.5" x2="12.5" y2="12.5" /><line x1="12.5" y1="3.5" x2="3.5" y2="12.5" /></svg>
          </button>
        </div>

        {/* Video */}
        <div ref={screenRef} style={{ width: '100%', height: VIDEO_HEIGHT, background: '#000', overflow: 'hidden' }} />

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
