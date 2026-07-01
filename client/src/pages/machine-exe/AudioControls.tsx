/**
 * THE_MACHINE.EXE — Audio Controls
 *
 * 1. MachineAudioToggle — small PLAY/PAUSE control for the background Machine synth.
 *    Default OFF, persisted by the parent, 500ms fade handled by the sound engine.
 *
 * 2. ReferenceSignal — opens a small, minimal modal with the referenced track via
 *    the OFFICIAL YouTube iframe (no autoplay; user presses play; close button).
 *    Nothing is downloaded, ripped, or hidden. If the video blocks embedding we show
 *    "REFERENCE SIGNAL UNAVAILABLE" and fall back to an ORIGINAL, self-contained Web
 *    Audio "reference signal" (dark analog drone / unstable pulse / mechanical
 *    breathing) — inspired by the mood only, no sampled or copied audio.
 */
import { useEffect, useRef, useState, useCallback } from 'react';

const REFERENCE_VIDEO_ID = 'e7rU8EVlgC8';

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

// ── Original self-contained "reference signal" synth (fallback) ──────────────
// Dark analog drone + unstable vibration + slow mechanical breathing. No samples.
class ReferenceSynth {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private nodes: OscillatorNode[] = [];
  private running = false;

  start() {
    if (this.running) return;
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctor();
    this.ctx = ctx;
    this.running = true;

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    this.master = master;

    // Slow mechanical breathing envelope on everything
    const breathe = ctx.createGain();
    breathe.gain.value = 0.8;
    breathe.connect(master);
    const breatheLFO = ctx.createOscillator();
    breatheLFO.type = 'sine';
    breatheLFO.frequency.value = 0.12;
    const breatheDepth = ctx.createGain();
    breatheDepth.gain.value = 0.3;
    breatheLFO.connect(breatheDepth);
    breatheDepth.connect(breathe.gain);

    // Dark sub drone
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = 41;
    const subGain = ctx.createGain();
    subGain.gain.value = 0.5;
    sub.connect(subGain);
    subGain.connect(breathe);

    // Detuned saw through a slowly-modulating low-pass (the "machine")
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 210;
    lp.Q.value = 2.2;
    const saw = ctx.createOscillator();
    saw.type = 'sawtooth';
    saw.frequency.value = 61.5;
    const sawGain = ctx.createGain();
    sawGain.gain.value = 0.12;
    saw.connect(lp);
    lp.connect(sawGain);
    sawGain.connect(breathe);

    const filterLFO = ctx.createOscillator();
    filterLFO.type = 'sine';
    filterLFO.frequency.value = 0.06;
    const filterDepth = ctx.createGain();
    filterDepth.gain.value = 120;
    filterLFO.connect(filterDepth);
    filterDepth.connect(lp.frequency);

    // Unstable vibration — fast subtle pitch jitter on the saw
    const vib = ctx.createOscillator();
    vib.type = 'sine';
    vib.frequency.value = 5.5;
    const vibDepth = ctx.createGain();
    vibDepth.gain.value = 7;
    vib.connect(vibDepth);
    vibDepth.connect(saw.detune);

    const now = ctx.currentTime;
    [sub, saw, filterLFO, vib, breatheLFO].forEach(o => o.start(now));
    this.nodes = [sub, saw, filterLFO, vib, breatheLFO];

    master.gain.setValueAtTime(0, now);
    master.gain.linearRampToValueAtTime(0.2, now + 0.6); // gentle
  }

  stop() {
    if (!this.running || !this.ctx || !this.master) { this.running = false; return; }
    const ctx = this.ctx;
    const now = ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(0, now + 0.5);
    const nodes = this.nodes;
    setTimeout(() => {
      nodes.forEach(n => { try { n.stop(); } catch {} try { n.disconnect(); } catch {} });
      try { ctx.close(); } catch {}
    }, 700);
    this.running = false;
    this.nodes = [];
  }
}

