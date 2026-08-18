/**
 * VOXFORM Audio Engine Contract
 * -----------------------------
 * This file is the SINGLE SOURCE OF TRUTH between the DSP engine
 * (`src/audio/`, pure TypeScript, no React — portable to a DAW plug-in)
 * and the React UI (`src/pages/Instrument.tsx`, `src/components/instrument/`).
 *
 * The engine implements `SynthEngine` and exports `createEngine()` from
 * `src/audio/index.ts`. The UI imports ONLY from `@/audio` (index.ts) and
 * this contract. Do not put React imports anywhere under `src/audio/`.
 */

// ---------------------------------------------------------------------------
// Pitch tracking
// ---------------------------------------------------------------------------

export interface PitchState {
  /** Whether a stable pitch is currently locked. */
  locked: boolean;
  /** Detected frequency in Hz (0 when unlocked). */
  freq: number;
  /** Nearest MIDI note number (float, includes cents fraction). */
  midi: number;
  /** Note name like "A", "C#". */
  noteName: string;
  /** Octave number, e.g. 3 for A3. */
  octave: number;
  /** Deviation from the quantized note in cents (-50..+50 after quantize). */
  cents: number;
  /** Tracker confidence 0..1. */
  confidence: number;
  /** Input level in dBFS (-Infinity..0). */
  inputDb: number;
  /** Whether the input gate is open (level above gate threshold). */
  gateOpen: boolean;
}

// ---------------------------------------------------------------------------
// Parameter model — every control maps 1:1 to an engine parameter.
// Values are REAL units (not normalized); the UI normalizes for knobs.
// ---------------------------------------------------------------------------

export type ScaleName =
  | 'chromatic' | 'major' | 'minor' | 'pentatonic' | 'dorian' | 'wholeTone';

export interface PitchEngineParams {
  glideMs: number;          // 0..500
  bendRangeSemis: number;   // 1..24
  vibratoSense: number;     // 0..1
  gateThreshDb: number;     // -60..0
  octaveShift: number;      // -2..+2 (stepped)
  velocitySense: number;    // 0..1
  quantizeOn: boolean;
  scale: ScaleName;
  root: number;             // 0..11 (C..B)
  trackingMode: 'smooth' | 'fast';
}

export type WavetableName =
  | 'basicShapes' | 'analogGrit' | 'vocalFormant'
  | 'harmonics' | 'digitalEdge' | 'glass';

export type WarpMode = 'sync' | 'fmB' | 'bend' | 'mirror';

export interface OscParams {
  enabled: boolean;
  wavetable: WavetableName;
  wtPos: number;            // 0..1
  unison: number;           // 1..7 (stepped)
  detune: number;           // 0..1
  blend: number;            // 0..1 stereo spread
  pan: number;              // -1..1
  level: number;            // 0..1
  fineCents: number;        // -100..100
  warpMode: WarpMode;
  warpAmt: number;          // 0..1
  octave: number;           // -2..+2
  semi: number;             // -12..+12
}

export interface SubParams {
  enabled: boolean;
  shape: 'sine' | 'triangle' | 'square1' | 'square2';
  level: number;            // 0..1
  octave: number;           // -2..0
}

export interface NoiseParams {
  enabled: boolean;
  color: number;            // 0..1 white->pink->brown
  level: number;            // 0..1
  pitchTrack: boolean;
}

export type FilterMode = 'lp24' | 'lp12' | 'bp' | 'hp';

export interface FilterParams {
  enabled: boolean;
  mode: FilterMode;
  cutoffHz: number;         // 20..20000 (log)
  resonance: number;        // 0..1 (self-osc > 0.85)
  drive: number;            // 0..1
  keyTrack: number;         // 0..1
  envAmt: number;           // -1..1 (bipolar)
}

export type EnvCurve = 'lin' | 'exp' | 'log';

export interface EnvParams {
  attackMs: number;   // 0..4000
  holdMs: number;     // 0..2000
  decayMs: number;    // 0..4000
  sustain: number;    // 0..1
  releaseMs: number;  // 0..8000
  curve: EnvCurve;
}

export type LfoShape = 'sine' | 'tri' | 'saw' | 'square' | 'sh' | 'custom';

