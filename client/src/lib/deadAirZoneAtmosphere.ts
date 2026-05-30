/*
 * DEAD AIR — Zone Atmosphere Synthesizer v3
 *
 * 5 immediately distinct, beautiful, eerie sonic identities.
 * Each zone is clearly audible and dramatically different from the others.
 * Zones crossfade smoothly as the dial rotates.
 *
 *  70 MHz — THEREMIN GHOST
 *           Evolving theremin-like tone, pitch drifts organically, soft vibrato.
 *           Beautiful unease. Abandoned machine singing.
 *
 *  80 MHz — BROKEN HUMAN LANGUAGE
 *           Phoneme fragments, half-words, strange cadence, layered whispers.
 *           Almost understandable. Human but wrong.
 *
 *  90 MHz — THE TIME IS NOW
 *           Synthesized voice-like loop saying "the time is now" — soft, hypnotic.
 *           Dream transmission. A message meant for you.
 *
 * 100 MHz — MACHINE WEATHER
 *           Soft tonal pulses, radio chirps, distant synthetic winds.
 *           Natural but impossible. Weather from another planet.
 *
 * 110 MHz — DREAMING MACHINE
 *           Recursive modulation, synthetic humming, neural pulse rhythm.
 *           Beautiful and intelligent. A machine dreaming in public.
 *
 * KEY CHANGE vs v2:
 * - Zone gain raised to 0.55 max (was 0.35) — clearly audible
 * - Static layer is suppressed when near a zone center (handled in useAudioEngine)
 * - Each synthesizer has a dramatically different timbre and rhythm
 * - Zones fade in over ±7 MHz with a smooth cubic curve
 */

const ZONES = [
  { freq: 70,  name: "theremin-ghost" },
  { freq: 80,  name: "broken-language" },
  { freq: 90,  name: "time-is-now" },
  { freq: 100, name: "machine-weather" },
  { freq: 110, name: "dreaming-machine" },
] as const;

type ZoneName = typeof ZONES[number]["name"];

