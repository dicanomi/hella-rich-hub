/*
 * DEAD AIR — Station definitions v2
 *
 * KEY CHANGE: Added anchor stations at exactly 70/80/90/100/110 MHz.
 * These are the stations users land on when clicking numbered frequencies.
 * They use tonal/drone synthesis — NO noise as primary source.
 *
 * Noise-based stations that were near numbered frequencies have been
 * moved to less prominent positions or replaced with tonal equivalents.
 *
 * Station types:
 *   "drone"  — layered oscillators, evolving, beautiful
 *   "tone"   — simpler oscillator, more defined pitch
 *   "choir"  — sine waves at harmonic intervals, vocal-like
 *   "pulse"  — rhythmic square wave, machine-like
 *   "noise"  — filtered noise (used sparingly, not near numbered freqs)
 *   "silence" — dead silent easter egg
 *   "impossible" — bespoke synthesizer at 120 MHz
 */

export type StationCategory =
  | "late-night-radio"
  | "ambient"
  | "strange"
  | "beautiful"
  | "hidden"
  | "anchor";

export interface Station {
  id: string;
  frequency: number;
  label: string;
  category: StationCategory;
  bandwidth: number;
  rarity: number;
  audioParams: AudioParams;
}

export interface AudioParams {
  type: "noise" | "tone" | "drone" | "pulse" | "choir" | "silence" | "impossible";
  baseFreq?: number;
  harmonics?: number[];
  noiseColor?: "white" | "pink" | "brown";
  filterFreq?: number;
  filterQ?: number;
  lfoRate?: number;
  lfoDepth?: number;
  reverbWet?: number;
  delayTime?: number;
  delayFeedback?: number;
  pitchDrift?: number;
  volume?: number;
  pulseRate?: number;
  description?: string;
}