export interface LfoParams {
  shape: LfoShape;
  rateHz: number;     // 0.01..20 (when not synced)
  syncOn: boolean;
  syncDivision: string; // '1/1','1/2','1/4','1/8','1/8T','1/16',...
  depth: number;      // 0..1
  phase: number;      // 0..1
  delayMs: number;    // 0..2000 fade-in
  smooth: number;     // 0..1
}

export interface FollowerParams {
  attackMs: number;   // 0..500
  releaseMs: number;  // 0..2000
  gain: number;       // 0..2
  gateDb: number;     // -60..0
}

// ---------------------------------------------------------------------------
// Modulation matrix
// ---------------------------------------------------------------------------

export type ModSourceId =
  | 'env1' | 'env2' | 'lfo1' | 'lfo2' | 'lfo3' | 'follower'
  | 'velocity' | 'pitch' | 'macro1' | 'macro2' | 'macro3' | 'macro4'
  | 'xyX' | 'xyY' | 'modWheel' | 'human';

export type ModDestId =
  | 'cutoff' | 'resonance' | 'filterDrive'
  | 'wtPosA' | 'wtPosB' | 'pitch' | 'level' | 'pan'
  | 'oscALevel' | 'oscBLevel' | 'subLevel' | 'noiseLevel'
  | 'lfo1Rate' | 'lfo2Rate' | 'lfo3Rate'
  | 'fxSaturatorDrive' | 'fxChorusDepth' | 'fxDelayTime'
  | 'fxDelayFeedback' | 'fxReverbSize' | 'fxReverbMix' | 'fxWidth';

export interface ModRoute {
  id: string;             // unique id (uuid-ish)
  source: ModSourceId;
  amount: number;         // -1..1 bipolar
  dest: ModDestId;
  enabled: boolean;
}

// ---------------------------------------------------------------------------
// FX rack
// ---------------------------------------------------------------------------

export type FxId = 'saturator' | 'chorus' | 'delay' | 'reverb' | 'width' | 'compressor';

export interface FxState {
  id: FxId;
  enabled: boolean;
  params: Record<string, number | boolean>;
}

export const FX_DEFAULTS: Record<FxId, FxState> = {
  saturator:  { id: 'saturator',  enabled: false, params: { drive: 0.3, mix: 0.5 } },
  chorus:     { id: 'chorus',     enabled: false, params: { rate: 0.8, depth: 0.4 } },
  delay:      { id: 'delay',      enabled: false, params: { timeMs: 320, feedback: 0.35, sync: false } },
  reverb:     { id: 'reverb',     enabled: false, params: { size: 0.5, mix: 0.25 } },
  width:      { id: 'width',      enabled: false, params: { width: 0.5, monoBass: true } },
  compressor: { id: 'compressor', enabled: true,  params: { amount: 0.4, mix: 1 } },
};

// ---------------------------------------------------------------------------
// XY pad + macros
// ---------------------------------------------------------------------------

export type XyDriftMode = 'off' | 'slow' | 'med' | 'fast';

export interface XyState {
  x: number;            // 0..1
  y: number;            // 0..1
  xDest: ModDestId;     // default 'cutoff'
  yDest: ModDestId;     // default 'wtPosA'
  hold: boolean;
  drift: XyDriftMode;   // auto-glide the pad node
  driftSync: boolean;   // tempo-sync the drift segments
}

// ---------------------------------------------------------------------------
// HUMAN — smooth random mod source (wander / strangeness)
// ---------------------------------------------------------------------------

export interface HumanParams {
  rateHz: number;        // 0.05..8 — how often a new random target is picked
  syncOn: boolean;
  syncDivision: string;  // '1/1','1/2','1/4','1/8','1/8T','1/16',...
  depth: number;         // 0..1 output scale
}

// ---------------------------------------------------------------------------
// Drums — sketch beat (kick / hat / clap) with its own echo bus
// ---------------------------------------------------------------------------

export interface DrumsState {
  kick: boolean;
  hat: boolean;
  clap: boolean;
  level: number;   // 0..1 drum bus level
  send: number;    // 0..1 echo (delay+reverb) send
}

// ---------------------------------------------------------------------------
// Master
// ---------------------------------------------------------------------------

export interface MasterParams {
  inputGainDb: number;    // -24..+24
  monitorOn: boolean;     // dry voice monitor (default false)
  masterLevel: number;    // 0..1
}

