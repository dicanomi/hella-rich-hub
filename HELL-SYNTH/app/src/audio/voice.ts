/**
 * Voice — the mono synth voice:
 *   OscA / OscB (wavetable, unison, warp) + Sub + Noise
 *   -> amp (ENV1) -> ladder/biquad filter -> voice out.
 * Also hosts the AHDSR envelope generators (shared with the mod pump).
 */

import type {
  EnvParams, FilterMode, FilterParams, NoiseParams, OscParams, SubParams,
} from './contract';
import {
  bendCurve, clamp, driveCurve, mirrorCurve, segmentCurve, segK, syncWindowCurve,
} from './dsp';
import { buildWave } from './wavetables';

const MAX_UNISON = 7;

// ---------------------------------------------------------------------------
// AHDSR envelope generator (JS truth + schedules AudioParams identically)
// ---------------------------------------------------------------------------

export class EnvGen {
  params: EnvParams;
  private phase: 'idle' | 'attack' | 'hold' | 'decay' | 'sustain' | 'release' = 'idle';
  private segStart = 0;   // seconds (AudioContext time)
  private segFrom = 0;    // level at segment start
  private level = 0;

  constructor(params: EnvParams) {
    this.params = params;
  }

  trigger(now: number): void {
    this.level = this.valueAt(now); // capture current level for click-free retrigger
    this.phase = 'attack';
    this.segStart = now;
    this.segFrom = this.level;
  }

  release(now: number): void {
    if (this.phase === 'idle') return;
    this.level = this.valueAt(now);
    this.phase = 'release';
    this.segStart = now;
    this.segFrom = this.level;
  }

  get active(): boolean {
    return this.phase !== 'idle';
  }

  valueAt(now: number): number {
    const p = this.params;
    const t = Math.max(0, now - this.segStart);
    const atk = p.attackMs / 1000;
    const hold = p.holdMs / 1000;
    const dec = p.decayMs / 1000;
    const rel = Math.max(0.001, p.releaseMs / 1000);
    switch (this.phase) {
      case 'idle': return 0;
      case 'attack': {
        if (atk <= 0.0005 || t >= atk) {
          this.level = 1;
          this.phase = hold > 0 ? 'hold' : 'decay';
          this.segStart = now;
          this.segFrom = 1;
          return 1;
        }
        return this.segFrom + (1 - this.segFrom) * segK(t / atk, p.curve, true);
      }
      case 'hold': {
        if (t >= hold) {
          this.phase = 'decay';
          this.segStart = now;
          this.segFrom = 1;
        }
        return 1;
      }
      case 'decay': {
        if (dec <= 0.0005 || t >= dec) {
          this.level = p.sustain;
          this.phase = 'sustain';
          return p.sustain;
        }
        return 1 + (p.sustain - 1) * segK(t / dec, p.curve, false);
      }
      case 'sustain': return p.sustain;
      case 'release': {
        if (t >= rel) {
          this.level = 0;
          this.phase = 'idle';
          return 0;
        }
        return this.segFrom * (1 - segK(t / rel, p.curve, false));
      }
    }
  }

  /** Schedule the envelope onto an AudioParam (peak scaled). */
  scheduleTrigger(param: AudioParam, now: number, peak: number): void {
    const p = this.params;
    const from = this.level * peak;
    param.cancelScheduledValues(now);
    param.setValueAtTime(clamp(from, 0, peak), now);
    const atk = Math.max(0.0005, p.attackMs / 1000);
    const hold = p.holdMs / 1000;
    const dec = Math.max(0.0005, p.decayMs / 1000);
    param.setValueCurveAtTime(segmentCurve(from, peak, p.curve, true), now, atk);
    let t = now + atk;
    if (hold > 0) {
      param.setValueAtTime(peak, t);
      t += hold;
    }
    param.setValueCurveAtTime(segmentCurve(peak, p.sustain * peak, p.curve, false), t, dec);
  }

  scheduleRelease(param: AudioParam, now: number, peak: number): void {
    const rel = Math.max(0.005, this.params.releaseMs / 1000);
    const v = clamp(this.valueAt(now) * peak, 0, peak);
    param.cancelScheduledValues(now);
    param.setValueAtTime(v, now);
    param.setValueCurveAtTime(segmentCurve(v, 0, this.params.curve, false), now, rel);
  }
}

