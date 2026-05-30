/**
 * DRONE ENGINE v6 — Persistent AudioContext, Reliable Play/Stop
 *
 * Root cause of v5 play/stop bug:
 *   The engine was calling teardown() on stop, destroying all oscillators and
 *   the AudioContext. On the next start(), it rebuilt everything from scratch.
 *   After the first stop, the AudioContext could get stuck in "suspended" state
 *   or the rebuild timing caused silent failures.
 *
 * Fix architecture:
 *   - AudioContext and all nodes are created ONCE on first play, never destroyed
 *   - Stop = fade masterGain to 0 (silence), leave all nodes running
 *   - Start = resume AudioContext if suspended, fade masterGain back up
 *   - No oscillator restarts, no node reconnections, no teardown
 *   - This is how professional audio apps work (DAWs, games, etc.)
 *
 * Play/Stop state machine:
 *   IDLE → [start()] → STARTING → PLAYING → [stop()] → STOPPING → IDLE
 *   IDLE → [start()] → STARTING → PLAYING (repeats forever, reliably)
 */

export interface DroneParams {
  intensity: number; // 0–1
  size: number;      // 0–1
  volume: number;    // 0–1
  planetMode?: boolean; // optional retro electro layer
}

type EngineState = "idle" | "starting" | "playing" | "stopping";

export class DroneEngine {
  // AudioContext — created once, never destroyed
  private ctx: AudioContext | null = null;

  // Master gain — the ONLY thing that changes on play/stop
  private masterGain: GainNode | null = null;

  // Rest of the chain — built once, runs forever
  private finalLPF: BiquadFilterNode | null = null;
  private warmthEQ: BiquadFilterNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private waveshaper: WaveShaperNode | null = null;
  private reverb: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  private dryGain: GainNode | null = null;

  // Layer nodes
  private brownSource: AudioBufferSourceNode | null = null;
  private brownGain: GainNode | null = null;
  private brownLPF1: BiquadFilterNode | null = null;
  private brownLPF2: BiquadFilterNode | null = null;
  private brownHPF: BiquadFilterNode | null = null;

  private atmosphereSource: AudioBufferSourceNode | null = null;
  private atmosphereGain: GainNode | null = null;
  private atmosphereBPF: BiquadFilterNode | null = null;
  private atmospherePanner: StereoPannerNode | null = null;

  private textureSource: AudioBufferSourceNode | null = null;
  private textureGain: GainNode | null = null;
  private textureBPF: BiquadFilterNode | null = null;

  // Analyser for waveform viz — public
  public analyser: AnalyserNode | null = null;

  // Planet Mode — subtle retro electro pulse layer
  // Very soft rhythmic sub-bass pulse at ~0.5 Hz (not musical, just energy)
  private planetOscs: OscillatorNode[] = [];
  private planetGain: GainNode | null = null;
  private planetLFOPhase = 0;
  private planetLFOSpeed = 0.5 * 2 * Math.PI; // 0.5 Hz pulse
  private planetModeActive = false;

  // State
  private state: EngineState = "idle";
  private animFrameId: number | null = null;
  private lastTime = 0;
  private graphBuilt = false;

  // Micro-randomization
  private microTimer = 0;
  private microInterval = this.nextMicroInterval();

  // Params
  private params: DroneParams = { intensity: 0.65, size: 0.55, volume: 0.80 };

  // Filter drift (ultra-slow, only modulation in the engine)
  private filterDrift = {
    phase: 0,
    speed: 0.05 * (2 * Math.PI) / 60,
    noisePhase: 1.7,
    noiseSpeed: 0.032 * (2 * Math.PI) / 60,
  };

  // Smoothed values
  private sm = {
    brownLPFFreq: 260,
    brownGain: 0,
    atmosphereGain: 0,
    atmospherePan: 0,
    textureGain: 0,
    reverbMix: 0.3,
  };

  // ─── Public API ───────────────────────────────────────────────────────────

  async start(): Promise<void> {
    if (this.state === "playing" || this.state === "starting") return;

    this.state = "starting";

    // Create AudioContext on first call (browser autoplay policy requires user gesture)
    if (!this.ctx) {
      this.ctx = new AudioContext({ sampleRate: 44100, latencyHint: "playback" });
    }

    // Always resume — context may be suspended after tab switch or previous stop
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }

    // Build the graph once — subsequent starts reuse it
    if (!this.graphBuilt) {
      this.buildGraph();
      this.graphBuilt = true;
    }

