// ORB Audio Engine — Seven Deadly Sins Sound Identity System
// Each sin has a dramatically different sonic world
// References: Vangelis, Blade Runner, Tangerine Dream, Boards of Canada, Aphex ambient
// Philosophy: analog instability, continuous evolution, never loops, always alive

export type AudioMode =
  | 'pride'    // celestial pads, shimmering harmonics — wealthy cosmic confidence
  | 'greed'    // nervous arpeggiation, metallic pulse — always wanting more
  | 'lust'     // sensual pads, breath textures — intimate and hypnotic
  | 'wrath'    // distorted brass, dirty bass — dangerous and beautiful
  | 'gluttony' // layered thick textures, lush saturation — heavy and indulgent
  | 'envy'     // sharp shimmering, tonal movement — watchful and twitchy
  | 'sloth'    // slow drones, tape stretch — half asleep analog
  | 'unknown'; // strange, undefined

// Each mode defines the target parameters for the continuous engine
interface SinTarget {
  // Fundamental drone
  droneFreq: number;
  droneType: OscillatorType;
  droneGain: number;
  // Sub bass
  subFreq: number;
  subGain: number;
  // Second oscillator (character layer)
  char1Freq: number;
  char1Type: OscillatorType;
  char1Gain: number;
  // Third oscillator (texture)
  char2Freq: number;
  char2Type: OscillatorType;
  char2Gain: number;
  // LFO for pitch modulation (analog instability)
  lfoFreq: number;
  lfoDepth: number;
  // Second LFO for filter breathing
  lfo2Freq: number;
  lfo2Depth: number;
  // Filter
  filterFreq: number;
  filterQ: number;
  filterType: BiquadFilterType;
  // Reverb
  reverbMix: number;
  // Master level
  masterLevel: number;
  // Rotation layer
  rotSpeed: number;
  rotDepth: number;
}

