/**
 * ÆTHER Audio Engine
 * Design: Scandinavian Instrument Minimalism — Braun/Teenage Engineering aesthetic
 * Philosophy: "Impossible to sound bad" — all parameters are curated to always sound beautiful
 *
 * Architecture:
 * - Multiple layered oscillators (drones + pads)
 * - Harmonic protection: only uses pentatonic/modal scales
 * - Smooth parameter transitions with rampTo()
 * - Weighted randomness for beautiful results
 * - No clicks or pops — all changes crossfaded
 */

import { useCallback, useEffect, useRef, useState } from "react";
import * as Tone from "tone";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MoodName =
  | "Warm"
  | "Dark"
  | "Dream"
  | "Space"
  | "Ritual"
  | "Industrial"
  | "Ocean"
  | "Tension";

export type PresetName =
  | "Neon Fog"
  | "Empty Church"
  | "Nuclear Sunset"
  | "Midnight Drive"
  | "Distant Memory"
  | "Engine Room"
  | "Rain on Glass";

export interface SynthParams {
  mood: MoodName;
  density: number; // 0–1
  motion: number;  // 0–1
  dirt: number;    // 0–1
  space: number;   // 0–1
}

interface MoodConfig {
  rootNote: string;
  scale: number[];           // semitone intervals from root
  oscillatorTypes: OscillatorType[];
  filterFreq: number;        // Hz
  filterQ: number;
  reverbDecay: number;       // seconds
  reverbWet: number;         // 0–1
  detuneRange: number;       // cents
  baseFreq: number;          // Hz
  colorTemp: string;         // CSS hue for visualizer tint
  description: string;
}

type OscillatorType = "sine" | "triangle" | "sawtooth" | "square" | "fatsine" | "fattriangle" | "fatsawtooth";

// ─── Mood Configurations ──────────────────────────────────────────────────────
// All moods use harmonically safe scales — pentatonic, modal, or drone-based
// No dissonant intervals unless intentional (Tension uses tritone carefully)

