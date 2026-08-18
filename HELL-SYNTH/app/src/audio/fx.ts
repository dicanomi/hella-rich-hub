/**
 * FX rack — six hand-rolled modules + a reorderable chain.
 * Every module exposes input/output so the rack can rewire on reorder/bypass.
 */

import type { FxId } from './contract';
import { clamp, driveCurve, makeReverbIR } from './dsp';

export interface FxModule {
  readonly id: FxId;
  input: AudioNode;
  output: AudioNode;
  update(params: Record<string, number | boolean>): void;
  dispose(): void;
}

const num = (v: number | boolean | undefined, d: number): number =>
  typeof v === 'number' ? v : d;
const bool = (v: number | boolean | undefined, d: boolean): boolean =>
  typeof v === 'boolean' ? v : d;

// ---------------------------------------------------------------------------

function buildSaturator(ctx: BaseAudioContext, p: Record<string, number | boolean>): FxModule {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const dry = ctx.createGain();
  const wet = ctx.createGain();
  const shaper = ctx.createWaveShaper();
  shaper.oversample = '2x';
  const post = ctx.createGain();
  input.connect(dry).connect(output);
  input.connect(shaper).connect(post).connect(wet).connect(output);
  const update = (params: Record<string, number | boolean>) => {
    const drive = clamp(num(params.drive, 0.3), 0, 1);
    const mix = clamp(num(params.mix, 0.5), 0, 1);
    shaper.curve = driveCurve(drive);
    post.gain.value = 1 / (1 + drive * 0.8);
    dry.gain.value = 1 - mix;
    wet.gain.value = mix;
  };
  update(p);
  return { id: 'saturator', input, output, update, dispose() { input.disconnect(); output.disconnect(); } };
}

function buildChorus(ctx: BaseAudioContext, p: Record<string, number | boolean>): FxModule {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const dry = ctx.createGain();
  const wet = ctx.createGain();
  const splitter = ctx.createChannelSplitter(2);
  const merger = ctx.createChannelMerger(2);
  const delayL = ctx.createDelay(0.1);
  const delayR = ctx.createDelay(0.1);
  const baseL = ctx.createConstantSource();
  const baseR = ctx.createConstantSource();
  baseL.offset.value = 0.018;
  baseR.offset.value = 0.023;
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  const depthGain = ctx.createGain();
  lfo.connect(depthGain);
  depthGain.connect(delayL.delayTime);
  depthGain.connect(delayR.delayTime);
  baseL.connect(delayL.delayTime);
  baseR.connect(delayR.delayTime);
  input.connect(dry).connect(output);
  input.connect(splitter);
  splitter.connect(delayL, 0);
  splitter.connect(delayR, 1);
  delayL.connect(merger, 0, 0);
  delayR.connect(merger, 0, 1);
  merger.connect(wet).connect(output);
  lfo.start();
  baseL.start();
  baseR.start();
  const update = (params: Record<string, number | boolean>) => {
    const rate = clamp(num(params.rate, 0.8), 0.05, 8);
    const depth = clamp(num(params.depth, 0.4), 0, 1);
    lfo.frequency.value = rate;
    depthGain.gain.value = depth * 0.006; // up to 6ms swing
    dry.gain.value = 0.8;
    wet.gain.value = 0.35 + depth * 0.35;
  };
  update(p);
  return {
    id: 'chorus', input, output, update,
    dispose() { lfo.stop(); baseL.stop(); baseR.stop(); input.disconnect(); output.disconnect(); },
  };
}

function buildDelay(ctx: BaseAudioContext, p: Record<string, number | boolean>): FxModule {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const dry = ctx.createGain();
  const wet = ctx.createGain();
  const delay = ctx.createDelay(2.0);
  const fb = ctx.createGain();
  const fbFilter = ctx.createBiquadFilter();
  fbFilter.type = 'lowpass';
  fbFilter.frequency.value = 4500;
  input.connect(dry).connect(output);
  input.connect(delay);
  delay.connect(fbFilter).connect(fb).connect(delay);
  delay.connect(wet).connect(output);
  const update = (params: Record<string, number | boolean>) => {
    let timeMs = clamp(num(params.timeMs, 320), 20, 1900);
    if (bool(params.sync, false)) {
      // quantize to the 1/16 grid of the master transport BPM
      const bpm = clamp(num(params.bpm, 120), 40, 240);
      const grid = 60000 / bpm / 4;
      timeMs = Math.max(grid, Math.round(timeMs / grid) * grid);
    }
    delay.delayTime.value = timeMs / 1000;
    fb.gain.value = clamp(num(params.feedback, 0.35), 0, 0.92);
    dry.gain.value = 0.9;
    wet.gain.value = 0.4;
  };
  update(p);
  return { id: 'delay', input, output, update, dispose() { input.disconnect(); output.disconnect(); } };
}

function buildReverb(ctx: BaseAudioContext, p: Record<string, number | boolean>): FxModule {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const dry = ctx.createGain();
  const wet = ctx.createGain();
  const conv = ctx.createConvolver();
  const damp = ctx.createBiquadFilter();
  damp.type = 'lowpass';
  damp.frequency.value = 8000;
  input.connect(dry).connect(output);
  input.connect(conv).connect(damp).connect(wet).connect(output);
  let lastSize = -1;
  const update = (params: Record<string, number | boolean>) => {
    const size = clamp(num(params.size, 0.5), 0, 1);
    const mix = clamp(num(params.mix, 0.25), 0, 1);
    if (Math.abs(size - lastSize) > 0.04 || lastSize < 0) {
      conv.buffer = makeReverbIR(ctx, size);
      lastSize = size;
    }
    damp.frequency.value = 3500 + size * 6000;
    dry.gain.value = 1 - mix * 0.7;
    wet.gain.value = mix;
  };
  update(p);
  return { id: 'reverb', input, output, update, dispose() { input.disconnect(); output.disconnect(); } };
}