const SINS: Record<AudioMode, SinTarget> = {

  // PRIDE — celestial analog synth, shimmering harmonics, choir-like pads
  // Slow, sophisticated, wealthy cosmic confidence
  pride: {
    droneFreq: 146.8, droneType: 'sine', droneGain: 0.28,  // D3 — regal root
    subFreq: 73.4, subGain: 0.12,
    char1Freq: 220.0, char1Type: 'sine', char1Gain: 0.18,   // A3 — celestial fifth
    char2Freq: 293.7, char2Type: 'triangle', char2Gain: 0.10, // D4 — upper octave
    lfoFreq: 0.08, lfoDepth: 3,    // very slow pitch drift
    lfo2Freq: 0.05, lfo2Depth: 80, // slow filter breathing
    filterFreq: 1800, filterQ: 0.8, filterType: 'lowpass',
    reverbMix: 0.58, masterLevel: 1.0,
    rotSpeed: 0.10, rotDepth: 0.15,
  },

  // GREED — nervous modular arpeggiation, metallic texture, greedy pulsing bass
  // Slightly obsessive, always wanting more
  greed: {
    droneFreq: 82.4, droneType: 'sawtooth', droneGain: 0.22, // E2 — tense root
    subFreq: 41.2, subGain: 0.20,
    char1Freq: 164.8, char1Type: 'square', char1Gain: 0.14,  // E3 — metallic octave
    char2Freq: 246.9, char2Type: 'sawtooth', char2Gain: 0.08, // B3 — nervous fifth
    lfoFreq: 0.65, lfoDepth: 12,   // faster, restless modulation
    lfo2Freq: 0.80, lfo2Depth: 200, // filter pumping
    filterFreq: 600, filterQ: 3.5, filterType: 'bandpass',
    reverbMix: 0.28, masterLevel: 1.0,
    rotSpeed: 0.55, rotDepth: 0.35,
  },

  // LUST — sensual analog pads, breath-like textures, slow pitch bending
  // Intimate, hypnotic, warm
  lust: {
    droneFreq: 123.5, droneType: 'sine', droneGain: 0.30,  // B2 — warm, intimate
    subFreq: 61.7, subGain: 0.16,
    char1Freq: 185.0, char1Type: 'sine', char1Gain: 0.20,  // F#3 — sensual third
    char2Freq: 247.0, char2Type: 'triangle', char2Gain: 0.12, // B3 — breath harmonic
    lfoFreq: 0.12, lfoDepth: 8,    // slow seductive pitch movement
    lfo2Freq: 0.08, lfo2Depth: 120, // gentle filter swell
    filterFreq: 900, filterQ: 1.2, filterType: 'lowpass',
    reverbMix: 0.52, masterLevel: 1.0,
    rotSpeed: 0.15, rotDepth: 0.20,
  },

  // WRATH — distorted analog brass, dirty bass, unstable pressure
  // Big, dangerous, beautiful — sci-fi warning system
  wrath: {
    droneFreq: 55.0, droneType: 'sawtooth', droneGain: 0.38,  // A1 — heavy, dangerous
    subFreq: 27.5, subGain: 0.32,
    char1Freq: 110.0, char1Type: 'sawtooth', char1Gain: 0.22, // A2 — brass octave
    char2Freq: 164.8, char2Type: 'square', char2Gain: 0.14,   // E3 — horn fifth
    lfoFreq: 0.90, lfoDepth: 18,   // agitated instability
    lfo2Freq: 1.20, lfo2Depth: 300, // aggressive filter movement
    filterFreq: 380, filterQ: 4.0, filterType: 'lowpass',
    reverbMix: 0.35, masterLevel: 1.0,
    rotSpeed: 0.80, rotDepth: 0.45,
  },

  // GLUTTONY — layered thick textures, too many harmonics, lush saturation
  // Heavy, indulgent, constantly growing
  gluttony: {
    droneFreq: 98.0, droneType: 'sawtooth', droneGain: 0.32,  // G2 — rich, heavy
    subFreq: 49.0, subGain: 0.25,
    char1Freq: 196.0, char1Type: 'sawtooth', char1Gain: 0.20, // G3 — thick octave
    char2Freq: 294.0, char2Type: 'triangle', char2Gain: 0.16, // D4 — indulgent fifth
    lfoFreq: 0.35, lfoDepth: 10,   // medium modulation, always growing
    lfo2Freq: 0.22, lfo2Depth: 180, // slow filter saturation
    filterFreq: 750, filterQ: 2.0, filterType: 'lowpass',
    reverbMix: 0.45, masterLevel: 1.0,
    rotSpeed: 0.40, rotDepth: 0.30,
  },

  // ENVY — sharp shimmering synths, tonal movement, curious melodic fragments
  // Watchful, slightly twitchy
  envy: {
    droneFreq: 174.6, droneType: 'triangle', droneGain: 0.20, // F3 — questioning tone
    subFreq: 87.3, subGain: 0.10,
    char1Freq: 261.6, char1Type: 'sine', char1Gain: 0.18,     // C4 — observant shimmer
    char2Freq: 392.0, char2Type: 'triangle', char2Gain: 0.12, // G4 — sharp curiosity
    lfoFreq: 0.45, lfoDepth: 15,   // twitchy, restless
    lfo2Freq: 0.55, lfo2Depth: 250, // sharp filter movement
    filterFreq: 2200, filterQ: 2.5, filterType: 'bandpass',
    reverbMix: 0.40, masterLevel: 1.0,
    rotSpeed: 0.45, rotDepth: 0.28,
  },

  // SLOTH — slow evolving drones, tape-stretched ambience, sleepy harmonic drift
  // Lazy but beautiful, half asleep analog synths
  sloth: {
    droneFreq: 65.4, droneType: 'sine', droneGain: 0.25,   // C2 — deep, sleepy
    subFreq: 32.7, subGain: 0.18,
    char1Freq: 98.0, char1Type: 'sine', char1Gain: 0.14,   // G2 — warm low hum
    char2Freq: 130.8, char2Type: 'triangle', char2Gain: 0.08, // C3 — sleepy harmonic
    lfoFreq: 0.04, lfoDepth: 4,    // extremely slow drift
    lfo2Freq: 0.03, lfo2Depth: 60, // barely breathing filter
    filterFreq: 400, filterQ: 0.7, filterType: 'lowpass',
    reverbMix: 0.65, masterLevel: 0.85,
    rotSpeed: 0.06, rotDepth: 0.08,
  },

  // UNKNOWN — strange, undefined, wrong frequencies
  unknown: {
    droneFreq: 174.6, droneType: 'sawtooth', droneGain: 0.24, // F3 — strange
    subFreq: 87.3, subGain: 0.18,
    char1Freq: 233.1, char1Type: 'square', char1Gain: 0.16,   // Bb3 — dissonant
    char2Freq: 311.1, char2Type: 'sawtooth', char2Gain: 0.10, // Eb4 — wrong
    lfoFreq: 0.07, lfoDepth: 28,   // deep unpredictable wobble
    lfo2Freq: 0.11, lfo2Depth: 350, // strange filter movement
    filterFreq: 950, filterQ: 3.2, filterType: 'bandpass',
    reverbMix: 0.60, masterLevel: 1.0,
    rotSpeed: 0.35, rotDepth: 0.42,
  },
};

