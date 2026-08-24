/**
 * LOW BATTERY — Audio Engine v8
 *
 * Same start method as Space Drone:
 * - startEngine() called from user gesture (click or spacebar)
 * - ctx.resume() awaited in same tick as gesture
 * - first chirp fires immediately
 * - then every 5 seconds with drift correction
 */

import { useCallback, useEffect, useRef } from 'react';
import { resumeContext } from '../lib/iosAudioUnlock';

const CHIRP_INTERVAL_MS = 5000;

interface AudioEngineOptions {
  muted: boolean;
  onChirp: () => void;
}

export function useAudioEngine({ muted, onChirp }: AudioEngineOptions) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const engineRunningRef = useRef(false);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  }, []);

  // ── Smoke detector chirp ──────────────────────────────────────────────────
  const playChirp = useCallback(() => {
    if (muted) return;
    try {
      const ctx = getCtx();
      if (ctx.state === 'suspended') { ctx.resume().catch(() => {}); return; }
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const g1 = ctx.createGain();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(3400, now);
      g1.gain.setValueAtTime(0, now);
      g1.gain.linearRampToValueAtTime(0.28, now + 0.005);
      g1.gain.setValueAtTime(0.28, now + 0.075);
      g1.gain.linearRampToValueAtTime(0, now + 0.11);

      const osc2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(1700, now);
      g2.gain.setValueAtTime(0, now);
      g2.gain.linearRampToValueAtTime(0.08, now + 0.005);
      g2.gain.setValueAtTime(0.08, now + 0.075);
      g2.gain.linearRampToValueAtTime(0, now + 0.11);

      const convolver = ctx.createConvolver();
      const sr = ctx.sampleRate;
      const len = Math.floor(sr * 0.22);
      const impulse = ctx.createBuffer(2, len, sr);
      for (let c = 0; c < 2; c++) {
        const ch = impulse.getChannelData(c);
        for (let i = 0; i < len; i++) {
          ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8);
        }
      }
      convolver.buffer = impulse;

      const dry = ctx.createGain(); dry.gain.value = 0.72;
      const wet = ctx.createGain(); wet.gain.value = 0.28;
      const master = ctx.createGain(); master.gain.value = 0.5;

      osc1.connect(g1); osc2.connect(g2);
      g1.connect(dry); g2.connect(dry);
      g1.connect(convolver); g2.connect(convolver);
      convolver.connect(wet);
      dry.connect(master); wet.connect(master);
      master.connect(ctx.destination);

      osc1.start(now); osc1.stop(now + 0.14);
      osc2.start(now); osc2.stop(now + 0.14);
    } catch (_) {}
  }, [muted, getCtx]);

  // ── House fly buzz ────────────────────────────────────────────────────────
  const playBuzz = useCallback((duration: number = 0.8) => {
    if (muted) return;
    try {
      const ctx = getCtx();
      if (ctx.state === 'suspended') { ctx.resume().catch(() => {}); return; }
      const now = ctx.currentTime;
      const sr = ctx.sampleRate;
      const samples = Math.floor(sr * duration);
      const buffer = ctx.createBuffer(2, samples, sr);
      for (let ch = 0; ch < 2; ch++) {
        const data = buffer.getChannelData(ch);
        for (let i = 0; i < samples; i++) {
          const t = i / sr;
          const f = 170 + Math.sin(t * 3.5) * 15;
          const s1 = Math.sin(2 * Math.PI * f * t);
          const s2 = Math.sin(2 * Math.PI * f * 2 * t) * 0.4;
          const s3 = Math.sin(2 * Math.PI * f * 3 * t) * 0.18;
          const noise = (Math.random() - 0.5) * 0.05;
          const flutter = 0.72 + 0.28 * Math.abs(Math.sin(2 * Math.PI * 11 * t));
          const pan = ch === 0 ? 1.0 : 0.82;
          data[i] = (s1 + s2 + s3 + noise) * flutter * pan * 0.16;
        }
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.85, now + 0.08);
      gain.gain.setValueAtTime(0.85, now + duration - 0.1);
      gain.gain.linearRampToValueAtTime(0, now + duration);
      const lpf = ctx.createBiquadFilter();
      lpf.type = 'lowpass'; lpf.frequency.value = 2600;
      source.connect(lpf); lpf.connect(gain); gain.connect(ctx.destination);
      source.start(now); source.stop(now + duration);
      return source;
    } catch (_) { return null; }
  }, [muted, getCtx]);

  // ── Ambient sounds ────────────────────────────────────────────────────────
  const playAmbient = useCallback((type: 'siren' | 'footsteps') => {
    if (muted) return;
    try {
      const ctx = getCtx();
      if (ctx.state === 'suspended') return;
      const now = ctx.currentTime;
      if (type === 'siren') {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.linearRampToValueAtTime(560, now + 1.5);
        osc.frequency.linearRampToValueAtTime(380, now + 3);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.022, now + 0.5);
        g.gain.setValueAtTime(0.022, now + 2.5);
        g.gain.linearRampToValueAtTime(0, now + 3);
        osc.connect(g); g.connect(ctx.destination);
        osc.start(now); osc.stop(now + 3);
      } else {
        for (let i = 0; i < 4; i++) {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(75, now + i * 0.42);
          osc.frequency.exponentialRampToValueAtTime(38, now + i * 0.42 + 0.1);
          g.gain.setValueAtTime(0.032, now + i * 0.42);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.42 + 0.18);
          osc.connect(g); g.connect(ctx.destination);
          osc.start(now + i * 0.42); osc.stop(now + i * 0.42 + 0.22);
        }
      }
    } catch (_) {}
  }, [muted, getCtx]);

  // ── startEngine: called from user gesture (click or spacebar) ────────────
  const startEngine = useCallback(async () => {
    if (engineRunningRef.current) return;
    engineRunningRef.current = true;

    // iOS-safe unlock: silent buffer + resume in gesture stack
    const ctx = getCtx();
    await resumeContext(ctx);
    console.log('[audio] audio start success, state:', ctx.state);

    // Fire first chirp immediately — context is now running
    playChirp();
    onChirp();

    // Drift-corrected 5s intervals
    const tick = (targetTime: number) => {
      const nextTarget = targetTime + CHIRP_INTERVAL_MS;
      const delay = Math.max(0, nextTarget - performance.now());
      timerRef.current = setTimeout(() => {
        playChirp();
        onChirp();
        tick(nextTarget);
      }, delay);
    };

    tick(performance.now());
  }, [getCtx, playChirp, onChirp]);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
      engineRunningRef.current = false;
    };
  }, []);

  return { startEngine, playChirp, playBuzz, playAmbient };
}
