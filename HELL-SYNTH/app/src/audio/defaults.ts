import { FX_DEFAULTS } from './contract';
import type { EngineState } from './contract';

/** Neutral default instrument state — the "init patch". */
export function defaultEngineState(): EngineState {
  return {
    version: 1,
    pitchEngine: {
      glideMs: 60,
      bendRangeSemis: 2,
      vibratoSense: 0.6,
      gateThreshDb: -45,
      octaveShift: 0,
      velocitySense: 0.7,
      quantizeOn: false,
      scale: 'chromatic',
      root: 0,
      trackingMode: 'smooth',
    },
    oscA: {
      enabled: true, wavetable: 'basicShapes', wtPos: 0.0, unison: 2,
      detune: 0.15, blend: 0.5, pan: 0, level: 0.8, fineCents: 0,
      warpMode: 'bend', warpAmt: 0, octave: 0, semi: 0,
    },
    oscB: {
      enabled: false, wavetable: 'analogGrit', wtPos: 0.0, unison: 1,
      detune: 0.15, blend: 0.5, pan: 0, level: 0.7, fineCents: 7,
      warpMode: 'sync', warpAmt: 0, octave: 0, semi: 0,
    },
    sub: { enabled: false, shape: 'sine', level: 0.6, octave: -1 },
    noise: { enabled: false, color: 0, level: 0.3, pitchTrack: false },
    filter: {
      enabled: true, mode: 'lp24', cutoffHz: 1200, resonance: 0.25,
      drive: 0.2, keyTrack: 0.3, envAmt: 0.3,
    },
    env1: { attackMs: 8, holdMs: 0, decayMs: 220, sustain: 0.7, releaseMs: 180, curve: 'exp' },
    env2: { attackMs: 120, holdMs: 0, decayMs: 400, sustain: 0.5, releaseMs: 500, curve: 'exp' },
    lfo1: { shape: 'sine', rateHz: 1.2, syncOn: false, syncDivision: '1/4', depth: 0.3, phase: 0, delayMs: 0, smooth: 0.1 },
    lfo2: { shape: 'tri', rateHz: 4.0, syncOn: false, syncDivision: '1/8', depth: 0.2, phase: 0, delayMs: 0, smooth: 0 },
    lfo3: { shape: 'sh', rateHz: 0.5, syncOn: false, syncDivision: '1/2', depth: 0.2, phase: 0, delayMs: 0, smooth: 0.3 },
    follower: { attackMs: 20, releaseMs: 250, gain: 1.0, gateDb: -50 },
    // init patch ships pre-routed so every LFO/MACRO knob is audible the moment you touch it
    matrix: [
      { id: 'init-r1', source: 'lfo1', dest: 'wtPosA', amount: 0.3, enabled: true },
      { id: 'init-r2', source: 'lfo2', dest: 'resonance', amount: 0.15, enabled: true },
      { id: 'init-r3', source: 'macro1', dest: 'cutoff', amount: 0.6, enabled: true },
    ],
    fxOrder: ['saturator', 'chorus', 'delay', 'reverb', 'width', 'compressor'],
    fx: JSON.parse(JSON.stringify(FX_DEFAULTS)),
    xy: { x: 0.5, y: 0.5, xDest: 'cutoff', yDest: 'wtPosA', hold: false, drift: 'off', driftSync: false },
    human: { rateHz: 0.5, syncOn: false, syncDivision: '1/4', depth: 0.5 },
    drums: { kick: false, hat: false, clap: false, level: 0.7, send: 0.35 },
    macros: [0.5, 0.5, 0.5, 0.5],
    macroNames: ['BRIGHT', 'MORPH', 'SPACE', 'GRIT'],
    master: { inputGainDb: 0, monitorOn: false, masterLevel: 0.65 },
  };
}