// ---------------------------------------------------------------------------
// Oscillator section (wavetable + unison + warp)
// ---------------------------------------------------------------------------

interface UnisonVoice {
  osc: OscillatorNode;
  gain: GainNode;
  pan: StereoPannerNode;
  running: boolean;
}

export class OscSection {
  readonly id: 'A' | 'B';
  params: OscParams;
  /** Output (post level/pan/warp) — connect to voice mix. */
  readonly output: GainNode;
  /** Raw summed bus (pre level/pan) — tap point for FM/warp. */
  readonly bus: GainNode;
  private ctx: AudioContext;
  private voices: UnisonVoice[] = [];
  private syncGain: GainNode;
  private shaper: WaveShaperNode;
  private levelGain: GainNode;
  private outPan: StereoPannerNode;
  private syncSlave: OscillatorNode | null = null;
  private syncShaper: WaveShaperNode | null = null;
  private fmGain: GainNode; // external FM input -> each osc frequency
  private fmSrc: GainNode | null = null;
  private baseFreq = 110;
  private waveName: OscParams['wavetable'];
  private wavePos = -1;
  private wave: PeriodicWave;
  private lastWaveBuild = 0;

  constructor(ctx: AudioContext, id: 'A' | 'B', params: OscParams) {
    this.ctx = ctx;
    this.id = id;
    this.params = params;
    this.waveName = params.wavetable;
    this.wave = buildWave(ctx, params.wavetable, params.wtPos);
    this.bus = ctx.createGain();
    this.syncGain = ctx.createGain();
    this.shaper = ctx.createWaveShaper();
    this.levelGain = ctx.createGain();
    this.outPan = ctx.createStereoPanner();
    this.output = ctx.createGain();
    this.fmGain = ctx.createGain();
    this.fmGain.gain.value = 0;
    this.bus.connect(this.syncGain).connect(this.shaper).connect(this.levelGain).connect(this.outPan).connect(this.output);
    for (let i = 0; i < MAX_UNISON; i++) {
      const osc = ctx.createOscillator();
      osc.setPeriodicWave(this.wave);
      const gain = ctx.createGain();
      gain.gain.value = 0;
      const pan = ctx.createStereoPanner();
      osc.connect(gain).connect(pan).connect(this.bus);
      this.fmGain.connect(osc.frequency);
      this.voices.push({ osc, gain, pan, running: false });
    }
    this.applyUnison();
    this.applyLevelPan();
    this.applyWarpShape();
  }

  /** Per-voice frequency ratio (octave/semi/fine + detune spread). */
  private ratioFor(i: number, n: number): number {
    const p = this.params;
    let cents = p.octave * 1200 + p.semi * 100 + p.fineCents;
    if (n > 1) {
      const spread = (i - (n - 1) / 2) / ((n - 1) / 2); // -1..1
      cents += spread * p.detune * 40; // up to ±40 cents
    }
    return Math.pow(2, cents / 1200);
  }

  private applyUnison(): void {
    const n = clamp(Math.round(this.params.unison), 1, MAX_UNISON);
    const now = this.ctx.currentTime;
    for (let i = 0; i < MAX_UNISON; i++) {
      const v = this.voices[i];
      const active = i < n && this.params.enabled;
      if (active && !v.running) {
        try { v.osc.start(); } catch { /* already started */ }
        v.running = true;
      } else if (!active && v.running) {
        try { v.osc.stop(now + 0.05); } catch { /* not started */ }
        v.running = false;
        // recycle: swap in a fresh oscillator (stopped nodes can't restart);
        // gain -> pan -> bus wiring stays intact
        const osc = this.ctx.createOscillator();
        osc.setPeriodicWave(this.wave);
        osc.frequency.value = v.osc.frequency.value;
        v.osc.disconnect();
        osc.connect(v.gain);
        this.fmGain.connect(osc.frequency);
        v.osc = osc;
      }
      const target = active ? 1 / Math.sqrt(n) : 0;
      v.gain.gain.setTargetAtTime(target, now, 0.02);
      if (n > 1) {
        const spread = (i - (n - 1) / 2) / ((n - 1) / 2);
        v.pan.pan.setTargetAtTime(spread * this.params.blend, now, 0.02);
      } else {
        v.pan.pan.setTargetAtTime(0, now, 0.02);
      }
    }
    this.setFreq(this.baseFreq, 0.005);
  }