// ---------------------------------------------------------------------------
// Full instrument state (preset snapshot shape)
// ---------------------------------------------------------------------------

export interface EngineState {
  version: 1;
  pitchEngine: PitchEngineParams;
  oscA: OscParams;
  oscB: OscParams;
  sub: SubParams;
  noise: NoiseParams;
  filter: FilterParams;
  env1: EnvParams;
  env2: EnvParams;
  lfo1: LfoParams;
  lfo2: LfoParams;
  lfo3: LfoParams;
  follower: FollowerParams;
  matrix: ModRoute[];       // 0..12 rows
  fxOrder: FxId[];          // signal order, top->bottom
  fx: Record<FxId, FxState>;
  xy: XyState;
  human: HumanParams;
  drums: DrumsState;
  macros: number[];         // 4 values 0..1
  macroNames: string[];     // 4 names
  master: MasterParams;
}

export interface Preset {
  id: string;               // factory id or user uuid
  name: string;
  tag: string;              // 4px tag chip label, e.g. 'LEAD', 'PAD'
  factory: boolean;
  state: EngineState;
}

// ---------------------------------------------------------------------------
// Recording
// ---------------------------------------------------------------------------

export interface RecordedTake {
  id: string;
  name: string;             // e.g. 'TAKE_07'
  createdAt: number;        // epoch ms
  durationSec: number;
  sampleRate: number;       // render target: 48000
  /** Rendered synth output: one Float32Array per channel. */
  channels: Float32Array[];
  /** Raw dry mic stem (if captured), same layout; null when unavailable. */
  dryChannels: Float32Array[] | null;
  /** Decoded buffer retained for SEND-TO-SYNTH injection (startSample) — the
   *  dry mic stem when captured, else the rendered channels. Kept so sending
   *  a take into the synth needs no re-decode. Not serialized. */
  buffer?: AudioBuffer;
}

export interface WavExportOptions {
  normalize: boolean;           // peak to -1 dBFS
  includeDryStem: boolean;      // also return dry-voice WAV
  trimStartSec: number;         // 0..duration
  trimEndSec: number;           // 0..duration (>= trimStartSec)
}

export interface WavExportResult {
  wav: Blob;                    // 48 kHz / 32-bit float WAV
  dryWav: Blob | null;
  durationSec: number;
  sizeBytes: number;
}

// ---------------------------------------------------------------------------
// Demo vocal sources + synth showcase (no-mic tryout)
// ---------------------------------------------------------------------------

export type DemoSourceId = 'hum' | 'sung' | 'spoken' | 'whistle';

/** Built-in demo vocal loops (in `public/demo/`). Played through the exact
 *  mic input path so pitch tracking / gate / follower treat them as a voice. */
export const DEMO_SOURCES: { id: DemoSourceId; name: string; file: string }[] = [
  { id: 'hum', name: 'HUM', file: '/demo/hum-loop.mp3' },
  { id: 'sung', name: 'SUNG', file: '/demo/sung-hook.mp3' },
  { id: 'spoken', name: 'SPOKEN', file: '/demo/spoken-phrase.mp3' },
  { id: 'whistle', name: 'WHISTLE', file: '/demo/whistle-riff.mp3' },
];

// ---------------------------------------------------------------------------
// Transport + step sequencer
// ---------------------------------------------------------------------------

/** One step of the step sequencer. */
export interface SeqStep {
  on: boolean;
  note: number;      // absolute MIDI note number (e.g. 57 = A3)
  velocity: number;  // 0..1
}

export interface SequencerState {
  /** When true AND the transport is playing, the sequencer drives
   *  noteOn/noteOff through the current patch (keyboard-style voice). */
  enabled: boolean;
  /** Active step count 1..16 — the pattern wraps at this boundary. */
  length: number;
  /** Always exactly SEQ_STEPS entries; steps beyond `length` never fire. */
  steps: SeqStep[];
}

export const SEQ_STEPS = 16;

/** Factory pattern: A-minor hook on the off-8ths — musical out of the box,
 *  and a sane reset target for the UI. */