function buildWidth(ctx: BaseAudioContext, p: Record<string, number | boolean>): FxModule {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const splitter = ctx.createChannelSplitter(2);
  const merger = ctx.createChannelMerger(2);
  const midSum = ctx.createGain();
  const sideSum = ctx.createGain();
  const lToMid = ctx.createGain(); lToMid.gain.value = 0.5;
  const rToMid = ctx.createGain(); rToMid.gain.value = 0.5;
  const lToSide = ctx.createGain(); lToSide.gain.value = 0.5;
  const rToSide = ctx.createGain(); rToSide.gain.value = -0.5;
  const sideHp = ctx.createBiquadFilter();
  sideHp.type = 'highpass';
  sideHp.frequency.value = 130;
  const sideGain = ctx.createGain();
  const sideInv = ctx.createGain(); sideInv.gain.value = -1;
  input.connect(splitter);
  splitter.connect(lToMid, 0).connect(midSum);
  splitter.connect(rToMid, 1).connect(midSum);
  splitter.connect(lToSide, 0).connect(sideSum);
  splitter.connect(rToSide, 1).connect(sideSum);
  // side path: monoBass toggles the highpass in/out via two gains
  const hpIn = ctx.createGain();
  const directIn = ctx.createGain();
  sideSum.connect(hpIn).connect(sideHp).connect(sideGain);
  sideSum.connect(directIn).connect(sideGain);
  midSum.connect(merger, 0, 0);
  midSum.connect(merger, 0, 1);
  sideGain.connect(merger, 0, 0);
  sideGain.connect(sideInv).connect(merger, 0, 1);
  merger.connect(output);
  const update = (params: Record<string, number | boolean>) => {
    const width = clamp(num(params.width, 0.5), 0, 1);
    const monoBass = bool(params.monoBass, true);
    sideGain.gain.value = width * 2; // 0.5 = unity side
    hpIn.gain.value = monoBass ? 1 : 0;
    directIn.gain.value = monoBass ? 0 : 1;
  };
  update(p);
  return { id: 'width', input, output, update, dispose() { input.disconnect(); output.disconnect(); } };
}

function buildCompressor(ctx: BaseAudioContext, p: Record<string, number | boolean>): FxModule {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const dry = ctx.createGain();
  const wet = ctx.createGain();
  const comp = ctx.createDynamicsCompressor();
  input.connect(dry).connect(output);
  input.connect(comp).connect(wet).connect(output);
  const update = (params: Record<string, number | boolean>) => {
    const amount = clamp(num(params.amount, 0.4), 0, 1);
    const mix = clamp(num(params.mix, 1), 0, 1);
    comp.threshold.value = -8 - amount * 30;
    comp.ratio.value = 1 + amount * 11;
    comp.knee.value = 18;
    comp.attack.value = 0.003;
    comp.release.value = 0.25;
    dry.gain.value = 1 - mix;
    wet.gain.value = mix;
  };
  update(p);
  return { id: 'compressor', input, output, update, dispose() { input.disconnect(); output.disconnect(); } };
}

const BUILDERS: Record<FxId, (ctx: BaseAudioContext, p: Record<string, number | boolean>) => FxModule> = {
  saturator: buildSaturator,
  chorus: buildChorus,
  delay: buildDelay,
  reverb: buildReverb,
  width: buildWidth,
  compressor: buildCompressor,
};

// ---------------------------------------------------------------------------

/** Reorderable rack: source -> [enabled modules in order] -> sink. */
export class FxRack {
  private ctx: BaseAudioContext;
  private modules = new Map<FxId, FxModule>();
  private src: AudioNode | null = null;
  private dst: AudioNode | null = null;
  private order: FxId[] = [];
  private enabled = new Map<FxId, boolean>();

  constructor(ctx: BaseAudioContext) {
    this.ctx = ctx;
  }

  private ensure(id: FxId, params: Record<string, number | boolean>): FxModule {
    let m = this.modules.get(id);
    if (!m) {
      m = BUILDERS[id](this.ctx, params);
      this.modules.set(id, m);
    }
    return m;
  }

  /** Rewire: source -> enabled modules (in `order`) -> sink. */
  configure(
    src: AudioNode,
    dst: AudioNode,
    order: FxId[],
    fx: Record<FxId, { enabled: boolean; params: Record<string, number | boolean> }>,
  ): void {
    this.src = src;
    this.dst = dst;
    this.order = [...order];
    for (const id of Object.keys(fx) as FxId[]) this.enabled.set(id, fx[id].enabled);
    this.rewire(fx);
  }

  private rewire(
    fx?: Record<FxId, { enabled: boolean; params: Record<string, number | boolean> }>,
  ): void {
    if (!this.src || !this.dst) return;
    this.src.disconnect();
    for (const m of this.modules.values()) {
      try { m.output.disconnect(); } catch { /* not connected */ }
    }
    let prev: AudioNode = this.src;
    for (const id of this.order) {
      if (!this.enabled.get(id)) continue;
      const state = fx?.[id];
      const m = this.ensure(id, state?.params ?? {});
      if (state) m.update(state.params);
      prev.connect(m.input);
      prev = m.output;
    }
    prev.connect(this.dst);
  }

  updateParams(id: FxId, params: Record<string, number | boolean>): void {
    const m = this.modules.get(id);
    if (m) m.update(params);
  }

  dispose(): void {
    for (const m of this.modules.values()) m.dispose();
    this.modules.clear();
    this.src = null;
    this.dst = null;
  }
}