  private applyLevelPan(): void {
    const now = this.ctx.currentTime;
    this.levelGain.gain.setTargetAtTime(this.params.enabled ? this.params.level : 0, now, 0.015);
    this.outPan.pan.setTargetAtTime(clamp(this.params.pan, -1, 1), now, 0.015);
  }

  private applyWarpShape(): void {
    const p = this.params;
    if (p.warpMode === 'bend') {
      this.shaper.curve = p.warpAmt > 0.005 ? bendCurve(p.warpAmt) : null;
    } else if (p.warpMode === 'mirror') {
      this.shaper.curve = p.warpAmt > 0.005 ? mirrorCurve(p.warpAmt) : null;
    } else {
      this.shaper.curve = null;
    }
    // sync handled by setWarpRouting
    if (p.warpMode === 'sync' && p.warpAmt > 0.005) {
      this.ensureSyncSlave();
      this.syncSlave!.frequency.setTargetAtTime(this.baseFreq * (1 + p.warpAmt * 7), this.ctx.currentTime, 0.02);
      this.syncGain.gain.value = 0; // windowed by slave
    } else {
      if (this.syncShaper) {
        try { this.syncShaper.disconnect(); } catch { /* noop */ }
      }
      this.syncGain.gain.value = 1;
    }
  }

  private ensureSyncSlave(): void {
    if (!this.syncSlave) {
      this.syncSlave = this.ctx.createOscillator();
      this.syncSlave.type = 'sawtooth';
      this.syncShaper = this.ctx.createWaveShaper();
      this.syncShaper.curve = syncWindowCurve();
      this.syncSlave.connect(this.syncShaper).connect(this.syncGain.gain);
      this.syncSlave.start();
    } else if (this.syncShaper) {
      try { this.syncShaper.connect(this.syncGain.gain); } catch { /* noop */ }
    }
  }

  /** FM: `src` bus modulates this section's oscillator frequencies. */
  setFmSource(src: GainNode | null, amount: number): void {
    if (this.fmSrc && this.fmSrc !== src) {
      try { this.fmSrc.disconnect(this.fmGain); } catch { /* noop */ }
    }
    this.fmSrc = src;
    if (src && amount > 0.005) {
      try { src.connect(this.fmGain); } catch { /* noop */ }
      this.fmGain.gain.setTargetAtTime(this.baseFreq * amount * 0.6, this.ctx.currentTime, 0.02);
    } else {
      this.fmGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.02);
    }
  }

  setParams(p: OscParams): void {
    const unisonChanged = p.unison !== this.params.unison || p.enabled !== this.params.enabled
      || p.detune !== this.params.detune || p.blend !== this.params.blend;
    const warpChanged = p.warpMode !== this.params.warpMode
      || Math.abs(p.warpAmt - this.params.warpAmt) > 0.02;
    const tuneChanged = p.octave !== this.params.octave || p.semi !== this.params.semi
      || p.fineCents !== this.params.fineCents;
    this.params = p;
    if (p.wavetable !== this.waveName) {
      this.waveName = p.wavetable;
      this.wavePos = -1; // force rebuild (crossfades via morph continuity)
    }
    if (unisonChanged) this.applyUnison();
    else this.applyLevelPan();
    if (warpChanged) this.applyWarpShape();
    if (tuneChanged) this.setFreq(this.baseFreq, 0.01);
  }

  /** Morph position 0..1 (engine adds matrix offsets before calling). */
  setMorph(pos: number): void {
    const now = this.ctx.currentTime;
    if (this.wavePos >= 0 && Math.abs(pos - this.wavePos) < 0.004) return;
    if (now - this.lastWaveBuild < 0.03) return; // throttle rebuilds ~30Hz
    this.wavePos = pos;
    this.lastWaveBuild = now;
    this.wave = buildWave(this.ctx, this.waveName, pos);
    for (const v of this.voices) v.osc.setPeriodicWave(this.wave);
  }

  setFreq(freqHz: number, glideSec: number): void {
    this.baseFreq = freqHz;
    const n = clamp(Math.round(this.params.unison), 1, MAX_UNISON);
    const now = this.ctx.currentTime;
    for (let i = 0; i < MAX_UNISON; i++) {
      const v = this.voices[i];
      if (!v.running) continue;
      v.osc.frequency.setTargetAtTime(freqHz * this.ratioFor(i, n), now, Math.max(0.003, glideSec));
    }
    if (this.params.warpMode === 'sync' && this.syncSlave) {
      this.syncSlave.frequency.setTargetAtTime(freqHz * (1 + this.params.warpAmt * 7), now, 0.02);
    }
    if (this.params.warpMode === 'fmB') {
      this.fmGain.gain.setTargetAtTime(freqHz * this.params.warpAmt * 0.6, now, 0.02);
    }
  }

  /** Effective output level including matrix offsets. */
  setModLevel(level: number): void {
    this.levelGain.gain.setTargetAtTime(this.params.enabled ? clamp(level, 0, 1) : 0, this.ctx.currentTime, 0.02);
  }

  dispose(): void {
    for (const v of this.voices) {
      try { v.osc.stop(); } catch { /* noop */ }
      v.osc.disconnect();
    }
    try { this.syncSlave?.stop(); } catch { /* noop */ }
    this.output.disconnect();
  }
}

