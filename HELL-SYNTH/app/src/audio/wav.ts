/**
 * Take rendering + hand-rolled RIFF WAV encoder (48 kHz / 32-bit IEEE float).
 * No dependencies.
 */

import type { RecordedTake, WavExportOptions, WavExportResult } from './contract';
import { clamp } from './dsp';

export const TARGET_SR = 48000;

/** Linear-interpolation resample to 48 kHz (no-op when already there). */
export function resampleTo48k(input: Float32Array, srcRate: number): Float32Array {
  if (Math.abs(srcRate - TARGET_SR) < 1e-6) return input;
  const ratio = srcRate / TARGET_SR;
  const outLen = Math.max(1, Math.round(input.length / ratio));
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const pos = i * ratio;
    const i0 = Math.floor(pos);
    const i1 = Math.min(input.length - 1, i0 + 1);
    const t = pos - i0;
    out[i] = input[i0] + (input[i1] - input[i0]) * t;
  }
  return out;
}

/** Encode interleaved float channels as a 48kHz/32-bit float stereo WAV. */
export function encodeWavFloat32(channels: Float32Array[], sampleRate = TARGET_SR): Blob {
  const numCh = 2;
  const L = channels[0] ?? new Float32Array(0);
  const R = channels[1] ?? L;
  const frames = Math.min(L.length, R.length);
  const bytesPerSample = 4;
  const blockAlign = numCh * bytesPerSample;
  const dataSize = frames * blockAlign;
  const fmtSize = 16;
  const factChunkSize = 12; // 4 id + 4 size + 4 payload
  const riffSize = 4 + (8 + fmtSize) + factChunkSize + (8 + dataSize);

  const buf = new ArrayBuffer(8 + riffSize);
  const v = new DataView(buf);
  let o = 0;
  const writeStr = (s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o++, s.charCodeAt(i));
  };
  const u32 = (x: number) => { v.setUint32(o, x, true); o += 4; };
  const u16 = (x: number) => { v.setUint16(o, x, true); o += 2; };
  const f32 = (x: number) => { v.setFloat32(o, x, true); o += 4; };

  writeStr('RIFF'); u32(riffSize); writeStr('WAVE');
  writeStr('fmt '); u32(fmtSize);
  u16(3);                 // IEEE float
  u16(numCh);
  u32(sampleRate);
  u32(sampleRate * blockAlign);
  u16(blockAlign);
  u16(32);
  writeStr('fact'); u32(4); u32(frames);
  writeStr('data'); u32(dataSize);
  for (let i = 0; i < frames; i++) {
    f32(clamp(L[i], -1, 1));
    f32(clamp(R[i], -1, 1));
  }
  return new Blob([buf], { type: 'audio/wav' });
}

function peakOf(channels: Float32Array[]): number {
  let peak = 0;
  for (const ch of channels) {
    for (let i = 0; i < ch.length; i++) {
      const a = Math.abs(ch[i]);
      if (a > peak) peak = a;
    }
  }
  return peak;
}

/** Trim to [startSec, endSec] and optionally normalize peak to -1 dBFS. */
function renderStem(
  channels: Float32Array[],
  opts: WavExportOptions,
): { channels: Float32Array[]; frames: number } {
  const total = channels[0]?.length ?? 0;
  const s = clamp(Math.floor(opts.trimStartSec * TARGET_SR), 0, total);
  const e = clamp(Math.ceil(opts.trimEndSec * TARGET_SR), s, total);
  const sliced = channels.slice(0, 2).map((c) => c.slice(s, e));
  while (sliced.length < 2) sliced.push(new Float32Array(sliced[0]?.length ?? 0));
  if (opts.normalize) {
    const peak = peakOf(sliced);
    const target = Math.pow(10, -1 / 20); // -1 dBFS
    if (peak > 1e-6) {
      const g = target / peak;
      for (const c of sliced) for (let i = 0; i < c.length; i++) c[i] *= g;
    }
  }
  return { channels: sliced, frames: sliced[0].length };
}

export function exportTakeWav(take: RecordedTake, opts: WavExportOptions): WavExportResult {
  const main = renderStem(take.channels, opts);
  const wav = encodeWavFloat32(main.channels, TARGET_SR);
  let dryWav: Blob | null = null;
  if (opts.includeDryStem && take.dryChannels && take.dryChannels.length > 0) {
    // dry stem keeps its own level relative to the same trim (not normalized
    // against the synth peak — normalized independently for usability)
    const dry = renderStem(take.dryChannels, { ...opts });
    dryWav = encodeWavFloat32(dry.channels, TARGET_SR);
  }
  const durationSec = main.frames / TARGET_SR;
  return { wav, dryWav, durationSec, sizeBytes: wav.size + (dryWav?.size ?? 0) };
}

/** Concatenate recorded worklet chunks into one array per channel. */
export function concatChunks(chunks: Float32Array[]): Float32Array {
  let total = 0;
  for (const c of chunks) total += c.length;
  const out = new Float32Array(total);
  let o = 0;
  for (const c of chunks) { out.set(c, o); o += c.length; }
  return out;
}
