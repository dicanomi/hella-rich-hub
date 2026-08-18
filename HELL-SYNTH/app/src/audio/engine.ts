/**
 * Engine — AudioContext lifecycle, mic + pitch tracking, mod matrix pump,
 * master section, recording. Ties dsp/voice/fx/wav together.
 * Pure TypeScript; no React.
 */

import type {
  DemoSourceId, EngineInfo, EngineState, EngineStatus, FxId, LfoParams, ModDestId,
  ModRoute, ModSourceId, PitchState, RecordedTake, SeqStep, SequencerState, SynthEngine,
  WavExportOptions, WavExportResult,
} from './contract';
import {
  BPM_DEFAULT, BPM_MAX, BPM_MIN, DEFAULT_SEQUENCER, DEMO_SOURCES,
} from './contract';
import { defaultEngineState } from './defaults';
import { FACTORY_PRESETS } from './presets';
import {
  clamp, ftom, lfoShapeValue, makeNoiseBuffer, makeReverbIR, mtof, noteName,
  snapToScale, syncDivisionToHz, uid,
} from './dsp';
import { Voice } from './voice';
import { FxRack } from './fx';
import { WORKLET_NAME, workletSource } from './worklet';
import { concatChunks, exportTakeWav, resampleTo48k, TARGET_SR } from './wav';

const PUMP_MS = 16;

/** getUserMedia settle timeout. When the browser holds site permission but
 *  the OS denies the mic (e.g. macOS Privacy & Security blocking Chrome),
 *  Chrome's getUserMedia promise NEVER settles — no resolve, no reject.
 *  After this long we fail the request ourselves ('os-timeout'). */
const GUM_SETTLE_TIMEOUT_MS = 12_000;

/** Race a getUserMedia call against a settle timeout. Resolves/rejects with
 *  the underlying call when it settles in time; otherwise rejects with a
 *  DOMException named 'os-timeout'. The `settled` flag is the epoch token:
 *  a promise that resolves AFTER the timeout is ignored, and any MediaStream
 *  it yields has its tracks stopped immediately so the mic can't leak. The
 *  timer is cleared on every normal settle path. */
function getUserMediaWithTimeout(constraints: MediaStreamConstraints): Promise<MediaStream> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new DOMException(
        'getUserMedia never settled — OS-level mic block suspected',
        'os-timeout',
      ));
    }, GUM_SETTLE_TIMEOUT_MS);
    navigator.mediaDevices.getUserMedia(constraints).then(
      (stream) => {
        if (settled) {
          // timed out already — kill the late stream so the mic doesn't leak
          for (const t of stream.getTracks()) t.stop();
          return;
        }
        settled = true;
        clearTimeout(timer);
        resolve(stream);
      },
      (err: unknown) => {
        if (settled) return; // late rejection after the timeout — ignore
        settled = true;
        clearTimeout(timer);
        reject(err instanceof Error ? err : new Error(String(err)));
      },
    );
  });
}

interface RawPitchMsg {
  freq: number;
  confidence: number;
  inputDb: number;
}

const silentPitch = (): PitchState => ({
  locked: false, freq: 0, midi: 0, noteName: '—', octave: 0,
  cents: 0, confidence: 0, inputDb: -Infinity, gateOpen: false,
});

interface LfoRuntime {
  phase: number;
  value: number;
  smoothed: number;
  shValue: number;
  trigAt: number; // ctx time of last note trigger (for delayMs fade-in)
}