// ---------------------------------------------------------------------------
// Sub oscillator
// ---------------------------------------------------------------------------

export class SubSection {
  params: SubParams;
  readonly output: GainNode;
  private ctx: AudioContext;
  private osc: OscillatorNode;
  private square2Wave: PeriodicWave;
  private baseFreq = 110;

  constructor(ctx: AudioContext, params: SubParams) {
    this.ctx = ctx;
    this.params = params;
    const real = new Float32Array(8);
    const imag = new Float32Array(8);
    // hollow square: odd harmonics 1,3,5,7 with fast rolloff
    imag[1] = 1; imag[3] = 0.3; imag[5] = 0.12; imag[7] = 0.05;
    this.square2Wave = ctx.createPeriodicWave(real, imag);
    this.osc = ctx.createOscillator();
    this.output = ctx.createGain();
    this.osc.connect(this.output);
    this.applyShape();
    this.output.gain.value = params.enabled ? params.level : 0;
    this.osc.start();
  }

  private applyShape(): void {
    const s = this.params.shape;
    if (s === 'square2') this.osc.setPeriodicWave(this.square2Wave);
    else this.osc.type = s === 'square1' ? 'square' : s;
    this.setFreq(this.baseFreq);
  }

  setParams(p: SubParams): void {
    const shapeChanged = p.shape !== this.params.shape || p.octave !== this.params.octave;
    this.params = p;
    if (shapeChanged) this.applyShape();
    this.output.gain.setTargetAtTime(p.enabled ? p.level : 0, this.ctx.currentTime, 0.02);
  }

  setFreq(freqHz: number): void {
    this.baseFreq = freqHz;
    const ratio = Math.pow(2, this.params.octave); // -2..0
    this.osc.frequency.setTargetAtTime(freqHz * ratio, this.ctx.currentTime, 0.01);
  }

  setModLevel(level: number): void {
    this.output.gain.setTargetAtTime(this.params.enabled ? clamp(level, 0, 1) : 0, this.ctx.currentTime, 0.02);
  }

  dispose(): void {
    try { this.osc.stop(); } catch { /* noop */ }
    this.osc.disconnect();
    this.output.disconnect();
  }
}

// ---------------------------------------------------------------------------
// Noise section
// ---------------------------------------------------------------------------

export class NoiseSection {
  params: NoiseParams;
  readonly output: GainNode;
  private ctx: AudioContext;
  private src: AudioBufferSourceNode;
  private colorLp: BiquadFilterNode;
  private bp: BiquadFilterNode;
  private directGain: GainNode;
  private bpGain: GainNode;

  constructor(ctx: AudioContext, params: NoiseParams, noiseBuf: AudioBuffer) {
    this.ctx = ctx;
    this.params = params;
    this.src = ctx.createBufferSource();
    this.src.buffer = noiseBuf;
    this.src.loop = true;
    this.colorLp = ctx.createBiquadFilter();
    this.colorLp.type = 'lowpass';
    this.bp = ctx.createBiquadFilter();
    this.bp.type = 'bandpass';
    this.bp.Q.value = 1.8;
    this.directGain = ctx.createGain();
    this.bpGain = ctx.createGain();
    this.output = ctx.createGain();
    this.src.connect(this.colorLp);
    this.colorLp.connect(this.directGain).connect(this.output);
    this.colorLp.connect(this.bp).connect(this.bpGain).connect(this.output);
    this.applyColor();
    this.output.gain.value = params.enabled ? params.level : 0;
    this.src.start();
  }

