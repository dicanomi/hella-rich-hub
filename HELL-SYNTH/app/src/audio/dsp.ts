/**
 * Shared DSP helpers — pure functions, no Web Audio graph knowledge.
 */

export const clamp = (v: number, lo: number, hi: number): number =>
  v < lo ? lo : v > hi ? hi : v;

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** MIDI note number -> Hz (A4 = 69 = 440). */
export const mtof = (midi: number): number => 440 * Math.pow(2, (midi - 69) / 12);

/** Hz -> float MIDI note number. */
export const ftom = (freq: number): number =>
  freq > 0 ? 69 + 12 * Math.log2(freq / 440) : 0;

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function noteName(midi: number): { name: string; octave: number } {
  const n = Math.round(midi);
  const pc = ((n % 12) + 12) % 12;
  return { name: NOTE_NAMES[pc], octave: Math.floor(n / 12) - 1 };
}

// ---------------------------------------------------------------------------
// Scales (semitone sets relative to root)
// ---------------------------------------------------------------------------

import type { ScaleName } from './contract';

const SCALES: Record<ScaleName, number[]> = {
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 2, 4, 7, 9],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  wholeTone: [0, 2, 4, 6, 8, 10],
};

/** Snap a float midi value to the nearest note of scale/root. */
export function snapToScale(midi: number, scale: ScaleName, root: number): number {
  const tones = SCALES[scale] ?? SCALES.chromatic;
  if (tones.length === 12) return Math.round(midi);
  let best = Math.round(midi);
  let bestDist = Infinity;
  // search +-1 octave window
  const base = Math.floor(midi) - 12;
  for (let n = base; n < base + 36; n++) {
    const pc = (((n - root) % 12) + 12) % 12;
    if (tones.includes(pc)) {
      const d = Math.abs(n - midi);
      if (d < bestDist) {
        bestDist = d;
        best = n;
      }
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Envelope segment curves (for setValueCurveAtTime)
// ---------------------------------------------------------------------------

import type { EnvCurve } from './contract';

/** Normalized 0->1 segment shape used by both scheduled curves and the
 *  JS-side envelope tracker (keep them identical). */
export function segK(t: number, curve: EnvCurve, attack: boolean): number {
  if (curve === 'lin') return t;
  if (curve === 'exp') return attack ? t * t : 1 - (1 - t) * (1 - t);
  return attack ? 1 - (1 - t) * (1 - t) : t * t;
}

/** Build a v0 -> v1 segment curve. */
export function segmentCurve(v0: number, v1: number, curve: EnvCurve, attack: boolean): Float32Array<ArrayBuffer> {
  const N = 32;
  const out = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    out[i] = v0 + (v1 - v0) * segK(t, curve, attack);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Noise buffer
// ---------------------------------------------------------------------------

/** 2 seconds of white noise, stereo. */
export function makeNoiseBuffer(ctx: BaseAudioContext, seconds = 2): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  return buf;
}

// ---------------------------------------------------------------------------
// Reverb impulse response
// ---------------------------------------------------------------------------

/** Stereo exponential-decay noise IR. size 0..1 -> 0.4..4s, slight damping. */
export function makeReverbIR(ctx: BaseAudioContext, size: number): AudioBuffer {
  const seconds = 0.4 + Math.pow(clamp(size, 0, 1), 1.5) * 3.6;
  const len = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  const decay = 3.5 + (1 - size) * 4; // higher size = longer tail
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const env = Math.pow(1 - t, decay);
      const w = Math.random() * 2 - 1;
      // gentle lowpass over time (damping)
      lp += (0.35 + 0.5 * (1 - t)) * (w - lp);
      d[i] = lp * env;
    }
  }
  return buf;
}

// ---------------------------------------------------------------------------
// Waveshaper curves
// ---------------------------------------------------------------------------

/** tanh drive curve; amount 0..1 -> gain 1..~40 */
export function driveCurve(amount: number, n = 256): Float32Array<ArrayBuffer> {
  const k = 1 + amount * amount * 39;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.tanh(k * x) / Math.tanh(k * 0.8);
  }
  return curve;
}

/** 'bend' warp: asymmetric phase-ish skew. amount 0..1 */
export function bendCurve(amount: number, n = 512): Float32Array<ArrayBuffer> {
  const a = clamp(amount, 0, 1);
  const p = 1 / (1 + a * 4);
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    // power warp preserves sign, brightens as amt rises
    curve[i] = Math.sign(x) * Math.pow(Math.abs(x), p);
  }
  return curve;
}

/** 'mirror' warp: fold negative half up (rectify-fold, octave-up flavor). */
export function mirrorCurve(amount: number, n = 512): Float32Array<ArrayBuffer> {
  const a = clamp(amount, 0, 1);
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    const folded = Math.abs(x) * 2 - 1; // full fold
    curve[i] = x + (folded - x) * a;
  }
  return curve;
}

/** Sync window curve: maps slave saw [-1,1] to a raised window [0..1]. */
export function syncWindowCurve(n = 256): Float32Array<ArrayBuffer> {
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1; // slave saw value
    const t = (x + 1) / 2;
    // raised cosine with floor so signal never fully ducks
    curve[i] = 0.12 + 0.88 * (0.5 - 0.5 * Math.cos(Math.PI * 2 * Math.min(1, t * 1.4)));
  }
  return curve;
}

/** LFO value for shape at phase (0..1). s+h handled by caller (stepped). */
export function lfoShapeValue(shape: string, phase: number): number {
  const p = phase - Math.floor(phase);
  switch (shape) {
    case 'sine': return Math.sin(p * Math.PI * 2);
    case 'tri': return p < 0.5 ? p * 4 - 1 : 3 - p * 4;
    case 'saw': return p * 2 - 1;
    case 'square': return p < 0.5 ? 1 : -1;
    default: return Math.sin(p * Math.PI * 2);
  }
}

/** BPM-synced LFO division -> Hz. Defaults to 120 when no transport BPM is
 *  supplied; the engine always passes the live master BPM. */
export function syncDivisionToHz(division: string, bpm = 120): number {
  const BPM = bpm;
  const beatsPerSec = BPM / 60;
  const map: Record<string, number> = {
    '1/1': beatsPerSec / 4,
    '1/2': beatsPerSec / 2,
    '1/2T': beatsPerSec / 3,
    '1/4': beatsPerSec,
    '1/4T': (beatsPerSec * 2) / 3,
    '1/8': beatsPerSec * 2,
    '1/8T': (beatsPerSec * 4) / 3,
    '1/16': beatsPerSec * 4,
    '1/32': beatsPerSec * 8,
  };
  return map[division] ?? beatsPerSec;
}

export const uid = (): string =>
  `r${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