interface ZoneNodes {
  gainNode: GainNode;
  cleanup: () => void;
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function osc(ctx: AudioContext, type: OscillatorType, freq: number): OscillatorNode {
  const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq; return o;
}

function lfo(ctx: AudioContext, rate: number, depth: number, target: AudioParam): OscillatorNode {
  const l = osc(ctx, "sine", rate);
  const g = ctx.createGain(); g.gain.value = depth;
  l.connect(g); g.connect(target); l.start(); return l;
}

function noiseLoop(ctx: AudioContext, sec = 3): AudioBufferSourceNode {
  const n = Math.floor(ctx.sampleRate * sec);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  // Pink noise
  let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
  for (let i = 0; i < n; i++) {
    const w = Math.random()*2-1;
    b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759;
    b2=0.96900*b2+w*0.1538520; b3=0.86650*b3+w*0.3104856;
    b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980;
    d[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11; b6=w*0.115926;
  }
  const fade = Math.floor(ctx.sampleRate * 0.05);
  for (let i = 0; i < fade; i++) { const t=i/fade; d[i]*=t; d[n-1-i]*=t; }
  const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true; return src;
}

// ─── 70 MHz — THEREMIN GHOST ──────────────────────────────────────────────────
// An evolving theremin-like tone that drifts organically.
// Beautiful unease — like an abandoned machine singing.
function buildThereminGhost(ctx: AudioContext, dest: AudioNode): ZoneNodes {
  const gain = ctx.createGain(); gain.gain.value = 0; gain.connect(dest);
  const srcs: OscillatorNode[] = [];

  // Primary theremin tone — sine wave at ~300 Hz (theremin range)
  const primary = osc(ctx, "sine", 293.7);
  const primaryG = ctx.createGain(); primaryG.gain.value = 0.28;
  primary.connect(primaryG); primaryG.connect(gain); primary.start(); srcs.push(primary);

  // Slow organic pitch drift — the key to theremin feel
  lfo(ctx, 0.08, 18, primary.frequency);    // slow wide drift
  lfo(ctx, 0.31, 4.5, primary.frequency);   // faster vibrato
  lfo(ctx, 0.017, 35, primary.frequency);   // very slow wander

  // Second harmonic — slightly detuned for beating effect
  const second = osc(ctx, "sine", 587.3); // ~octave, slightly sharp
  const secondG = ctx.createGain(); secondG.gain.value = 0.12;
  second.connect(secondG); secondG.connect(gain); second.start(); srcs.push(second);
  lfo(ctx, 0.11, 8, second.frequency);

  // "Impossible harmonic" — non-integer ratio creates eerie shimmer
  const ghost = osc(ctx, "sine", 293.7 * 2.718); // e × fundamental
  const ghostG = ctx.createGain(); ghostG.gain.value = 0.06;
  ghost.connect(ghostG); ghostG.connect(gain); ghost.start(); srcs.push(ghost);
  lfo(ctx, 0.04, 12, ghost.frequency);

  // Amplitude breathing — the machine breathes
  lfo(ctx, 0.09, 0.08, primaryG.gain);
  lfo(ctx, 0.13, 0.04, secondG.gain);

  // Very subtle reverb via delay
  const delay = ctx.createDelay(1); delay.delayTime.value = 0.22;
  const fb = ctx.createGain(); fb.gain.value = 0.35;
  const delayG = ctx.createGain(); delayG.gain.value = 0.15;
  primaryG.connect(delay); delay.connect(fb); fb.connect(delay);
  delay.connect(delayG); delayG.connect(gain);

  return {
    gainNode: gain,
    cleanup: () => { srcs.forEach(s => { try { s.stop(); } catch {} }); gain.disconnect(); }
  };
}

// ─── 80 MHz — BROKEN HUMAN LANGUAGE ──────────────────────────────────────────
// Phoneme fragments, half-words, strange cadence.
// Almost understandable. Human but wrong.
function buildBrokenLanguage(ctx: AudioContext, dest: AudioNode): ZoneNodes {
  const gain = ctx.createGain(); gain.gain.value = 0; gain.connect(dest);
  const srcs: OscillatorNode[] = [];
  const timers: ReturnType<typeof setTimeout>[] = [];

  // Vocal fundamental — sawtooth at speaking pitch (~140 Hz)
  const vocal = osc(ctx, "sawtooth", 140);
  const vocalG = ctx.createGain(); vocalG.gain.value = 0;
  vocal.connect(vocalG); vocalG.connect(gain); vocal.start(); srcs.push(vocal);

  // 4 formant bandpass filters — simulate vowel sounds
  const formantFreqs = [730, 1090, 2440, 3400];
  const formantNodes = formantFreqs.map(f => {
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass";
    bp.frequency.value = f; bp.Q.value = 5;
    vocal.connect(bp); bp.connect(vocalG);
    return bp;
  });

  // Animate formants — creates vowel morphing
  formantNodes.forEach((bp, i) => {
    lfo(ctx, 1.2 + i * 0.7, formantFreqs[i] * 0.4, bp.frequency);
  });

  // "Syllable" rhythm — gate the vocal with irregular amplitude envelope
  const syllable = () => {
    const now = ctx.currentTime;
    const amp = 0.18 + Math.random() * 0.14;
    const dur = 0.06 + Math.random() * 0.18; // syllable length
    vocalG.gain.setValueAtTime(amp, now);
    vocalG.gain.exponentialRampToValueAtTime(0.001, now + dur);
    // Pitch inflection — rises or falls like speech
    const inflect = (Math.random() - 0.5) * 40;
    vocal.frequency.setValueAtTime(140 + Math.random() * 20, now);
    vocal.frequency.linearRampToValueAtTime(140 + inflect, now + dur);

    // Next syllable: irregular gap (silence between words)
    const gap = Math.random() < 0.3
      ? 600 + Math.random() * 800  // pause (between words)
      : 80 + Math.random() * 200;  // short gap (between syllables)
    const t = setTimeout(syllable, gap);
    timers.push(t);
  };
  const t0 = setTimeout(syllable, 200 + Math.random() * 400);
  timers.push(t0);

  // "Whisper" layer — breathy high-pass noise
  const whisperSrc = noiseLoop(ctx, 2);
  const whisperHp = ctx.createBiquadFilter(); whisperHp.type = "highpass"; whisperHp.frequency.value = 2500;
  const whisperG = ctx.createGain(); whisperG.gain.value = 0.04;
  whisperSrc.connect(whisperHp); whisperHp.connect(whisperG); whisperG.connect(gain);
  whisperSrc.start();
  lfo(ctx, 2.1, 0.025, whisperG.gain); // whisper rhythm

  return {
    gainNode: gain,
    cleanup: () => {
      srcs.forEach(s => { try { s.stop(); } catch {} });
      try { whisperSrc.stop(); } catch {}
      timers.forEach(clearTimeout);
      gain.disconnect();
    }
  };
}

// ─── 90 MHz — THE TIME IS NOW ─────────────────────────────────────────────────
// Synthesized "the time is now" — soft, hypnotic, dream transmission.
// A message meant for you.
function buildTimeIsNow(ctx: AudioContext, dest: AudioNode): ZoneNodes {
  const gain = ctx.createGain(); gain.gain.value = 0; gain.connect(dest);
  const srcs: OscillatorNode[] = [];
  const timers: ReturnType<typeof setTimeout>[] = [];

  // Synthesize a voice-like "the time is now" using formant synthesis
  // We approximate the phrase as 4 vowel sounds: uh-TI-iz-NAU
  // Each "word" is a brief formant cluster

  // Ambient drone underneath — gives it the hypnotic quality
  const drone = osc(ctx, "sine", 174.6); // F3 — warm, resonant
  const droneG = ctx.createGain(); droneG.gain.value = 0.12;
  drone.connect(droneG); droneG.connect(gain); drone.start(); srcs.push(drone);
  lfo(ctx, 0.04, 6, drone.frequency);
  lfo(ctx, 0.07, 0.04, droneG.gain);

  // Second drone — perfect fifth above
  const drone2 = osc(ctx, "sine", 261.6); // C4
  const drone2G = ctx.createGain(); drone2G.gain.value = 0.07;
  drone2.connect(drone2G); drone2G.connect(gain); drone2.start(); srcs.push(drone2);
  lfo(ctx, 0.05, 4, drone2.frequency);

  // "Voice" — formant synthesis of the phrase
  // Fundamental: ~200 Hz (female voice range)
  const voice = osc(ctx, "sawtooth", 196);
  const voiceG = ctx.createGain(); voiceG.gain.value = 0;
  voice.connect(voiceG); voiceG.connect(gain); voice.start(); srcs.push(voice);

  // Formant filters
  const f1 = ctx.createBiquadFilter(); f1.type = "bandpass"; f1.frequency.value = 800; f1.Q.value = 4;
  const f2 = ctx.createBiquadFilter(); f2.type = "bandpass"; f2.frequency.value = 1200; f2.Q.value = 6;
  const f3 = ctx.createBiquadFilter(); f3.type = "bandpass"; f3.frequency.value = 2400; f3.Q.value = 8;
  voice.connect(f1); voice.connect(f2); voice.connect(f3);
  f1.connect(voiceG); f2.connect(voiceG); f3.connect(voiceG);

  // Phrase sequencer — "the time is now" as formant movements
  const phrase = [
    { dur: 0.12, f1: 600,  f2: 1000, f3: 2200, pitch: 196, amp: 0.14 }, // "the"
    { dur: 0.08, f1: 0,    f2: 0,    f3: 0,    pitch: 196, amp: 0 },    // pause
    { dur: 0.18, f1: 730,  f2: 1090, f3: 2440, pitch: 210, amp: 0.18 }, // "time"
    { dur: 0.08, f1: 0,    f2: 0,    f3: 0,    pitch: 196, amp: 0 },    // pause
    { dur: 0.14, f1: 400,  f2: 2000, f3: 2600, pitch: 200, amp: 0.15 }, // "is"
    { dur: 0.08, f1: 0,    f2: 0,    f3: 0,    pitch: 196, amp: 0 },    // pause
    { dur: 0.22, f1: 600,  f2: 900,  f3: 2200, pitch: 185, amp: 0.16 }, // "now"
  ];

  const playPhrase = (pitchShift = 1.0, ampScale = 1.0) => {
    let t = ctx.currentTime + 0.1;
    phrase.forEach(step => {
      if (step.amp > 0) {
        voiceG.gain.setValueAtTime(step.amp * ampScale, t);
        voiceG.gain.exponentialRampToValueAtTime(0.001, t + step.dur * 0.9);
        voice.frequency.setValueAtTime(step.pitch * pitchShift, t);
        if (step.f1 > 0) {
          f1.frequency.setValueAtTime(step.f1, t);
          f2.frequency.setValueAtTime(step.f2, t);
          f3.frequency.setValueAtTime(step.f3, t);
        }
      }
      t += step.dur;
    });
  };

  const schedulePhrase = () => {
    // Vary: sometimes whispered (low amp), sometimes distant (pitch shifted)
    const variant = Math.random();
    if (variant < 0.3) {
      playPhrase(0.85 + Math.random() * 0.3, 0.4 + Math.random() * 0.3); // distant/whispered
    } else if (variant < 0.6) {
      playPhrase(1.0 + (Math.random() - 0.5) * 0.1, 0.8 + Math.random() * 0.2); // normal
    } else {
      playPhrase(1.5 + Math.random() * 0.2, 0.6); // higher pitch, ethereal
    }
    // Repeat unpredictably: 4–12 seconds
    const t = setTimeout(schedulePhrase, 4000 + Math.random() * 8000);
    timers.push(t);
  };
  const t0 = setTimeout(schedulePhrase, 1000 + Math.random() * 2000);
  timers.push(t0);

  // Delay echo — "a message meant for you" feel
  const echo = ctx.createDelay(1); echo.delayTime.value = 0.45;
  const echoFb = ctx.createGain(); echoFb.gain.value = 0.4;
  const echoG = ctx.createGain(); echoG.gain.value = 0.3;
  voiceG.connect(echo); echo.connect(echoFb); echoFb.connect(echo);
  echo.connect(echoG); echoG.connect(gain);

  return {
    gainNode: gain,
    cleanup: () => {
      srcs.forEach(s => { try { s.stop(); } catch {} });
      timers.forEach(clearTimeout);
      gain.disconnect();
    }
  };
}

// ─── 100 MHz — MACHINE WEATHER ────────────────────────────────────────────────
// Soft tonal pulses, radio chirps, distant synthetic winds.
// Natural but impossible. Weather from another planet.
function buildMachineWeather(ctx: AudioContext, dest: AudioNode): ZoneNodes {
  const gain = ctx.createGain(); gain.gain.value = 0; gain.connect(dest);
  const srcs: (OscillatorNode | AudioBufferSourceNode)[] = [];
  const timers: ReturnType<typeof setTimeout>[] = [];

  // "Wind" — filtered pink noise with slow amplitude modulation
  const windSrc = noiseLoop(ctx, 4);
  const windLp = ctx.createBiquadFilter(); windLp.type = "lowpass"; windLp.frequency.value = 400;
  const windG = ctx.createGain(); windG.gain.value = 0.08;
  lfo(ctx, 0.06, 0.05, windG.gain); // wind gusts
  lfo(ctx, 0.02, 100, windLp.frequency); // wind tone shift
  windSrc.connect(windLp); windLp.connect(windG); windG.connect(gain);
  windSrc.start(); srcs.push(windSrc);

  // Tonal pulses — soft sine bursts at "weather" intervals
  const pulseFreqs = [220, 293.7, 369.9, 440]; // A3, D4, F#4, A4 — pentatonic
  const pulseTone = osc(ctx, "sine", 220);
  const pulseToneG = ctx.createGain(); pulseToneG.gain.value = 0;
  pulseTone.connect(pulseToneG); pulseToneG.connect(gain); pulseTone.start(); srcs.push(pulseTone);

  const firePulse = () => {
    const freq = pulseFreqs[Math.floor(Math.random() * pulseFreqs.length)];
    const now = ctx.currentTime;
    pulseTone.frequency.setValueAtTime(freq, now);
    pulseToneG.gain.setValueAtTime(0.14 + Math.random() * 0.08, now);
    pulseToneG.gain.exponentialRampToValueAtTime(0.001, now + 0.8 + Math.random() * 0.6);
    const t = setTimeout(firePulse, 1200 + Math.random() * 2800);
    timers.push(t);
  };
  const t0 = setTimeout(firePulse, 500 + Math.random() * 1000);
  timers.push(t0);

  // "Radio chirp" — brief high-frequency sweep
  const chirpOsc = osc(ctx, "sine", 2000);
  const chirpG = ctx.createGain(); chirpG.gain.value = 0;
  chirpOsc.connect(chirpG); chirpG.connect(gain); chirpOsc.start(); srcs.push(chirpOsc);

  const fireChirp = () => {
    const now = ctx.currentTime;
    const startFreq = 800 + Math.random() * 1200;
    chirpOsc.frequency.setValueAtTime(startFreq, now);
    chirpOsc.frequency.exponentialRampToValueAtTime(startFreq * (2 + Math.random()), now + 0.15);
    chirpG.gain.setValueAtTime(0.06, now);
    chirpG.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    const t = setTimeout(fireChirp, 2000 + Math.random() * 5000);
    timers.push(t);
  };
  const t1 = setTimeout(fireChirp, 1500 + Math.random() * 2000);
  timers.push(t1);

  // Harmonic movement — slow chord drone
  [110, 165, 220].forEach((f, i) => {
    const h = osc(ctx, "triangle", f);
    const hG = ctx.createGain(); hG.gain.value = 0.04 / (i + 1);
    lfo(ctx, 0.03 + i * 0.01, f * 0.02, h.frequency);
    h.connect(hG); hG.connect(gain); h.start(); srcs.push(h);
  });

  return {
    gainNode: gain,
    cleanup: () => {
      srcs.forEach(s => { try { s.stop(); } catch {} });
      timers.forEach(clearTimeout);
      gain.disconnect();
    }
  };
}

// ─── 110 MHz — DREAMING MACHINE ───────────────────────────────────────────────
// Recursive modulation, synthetic humming, neural pulse rhythm.
// Beautiful and intelligent. A machine dreaming in public.
function buildDreamingMachine(ctx: AudioContext, dest: AudioNode): ZoneNodes {
  const gain = ctx.createGain(); gain.gain.value = 0; gain.connect(dest);
  const srcs: OscillatorNode[] = [];

  // Core hum — sine at 137 Hz (prime, slightly unsettling)
  const hum = osc(ctx, "sine", 137);
  const humG = ctx.createGain(); humG.gain.value = 0.18;
  hum.connect(humG); humG.connect(gain); hum.start(); srcs.push(hum);

  // FM modulator — golden ratio creates complex, evolving timbre
  const mod1 = osc(ctx, "sine", 137 * 1.618);
  const mod1G = ctx.createGain(); mod1G.gain.value = 55;
  mod1.connect(mod1G); mod1G.connect(hum.frequency);
  mod1.start(); srcs.push(mod1);
  lfo(ctx, 0.06, 30, mod1G.gain); // modulation depth breathes

  // Second modulator — silver ratio
  const mod2 = osc(ctx, "sine", 137 * 2.414);
  const mod2G = ctx.createGain(); mod2G.gain.value = 25;
  mod2.connect(mod2G); mod2G.connect(hum.frequency);
  mod2.start(); srcs.push(mod2);
  lfo(ctx, 0.04, 15, mod2G.gain);

  // "Neural pulse" — soft rhythmic tones at irregular intervals
  const pulse = osc(ctx, "sine", 274); // 2 × 137
  const pulseG = ctx.createGain(); pulseG.gain.value = 0.08;
  pulse.connect(pulseG); pulseG.connect(gain); pulse.start(); srcs.push(pulse);
  // Pulse rhythm via LFO
  const pulseLfo = lfo(ctx, 1.37, 0.07, pulseG.gain); // 1.37 Hz — prime feel
  srcs.push(pulseLfo);

  // Recursive harmonic — feeds back into itself via delay
  const recDelay = ctx.createDelay(0.5); recDelay.delayTime.value = 0.137; // 137ms
  const recFb = ctx.createGain(); recFb.gain.value = 0.45;
  const recG = ctx.createGain(); recG.gain.value = 0.06;
  humG.connect(recDelay); recDelay.connect(recFb); recFb.connect(recDelay);
  recDelay.connect(recG); recG.connect(gain);

  // Digital breathing — very slow amplitude modulation
  lfo(ctx, 0.05, 0.06, humG.gain);

  return {
    gainNode: gain,
    cleanup: () => { srcs.forEach(s => { try { s.stop(); } catch {} }); gain.disconnect(); }
  };
}

// ─── Zone Atmosphere Manager ──────────────────────────────────────────────────

export class ZoneAtmosphereManager {
  private ctx: AudioContext;
  private masterGain: AudioNode;
  private zones: Map<ZoneName, ZoneNodes> = new Map();

  constructor(ctx: AudioContext, masterGain: AudioNode) {
    this.ctx = ctx;
    this.masterGain = masterGain;
    this.buildAll();
  }

  private buildAll() {
    const builders: Record<ZoneName, (ctx: AudioContext, dest: AudioNode) => ZoneNodes> = {
      "theremin-ghost":   buildThereminGhost,
      "broken-language":  buildBrokenLanguage,
      "time-is-now":      buildTimeIsNow,
      "machine-weather":  buildMachineWeather,
      "dreaming-machine": buildDreamingMachine,
    };
    for (const [name, builder] of Object.entries(builders)) {
      try {
        const nodes = builder(this.ctx, this.masterGain);
        this.zones.set(name as ZoneName, nodes);
      } catch (e) {
        console.warn(`Zone ${name} failed:`, e);
      }
    }
  }

  /**
   * Update zone gains based on current frequency.
   * Zone peaks at center, fades over ±7 MHz.
   * Returns the dominant zone's gain (0–1) so the caller can suppress static.
   */
  update(frequency: number): number {
    const now = this.ctx.currentTime;
    let maxGain = 0;

    for (const zone of ZONES) {
      const nodes = this.zones.get(zone.name);
      if (!nodes) continue;

      const dist = Math.abs(frequency - zone.freq);
      const radius = 7;
      let zoneGain = 0;

      if (dist < radius) {
        const raw = 1 - dist / radius;
        zoneGain = raw * raw * raw * 0.55; // cubic — sharp peak at center
        if (zoneGain > maxGain) maxGain = zoneGain;
      }

      nodes.gainNode.gain.setTargetAtTime(zoneGain, now, 0.5);
    }

    return maxGain;
  }

  destroy() {
    this.zones.forEach(({ cleanup }) => { try { cleanup(); } catch {} });
    this.zones.clear();
  }
}
