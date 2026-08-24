/**
 * THE_MACHINE.EXE — Sound Engine
 *
 * Pure Web Audio API synthesis. No audio files. No samples.
 * Evokes: low vibrating analog electricity, mechanical tension, dark ambient pulse.
 *
 * Audio chain:
 *   [Sub Sine 38-55Hz] ─┐
 *   [Detuned Saw 70-110Hz] ─┤
 *   [Triangle 1 oct up] ─┤─► [LPF] ─► [Waveshaper] ─► [Compressor] ─► [Master Gain] ─► out
 *   [Pink Noise] ─────────┘
 *
 *   LFOs: pitch wobble (0.08-0.25Hz), tremolo (0.4-2.5Hz), filter sweep (0.03-0.12Hz)
 *   Heartbeat: slow sub-bass pulse via gain envelope
 */

export type MachineState = 'euphoria' | 'healthy' | 'functional' | 'mixed' | 'unhealthy' | 'panic';

interface StateParams {
  droneFreq: number;       // sub drone Hz
  sawDetune: number;       // cents
  pitchWobbleRate: number; // LFO Hz
  pitchWobbleDepth: number;// cents
  tremoloRate: number;     // Hz
  tremoloDepth: number;    // 0-1
  filterMin: number;       // Hz
  filterMax: number;       // Hz
  filterRate: number;      // Hz
  noiseGain: number;       // 0-1
  distortion: number;      // 0-400 curve amount
  heartbeatRate: number;   // beats per minute
  masterGain: number;      // 0-1
  panicTone: boolean;
}

const STATE_PARAMS: Record<MachineState, StateParams> = {
  euphoria: {
    droneFreq: 42, sawDetune: 3, pitchWobbleRate: 0.05, pitchWobbleDepth: 2,
    tremoloRate: 0.28, tremoloDepth: 0.05, filterMin: 220, filterMax: 550,
    filterRate: 0.025, noiseGain: 0.010, distortion: 8, heartbeatRate: 26,
    masterGain: 0.22, panicTone: false,
  },
  healthy: {
    droneFreq: 44, sawDetune: 5, pitchWobbleRate: 0.08, pitchWobbleDepth: 4,
    tremoloRate: 0.4, tremoloDepth: 0.08, filterMin: 180, filterMax: 480,
    filterRate: 0.032, noiseGain: 0.013, distortion: 14, heartbeatRate: 30,
    masterGain: 0.24, panicTone: false,
  },
  functional: {
    droneFreq: 46, sawDetune: 7, pitchWobbleRate: 0.10, pitchWobbleDepth: 6,
    tremoloRate: 0.55, tremoloDepth: 0.12, filterMin: 160, filterMax: 440,
    filterRate: 0.042, noiseGain: 0.016, distortion: 22, heartbeatRate: 34,
    masterGain: 0.26, panicTone: false,
  },
  mixed: {
    droneFreq: 48, sawDetune: 9, pitchWobbleRate: 0.13, pitchWobbleDepth: 8,
    tremoloRate: 0.75, tremoloDepth: 0.16, filterMin: 140, filterMax: 400,
    filterRate: 0.055, noiseGain: 0.020, distortion: 35, heartbeatRate: 38,
    masterGain: 0.28, panicTone: false,
  },
  unhealthy: {
    droneFreq: 50, sawDetune: 13, pitchWobbleRate: 0.17, pitchWobbleDepth: 11,
    tremoloRate: 1.1, tremoloDepth: 0.22, filterMin: 120, filterMax: 360,
    filterRate: 0.07, noiseGain: 0.026, distortion: 55, heartbeatRate: 46,
    masterGain: 0.30, panicTone: false,
  },
  panic: {
    droneFreq: 52, sawDetune: 17, pitchWobbleRate: 0.22, pitchWobbleDepth: 15,
    tremoloRate: 1.8, tremoloDepth: 0.32, filterMin: 100, filterMax: 700,
    filterRate: 0.09, noiseGain: 0.034, distortion: 90, heartbeatRate: 58,
    masterGain: 0.32, panicTone: true,
  },
};