export class OrbAudio {
  private ctx: AudioContext | null = null;
  private initialized = false;
  private currentMode: AudioMode = 'pride';

  // Persistent oscillators — NEVER stop
  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private subGain: GainNode | null = null;
  private char1Osc: OscillatorNode | null = null;
  private char1Gain: GainNode | null = null;
  private char2Osc: OscillatorNode | null = null;
  private char2Gain: GainNode | null = null;

  // LFOs — pitch and filter modulation
  private lfo1: OscillatorNode | null = null;
  private lfo1Gain: GainNode | null = null;
  private lfo2: OscillatorNode | null = null;
  private lfo2Gain: GainNode | null = null;

  // Analog instability oscillators — random micro-drift
  private driftOsc1: OscillatorNode | null = null;
  private driftGain1: GainNode | null = null;
  private driftOsc2: OscillatorNode | null = null;
  private driftGain2: GainNode | null = null;

  // Signal chain
  private filter: BiquadFilterNode | null = null;
  private masterGain: GainNode | null = null;
  private reverb: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  private dryGain: GainNode | null = null;

  // Rotation layer — stereo spinning
  private rotLfo: OscillatorNode | null = null;
  private rotLfoGain: GainNode | null = null;
  private rotPanner: StereoPannerNode | null = null;
  private rotOsc: OscillatorNode | null = null;
  private rotOscGain: GainNode | null = null;

  // DRIFT — tape echo system
  private driftEnabled = false;
  private driftDelay: DelayNode | null = null;
  private driftFeedback: GainNode | null = null;
  private driftWet: GainNode | null = null;
  private driftDry: GainNode | null = null;
  private driftFilter: BiquadFilterNode | null = null;
  private driftWowLfo: OscillatorNode | null = null;
  private driftWowGain: GainNode | null = null;
  private driftSaturation: WaveShaperNode | null = null;
  private driftPanner: StereoPannerNode | null = null;
  private driftPanLfo: OscillatorNode | null = null;
  private driftPanGain: GainNode | null = null;

  // Smooth morph
  private morphInterval: ReturnType<typeof setInterval> | null = null;
  private current: SinTarget = { ...SINS.pride };
  private target: SinTarget = { ...SINS.pride };

  private readonly BASE_VOLUME = 0.18;

