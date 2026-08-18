/**
 * AudioWorklet processor source — loaded via Blob URL so no Vite worklet
 * config is needed. One node serves three jobs:
 *   input 0: dry mic  -> YIN pitch tracking + dry-stem recording
 *   input 1: master bus -> master recording
 * The processor is intentionally plain JS inside a template string.
 */

export const WORKLET_NAME = 'voxform-processor';

export function workletSource(): string {
  return `
'use strict';
class VoxformProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const opts = (options && options.processorOptions) || {};
    this.sr = sampleRate;
    this.ringSize = 8192;
    this.ring = new Float32Array(this.ringSize);
    this.writeIdx = 0;
    this.sinceDetect = 0;
    // 'smooth' = 2048 window, lower rate; 'fast' = 1024 window, faster updates
    this.window = opts.window || 2048;
    this.interval = opts.interval || 1536; // samples between detections
    this.yinThresh = 0.15;
    this.minFreq = 45;
    this.maxFreq = 1600;
    this.recording = false;
    this.recBuf = null; // {dryL:[],dryR:[],mstL:[],mstR:[],frames:0}
    this.chunkFrames = 8192;
    this.port.onmessage = (e) => {
      const m = e.data || {};
      if (m.type === 'config') {
        if (m.window) this.window = m.window;
        if (m.interval) this.interval = m.interval;
        if (typeof m.yinThresh === 'number') this.yinThresh = m.yinThresh;
      } else if (m.type === 'record') {
        if (m.on && !this.recording) {
          this.recBuf = { dryL: [], dryR: [], mstL: [], mstR: [], frames: 0 };
        }
        this.recording = !!m.on;
      } else if (m.type === 'flushRec') {
        this.flushRec(true);
      }
    };
  }

  pushRing(x) {
    this.ring[this.writeIdx] = x;
    this.writeIdx = (this.writeIdx + 1) % this.ringSize;
  }

  detect() {
    const W = Math.min(this.window, this.ringSize);
    const buf = new Float32Array(W);
    let idx = (this.writeIdx - W + this.ringSize) % this.ringSize;
    for (let i = 0; i < W; i++) { buf[i] = this.ring[idx]; idx = (idx + 1) % this.ringSize; }
    const maxTau = Math.min(Math.floor(this.sr / this.minFreq), (W >> 1) - 2);
    const minTau = Math.max(2, Math.floor(this.sr / this.maxFreq));
    // difference function
    const d = new Float32Array(maxTau + 1);
    for (let tau = 1; tau <= maxTau; tau++) {
      let sum = 0;
      const lim = W - maxTau;
      for (let j = 0; j < lim; j++) {
        const diff = buf[j] - buf[j + tau];
        sum += diff * diff;
      }
      d[tau] = sum;
    }
    // cumulative mean normalized difference
    const cm = new Float32Array(maxTau + 1);
    cm[0] = 1;
    let run = 0;
    for (let tau = 1; tau <= maxTau; tau++) {
      run += d[tau];
      cm[tau] = run > 0 ? (d[tau] * tau) / run : 1;
    }
    // absolute threshold
    let tau = -1;
    for (let t = minTau; t <= maxTau; t++) {
      if (cm[t] < this.yinThresh) {
        while (t + 1 <= maxTau && cm[t + 1] < cm[t]) t++;
        tau = t;
        break;
      }
    }
    if (tau < 0) {
      // fall back to global minimum (still report low confidence)
      let best = minTau;
      for (let t = minTau; t <= maxTau; t++) if (cm[t] < cm[best]) best = t;
      const conf = Math.max(0, 1 - cm[best]);
      if (conf < 0.35) return { freq: 0, confidence: conf };
      tau = best;
    }
    // parabolic interpolation
    let better = tau;
    if (tau > minTau && tau < maxTau) {
      const s0 = cm[tau - 1], s1 = cm[tau], s2 = cm[tau + 1];
      const denom = s0 - 2 * s1 + s2;
      if (Math.abs(denom) > 1e-9) better = tau + (s0 - s2) / (2 * denom);
    }
    const freq = this.sr / better;
    const confidence = Math.max(0, Math.min(1, 1 - cm[tau]));
    if (freq < this.minFreq || freq > this.maxFreq) return { freq: 0, confidence: 0 };
    return { freq, confidence };
  }

  flushRec(final) {
    if (!this.recBuf || this.recBuf.frames === 0) return;
    const F = this.recBuf.frames;
    const mk = (list) => {
      const out = new Float32Array(F);
      let o = 0;
      for (let i = 0; i < list.length; i++) { out.set(list[i], o); o += list[i].length; }
      return out;
    };
    const dryL = mk(this.recBuf.dryL), dryR = mk(this.recBuf.dryR);
    const mstL = mk(this.recBuf.mstL), mstR = mk(this.recBuf.mstR);
    this.port.postMessage({ type: 'recChunk', final: !!final, dryL, dryR, mstL, mstR },
      [dryL.buffer, dryR.buffer, mstL.buffer, mstR.buffer]);
    this.recBuf = { dryL: [], dryR: [], mstL: [], mstR: [], frames: 0 };
  }

  recPush(ch, arr, frames) { this.recBuf[ch].push(arr ? arr.slice() : new Float32Array(frames)); }

  process(inputs) {
    const mic = inputs[0];
    const bus = inputs[1];
    const micL = mic && mic[0];
    const frames = (micL && micL.length) || (bus && bus[0] && bus[0].length) || 128;

    // --- pitch tracking on mic ---
    let rms = 0;
    if (micL) {
      for (let i = 0; i < frames; i++) {
        const x = micL[i];
        this.pushRing(x);
        rms += x * x;
      }
      rms = Math.sqrt(rms / frames);
      this.sinceDetect += frames;
      if (this.sinceDetect >= this.interval) {
        this.sinceDetect = 0;
        const r = this.detect();
        this.port.postMessage({ type: 'pitch', freq: r.freq, confidence: r.confidence, rms });
      }
    }

    // --- recording ---
    if (this.recording && this.recBuf) {
      this.recPush('dryL', micL || null, frames);
      this.recPush('dryR', (mic && (mic[1] || mic[0])) || null, frames);
      this.recPush('mstL', bus && bus[0] ? bus[0] : null, frames);
      this.recPush('mstR', bus && (bus[1] || bus[0]) ? (bus[1] || bus[0]) : null, frames);
      this.recBuf.frames += frames;
      if (this.recBuf.frames >= this.chunkFrames) this.flushRec(false);
    }
    return true;
  }
}
registerProcessor('${WORKLET_NAME}', VoxformProcessor);
`;
}