// ── 2. Reference Signal button + modal ───────────────────────────────────────
export function ReferenceSignal() {
  const [open, setOpen] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [synthOn, setSynthOn] = useState(false);
  const playerRef = useRef<{ destroy?: () => void } | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const synthRef = useRef<ReferenceSynth | null>(null);

  const stopSynth = useCallback(() => {
    synthRef.current?.stop();
    synthRef.current = null;
    setSynthOn(false);
  }, []);

  const close = useCallback(() => {
    try { playerRef.current?.destroy?.(); } catch {}
    playerRef.current = null;
    stopSynth();
    setOpen(false);
  }, [stopSynth]);

  // Build the YouTube player when the modal opens
  useEffect(() => {
    if (!open) return;
    setUnavailable(false);
    let cancelled = false;

    loadYouTubeApi().then(YT => {
      if (cancelled || !mountRef.current) return;
      const YTApi = YT as { Player: new (el: HTMLElement, opts: unknown) => { destroy?: () => void } };
      try {
        // Mount into an imperatively-created child so YT can replace it without
        // clashing with React's DOM reconciliation.
        const holder = document.createElement('div');
        holder.style.width = '100%';
        holder.style.height = '100%';
        mountRef.current.appendChild(holder);
        playerRef.current = new YTApi.Player(holder, {
          width: '100%',
          height: '100%',
          videoId: REFERENCE_VIDEO_ID,
          playerVars: { autoplay: 0, rel: 0, modestbranding: 1, playsinline: 1 },
          events: {
            onError: (e: { data: number }) => {
              // 2 invalid · 5 html5 · 100 not found · 101/150 embedding disabled
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
  }, [open]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  useEffect(() => () => { stopSynth(); }, [stopSynth]);

  const toggleSynth = () => {
    if (synthOn) { stopSynth(); return; }
    const s = new ReferenceSynth();
    synthRef.current = s;
    s.start();
    setSynthOn(true);
  };

  const ls = (extra?: React.CSSProperties): React.CSSProperties => ({
    fontFamily: "'DM Mono', monospace", fontSize: 'clamp(7px,0.75vw,9px)',
    letterSpacing: '0.22em', color: '#8E877B', textTransform: 'uppercase', ...extra,
  });

  return (
    <>
      <SignalButton label="REFERENCE SIGNAL" active={open} onClick={() => setOpen(true)} />

      {open && (
        <div
          role="dialog"
          aria-label="Reference signal"
          style={{
            position: 'fixed',
            top: 'clamp(60px,10vh,96px)', left: '50%', transform: 'translateX(-50%)',
            width: 'min(380px, 92vw)', zIndex: 9997,
            background: '#0a0908', border: '1px solid rgba(244,241,234,0.18)',
            boxShadow: '0 12px 48px rgba(0,0,0,0.6)',
            padding: 'clamp(14px,2vw,20px)',
            animation: 'mxFadeIn 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={ls({ color: '#FFA84A' })}>REFERENCE SIGNAL</span>
            <button
              onClick={close}
              aria-label="Close"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8E877B', padding: '2px', lineHeight: 0 }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#F4F1EA')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#8E877B')}
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><line x1="2" y1="2" x2="12" y2="12" /><line x1="12" y1="2" x2="2" y2="12" /></svg>
            </button>
          </div>

          {!unavailable ? (
            <>
              <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: '#000', border: '1px solid rgba(244,241,234,0.1)' }}>
                <div ref={mountRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
              </div>
              <div style={ls({ marginTop: '10px', color: '#8E877B' })}>PRESS PLAY · EXTERNAL SIGNAL</div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={ls({ color: 'rgba(210,90,90,0.9)', fontSize: 'clamp(9px,0.9vw,11px)' })}>REFERENCE SIGNAL UNAVAILABLE</div>
              <div style={ls({ color: '#8E877B', letterSpacing: '0.16em', lineHeight: 1.6 })}>
                External embed blocked. Play the machine's own reference signal instead.
              </div>
              <button
                onClick={toggleSynth}
                style={{
                  alignSelf: 'flex-start', background: 'none',
                  border: `1px solid ${synthOn ? 'rgba(255,168,74,0.5)' : 'rgba(244,241,234,0.2)'}`,
                  color: synthOn ? '#FFA84A' : '#F4F1EA', cursor: 'pointer',
                  fontFamily: "'DM Mono', monospace", fontSize: 'clamp(8px,0.85vw,10px)',
                  letterSpacing: '0.22em', textTransform: 'uppercase', padding: '10px 18px',
                  transition: 'color 0.2s, border-color 0.2s',
                }}
              >
                {synthOn ? '■ STOP SIGNAL' : '▶ PLAY SYNTH SIGNAL'}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