  async init() {
    if (this.initialized) return;
    this.initialized = true;

    // Safari iOS: webkitAudioContext fallback
    const AC = (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    this.ctx = new AC();
    console.log('[audio] context created, state:', this.ctx.state);

    // iOS-safe unlock: play silent buffer + resume in gesture stack
    console.log('[audio] context state before resume:', this.ctx.state);
    if (this.ctx.state !== 'running') {
      try {
        const buf = this.ctx.createBuffer(1, 1, 22050);
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        src.connect(this.ctx.destination);
        src.start(0);
        console.log('[audio] iOS unlock silent buffer played');
      } catch {}
      try { await this.ctx.resume(); } catch {}
    }
    console.log('[audio] context state after resume:', this.ctx.state);
    if (this.ctx.state === 'running') console.log('[audio] iOS unlock success');
    const ctx = this.ctx;

    // Master
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0, ctx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(this.BASE_VOLUME, ctx.currentTime + 2.0);
    this.masterGain.connect(ctx.destination);

    // Reverb
    this.reverb = this.buildReverb(ctx, 6.0);
    this.reverbGain = ctx.createGain();
    this.reverbGain.gain.value = 0.45;
    this.reverb.connect(this.reverbGain);
    this.reverbGain.connect(this.masterGain);

    // Dry path
    this.dryGain = ctx.createGain();
    this.dryGain.gain.value = 0.55;
    this.dryGain.connect(this.masterGain);

    // Filter
    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 1800;
    this.filter.Q.value = 0.8;
    this.filter.connect(this.dryGain);
    this.filter.connect(this.reverb);

    // LFO 1 — pitch modulation (analog instability)
    this.lfo1 = ctx.createOscillator();
    this.lfo1.type = 'sine';
    this.lfo1.frequency.value = 0.08;
    this.lfo1Gain = ctx.createGain();
    this.lfo1Gain.gain.value = 3;
    this.lfo1.connect(this.lfo1Gain);
    this.lfo1.start();

    // LFO 2 — filter breathing
    this.lfo2 = ctx.createOscillator();
    this.lfo2.type = 'sine';
    this.lfo2.frequency.value = 0.05;
    this.lfo2Gain = ctx.createGain();
    this.lfo2Gain.gain.value = 80;
    this.lfo2.connect(this.lfo2Gain);
    this.lfo2Gain.connect(this.filter.frequency);
    this.lfo2.start();

    // Analog drift oscillators — random micro-tuning instability
    this.driftOsc1 = ctx.createOscillator();
    this.driftOsc1.type = 'sine';
    this.driftOsc1.frequency.value = 0.031; // irrational frequency for no looping
    this.driftGain1 = ctx.createGain();
    this.driftGain1.gain.value = 1.5;
    this.driftOsc1.connect(this.driftGain1);
    this.driftOsc1.start();

    this.driftOsc2 = ctx.createOscillator();
    this.driftOsc2.type = 'sine';
    this.driftOsc2.frequency.value = 0.047; // different irrational for beating
    this.driftGain2 = ctx.createGain();
    this.driftGain2.gain.value = 0.8;
    this.driftOsc2.connect(this.driftGain2);
    this.driftOsc2.start();

    // Drone oscillator — fundamental
    this.droneOsc = ctx.createOscillator();
    this.droneOsc.type = 'sine';
    this.droneOsc.frequency.value = 146.8;
    this.lfo1Gain.connect(this.droneOsc.frequency);
    this.driftGain1.connect(this.droneOsc.frequency);
    this.droneGain = ctx.createGain();
    this.droneGain.gain.value = 0.28;
    this.droneOsc.connect(this.droneGain);
    this.droneGain.connect(this.filter);
    this.droneOsc.start();

    // Sub oscillator
    this.subOsc = ctx.createOscillator();
    this.subOsc.type = 'sine';
    this.subOsc.frequency.value = 73.4;
    this.driftGain2.connect(this.subOsc.frequency); // subtle sub drift
    this.subGain = ctx.createGain();
    this.subGain.gain.value = 0.12;
    this.subOsc.connect(this.subGain);
    this.subGain.connect(this.masterGain);
    this.subOsc.start();

    // Character oscillator 1
    this.char1Osc = ctx.createOscillator();
    this.char1Osc.type = 'sine';
    this.char1Osc.frequency.value = 220.0;
    this.lfo1Gain.connect(this.char1Osc.frequency);
    this.char1Gain = ctx.createGain();
    this.char1Gain.gain.value = 0.18;
    this.char1Osc.connect(this.char1Gain);
    this.char1Gain.connect(this.filter);
    this.char1Osc.start();

    // Character oscillator 2
    this.char2Osc = ctx.createOscillator();
    this.char2Osc.type = 'triangle';
    this.char2Osc.frequency.value = 293.7;
    this.char2Gain = ctx.createGain();
    this.char2Gain.gain.value = 0.10;
    this.char2Osc.connect(this.char2Gain);
    this.char2Gain.connect(this.filter);
    this.char2Osc.start();

    // Rotation layer
    this.rotLfo = ctx.createOscillator();
    this.rotLfo.type = 'sine';
    this.rotLfo.frequency.value = 0.10;
    this.rotPanner = ctx.createStereoPanner();
    this.rotLfoGain = ctx.createGain();
    this.rotLfoGain.gain.value = 0.15;
    this.rotLfo.connect(this.rotLfoGain);
    this.rotLfoGain.connect(this.rotPanner.pan);
    this.rotLfo.start();

    this.rotOsc = ctx.createOscillator();
    this.rotOsc.type = 'sine';
    this.rotOsc.frequency.value = 220.0;
    this.rotOscGain = ctx.createGain();
    this.rotOscGain.gain.value = 0.06;
    this.rotOsc.connect(this.rotOscGain);
    this.rotOscGain.connect(this.rotPanner);
    this.rotPanner.connect(this.reverb!);
    this.rotPanner.connect(this.dryGain!);
    this.rotOsc.start();

    // ---- DRIFT TAPE ECHO SYSTEM ----
    // Built as a parallel wet/dry path — starts at 0 wet (off)
    // All nodes created at init so there's no click when enabling

    // Wow/flutter LFO — tape speed instability
    this.driftWowLfo = ctx.createOscillator();
    this.driftWowLfo.type = 'sine';
    this.driftWowLfo.frequency.value = 0.7; // ~0.7Hz wow
    this.driftWowGain = ctx.createGain();
    this.driftWowGain.gain.value = 0; // starts silent
    this.driftWowLfo.connect(this.driftWowGain);
    this.driftWowLfo.start();

    // Stereo pan LFO — slow stereo widening
    this.driftPanLfo = ctx.createOscillator();
    this.driftPanLfo.type = 'sine';
    this.driftPanLfo.frequency.value = 0.13;
    this.driftPanGain = ctx.createGain();
    this.driftPanGain.gain.value = 0;
    this.driftPanLfo.connect(this.driftPanGain);
    this.driftPanLfo.start();

    // Delay line — tape echo
    this.driftDelay = ctx.createDelay(3.0);
    this.driftDelay.delayTime.value = 0.38; // ~380ms — cinematic
    this.driftWowGain.connect(this.driftDelay.delayTime); // wow modulates delay time

    // Feedback loop — evolving repeats
    this.driftFeedback = ctx.createGain();
    this.driftFeedback.gain.value = 0.42; // 42% feedback — long but not infinite

    // Tape filter — high-frequency rolloff (tape degradation)
    this.driftFilter = ctx.createBiquadFilter();
    this.driftFilter.type = 'lowpass';
    this.driftFilter.frequency.value = 3200;
    this.driftFilter.Q.value = 0.5;

    // Soft saturation — tape warmth
    this.driftSaturation = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = (Math.PI + 180) * x / (Math.PI + 180 * Math.abs(x)); // soft clip
    }
    this.driftSaturation.curve = curve;

    // Stereo panner for drift
    this.driftPanner = ctx.createStereoPanner();
    this.driftPanner.pan.value = 0;
    this.driftPanGain.connect(this.driftPanner.pan);

    // Wet gain — controls how much drift is heard (0 = off, 1 = full)
    this.driftWet = ctx.createGain();
    this.driftWet.gain.value = 0; // starts off

    // Dry gain — 1 when drift off, slightly reduced when on
    this.driftDry = ctx.createGain();
    this.driftDry.gain.value = 1;

    // Signal routing:
    // filter -> driftDry -> masterGain (dry path, always on)
    // filter -> driftDelay -> driftFilter -> driftSaturation -> driftFeedback -> driftDelay (feedback loop)
    //        -> driftSaturation -> driftPanner -> driftWet -> masterGain (wet path)
    this.filter!.connect(this.driftDry);
    this.driftDry.connect(this.masterGain!);

    this.filter!.connect(this.driftDelay);
    this.driftDelay.connect(this.driftFilter);
    this.driftFilter.connect(this.driftSaturation);
    this.driftSaturation.connect(this.driftFeedback);
    this.driftFeedback.connect(this.driftDelay); // feedback loop
    this.driftSaturation.connect(this.driftPanner);
    this.driftPanner.connect(this.driftWet);
    this.driftWet.connect(this.masterGain!);

    // Start morph loop
    this.startMorphLoop();
  }

