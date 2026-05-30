/**
 * usePerhapsAudio — THE EYE audio engine
 * Source: dicanomi/the-eye (deployed repo)
 * Procedural Web Audio. No external files. Every interaction sounds different.
 * 12 primary sounds + 3 rare sounds + ambient hum.
 */
import { useCallback, useRef } from 'react';

type SoundFn = (ctx: AudioContext, now: number, dest: AudioNode) => void;

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pitchVariance = (base: number, semitones: number) =>
  base * Math.pow(2, rand(-semitones, semitones) / 12);

function addTapeEcho(ctx: AudioContext, src: AudioNode, dest: AudioNode, delayTime: number, feedback: number, wet: number) {
  const delay = ctx.createDelay(1.0);
  delay.delayTime.value = delayTime;
  const fb = ctx.createGain(); fb.gain.value = feedback;
  const wetGain = ctx.createGain(); wetGain.gain.value = wet;
  const dryGain = ctx.createGain(); dryGain.gain.value = 1 - wet * 0.3;
  src.connect(dryGain); dryGain.connect(dest);
  src.connect(delay); delay.connect(fb); fb.connect(delay);
  delay.connect(wetGain); wetGain.connect(dest);
}

function addStereoDrift(ctx: AudioContext, src: AudioNode, dest: AudioNode) {
  if (!ctx.createStereoPanner) { src.connect(dest); return; }
  const pan = ctx.createStereoPanner();
  pan.pan.value = rand(-0.4, 0.4);
  src.connect(pan); pan.connect(dest);
}

// ── Primary sounds ──────────────────────────────────────────────────────────
const softBloop: SoundFn = (ctx, now, dest) => {
  const g = ctx.createGain(); g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.18, now + 0.012); g.gain.exponentialRampToValueAtTime(0.001, now + 0.38); g.connect(dest);
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; f.Q.value = 1.2; f.connect(g);
  const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(pitchVariance(280, 2), now); o.frequency.exponentialRampToValueAtTime(pitchVariance(220, 1), now + 0.38); o.connect(f); o.start(now); o.stop(now + 0.42);
};

const hauntedChime: SoundFn = (ctx, now, dest) => {
  const freqs = [pitchVariance(523, 1), pitchVariance(659, 1), pitchVariance(784, 1)];
  freqs.forEach((freq, i) => {
    const t = now + i * rand(0.04, 0.08);
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.09 - i * 0.02, t + 0.008); g.gain.exponentialRampToValueAtTime(0.001, t + 1.2 - i * 0.15); g.connect(dest);
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = freq; o.connect(g); o.start(t); o.stop(t + 1.3);
  });
};

const tapeWarp: SoundFn = (ctx, now, dest) => {
  const base = pitchVariance(180, 3);
  const g = ctx.createGain(); g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.14, now + 0.02); g.gain.setValueAtTime(0.14, now + 0.3); g.gain.exponentialRampToValueAtTime(0.001, now + 0.9); g.connect(dest);
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = base * 2; f.Q.value = 2; f.connect(g);
  const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(base * 1.5, now); o.frequency.exponentialRampToValueAtTime(base * 0.6, now + 0.9); o.connect(f); o.start(now); o.stop(now + 1.0);
  addTapeEcho(ctx, g, dest, 0.18, 0.22, 0.2);
};

const cosmicPop: SoundFn = (ctx, now, dest) => {
  const g = ctx.createGain(); g.gain.setValueAtTime(0.22, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.08); g.connect(dest);
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.08), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * 0.15));
  const s = ctx.createBufferSource(); s.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = pitchVariance(600, 4); f.Q.value = 3;
  s.connect(f); f.connect(g); s.start(now);
};

const scifiStab: SoundFn = (ctx, now, dest) => {
  const base = pitchVariance(440, 2);
  const g = ctx.createGain(); g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.16, now + 0.005); g.gain.exponentialRampToValueAtTime(0.001, now + 0.22); g.connect(dest);
  const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 200; f.connect(g);
  const o1 = ctx.createOscillator(); o1.type = 'square'; o1.frequency.setValueAtTime(base, now); o1.frequency.exponentialRampToValueAtTime(base * 0.5, now + 0.22); o1.connect(f); o1.start(now); o1.stop(now + 0.25);
  const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = base * 2; const g2 = ctx.createGain(); g2.gain.value = 0.3; o2.connect(g2); g2.connect(g); o2.start(now); o2.stop(now + 0.15);
};