  private applyColor(): void {
    const c = clamp(this.params.color, 0, 1);
    // white (20k) -> pink-ish (~2.4k) -> brown (~300Hz)
    const freq = 20000 * Math.pow(300 / 20000, c);
    this.colorLp.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.03);
    this.output.gain.setTargetAtTime(
      (this.params.enabled ? this.params.level : 0) * (1 + c * c * 2.5), this.ctx.currentTime, 0.03);
    const pt = this.params.pitchTrack;
    this.directGain.gain.setTargetAtTime(pt ? 0.25 : 1, this.ctx.currentTime, 0.03);
    this.bpGain.gain.setTargetAtTime(pt ? 1.2 : 0, this.ctx.currentTime, 0.03);
  }

  setParams(p: NoiseParams): void {
    this.params = p;
    this.applyColor();
  }

  /** Breathy formant follow: bandpass tracks the sung pitch. */
  trackPitch(freqHz: number): void {
    if (!this.params.pitchTrack || freqHz <= 0) return;
    this.bp.frequency.setTargetAtTime(clamp(freqHz * 2, 80, 8000), this.ctx.currentTime, 0.03);
  }

  setModLevel(level: number): void {
    const c = clamp(this.params.color, 0, 1);
    this.output.gain.setTargetAtTime(
      (this.params.enabled ? clamp(level, 0, 1) : 0) * (1 + c * c * 2.5), this.ctx.currentTime, 0.02);
  }

  dispose(): void {
    try { this.src.stop(); } catch { /* noop */ }
    this.src.disconnect();
    this.output.disconnect();
  }
}

// ---------------------------------------------------------------------------
// Filter section (Moog-style 4-pole w/ feedback + biquad modes)
// ---------------------------------------------------------------------------

export class FilterSection {
  params: FilterParams;
  readonly input: GainNode;
  readonly output: GainNode;
  private ctx: AudioContext;
  private driveShaper: WaveShaperNode;
  private postGain: GainNode;
  private stages: BiquadFilterNode[] = [];
  private fbGain: GainNode | null = null;
  private fbClip: WaveShaperNode | null = null;
  private fbDelay: DelayNode | null = null;
  private mode: FilterMode | '' = '';
  private bypassGain: GainNode;
  private chainIn: GainNode; // summer after drive (feedback returns here)

  constructor(ctx: AudioContext, params: FilterParams) {
    this.ctx = ctx;
    this.params = params;
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.driveShaper = ctx.createWaveShaper();
    this.chainIn = ctx.createGain();
    this.postGain = ctx.createGain();
    this.bypassGain = ctx.createGain();
    this.input.connect(this.driveShaper).connect(this.chainIn);
    this.input.connect(this.bypassGain).connect(this.output);
    this.rebuild(params.mode);
    this.applyDrive();
    this.applyEnabled();
  }

  private rebuild(mode: FilterMode): void {
    if (mode === this.mode) return;
    // tear down old chain (driveShaper -> chainIn connection stays intact)
    for (const s of this.stages) {
      try { s.disconnect(); } catch { /* noop */ }
    }
    try { this.chainIn.disconnect(); } catch { /* noop */ }
    try { this.postGain.disconnect(); } catch { /* noop */ }
    if (this.fbGain) { try { this.fbGain.disconnect(); } catch { /* noop */ } }
    if (this.fbClip) { try { this.fbClip.disconnect(); } catch { /* noop */ } }
    if (this.fbDelay) { try { this.fbDelay.disconnect(); } catch { /* noop */ } }
    this.stages = [];
    this.fbGain = null;
    this.fbClip = null;
    this.fbDelay = null;
    this.mode = mode;

    const mkStage = (type: BiquadFilterType): BiquadFilterNode => {
      const b = this.ctx.createBiquadFilter();
      b.type = type;
      return b;
    };

    if (mode === 'lp24') {
      for (let i = 0; i < 4; i++) this.stages.push(mkStage('lowpass'));
      this.chainIn.connect(this.stages[0]);
      for (let i = 0; i < 3; i++) this.stages[i].connect(this.stages[i + 1]);
      this.stages[3].connect(this.postGain).connect(this.output);
      // feedback path: output -> fbGain -> soft clip (stability) -> 1-sample delay -> chainIn
      this.fbGain = this.ctx.createGain();
      this.fbClip = this.ctx.createWaveShaper();
      const clip = new Float32Array(256);
      for (let i = 0; i < 256; i++) {
        const x = (i / 255) * 2 - 1;
        clip[i] = Math.tanh(2.2 * x);
      }
      this.fbClip.curve = clip;
      this.fbDelay = this.ctx.createDelay(0.01);
      this.fbDelay.delayTime.value = 1 / this.ctx.sampleRate;
      this.stages[3].connect(this.fbGain).connect(this.fbClip).connect(this.fbDelay).connect(this.chainIn);
    } else {
      const type: BiquadFilterType = mode === 'lp12' ? 'lowpass' : mode === 'bp' ? 'bandpass' : 'highpass';
      this.stages = [mkStage(type)];
      this.chainIn.connect(this.stages[0]);
      this.stages[0].connect(this.postGain).connect(this.output);
    }
    this.applyCutoffRes(this.params.cutoffHz, this.params.resonance);
  }