  private buildReverb(ctx: AudioContext, duration: number): ConvolverNode {
    const conv = ctx.createConvolver();
    const len = ctx.sampleRate * duration;
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.0);
      }
    }
    conv.buffer = buf;
    return conv;
  }

  private startMorphLoop() {
    if (this.morphInterval) clearInterval(this.morphInterval);
    this.morphInterval = setInterval(() => {
      if (!this.ctx || !this.initialized) return;
      this.lerpParams(0.04);
      this.applyParams();
    }, 40);
  }

  private lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

  private lerpParams(t: number) {
    const c = this.current, tgt = this.target;
    c.droneFreq = this.lerp(c.droneFreq, tgt.droneFreq, t);
    c.droneGain = this.lerp(c.droneGain, tgt.droneGain, t);
    c.subFreq = this.lerp(c.subFreq, tgt.subFreq, t);
    c.subGain = this.lerp(c.subGain, tgt.subGain, t);
    c.char1Freq = this.lerp(c.char1Freq, tgt.char1Freq, t);
    c.char1Gain = this.lerp(c.char1Gain, tgt.char1Gain, t);
    c.char2Freq = this.lerp(c.char2Freq, tgt.char2Freq, t);
    c.char2Gain = this.lerp(c.char2Gain, tgt.char2Gain, t);
    c.lfoFreq = this.lerp(c.lfoFreq, tgt.lfoFreq, t * 0.3);
    c.lfoDepth = this.lerp(c.lfoDepth, tgt.lfoDepth, t * 0.3);
    c.lfo2Freq = this.lerp(c.lfo2Freq, tgt.lfo2Freq, t * 0.3);
    c.lfo2Depth = this.lerp(c.lfo2Depth, tgt.lfo2Depth, t * 0.3);
    c.filterFreq = this.lerp(c.filterFreq, tgt.filterFreq, t * 0.5);
    c.filterQ = this.lerp(c.filterQ, tgt.filterQ, t * 0.5);
    c.reverbMix = this.lerp(c.reverbMix, tgt.reverbMix, t);
    c.masterLevel = this.lerp(c.masterLevel, tgt.masterLevel, t);
    c.rotSpeed = this.lerp(c.rotSpeed, tgt.rotSpeed, t * 0.3);
    c.rotDepth = this.lerp(c.rotDepth, tgt.rotDepth, t * 0.3);
  }

  private applyParams() {
    if (!this.ctx) return;
    const p = this.current;
    const now = this.ctx.currentTime;
    const s = 0.08;

    this.droneOsc!.frequency.setTargetAtTime(p.droneFreq, now, s);
    this.droneGain!.gain.setTargetAtTime(p.droneGain, now, s);
    this.subOsc!.frequency.setTargetAtTime(p.subFreq, now, s);
    this.subGain!.gain.setTargetAtTime(p.subGain, now, s);
    this.char1Osc!.frequency.setTargetAtTime(p.char1Freq, now, s);
    this.char1Gain!.gain.setTargetAtTime(p.char1Gain, now, s);
    this.char2Osc!.frequency.setTargetAtTime(p.char2Freq, now, s);
    this.char2Gain!.gain.setTargetAtTime(p.char2Gain, now, s);
    this.lfo1!.frequency.setTargetAtTime(p.lfoFreq, now, s * 2);
    this.lfo1Gain!.gain.setTargetAtTime(p.lfoDepth, now, s * 2);
    this.lfo2!.frequency.setTargetAtTime(p.lfo2Freq, now, s * 2);
    this.lfo2Gain!.gain.setTargetAtTime(p.lfo2Depth, now, s * 2);
    this.filter!.frequency.setTargetAtTime(p.filterFreq, now, s);
    this.filter!.Q.setTargetAtTime(p.filterQ, now, s);
    this.reverbGain!.gain.setTargetAtTime(p.reverbMix, now, s);
    this.dryGain!.gain.setTargetAtTime(1 - p.reverbMix * 0.6, now, s);
    this.masterGain!.gain.setTargetAtTime(this.BASE_VOLUME * p.masterLevel, now, s);
    this.rotLfo!.frequency.setTargetAtTime(p.rotSpeed, now, s * 3);
    this.rotLfoGain!.gain.setTargetAtTime(p.rotDepth, now, s * 3);
    this.rotOsc!.frequency.setTargetAtTime(p.droneFreq * 1.5, now, s * 2);
  }

  // Set mode — maps sin name to target params, morph loop handles the rest
  setMode(mode: AudioMode) {
    if (!this.initialized) return;
    this.currentMode = mode;
    const sinData = SINS[mode];
    if (!sinData) return;
    this.target = { ...sinData };

    // Oscillator type changes require special handling (can't morph type directly)
    // Schedule type change after a brief crossfade
    if (this.ctx) {
      const now = this.ctx.currentTime;
      setTimeout(() => {
        if (this.droneOsc && sinData.droneType !== this.droneOsc.type) {
          try { this.droneOsc.type = sinData.droneType; } catch {}
        }
        if (this.char1Osc && sinData.char1Type !== this.char1Osc.type) {
          try { this.char1Osc.type = sinData.char1Type; } catch {}
        }
        if (this.char2Osc && sinData.char2Type !== this.char2Osc.type) {
          try { this.char2Osc.type = sinData.char2Type; } catch {}
        }
        if (this.filter && sinData.filterType !== this.filter.type) {
          try { this.filter.type = sinData.filterType; } catch {}
        }
      }, 800); // change type after 800ms crossfade
    }
  }

  // Interaction events
  triggerPing(frequency = 880, duration = 0.9) {
    if (!this.ctx || !this.initialized) return;
    const ctx = this.ctx, now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.07, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain); gain.connect(this.reverb!); gain.connect(this.masterGain!);
    osc.start(now); osc.stop(now + duration + 0.1);
  }

  triggerThud(frequency = 60) {
    if (!this.ctx || !this.initialized) return;
    const ctx = this.ctx, now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency * 2.0, now);
    osc.frequency.exponentialRampToValueAtTime(frequency * 0.55, now + 0.3);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(gain); gain.connect(this.masterGain!);
    osc.start(now); osc.stop(now + 0.55);
  }

  triggerHoldOpen(progress: number) {
    if (!this.ctx || !this.initialized) return;
    const baseFreq = this.current.filterFreq;
    const openFreq = Math.min(baseFreq * (1 + progress * 3.0), 5000);
    this.filter!.frequency.setTargetAtTime(openFreq, this.ctx.currentTime, 0.4);
  }

  triggerRubHarmonics(intensity: number) {
    if (!this.ctx || !this.initialized) return;
    const boost = this.current.char1Gain + intensity * 0.18;
    this.char1Gain!.gain.setTargetAtTime(boost, this.ctx.currentTime, 0.08);
    setTimeout(() => {
      if (this.char1Gain) {
        this.char1Gain.gain.setTargetAtTime(this.current.char1Gain, this.ctx!.currentTime, 1.0);
      }
    }, 700);
  }

  triggerDrag(amount: number) {
    if (!this.ctx || !this.initialized) return;
    const base = this.current.droneFreq;
    const drift = base * (1 + (amount - 0.5) * 0.15);
    this.droneOsc!.frequency.setTargetAtTime(drift, this.ctx.currentTime, 0.5);
    setTimeout(() => {
      if (this.droneOsc) {
        this.droneOsc.frequency.setTargetAtTime(this.current.droneFreq, this.ctx!.currentTime, 1.2);
      }
    }, 1500);
  }

  setIntensity(intensity: number) {
    if (!this.ctx || !this.initialized) return;
    const boost = this.BASE_VOLUME * this.current.masterLevel * (1 + intensity * 0.4);
    this.masterGain!.gain.setTargetAtTime(boost, this.ctx.currentTime, 0.12);
    setTimeout(() => {
      if (this.masterGain) {
        this.masterGain.gain.setTargetAtTime(
          this.BASE_VOLUME * this.current.masterLevel,
          this.ctx!.currentTime, 0.8
        );
      }
    }, 600);
  }

  // ---- MELODIC NOTE TRIGGER ----
  // Called by the step sequencer each time a sin becomes active
  // Each sin fires a distinct melodic phrase that blends into the continuous bed
  triggerMelodicNote(mode: AudioMode) {
    if (!this.ctx || !this.initialized) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Musical note mappings per sin (in Hz)
    // Sequence forms a dark hypnotic melody: D - E - B - A - G - F#/Gb - C
    const notes: Record<AudioMode, { freq: number; type: OscillatorType; dur: number; char: number }> = {
      pride:    { freq: 293.7, type: 'sine',     dur: 3.5, char: 440.0 },  // D4 — high shimmering fifth
      greed:    { freq: 87.3,  type: 'sawtooth', dur: 2.0, char: 174.6 },  // B2 — tense minor second pulse
      lust:     { freq: 246.9, type: 'sine',     dur: 4.0, char: 369.9 },  // B3 — warm bending minor third
      wrath:    { freq: 55.0,  type: 'sawtooth', dur: 2.5, char: 82.4  },  // A1 — low distorted horn root
      gluttony: { freq: 174.6, type: 'triangle', dur: 3.0, char: 261.6 },  // F3 — thick saturated fourth
      envy:     { freq: 185.0, type: 'square',   dur: 2.0, char: 277.2 },  // F#3 — sharp restless tritone
      sloth:    { freq: 65.4,  type: 'sine',     dur: 5.0, char: 98.0  },  // C2 — slow low suspended drone
      unknown:  { freq: 233.1, type: 'sawtooth', dur: 2.8, char: 311.1 },  // Bb3 — wrong and strange
    };

    const n = notes[mode];
    if (!n) return;

    // Melodic note — the "step" of the sequencer
    const noteOsc = ctx.createOscillator();
    const noteGain = ctx.createGain();
    const notePan = ctx.createStereoPanner();
    noteOsc.type = n.type;
    noteOsc.frequency.value = n.freq;
    // Slight pitch bend for analog feel
    noteOsc.frequency.setValueAtTime(n.freq * 1.015, now);
    noteOsc.frequency.exponentialRampToValueAtTime(n.freq, now + 0.4);
    noteGain.gain.setValueAtTime(0, now);
    noteGain.gain.linearRampToValueAtTime(0.10, now + 0.3);
    noteGain.gain.setValueAtTime(0.10, now + n.dur * 0.6);
    noteGain.gain.linearRampToValueAtTime(0, now + n.dur);
    notePan.pan.value = (Math.random() - 0.5) * 0.4; // slight stereo placement
    noteOsc.connect(noteGain);
    noteGain.connect(notePan);
    notePan.connect(this.reverb!);
    notePan.connect(this.dryGain!);
    noteOsc.start(now);
    noteOsc.stop(now + n.dur + 0.1);

    // Harmonic overtone — the "character" of the step
    const harmOsc = ctx.createOscillator();
    const harmGain = ctx.createGain();
    harmOsc.type = 'sine';
    harmOsc.frequency.value = n.char;
    harmGain.gain.setValueAtTime(0, now);
    harmGain.gain.linearRampToValueAtTime(0.05, now + 0.6);
    harmGain.gain.linearRampToValueAtTime(0, now + n.dur * 0.8);
    harmOsc.connect(harmGain);
    harmGain.connect(this.reverb!);
    harmOsc.start(now);
    harmOsc.stop(now + n.dur);
  }

  // ---- DRIFT CONTROL ----
  enableDrift() {
    if (!this.ctx || !this.initialized) return;
    this.driftEnabled = true;
    const now = this.ctx.currentTime;
    const s = 1.5; // slow fade-in for cinematic feel

    // Fade in wet signal
    this.driftWet!.gain.setTargetAtTime(0.35, now, s);
    // Slightly reduce dry to make room
    this.driftDry!.gain.setTargetAtTime(0.72, now, s);
    // Activate wow/flutter
    this.driftWowGain!.gain.setTargetAtTime(0.003, now, s); // subtle delay time modulation
    // Activate stereo widening
    this.driftPanGain!.gain.setTargetAtTime(0.25, now, s);
    // Increase reverb slightly for longer tails
    if (this.reverbGain) {
      this.reverbGain.gain.setTargetAtTime(
        Math.min(0.75, this.current.reverbMix + 0.18), now, s
      );
    }
  }

  disableDrift() {
    if (!this.ctx || !this.initialized) return;
    this.driftEnabled = false;
    const now = this.ctx.currentTime;
    const s = 1.2;

    // Fade out wet signal (keep reverb tail alive — don't cut)
    this.driftWet!.gain.setTargetAtTime(0, now, s);
    // Restore dry
    this.driftDry!.gain.setTargetAtTime(1.0, now, s);
    // Deactivate wow/flutter
    this.driftWowGain!.gain.setTargetAtTime(0, now, s);
    // Deactivate stereo widening
    this.driftPanGain!.gain.setTargetAtTime(0, now, s);
    // Restore reverb
    if (this.reverbGain) {
      this.reverbGain.gain.setTargetAtTime(this.current.reverbMix, now, s);
    }
  }

  isDriftEnabled() { return this.driftEnabled; }

  isInitialized() { return this.initialized; }
}

export const orbAudio = new OrbAudio();