const machineWhisper: SoundFn = (ctx, now, dest) => {
  const dur = 0.6 + rand(0, 0.3);
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1);
  const s = ctx.createBufferSource(); s.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = pitchVariance(1200, 3); f.Q.value = 8;
  const g = ctx.createGain(); g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.06, now + 0.05); g.gain.setValueAtTime(0.06, now + dur - 0.1); g.gain.linearRampToValueAtTime(0, now + dur);
  s.connect(f); f.connect(g); g.connect(dest); s.start(now);
};

const weirdToy: SoundFn = (ctx, now, dest) => {
  const base = pitchVariance(660, 4);
  const g = ctx.createGain(); g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.12, now + 0.01); g.gain.exponentialRampToValueAtTime(0.001, now + 0.5); g.connect(dest);
  const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(base, now); o.frequency.setValueAtTime(base * 1.5, now + 0.05); o.frequency.setValueAtTime(base * 0.75, now + 0.15); o.frequency.setValueAtTime(base * 1.2, now + 0.28); o.connect(g); o.start(now); o.stop(now + 0.55);
};

const reversedSurface: SoundFn = (ctx, now, dest) => {
  const dur = 0.8; const samples = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, samples, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < samples; i++) { const t = i / samples; d[samples - 1 - i] = (Math.random() * 2 - 1) * t * t * Math.exp(-t * 4) * 0.5; }
  const s = ctx.createBufferSource(); s.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = pitchVariance(800, 2);
  const g = ctx.createGain(); g.gain.value = 0.28; s.connect(f); f.connect(g); g.connect(dest); s.start(now);
};

const analogDescend: SoundFn = (ctx, now, dest) => {
  const base = pitchVariance(320, 2);
  const g = ctx.createGain(); g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.15, now + 0.015); g.gain.exponentialRampToValueAtTime(0.001, now + 0.7); g.connect(dest);
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1200; f.Q.value = 0.8; f.connect(g);
  const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(base, now); o.frequency.exponentialRampToValueAtTime(base * 0.35, now + 0.7); o.connect(f); o.start(now); o.stop(now + 0.75);
  addTapeEcho(ctx, g, dest, 0.15, 0.18, 0.15);
};

const mechanicalPrint: SoundFn = (ctx, now, dest) => {
  [0, 0.06, 0.13, 0.19].forEach(offset => {
    const t = now + offset;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.1, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.04); g.connect(dest);
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.04), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * 0.3));
    const s = ctx.createBufferSource(); s.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2000 + rand(-200, 200); f.Q.value = 2;
    s.connect(f); f.connect(g); s.start(t);
  });
};

const cosmicHmm: SoundFn = (ctx, now, dest) => {
  const base = pitchVariance(110, 2);
  const g = ctx.createGain(); g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.1, now + 0.08); g.gain.setValueAtTime(0.1, now + 0.5); g.gain.exponentialRampToValueAtTime(0.001, now + 1.1); g.connect(dest);
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 600; f.Q.value = 1.5; f.connect(g);
  const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = base; o1.connect(f); o1.start(now); o1.stop(now + 1.2);
  const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = base * 1.5; const g2 = ctx.createGain(); g2.gain.value = 0.06; o2.connect(g2); g2.connect(f); o2.start(now); o2.stop(now + 1.2);
  addTapeEcho(ctx, g, dest, 0.2, 0.28, 0.25);
};

const alienChirp: SoundFn = (ctx, now, dest) => {
  const base = pitchVariance(880, 3);
  const g = ctx.createGain(); g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.13, now + 0.005); g.gain.exponentialRampToValueAtTime(0.001, now + 0.35); g.connect(dest);
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = base; f.Q.value = 3; f.connect(g);
  const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(base * 0.5, now); o.frequency.exponentialRampToValueAtTime(base * 2.1, now + 0.08); o.frequency.exponentialRampToValueAtTime(base * 0.7, now + 0.18); o.frequency.exponentialRampToValueAtTime(base * 1.5, now + 0.28); o.frequency.exponentialRampToValueAtTime(base * 0.4, now + 0.33); o.connect(f); o.start(now); o.stop(now + 0.38);
};