export function createEngine(): SynthEngine {
  let state: EngineState = defaultEngineState();
  let ctx: AudioContext | null = null;
  let status: EngineStatus = 'idle';
  /** DOMException name of the last mic request failure; null when none. */
  let micError: string | null = null;

  // graph nodes
  let micStream: MediaStream | null = null;
  let micSource: MediaStreamAudioSourceNode | null = null;
  let inputGain: GainNode | null = null;
  let inputAnalyser: AnalyserNode | null = null;
  let outputAnalyser: AnalyserNode | null = null;
  let monitorGain: GainNode | null = null;
  let masterGain: GainNode | null = null;
  let playGate: GainNode | null = null;
  let limiter: DynamicsCompressorNode | null = null;
  let rackIn: GainNode | null = null;
  let voicePan: StereoPannerNode | null = null;
  let rack: FxRack | null = null;
  let voice: Voice | null = null;
  let workletNode: AudioWorkletNode | null = null;
  let workletUrl: string | null = null;
  let noiseBuf: AudioBuffer | null = null;

  // drums: sketch-beat bus with its own echo send (delay -> reverb)
  let drumBus: GainNode | null = null;
  let drumSend: GainNode | null = null;
  let drumDelay: DelayNode | null = null;
  let drumFb: GainNode | null = null;
  let drumVerb: ConvolverNode | null = null;
  let drumWet: GainNode | null = null;

  // pitch tracking state
  let rawPitch: RawPitchMsg = { freq: 0, confidence: 0, inputDb: -Infinity };
  let pitchState: PitchState = silentPitch();
  let slowMidi = 0;          // long-window pitch center (vibrato extraction)
  let smoothedMidi = 0;
  let hasMidi = false;
  let voiceGateOn = false;

  // performance state
  let keyboardMidi: number | null = null;
  let lastVelocity = 0.8;
  let bendSemis = 0;
  let modWheelVal = 0;

  // mod runtime
  const lfos: LfoRuntime[] = [
    { phase: 0, value: 0, smoothed: 0, shValue: 0, trigAt: 0 },
    { phase: 0, value: 0, smoothed: 0, shValue: 0, trigAt: 0 },
    { phase: 0, value: 0, smoothed: 0, shValue: 0, trigAt: 0 },
  ];
  let followerVal = 0;
  const humanRt = { clock: 0, target: 0, value: 0 }; // smooth random wander
  let modValues: Partial<Record<ModSourceId, number>> = {};

  // recording
  let recording = false;
  let recStartWall = 0;
  let recChunks: { dryL: Float32Array[]; dryR: Float32Array[]; mstL: Float32Array[]; mstR: Float32Array[] } | null = null;
  let recFlushWaiter: (() => void) | null = null;
  let takeCounter = 0;

  // output meter
  let outputPeakDb = -Infinity;
  let meterBuf: Float32Array<ArrayBuffer> | null = null;

  // fallback pitch (analyser) when worklet unavailable
  let fallbackAnalyser: AnalyserNode | null = null;
  let fallbackBuf: Float32Array<ArrayBuffer> | null = null;
  let fallbackCounter = 0;

  let pumpTimer: ReturnType<typeof setInterval> | null = null;
  let disposed = false;
  let onStateChange: (() => void) | null = null;

  // -------------------------------------------------------------------------
  // Graph construction
  // -------------------------------------------------------------------------

  function buildGraph(): void {
    if (!ctx) return;
    noiseBuf = makeNoiseBuffer(ctx);

    masterGain = ctx.createGain();
    outputAnalyser = ctx.createAnalyser();
    outputAnalyser.fftSize = 2048;
    limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -3;
    limiter.knee.value = 0;
    limiter.ratio.value = 16;
    limiter.attack.value = 0.001;
    limiter.release.value = 0.12;
    playGate = ctx.createGain();
    playGate.gain.value = 1; // sound is live until the transport fades it out
    masterGain.connect(outputAnalyser);
    outputAnalyser.connect(limiter);
    limiter.connect(playGate).connect(ctx.destination);
    meterBuf = new Float32Array(outputAnalyser.fftSize);

    rackIn = ctx.createGain();
    rack = new FxRack(ctx);
    rack.configure(rackIn, masterGain, state.fxOrder, withSyncBpm(state.fx));

    voicePan = ctx.createStereoPanner();
    voicePan.connect(rackIn);

    voice = new Voice(ctx, state, noiseBuf);
    voice.output.connect(voicePan);
    voice.setWarpDirty();

    inputGain = ctx.createGain();
    inputGain.gain.value = dbToGain(state.master.inputGainDb);
    inputAnalyser = ctx.createAnalyser();
    inputAnalyser.fftSize = 2048;
    inputGain.connect(inputAnalyser);
    monitorGain = ctx.createGain();
    monitorGain.gain.value = state.master.monitorOn ? 0.9 : 0;
    inputGain.connect(monitorGain).connect(masterGain);

    // drums: dry bus -> master; send -> dotted-8th delay (fb) -> reverb -> master
    drumBus = ctx.createGain();
    drumBus.gain.value = state.drums.level * 0.9;
    drumBus.connect(masterGain);
    drumSend = ctx.createGain();
    drumSend.gain.value = state.drums.send * 0.7;
    drumBus.connect(drumSend);
    drumDelay = ctx.createDelay(1.0);
    drumDelay.delayTime.value = (60 / bpm) * 0.75;
    drumFb = ctx.createGain();
    drumFb.gain.value = 0.35;
    drumDelay.connect(drumFb).connect(drumDelay);
    drumSend.connect(drumDelay);
    drumVerb = ctx.createConvolver();
    drumVerb.buffer = makeReverbIR(ctx, 0.55);
    drumDelay.connect(drumVerb);
    drumWet = ctx.createGain();
    drumWet.gain.value = 0.8;
    drumVerb.connect(drumWet).connect(masterGain);

    masterGain.gain.value = state.master.masterLevel;
  }

  async function attachWorklet(): Promise<boolean> {
    if (!ctx || !inputGain || !masterGain) return false;
    try {
      const fast = state.pitchEngine.trackingMode === 'fast';
      workletUrl = URL.createObjectURL(new Blob([workletSource()], { type: 'application/javascript' }));
      await ctx.audioWorklet.addModule(workletUrl);
      workletNode = new AudioWorkletNode(ctx, WORKLET_NAME, {
        numberOfInputs: 2,
        numberOfOutputs: 0,
        processorOptions: fast
          ? { window: 1024, interval: 512 }
          : { window: 2048, interval: 1536 },
      });
      workletNode.onprocessorerror = () => { /* fall back silently */ };
      workletNode.port.onmessage = (e: MessageEvent) => {
        const m = e.data;
        if (!m || typeof m !== 'object') return;
        if (m.type === 'pitch') {
          rawPitch = {
            freq: m.freq as number,
            confidence: m.confidence as number,
            inputDb: rmsToDb(m.rms as number),
          };
        } else if (m.type === 'recChunk' && recChunks) {
          recChunks.dryL.push(m.dryL as Float32Array);
          recChunks.dryR.push(m.dryR as Float32Array);
          recChunks.mstL.push(m.mstL as Float32Array);
          recChunks.mstR.push(m.mstR as Float32Array);
          if (m.final && recFlushWaiter) {
            const w = recFlushWaiter;
            recFlushWaiter = null;
            w();
          }
        }
      };
      inputGain.connect(workletNode, 0, 0);
      playGate!.connect(workletNode, 0, 1); // post-fade: the take hears what you hear
      return true;
    } catch {
      workletNode = null;
      return false;
    }
  }

  function attachFallbackPitch(): void {
    if (!ctx || !inputGain || fallbackAnalyser) return;
    fallbackAnalyser = ctx.createAnalyser();
    fallbackAnalyser.fftSize = 2048;
    inputGain.connect(fallbackAnalyser);
    fallbackBuf = new Float32Array(fallbackAnalyser.fftSize);
  }

  /** Simple ACF fallback when AudioWorklet is unavailable. */
  function fallbackDetect(): void {
    if (!fallbackAnalyser || !fallbackBuf || !ctx) return;
    fallbackAnalyser.getFloatTimeDomainData(fallbackBuf);
    const sr = ctx.sampleRate;
    let rms = 0;
    for (let i = 0; i < fallbackBuf.length; i++) rms += fallbackBuf[i] * fallbackBuf[i];
    rms = Math.sqrt(rms / fallbackBuf.length);
    const minLag = Math.floor(sr / 1600);
    const maxLag = Math.min(Math.floor(sr / 45), fallbackBuf.length >> 1);
    let bestLag = -1;
    let bestCorr = 0;
    // decimate by 2 for speed
    for (let lag = minLag; lag < maxLag; lag += 1) {
      let corr = 0;
      let norm = 0;
      for (let i = 0; i + lag < fallbackBuf.length; i += 4) {
        corr += fallbackBuf[i] * fallbackBuf[i + lag];
        norm += fallbackBuf[i] * fallbackBuf[i];
      }
      const c = norm > 1e-9 ? corr / norm : 0;
      if (c > bestCorr) {
        bestCorr = c;
        bestLag = lag;
      }
    }
    rawPitch = {
      freq: bestLag > 0 && bestCorr > 0.3 ? sr / bestLag : 0,
      confidence: clamp(bestCorr, 0, 1),
      inputDb: rmsToDb(rms),
    };
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  const dbToGain = (db: number): number => Math.pow(10, db / 20);
  const rmsToDb = (rms: number): number => (rms > 1e-7 ? 20 * Math.log10(rms) : -Infinity);

  /** Delay SYNC quantizes against the master transport BPM — inject it into
   *  the delay params wherever they reach the rack. */
  const withSyncBpm = (
    fx: Record<FxId, { enabled: boolean; params: Record<string, number | boolean> }>,
  ): Record<FxId, { enabled: boolean; params: Record<string, number | boolean> }> => ({
    ...fx,
    delay: { ...fx.delay, params: { ...fx.delay.params, bpm } },
  });

  function lfoRateHz(p: LfoParams): number {
    return p.syncOn ? syncDivisionToHz(p.syncDivision, bpm) : clamp(p.rateHz, 0.01, 40);
  }

  // -------------------------------------------------------------------------
  // Mod pump (60 Hz)
  // -------------------------------------------------------------------------

  function pump(): void {
    if (!ctx || !voice || disposed) return;
    const now = ctx.currentTime;
    const dt = PUMP_MS / 1000;
    const pe = state.pitchEngine;

    // --- follower (mic loudness envelope) ---
    const fp = state.follower;
    const inDb = rawPitch.inputDb;
    const level = inDb === -Infinity ? 0 : dbToGain(Math.max(-80, inDb));
    const gated = inDb > fp.gateDb ? level * fp.gain : 0;
    const target = clamp(gated * 4, 0, 1); // gain-staged to 0..1
    const tau = (target > followerVal ? Math.max(1, fp.attackMs) : Math.max(5, fp.releaseMs)) / 1000;
    followerVal += (target - followerVal) * (1 - Math.exp(-dt / tau));

    // --- pitch state computation ---
    const gateOpen = rawPitch.inputDb > pe.gateThreshDb;
    const confThresh = pe.trackingMode === 'fast' ? 0.35 : 0.5;
    const locked = gateOpen && rawPitch.confidence >= confThresh && rawPitch.freq > 0;
    let midi = 0;
    let cents = 0;
    if (rawPitch.freq > 0) {
      midi = ftom(rawPitch.freq);
      const nearest = Math.round(midi);
      cents = clamp((midi - nearest) * 100, -50, 50);
    }
    const nn = rawPitch.freq > 0 ? noteName(midi) : { name: '—', octave: 0 };
    pitchState = {
      locked,
      freq: locked ? rawPitch.freq : 0,
      midi: locked ? midi : 0,
      noteName: nn.name,
      octave: nn.octave,
      cents: locked ? cents : 0,
      confidence: rawPitch.confidence,
      inputDb: rawPitch.inputDb,
      gateOpen,
    };

    // --- voice pitch target ---
    if (keyboardMidi !== null) {
      smoothedMidi = keyboardMidi;
      hasMidi = true;
    } else if (locked) {
      let m = midi + pe.octaveShift * 12;
      if (pe.quantizeOn) m = snapToScale(m, pe.scale, pe.root);
      if (!hasMidi) {
        smoothedMidi = m;
        slowMidi = m;
        hasMidi = true;
      }
      // long-window center, then re-blend deviation by vibratoSense
      slowMidi += (m - slowMidi) * (1 - Math.exp(-dt / 0.25));
      const targetMidi = slowMidi + (m - slowMidi) * pe.vibratoSense;
      // tracking smoothing (fast = light, smooth = heavy)
      const trackTau = pe.trackingMode === 'fast' ? 0.012 : 0.05;
      smoothedMidi += (targetMidi - smoothedMidi) * (1 - Math.exp(-dt / trackTau));
    }
    const activeMidi = keyboardMidi ?? (locked && hasMidi ? smoothedMidi : null);
    if (activeMidi !== null) {
      const freq = mtof(activeMidi) * Math.pow(2, bendSemis / 12);
      voice.setFreq(freq, Math.max(0.003, pe.glideMs / 1000));
    }

    // --- voice gate from tracked voice ---
    const voiceDriven = keyboardMidi === null;
    if (voiceDriven && locked && !voiceGateOn) {
      voiceGateOn = true;
      const vel = clamp(0.35 + followerVal * 0.65, 0, 1);
      lastVelocity = vel;
      voice.trigger(vel);
      retriggerLfos();
    } else if (voiceGateOn && keyboardMidi === null && !gateOpen) {
      voiceGateOn = false;
      voice.release();
    }

    // --- envelopes ---
    const env1Val = voice.env1.valueAt(now);
    const env2Val = voice.env2.valueAt(now);

    // --- LFOs ---
    const lfoAcc: number[] = [0, 0, 0];
    const lfoParams = [state.lfo1, state.lfo2, state.lfo3];
    for (let i = 0; i < 3; i++) {
      const p = lfoParams[i];
      const rt = lfos[i];
      const rateMod = clamp(lastRateOff[i], -2, 2);
      const rate = lfoRateHz(p) * Math.pow(2, rateMod);
      const prevPhase = rt.phase;
      rt.phase += rate * dt;
      if (Math.floor(rt.phase) !== Math.floor(prevPhase)) {
        rt.shValue = Math.random() * 2 - 1;
      }
      let v = p.shape === 'sh' ? rt.shValue : lfoShapeValue(p.shape, rt.phase + p.phase);
      // delay fade-in after trigger
      const fade = p.delayMs > 0 ? clamp(((now - rt.trigAt) * 1000) / p.delayMs, 0, 1) : 1;
      v *= p.depth * fade;
      // one-pole smoothing
      if (p.smooth > 0) {
        const st = 0.001 + p.smooth * 0.15;
        rt.smoothed += (v - rt.smoothed) * (1 - Math.exp(-dt / st));
      } else {
        rt.smoothed = v;
      }
      rt.value = rt.smoothed;
      lfoAcc[i] = rt.value;
    }

    // --- HUMAN: smooth random wander (new target each interval, glided) ---
    const hp = state.human;
    const hRate = hp.syncOn ? syncDivisionToHz(hp.syncDivision, bpm) : clamp(hp.rateHz, 0.05, 8);
    const hInterval = 1 / Math.max(0.05, hRate);
    humanRt.clock += dt;
    if (humanRt.clock >= hInterval) {
      humanRt.clock = 0;
      humanRt.target = Math.random() * 2 - 1;
    }
    humanRt.value += (humanRt.target - humanRt.value) * (1 - Math.exp(-dt / Math.max(0.005, hInterval * 0.45)));

    // --- mod sources ---
    // envs/follower/velocity/macros/modWheel are unipolar 0..1;
    // LFOs/XY/pitch are bipolar -1..1. All within the [-1,1] contract.
    const src: Record<ModSourceId, number> = {
      env1: env1Val,
      env2: env2Val,
      lfo1: lfoAcc[0],
      lfo2: lfoAcc[1],
      lfo3: lfoAcc[2],
      follower: followerVal,
      velocity: lastVelocity,
      pitch: locked ? clamp(cents / 50, -1, 1) : 0,
      macro1: clamp((state.macros[0] ?? 0.5) * 2 - 1, -1, 1),
      macro2: clamp((state.macros[1] ?? 0.5) * 2 - 1, -1, 1),
      macro3: clamp((state.macros[2] ?? 0.5) * 2 - 1, -1, 1),
      macro4: clamp((state.macros[3] ?? 0.5) * 2 - 1, -1, 1),
      xyX: state.xy.x * 2 - 1,
      xyY: state.xy.y * 2 - 1,
      modWheel: modWheelVal,
      human: clamp(humanRt.value * hp.depth, -1, 1),
    };
    modValues = src;

    // --- accumulate matrix routes ---
    const acc = new Map<ModDestId, number>();
    const addAcc = (dest: ModDestId, v: number) => acc.set(dest, (acc.get(dest) ?? 0) + v);
    for (const r of state.matrix) {
      if (!r.enabled) continue;
      addAcc(r.dest, src[r.source] * r.amount);
    }
    // XY pad direct routings
    addAcc(state.xy.xDest, src.xyX * 0.75);
    addAcc(state.xy.yDest, src.xyY * 0.75);
    const get = (d: ModDestId): number => acc.get(d) ?? 0;
    // LFO rate offsets apply next frame (avoids feedback ordering issues)
    lastRateOff = [clamp(get('lfo1Rate'), -1, 1) * 2, clamp(get('lfo2Rate'), -1, 1) * 2, clamp(get('lfo3Rate'), -1, 1) * 2];

    // --- apply: filter ---
    const f = state.filter;
    const kt = activeMidi !== null ? Math.pow(2, (f.keyTrack * (activeMidi - 60)) / 12) : 1;
    const cutoffEff = clamp(f.cutoffHz * kt * Math.pow(2, get('cutoff') * 2), 20, 20000);
    const resEff = clamp(f.resonance + get('resonance') * 0.5, 0, 1);
    voice.filter.applyCutoffRes(cutoffEff, resEff);
    voice.setEnvAmt(f.envAmt, cutoffEff);
    const driveEff = clamp(f.drive + get('filterDrive') * 0.5, 0, 1);
    if (Math.abs(driveEff - lastDriveEff) > 0.02) {
      lastDriveEff = driveEff;
      voice.filter.setParams({ ...f, drive: driveEff });
    }

    // --- apply: osc morph / levels ---
    voice.oscA.setMorph(clamp(state.oscA.wtPos + get('wtPosA') * 0.5, 0, 1));
    voice.oscB.setMorph(clamp(state.oscB.wtPos + get('wtPosB') * 0.5, 0, 1));
    voice.oscA.setModLevel(state.oscA.level + get('oscALevel') * 0.5);
    voice.oscB.setModLevel(state.oscB.level + get('oscBLevel') * 0.5);
    voice.sub.setModLevel(state.sub.level + get('subLevel') * 0.5);
    voice.noise.setModLevel(state.noise.level + get('noiseLevel') * 0.5);
    // master voice level + pan
    voice.output.gain.setTargetAtTime(clamp(1 + get('level'), 0, 1.5), now, 0.02);
    if (voicePan) {
      voicePan.pan.setTargetAtTime(clamp(get('pan'), -1, 1), now, 0.02);
    }

    // --- apply: pitch vibrato (matrix 'pitch' dest, +-2 semis full scale) ---
    const pitchMod = get('pitch');
    if (Math.abs(pitchMod - lastPitchMod) > 0.002 && activeMidi !== null) {
      lastPitchMod = pitchMod;
      const freq = mtof(activeMidi + pitchMod * 2) * Math.pow(2, bendSemis / 12);
      voice.setFreq(freq, 0.01);
    }

    // --- apply: FX params (only when meaningfully changed) ---
    applyFxMods(get);

    // --- output meter ---
    if (outputAnalyser && meterBuf) {
      outputAnalyser.getFloatTimeDomainData(meterBuf);
      let peak = 0;
      for (let i = 0; i < meterBuf.length; i += 2) {
        const a = Math.abs(meterBuf[i]);
        if (a > peak) peak = a;
      }
      const inst = rmsToDb(peak);
      outputPeakDb = inst > outputPeakDb ? inst : Math.max(inst, outputPeakDb - dt * 30);
    }

    // --- fallback pitch detection ---
    if (!workletNode && fallbackAnalyser) {
      fallbackCounter++;
      if (fallbackCounter % 3 === 0) fallbackDetect();
    }
  }

  let lastDriveEff = -1;
  let lastPitchMod = 0;
  let lastRateOff = [0, 0, 0];
  const lastFxEff: Partial<Record<FxId, Record<string, number>>> = {};

  function applyFxMods(get: (d: ModDestId) => number): void {
    if (!rack) return;
    const fx = state.fx;
    const effs: Array<[FxId, string, number, number]> = [
      ['saturator', 'drive', get('fxSaturatorDrive'), 0.5],
      ['chorus', 'depth', get('fxChorusDepth'), 0.5],
      ['delay', 'timeMs', get('fxDelayTime'), 400],
      ['delay', 'feedback', get('fxDelayFeedback'), 0.4],
      ['reverb', 'size', get('fxReverbSize'), 0.5],
      ['reverb', 'mix', get('fxReverbMix'), 0.5],
      ['width', 'width', get('fxWidth'), 0.5],
    ];
    const byId = new Map<FxId, Record<string, number | boolean>>();
    for (const [id, key, v, scale] of effs) {
      if (Math.abs(v) < 1e-4 && !lastFxEff[id]?.[key]) continue;
      const base = fx[id].params[key];
      if (typeof base !== 'number') continue;
      const val = key === 'timeMs'
        ? clamp(base + v * scale, 20, 1900)
        : clamp(base + v * scale, 0, key === 'feedback' ? 0.9 : 1);
      const last = lastFxEff[id]?.[key];
      if (last !== undefined && Math.abs(last - val) < 0.01) continue;
      if (!byId.has(id)) byId.set(id, { ...fx[id].params });
      byId.get(id)![key] = val;
      lastFxEff[id] = { ...(lastFxEff[id] ?? {}), [key]: val };
    }
    for (const [id, params] of byId) {
      rack.updateParams(id, id === 'delay' ? { ...params, bpm } : params);
    }
  }

  function retriggerLfos(): void {
    if (!ctx) return;
    for (const rt of lfos) {
      rt.trigAt = ctx.currentTime;
      rt.phase = 0;
    }
  }

  // -------------------------------------------------------------------------
  // Param application (setParams)
  // -------------------------------------------------------------------------

  function applyGroup(group: keyof EngineState): void {
    if (!voice || !ctx) return;
    switch (group) {
      case 'oscA':
        voice.oscA.setParams(state.oscA);
        voice.setWarpDirty();
        break;
      case 'oscB':
        voice.oscB.setParams(state.oscB);
        voice.setWarpDirty();
        break;
      case 'sub': voice.sub.setParams(state.sub); break;
      case 'noise': voice.noise.setParams(state.noise); break;
      case 'filter':
        voice.filter.setParams(state.filter);
        voice.refreshFilter();
        lastDriveEff = state.filter.drive;
        break;
      case 'env1': voice.env1.params = state.env1; break;
      case 'env2': voice.env2.params = state.env2; break;
      case 'pitchEngine':
        if (workletNode) {
          const fast = state.pitchEngine.trackingMode === 'fast';
          workletNode.port.postMessage({
            type: 'config',
            window: fast ? 1024 : 2048,
            interval: fast ? 512 : 1536,
          });
        }
        break;
      case 'fx':
        rack?.configure(rackIn!, masterGain!, state.fxOrder, withSyncBpm(state.fx));
        break;
      case 'fxOrder':
        rack?.configure(rackIn!, masterGain!, state.fxOrder, withSyncBpm(state.fx));
        break;
      case 'master':
        if (inputGain) inputGain.gain.setTargetAtTime(dbToGain(state.master.inputGainDb), ctx.currentTime, 0.02);
        if (monitorGain) monitorGain.gain.setTargetAtTime(state.master.monitorOn ? 0.9 : 0, ctx.currentTime, 0.05);
        if (masterGain) masterGain.gain.setTargetAtTime(state.master.masterLevel, ctx.currentTime, 0.02);
        break;
      case 'drums':
        if (drumBus) drumBus.gain.setTargetAtTime(state.drums.level * 0.9, ctx.currentTime, 0.03);
        if (drumSend) drumSend.gain.setTargetAtTime(state.drums.send * 0.7, ctx.currentTime, 0.03);
        if (drumDelay) drumDelay.delayTime.setTargetAtTime((60 / bpm) * 0.75, ctx.currentTime, 0.05);
        break;
      default:
        break; // lfo/follower/matrix/xy/human/macros read live from state in pump
    }
  }

  // -------------------------------------------------------------------------
  // Demo vocal sources (virtual mic) + synth showcase (auto-played riff)
  // -------------------------------------------------------------------------

  let demoNode: AudioBufferSourceNode | null = null;
  let demoPlaying: DemoSourceId | null = null;
  let demoBufferRef: AudioBuffer | null = null;
  let demoStartedAt = 0;
  let frozenDemo: { id: DemoSourceId; offset: number } | null = null;
  /** invalidates in-flight startDemo boots after stopDemo/restart */
  let demoToken = 0;
  const demoBuffers = new Map<DemoSourceId, AudioBuffer>();
  const demoPending = new Map<DemoSourceId, Promise<AudioBuffer | null>>();

  async function loadDemoBuffer(id: DemoSourceId): Promise<AudioBuffer | null> {
    const cached = demoBuffers.get(id);
    if (cached) return cached;
    let p = demoPending.get(id);
    if (!p) {
      const meta = DEMO_SOURCES.find((d) => d.id === id);
      if (!meta || !ctx) return null;
      const c = ctx;
      p = (async () => {
        try {
          const res = await fetch(meta.file);
          if (!res.ok) return null;
          const buf = await c.decodeAudioData(await res.arrayBuffer());
          demoBuffers.set(id, buf);
          return buf;
        } catch {
          return null;
        }
      })();
      demoPending.set(id, p);
    }
    return p;
  }

  function stopDemoInternal(): void {
    demoToken++;
    demoPlaying = null;
    frozenDemo = null;
    demoBufferRef = null;
    if (demoNode) {
      try { demoNode.stop(); } catch { /* noop */ }
      try { demoNode.disconnect(); } catch { /* noop */ }
      demoNode = null;
    }
  }

  // --- recorded-take injection ("send to synth") — same path as demo loops ---
  let sampleNode: AudioBufferSourceNode | null = null;
  let samplePlaying: string | null = null;
  let sampleBufferRef: AudioBuffer | null = null;
  let sampleStartedAt = 0;
  let frozenSample: { name: string; offset: number } | null = null;
  /** invalidates in-flight startSample boots after stopSample/restart */
  let sampleToken = 0;

  function stopSampleInternal(): void {
    sampleToken++;
    samplePlaying = null;
    frozenSample = null;
    sampleBufferRef = null;
    if (sampleNode) {
      try { sampleNode.stop(); } catch { /* noop */ }
      try { sampleNode.disconnect(); } catch { /* noop */ }
      sampleNode = null;
    }
  }

  /** Shared private path: loop an already-decoded buffer into the exact node
   *  the mic feeds (inputGain → tracker / gate / follower / input analyser).
   *  Caller guarantees ctx + inputGain exist and no live mic owns the input.
   *  `offset` resumes mid-loop (transport pause/resume). */
  function playBufferIntoInput(buffer: AudioBuffer, offset = 0): AudioBufferSourceNode {
    const node = ctx!.createBufferSource();
    node.buffer = buffer;
    node.loop = true;
    node.connect(inputGain!); // SAME node the mic feeds
    node.start(0, offset);
    return node;
  }

  /** Boot the graph without any mic call (shared by demo + showcase).
   *  Returns false when disposed or a live mic owns the input path. */
  async function ensureNoMicBoot(): Promise<boolean> {
    if (!ctx) await engine.start({ useMic: false });
    if (!ctx || disposed || micStream) return false;
    try { await ctx.resume(); } catch { /* gesture required */ }
    return true;
  }

  // --- showcase riff: 8-bar A-minor groove (monophonic, 16ths) — tempo
  // follows the master transport BPM via stepSec(). ---
  const SC_LOOP_STEPS = 8 * 16;

  interface ScEvent {
    step: number;   // absolute 16th-note step in the 8-bar loop
    midi: number;
    len: number;    // steps
    vel: number;    // 0..1
    scoop?: boolean; // pitch-bend scoop up into the note
  }

  const SC_RIFF: ScEvent[] = (() => {
    // [stepInBar, midi, lenSteps, velocity, scoop?]
    const bars: Array<Array<[number, number, number, number, boolean?]>> = [
      // bar 1 — low A-minor groove
      [[0, 45, 2, 0.9], [3, 45, 1, 0.6], [4, 48, 2, 0.8], [6, 45, 2, 0.6],
       [8, 52, 2, 0.85], [11, 50, 1, 0.6], [12, 48, 2, 0.75], [14, 45, 2, 0.55]],
      // bar 2 — same body, lifted ending (G3 → A3 with a scoop)
      [[0, 45, 2, 0.9], [3, 45, 1, 0.6], [4, 48, 2, 0.8], [6, 45, 2, 0.6],
       [8, 52, 2, 0.85], [11, 55, 1, 0.7], [12, 57, 3, 0.9, true], [15, 52, 1, 0.5]],
      // bar 3 — bar 1 restated
      [[0, 45, 2, 0.9], [3, 45, 1, 0.6], [4, 48, 2, 0.8], [6, 45, 2, 0.6],
       [8, 52, 2, 0.85], [11, 50, 1, 0.6], [12, 48, 2, 0.75], [14, 45, 2, 0.55]],
      // bar 4 — G2 turn-around
      [[0, 43, 2, 0.85], [3, 43, 1, 0.6], [4, 45, 2, 0.8], [6, 43, 2, 0.55],
       [8, 50, 2, 0.85], [11, 52, 1, 0.65], [12, 55, 2, 0.8], [14, 52, 2, 0.6]],
      // bar 5 — high answer phrase (scoop into A3)
      [[0, 57, 3, 0.9, true], [4, 55, 2, 0.7], [6, 52, 2, 0.65],
       [8, 60, 3, 0.85], [12, 57, 2, 0.7], [14, 55, 2, 0.6]],
      // bar 6 — peak (scoop into E4), walk back down
      [[0, 64, 4, 0.9, true], [6, 62, 2, 0.7], [8, 60, 2, 0.75],
       [11, 59, 1, 0.6], [12, 57, 4, 0.8]],
      // bar 7 — bar 1 restated
      [[0, 45, 2, 0.9], [3, 45, 1, 0.6], [4, 48, 2, 0.8], [6, 45, 2, 0.6],
       [8, 52, 2, 0.85], [11, 50, 1, 0.6], [12, 48, 2, 0.75], [14, 45, 2, 0.55]],
      // bar 8 — E3 turn-around back to A
      [[0, 52, 2, 0.85], [3, 52, 1, 0.6], [4, 55, 2, 0.8], [6, 52, 2, 0.6],
       [8, 57, 3, 0.9], [12, 55, 2, 0.7], [14, 52, 2, 0.65], [15, 50, 1, 0.5]],
    ];
    const out: ScEvent[] = [];
    bars.forEach((bar, b) => {
      for (const [step, midi, len, vel, scoop] of bar) {
        out.push({ step: b * 16 + step, midi, len, vel, scoop });
      }
    });
    return out;
  })();
  const SC_RIFF_MAP = new Map(SC_RIFF.map((e) => [e.step, e]));

  let showcasePlaying = false;
  let scBooting = false;
  let scTimeouts: Array<ReturnType<typeof setTimeout>> = [];
  let scStep = 0;
  let scLoop = 0;

  // --- transport: ONE master 16th-note clock. The step sequencer and the
  // showcase both schedule off it; delay SYNC + LFO sync read `bpm` live. ---
  let bpm = BPM_DEFAULT;
  let transportPlaying = false;
  let transportTick: ReturnType<typeof setInterval> | null = null;
  let nextStepTime = 0; // ctx time of the next 16th
  const TRANSPORT_LOOKAHEAD_SEC = 0.25;
  const TRANSPORT_TICK_MS = 25;
  const stepSec = (): number => 60 / bpm / 4;

  const cloneSeq = (s: SequencerState): SequencerState => ({
    enabled: s.enabled,
    length: s.length,
    steps: s.steps.map((st: SeqStep) => ({ ...st })),
  });
  let seqState: SequencerState = cloneSeq(DEFAULT_SEQUENCER);
  let seqStepIdx = 0; // next step to schedule (wraps at seqState.length)
  let seqCurrent: number | null = null; // last fired step — UI playhead
  let seqHeldMidi: number | null = null;
  let seqTimeouts: Array<ReturnType<typeof setTimeout>> = [];

  let scHeldMidi: number | null = null;
  let scPresetIdx = -1;
  let scPresetId: string | null = null;

  function scAdvancePreset(): void {
    if (FACTORY_PRESETS.length === 0) return;
    scPresetIdx = (scPresetIdx + 1) % FACTORY_PRESETS.length;
    const p = FACTORY_PRESETS[scPresetIdx];
    engine.setState(p.state, { preservePerformance: true });
    scPresetId = p.id;
  }

  /** Fire one sequencer step (mono: a new ON step releases the held note). */
  function scheduleSeqStep(i: number, delayMs: number): void {
    const st = seqState.steps[i];
    if (!st) return;
    seqTimeouts.push(setTimeout(() => {
      if (!transportPlaying || !seqState.enabled) return;
      seqCurrent = i;
      if (seqHeldMidi !== null) { engine.noteOff(seqHeldMidi); seqHeldMidi = null; }
      if (st.on) {
        const midi = Math.max(0, Math.min(127, Math.round(st.note)));
        engine.noteOn(midi, clamp(st.velocity, 0, 1));
        seqHeldMidi = midi;
      }
    }, delayMs));
  }

  /** Fire one showcase riff event (same clock as the sequencer). */
  function scheduleScStep(step: number, delayMs: number): void {
    const ev = SC_RIFF_MAP.get(step);
    if (!ev) return;
    scTimeouts.push(setTimeout(() => {
      if (!showcasePlaying) return;
      engine.noteOn(ev.midi, ev.vel);
      scHeldMidi = ev.midi;
      if (ev.scoop) {
        engine.pitchBend(-0.5);
        scTimeouts.push(setTimeout(() => { if (showcasePlaying) engine.pitchBend(-0.18); }, 70));
        scTimeouts.push(setTimeout(() => { if (showcasePlaying) engine.pitchBend(0); }, 170));
      }
    }, delayMs));
    scTimeouts.push(setTimeout(() => {
      if (!showcasePlaying) return;
      engine.noteOff(ev.midi);
      if (scHeldMidi === ev.midi) scHeldMidi = null;
    }, delayMs + ev.len * stepSec() * 1000 * 0.9));
  }

  // --- drums: sample-accurate one-shots on the same 16th clock. Independent
  // of the sequencer — a "what would my patch sound like over a beat" sketch.
  let drumStepIdx = 0;
  const DRUM_STEPS = {
    kick: [0, 4, 8, 12],
    hat: [2, 6, 10, 14],
    clap: [4, 12],
  } as const;

  /** Kick: sine with exponential pitch drop 150 -> 45 Hz + fast amp env. */
  function drumHitKick(t: number): void {
    if (!ctx || !drumBus) return;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.09);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    osc.connect(g).connect(drumBus);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  /** Hat: short noise burst through a high-pass. */
  function drumHitHat(t: number): void {
    if (!ctx || !drumBus || !noiseBuf) return;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const hpF = ctx.createBiquadFilter();
    hpF.type = 'highpass';
    hpF.frequency.value = 7500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    src.connect(hpF).connect(g).connect(drumBus);
    src.start(t, Math.random() * 1.5);
    src.stop(t + 0.08);
  }

  /** Clap: three noise bursts through a band-pass + short tail. */
  function drumHitClap(t: number): void {
    if (!ctx || !drumBus || !noiseBuf) return;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1600;
    bp.Q.value = 1.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    for (const burst of [0, 0.02, 0.04]) {
      g.gain.setValueAtTime(0.6, t + burst);
      g.gain.exponentialRampToValueAtTime(0.08, t + burst + 0.015);
    }
    g.gain.setValueAtTime(0.5, t + 0.06);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
    src.connect(bp).connect(g).connect(drumBus);
    src.start(t, Math.random() * 1.5);
    src.stop(t + 0.26);
  }

  function scheduleDrumStep(step: number, t: number): void {
    const d = state.drums;
    if (!d.kick && !d.hat && !d.clap) return;
    if (d.kick && (DRUM_STEPS.kick as readonly number[]).includes(step)) drumHitKick(t);
    if (d.hat && (DRUM_STEPS.hat as readonly number[]).includes(step)) drumHitHat(t);
    if (d.clap && (DRUM_STEPS.clap as readonly number[]).includes(step)) drumHitClap(t);
  }

  /** Master lookahead scheduler: every 16th, fire sequencer + showcase. */
  function transportTickFn(): void {
    if (!ctx || !transportPlaying) return;
    while (nextStepTime < ctx.currentTime + TRANSPORT_LOOKAHEAD_SEC) {
      const delayMs = Math.max(0, (nextStepTime - ctx.currentTime) * 1000);
      if (seqState.enabled) scheduleSeqStep(seqStepIdx, delayMs);
      if (showcasePlaying) scheduleScStep(scStep, delayMs);
      scheduleDrumStep(drumStepIdx, nextStepTime);
      drumStepIdx = (drumStepIdx + 1) % 16;
      if (seqState.enabled) {
        seqStepIdx = (seqStepIdx + 1) % Math.max(1, Math.min(16, Math.round(seqState.length)));
      }
      if (showcasePlaying) {
        scStep = (scStep + 1) % SC_LOOP_STEPS;
        if (scStep === 0) {
          scLoop++;
          // sound morphs by itself: next factory preset every 2 loops
          if (scLoop % 2 === 0) scAdvancePreset();
        }
      }
      nextStepTime += stepSec();
    }
  }

  /** Freeze looping demo/sample sources, remembering playback offset so
   *  resume continues from the same spot in the loop. */
  function freezeSources(): void {
    if (!ctx) return;
    if (demoNode && demoPlaying && demoBufferRef) {
      const off = (ctx.currentTime - demoStartedAt) % demoBufferRef.duration;
      frozenDemo = { id: demoPlaying, offset: off < 0 ? 0 : off };
      try { demoNode.stop(); } catch { /* noop */ }
      try { demoNode.disconnect(); } catch { /* noop */ }
      demoNode = null;
    }
    if (sampleNode && samplePlaying && sampleBufferRef) {
      const off = (ctx.currentTime - sampleStartedAt) % sampleBufferRef.duration;
      frozenSample = { name: samplePlaying, offset: off < 0 ? 0 : off };
      try { sampleNode.stop(); } catch { /* noop */ }
      try { sampleNode.disconnect(); } catch { /* noop */ }
      sampleNode = null;
    }
  }

  /** Recreate frozen sources from their stored loop offsets. */
  function resumeFrozenSources(): void {
    if (!ctx || !inputGain) return;
    if (frozenDemo && demoPlaying === frozenDemo.id && !demoNode) {
      const buf = demoBuffers.get(frozenDemo.id);
      if (buf) {
        const off = frozenDemo.offset % buf.duration;
        demoNode = playBufferIntoInput(buf, off);
        demoStartedAt = ctx.currentTime - off;
        demoBufferRef = buf;
      }
    }
    frozenDemo = null;
    if (frozenSample && samplePlaying === frozenSample.name && !sampleNode && sampleBufferRef) {
      const off = frozenSample.offset % sampleBufferRef.duration;
      sampleNode = playBufferIntoInput(sampleBufferRef, off);
      sampleStartedAt = ctx.currentTime - off;
    }
    frozenSample = null;
  }

  /** Master play/stop fade — the spacebar interaction. Stopping fades the
   *  whole instrument to silence before freezing the clock; starting fades
   *  back in. Recorded takes capture the fade (they tap the master). */
  const TRANSPORT_FADE_SEC = 0.35;
  let fadeTimer: ReturnType<typeof setTimeout> | null = null;
  function fadeMasterTo(target: number): void {
    if (!ctx || !playGate) return;
    const t = ctx.currentTime;
    playGate.gain.cancelScheduledValues(t);
    playGate.gain.setValueAtTime(playGate.gain.value, t);
    playGate.gain.linearRampToValueAtTime(target, t + TRANSPORT_FADE_SEC);
  }

  function startTransportInternal(): void {
    if (disposed || !ctx || transportPlaying) return;
    if (fadeTimer) { clearTimeout(fadeTimer); fadeTimer = null; }
    transportPlaying = true;
    fadeMasterTo(1);
    void ctx.resume().catch(() => undefined);
    nextStepTime = ctx.currentTime + 0.06;
    transportTick = setInterval(transportTickFn, TRANSPORT_TICK_MS);
    transportTickFn();
    resumeFrozenSources();
  }

  function pauseTransportInternal(): void {
    if (!transportPlaying) return;
    transportPlaying = false;
    fadeMasterTo(0);
    // let the fade-out finish before freezing the clock and loops
    if (fadeTimer) clearTimeout(fadeTimer);
    fadeTimer = setTimeout(() => {
      fadeTimer = null;
      if (transportPlaying) return; // restarted mid-fade
      if (transportTick) { clearInterval(transportTick); transportTick = null; }
      for (const t of seqTimeouts) clearTimeout(t);
      seqTimeouts = [];
      for (const t of scTimeouts) clearTimeout(t);
      scTimeouts = [];
      if (seqHeldMidi !== null) { engine.noteOff(seqHeldMidi); seqHeldMidi = null; }
      if (scHeldMidi !== null) { engine.noteOff(scHeldMidi); scHeldMidi = null; }
      engine.pitchBend(0);
      seqCurrent = null;
      freezeSources();
    }, TRANSPORT_FADE_SEC * 1000);
  }

  function stopShowcaseInternal(): void {
    showcasePlaying = false;
    scStep = 0;
    scLoop = 0;
    for (const t of scTimeouts) clearTimeout(t);
    scTimeouts = [];
    if (scHeldMidi !== null) {
      engine.noteOff(scHeldMidi);
      scHeldMidi = null;
    }
    engine.pitchBend(0);
    scPresetId = null;
  }

  // -------------------------------------------------------------------------
  // Engine object
  // -------------------------------------------------------------------------

  const engine: SynthEngine = {
    async start(opts: { useMic: boolean }): Promise<EngineStatus> {
      if (disposed) return status;
      if (!ctx) {
        ctx = new AudioContext({ latencyHint: 'interactive' });
        onStateChange = () => {
          if (!ctx) return;
          if (ctx.state === 'suspended' && (status === 'live' || status === 'no-mic')) {
            status = 'suspended';
          } else if (ctx.state === 'running' && status === 'suspended') {
            status = micStream ? 'live' : 'no-mic';
          }
        };
        ctx.addEventListener('statechange', onStateChange);
        buildGraph();
        await attachWorklet();
        if (!workletNode) attachFallbackPitch();
        pumpTimer = setInterval(pump, PUMP_MS);
      }
      if (ctx.state === 'suspended') {
        try { await ctx.resume(); } catch { /* gesture required */ }
      }
      if (opts.useMic && !micStream) {
        status = 'awaiting-mic';
        micError = null;
        if (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext) {
          // getUserMedia may not even exist outside a secure context
          micError = 'InsecureContextError';
          status = 'no-mic';
        } else {
          try {
            try {
              micStream = await getUserMediaWithTimeout({
                audio: {
                  echoCancellation: false,
                  noiseSuppression: false,
                  autoGainControl: false,
                  channelCount: 1,
                },
              });
            } catch (err) {
              // raw-audio constraints can overconstrain some devices —
              // retry once with relaxed constraints before failing
              if ((err as DOMException)?.name === 'OverconstrainedError') {
                micStream = await getUserMediaWithTimeout({ audio: true });
              } else {
                throw err;
              }
            }
            micSource = ctx.createMediaStreamSource(micStream);
            micSource.connect(inputGain!);
            // a live mic owns the input path — demo/showcase/sample yield
            stopDemoInternal();
            stopShowcaseInternal();
            stopSampleInternal();
            micError = null;
            status = 'live';
          } catch (err) {
            micError = (err as DOMException)?.name ?? 'UnknownError';
            status = micError === 'NotAllowedError' || micError === 'SecurityError' ? 'denied' : 'no-mic';
          }
        }
      } else if (!opts.useMic && !micStream) {
        status = 'no-mic';
      } else if (micStream) {
        stopDemoInternal();
        stopShowcaseInternal();
        stopSampleInternal();
        status = 'live';
      }
      return status;
    },

    async resume(): Promise<void> {
      if (ctx && ctx.state === 'suspended') {
        try { await ctx.resume(); } catch { /* noop */ }
      }
    },

    async suspend(): Promise<void> {
      if (ctx && ctx.state === 'running') {
        try { await ctx.suspend(); } catch { /* noop */ }
      }
    },

    dispose(): void {
      disposed = true;
      transportPlaying = false;
      if (transportTick) { clearInterval(transportTick); transportTick = null; }
      if (fadeTimer) { clearTimeout(fadeTimer); fadeTimer = null; }
      for (const t of seqTimeouts) clearTimeout(t);
      seqTimeouts = [];
      stopDemoInternal();
      stopShowcaseInternal();
      stopSampleInternal();
      if (pumpTimer) { clearInterval(pumpTimer); pumpTimer = null; }
      try { voice?.dispose(); } catch { /* noop */ }
      try { rack?.dispose(); } catch { /* noop */ }
      try { workletNode?.disconnect(); } catch { /* noop */ }
      try { micSource?.disconnect(); } catch { /* noop */ }
      if (micStream) for (const t of micStream.getTracks()) t.stop();
      if (ctx && onStateChange) ctx.removeEventListener('statechange', onStateChange);
      if (workletUrl) URL.revokeObjectURL(workletUrl);
      const c = ctx;
      ctx = null;
      voice = null;
      rack = null;
      workletNode = null;
      micStream = null;
      micSource = null;
      micError = null;
      status = 'idle';
      if (c && c.state !== 'closed') void c.close().catch(() => undefined);
    },

    getState(): EngineState {
      return JSON.parse(JSON.stringify(state)) as EngineState;
    },

    setState(s: EngineState, opts?: { preservePerformance?: boolean }): void {
      const next = JSON.parse(JSON.stringify(s)) as EngineState;
      // merge any groups the incoming snapshot doesn't know about (old user
      // presets saved before human/drums/drift existed)
      const dflt = defaultEngineState();
      if (!next.human) next.human = dflt.human;
      if (!next.drums) next.drums = dflt.drums;
      if (next.xy && next.xy.drift === undefined) { next.xy.drift = dflt.xy.drift; next.xy.driftSync = dflt.xy.driftSync; }
      // preset loads keep performance settings: the user's master level,
      // drum sketch, and XY drift stay where they left them
      if (opts?.preservePerformance && state) {
        next.master.masterLevel = state.master.masterLevel;
        next.drums = { ...next.drums, ...state.drums };
        next.xy.drift = state.xy.drift;
        next.xy.driftSync = state.xy.driftSync;
      }
      state = next;
      if (state.matrix.length > 12) state.matrix = state.matrix.slice(0, 12);
      // quick master dip so a patch swap never slaps the ears mid-transport
      if (transportPlaying && ctx && playGate) {
        const t = ctx.currentTime;
        playGate.gain.cancelScheduledValues(t);
        playGate.gain.setValueAtTime(playGate.gain.value, t);
        playGate.gain.linearRampToValueAtTime(0.25, t + 0.06);
        playGate.gain.linearRampToValueAtTime(1, t + 0.24);
      }
      const groups: Array<keyof EngineState> = [
        'oscA', 'oscB', 'sub', 'noise', 'filter', 'env1', 'env2',
        'pitchEngine', 'fx', 'fxOrder', 'master', 'drums',
      ];
      for (const g of groups) applyGroup(g);
    },

    setParams<K extends keyof EngineState>(group: K, patch: Partial<EngineState[K]>): void {
      const cur = state[group];
      if (Array.isArray(cur) || group === 'fxOrder' || group === 'matrix'
        || group === 'macros' || group === 'macroNames') {
        // array-shaped groups are replaced wholesale
        (state as unknown as Record<string, unknown>)[group as string] = patch;
        applyGroup(group);
        return;
      }
      if (cur && typeof cur === 'object') {
        Object.assign(cur as object, patch);
      }
      applyGroup(group);
    },

    addRoute(route: Omit<ModRoute, 'id'>): ModRoute {
      const full: ModRoute = { ...route, id: uid() };
      if (state.matrix.length < 12) state.matrix.push(full);
      return full;
    },

    removeRoute(id: string): void {
      state.matrix = state.matrix.filter((r) => r.id !== id);
    },

    noteOn(midi: number, velocity = 0.8): void {
      keyboardMidi = midi;
      const vs = state.pitchEngine.velocitySense;
      lastVelocity = clamp((1 - vs) * 0.6 + vs * clamp(velocity, 0, 1), 0, 1);
      hasMidi = true;
      if (voice && ctx) {
        voice.trigger(lastVelocity);
        retriggerLfos();
        const glide = Math.max(0.003, state.pitchEngine.glideMs / 1000);
        voice.setFreq(mtof(midi) * Math.pow(2, bendSemis / 12), glide);
      }
    },

    noteOff(midi: number): void {
      if (keyboardMidi !== midi) return;
      keyboardMidi = null;
      if (voice && !voiceGateOn) voice.release();
    },

    pitchBend(amount: number): void {
      bendSemis = clamp(amount, -1, 1) * state.pitchEngine.bendRangeSemis;
      if (voice && keyboardMidi !== null) {
        voice.setFreq(mtof(keyboardMidi) * Math.pow(2, bendSemis / 12), 0.02);
      }
    },

    modWheel(amount: number): void {
      modWheelVal = clamp(amount, 0, 1);
    },

    async startDemo(source: DemoSourceId): Promise<void> {
      if (disposed) return;
      if (demoPlaying === source && demoNode) return; // same source: no-op
      stopShowcaseInternal();
      stopSampleInternal();
      stopDemoInternal();
      if (micStream) return; // a live mic owns the input path
      const token = demoToken;
      demoPlaying = source; // optimistic — UI lights the chip immediately
      try {
        if (!(await ensureNoMicBoot())) throw new Error('boot');
        const buf = await loadDemoBuffer(source);
        if (!buf || disposed || micStream || token !== demoToken || !ctx || !inputGain) {
          throw new Error('abort');
        }
        try { await ctx.resume(); } catch { /* noop */ }
        demoNode = playBufferIntoInput(buf);
        demoStartedAt = ctx.currentTime;
        demoBufferRef = buf;
        startTransportInternal(); // PAUSE/PLAY governs the loop from here
      } catch {
        if (token === demoToken) demoPlaying = null;
      }
    },

    stopDemo(): void {
      stopDemoInternal();
    },

    startSample(buffer: AudioBuffer, name: string): void {
      if (disposed) return;
      if (samplePlaying === name && sampleNode) return; // same take again: no-op
      stopDemoInternal();
      stopShowcaseInternal();
      stopSampleInternal(); // switching takes = restart with the new buffer
      if (micStream) return; // a live mic owns the input path
      const token = sampleToken;
      samplePlaying = name; // optimistic — UI lights the chip immediately
      void (async () => {
        try {
          if (!(await ensureNoMicBoot())) throw new Error('boot');
          if (disposed || micStream || token !== sampleToken || !ctx || !inputGain) {
            throw new Error('abort');
          }
          try { await ctx.resume(); } catch { /* noop */ }
          sampleNode = playBufferIntoInput(buffer);
          sampleStartedAt = ctx.currentTime;
          sampleBufferRef = buffer;
          startTransportInternal(); // PAUSE/PLAY governs the loop from here
        } catch {
          if (token === sampleToken) samplePlaying = null;
        }
      })();
    },

    stopSample(): void {
      stopSampleInternal();
    },

    // --- transport + step sequencer (master clock) ---
    startTransport(): void {
      startTransportInternal();
    },
    pauseTransport(): void {
      pauseTransportInternal();
    },
    setBpm(next: number): void {
      bpm = Math.min(BPM_MAX, Math.max(BPM_MIN, Math.round(next)));
      if (drumDelay && ctx) drumDelay.delayTime.setTargetAtTime((60 / bpm) * 0.75, ctx.currentTime, 0.05);
    },
    getBpm(): number {
      return bpm;
    },
    getSequencer(): SequencerState {
      return cloneSeq(seqState);
    },
    setSequencer(seq: SequencerState): void {
      seqState = cloneSeq(seq);
      seqState.length = Math.max(1, Math.min(16, Math.round(seqState.length)));
      seqStepIdx %= seqState.length;
    },
    setSeqStep(index: number, step: SeqStep): void {
      if (index >= 0 && index < seqState.steps.length) seqState.steps[index] = { ...step };
    },
    setSeqEnabled(on: boolean): void {
      seqState.enabled = on;
      if (!on) {
        if (seqHeldMidi !== null) { engine.noteOff(seqHeldMidi); seqHeldMidi = null; }
        seqCurrent = null;
      }
    },

    startShowcase(): void {
      if (disposed || showcasePlaying || scBooting) return; // double-click: no-op
      stopDemoInternal();
      stopSampleInternal();
      if (micStream) return; // a live mic owns the room
      scBooting = true;
      showcasePlaying = true; // optimistic; rolled back if the boot aborts
      void (async () => {
        try {
          if (!(await ensureNoMicBoot()) || !showcasePlaying || !ctx) {
            showcasePlaying = false;
            return;
          }
          // start on the user's current patch; find where it sits in the
          // factory order so the auto-advance continues from there
          scPresetId = null;
          const cur = JSON.stringify(state);
          scPresetIdx = FACTORY_PRESETS.findIndex((p) => JSON.stringify(p.state) === cur);
          scStep = 0;
          scLoop = 0;
          startTransportInternal(); // showcase rides the master clock
        } finally {
          scBooting = false;
        }
      })();
    },

    stopShowcase(): void {
      stopShowcaseInternal();
    },

    getInputAnalyser: (): AnalyserNode | null => inputAnalyser,
    getOutputAnalyser: (): AnalyserNode | null => outputAnalyser,
    getInputTrack: (): MediaStreamTrack | null => micStream?.getAudioTracks()[0] ?? null,

    dropMic(): void {
      try { micSource?.disconnect(); } catch { /* noop */ }
      if (micStream) for (const t of micStream.getTracks()) t.stop();
      micStream = null;
      micSource = null;
      if (status === 'live') status = 'no-mic';
    },

    getPitch: (): PitchState => {
      // tracker idle? fall back to the last keyboard/MIDI note so the
      // visualizer readout always shows what you're playing
      if (pitchState.locked || keyboardMidi === null) return { ...pitchState };
      const nn = noteName(keyboardMidi);
      return {
        locked: false, freq: mtof(keyboardMidi), midi: keyboardMidi,
        noteName: nn.name, octave: nn.octave, cents: 0, confidence: 0,
        inputDb: -Infinity, gateOpen: false,
      };
    },

    getInfo(): EngineInfo {
      const sr = ctx?.sampleRate ?? 48000;
      const base = (ctx as AudioContext & { baseLatency?: number; outputLatency?: number } | null);
      const latencyMs = ctx
        ? (((base?.baseLatency ?? 128 / sr) + (base?.outputLatency ?? 128 / sr)) * 1000)
        : 6;
      return {
        status,
        sampleRate: sr,
        bufferSize: 128,
        latencyMs: Math.round(latencyMs * 10) / 10,
        recording,
        recordElapsedSec: recording ? (Date.now() - recStartWall) / 1000 : 0,
        outputPeakDb,
        micError,
        demoPlaying,
        showcasePlaying,
        showcasePresetId: scPresetId,
        samplePlaying,
        transportPlaying,
        transportStep: transportPlaying && seqState.enabled ? seqCurrent : null,
      };
    },

    getFollowerValue: (): number => followerVal,
    getModValues: (): Partial<Record<ModSourceId, number>> => ({ ...modValues }),

    startRecording(): void {
      if (!ctx || recording) return;
      recChunks = { dryL: [], dryR: [], mstL: [], mstR: [] };
      recording = true;
      recStartWall = Date.now();
      if (workletNode) workletNode.port.postMessage({ type: 'record', on: true });
    },

    async stopRecording(): Promise<RecordedTake> {
      takeCounter++;
      const id = uid();
      const name = `TAKE_${String(takeCounter).padStart(2, '0')}`;
      const createdAt = Date.now();
      if (!ctx || !recording || !recChunks) {
        recording = false;
        return { id, name, createdAt, durationSec: 0, sampleRate: TARGET_SR, channels: [new Float32Array(0), new Float32Array(0)], dryChannels: null };
      }
      recording = false;
      if (workletNode) {
        workletNode.port.postMessage({ type: 'record', on: false });
        // flush pending tail
        const flushed = new Promise<void>((resolve) => {
          recFlushWaiter = resolve;
          setTimeout(resolve, 400);
        });
        workletNode.port.postMessage({ type: 'flushRec' });
        await flushed;
      }
      const chunks = recChunks;
      recChunks = null;
      const sr = ctx.sampleRate;
      const mk = (list: Float32Array[]) => resampleTo48k(concatChunks(list), sr);
      const mstL = mk(chunks.mstL);
      const mstR = mk(chunks.mstR);
      const dryL = mk(chunks.dryL);
      const dryR = mk(chunks.dryR);
      const frames = Math.max(mstL.length, 1);
      const hasDry = dryL.length > frames * 0.5 && chunks.dryL.some((c) => c.some((v) => v !== 0));
      // pad to equal length
      const pad = (a: Float32Array) => {
        if (a.length >= frames) return a.slice(0, frames);
        const out = new Float32Array(frames);
        out.set(a);
        return out;
      };
      const chans = [pad(mstL), pad(mstR)];
      const dry = hasDry ? [pad(dryL), pad(dryR)] : null;
      // retain a decoded buffer for SEND-TO-SYNTH (startSample) so injecting
      // the take needs no re-decode: the dry mic stem when captured (the mic
      // sound itself), else the rendered take
      const srcChans = dry ?? chans;
      const buf = ctx.createBuffer(srcChans.length, frames, TARGET_SR);
      for (let ch = 0; ch < srcChans.length; ch++) {
        buf.getChannelData(ch).set(srcChans[ch]);
      }
      return {
        id,
        name,
        createdAt,
        durationSec: frames / TARGET_SR,
        sampleRate: TARGET_SR,
        channels: chans,
        dryChannels: dry,
        buffer: buf,
      };
    },

    async exportWav(take: RecordedTake, opts: WavExportOptions): Promise<WavExportResult> {
      return exportTakeWav(take, opts);
    },

    audition(take: RecordedTake, trimStartSec: number, trimEndSec: number): () => void {
      if (!ctx || !masterGain || take.channels.length === 0 || take.channels[0].length === 0) {
        return () => undefined;
      }
      const c = ctx;
      const sr = take.sampleRate || TARGET_SR;
      const total = take.channels[0].length;
      const s = clamp(Math.floor(trimStartSec * sr), 0, total);
      const e = clamp(Math.ceil(trimEndSec * sr), s + 1, total);
      const frames = e - s;
      const buf = c.createBuffer(2, frames, sr);
      for (let ch = 0; ch < 2; ch++) {
        const srcData = take.channels[Math.min(ch, take.channels.length - 1)];
        buf.getChannelData(ch).set(srcData.slice(s, e));
      }
      const src = c.createBufferSource();
      src.buffer = buf;
      src.connect(masterGain);
      src.start();
      let stopped = false;
      return () => {
        if (stopped) return;
        stopped = true;
        try { src.stop(); } catch { /* noop */ }
        try { src.disconnect(); } catch { /* noop */ }
      };
    },
  };

  return engine;
}