// Map health score (0-100) to MachineState
export function scoreToState(score: number): MachineState {
  if (score >= 85) return 'euphoria';
  if (score >= 70) return 'healthy';
  if (score >= 55) return 'functional';
  if (score >= 40) return 'mixed';
  if (score >= 25) return 'unhealthy';
  return 'panic';
}

// ── Distortion curve ─────────────────────────────────────────────────────────
function makeDistortionCurve(amount: number): Float32Array {
  const samples = 256;
  const curve = new Float32Array(samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

// ── Pink noise generator ─────────────────────────────────────────────────────
function createPinkNoiseNode(ctx: AudioContext): ScriptProcessorNode {
  const bufferSize = 4096;
  const node = ctx.createScriptProcessor(bufferSize, 1, 1);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  node.onaudioprocess = (e) => {
    const output = e.outputBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  };
  return node;
}

// ── Main Engine ──────────────────────────────────────────────────────────────
export class MachineSoundEngine {
  private ctx: AudioContext | null = null;
  private running = false;
  private muted = true; // OFF by default — user opts in via the Machine audio toggle (persisted)
  private volume = 0.3; // 0-1, user-controlled — start low so the drone is gentle on enable
  private currentState: MachineState = 'functional';
  private currentParams: StateParams = STATE_PARAMS.functional;

  // Nodes
  private masterGain: GainNode | null = null;
  private fadeGain: GainNode | null = null;
  private volumeGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  // Oscillators
  private subOsc: OscillatorNode | null = null;
  private sawOsc: OscillatorNode | null = null;
  private triOsc: OscillatorNode | null = null;

  // Gains
  private subGain: GainNode | null = null;
  private sawGain: GainNode | null = null;
  private triGain: GainNode | null = null;
  private noiseGainNode: GainNode | null = null;
  private tremoloGain: GainNode | null = null;

  // LFOs
  private pitchLFO: OscillatorNode | null = null;
  private tremoloLFO: OscillatorNode | null = null;
  private filterLFO: OscillatorNode | null = null;
  private pitchLFOGain: GainNode | null = null;
  private tremoloLFOGain: GainNode | null = null;
  private filterLFOGain: GainNode | null = null;

  // Filter + FX
  private lpFilter: BiquadFilterNode | null = null;
  private waveshaper: WaveShaperNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;

  // Heartbeat
  private heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatGain: GainNode | null = null;
  private heartbeatOsc: OscillatorNode | null = null;

  // Panic tone
  private panicOsc: OscillatorNode | null = null;
  private panicGain: GainNode | null = null;
  private panicTimer: ReturnType<typeof setTimeout> | null = null;

  // Transition
  private transitionTimer: ReturnType<typeof setTimeout> | null = null;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return this.ctx;
  }

  start(fadeSeconds = 3.0) {
    if (this.running) return;
    const ctx = this.getCtx();
    if (ctx.state === 'suspended') ctx.resume();
    this.running = true;
    this._build();
    if (!this.muted) this._fadeIn(fadeSeconds);
  }

  // Toggle the background Machine synth with a smooth 500ms fade (persisted by caller)
  enable() {
    this.muted = false;
    if (!this.running) { this.start(0.5); return; }
    if (this.ctx?.state === 'suspended') this.ctx.resume();
    this._fadeIn(0.5);
  }

  disable() {
    this.muted = true;
    if (this.fadeGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.fadeGain.gain.cancelScheduledValues(now);
      this.fadeGain.gain.setValueAtTime(this.fadeGain.gain.value, now);
      this.fadeGain.gain.linearRampToValueAtTime(0, now + 0.5);
    }
  }

  stop() {
    if (!this.running) return;
    this._fadeOut(() => this._teardown());
    this.running = false;
  }

  mute() {
    this.muted = true;
    if (this.fadeGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.fadeGain.gain.cancelScheduledValues(now);
      this.fadeGain.gain.setTargetAtTime(0, now, 0.8);
    }
  }

  unmute() {
    this.muted = false;
    if (!this.running) { this.start(); return; }
    if (this.ctx?.state === 'suspended') this.ctx.resume();
    this._fadeIn();
  }

  isMuted() { return this.muted; }
  getAnalyser(): AnalyserNode | null { return this.analyser; }
  getVolume() { return this.volume; }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.volumeGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.volumeGain.gain.cancelScheduledValues(now);
      this.volumeGain.gain.setTargetAtTime(this.volume, now, 0.05);
    }
  }

  setIntensity(score: number) {
    const state = scoreToState(score);
    this.setMarketState(state);
  }

  setMarketState(state: MachineState) {
    if (state === this.currentState) return;
    this.currentState = state;
    this._transitionTo(STATE_PARAMS[state]);
  }

  private _build() {
    const ctx = this.getCtx();
    const p = this.currentParams;

    // Master chain
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = p.masterGain;
    this.fadeGain = ctx.createGain();
    this.fadeGain.gain.value = 0; // start silent
    this.volumeGain = ctx.createGain();
    this.volumeGain.gain.value = this.volume;

    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -18;
    this.compressor.knee.value = 12;
    this.compressor.ratio.value = 4;
    this.compressor.attack.value = 0.05;
    this.compressor.release.value = 0.4;

    this.waveshaper = ctx.createWaveShaper();
    this.waveshaper.curve = makeDistortionCurve(p.distortion);
    this.waveshaper.oversample = '2x';

    this.lpFilter = ctx.createBiquadFilter();
    this.lpFilter.type = 'lowpass';
    this.lpFilter.frequency.value = (p.filterMin + p.filterMax) / 2;
    this.lpFilter.Q.value = 1.8;

    // Tremolo gain (modulated by LFO)
    this.tremoloGain = ctx.createGain();
    this.tremoloGain.gain.value = 1;

    // Sub oscillator
    this.subOsc = ctx.createOscillator();
    this.subOsc.type = 'sine';
    this.subOsc.frequency.value = p.droneFreq;
    this.subGain = ctx.createGain();
    this.subGain.gain.value = 0.55;

    // Saw oscillator (detuned)
    this.sawOsc = ctx.createOscillator();
    this.sawOsc.type = 'sawtooth';
    this.sawOsc.frequency.value = p.droneFreq * 1.75;
    this.sawOsc.detune.value = p.sawDetune;
    this.sawGain = ctx.createGain();
    this.sawGain.gain.value = 0.18;

    // Triangle (one octave up)
    this.triOsc = ctx.createOscillator();
    this.triOsc.type = 'triangle';
    this.triOsc.frequency.value = p.droneFreq * 2;
    this.triGain = ctx.createGain();
    this.triGain.gain.value = 0.08;

    // Pink noise
    const noiseNode = createPinkNoiseNode(ctx);
    this.noiseFilter = ctx.createBiquadFilter();
    this.noiseFilter.type = 'lowpass';
    this.noiseFilter.frequency.value = 400;
    this.noiseFilter.Q.value = 0.5;
    this.noiseGainNode = ctx.createGain();
    this.noiseGainNode.gain.value = p.noiseGain;

    // LFO: pitch wobble → sub + saw frequency
    this.pitchLFO = ctx.createOscillator();
    this.pitchLFO.type = 'sine';
    this.pitchLFO.frequency.value = p.pitchWobbleRate;
    this.pitchLFOGain = ctx.createGain();
    this.pitchLFOGain.gain.value = p.pitchWobbleDepth;

    // LFO: tremolo → tremoloGain
    this.tremoloLFO = ctx.createOscillator();
    this.tremoloLFO.type = 'sine';
    this.tremoloLFO.frequency.value = p.tremoloRate;
    this.tremoloLFOGain = ctx.createGain();
    this.tremoloLFOGain.gain.value = p.tremoloDepth;

    // LFO: filter sweep → lpFilter frequency
    this.filterLFO = ctx.createOscillator();
    this.filterLFO.type = 'sine';
    this.filterLFO.frequency.value = p.filterRate;
    this.filterLFOGain = ctx.createGain();
    this.filterLFOGain.gain.value = (p.filterMax - p.filterMin) / 2;

    // Heartbeat gain
    this.heartbeatGain = ctx.createGain();
    this.heartbeatGain.gain.value = 0;

    // ── Connections ──────────────────────────────────────────────────────────
    // Pitch LFO → sub + saw detune
    this.pitchLFO.connect(this.pitchLFOGain);
    this.pitchLFOGain.connect(this.subOsc.detune);
    this.pitchLFOGain.connect(this.sawOsc.detune);

    // Tremolo LFO → tremoloGain.gain
    this.tremoloLFO.connect(this.tremoloLFOGain);
    this.tremoloLFOGain.connect(this.tremoloGain.gain);

    // Filter LFO → lpFilter frequency
    this.filterLFO.connect(this.filterLFOGain);
    this.filterLFOGain.connect(this.lpFilter.frequency);

    // Audio sources → filter → tremolo → waveshaper → compressor → master → fade → out
    this.subOsc.connect(this.subGain);
    this.sawOsc.connect(this.sawGain);
    this.triOsc.connect(this.triGain);
    noiseNode.connect(this.noiseFilter);
    this.noiseFilter.connect(this.noiseGainNode);

    this.subGain.connect(this.lpFilter);
    this.sawGain.connect(this.lpFilter);
    this.triGain.connect(this.lpFilter);
    this.noiseGainNode.connect(this.lpFilter);

    this.lpFilter.connect(this.tremoloGain);
    this.tremoloGain.connect(this.waveshaper);
    this.waveshaper.connect(this.compressor);
    this.compressor.connect(this.masterGain);
    // Analyser — tapped after volumeGain for waveform visualisation
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.85;

    this.masterGain.connect(this.volumeGain);
    this.volumeGain.connect(this.analyser);
    this.analyser.connect(this.fadeGain);
    this.fadeGain.connect(ctx.destination);

    // Heartbeat sub pulse
    this.heartbeatOsc = ctx.createOscillator();
    this.heartbeatOsc.type = 'sine';
    this.heartbeatOsc.frequency.value = 32;
    this.heartbeatOsc.connect(this.heartbeatGain);
    this.heartbeatGain.connect(this.masterGain);

    // Start all oscillators and LFOs
    const now = ctx.currentTime;
    this.subOsc.start(now);
    this.sawOsc.start(now);
    this.triOsc.start(now);
    this.pitchLFO.start(now);
    this.tremoloLFO.start(now);
    this.filterLFO.start(now);
    this.heartbeatOsc.start(now);

    // Start heartbeat rhythm
    this._scheduleHeartbeat();
  }

  private _scheduleHeartbeat() {
    if (!this.running || !this.ctx || !this.heartbeatGain) return;
    const ctx = this.ctx;
    const p = this.currentParams;
    const bpm = p.heartbeatRate;
    const interval = (60 / bpm) * 1000;

    const pulse = () => {
      if (!this.running || !this.heartbeatGain || !ctx) return;
      const now = ctx.currentTime;
      const g = this.heartbeatGain.gain;
      // Double-thump: lub-dub
      g.cancelScheduledValues(now);
      g.setValueAtTime(0, now);
      g.linearRampToValueAtTime(0.35, now + 0.04);
      g.exponentialRampToValueAtTime(0.001, now + 0.18);
      // Second thump
      g.setValueAtTime(0, now + 0.22);
      g.linearRampToValueAtTime(0.18, now + 0.26);
      g.exponentialRampToValueAtTime(0.001, now + 0.38);

      this.heartbeatTimer = setTimeout(pulse, interval);
    };
    pulse();
  }

  private _fadeIn(seconds = 3.0) {
    if (!this.fadeGain || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.fadeGain.gain.cancelScheduledValues(now);
    this.fadeGain.gain.setValueAtTime(this.fadeGain.gain.value, now);
    this.fadeGain.gain.linearRampToValueAtTime(1, now + seconds);
  }

  private _fadeOut(cb?: () => void) {
    if (!this.fadeGain || !this.ctx) { cb?.(); return; }
    const now = this.ctx.currentTime;
    this.fadeGain.gain.cancelScheduledValues(now);
    this.fadeGain.gain.setValueAtTime(this.fadeGain.gain.value, now);
    this.fadeGain.gain.linearRampToValueAtTime(0, now + 2.0);
    setTimeout(() => cb?.(), 2200);
  }

  private _teardown() {
    if (this.heartbeatTimer) clearTimeout(this.heartbeatTimer);
    if (this.panicTimer) clearTimeout(this.panicTimer);
    if (this.transitionTimer) clearTimeout(this.transitionTimer);
    try { this.volumeGain?.disconnect(); } catch {}
    [this.subOsc, this.sawOsc, this.triOsc, this.pitchLFO, this.tremoloLFO,
     this.filterLFO, this.heartbeatOsc, this.panicOsc].forEach(n => {
      try { n?.stop(); n?.disconnect(); } catch {}
    });
    this.ctx = null;
    this.running = false;
  }

  private _transitionTo(p: StateParams) {
    if (!this.ctx || !this.running) { this.currentParams = p; return; }
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const T = 4.0; // transition time in seconds

    const ramp = (param: AudioParam, value: number) => {
      param.cancelScheduledValues(now);
      param.setValueAtTime(param.value, now);
      param.linearRampToValueAtTime(value, now + T);
    };

    if (this.subOsc) ramp(this.subOsc.frequency, p.droneFreq);
    if (this.sawOsc) {
      ramp(this.sawOsc.frequency, p.droneFreq * 1.75);
      ramp(this.sawOsc.detune, p.sawDetune);
    }
    if (this.triOsc) ramp(this.triOsc.frequency, p.droneFreq * 2);
    if (this.pitchLFO) ramp(this.pitchLFO.frequency, p.pitchWobbleRate);
    if (this.pitchLFOGain) ramp(this.pitchLFOGain.gain, p.pitchWobbleDepth);
    if (this.tremoloLFO) ramp(this.tremoloLFO.frequency, p.tremoloRate);
    if (this.tremoloLFOGain) ramp(this.tremoloLFOGain.gain, p.tremoloDepth);
    if (this.filterLFO) ramp(this.filterLFO.frequency, p.filterRate);
    if (this.filterLFOGain) ramp(this.filterLFOGain.gain, (p.filterMax - p.filterMin) / 2);
    if (this.lpFilter) ramp(this.lpFilter.frequency, (p.filterMin + p.filterMax) / 2);
    if (this.noiseGainNode) ramp(this.noiseGainNode.gain, p.noiseGain);
    if (this.masterGain) ramp(this.masterGain.gain, p.masterGain);

    // Update distortion curve
    if (this.waveshaper) {
      setTimeout(() => {
        if (this.waveshaper) this.waveshaper.curve = makeDistortionCurve(p.distortion);
      }, T * 500);
    }

    // Restart heartbeat at new rate
    if (this.heartbeatTimer) clearTimeout(this.heartbeatTimer);
    this.transitionTimer = setTimeout(() => this._scheduleHeartbeat(), T * 1000);

    // Panic tone: brief warning oscillator
    if (p.panicTone && !this.panicOsc) {
      this._triggerPanicTone();
    } else if (!p.panicTone && this.panicOsc) {
      try { this.panicOsc.stop(); this.panicOsc.disconnect(); } catch {}
      this.panicOsc = null;
    }

    this.currentParams = p;
  }

  private _triggerPanicTone() {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    this.panicGain = ctx.createGain();
    this.panicGain.gain.setValueAtTime(0, now);
    this.panicGain.gain.linearRampToValueAtTime(0.04, now + 1.5);
    this.panicGain.gain.setTargetAtTime(0, now + 8, 3);

    this.panicOsc = ctx.createOscillator();
    this.panicOsc.type = 'sawtooth';
    this.panicOsc.frequency.value = 110;

    const panicFilter = ctx.createBiquadFilter();
    panicFilter.type = 'bandpass';
    panicFilter.frequency.value = 110;
    panicFilter.Q.value = 8;

    this.panicOsc.connect(panicFilter);
    panicFilter.connect(this.panicGain);
    this.panicGain.connect(this.masterGain);
    this.panicOsc.start(now);

    this.panicTimer = setTimeout(() => {
      if (this.panicOsc) {
        try { this.panicOsc.stop(); this.panicOsc.disconnect(); } catch {}
        this.panicOsc = null;
      }
    }, 12000);
  }
}

// Singleton
let _engine: MachineSoundEngine | null = null;
export function getMachineSoundEngine(): MachineSoundEngine {
  if (!_engine) _engine = new MachineSoundEngine();
  return _engine;
}