const MOODS: Record<MoodName, MoodConfig> = {
  Warm: {
    rootNote: "C2",
    scale: [0, 7, 12, 19, 24],       // C pentatonic power — warm, open
    oscillatorTypes: ["fatsine", "fattriangle"],
    filterFreq: 800,
    filterQ: 0.7,
    reverbDecay: 6,
    reverbWet: 0.55,
    detuneRange: 8,
    baseFreq: 65.41,
    colorTemp: "#E8622A",  // brand warm orange — sunlight, energy
    description: "Warm, open, like sunlight through curtains",
  },
  Dark: {
    rootNote: "A1",
    scale: [0, 3, 7, 10, 14],         // A minor pentatonic — brooding
    oscillatorTypes: ["fatsawtooth", "fattriangle"],
    filterFreq: 400,
    filterQ: 1.2,
    reverbDecay: 9,
    reverbWet: 0.7,
    detuneRange: 12,
    baseFreq: 55,
    colorTemp: "#2E3D4F",  // brand steel navy — brooding, deep
    description: "Dark, brooding, like a storm approaching",
  },
  Dream: {
    rootNote: "E2",
    scale: [0, 4, 7, 11, 14, 16],     // E major 7 — dreamy, floating
    oscillatorTypes: ["fatsine", "fatsine"],
    filterFreq: 1200,
    filterQ: 0.5,
    reverbDecay: 12,
    reverbWet: 0.8,
    detuneRange: 6,
    baseFreq: 82.41,
    colorTemp: "#F2C14E",  // brand golden amber — dreamy, floating
    description: "Dreamy, floating, like half-sleep",
  },
  Space: {
    rootNote: "D2",
    scale: [0, 5, 7, 12, 17],         // D suspended — vast, open
    oscillatorTypes: ["fatsine", "fattriangle"],
    filterFreq: 600,
    filterQ: 0.4,
    reverbDecay: 18,
    reverbWet: 0.9,
    detuneRange: 4,
    baseFreq: 73.42,
    colorTemp: "#1E2028",  // brand dark charcoal — vast, cosmic void
    description: "Vast, cosmic, like deep space",
  },
  Ritual: {
    rootNote: "G1",
    scale: [0, 2, 5, 7, 9],           // G dorian — ancient, ceremonial
    oscillatorTypes: ["fattriangle", "fatsine"],
    filterFreq: 500,
    filterQ: 1.5,
    reverbDecay: 10,
    reverbWet: 0.65,
    detuneRange: 10,
    baseFreq: 49,
    colorTemp: "#C9383A",  // brand crimson — ancient, ceremonial fire
    description: "Ancient, ceremonial, like stone chambers",
  },
  Industrial: {
    rootNote: "B1",
    scale: [0, 3, 6, 10, 13],         // B diminished — mechanical, tense
    oscillatorTypes: ["fatsawtooth", "fatsawtooth"],
    filterFreq: 300,
    filterQ: 2.0,
    reverbDecay: 4,
    reverbWet: 0.4,
    detuneRange: 20,
    baseFreq: 61.74,
    colorTemp: "#2E3D4F",  // brand steel navy — mechanical, industrial
    description: "Mechanical, industrial, like engine rooms",
  },
  Ocean: {
    rootNote: "F2",
    scale: [0, 5, 7, 10, 12],         // F lydian — fluid, expansive
    oscillatorTypes: ["fatsine", "fattriangle"],
    filterFreq: 900,
    filterQ: 0.6,
    reverbDecay: 14,
    reverbWet: 0.75,
    detuneRange: 7,
    baseFreq: 87.31,
    colorTemp: "#E8E6D0",  // brand parchment cream — fluid, expansive
    description: "Fluid, expansive, like deep ocean",
  },
  Tension: {
    rootNote: "C#2",
    scale: [0, 1, 6, 7, 8],           // Phrygian dominant — tense but controlled
    oscillatorTypes: ["fatsawtooth", "fattriangle"],
    filterFreq: 350,
    filterQ: 1.8,
    reverbDecay: 7,
    reverbWet: 0.5,
    detuneRange: 15,
    baseFreq: 69.3,
    colorTemp: "#C9383A",  // brand crimson red — tense, cinematic
    description: "Tense, cinematic, like a thriller score",
  },
};

// ─── Preset Configurations ────────────────────────────────────────────────────

export const PRESETS: Record<PresetName, SynthParams> = {
  "Neon Fog": { mood: "Dream", density: 0.55, motion: 0.65, dirt: 0.15, space: 0.75 },
  "Empty Church": { mood: "Ritual", density: 0.3, motion: 0.2, dirt: 0.05, space: 0.9 },
  "Nuclear Sunset": { mood: "Warm", density: 0.7, motion: 0.45, dirt: 0.4, space: 0.6 },
  "Midnight Drive": { mood: "Dark", density: 0.5, motion: 0.55, dirt: 0.3, space: 0.5 },
  "Distant Memory": { mood: "Space", density: 0.35, motion: 0.35, dirt: 0.1, space: 0.95 },
  "Engine Room": { mood: "Industrial", density: 0.8, motion: 0.7, dirt: 0.7, space: 0.3 },
  "Rain on Glass": { mood: "Ocean", density: 0.45, motion: 0.8, dirt: 0.2, space: 0.7 },
};

// ─── Engine State ─────────────────────────────────────────────────────────────

interface EngineNodes {
  // Oscillator layers
  drones: Tone.OmniOscillator<any>[];
  droneGains: Tone.Gain[];
  pads: Tone.PolySynth[];
  padGain: Tone.Gain;

  // Effects chain
  filter: Tone.Filter;
  reverb: Tone.Reverb;
  delay: Tone.FeedbackDelay;
  chorus: Tone.Chorus;
  distortion: Tone.Distortion;
  bitCrusher: Tone.BitCrusher;
  masterGain: Tone.Gain;
  masterLimiter: Tone.Limiter;