export const DEFAULT_SEQUENCER: SequencerState = {
  enabled: true,
  length: 16,
  steps: [57, 60, 64, 60, 62, 57, 67, 64, 57, 60, 64, 62, 65, 64, 62, 60].map(
    (note, i) => ({ on: i % 2 === 0, note, velocity: 0.8 }),
  ),
};

/** Transport clock limits. The master BPM is the single sync reference for
 *  the sequencer, the showcase, delay SYNC and LFO sync divisions. */
export const BPM_MIN = 40;
export const BPM_MAX = 240;
export const BPM_DEFAULT = 120;

// ---------------------------------------------------------------------------
// Engine status + telemetry
// ---------------------------------------------------------------------------

export type EngineStatus =
  | 'idle'            // not started
  | 'awaiting-mic'    // getUserMedia pending
  | 'live'            // running with mic
  | 'no-mic'          // running keyboard-only
  | 'suspended'       // AudioContext suspended (tab hidden / autoplay policy)
  | 'denied';         // mic permission denied

export interface EngineInfo {
  status: EngineStatus;
  sampleRate: number;        // e.g. 48000
  bufferSize: number;        // e.g. 128
  latencyMs: number;         // estimated round-trip
  recording: boolean;
  recordElapsedSec: number;
  outputPeakDb: number;      // master bus peak, for meter + clip indicator
  /** DOMException name of the last mic request failure (e.g. 'NotAllowedError',
   *  'NotFoundError', 'InsecureContextError') — plus 'os-timeout', raised when
   *  getUserMedia neither resolved nor rejected within 12s (browser site
   *  permission granted, but the OS is withholding the mic; status is 'no-mic'
   *  in that case). null when no failure. */
  micError?: string | null;
  /** Demo loop currently playing through the input path; null when off. */
  demoPlaying?: DemoSourceId | null;
  /** Whether the auto-played showcase riff is running. */
  showcasePlaying?: boolean;
  /** Factory preset id the showcase last auto-advanced to; null when the
   *  showcase is still on the user's own patch (or not running). */
  showcasePresetId?: string | null;
  /** Display name of the recorded take currently looping through the input
   *  path (send-to-synth); null when off. */
  samplePlaying?: string | null;
  /** Master transport running (sequencer/showcase/schedulers advance). */
  transportPlaying?: boolean;
  /** Current sequencer step 0..length-1 while the transport runs; null when
   *  the transport is paused or the sequencer is disabled. Drives the UI
   *  playhead highlight. */
  transportStep?: number | null;
}

export type TelemetryListener = (pitch: PitchState, info: EngineInfo) => void;

// ---------------------------------------------------------------------------
// The engine API
// ---------------------------------------------------------------------------

export interface SynthEngine {
  // --- lifecycle ---
  /** Request mic + build graph. Resolves 'live' or 'no-mic' (explore mode). */
  start(opts: { useMic: boolean }): Promise<EngineStatus>;
  /** Resume a suspended AudioContext (call from a user gesture). */
  resume(): Promise<void>;
  suspend(): Promise<void>;
  dispose(): void;

  // --- state ---
  getState(): EngineState;
  /** Replace full state (preset load). Knobs sweep handled by UI.
   *  `preservePerformance` keeps the user's master level, drum sketch and XY
   *  drift across the swap — used for preset loads, not for plain commits. */
  setState(state: EngineState, opts?: { preservePerformance?: boolean }): void;
  /** Patch a nested param group, e.g. setParams('filter', { cutoffHz: 1200 }). */
  setParams<K extends keyof EngineState>(group: K, patch: Partial<EngineState[K]>): void;

  // --- modulation matrix ---
  addRoute(route: Omit<ModRoute, 'id'>): ModRoute;
  removeRoute(id: string): void;

  // --- performance input (keyboard/QWERTY + touch strips) ---
  noteOn(midi: number, velocity?: number): void;   // velocity 0..1
  noteOff(midi: number): void;
  pitchBend(amount: number): void;                 // -1..1 (± bendRangeSemis)
  modWheel(amount: number): void;                  // 0..1

