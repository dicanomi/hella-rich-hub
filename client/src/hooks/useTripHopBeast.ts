/**
 * TRIPHOP BEAST — Generative cinematic percussion & texture layer
 *
 * Philosophy: "Impossible to sound bad… but now slightly haunted."
 *
 * All sound is generated in real-time using Tone.js synthesis.
 * No samples. No loops. No copyrighted material.
 * Pure synthesis of emotional texture.
 *
 * Sonic DNA:
 * - Slow broken beats (68–92 BPM range, human swing)
 * - Dusty analog texture (noise + filtering)
 * - Vinyl grit (bit reduction, saturation)
 * - Deep sub bass pulse (sine LFO)
 * - Ghost percussion (membrane synth, filtered noise hits)
 * - Granular-style reverse textures (pitch-shifted noise bursts)
 * - Soft compression warmth
 *
 * Architecture:
 * ┌─ Sub Bass Pulse ─────────────────────────────────────────────┐
 * │  Slow sine oscillator, LFO-modulated, very low frequency     │
 * ├─ Ghost Kick ─────────────────────────────────────────────────┤
 * │  MembraneSynth, low pitch, long decay, swung timing          │
 * ├─ Dusty Snare ────────────────────────────────────────────────┤
 * │  NoiseSynth + bandpass filter, soft envelope                 │
 * ├─ Ghost Hats ─────────────────────────────────────────────────┤
 * │  Filtered white noise bursts, very quiet, irregular timing   │
 * ├─ Vinyl Texture ──────────────────────────────────────────────┤
 * │  Pink noise + heavy LP filter + subtle crackle               │
 * └─ Tension Pulse ──────────────────────────────────────────────┘
 *    Slow LFO-modulated filtered noise swell
 */

import * as Tone from "tone";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MoodName } from "./useAetherAudio";

// BPM per mood — slow, human, never aggressive
const MOOD_BPM: Record<MoodName, number> = {
  Warm:       76,
  Dark:       68,
  Dream:      72,
  Space:      70,
  Ritual:     74,
  Industrial: 88,
  Ocean:      72,
  Tension:    82,
};

// Swing amount per mood (0 = straight, 1 = max swing)
const MOOD_SWING: Record<MoodName, number> = {
  Warm:       0.55,
  Dark:       0.65,
  Dream:      0.70,
  Space:      0.60,
  Ritual:     0.50,
  Industrial: 0.35,
  Ocean:      0.68,
  Tension:    0.45,
};

interface BeastNodes {
  // Sub bass
  subOsc: Tone.Oscillator;
  subGain: Tone.Gain;
  subFilter: Tone.Filter;
  subLFO: Tone.LFO;

  // Ghost kick
  kick: Tone.MembraneSynth;
  kickGain: Tone.Gain;

  // Dusty snare
  snare: Tone.NoiseSynth;
  snareFilter: Tone.Filter;
  snareGain: Tone.Gain;

  // Ghost hats
  hat: Tone.NoiseSynth;
  hatFilter: Tone.Filter;
  hatGain: Tone.Gain;

  // Vinyl texture
  vinyl: Tone.Noise;
  vinylFilter: Tone.Filter;
  vinylGain: Tone.Gain;

  // Master
  compressor: Tone.Compressor;
  masterGain: Tone.Gain;

  // Sequences
  sequences: Tone.Sequence[];
}