  // Noise layer
  noisePlayer: Tone.Noise;
  noiseGain: Tone.Gain;
  noiseFilter: Tone.Filter;

  // LFOs
  filterLFO: Tone.LFO;
  gainLFO: Tone.LFO;
  pannerLFO: Tone.LFO;
  panner: Tone.Panner;

  // Analyser for visualizer
  analyser: Tone.Analyser;
  waveformAnalyser: Tone.Analyser;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAudioEngine() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [params, setParams] = useState<SynthParams>({
    mood: "Neon Fog" as any, // will be resolved to proper mood
    density: 0.55,
    motion: 0.65,
    dirt: 0.15,
    space: 0.75,
  });
  const [currentPreset, setCurrentPreset] = useState<PresetName>("Neon Fog");
  const [moodColor, setMoodColor] = useState("#F2C14E"); // default: Dream golden amber

  const nodes = useRef<EngineNodes | null>(null);
  const padIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const driftIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentParamsRef = useRef<SynthParams>(params);
  const currentMoodRef = useRef<MoodName>("Dream");

  // Keep ref in sync
  useEffect(() => {
    currentParamsRef.current = params;
  }, [params]);

  // ─── Build Audio Graph ──────────────────────────────────────────────────────

  const buildGraph = useCallback(async () => {
    // Dispose existing nodes
    if (nodes.current) {
      disposeGraph();
    }

    await Tone.start();
    Tone.getContext().resume();

    const mood = MOODS[currentMoodRef.current];

    // Master chain
    const masterLimiter = new Tone.Limiter(-1);
    const masterGain = new Tone.Gain(0.0); // start silent, fade in
    masterGain.connect(masterLimiter);
    masterLimiter.toDestination();

    // Dual analyser: FFT for frequency bars, waveform for the waveform line
    const analyser = new Tone.Analyser("fft", 256);
    const waveformAnalyser = new Tone.Analyser("waveform", 256);
    masterGain.connect(analyser);
    masterGain.connect(waveformAnalyser);

    // Reverb
    const reverb = new Tone.Reverb({
      decay: mood.reverbDecay,
      wet: mood.reverbWet,
      preDelay: 0.05,
    });
    await reverb.generate();

    // Filter
    const filter = new Tone.Filter({
      frequency: mood.filterFreq,
      type: "lowpass",
      Q: mood.filterQ,
    });

    // Delay
    const delay = new Tone.FeedbackDelay({
      delayTime: "8n",
      feedback: 0.3,
      wet: 0.2,
    });

    // Chorus (subtle width)
    const chorus = new Tone.Chorus({
      frequency: 0.5,
      delayTime: 3.5,
      depth: 0.4,
      wet: 0.3,
    }).start();

    // Distortion (for dirt)
    const distortion = new Tone.Distortion({
      distortion: 0.0,
      wet: 0.0,
    });

    // BitCrusher (subtle analog feel)
    const bitCrusher = new Tone.BitCrusher({ bits: 16 });

    // Panner (stereo movement)
    const panner = new Tone.Panner(0);

    // Signal chain: source → filter → chorus → distortion → bitCrusher → panner → delay → reverb → masterGain
    filter.connect(chorus);
    chorus.connect(distortion);
    distortion.connect(bitCrusher);
    bitCrusher.connect(panner);
    panner.connect(delay);
    delay.connect(reverb);
    reverb.connect(masterGain);

    // ── Drone Oscillators ──────────────────────────────────────────────────
    const drones: Tone.OmniOscillator<any>[] = [];
    const droneGains: Tone.Gain[] = [];
    const numDrones = 4;

    for (let i = 0; i < numDrones; i++) {
      const scaleNote = mood.scale[i % mood.scale.length];
      const freq = mood.baseFreq * Math.pow(2, scaleNote / 12);
      const detune = (Math.random() - 0.5) * mood.detuneRange * 2;
      const oscType = mood.oscillatorTypes[i % mood.oscillatorTypes.length];

      const osc = new Tone.OmniOscillator({
        frequency: freq,
        type: oscType,
        detune: detune,
        volume: -18,
      });

      const gain = new Tone.Gain(0);
      osc.connect(gain);
      gain.connect(filter);
      osc.start();

      drones.push(osc);
      droneGains.push(gain);
    }

    // ── Pad Synth ──────────────────────────────────────────────────────────
    const padGain = new Tone.Gain(0);
    padGain.connect(filter);

    const pads = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "fatsine", count: 3, spread: 20 },
      envelope: {
        attack: 3.0,
        decay: 2.0,
        sustain: 0.8,
        release: 6.0,
      },
      volume: -12,
    });
    pads.connect(padGain);

    // ── Noise Layer ────────────────────────────────────────────────────────
    const noiseFilter = new Tone.Filter({
      frequency: 2000,
      type: "lowpass",
      Q: 0.5,
    });
    const noiseGain = new Tone.Gain(0);
    const noisePlayer = new Tone.Noise("pink");
    noisePlayer.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(filter);
    noisePlayer.start();

    // ── LFOs ───────────────────────────────────────────────────────────────
    const filterLFO = new Tone.LFO({
      frequency: 0.05,
      min: mood.filterFreq * 0.5,
      max: mood.filterFreq * 2.0,
      type: "sine",
    });
    filterLFO.connect(filter.frequency);
    filterLFO.start();

    const gainLFO = new Tone.LFO({
      frequency: 0.08,
      min: 0.7,
      max: 1.0,
      type: "sine",
    });
    gainLFO.connect(masterGain.gain);
    gainLFO.start();

    const pannerLFO = new Tone.LFO({
      frequency: 0.03,
      min: -0.3,
      max: 0.3,
      type: "sine",
    });
    pannerLFO.connect(panner.pan);
    pannerLFO.start();

    nodes.current = {
      drones,
      droneGains,
      pads: [pads],
      padGain,
      filter,
      reverb,
      delay,
      chorus,
      distortion,
      bitCrusher,
      masterGain,
      masterLimiter,
      noisePlayer,
      noiseGain,
      noiseFilter,
      filterLFO,
      gainLFO,
      pannerLFO,
      panner,
      analyser,
      waveformAnalyser,
    };

    return nodes.current;
  }, []);

  // ─── Dispose Graph ──────────────────────────────────────────────────────────

  const disposeGraph = useCallback(() => {
    if (!nodes.current) return;
    const n = nodes.current;

    // Stop intervals
    if (padIntervalRef.current) clearInterval(padIntervalRef.current);
    if (driftIntervalRef.current) clearInterval(driftIntervalRef.current);

    // Stop and dispose
    try {
      n.filterLFO.stop().dispose();
      n.gainLFO.stop().dispose();
      n.pannerLFO.stop().dispose();
      n.drones.forEach((d) => { try { d.stop().dispose(); } catch {} });
      n.droneGains.forEach((g) => { try { g.dispose(); } catch {} });
      n.pads.forEach((p) => { try { p.dispose(); } catch {} });
      n.padGain.dispose();
      n.noisePlayer.stop().dispose();
      n.noiseGain.dispose();
      n.noiseFilter.dispose();
      n.filter.dispose();
      n.reverb.dispose();
      n.delay.dispose();
      n.chorus.dispose();
      n.distortion.dispose();
      n.bitCrusher.dispose();
      n.panner.dispose();
      n.masterGain.dispose();
      n.masterLimiter.dispose();
      n.analyser.dispose();
      n.waveformAnalyser.dispose();
    } catch (e) {
      // Ignore disposal errors
    }
    nodes.current = null;
  }, []);

  // ─── Apply Parameters ───────────────────────────────────────────────────────

  const applyParams = useCallback((p: SynthParams, immediate = false) => {
    if (!nodes.current) return;
    const n = nodes.current;
    const mood = MOODS[currentMoodRef.current];
    const rampTime = immediate ? 0.05 : 1.2;

    // ── Density: controls how many drone layers are active ──────────────
    const activeDrones = Math.max(1, Math.round(p.density * n.drones.length));
    n.droneGains.forEach((g, i) => {
      const targetGain = i < activeDrones ? 0.6 + (i * 0.1) : 0;
      g.gain.rampTo(targetGain, rampTime);
    });

    // Pad volume based on density
    const padVol = p.density > 0.4 ? (p.density - 0.4) * 1.5 : 0;
    n.padGain.gain.rampTo(padVol * 0.8, rampTime);

    // ── Motion: LFO rates and depths ────────────────────────────────────
    const filterLFORate = 0.02 + p.motion * 0.15;
    const gainLFORate = 0.03 + p.motion * 0.1;
    const panLFORate = 0.01 + p.motion * 0.08;

    n.filterLFO.frequency.rampTo(filterLFORate, rampTime);
    n.gainLFO.frequency.rampTo(gainLFORate, rampTime);
    n.pannerLFO.frequency.rampTo(panLFORate, rampTime);

    // Filter LFO range expands with motion
    const filterMin = mood.filterFreq * (0.3 + p.motion * 0.4);
    const filterMax = mood.filterFreq * (1.0 + p.motion * 3.0);
    n.filterLFO.min = filterMin;
    n.filterLFO.max = filterMax;

    // ── Dirt: distortion + noise ─────────────────────────────────────────
    const distAmt = p.dirt * 0.5;
    n.distortion.distortion = distAmt;
    n.distortion.wet.rampTo(p.dirt * 0.6, rampTime);

    // Noise gain (tape hiss)
    const noiseVol = p.dirt * 0.08;
    n.noiseGain.gain.rampTo(noiseVol, rampTime);

    // Bit depth (subtle analog degradation)
    const bits = Math.round(16 - p.dirt * 6); // 16 → 10 bits
    n.bitCrusher.bits.value = Math.max(10, bits);

    // ── Space: reverb wet + delay ────────────────────────────────────────
    const reverbWet = mood.reverbWet * (0.3 + p.space * 0.7);
    n.reverb.wet.rampTo(reverbWet, rampTime * 2); // reverb transitions slower

    const delayWet = p.space * 0.4;
    n.delay.wet.rampTo(delayWet, rampTime);

    const delayFeedback = 0.1 + p.space * 0.5;
    n.delay.feedback.rampTo(delayFeedback, rampTime);

    // ── Master gain (overall volume) ─────────────────────────────────────
    const masterVol = 0.7 + p.density * 0.3;
    // gainLFO modulates this, so we set the base
    n.gainLFO.min = masterVol * 0.85;
    n.gainLFO.max = masterVol;

  }, []);

  // ─── Pad Chord Scheduler ────────────────────────────────────────────────────

  const schedulePads = useCallback(() => {
    if (!nodes.current) return;
    const n = nodes.current;

    const playChord = () => {
      if (!nodes.current) return;
      const p = currentParamsRef.current;
      const mood = MOODS[currentMoodRef.current];

      if (p.density < 0.35) return; // too sparse for pads

      // Pick 2-3 harmonically safe notes from the scale
      const numNotes = p.density > 0.6 ? 3 : 2;
      const notes: string[] = [];
      const usedIndices = new Set<number>();

      for (let i = 0; i < numNotes; i++) {
        let scaleIdx: number;
        let attempts = 0;
        do {
          scaleIdx = Math.floor(Math.random() * mood.scale.length);
          attempts++;
        } while (usedIndices.has(scaleIdx) && attempts < 10);
        usedIndices.add(scaleIdx);

        const semitone = mood.scale[scaleIdx];
        // Use octave 3 for lower notes, 4 for higher
        const octave = semitone < 12 ? 3 : 4;
        const noteInOctave = semitone % 12;
        const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        notes.push(`${noteNames[noteInOctave]}${octave}`);
      }

      const duration = 5 + p.density * 10; // 5–15 seconds
      try {
        n.pads[0].triggerAttackRelease(notes, duration);
      } catch (e) {
        // Ignore if context is suspended
      }
    };

    // Delay first chord slightly to avoid click on start
    setTimeout(playChord, 800);

    const interval = setInterval(() => {
      playChord();
    }, 7000 + (1 - currentParamsRef.current.density) * 8000);

    padIntervalRef.current = interval;
  }, []);

  // ─── Oscillator Drift ───────────────────────────────────────────────────────

  const scheduleDrift = useCallback(() => {
    if (!nodes.current) return;
    const n = nodes.current;

    const drift = () => {
      if (!nodes.current) return;
      const p = currentParamsRef.current;
      const mood = MOODS[currentMoodRef.current];

      n.drones.forEach((osc, i) => {
        const driftAmount = mood.detuneRange * (0.5 + p.dirt * 0.5);
        const newDetune = (Math.random() - 0.5) * driftAmount * 2;
        osc.detune.rampTo(newDetune, 3 + Math.random() * 4);
      });
    };

    driftIntervalRef.current = setInterval(drift, 4000 + Math.random() * 3000);
  }, []);

  // ─── Start ──────────────────────────────────────────────────────────────────

  const start = useCallback(async (initialParams?: SynthParams) => {
    setIsLoading(true);

    const p = initialParams || currentParamsRef.current;
    const moodName = (p as any).mood as MoodName;
    currentMoodRef.current = moodName;

    const n = await buildGraph();
    setMoodColor(MOODS[moodName].colorTemp);

    // Apply initial parameters (immediate)
    applyParams(p, true);

    // Fade in master gain
    n.masterGain.gain.rampTo(0.85, 2.5);

    // Schedule pad chords
    schedulePads();

    // Schedule oscillator drift
    scheduleDrift();

    setIsLoading(false);
    setIsPlaying(true);
  }, [buildGraph, applyParams, schedulePads, scheduleDrift]);

  // ─── Stop ───────────────────────────────────────────────────────────────────

  const stop = useCallback(() => {
    if (!nodes.current) return;

    // Fade out
    nodes.current.masterGain.gain.rampTo(0, 1.5);

    setTimeout(() => {
      disposeGraph();
      setIsPlaying(false);
    }, 1600);
  }, [disposeGraph]);

  // ─── Update Params ──────────────────────────────────────────────────────────

  const updateParams = useCallback((newParams: Partial<SynthParams>) => {
    setParams((prev) => {
      const updated = { ...prev, ...newParams };
      currentParamsRef.current = updated;

      // Handle mood change
      const newMood = newParams.mood as MoodName | undefined;
      if (newMood && newMood !== currentMoodRef.current) {
        currentMoodRef.current = newMood;
        setMoodColor(MOODS[newMood].colorTemp);

        if (nodes.current) {
          const mood = MOODS[newMood];
          const n = nodes.current;

          // Transition filter frequency
          n.filter.frequency.rampTo(mood.filterFreq, 2.0);
          n.filter.Q.rampTo(mood.filterQ, 2.0);

          // Transition reverb (can't ramp decay, but can ramp wet)
          n.reverb.wet.rampTo(mood.reverbWet * (0.3 + updated.space * 0.7), 2.5);

          // Re-tune drones to new scale
          n.drones.forEach((osc, i) => {
            const scaleNote = mood.scale[i % mood.scale.length];
            const freq = mood.baseFreq * Math.pow(2, scaleNote / 12);
            osc.frequency.rampTo(freq, 3.0);
          });

          // Update LFO ranges
          n.filterLFO.min = mood.filterFreq * 0.5;
          n.filterLFO.max = mood.filterFreq * 2.0;

          // Clear and reschedule pads
          if (padIntervalRef.current) clearInterval(padIntervalRef.current);
          setTimeout(() => schedulePads(), 500);
        }
      }

      // Apply all other params
      if (nodes.current) {
        applyParams(updated);
      }

      return updated;
    });
  }, [applyParams, schedulePads]);

  // ─── Load Preset ────────────────────────────────────────────────────────────

  const loadPreset = useCallback(async (presetName: PresetName) => {
    const preset = PRESETS[presetName];
    setCurrentPreset(presetName);

    if (isPlaying && nodes.current) {
      // Smooth crossfade to new preset
      const n = nodes.current;

      // Fade out slightly
      n.masterGain.gain.rampTo(0.3, 0.8);

      setTimeout(async () => {
        currentMoodRef.current = preset.mood;
        setMoodColor(MOODS[preset.mood].colorTemp);

        // Rebuild graph for new mood
        const newNodes = await buildGraph();
        applyParams(preset, true);
        newNodes.masterGain.gain.rampTo(0.85, 1.5);

        if (padIntervalRef.current) clearInterval(padIntervalRef.current);
        if (driftIntervalRef.current) clearInterval(driftIntervalRef.current);
        schedulePads();
        scheduleDrift();

        setParams(preset);
        currentParamsRef.current = preset;
      }, 900);
    } else {
      setParams(preset);
      currentParamsRef.current = preset;
    }
  }, [isPlaying, buildGraph, applyParams, schedulePads, scheduleDrift]);

  // ─── New World (random beautiful preset) ────────────────────────────────────

  const newWorld = useCallback(async () => {
    // Weighted random preset selection (biased toward more beautiful ones)
    const weights: Record<PresetName, number> = {
      "Neon Fog": 1.5,
      "Empty Church": 1.3,
      "Nuclear Sunset": 1.2,
      "Midnight Drive": 1.4,
      "Distant Memory": 1.6,
      "Engine Room": 0.7,
      "Rain on Glass": 1.5,
    };

    const presetNames = Object.keys(PRESETS) as PresetName[];
    const totalWeight = presetNames.reduce((sum, name) => sum + weights[name], 0);
    let random = Math.random() * totalWeight;

    let selected: PresetName = "Neon Fog";
    for (const name of presetNames) {
      random -= weights[name];
      if (random <= 0) {
        selected = name;
        break;
      }
    }

    // Also randomize within the preset slightly
    const base = PRESETS[selected];
    const jitter = (v: number, range: number) =>
      Math.max(0, Math.min(1, v + (Math.random() - 0.5) * range));

    const randomized: SynthParams = {
      mood: base.mood,
      density: jitter(base.density, 0.2),
      motion: jitter(base.motion, 0.2),
      dirt: jitter(base.dirt, 0.15),
      space: jitter(base.space, 0.15),
    };

    await loadPreset(selected);
    setTimeout(() => updateParams(randomized), 1200);
  }, [loadPreset, updateParams]);

  // ─── Get Analyser Data ──────────────────────────────────────────────────────

  // FFT data for frequency bars
  const getAnalyserData = useCallback((): Float32Array | null => {
    if (!nodes.current) return null;
    return nodes.current.analyser.getValue() as Float32Array;
  }, []);

  // Waveform data for the waveform line
  const getWaveformData = useCallback((): Float32Array | null => {
    if (!nodes.current) return null;
    return nodes.current.waveformAnalyser.getValue() as Float32Array;
  }, []);

  // ─── Cleanup ────────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      disposeGraph();
    };
  }, [disposeGraph]);

  return {
    isPlaying,
    isLoading,
    params,
    currentPreset,
    moodColor,
    moods: Object.keys(MOODS) as MoodName[],
    presets: Object.keys(PRESETS) as PresetName[],
    moodDescription: MOODS[currentMoodRef.current]?.description || "",
    start,
    stop,
    updateParams,
    loadPreset,
    newWorld,
    getAnalyserData,
    getWaveformData,
  };
}
