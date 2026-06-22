/**
 * useArcadeAudio — 8-bit Atari/Galaxian style arcade sounds
 *
 * All sounds synthesized via Web Audio API.
 * Reference: Galaxian, Galaga, Defender, Asteroids, Tempest
 *
 * Sounds:
 * - shoot()       : PEW — fast high-freq pulse
 * - enemyHit()    : electronic crackle on impact
 * - explosion()   : classic digital arcade explosion
 * - playerHit()   : descending tone + static burst
 * - alertKlaxon() : spacecraft red alert — slow repeating pulse
 * - terminalBoot(): CRT startup + relay clicks
 * - startAmbient(): low CRT hum during gameplay (returns stop fn)
 */
import { useCallback, useRef } from 'react';

type StopFn = () => void;

export function useArcadeAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const ambientRef = useRef<StopFn | null>(null);
  const klaxonRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ctx = useCallback((): AudioContext => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  // ── SHOOT — PEW ──────────────────────────────────────────────────────────
  const shoot = useCallback(() => {
    const c = ctx();
    const now = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.06);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(now); osc.stop(now + 0.08);
  }, [ctx]);

  // ── ENEMY HIT — crackle ──────────────────────────────────────────────────
  const enemyHit = useCallback(() => {
    const c = ctx();
    const now = c.currentTime;
    // Noise burst
    const bufLen = Math.floor(c.sampleRate * 0.04);
    const buf = c.createBuffer(1, bufLen, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.2));
    const noise = c.createBufferSource();
    const filter = c.createBiquadFilter();
    const gain = c.createGain();
    filter.type = 'bandpass';
    filter.frequency.value = 2000 + Math.random() * 2000;
    filter.Q.value = 2;
    gain.gain.value = 0.25;
    noise.buffer = buf;
    noise.connect(filter); filter.connect(gain); gain.connect(c.destination);
    noise.start(now);
  }, [ctx]);

  // ── EXPLOSION — digital breakup ──────────────────────────────────────────
  const explosion = useCallback(() => {
    const c = ctx();
    const now = c.currentTime;
    // Noise decay
    const bufLen = Math.floor(c.sampleRate * 0.25);
    const buf = c.createBuffer(1, bufLen, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.15));
    const noise = c.createBufferSource();
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    noise.buffer = buf;
    noise.connect(gain); gain.connect(c.destination);
    noise.start(now);
    // Low thud
    const osc = c.createOscillator();
    const oGain = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.2);
    oGain.gain.setValueAtTime(0.3, now);
    oGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(oGain); oGain.connect(c.destination);
    osc.start(now); osc.stop(now + 0.22);
  }, [ctx]);

  // ── PLAYER HIT — descending tone + static ────────────────────────────────
  const playerHit = useCallback(() => {
    const c = ctx();
    const now = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.3);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(now); osc.stop(now + 0.35);
    // Static burst after
    setTimeout(() => {
      const c2 = ctx();
      const t = c2.currentTime;
      const bufLen = Math.floor(c2.sampleRate * 0.08);
      const buf = c2.createBuffer(1, bufLen, c2.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1) * 0.3;
      const n = c2.createBufferSource();
      const g = c2.createGain();
      g.gain.setValueAtTime(0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      n.buffer = buf; n.connect(g); g.connect(c2.destination);
      n.start(t);
    }, 300);
  }, [ctx]);

  // ── ALERT KLAXON — spacecraft warning ────────────────────────────────────
  const startAlertKlaxon = useCallback((): StopFn => {
    // Repeating two-tone klaxon
    let running = true;
    const playTone = (freq: number, delay: number) => {
      if (!running) return;
      setTimeout(() => {
        if (!running) return;
        const c = ctx();
        const now = c.currentTime;
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.setValueAtTime(0.12, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain); gain.connect(c.destination);
        osc.start(now); osc.stop(now + 0.22);
      }, delay);
    };

    const cycle = () => {
      if (!running) return;
      playTone(880, 0);
      playTone(660, 250);
      setTimeout(cycle, 600);
    };
    cycle();

    return () => { running = false; };
  }, [ctx]);

  // ── TERMINAL BOOT ─────────────────────────────────────────────────────────
  const terminalBoot = useCallback(() => {
    const c = ctx();
    const now = c.currentTime;
    // Relay clicks
    [0, 0.1, 0.18, 0.28].forEach(t => {
      const bufLen = Math.floor(c.sampleRate * 0.01);
      const buf = c.createBuffer(1, bufLen, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.1));
      const n = c.createBufferSource();
      const g = c.createGain();
      g.gain.value = 0.2;
      n.buffer = buf; n.connect(g); g.connect(c.destination);
      n.start(now + t);
    });
    // Diagnostic tones
    [440, 660, 880].forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      const t = now + 0.4 + i * 0.12;
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain); gain.connect(c.destination);
      osc.start(t); osc.stop(t + 0.1);
    });
  }, [ctx]);

  // ── AMBIENT HUM ───────────────────────────────────────────────────────────
  const startAmbient = useCallback((): StopFn => {
    const c = ctx();
    const now = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = 55;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 1);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(now);

    ambientRef.current = () => {
      const t = c.currentTime;
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      setTimeout(() => { try { osc.stop(); } catch {} }, 600);
    };
    return ambientRef.current;
  }, [ctx]);

  // ── WAVE CLEAR ────────────────────────────────────────────────────────────
  const waveClear = useCallback(() => {
    const c = ctx();
    const now = c.currentTime;
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      const t = now + i * 0.1;
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain); gain.connect(c.destination);
      osc.start(t); osc.stop(t + 0.14);
    });
  }, [ctx]);

  const stopAll = useCallback(() => {
    if (ambientRef.current) { ambientRef.current(); ambientRef.current = null; }
    if (klaxonRef.current) { clearInterval(klaxonRef.current); klaxonRef.current = null; }
  }, []);

  return { shoot, enemyHit, explosion, playerHit, startAlertKlaxon, terminalBoot, startAmbient, waveClear, stopAll };
}