  private applyEnabled(): void {
    const on = this.params.enabled;
    const now = this.ctx.currentTime;
    this.bypassGain.gain.setTargetAtTime(on ? 0 : 1, now, 0.01);
    this.postGain.gain.setTargetAtTime(on ? this.compGain() : 0, now, 0.01);
  }

  private compGain(): number {
    return 1 / (1 + this.params.drive * 0.9);
  }

  private applyDrive(): void {
    this.driveShaper.curve = this.params.drive > 0.005 ? driveCurve(this.params.drive) : null;
    if (this.params.enabled) {
      this.postGain.gain.setTargetAtTime(this.compGain(), this.ctx.currentTime, 0.02);
    }
  }

  setParams(p: FilterParams): void {
    const modeChanged = p.mode !== this.params.mode;
    const enabledChanged = p.enabled !== this.params.enabled;
    const driveChanged = Math.abs(p.drive - this.params.drive) > 0.02;
    this.params = p;
    if (modeChanged) this.rebuild(p.mode);
    if (enabledChanged) this.applyEnabled();
    if (driveChanged) this.applyDrive();
  }

  /** Effective cutoff/resonance from the mod pump (base + env + matrix). */
  applyCutoffRes(cutoffHz: number, resonance: number): void {
    const now = this.ctx.currentTime;
    const f = clamp(cutoffHz, 20, 20000);
    const r = clamp(resonance, 0, 1);
    if (this.mode === 'lp24') {
      for (const s of this.stages) {
        s.frequency.setTargetAtTime(f, now, 0.008);
        s.Q.setTargetAtTime(0.5, now, 0.02);
      }
      // resonance via feedback; self-oscillation beyond 0.85 (loop clip keeps it bounded)
      const fb = r <= 0.85 ? (r / 0.85) * 3.4 : 3.4 + ((r - 0.85) / 0.15) * 1.3;
      this.fbGain?.gain.setTargetAtTime(Math.min(4.7, fb), now, 0.02);
    } else {
      const s = this.stages[0];
      if (!s) return;
      s.frequency.setTargetAtTime(f, now, 0.008);
      s.Q.setTargetAtTime(0.5 + Math.pow(r, 2) * 24, now, 0.02);
    }
  }

  /** Frequency params of every stage — for audio-rate env/mod injection. */
  getFreqParams(): AudioParam[] {
    return this.stages.map((s) => s.frequency);
  }

  dispose(): void {
    for (const s of this.stages) s.disconnect();
    this.input.disconnect();
    this.output.disconnect();
  }
}

// ---------------------------------------------------------------------------
// Voice assembly
// ---------------------------------------------------------------------------

export class Voice {
  readonly oscA: OscSection;
  readonly oscB: OscSection;
  readonly sub: SubSection;
  readonly noise: NoiseSection;
  readonly filter: FilterSection;
  readonly env1: EnvGen;
  readonly env2: EnvGen;
  /** Post-filter voice output (feeds FX rack). */
  readonly output: GainNode;
  private ctx: AudioContext;
  private amp: GainNode; // ENV1 amp
  private env1ModGain: GainNode; // audio-rate env1 signal for filter env
  private envConst: ConstantSourceNode;
  private envAmtGain: GainNode;
  private velGain = 1;

