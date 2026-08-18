/**
 * Wavetable authoring — 6 families x 8 frames of Fourier (sine) tables.
 * Frames are morphed by interpolating harmonic coefficients (linear in
 * coefficient space == exact crossfade of the resulting PeriodicWaves).
 */

import type { WavetableName } from './contract';
import { clamp, lerp } from './dsp';

export const FRAMES_PER_TABLE = 8;
const MAX_HARMONICS = 28;

type Table = number[][]; // [frame][harmonic-1] = sine coefficient

/** Build a table from per-frame harmonic functions. */
function build(frameFns: Array<(h: number) => number>): Table {
  return frameFns.map((fn) => {
    const frame = new Array<number>(MAX_HARMONICS).fill(0);
    for (let h = 1; h <= MAX_HARMONICS; h++) frame[h - 1] = fn(h);
    return frame;
  });
}

const saw = (h: number): number => 1 / h;
const square = (h: number): number => (h % 2 === 1 ? 1 / h : 0);
const tri = (h: number): number =>
  h % 2 === 1 ? (1 / (h * h)) * (h % 4 === 1 ? 1 : -1) : 0;
const pulse = (duty: number) => (h: number): number =>
  (2 / (h * Math.PI)) * Math.sin(Math.PI * h * duty);

/** Simple formant bump: harmonics near `center` get boosted. */
const formant = (center: number, width: number, gain: number) => (h: number): number => {
  const base = 1 / h;
  const d = (h - center) / width;
  return base * (1 + gain * Math.exp(-d * d));
};

const TABLES: Record<WavetableName, Table> = {
  basicShapes: build([
    (h) => (h === 1 ? 1 : 0),
    (h) => tri(h) * 1.6,
    (h) => saw(h) * 0.5 + tri(h) * 0.5,
    (h) => saw(h),
    (h) => square(h),
    (h) => pulse(0.25)(h),
    (h) => pulse(0.125)(h),
    (h) => (h <= 16 ? 1 / Math.pow(h, 0.5) : 0), // bright wall
  ]),

  analogGrit: build([
    (h) => saw(h) * (h % 2 === 0 ? 1.15 : 1),
    (h) => saw(h) + (h === 2 ? 0.3 : 0),
    (h) => saw(h) * (1 + 0.25 * Math.sin(h * 1.7)),
    (h) => square(h) + saw(h) * 0.35,
    (h) => saw(h) * (h % 3 === 0 ? 1.6 : 0.9),
    (h) => (h <= 20 ? 1 / h : 0) * (1 + 0.4 * Math.sin(h * 3.1)),
    (h) => pulse(0.42)(h) * (1 + 0.3 * Math.cos(h)),
    (h) => (h <= 12 ? 1 / Math.pow(h, 0.7) : saw(h) * 0.3),
  ]),

  vocalFormant: build([
    formant(4, 2.2, 6),   // "ah"
    formant(5, 2.4, 5),
    formant(7, 2.6, 5),   // "eh"
    formant(9, 2.4, 5.5), // "ee"
    formant(3, 1.8, 6),   // "oh"
    formant(2, 1.5, 7),   // "oo"
    (h) => formant(6, 3, 4)(h) + formant(12, 3, 2)(h), // double formant
    (h) => formant(10, 4, 3)(h) + tri(h) * 0.4,
  ]),

  harmonics: build([
    (h) => (h === 1 ? 1 : 0),
    (h) => (h === 1 ? 1 : h === 2 ? 0.6 : 0),
    (h) => (h <= 3 ? 1 / h : 0),
    (h) => (h <= 4 ? 1 / h : 0),
    (h) => (h <= 6 ? 1 / h : 0),
    (h) => (h <= 8 ? 1 / Math.pow(h, 0.8) : 0),
    (h) => (h <= 12 ? 1 / Math.pow(h, 0.75) : 0),
    (h) => (h <= 16 ? 1 / Math.pow(h, 0.7) : 0),
  ]),

  digitalEdge: build([
    (h) => (h <= 24 ? 1 : 0),                    // flat band -> aggressive
    (h) => (h <= 24 && h % 2 === 1 ? 1 : 0.15),
    (h) => (h % 4 === 1 ? 1.2 : h % 4 === 3 ? 0.8 : 0), // hollow metallic
    (h) => (h <= 8 ? 1 : h <= 24 ? 0.25 : 0),    // stepped (crushed)
    (h) => (h === 1 || h === 5 || h === 9 || h === 13 ? 1 : 0.08),
    (h) => pulse(0.1)(h) * 1.4,
    (h) => (h <= 24 ? Math.sin(h * 0.9) * 0.9 : 0),
    (h) => (h <= 24 ? (h % 2 === 1 ? 1 : -0.6) / Math.pow(h, 0.4) : 0),
  ]),

  glass: build([
    (h) => (h === 1 ? 1 : h === 3 ? 0.2 : h === 7 ? 0.08 : 0),
    (h) => (h === 1 ? 0.9 : h === 2 ? 0.35 : h === 5 ? 0.18 : h === 9 ? 0.08 : 0),
    (h) => (h <= 6 ? Math.exp(-h * 0.7) : 0) + (h === 11 ? 0.1 : 0),
    (h) => (h === 1 ? 0.7 : 0) + (h >= 4 && h <= 14 ? Math.exp(-(h - 4) * 0.5) * 0.5 : 0),
    (h) => tri(h) + (h === 6 ? 0.2 : h === 10 ? 0.1 : 0),
    (h) => (h % 3 === 1 && h <= 16 ? Math.exp(-h * 0.35) : 0),
    (h) => (h === 1 ? 0.6 : 0) + (h >= 7 && h <= 20 ? Math.exp(-(h - 7) * 0.4) * 0.6 : 0),
    (h) => (h === 2 ? 0.8 : 0) + (h >= 5 && h <= 24 ? Math.exp(-(h - 5) * 0.35) * 0.5 : 0),
  ]),
};

/** Harmonic coefficients of a family morphed to wtPos (0..1). */
export function morphedCoefficients(name: WavetableName, wtPos: number): Float32Array<ArrayBuffer> {
  const table = TABLES[name] ?? TABLES.basicShapes;
  const F = table.length;
  const x = clamp(wtPos, 0, 1) * (F - 1);
  const lo = Math.floor(x);
  const hi = Math.min(F - 1, lo + 1);
  const t = x - lo;
  const out = new Float32Array(MAX_HARMONICS);
  const a = table[lo];
  const b = table[hi];
  for (let h = 0; h < MAX_HARMONICS; h++) out[h] = lerp(a[h], b[h], t);
  return out;
}

/** Build a PeriodicWave for a morphed position. */
export function buildWave(ctx: BaseAudioContext, name: WavetableName, wtPos: number): PeriodicWave {
  const imag = morphedCoefficients(name, wtPos);
  const real = new Float32Array(imag.length);
  return ctx.createPeriodicWave(real, imag, { disableNormalization: false });
}
