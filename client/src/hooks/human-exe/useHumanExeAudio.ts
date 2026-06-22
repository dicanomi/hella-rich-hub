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

  // ── Continuous scan hum ────────────────────────────────────────────────────
  const startScanHum = useCallback((): StopFn => {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // 432Hz drone — the "healing frequency", naturally calming to humans
    // Harmonic series: 432 (fundamental), 864 (octave), 216 (sub-octave), 648 (fifth)
    const masterGain = ctx.createGain();
    const reverb = ctx.createConvolver();

    // Simple convolution reverb buffer for warmth
    const reverbLen = ctx.sampleRate * 1.5;
    const reverbBuf = ctx.createBuffer(2, reverbLen, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = reverbBuf.getChannelData(ch);
      for (let i = 0; i < reverbLen; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (reverbLen * 0.3));
    }
    reverb.buffer = reverbBuf;
    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.18;
    masterGain.connect(reverb);
    reverb.connect(reverbGain);
    reverbGain.connect(ctx.destination);
    masterGain.connect(ctx.destination);

    // LFO for gentle tremolo
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 0.15; // very slow, meditative
    lfoGain.gain.value = 0.04;
    lfo.connect(lfoGain);
    lfoGain.connect(masterGain.gain);

    const tones = [
      { freq: 432,  gain: 0.22 }, // fundamental — 432Hz
      { freq: 216,  gain: 0.12 }, // sub-octave — deep warmth
      { freq: 864,  gain: 0.08 }, // octave — clarity
      { freq: 648,  gain: 0.06 }, // perfect fifth — harmony
      { freq: 540,  gain: 0.04 }, // major third — warmth
    ];

    const oscs = tones.map(({ freq, gain }) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.value = gain;
      osc.connect(g);
      g.connect(masterGain);
      osc.start(now);
      return osc;
    });

    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(0.45, now + 2.0); // slow fade in
    lfo.start(now);

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
        try { oscs.forEach(o => o.stop()); lfo.stop(); } catch {}
      }, 1400);
    };

    return scanHumRef.current;
  }, [getCtx]);

  // ── Relay click ────────────────────────────────────────────────────────────
  const relayClick = useCallback(() => {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Transient click — broadband noise burst
    const bufLen = Math.floor(ctx.sampleRate * 0.012);
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.15));
    }
    const noise = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    filter.type = 'bandpass';
    filter.frequency.value = 2500 + Math.random() * 1000;
    filter.Q.value = 1.5;
    gain.gain.value = 0.4;
    noise.buffer = buf;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);

    // Low thud component
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.04);
    oscGain.gain.setValueAtTime(0.2, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
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
    stopAll,
    isUnlocked: () => unlocked.current,
  };
}