  // --- demo sources + showcase (hear it before enabling the mic) ---
  /** Loop a demo vocal take through the EXACT mic input path (inputGain →
   *  pitch tracker / gate / follower / input analyser). Boots the engine in
   *  no-mic mode if it isn't running yet — no mic call is made. Mutually
   *  exclusive with the showcase and with a live mic stream (no-op then).
   *  Starting the same source twice is a no-op; switching sources restarts. */
  startDemo(source: DemoSourceId): Promise<void>;
  stopDemo(): void;
  /** Auto-played ~8-bar minor riff through the CURRENT preset (uses
   *  noteOn/noteOff/pitchBend internally, so knob tweaks are heard live).
   *  Every 2 loops it auto-advances to the next factory preset and reports
   *  it via `EngineInfo.showcasePresetId`. Boots no-mic if needed; mutually
   *  exclusive with demo sources and a live mic. Starting twice is a no-op. */
  startShowcase(): void;
  stopShowcase(): void;
  /** Send a recorded take INTO the synth: routes `buffer` through the EXACT
   *  mic input path (inputGain → pitch tracker / gate / follower / input
   *  analyser), looping, so the whole instrument responds to it as if it were
   *  live voice. Takes an already-decoded AudioBuffer (no fetch/decode).
   *  Boots the engine in no-mic mode if it isn't running yet — no mic call
   *  is made. Mutually exclusive with demo sources, the showcase, and a live
   *  mic: starting a sample stops demo/showcase, starting demo/showcase stops
   *  the sample, and a live mic grant stops it (no-op when a mic is live).
   *  Starting the same take (same name) twice is a no-op; a different name
   *  switches (restarts with the new buffer). */
  startSample(buffer: AudioBuffer, name: string): void;
  stopSample(): void;

  // --- transport + step sequencer (master clock) ---
  /** Start/resume the master transport: the step sequencer (when enabled)
   *  advances and fires noteOn/noteOff through the current patch, the
   *  showcase follows the same clock, and a looping sample/demo keeps
   *  playing. Pausing and resuming does NOT reset the pattern position. */
  startTransport(): void;
  /** Pause the master transport: sequencer, showcase scheduler, and looping
   *  sample/demo sources all freeze (sample/demo resume from where they
   *  paused — NOT from the top). Live mic input and keyboard play are NOT
   *  affected — a transport is not a mute. */
  pauseTransport(): void;
  /** Set the master BPM (clamped to BPM_MIN..BPM_MAX). Delay SYNC and
   *  LFO sync divisions re-quantize against it immediately. */
  setBpm(bpm: number): void;
  getBpm(): number;
  /** Read the sequencer pattern (copy — mutate via setSeqStep/setSequencer). */
  getSequencer(): SequencerState;
  /** Replace the whole pattern (e.g. reset to DEFAULT_SEQUENCER). */
  setSequencer(seq: SequencerState): void;
  /** Update one step (toggle on/off, change note/velocity). */
  setSeqStep(index: number, step: SeqStep): void;
  /** Arm/disarm the sequencer without touching the transport. */
  setSeqEnabled(on: boolean): void;

  // --- visualizer taps (never null after start()) ---
  getInputAnalyser(): AnalyserNode | null;
  getOutputAnalyser(): AnalyserNode | null;
  /** The live mic track, or null when no mic stream is held. Lets the UI
   *  check track.enabled / track.readyState for dead-track diagnosis. */
  getInputTrack(): MediaStreamTrack | null;
  /** Drop the current mic stream (tracks stopped, source disconnected) so
   *  the next start({ useMic: true }) performs a FRESH getUserMedia. Used
   *  when a granted-but-silent track must be re-requested after the user
   *  fixes an OS-level mic block. */
  dropMic(): void;

  // --- telemetry (UI polls each animation frame; engine is push-free) ---
  getPitch(): PitchState;
  getInfo(): EngineInfo;
  /** Current follower output 0..1 (voice loudness as mod). */
  getFollowerValue(): number;
  /** Live modulator outputs for mod-ring display: source -> -1..1. */
  getModValues(): Partial<Record<ModSourceId, number>>;

  // --- recording ---
  startRecording(): void;
  /** Stops and returns the captured take (rendered at 48k). */
  stopRecording(): Promise<RecordedTake>;
  /** Render a take to 48kHz/32-bit float WAV blob(s). */
  exportWav(take: RecordedTake, opts: WavExportOptions): Promise<WavExportResult>;
  /** Audition a take (trimmed region); returns a stop function. */
  audition(take: RecordedTake, trimStartSec: number, trimEndSec: number): () => void;
}