export const STATIONS: Station[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  // ANCHOR STATIONS — at exactly the numbered frequencies
  // These define the sound identity when users click a number
  // ═══════════════════════════════════════════════════════════════════════════

  // 70 MHz — THEREMIN GHOST
  // Eerie, melodic, old sci-fi. Abandoned machine singing.
  {
    id: "anchor-70",
    frequency: 70.0,
    label: "THEREMIN GHOST",
    category: "anchor",
    bandwidth: 1.8,   // wide — clearly audible when clicking 70
    rarity: 0.0,      // always present
    audioParams: {
      type: "drone",
      baseFreq: 293.7,  // D4 — theremin range
      harmonics: [1, 1.618, 2, 2.718, 3.14], // golden ratio, e, pi — impossible harmonics
      filterFreq: 2000,
      filterQ: 1.5,
      lfoRate: 0.08,    // slow organic drift
      lfoDepth: 0.25,   // significant pitch wobble
      reverbWet: 0.7,
      pitchDrift: 18,   // large drift — theremin feel
      volume: 0.65,
      description: "theremin ghost — eerie melodic signal",
    },
  },

  // 80 MHz — BROKEN LANGUAGE
  // Human-like gibberish. Almost speech, never language.
  {
    id: "anchor-80",
    frequency: 80.0,
    label: "BROKEN LANGUAGE",
    category: "anchor",
    bandwidth: 1.8,
    rarity: 0.0,
    audioParams: {
      type: "choir",
      baseFreq: 196,    // G3 — vocal range
      harmonics: [1, 1.333, 1.778, 2.37, 3.16], // non-integer — "wrong" harmonics
      filterFreq: 1800,
      filterQ: 3,
      lfoRate: 1.8,     // fast modulation — syllable rhythm
      lfoDepth: 0.55,
      reverbWet: 0.6,
      pitchDrift: 12,
      volume: 0.6,
      description: "broken language — phoneme fragments",
    },
  },

  // 90 MHz — THE TIME IS NOW
  // Soft, hypnotic, dream transmission. A message meant for you.
  {
    id: "anchor-90",
    frequency: 90.0,
    label: "THE TIME IS NOW",
    category: "anchor",
    bandwidth: 1.8,
    rarity: 0.0,
    audioParams: {
      type: "drone",
      baseFreq: 174.6,  // F3 — warm, resonant
      harmonics: [1, 1.5, 2, 3, 4, 6],
      filterFreq: 1200,
      filterQ: 1.2,
      lfoRate: 0.04,    // very slow — hypnotic
      lfoDepth: 0.15,
      reverbWet: 0.9,
      delayTime: 0.45,
      delayFeedback: 0.4,
      pitchDrift: 4,
      volume: 0.6,
      description: "the time is now — dream transmission",
    },
  },

  // 100 MHz — MACHINE WEATHER
  // Mechanical pulse, rhythmic sci-fi clicking, soft bass pulses.
  {
    id: "anchor-100",
    frequency: 100.0,
    label: "MACHINE WEATHER",
    category: "anchor",
    bandwidth: 1.8,
    rarity: 0.0,
    audioParams: {
      type: "pulse",
      baseFreq: 220,    // A3 — pentatonic root
      pulseRate: 1.37,  // prime-ish rhythm
      filterFreq: 800,
      filterQ: 2,
      lfoRate: 0.06,
      lfoDepth: 0.3,
      reverbWet: 0.5,
      pitchDrift: 8,
      volume: 0.6,
      description: "machine weather — rhythmic sci-fi pulse",
    },
  },

  // 110 MHz — DREAMING MACHINE
  // Recursive harmonics, digital breathing, neural pulse rhythm.
  {
    id: "anchor-110",
    frequency: 110.0,
    label: "DREAMING MACHINE",
    category: "anchor",
    bandwidth: 1.8,
    rarity: 0.0,
    audioParams: {
      type: "drone",
      baseFreq: 137,    // prime Hz — slightly unsettling
      harmonics: [1, 1.618, 2.414, 3.732, 6.18], // golden, silver, bronze, golden²
      filterFreq: 1500,
      filterQ: 2,
      lfoRate: 0.05,
      lfoDepth: 0.4,
      reverbWet: 0.8,
      delayTime: 0.137,
      delayFeedback: 0.45,
      pitchDrift: 6,
      volume: 0.65,
      description: "dreaming machine — recursive FM harmonics",
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DISCOVERABLE STATIONS — between the anchor points
  // These reward exploration between numbered frequencies
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── 70–80 MHz zone ──────────────────────────────────────────────────────
  {
    id: "numbers-station",
    frequency: 73.9,
    label: "UVB-76",
    category: "strange",
    bandwidth: 0.4,
    rarity: 0.5,
    audioParams: {
      type: "pulse",
      baseFreq: 440,
      pulseRate: 1.2,
      filterFreq: 3500,
      filterQ: 5,
      volume: 0.6,
      description: "numbers station",
    },
  },
  {
    id: "haunting-synth",
    frequency: 74.6,
    label: "SYNTH LOOP",
    category: "beautiful",
    bandwidth: 1.0,
    rarity: 0.2,
    audioParams: {
      type: "drone",
      baseFreq: 110,
      harmonics: [1, 2, 3, 4, 5, 6, 7],
      filterFreq: 1200,
      filterQ: 2,
      lfoRate: 0.15,
      lfoDepth: 0.4,
      reverbWet: 0.8,
      pitchDrift: 1,
      volume: 0.55,
      description: "haunting synth loop",
    },
  },
  {
    id: "weather-report",
    frequency: 75.1,
    label: "WX BROADCAST",
    category: "late-night-radio",
    bandwidth: 0.6,
    rarity: 0.2,
    audioParams: {
      type: "tone",
      baseFreq: 1000,
      harmonics: [1, 1.5, 2, 3],
      filterFreq: 3000,
      filterQ: 1.2,
      lfoRate: 0.8,
      lfoDepth: 0.3,
      volume: 0.5,
      description: "weather report",
    },
  },
  {
    id: "city-hum",
    frequency: 77.8,
    label: "CITY HUM",
    category: "ambient",
    bandwidth: 1.0,
    rarity: 0.1,
    audioParams: {
      type: "drone",
      baseFreq: 60,
      harmonics: [1, 2, 3, 4, 6],
      filterFreq: 400,
      filterQ: 2,
      lfoRate: 0.08,
      lfoDepth: 0.15,
      reverbWet: 0.5,
      volume: 0.4,
      description: "distant city hum",
    },
  },
  {
    id: "tape-loop",
    frequency: 78.5,
    label: "TAPE ECHO",
    category: "beautiful",
    bandwidth: 0.9,
    rarity: 0.25,
    audioParams: {
      type: "drone",
      baseFreq: 82.4,
      harmonics: [1, 2, 4, 8],
      filterFreq: 900,
      filterQ: 1.5,
      lfoRate: 0.07,
      lfoDepth: 0.5,
      reverbWet: 0.9,
      delayTime: 0.375,
      delayFeedback: 0.6,
      pitchDrift: 0.5,
      volume: 0.5,
      description: "soft tape loop",
    },
  },
  {
    id: "self-help-guru",
    frequency: 79.3,
    label: "GURU FM",
    category: "strange",
    bandwidth: 0.5,
    rarity: 0.35,
    audioParams: {
      type: "tone",
      baseFreq: 220,
      harmonics: [1, 2, 3],
      filterFreq: 2000,
      filterQ: 1,
      lfoRate: 0.5,
      lfoDepth: 0.4,
      volume: 0.5,
      description: "fake self-help guru",
    },
  },

  // ─── 80–90 MHz zone ──────────────────────────────────────────────────────
  {
    id: "falling-asleep",
    frequency: 81.7,
    label: "NIGHT OWL",
    category: "late-night-radio",
    bandwidth: 0.7,
    rarity: 0.3,
    audioParams: {
      type: "drone",
      baseFreq: 180,
      harmonics: [1, 2, 3],
      filterFreq: 800,
      filterQ: 0.6,
      lfoRate: 0.05,
      lfoDepth: 0.2,
      reverbWet: 0.4,
      volume: 0.45,
      description: "someone falling asleep on air",
    },
  },
  {
    id: "cinematic-fragment",
    frequency: 83.1,
    label: "FRAGMENT",
    category: "beautiful",
    bandwidth: 1.2,
    rarity: 0.2,
    audioParams: {
      type: "drone",
      baseFreq: 65.4,
      harmonics: [1, 1.5, 2, 3, 4],
      filterFreq: 1500,
      filterQ: 1,
      lfoRate: 0.05,
      lfoDepth: 0.3,
      reverbWet: 0.85,
      delayTime: 0.5,
      delayFeedback: 0.4,
      volume: 0.5,
      description: "cinematic ambient fragment",
    },
  },
  {
    id: "dating-advice",
    frequency: 85.4,
    label: "LOVE LINE",
    category: "strange",
    bandwidth: 0.5,
    rarity: 0.4,
    audioParams: {
      type: "tone",
      baseFreq: 330,
      harmonics: [1, 1.5, 2],
      filterFreq: 2000,
      filterQ: 1.5,
      lfoRate: 0.4,
      lfoDepth: 0.3,
      volume: 0.45,
      description: "awkward dating advice",
    },
  },
  {
    id: "reversed-piano",
    frequency: 87.2,
    label: "REVERSED",
    category: "beautiful",
    bandwidth: 0.8,
    rarity: 0.3,
    audioParams: {
      type: "drone",
      baseFreq: 130.8,
      harmonics: [1, 2, 3, 5, 8],
      filterFreq: 2000,
      filterQ: 1.2,
      lfoRate: 0.03,
      lfoDepth: 0.6,
      reverbWet: 0.9,
      pitchDrift: 0.3,
      volume: 0.45,
      description: "reversed piano",
    },
  },
  {
    id: "existential-hotline",
    frequency: 88.9,
    label: "1-800-VOID",
    category: "strange",
    bandwidth: 0.4,
    rarity: 0.45,
    audioParams: {
      type: "tone",
      baseFreq: 330,
      harmonics: [1, 1.333, 2],
      filterFreq: 1800,
      filterQ: 2,
      lfoRate: 0.2,
      lfoDepth: 0.6,
      reverbWet: 0.5,
      volume: 0.45,
      description: "existential hotline",
    },
  },

  // ─── 90–100 MHz zone ─────────────────────────────────────────────────────
  {
    id: "airport-terminal",
    frequency: 91.8,
    label: "GATE B7",
    category: "ambient",
    bandwidth: 0.7,
    rarity: 0.15,
    audioParams: {
      type: "drone",
      baseFreq: 220,
      harmonics: [1, 1.5, 2, 3],
      filterFreq: 1500,
      filterQ: 1,
      lfoRate: 0.04,
      lfoDepth: 0.12,
      reverbWet: 0.8,
      volume: 0.35,
      description: "airport terminal loneliness",
    },
  },
  {
    id: "microwave",
    frequency: 93.2,
    label: "KITCHEN FM",
    category: "strange",
    bandwidth: 0.3,
    rarity: 0.5,
    audioParams: {
      type: "pulse",
      baseFreq: 2450,
      pulseRate: 0.5,
      filterFreq: 5000,
      filterQ: 8,
      volume: 0.4,
      description: "someone microwaving food",
    },
  },
  {
    id: "motel-ac",
    frequency: 94.8,
    label: "ROOM 12",
    category: "ambient",
    bandwidth: 0.7,
    rarity: 0.2,
    audioParams: {
      type: "drone",
      baseFreq: 120,
      harmonics: [1, 2, 4],
      filterFreq: 500,
      filterQ: 3,
      lfoRate: 0.02,
      lfoDepth: 0.05,
      reverbWet: 0.2,
      volume: 0.4,
      description: "motel air conditioner",
    },
  },
  {
    id: "voicemail",
    frequency: 96.7,
    label: "MISSED CALL",
    category: "strange",
    bandwidth: 0.5,
    rarity: 0.4,
    audioParams: {
      type: "tone",
      baseFreq: 480,
      harmonics: [1, 1.5],
      filterFreq: 3400,
      filterQ: 1,
      lfoRate: 0.08,
      lfoDepth: 0.2,
      volume: 0.5,
      description: "accidental voicemail",
    },
  },
  {
    id: "analog-drone",
    frequency: 98.3,
    label: "ANALOG DRONE",
    category: "ambient",
    bandwidth: 1.1,
    rarity: 0.15,
    audioParams: {
      type: "drone",
      baseFreq: 55,
      harmonics: [1, 1.5, 2, 3, 4, 5],
      filterFreq: 800,
      filterQ: 1.5,
      lfoRate: 0.1,
      lfoDepth: 0.3,
      reverbWet: 0.6,
      pitchDrift: 2,
      volume: 0.5,
      description: "analog drone",
    },
  },

  // ─── 100–110 MHz zone ────────────────────────────────────────────────────
  {
    id: "ghost-choir",
    frequency: 101.5,
    label: "GHOST CHOIR",
    category: "beautiful",
    bandwidth: 1.0,
    rarity: 0.35,
    audioParams: {
      type: "choir",
      baseFreq: 174.6,
      harmonics: [1, 1.25, 1.5, 2, 2.5, 3],
      filterFreq: 3000,
      filterQ: 0.8,
      lfoRate: 0.08,
      lfoDepth: 0.4,
      reverbWet: 0.95,
      pitchDrift: 1.5,
      volume: 0.5,
      description: "ghost radio choir",
    },
  },
  {
    id: "aphex-texture",
    frequency: 105.2,
    label: "TEXTURE",
    category: "beautiful",
    bandwidth: 0.9,
    rarity: 0.3,
    audioParams: {
      type: "drone",
      baseFreq: 55,
      harmonics: [1, 1.414, 2, 2.828, 4, 5.657],
      filterFreq: 2500,
      filterQ: 2,
      lfoRate: 0.12,
      lfoDepth: 0.5,
      reverbWet: 0.8,
      pitchDrift: 2,
      volume: 0.5,
      description: "Björk / Aphex-inspired texture",
    },
  },
  {
    id: "haunting-synth-2",
    frequency: 107.8,
    label: "SYNTH II",
    category: "beautiful",
    bandwidth: 0.9,
    rarity: 0.25,
    audioParams: {
      type: "drone",
      baseFreq: 146.8,
      harmonics: [1, 2, 3, 5, 8, 13],
      filterFreq: 1800,
      filterQ: 1.5,
      lfoRate: 0.09,
      lfoDepth: 0.35,
      reverbWet: 0.85,
      pitchDrift: 3,
      volume: 0.55,
      description: "haunting synth II",
    },
  },

  // ─── 110–120 MHz zone ────────────────────────────────────────────────────
  {
    id: "mysterious-voice",
    frequency: 111.3,
    label: "UNKNOWN",
    category: "hidden",
    bandwidth: 0.15,
    rarity: 0.95,
    audioParams: {
      type: "tone",
      baseFreq: 200,
      harmonics: [1, 1.5, 2, 3, 4, 5],
      filterFreq: 1000,
      filterQ: 8,
      lfoRate: 0.3,
      lfoDepth: 0.7,
      reverbWet: 0.6,
      pitchDrift: 3,
      volume: 0.55,
      description: "mysterious voice",
    },
  },
  {
    id: "clear-signal",
    frequency: 113.5,
    label: "CLEAR",
    category: "hidden",
    bandwidth: 0.2,
    rarity: 0.9,
    audioParams: {
      type: "tone",
      baseFreq: 440,
      harmonics: [1],
      filterFreq: 8000,
      filterQ: 0.5,
      reverbWet: 0.05,
      volume: 0.7,
      description: "perfectly clear signal",
    },
  },
  {
    id: "comedy-moment",
    frequency: 116.3,
    label: "HA",
    category: "hidden",
    bandwidth: 0.15,
    rarity: 0.92,
    audioParams: {
      type: "pulse",
      baseFreq: 880,
      pulseRate: 3,
      filterFreq: 2000,
      filterQ: 3,
      volume: 0.5,
      description: "bizarre comedy moment",
    },
  },
  {
    id: "dead-silent",
    frequency: 117.2,
    label: "SILENCE",
    category: "hidden",
    bandwidth: 0.1,
    rarity: 0.98,
    audioParams: {
      type: "silence",
      volume: 0,
      description: "dead silent station",
    },
  },

  // ─── 120 MHz — IMPOSSIBLE TRANSMISSION ───────────────────────────────────
  {
    id: "impossible-transmission",
    frequency: 120.0,
    label: "IMPOSSIBLE TRANSMISSION",
    category: "hidden",
    bandwidth: 0.12,
    rarity: 0.99,
    audioParams: {
      type: "impossible",
      volume: 0.62,
      description: "impossible transmission — bespoke FM synthesis",
    },
  },
];