// ── Rare sounds ─────────────────────────────────────────────────────────────
const rareDrone: SoundFn = (ctx, now, dest) => {
  const base = pitchVariance(55, 1);
  const g = ctx.createGain(); g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.12, now + 0.5); g.gain.setValueAtTime(0.12, now + 1.5); g.gain.exponentialRampToValueAtTime(0.001, now + 3.0); g.connect(dest);
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500; f.Q.value = 1.5; f.connect(g);
  for (let i = 0; i < 4; i++) { const o = ctx.createOscillator(); o.type = i % 2 === 0 ? 'sine' : 'triangle'; o.frequency.value = base * (i + 1) * (1 + rand(-0.005, 0.005)); const og = ctx.createGain(); og.gain.value = 0.25 / (i + 1); o.connect(og); og.connect(f); o.start(now); o.stop(now + 3.2); }
  const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.18; const ld = ctx.createGain(); ld.gain.value = 3; lfo.connect(ld); ld.connect(f.frequency); lfo.start(now); lfo.stop(now + 3.2);
  addTapeEcho(ctx, g, dest, 0.3, 0.35, 0.3);
};

const rareGlitchCascade: SoundFn = (ctx, now, dest) => {
  [220, 330, 165, 440, 110, 550, 275].forEach((freq, i) => {
    const t = now + i * rand(0.04, 0.07);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.15 - i * 0.015, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12); g.connect(dest);
    const o = ctx.createOscillator(); o.type = i % 3 === 0 ? 'square' : i % 3 === 1 ? 'sawtooth' : 'triangle'; o.frequency.value = pitchVariance(freq, 1); o.connect(g); o.start(t); o.stop(t + 0.14);
  });
};

const rareReversedShimmer: SoundFn = (ctx, now, dest) => {
  const dur = 1.2; const samples = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(2, samples, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < samples; i++) { const t = i / samples; const env = t * t * Math.exp(-t * 3); d[samples - 1 - i] = (Math.random() * 2 - 1) * env * 0.4; } }
  const ns = ctx.createBufferSource(); ns.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 800;
  const g = ctx.createGain(); g.gain.value = 0.35; ns.connect(f); f.connect(g); g.connect(dest); ns.start(now);
  addTapeEcho(ctx, g, dest, 0.22, 0.32, 0.3);
};

interface SoundEntry { fn: SoundFn; weight: number; name: string; }

const SOUND_POOL: SoundEntry[] = [
  { fn: softBloop,       weight: 10, name: 'softBloop'       },
  { fn: hauntedChime,    weight: 9,  name: 'hauntedChime'    },
  { fn: tapeWarp,        weight: 8,  name: 'tapeWarp'        },
  { fn: cosmicPop,       weight: 7,  name: 'cosmicPop'       },
  { fn: scifiStab,       weight: 8,  name: 'scifiStab'       },
  { fn: machineWhisper,  weight: 6,  name: 'machineWhisper'  },
  { fn: weirdToy,        weight: 7,  name: 'weirdToy'        },
  { fn: reversedSurface, weight: 6,  name: 'reversedSurface' },
  { fn: analogDescend,   weight: 9,  name: 'analogDescend'   },
  { fn: mechanicalPrint, weight: 7,  name: 'mechanicalPrint' },
  { fn: cosmicHmm,       weight: 8,  name: 'cosmicHmm'       },
  { fn: alienChirp,      weight: 6,  name: 'alienChirp'      },
];

const RARE_POOL: SoundEntry[] = [
  { fn: rareDrone,           weight: 1, name: 'rareDrone'           },
  { fn: rareGlitchCascade,   weight: 1, name: 'rareGlitchCascade'   },
  { fn: rareReversedShimmer, weight: 1, name: 'rareReversedShimmer' },
];