    // Ensure context is running (some browsers need a second resume after buildGraph)
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }

    // Fade in from silence
    const now = this.ctx.currentTime;
    const targetGain = 0.88 * this.params.volume;
    this.masterGain!.gain.cancelScheduledValues(now);
    this.masterGain!.gain.setValueAtTime(0, now);
    this.masterGain!.gain.linearRampToValueAtTime(targetGain, now + 1.8);

    this.state = "playing";
    this.lastTime = performance.now();
    this.microTimer = 0;

    // Start modulation loop if not already running
    if (this.animFrameId === null) {
      this.startModulation();
    }
  }

  async stop(): Promise<void> {
    if (this.state === "idle" || this.state === "stopping") return;

    this.state = "stopping";

    if (!this.ctx || !this.masterGain) {
      this.state = "idle";
      return;
    }

    // Fade out to silence
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0, now + 0.9);

    // After fade completes, mark as idle — do NOT destroy anything
    setTimeout(() => {
      this.state = "idle";
    }, 950);
  }

  updateParams(p: Partial<DroneParams>): void {
    const prevPlanetMode = this.params.planetMode;
    this.params = { ...this.params, ...p };
    // Apply volume change immediately if playing
    if (this.state === "playing" && this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      const targetGain = 0.88 * this.params.volume;
      this.masterGain.gain.setTargetAtTime(targetGain, now, 0.15);
    }
    // Handle planet mode toggle
    if (p.planetMode !== undefined && p.planetMode !== prevPlanetMode) {
      this.setPlanetMode(!!p.planetMode);
    }
  }

  setPlanetMode(active: boolean): void {
    this.planetModeActive = active;
    if (this.planetGain && this.ctx) {
      const now = this.ctx.currentTime;
      // Fade planet layer in or out over 1.5 seconds
      this.planetGain.gain.setTargetAtTime(active ? 0.12 : 0, now, 0.5);
    }
  }

  getIsPlaying(): boolean {
    return this.state === "playing" || this.state === "starting";
  }

  // ─── Graph Construction (called once) ────────────────────────────────────

  private buildGraph(): void {
    const ctx = this.ctx!;

    // Master gain — starts at 0, faded up on play
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 0;

    // Safety LPF — nothing above 500Hz
    this.finalLPF = ctx.createBiquadFilter();
    this.finalLPF.type = "lowpass";
    this.finalLPF.frequency.value = 500;
    this.finalLPF.Q.value = 0.2;

    // Warmth EQ — low-mid boost
    this.warmthEQ = ctx.createBiquadFilter();
    this.warmthEQ.type = "lowshelf";
    this.warmthEQ.frequency.value = 250;
    this.warmthEQ.gain.value = 3;

    // Tape warmth
    this.waveshaper = ctx.createWaveShaper();
    this.waveshaper.curve = this.makeTapeWarmth(2.5);
    this.waveshaper.oversample = "2x";

    // Compressor
    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -16;
    this.compressor.knee.value = 18;
    this.compressor.ratio.value = 3.5;
    this.compressor.attack.value = 0.12;
    this.compressor.release.value = 0.55;

    // Reverb
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this.makeWarmReverb(ctx, 5.5, 2.5);
    this.reverbGain = ctx.createGain();
    this.reverbGain.gain.value = 0.3;
    this.dryGain = ctx.createGain();
    this.dryGain.gain.value = 0.85;

    // Analyser
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.92;

    // Signal chain
    this.waveshaper.connect(this.warmthEQ);
    this.warmthEQ.connect(this.dryGain);
    this.warmthEQ.connect(this.reverb);
    this.reverb.connect(this.reverbGain);
    this.dryGain.connect(this.finalLPF);
    this.reverbGain.connect(this.finalLPF);
    this.finalLPF.connect(this.analyser);
    this.analyser.connect(this.masterGain);
    this.masterGain.connect(this.compressor);
    this.compressor.connect(ctx.destination);

    // ── Layer 1: Brown noise core (70%) ──
    const brownBuf = this.makeBrownNoise(ctx, 9);
    this.brownSource = ctx.createBufferSource();
    this.brownSource.buffer = brownBuf;
    this.brownSource.loop = true;
    this.brownSource.loopStart = Math.random() * 4;
    this.brownSource.loopEnd = brownBuf.duration;

    this.brownHPF = ctx.createBiquadFilter();
    this.brownHPF.type = "highpass";
    this.brownHPF.frequency.value = 40;
    this.brownHPF.Q.value = 0.5;

    this.brownLPF1 = ctx.createBiquadFilter();
    this.brownLPF1.type = "lowpass";
    this.brownLPF1.frequency.value = 260;
    this.brownLPF1.Q.value = 0.3;

    this.brownLPF2 = ctx.createBiquadFilter();
    this.brownLPF2.type = "lowpass";
    this.brownLPF2.frequency.value = 260;
    this.brownLPF2.Q.value = 0.3;

    this.brownGain = ctx.createGain();
    this.brownGain.gain.value = 0.6;

    this.brownSource.connect(this.brownHPF);
    this.brownHPF.connect(this.brownLPF1);
    this.brownLPF1.connect(this.brownLPF2);
    this.brownLPF2.connect(this.brownGain);
    this.brownGain.connect(this.waveshaper);
    this.brownSource.start();

    // ── Layer 2: Atmosphere (20%) ──
    const atmBuf = this.makeBrownNoise(ctx, 7);
    this.atmosphereSource = ctx.createBufferSource();
    this.atmosphereSource.buffer = atmBuf;
    this.atmosphereSource.loop = true;
    this.atmosphereSource.loopStart = Math.random() * 3.5;
    this.atmosphereSource.loopEnd = atmBuf.duration;

    this.atmosphereBPF = ctx.createBiquadFilter();
    this.atmosphereBPF.type = "bandpass";
    this.atmosphereBPF.frequency.value = 220;
    this.atmosphereBPF.Q.value = 0.7;

    this.atmospherePanner = ctx.createStereoPanner();
    this.atmospherePanner.pan.value = 0;

    this.atmosphereGain = ctx.createGain();
    this.atmosphereGain.gain.value = 0.18;

    this.atmosphereSource.connect(this.atmosphereBPF);
    this.atmosphereBPF.connect(this.atmospherePanner);
    this.atmospherePanner.connect(this.atmosphereGain);
    this.atmosphereGain.connect(this.waveshaper);
    this.atmosphereSource.start();

    // ── Layer 3: Texture (10%) ──
    const texBuf = this.makeBrownNoise(ctx, 6);
    this.textureSource = ctx.createBufferSource();
    this.textureSource.buffer = texBuf;
    this.textureSource.loop = true;
    this.textureSource.loopStart = Math.random() * 3;
    this.textureSource.loopEnd = texBuf.duration;

    this.textureBPF = ctx.createBiquadFilter();
    this.textureBPF.type = "bandpass";
    this.textureBPF.frequency.value = 300;
    this.textureBPF.Q.value = 0.5;

    this.textureGain = ctx.createGain();
    this.textureGain.gain.value = 0.05;

    this.textureSource.connect(this.textureBPF);
    this.textureBPF.connect(this.textureGain);
    this.textureGain.connect(this.waveshaper);
    this.textureSource.start();

    // ── Planet Mode: retro electro pulse layer ──
    // Three slightly detuned low sines — not musical, just warm sub energy
    // Gain starts at 0; activated by setPlanetMode()
    this.planetGain = ctx.createGain();
    this.planetGain.gain.value = 0;
    this.planetGain.connect(this.waveshaper);

    this.planetOscs = [];
    [55, 55 * 1.5, 55 * 2].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.detune.value = [0, 3, -3][i];
      osc.connect(this.planetGain!);
      osc.start();
      this.planetOscs.push(osc);
    });
  }

  // ─── Modulation Loop ─────────────────────────────────────────────────────

  private startModulation(): void {
    const tick = (now: number) => {
      // Keep running even when stopped — nodes stay alive
      const dt = Math.min((now - this.lastTime) / 1000, 0.1);
      this.lastTime = now;

      this.filterDrift.phase += this.filterDrift.speed * dt;
      this.filterDrift.noisePhase += this.filterDrift.noiseSpeed * dt;
      if (this.filterDrift.phase > Math.PI * 2) this.filterDrift.phase -= Math.PI * 2;
      if (this.filterDrift.noisePhase > Math.PI * 2) this.filterDrift.noisePhase -= Math.PI * 2;

      this.microTimer += dt;
      if (this.microTimer >= this.microInterval) {
        this.microTimer = 0;
        this.microInterval = this.nextMicroInterval();
      }

      if (this.state === "playing") {
        this.applyModulation();
        // Planet mode: advance LFO phase for subtle pulse
        if (this.planetModeActive) {
          this.planetLFOPhase += this.planetLFOSpeed * dt;
          if (this.planetLFOPhase > Math.PI * 2) this.planetLFOPhase -= Math.PI * 2;
          if (this.planetGain && this.ctx) {
            // Soft rhythmic pulse: 0.5 Hz, amplitude ±30% of base gain
            const pulse = 0.12 + Math.sin(this.planetLFOPhase) * 0.04;
            this.planetGain.gain.setTargetAtTime(Math.max(0, pulse), this.ctx.currentTime, 0.3);
          }
        }
      }

      this.animFrameId = requestAnimationFrame(tick);
    };
    this.animFrameId = requestAnimationFrame(tick);
  }

  private applyModulation(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const { intensity, size } = this.params;

    const k = 0.025;
    const lerp = (a: number, b: number) => a + (b - a) * k;

    // Brown noise gain
    const brownTarget = 0.50 + intensity * 0.25;
    this.sm.brownGain = lerp(this.sm.brownGain, brownTarget);
    this.brownGain?.gain.setTargetAtTime(this.sm.brownGain, now, 0.5);

    // LPF drift — only modulation: ±3Hz around 220–300Hz
    const centerFreq = 220 + intensity * 80;
    const driftVal = Math.sin(this.filterDrift.phase) * 0.65 +
      Math.sin(this.filterDrift.noisePhase * 1.618) * 0.35;
    const lpfTarget = centerFreq + driftVal * 3.0;
    this.sm.brownLPFFreq = lerp(this.sm.brownLPFFreq, Math.max(180, Math.min(360, lpfTarget)));
    this.brownLPF1?.frequency.setTargetAtTime(this.sm.brownLPFFreq, now, 2.5);
    this.brownLPF2?.frequency.setTargetAtTime(this.sm.brownLPFFreq, now, 2.5);

    // Atmosphere gain
    const atmTarget = 0.12 + intensity * 0.16;
    this.sm.atmosphereGain = lerp(this.sm.atmosphereGain, atmTarget);
    this.atmosphereGain?.gain.setTargetAtTime(this.sm.atmosphereGain, now, 0.6);

    // Stereo pan — very gentle
    const panTarget = driftVal * 0.08 * size;
    this.sm.atmospherePan = lerp(this.sm.atmospherePan, Math.max(-0.25, Math.min(0.25, panTarget)));
    this.atmospherePanner?.pan.setTargetAtTime(this.sm.atmospherePan, now, 3.0);

    // Texture gain
    const texTarget = 0.03 + intensity * 0.05;
    this.sm.textureGain = lerp(this.sm.textureGain, texTarget);
    this.textureGain?.gain.setTargetAtTime(this.sm.textureGain, now, 0.8);

    // Reverb
    const reverbTarget = 0.08 + size * 0.42;
    this.sm.reverbMix = lerp(this.sm.reverbMix, reverbTarget);
    this.reverbGain?.gain.setTargetAtTime(this.sm.reverbMix, now, 1.0);
    this.dryGain?.gain.setTargetAtTime(1 - this.sm.reverbMix * 0.22, now, 1.0);
  }

  private nextMicroInterval(): number {
    return 180 + Math.random() * 420;
  }

  // ─── Audio Utilities ─────────────────────────────────────────────────────

  private makeBrownNoise(ctx: AudioContext, durationSeconds: number): AudioBuffer {
    const sr = ctx.sampleRate;
    const len = Math.floor(sr * durationSeconds);
    const buf = ctx.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let lastOut = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.02 * white) / 1.02;
        d[i] = lastOut * 3.5;
      }
      let max = 0;
      for (let i = 0; i < len; i++) max = Math.max(max, Math.abs(d[i]));
      if (max > 0) for (let i = 0; i < len; i++) d[i] /= max * 1.1;
    }
    return buf;
  }

  private makeWarmReverb(ctx: AudioContext, duration: number, decay: number): AudioBuffer {
    const sr = ctx.sampleRate;
    const len = Math.floor(sr * duration);
    const buf = ctx.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay + (ch === 0 ? 0 : 0.08));
      }
    }
    return buf;
  }

  private makeTapeWarmth(amount: number): Float32Array {
    const n = 512;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = Math.tanh(x * amount) / Math.tanh(amount);
    }
    return curve;
  }
}

export const droneEngine = new DroneEngine();
