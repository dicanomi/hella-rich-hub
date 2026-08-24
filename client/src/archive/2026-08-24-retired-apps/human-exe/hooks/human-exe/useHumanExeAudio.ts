/**
 * useHumanExeAudio — HUMAN.EXE procedural audio engine
 *
 * All sounds synthesized via Web Audio API — no samples, no files.
 *
 * Sounds:
 * - powerOn()       : low electrical hum + capacitor charge whine
 * - startScanHum()  : continuous mechanical scan hum (returns stop fn)
 * - relayClick()    : hard mechanical relay click
 * - beep()          : short diagnostic beep (frequency varies)
 * - targetLock()    : descending tone + click — target acquired
 * - scanComplete()  : three-note ascending confirmation tone
 * - ambientHum()    : very quiet machine room noise (returns stop fn)
 */

import { useCallback, useRef } from 'react';

type StopFn = () => void;

export function useHumanExeAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const scanHumRef = useRef<StopFn | null>(null);
  const ambientRef = useRef<StopFn | null>(null);
  const unlocked = useRef(false);

  const getCtx = useCallback((): AudioContext => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    unlocked.current = true;
    return ctxRef.current;
  }, []);

  // ── Power on: low hum + rising whine ──────────────────────────────────────
  const powerOn = useCallback(() => {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Sub-bass thump
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(40, now);
    osc1.frequency.exponentialRampToValueAtTime(80, now + 0.3);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.35, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.8);

    // Capacitor charge whine — rising pitch
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(200, now + 0.1);
    osc2.frequency.exponentialRampToValueAtTime(1800, now + 0.9);
    gain2.gain.setValueAtTime(0, now + 0.1);
    gain2.gain.linearRampToValueAtTime(0.06, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.9);

    // Electrical crackle
    const bufLen = ctx.sampleRate * 0.05;
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
    const noise = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 3000;
    noiseFilter.Q.value = 0.5;
    noise.buffer = buf;
    noiseGain.gain.setValueAtTime(0.15, now + 0.05);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now + 0.05);
  }, [getCtx]);

  // ── Continuous scan hum — very faint 40Hz sub-bass (same as Space Drone) ──────────
  const startScanHum = useCallback((): StopFn => {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Single 40Hz sine — barely audible, just a felt presence
    // Lowpass filtered at 80Hz so only the sub-bass comes through
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const masterGain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 40;
    filter.type = 'lowpass';
    filter.frequency.value = 80;
    filter.Q.value = 0.8;

    // Slow LFO breathing pulse (same as Space Drone)
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 0.12; // very slow breath
    lfoGain.gain.value = 3; // modulates osc frequency slightly
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    osc.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(ctx.destination);

    // Very low gain — felt not heard
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(0.08, now + 2.5); // slow fade in, very quiet
    osc.start(now);
    lfo.start(now);

    const oscs = [osc, lfo]; // for cleanup

    // Alien click scheduler — random chirps during scan
    let alienClickRunning = true;
    const scheduleAlienClick = () => {
      if (!alienClickRunning) return;
      const delay = 800 + Math.random() * 2400; // every 0.8–3.2s
      setTimeout(() => {
        if (!alienClickRunning) return;
        // Alien chirp: fast frequency sweep, non-human pattern
        const c = ctx;
        const t = c.currentTime;
        const chirpOsc = c.createOscillator();
        const chirpGain = c.createGain();
        // Random alien frequency pattern
        const baseFreq = 800 + Math.random() * 2400;
        const endFreq = baseFreq * (0.3 + Math.random() * 1.8);
        chirpOsc.type = Math.random() > 0.5 ? 'sine' : 'triangle';
        chirpOsc.frequency.setValueAtTime(baseFreq, t);
        chirpOsc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.08 + Math.random() * 0.12);
        chirpGain.gain.setValueAtTime(0.06 + Math.random() * 0.06, t);
        chirpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        chirpOsc.connect(chirpGain);
        chirpGain.connect(ctx.destination);
        chirpOsc.start(t);
        chirpOsc.stop(t + 0.18);
        // Occasionally add a second chirp immediately after (alien double-click)
        if (Math.random() > 0.65) {
          const t2 = t + 0.1 + Math.random() * 0.08;
          const c2 = c.createOscillator();
          const g2 = c.createGain();
          c2.type = 'sine';
          c2.frequency.setValueAtTime(endFreq * (0.5 + Math.random()), t2);
          c2.frequency.exponentialRampToValueAtTime(endFreq * (0.2 + Math.random() * 2), t2 + 0.06);
          g2.gain.setValueAtTime(0.04, t2);
          g2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.1);
          c2.connect(g2); g2.connect(ctx.destination);
          c2.start(t2); c2.stop(t2 + 0.12);
        }
        scheduleAlienClick();
      }, delay);
    };
    scheduleAlienClick();

    scanHumRef.current = () => {
      alienClickRunning = false;
      const t = ctx.currentTime;
      masterGain.gain.setValueAtTime(masterGain.gain.value, t);
      masterGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2); // slow fade out
      setTimeout(() => {
        try { oscs.forEach(o => o.stop()); } catch {}
      }, 1400);
    };

    return scanHumRef.current;
  }, [getCtx]);

  // ── Relay click ────────────────────────────────────────────────────────────

  // ── Contact event audio — alien communication motif ──────────────────────
  const contactEvent = useCallback(() => {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const signal = (t: number, freq: number, dur: number, type: OscillatorType = 'sine', g = 0.13, freqEnd?: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(g, t + 0.01);
      gain.gain.setValueAtTime(g, t + dur - 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(t); osc.stop(t + dur + 0.02);
    };
    signal(now + 0.0,  440,  0.12, 'square', 0.12);
    signal(now + 0.35, 660,  0.08, 'square', 0.10);
    signal(now + 0.48, 660,  0.08, 'square', 0.10);
    signal(now + 0.75, 880,  0.18, 'sine',   0.13, 1320);
    signal(now + 1.15, 1174, 0.22, 'triangle', 0.09);
    signal(now + 1.15, 987,  0.22, 'sine',     0.07);
    const bufLen = Math.floor(ctx.sampleRate * 0.06);
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.4));
    const n = ctx.createBufferSource();
    const ng = ctx.createGain(); ng.gain.value = 0.04;
    n.buffer = buf; n.connect(ng); ng.connect(ctx.destination);
    n.start(now + 1.15);
    signal(now + 1.65, 1047, 0.10, 'square', 0.10);
    signal(now + 1.80, 784,  0.10, 'square', 0.10);
    signal(now + 1.95, 523,  0.16, 'sine',   0.12);
    signal(now + 2.5,  1760, 0.06, 'square', 0.08);
    signal(now + 2.62, 880,  0.08, 'square', 0.08);
  }, [getCtx]);

  const relayClick = useCallback(() => {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Electric scan zap — high-frequency sawtooth sweep with static burst
    // Sounds like a scanner beam passing through tissue
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sawtooth';
    // Rapid descending sweep — electric zap character
    const baseFreq = 3200 + Math.random() * 1600;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.25, now + 0.055);
    oscGain.gain.setValueAtTime(0.0, now);
    oscGain.gain.linearRampToValueAtTime(0.09, now + 0.004);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.065);

    // Brief static crackle on top — electrical interference
    const bufLen = Math.floor(ctx.sampleRate * 0.018);
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.25));
    }
    const noise = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const noiseGain = ctx.createGain();
    filter.type = 'highpass';
    filter.frequency.value = 4000;
    noiseGain.gain.value = 0.05;
    noise.buffer = buf;
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
  }, [getCtx]);

  // ── Diagnostic beep ────────────────────────────────────────────────────────
  const beep = useCallback((freq = 880, duration = 0.08, volume = 0.12) => {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.005);
    gain.gain.setValueAtTime(volume, now + duration - 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }, [getCtx]);

  // ── Target lock ────────────────────────────────────────────────────────────
  const targetLock = useCallback(() => {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Descending sweep
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.18);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);

    // Click at end
    setTimeout(() => relayClick(), 180);
  }, [getCtx, relayClick]);

  // ── Scan complete ──────────────────────────────────────────────────────────
  const scanComplete = useCallback(() => {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Three ascending tones: C5 → E5 → G5
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + i * 0.18;
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
      gain.gain.setValueAtTime(0.18, t + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.35);
    });

    // Final chord shimmer
    const shimmerFreqs = [523.25, 659.25, 783.99, 1046.5];
    shimmerFreqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + 0.54;
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.08, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.85);
    });
  }, [getCtx]);

  // ── Ambient machine room hum ───────────────────────────────────────────────
  const startAmbient = useCallback((): StopFn => {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Very quiet 50Hz hum — like a machine room
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 50;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.04, now + 2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);

    ambientRef.current = () => {
      const t = ctx.currentTime;
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
      setTimeout(() => { try { osc.stop(); } catch {} }, 2000);
    };

    return ambientRef.current;
  }, [getCtx]);

  // ── Stop all ───────────────────────────────────────────────────────────────
  const stopAll = useCallback(() => {
    if (scanHumRef.current) { scanHumRef.current(); scanHumRef.current = null; }
    if (ambientRef.current) { ambientRef.current(); ambientRef.current = null; }
  }, []);

  return {
    powerOn,
    startScanHum,
    relayClick,
    beep,
    targetLock,
    scanComplete,
    startAmbient,
    contactEvent,
    stopAll,
    isUnlocked: () => unlocked.current,
  };
}
