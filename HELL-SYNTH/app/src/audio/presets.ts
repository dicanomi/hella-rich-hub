/**
 * 12 factory presets — full EngineState snapshots.
 * Every factory preset pre-routes `follower -> cutoff` (louder = brighter)
 * and `macro1 (BRIGHT) -> cutoff`, plus per-preset signature routings.
 */

import type { EngineState, Preset } from './contract';
import { defaultEngineState } from './defaults';

type Patch = (s: EngineState) => void;

function preset(id: string, name: string, tag: string, patch: Patch): Preset {
  const s = defaultEngineState();
  s.matrix = [
    { id: `${id}-r1`, source: 'follower', dest: 'cutoff', amount: 0.35, enabled: true },
    { id: `${id}-r2`, source: 'macro1', dest: 'cutoff', amount: 0.55, enabled: true },
  ];
  s.macroNames = ['BRIGHT', 'MORPH', 'SPACE', 'GRIT'];
  patch(s);
  return { id: `factory-${id}`, name, tag, factory: true, state: s };
}

export const FACTORY_PRESETS: Preset[] = [
  preset('neon-choir', 'NEON CHOIR', 'PAD', (s) => {
    s.oscA = { ...s.oscA, wavetable: 'vocalFormant', wtPos: 0.25, unison: 3, detune: 0.4, blend: 0.7, level: 0.75 };
    s.oscB = { ...s.oscB, enabled: true, wavetable: 'harmonics', wtPos: 0.5, unison: 2, detune: 0.3, level: 0.25, octave: 0 };
    s.filter = { ...s.filter, mode: 'lp24', cutoffHz: 1400, resonance: 0.2, drive: 0.15, envAmt: 0.25 };
    s.env1 = { attackMs: 90, holdMs: 0, decayMs: 350, sustain: 0.8, releaseMs: 420, curve: 'exp' };
    s.lfo1 = { ...s.lfo1, shape: 'sine', rateHz: 0.3, depth: 0.35 };
    s.matrix.push(
      { id: 'neon-choir-r3', source: 'lfo1', dest: 'wtPosA', amount: 0.3, enabled: true },
      { id: 'neon-choir-r4', source: 'macro3', dest: 'fxReverbMix', amount: 0.6, enabled: true },
    );
    s.fx.chorus = { id: 'chorus', enabled: true, params: { rate: 0.6, depth: 0.5 } };
    s.fx.reverb = { id: 'reverb', enabled: true, params: { size: 0.65, mix: 0.32 } };
    s.xy = { ...s.xy, xDest: 'cutoff', yDest: 'wtPosA' };
  }),

  preset('robo-lead', 'ROBO LEAD', 'LEAD', (s) => {
    s.pitchEngine = { ...s.pitchEngine, quantizeOn: true, scale: 'pentatonic', glideMs: 40, trackingMode: 'fast', vibratoSense: 0.35 };
    s.oscA = { ...s.oscA, wavetable: 'digitalEdge', wtPos: 0.35, unison: 2, detune: 0.2, warpMode: 'sync', warpAmt: 0.4, level: 0.8 };
    s.filter = { ...s.filter, mode: 'lp12', cutoffHz: 1500, resonance: 0.3, drive: 0.4, envAmt: 0.35 };
    s.env1 = { attackMs: 4, holdMs: 0, decayMs: 160, sustain: 0.55, releaseMs: 120, curve: 'exp' };
    s.fx.saturator = { id: 'saturator', enabled: true, params: { drive: 0.45, mix: 0.6 } };
    s.fx.delay = { id: 'delay', enabled: true, params: { timeMs: 250, feedback: 0.3, sync: true } };
    s.matrix.push({ id: 'robo-lead-r3', source: 'modWheel', dest: 'resonance', amount: 0.5, enabled: true });
  }),

  preset('sub-whisper', 'SUB WHISPER', 'BASS', (s) => {
    s.oscA = { ...s.oscA, wavetable: 'basicShapes', wtPos: 0, level: 0.4, octave: -1 };
    s.sub = { enabled: true, shape: 'square2', level: 0.9, octave: -2 };
    s.noise = { enabled: true, color: 0.8, level: 0.08, pitchTrack: true };
    s.filter = { ...s.filter, mode: 'lp24', cutoffHz: 320, resonance: 0.3, drive: 0.25, envAmt: 0.2 };
    s.env1 = { attackMs: 60, holdMs: 0, decayMs: 500, sustain: 0.85, releaseMs: 300, curve: 'exp' };
    s.fx.compressor = { id: 'compressor', enabled: true, params: { amount: 0.6, mix: 1 } };
    s.matrix.push({ id: 'sub-whisper-r3', source: 'env2', dest: 'subLevel', amount: 0.4, enabled: true });
    s.xy = { ...s.xy, xDest: 'cutoff', yDest: 'noiseLevel' };
  }),

  preset('formant-ghost', 'FORMANT GHOST', 'VOX', (s) => {
    s.oscA = { ...s.oscA, wavetable: 'vocalFormant', wtPos: 0.3, unison: 2, detune: 0.25, blend: 0.8, level: 0.7 };
    s.noise = { enabled: true, color: 0.35, level: 0.12, pitchTrack: true };
    s.filter = { ...s.filter, mode: 'bp', cutoffHz: 700, resonance: 0.3, drive: 0.1, envAmt: 0.3 };
    s.env1 = { attackMs: 200, holdMs: 0, decayMs: 600, sustain: 0.7, releaseMs: 800, curve: 'log' };
    s.lfo2 = { ...s.lfo2, shape: 'sine', rateHz: 0.18, depth: 0.5 };
    s.matrix.push(
      { id: 'formant-ghost-r3', source: 'lfo2', dest: 'wtPosA', amount: 0.55, enabled: true },
      { id: 'formant-ghost-r4', source: 'follower', dest: 'noiseLevel', amount: 0.5, enabled: true },
    );
    s.fx.reverb = { id: 'reverb', enabled: true, params: { size: 0.85, mix: 0.45 } };
    s.xy = { ...s.xy, yDest: 'wtPosA' };
  }),

  preset('tape-whistle', 'TAPE WHISTLE', 'LEAD', (s) => {
    s.pitchEngine = { ...s.pitchEngine, glideMs: 120, vibratoSense: 0.9 };
    s.oscA = { ...s.oscA, wavetable: 'basicShapes', wtPos: 0.3, unison: 1, level: 0.75 };
    s.oscB = { ...s.oscB, enabled: true, wavetable: 'basicShapes', wtPos: 0.15, fineCents: 9, level: 0.3 };
    s.filter = { ...s.filter, mode: 'lp12', cutoffHz: 1400, resonance: 0.25, drive: 0.2 };
    s.env1 = { attackMs: 30, holdMs: 0, decayMs: 300, sustain: 0.75, releaseMs: 250, curve: 'exp' };
    s.lfo1 = { ...s.lfo1, shape: 'sine', rateHz: 5.5, depth: 0.25, delayMs: 400 };
    s.matrix.push({ id: 'tape-whistle-r3', source: 'lfo1', dest: 'pitch', amount: 0.22, enabled: true });
    s.fx.chorus = { id: 'chorus', enabled: true, params: { rate: 0.9, depth: 0.55 } };
    s.fx.delay = { id: 'delay', enabled: true, params: { timeMs: 375, feedback: 0.35, sync: true } };
  }),

  preset('drone-temple', 'DRONE TEMPLE', 'DRONE', (s) => {
    s.oscA = { ...s.oscA, wavetable: 'harmonics', wtPos: 0.6, unison: 5, detune: 0.6, blend: 0.9, level: 0.6, octave: -1 };
    s.oscB = { ...s.oscB, enabled: true, wavetable: 'analogGrit', wtPos: 0.3, unison: 3, detune: 0.5, level: 0.35, fineCents: -8 };
    s.sub = { enabled: true, shape: 'sine', level: 0.5, octave: -2 };
    s.filter = { ...s.filter, mode: 'lp24', cutoffHz: 700, resonance: 0.35, drive: 0.3, keyTrack: 0.1 };
    s.env1 = { attackMs: 1500, holdMs: 200, decayMs: 2000, sustain: 0.9, releaseMs: 3000, curve: 'log' };
    s.lfo3 = { ...s.lfo3, shape: 'sine', rateHz: 0.08, depth: 0.5, smooth: 0.6 };
    s.matrix.push({ id: 'drone-temple-r3', source: 'lfo3', dest: 'cutoff', amount: 0.4, enabled: true });
    s.fx.reverb = { id: 'reverb', enabled: true, params: { size: 0.95, mix: 0.5 } };
    s.fx.width = { id: 'width', enabled: true, params: { width: 0.7, monoBass: true } };
  }),

  preset('pluck-whistler', 'PLUCK WHISTLER', 'PLUCK', (s) => {
    s.oscA = { ...s.oscA, wavetable: 'glass', wtPos: 0.4, unison: 1, level: 0.8 };
    s.filter = { ...s.filter, mode: 'lp24', cutoffHz: 900, resonance: 0.35, drive: 0.2, envAmt: 0.6, keyTrack: 0.5 };
    s.env1 = { attackMs: 2, holdMs: 0, decayMs: 180, sustain: 0, releaseMs: 140, curve: 'exp' };
    s.env2 = { attackMs: 2, holdMs: 0, decayMs: 250, sustain: 0, releaseMs: 200, curve: 'exp' };
    s.matrix.push({ id: 'pluck-whistler-r3', source: 'env2', dest: 'wtPosA', amount: 0.5, enabled: true });
    s.fx.delay = { id: 'delay', enabled: true, params: { timeMs: 300, feedback: 0.4, sync: false } };
    s.fx.reverb = { id: 'reverb', enabled: true, params: { size: 0.4, mix: 0.2 } };
  }),

  preset('bit-bird', 'BIT BIRD', 'LEAD', (s) => {
    s.pitchEngine = { ...s.pitchEngine, trackingMode: 'fast', quantizeOn: true, scale: 'chromatic', glideMs: 10, vibratoSense: 0.2 };
    s.oscA = { ...s.oscA, wavetable: 'digitalEdge', wtPos: 0.35, unison: 1, level: 0.75, warpMode: 'mirror', warpAmt: 0.25 };
    s.filter = { ...s.filter, mode: 'lp12', cutoffHz: 1200, resonance: 0.3, drive: 0.4, envAmt: 0.3 };
    s.env1 = { attackMs: 3, holdMs: 0, decayMs: 120, sustain: 0.4, releaseMs: 90, curve: 'exp' };
    s.lfo3 = { ...s.lfo3, shape: 'sh', rateHz: 6, depth: 0.35 };
    s.matrix.push({ id: 'bit-bird-r3', source: 'lfo3', dest: 'wtPosA', amount: 0.3, enabled: true });
    s.fx.saturator = { id: 'saturator', enabled: true, params: { drive: 0.55, mix: 0.5 } };
  }),

  preset('mono-moan', 'MONO MOAN', 'LEAD', (s) => {
    s.pitchEngine = { ...s.pitchEngine, glideMs: 90, vibratoSense: 0.75 };
    s.oscA = { ...s.oscA, wavetable: 'analogGrit', wtPos: 0.45, unison: 1, level: 0.8 };
    s.oscB = { ...s.oscB, enabled: true, wavetable: 'analogGrit', wtPos: 0.2, warpMode: 'sync', warpAmt: 0.4, level: 0.4, fineCents: 5 };
    s.filter = { ...s.filter, mode: 'lp24', cutoffHz: 800, resonance: 0.45, drive: 0.4, envAmt: 0.4, keyTrack: 0.4 };
    s.env1 = { attackMs: 25, holdMs: 0, decayMs: 400, sustain: 0.85, releaseMs: 220, curve: 'exp' };
    s.fx.saturator = { id: 'saturator', enabled: true, params: { drive: 0.4, mix: 0.45 } };
    s.matrix.push({ id: 'mono-moan-r3', source: 'modWheel', dest: 'pitch', amount: 0.4, enabled: true });
  }),

  preset('glass-pad', 'GLASS PAD', 'PAD', (s) => {
    s.oscA = { ...s.oscA, wavetable: 'glass', wtPos: 0.2, unison: 3, detune: 0.35, blend: 0.85, level: 0.65 };
    s.oscB = { ...s.oscB, enabled: true, wavetable: 'glass', wtPos: 0.6, unison: 2, detune: 0.3, level: 0.18, octave: 1 };
    s.sub = { enabled: true, shape: 'sine', level: 0.3, octave: -1 };
    s.filter = { ...s.filter, mode: 'lp24', cutoffHz: 1700, resonance: 0.15, drive: 0.1, envAmt: 0.2 };
    s.env1 = { attackMs: 600, holdMs: 0, decayMs: 800, sustain: 0.75, releaseMs: 1500, curve: 'log' };
    s.lfo2 = { ...s.lfo2, shape: 'sine', rateHz: 0.25, depth: 0.4 };
    s.matrix.push({ id: 'glass-pad-r3', source: 'lfo2', dest: 'pan', amount: 0.5, enabled: true });
    s.fx.chorus = { id: 'chorus', enabled: true, params: { rate: 0.5, depth: 0.6 } };
    s.fx.reverb = { id: 'reverb', enabled: true, params: { size: 0.75, mix: 0.4 } };
    s.fx.width = { id: 'width', enabled: true, params: { width: 0.8, monoBass: true } };
  }),

  preset('acid-squeak', 'ACID SQUEAK', 'ACID', (s) => {
    s.pitchEngine = { ...s.pitchEngine, quantizeOn: true, scale: 'minor', glideMs: 55, trackingMode: 'fast' };
    s.oscA = { ...s.oscA, wavetable: 'basicShapes', wtPos: 0.55, unison: 1, level: 0.8 };
    s.filter = { ...s.filter, mode: 'lp24', cutoffHz: 380, resonance: 0.5, drive: 0.45, envAmt: 0.5, keyTrack: 0.2 };
    s.env1 = { attackMs: 3, holdMs: 0, decayMs: 250, sustain: 0.1, releaseMs: 100, curve: 'exp' };
    s.matrix.push(
      { id: 'acid-squeak-r3', source: 'env1', dest: 'cutoff', amount: 0.45, enabled: true },
      { id: 'acid-squeak-r4', source: 'lfo2', dest: 'resonance', amount: 0.3, enabled: true },
    );
    s.lfo2 = { ...s.lfo2, shape: 'saw', rateHz: 2, depth: 0.3 };
    s.fx.delay = { id: 'delay', enabled: true, params: { timeMs: 250, feedback: 0.45, sync: true } };
    s.fx.saturator = { id: 'saturator', enabled: true, params: { drive: 0.5, mix: 0.4 } };
  }),

  preset('mega-bass', 'MEGA BASS', 'BASS', (s) => {
    s.oscA = { ...s.oscA, wavetable: 'analogGrit', wtPos: 0.3, unison: 2, detune: 0.15, blend: 0, level: 0.7, octave: -1 };
    s.sub = { enabled: true, shape: 'square1', level: 1, octave: -2 };
    s.filter = { ...s.filter, mode: 'lp24', cutoffHz: 250, resonance: 0.35, drive: 0.5, envAmt: 0.5, keyTrack: 0.2 };
    s.env1 = { attackMs: 4, holdMs: 0, decayMs: 300, sustain: 0.6, releaseMs: 150, curve: 'exp' };
    s.fx.compressor = { id: 'compressor', enabled: true, params: { amount: 0.7, mix: 1 } };
    s.fx.width = { id: 'width', enabled: true, params: { width: 0, monoBass: true } };
    s.matrix.push({ id: 'mega-bass-r3', source: 'env2', dest: 'filterDrive', amount: 0.4, enabled: true });
    s.xy = { ...s.xy, xDest: 'cutoff', yDest: 'filterDrive' };
  }),

  // --- HELLA.SYNTH additions: warm, dark starting points. Weirdness lives ---
  // --- behind the knobs, not in the initial patch.                        ---

  preset('soma-pad', 'SOMA PAD', 'PAD', (s) => {
    s.oscA = { ...s.oscA, wavetable: 'analogGrit', wtPos: 0.35, unison: 4, detune: 0.3, blend: 0.8, level: 0.7 };
    s.oscB = { ...s.oscB, enabled: true, wavetable: 'basicShapes', wtPos: 0.1, unison: 2, detune: 0.25, level: 0.3 };
    s.filter = { ...s.filter, mode: 'lp24', cutoffHz: 1100, resonance: 0.2, drive: 0.2, envAmt: 0.2 };
    s.env1 = { attackMs: 320, holdMs: 0, decayMs: 500, sustain: 0.8, releaseMs: 700, curve: 'exp' };
    s.lfo2 = { ...s.lfo2, shape: 'sine', rateHz: 0.2, depth: 0.35 };
    s.matrix.push({ id: 'soma-pad-r3', source: 'lfo2', dest: 'wtPosA', amount: 0.35, enabled: true });
    s.fx.chorus = { id: 'chorus', enabled: true, params: { rate: 0.5, depth: 0.55 } };
    s.fx.reverb = { id: 'reverb', enabled: true, params: { size: 0.7, mix: 0.35 } };
  }),

  preset('dusk-keys', 'DUSK KEYS', 'KEYS', (s) => {
    s.oscA = { ...s.oscA, wavetable: 'harmonics', wtPos: 0.25, unison: 2, detune: 0.15, level: 0.75 };
    s.noise = { enabled: true, color: 0.6, level: 0.06, pitchTrack: true };
    s.filter = { ...s.filter, mode: 'lp24', cutoffHz: 1700, resonance: 0.15, drive: 0.15, envAmt: 0.35, keyTrack: 0.4 };
    s.env1 = { attackMs: 6, holdMs: 0, decayMs: 420, sustain: 0.35, releaseMs: 260, curve: 'exp' };
    s.fx.delay = { id: 'delay', enabled: true, params: { timeMs: 300, feedback: 0.3, sync: true } };
    s.fx.reverb = { id: 'reverb', enabled: true, params: { size: 0.5, mix: 0.25 } };
    s.matrix.push({ id: 'dusk-keys-r3', source: 'velocity', dest: 'cutoff', amount: 0.4, enabled: true });
  }),

  preset('rumble-engine', 'RUMBLE ENGINE', 'BASS', (s) => {
    s.oscA = { ...s.oscA, wavetable: 'basicShapes', wtPos: 0.1, unison: 2, detune: 0.2, level: 0.7, octave: -1 };
    s.sub = { enabled: true, shape: 'sine', level: 0.9, octave: -1 };
    s.filter = { ...s.filter, mode: 'lp24', cutoffHz: 320, resonance: 0.3, drive: 0.55, envAmt: 0.45, keyTrack: 0.15 };
    s.env1 = { attackMs: 8, holdMs: 0, decayMs: 350, sustain: 0.7, releaseMs: 200, curve: 'exp' };
    s.lfo3 = { ...s.lfo3, shape: 'sine', rateHz: 0.4, depth: 0.4 };
    s.matrix.push({ id: 'rumble-engine-r3', source: 'lfo3', dest: 'filterDrive', amount: 0.35, enabled: true });
    s.fx.saturator = { id: 'saturator', enabled: true, params: { drive: 0.5, mix: 0.5 } };
    s.fx.compressor = { id: 'compressor', enabled: true, params: { amount: 0.6, mix: 1 } };
  }),

  preset('velvet-strings', 'VELVET STRINGS', 'PAD', (s) => {
    s.oscA = { ...s.oscA, wavetable: 'analogGrit', wtPos: 0.2, unison: 5, detune: 0.35, blend: 0.85, level: 0.65 };
    s.oscB = { ...s.oscB, enabled: true, wavetable: 'harmonics', wtPos: 0.3, unison: 3, detune: 0.3, level: 0.3 };
    s.filter = { ...s.filter, mode: 'lp24', cutoffHz: 1600, resonance: 0.18, drive: 0.2, envAmt: 0.15 };
    s.env1 = { attackMs: 250, holdMs: 0, decayMs: 600, sustain: 0.85, releaseMs: 900, curve: 'log' };
    s.lfo1 = { ...s.lfo1, shape: 'sine', rateHz: 4.8, depth: 0.12, delayMs: 600 };
    s.matrix.push({ id: 'velvet-strings-r3', source: 'lfo1', dest: 'pitch', amount: 0.1, enabled: true });
    s.fx.chorus = { id: 'chorus', enabled: true, params: { rate: 0.4, depth: 0.5 } };
    s.fx.reverb = { id: 'reverb', enabled: true, params: { size: 0.75, mix: 0.35 } };
  }),

  preset('ghost-bell', 'GHOST BELL', 'KEYS', (s) => {
    s.oscA = { ...s.oscA, wavetable: 'glass', wtPos: 0.25, unison: 1, level: 0.75 };
    s.oscB = { ...s.oscB, enabled: true, wavetable: 'glass', wtPos: 0.5, fineCents: 6, level: 0.25 };
    s.filter = { ...s.filter, mode: 'lp24', cutoffHz: 1600, resonance: 0.2, drive: 0.1, envAmt: 0.3, keyTrack: 0.4 };
    s.env1 = { attackMs: 3, holdMs: 0, decayMs: 900, sustain: 0.15, releaseMs: 1200, curve: 'exp' };
    s.lfo2 = { ...s.lfo2, shape: 'sine', rateHz: 0.3, depth: 0.4 };
    s.matrix.push({ id: 'ghost-bell-r3', source: 'lfo2', dest: 'pan', amount: 0.45, enabled: true });
    s.fx.delay = { id: 'delay', enabled: true, params: { timeMs: 375, feedback: 0.4, sync: true } };
    s.fx.reverb = { id: 'reverb', enabled: true, params: { size: 0.8, mix: 0.4 } };
  }),

  preset('slow-burn', 'SLOW BURN', 'LEAD', (s) => {
    s.pitchEngine = { ...s.pitchEngine, glideMs: 70, vibratoSense: 0.5 };
    s.oscA = { ...s.oscA, wavetable: 'digitalEdge', wtPos: 0.3, unison: 2, detune: 0.2, warpMode: 'bend', warpAmt: 0.2, level: 0.75 };
    s.filter = { ...s.filter, mode: 'lp12', cutoffHz: 950, resonance: 0.4, drive: 0.45, envAmt: 0.35, keyTrack: 0.35 };
    s.env1 = { attackMs: 40, holdMs: 0, decayMs: 350, sustain: 0.75, releaseMs: 300, curve: 'exp' };
    s.lfo3 = { ...s.lfo3, shape: 'tri', rateHz: 0.15, depth: 0.5, smooth: 0.4 };
    s.matrix.push(
      { id: 'slow-burn-r3', source: 'lfo3', dest: 'cutoff', amount: 0.35, enabled: true },
      { id: 'slow-burn-r4', source: 'modWheel', dest: 'resonance', amount: 0.45, enabled: true },
    );
    s.fx.saturator = { id: 'saturator', enabled: true, params: { drive: 0.45, mix: 0.5 } };
    s.fx.delay = { id: 'delay', enabled: true, params: { timeMs: 280, feedback: 0.3, sync: true } };
  }),
];