function weightedPick(pool: SoundEntry[], exclude?: string): SoundEntry {
  const avail = exclude ? pool.filter(s => s.name !== exclude) : pool;
  const total = avail.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const s of avail) { r -= s.weight; if (r <= 0) return s; }
  return avail[avail.length - 1];
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function usePerhapsAudio() {
  const ctxRef    = useRef<AudioContext | null>(null);
  const humRef    = useRef<{ masterGain: GainNode } | null>(null);
  const humActive = useRef(false);
  const mutedRef  = useRef(false);
  const lastSoundRef = useRef<string>('');

  const getCtx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const startPulse = useCallback(() => {
    if (humActive.current || mutedRef.current) return;
    humActive.current = true;
    const ctx = getCtx();
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(0.048, now + 2.5);
    masterGain.connect(ctx.destination);
    humRef.current = { masterGain };

    const lpFilter = ctx.createBiquadFilter();
    lpFilter.type = 'lowpass'; lpFilter.frequency.value = 280; lpFilter.Q.value = 0.8;
    lpFilter.connect(masterGain);

    const root = ctx.createOscillator();
    root.type = 'sine'; root.frequency.value = 55.0;
    const rootGain = ctx.createGain(); rootGain.gain.value = 0.55;
    root.connect(rootGain); rootGain.connect(lpFilter);

    const fifth = ctx.createOscillator();
    fifth.type = 'triangle'; fifth.frequency.value = 82.5;
    const fifthGain = ctx.createGain(); fifthGain.gain.value = 0.06;
    fifth.connect(fifthGain); fifthGain.connect(lpFilter);

    const octave = ctx.createOscillator();
    octave.type = 'sine'; octave.frequency.value = 110.2;
    const octaveGain = ctx.createGain(); octaveGain.gain.value = 0.04;
    octave.connect(octaveGain); octaveGain.connect(lpFilter);

    const driftOsc = ctx.createOscillator();
    driftOsc.type = 'sine'; driftOsc.frequency.value = 165;
    const driftGain = ctx.createGain(); driftGain.gain.value = 0.015;
    driftOsc.connect(driftGain); driftGain.connect(lpFilter);

    const driftLFO = ctx.createOscillator();
    driftLFO.type = 'sine'; driftLFO.frequency.value = 1 / 23;
    const driftDepth = ctx.createGain(); driftDepth.gain.value = 8;
    driftLFO.connect(driftDepth); driftDepth.connect(driftOsc.frequency);
    driftLFO.start(now);

    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const noiseData = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) noiseData[i] = (Math.random() * 2 - 1);
    const noiseLoop = ctx.createBufferSource();
    noiseLoop.buffer = noiseBuf; noiseLoop.loop = true;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass'; noiseFilter.frequency.value = 200; noiseFilter.Q.value = 0.3;
    const noiseGain = ctx.createGain(); noiseGain.gain.value = 0.004;
    noiseLoop.connect(noiseFilter); noiseFilter.connect(noiseGain); noiseGain.connect(masterGain);
    noiseLoop.start(now);

    root.start(now); fifth.start(now); octave.start(now); driftOsc.start(now);
  }, [getCtx]);

  const setMuted = useCallback((muted: boolean) => {
    mutedRef.current = muted;
    if (humRef.current) {
      const ctx = getCtx();
      const g = humRef.current.masterGain;
      const now = ctx.currentTime;
      g.gain.cancelScheduledValues(now);
      g.gain.setValueAtTime(g.gain.value, now);
      g.gain.linearRampToValueAtTime(muted ? 0 : 0.048, now + 0.5);
    }
  }, [getCtx]);

  const playActivation = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    const now = ctx.currentTime;
    startPulse();
    const master = ctx.createGain(); master.gain.value = 1;
    addStereoDrift(ctx, master, ctx.destination);
    if (Math.random() < 0.04) {
      const rare = weightedPick(RARE_POOL);
      rare.fn(ctx, now, master);
      lastSoundRef.current = rare.name;
      return;
    }
    const primary = weightedPick(SOUND_POOL, lastSoundRef.current);
    lastSoundRef.current = primary.name;
    primary.fn(ctx, now, master);
    if (Math.random() < 0.4) {
      const secondary = weightedPick(SOUND_POOL, primary.name);
      const sg = ctx.createGain(); sg.gain.value = 0.35; sg.connect(master);
      secondary.fn(ctx, now + rand(0.02, 0.08), sg);
    }
  }, [getCtx, startPulse]);

  const playHover = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    const now = ctx.currentTime;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.028, now + 0.05); g.gain.exponentialRampToValueAtTime(0.001, now + 0.28); g.connect(ctx.destination);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 650; f.connect(g);
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(pitchVariance(300, 1), now); o.frequency.exponentialRampToValueAtTime(270, now + 0.28); o.connect(f); o.start(now); o.stop(now + 0.32);
  }, [getCtx]);

  const playGlitch = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    const now = ctx.currentTime;
    startPulse();
    rareGlitchCascade(ctx, now, ctx.destination);
    lastSoundRef.current = 'rareGlitchCascade';
  }, [getCtx, startPulse]);

  return { playActivation, playHover, playGlitch, startPulse, setMuted };
}