  constructor(
    ctx: AudioContext,
    state: {
      oscA: OscParams; oscB: OscParams; sub: SubParams; noise: NoiseParams;
      filter: FilterParams; env1: EnvParams; env2: EnvParams;
    },
    noiseBuf: AudioBuffer,
  ) {
    this.ctx = ctx;
    this.oscA = new OscSection(ctx, 'A', state.oscA);
    this.oscB = new OscSection(ctx, 'B', state.oscB);
    this.sub = new SubSection(ctx, state.sub);
    this.noise = new NoiseSection(ctx, state.noise, noiseBuf);
    this.filter = new FilterSection(ctx, state.filter);
    this.env1 = new EnvGen(state.env1);
    this.env2 = new EnvGen(state.env2);
    this.amp = ctx.createGain();
    this.amp.gain.value = 0;
    this.output = ctx.createGain();

    const mix = ctx.createGain();
    this.oscA.output.connect(mix);
    this.oscB.output.connect(mix);
    this.sub.output.connect(mix);
    this.noise.output.connect(mix);
    mix.connect(this.amp).connect(this.filter.input);
    this.filter.output.connect(this.output);

    // audio-rate ENV1 -> filter cutoff (bipolar envAmt)
    this.envConst = ctx.createConstantSource();
    this.envConst.offset.value = 1;
    this.env1ModGain = ctx.createGain();
    this.env1ModGain.gain.value = 0;
    this.envAmtGain = ctx.createGain();
    this.envAmtGain.gain.value = 0;
    this.envConst.connect(this.env1ModGain).connect(this.envAmtGain);
    this.wireEnvToFilter();
    this.envConst.start();
    this.applyWarpRouting();
  }

  private wireEnvToFilter(): void {
    // envAmtGain outputs to each filter stage frequency param
    try { this.envAmtGain.disconnect(); } catch { /* noop */ }
    for (const p of this.filter.getFreqParams()) this.envAmtGain.connect(p);
  }

  /** Warp cross-wiring: fmB routes the *other* osc bus into this section. */
  applyWarpRouting(): void {
    const a = this.oscA.params;
    const b = this.oscB.params;
    this.oscA.setFmSource(a.warpMode === 'fmB' ? this.oscB.bus : null, a.warpAmt);
    this.oscB.setFmSource(b.warpMode === 'fmB' ? this.oscA.bus : null, b.warpAmt);
  }

  setWarpDirty(): void {
    this.applyWarpRouting();
    this.wireEnvToFilter();
  }

  /** Gate on (noteOn / voice-gate open). */
  trigger(velocity: number): void {
    const now = this.ctx.currentTime;
    this.velGain = 0.25 + 0.75 * clamp(velocity, 0, 1);
    this.env1.trigger(now);
    this.env2.trigger(now);
    this.env1.scheduleTrigger(this.amp.gain, now, this.velGain);
    this.env1.scheduleTrigger(this.env1ModGain.gain, now, 1);
  }

  release(): void {
    const now = this.ctx.currentTime;
    this.env1.release(now);
    this.env2.release(now);
    this.env1.scheduleRelease(this.amp.gain, now, this.velGain);
    this.env1.scheduleRelease(this.env1ModGain.gain, now, 1);
  }

  /** Retrigger filter wiring after filter mode rebuild. */
  refreshFilter(): void {
    this.wireEnvToFilter();
  }

  /** envAmt gain scaling: Hz of sweep at the current cutoff. */
  setEnvAmt(amount: number, cutoffHz: number): void {
    this.envAmtGain.gain.setTargetAtTime(clamp(amount, -1, 1) * cutoffHz * 3, this.ctx.currentTime, 0.02);
  }

  /** Route pitch to all sections. */
  setFreq(freqHz: number, glideSec: number): void {
    this.oscA.setFreq(freqHz, glideSec);
    this.oscB.setFreq(freqHz, glideSec);
    this.sub.setFreq(freqHz);
    this.noise.trackPitch(freqHz);
  }

  dispose(): void {
    this.oscA.dispose();
    this.oscB.dispose();
    this.sub.dispose();
    this.noise.dispose();
    this.filter.dispose();
    try { this.envConst.stop(); } catch { /* noop */ }
    this.amp.disconnect();
    this.output.disconnect();
  }
}
