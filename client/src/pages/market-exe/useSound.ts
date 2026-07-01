// MARKET.EXE — Minimal Bloomberg-style UI sounds (Web Audio API)
import { useRef, useState, useCallback } from 'react';

function createCtx() {
  try {
    return new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  } catch {
    return null;
  }
}

export function useSound() {
  const [muted, setMuted] = useState(true); // muted by default
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = createCtx();
    if (ctxRef.current?.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const playTone = useCallback(
    (freq: number, duration: number, gain = 0.04, type: OscillatorType = 'sine') => {
      if (muted) return;
      const ctx = getCtx();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    },
    [muted, getCtx]
  );

  const click = useCallback(() => playTone(880, 0.06, 0.03, 'square'), [playTone]);
  const buy = useCallback(() => {
    playTone(660, 0.08, 0.04, 'sine');
    setTimeout(() => playTone(880, 0.1, 0.03, 'sine'), 80);
  }, [playTone]);
  const sell = useCallback(() => {
    playTone(440, 0.08, 0.04, 'sine');
    setTimeout(() => playTone(330, 0.1, 0.03, 'sine'), 80);
  }, [playTone]);
  const error = useCallback(() => playTone(220, 0.15, 0.04, 'sawtooth'), [playTone]);
  const milestone = useCallback(() => {
    [0, 100, 200].forEach(delay =>
      setTimeout(() => playTone(440 * Math.pow(2, delay / 1200), 0.12, 0.035, 'sine'), delay)
    );
  }, [playTone]);

  const toggleMute = useCallback(() => setMuted(v => !v), []);

  return { muted, toggleMute, click, buy, sell, error, milestone };
}