export function useTripHopBeast() {
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const nodesRef = useRef<BeastNodes | null>(null);
  const currentMoodRef = useRef<MoodName>("Dream");
  const masterGainRef = useRef(0);

  // ─── Build the beast ─────────────────────────────────────────────────────────

  const buildBeast = useCallback(async (mood: MoodName) => {
    const bpm = MOOD_BPM[mood];
    const swing = MOOD_SWING[mood];

    // Set Tone.js transport
    Tone.getTransport().bpm.value = bpm;
    Tone.getTransport().swing = swing;
    Tone.getTransport().swingSubdivision = "8n";

    // ── Master chain ──────────────────────────────────────────────────────
    const masterGain = new Tone.Gain(0); // fade in
    const compressor = new Tone.Compressor({
      threshold: -18,
      knee: 12,
      ratio: 4,
      attack: 0.08,
      release: 0.4,
    });
    masterGain.connect(compressor);
    compressor.toDestination();

    // ── Sub bass pulse ────────────────────────────────────────────────────
    // Very low sine, LFO-modulated for breathing pulse
    const subFilter = new Tone.Filter({ frequency: 80, type: "lowpass", Q: 0.8 });
    const subGain = new Tone.Gain(0.7);
    const subOsc = new Tone.Oscillator({ frequency: 40, type: "sine", volume: -8 });
    const subLFO = new Tone.LFO({ frequency: bpm / 240, min: 30, max: 55, type: "sine" });

    subOsc.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(masterGain);
    subLFO.connect(subOsc.frequency);
    subOsc.start();
    subLFO.start();

    // ── Ghost kick ────────────────────────────────────────────────────────
    const kickGain = new Tone.Gain(0.6);
    const kick = new Tone.MembraneSynth({
      pitchDecay: 0.08,
      octaves: 6,
      envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.2 },
      volume: -10,
    });
    kick.connect(kickGain);
    kickGain.connect(masterGain);

    // ── Dusty snare ───────────────────────────────────────────────────────
    const snareFilter = new Tone.Filter({ frequency: 1800, type: "bandpass", Q: 2 });
    const snareGain = new Tone.Gain(0.4);
    const snare = new Tone.NoiseSynth({
      noise: { type: "pink" },
      envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.05 },
      volume: -14,
    });
    snare.connect(snareFilter);
    snareFilter.connect(snareGain);
    snareGain.connect(masterGain);

    // ── Ghost hats ────────────────────────────────────────────────────────
    const hatFilter = new Tone.Filter({ frequency: 6000, type: "highpass", Q: 1 });
    const hatGain = new Tone.Gain(0.25);
    const hat = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.02 },
      volume: -22,
    });
    hat.connect(hatFilter);
    hatFilter.connect(hatGain);
    hatGain.connect(masterGain);

    // ── Vinyl texture ─────────────────────────────────────────────────────
    const vinylFilter = new Tone.Filter({ frequency: 3500, type: "lowpass", Q: 0.5 });
    const vinylGain = new Tone.Gain(0.15);
    const vinyl = new Tone.Noise({ type: "pink", volume: -28 });
    vinyl.connect(vinylFilter);
    vinylFilter.connect(vinylGain);
    vinylGain.connect(masterGain);
    vinyl.start();

    // ── Sequences ─────────────────────────────────────────────────────────
    // All patterns are generative and probabilistic — never the same twice
    // Inspired by broken/human feel, not programmatic perfection

    const sequences: Tone.Sequence[] = [];

    // Kick pattern — slow, heavy, swung
    // 1 = hit, 0 = rest, 0.5 = ghost hit
    const kickPattern = [1, 0, 0, 0,   0, 0, 0.4, 0,   0, 0, 1, 0,   0, 0.3, 0, 0];
    const kickSeq = new Tone.Sequence((time, vel) => {
      if (vel > 0 && Math.random() > 0.08) { // slight probability of drop for human feel
        const pitch = 40 + (vel < 1 ? 8 : 0); // ghost hits are higher
        const volume = vel < 1 ? -18 : -10;
        kick.triggerAttackRelease(pitch, "8n", time);
      }
    }, kickPattern, "8n");
    kickSeq.start(0);
    sequences.push(kickSeq);

    // Snare pattern — on 3 (half-time feel), with occasional ghost
    const snarePattern = [0, 0, 0, 0,   0, 0, 1, 0,   0, 0, 0, 0,   0, 0, 0.5, 0];
    const snareSeq = new Tone.Sequence((time, vel) => {
      if (vel > 0 && Math.random() > 0.05) {
        snare.triggerAttackRelease("16n", time);
      }
    }, snarePattern, "8n");
    snareSeq.start(0);
    sequences.push(snareSeq);

    // Hat pattern — very sparse, irregular, ghostly
    // Probability-based so it never repeats exactly
    const hatPattern = [0, 0.3, 0, 0.2,   0, 0, 0.4, 0,   0, 0.2, 0, 0,   0.3, 0, 0, 0.2];
    const hatSeq = new Tone.Sequence((time, prob) => {
      if (prob > 0 && Math.random() < prob) {
        hat.triggerAttackRelease("32n", time);
      }
    }, hatPattern, "8n");
    hatSeq.start(0);
    sequences.push(hatSeq);

    return {
      subOsc, subGain, subFilter, subLFO,
      kick, kickGain,
      snare, snareFilter, snareGain,
      hat, hatFilter, hatGain,
      vinyl, vinylFilter, vinylGain,
      compressor, masterGain,
      sequences,
    };
  }, []);

  // ─── Dispose ─────────────────────────────────────────────────────────────────

  const disposeBeast = useCallback(() => {
    if (!nodesRef.current) return;
    const n = nodesRef.current;

    n.sequences.forEach(s => { try { s.stop(); s.dispose(); } catch {} });
    Tone.getTransport().stop();

    try {
      n.subOsc.stop().dispose();
      n.subLFO.stop().dispose();
      n.subFilter.dispose();
      n.subGain.dispose();
      n.kick.dispose();
      n.kickGain.dispose();
      n.snare.dispose();
      n.snareFilter.dispose();
      n.snareGain.dispose();
      n.hat.dispose();
      n.hatFilter.dispose();
      n.hatGain.dispose();
      n.vinyl.stop().dispose();
      n.vinylFilter.dispose();
      n.vinylGain.dispose();
      n.compressor.dispose();
      n.masterGain.dispose();
    } catch {}

    nodesRef.current = null;
  }, []);

  // ─── Toggle ──────────────────────────────────────────────────────────────────

  const toggle = useCallback(async (mood: MoodName) => {
    if (isActive) {
      // Fade out then stop
      if (nodesRef.current) {
        nodesRef.current.masterGain.gain.rampTo(0, 1.5);
        setTimeout(() => {
          disposeBeast();
          setIsActive(false);
        }, 1600);
      }
    } else {
      setIsLoading(true);
      await Tone.start();

      const nodes = await buildBeast(mood);
      nodesRef.current = nodes;

      // Fade in
      nodes.masterGain.gain.rampTo(0.75, 2.0);

      // Start transport
      Tone.getTransport().start();

      setIsLoading(false);
      setIsActive(true);
    }
  }, [isActive, buildBeast, disposeBeast]);

  // ─── Update mood ─────────────────────────────────────────────────────────────

  const updateMood = useCallback((mood: MoodName) => {
    currentMoodRef.current = mood;
    if (!nodesRef.current || !isActive) return;

    const bpm = MOOD_BPM[mood];
    const swing = MOOD_SWING[mood];

    // Smoothly transition BPM
    Tone.getTransport().bpm.rampTo(bpm, 4.0);
    Tone.getTransport().swing = swing;

    // Adjust sub bass frequency for mood
    const subFreqs: Record<MoodName, number> = {
      Warm: 42, Dark: 35, Dream: 38, Space: 32,
      Ritual: 40, Industrial: 50, Ocean: 38, Tension: 45,
    };
    nodesRef.current.subOsc.frequency.rampTo(subFreqs[mood], 3.0);
    nodesRef.current.subLFO.min = subFreqs[mood] - 8;
    nodesRef.current.subLFO.max = subFreqs[mood] + 12;
  }, [isActive]);

  // ─── Cleanup ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => { disposeBeast(); };
  }, [disposeBeast]);

  return { isActive, isLoading, toggle, updateMood };
}
