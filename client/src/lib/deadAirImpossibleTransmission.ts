/*
 * IMPOSSIBLE TRANSMISSION — Bespoke synthesis engine
 * Frequency: exactly 120.0 MHz
 *
 * Sound design brief:
 * An unknown intelligence communicating through modulation.
 * Not alien. Not sci-fi. Something stranger — like intercepted mathematics.
 *
 * Architecture:
 * 1. FM carrier — a slowly drifting fundamental with deep FM modulation
 *    that creates metallic, inharmonic sidebands
 * 2. Rhythmic pulse engine — irregular timing that almost forms patterns,
 *    then breaks them. Primes, Fibonacci intervals, random interruptions.
 * 3. Shortwave artifact layer — bandpass-filtered noise bursts that
 *    simulate atmospheric interference and signal dropout
 * 4. Harmonic texture — very slow, very deep reverb with pitch-shifted
 *    feedback creating a sense of vast space
 * 5. Click/glitch layer — sparse transients that feel like data packets
 * 6. Occasional "phrase" — a sequence of 3–7 tones that almost sounds
 *    intentional, then dissolves back into noise
 *
 * All timing is non-repeating over human timescales (uses irrational ratios).
 */

// Fibonacci sequence for timing (ms)
const FIB = [89, 144, 233, 377, 610, 987, 1597, 2584];

// Prime numbers for pulse spacing (ms)
const PRIMES = [127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function buildImpossibleTransmission(
  ctx: AudioContext,
  destination: AudioNode
): { gainNode: GainNode; cleanup: () => void } {
  const gainNode = ctx.createGain();
  gainNode.gain.value = 0;
  gainNode.connect(destination);

  const allSources: (OscillatorNode | AudioBufferSourceNode)[] = [];
  const allIntervals: ReturnType<typeof setInterval>[] = [];
  const allTimeouts: ReturnType<typeof setTimeout>[] = [];

  // ─── Master reverb (deep, cavernous) ────────────────────────────────────────
  const reverbDry = ctx.createGain();
  const reverbWet = ctx.createGain();
  reverbDry.gain.value = 0.3;
  reverbWet.gain.value = 0.7;
  reverbDry.connect(gainNode);
  reverbWet.connect(gainNode);

  // 6-tap feedback delay network for deep reverb
  const revDelays = [0.113, 0.179, 0.251, 0.317, 0.431, 0.557].map((t) => {
    const d = ctx.createDelay(3);
    d.delayTime.value = t;
    return d;
  });
  const revFbs = [0.42, 0.38, 0.34, 0.30, 0.26, 0.22].map((g) => {
    const n = ctx.createGain();
    n.gain.value = g;
    return n;
  });
  const revFilter = ctx.createBiquadFilter();
  revFilter.type = "lowpass";
  revFilter.frequency.value = 2800;
  revDelays.forEach((d, i) => {
    d.connect(revFbs[i]);
    revFbs[i].connect(d);
    d.connect(revFilter);
  });
  revFilter.connect(reverbWet);

  // Sink: routes signal into both dry path and all reverb delays
  const sink = ctx.createGain();
  sink.connect(reverbDry);
  revDelays.forEach((d) => sink.connect(d));

  // ─── 1. FM Carrier ──────────────────────────────────────────────────────────
  // Carrier frequency drifts slowly around 137 Hz (a prime, feels slightly wrong)
  const carrier = ctx.createOscillator();
  carrier.type = "sine";
  carrier.frequency.value = 137;

  // Carrier drift LFO (irrational rate)
  const carrierDrift = ctx.createOscillator();
  carrierDrift.type = "sine";
  carrierDrift.frequency.value = 0.0137; // very slow
  const carrierDriftGain = ctx.createGain();
  carrierDriftGain.gain.value = 4.7;
  carrierDrift.connect(carrierDriftGain);
  carrierDriftGain.connect(carrier.frequency);

  // FM modulator — creates metallic inharmonic sidebands
  const modulator = ctx.createOscillator();
  modulator.type = "sine";
  modulator.frequency.value = 137 * 1.618; // golden ratio — inharmonic

  // Modulator depth varies slowly (makes the FM feel alive)
  const modDepth = ctx.createGain();
  modDepth.gain.value = 0;
  modulator.connect(modDepth);
  modDepth.connect(carrier.frequency);

  // Modulation depth LFO
  const modDepthLfo = ctx.createOscillator();
  modDepthLfo.type = "sine";
  modDepthLfo.frequency.value = 0.0731; // irrational
  const modDepthLfoGain = ctx.createGain();
  modDepthLfoGain.gain.value = 85; // depth range: 0–170 Hz
  const modDepthOffset = ctx.createGain();
  modDepthOffset.gain.value = 90; // center depth
  modDepthLfo.connect(modDepthLfoGain);
  modDepthLfoGain.connect(modDepth.gain);
  modDepthOffset.connect(modDepth.gain);

  // Second modulator at a different inharmonic ratio
  const modulator2 = ctx.createOscillator();
  modulator2.type = "sine";
  modulator2.frequency.value = 137 * 2.414; // silver ratio
  const modDepth2 = ctx.createGain();
  modDepth2.gain.value = 28;
  modulator2.connect(modDepth2);
  modDepth2.connect(carrier.frequency);

  // Carrier output through bandpass (shortwave radio feel)
  const carrierFilter = ctx.createBiquadFilter();
  carrierFilter.type = "bandpass";
  carrierFilter.frequency.value = 900;
  carrierFilter.Q.value = 1.8;
  const carrierGain = ctx.createGain();
  carrierGain.gain.value = 0.18;
  carrier.connect(carrierFilter);
  carrierFilter.connect(carrierGain);
  carrierGain.connect(sink);

  carrier.start();
  carrierDrift.start();
  modulator.start();
  modDepthLfo.start();
  modulator2.start();
  allSources.push(carrier, carrierDrift, modulator, modDepthLfo, modulator2);

  // ─── 2. Shortwave artifact layer ────────────────────────────────────────────
  // Bandpass-filtered brown noise — the "carrier hiss"
  const noiseBuffer = createBrownNoise(ctx, 4);
  const noiseSrc = ctx.createBufferSource();
  noiseSrc.buffer = noiseBuffer;
  noiseSrc.loop = true;
  const noiseBp = ctx.createBiquadFilter();
  noiseBp.type = "bandpass";
  noiseBp.frequency.value = 1200;
  noiseBp.Q.value = 0.6;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.04;
  noiseSrc.connect(noiseBp);
  noiseBp.connect(noiseGain);
  noiseGain.connect(sink);
  noiseSrc.start();
  allSources.push(noiseSrc);

  // Noise level breathes slowly
  const noiseLfo = ctx.createOscillator();
  noiseLfo.type = "sine";
  noiseLfo.frequency.value = 0.0413;
  const noiseLfoGain = ctx.createGain();
  noiseLfoGain.gain.value = 0.025;
  noiseLfo.connect(noiseLfoGain);
  noiseLfoGain.connect(noiseGain.gain);
  noiseLfo.start();
  allSources.push(noiseLfo);

  // ─── 3. Rhythmic pulse engine ────────────────────────────────────────────────
  // Fires tonal pulses at irregular intervals using Fibonacci + prime timing.
  // Each pulse is a short sine burst through a narrow bandpass.
  // Occasionally 3–7 pulses fire in quick succession (a "phrase").

  const firePulse = (freq: number, durationMs: number, gainLevel: number) => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(gainLevel, now + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);

    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = freq * 1.1;
    bp.Q.value = 4;

    osc.connect(bp);
    bp.connect(env);
    env.connect(sink);
    osc.start(now);
    osc.stop(now + durationMs / 1000 + 0.05);
  };

  // Pulse frequencies — inharmonic, slightly unsettling
  const pulseFreqs = [
    137, 173, 211, 251, 293, 337, 379, 421, 463, 509,
    547, 593, 641, 683, 727, 773, 821, 863, 907, 953,
  ];

  // Single pulse scheduler
  const schedulePulse = () => {
    const freq = pickRandom(pulseFreqs) * (0.97 + Math.random() * 0.06);
    const dur = 40 + Math.random() * 120;
    firePulse(freq, dur, 0.12 + Math.random() * 0.10);
    const nextDelay = pickRandom(FIB) + pickRandom(PRIMES) * (0.8 + Math.random() * 0.4);
    const t = setTimeout(schedulePulse, nextDelay);
    allTimeouts.push(t);
  };
  const t1 = setTimeout(schedulePulse, 800 + Math.random() * 1200);
  allTimeouts.push(t1);

  // "Phrase" engine — occasionally fires a sequence of 3–7 tones
  // that almost sound like a pattern, then stops
  const schedulePhrase = () => {
    const phraseLength = 3 + Math.floor(Math.random() * 5);
    const baseFreq = pickRandom(pulseFreqs);
    // Use Fibonacci ratios for the phrase intervals
    const ratios = [1, 1.272, 1.618, 2.058, 2.618, 3.330, 4.236];

    let delay = 0;
    for (let i = 0; i < phraseLength; i++) {
      const ratio = ratios[i % ratios.length] * (0.98 + Math.random() * 0.04);
      const freq = baseFreq * ratio;
      const gap = pickRandom(FIB.slice(0, 4)); // short gaps within phrase
      const d = delay;
      const t = setTimeout(() => {
        firePulse(freq, 60 + Math.random() * 80, 0.14 + Math.random() * 0.08);
      }, d);
      allTimeouts.push(t);
      delay += gap;
    }

    // Next phrase: long random wait (30–120 seconds)
    const nextPhrase = 30000 + Math.random() * 90000;
    const t = setTimeout(schedulePhrase, nextPhrase);
    allTimeouts.push(t);
  };
  const t2 = setTimeout(schedulePhrase, 8000 + Math.random() * 15000);
  allTimeouts.push(t2);

  // ─── 4. Click / glitch layer ─────────────────────────────────────────────────
  // Very sparse transients — data packet feel
  const fireClick = () => {
    const now = ctx.currentTime;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.003), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const clickGain = ctx.createGain();
    clickGain.gain.value = 0.08 + Math.random() * 0.06;
    const clickFilter = ctx.createBiquadFilter();
    clickFilter.type = "highpass";
    clickFilter.frequency.value = 2000;
    src.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(sink);
    src.start(now);
  };

  const scheduleClick = () => {
    fireClick();
    // Clicks cluster occasionally (2–4 in quick succession), then long silence
    const burst = Math.random() < 0.3;
    if (burst) {
      const count = 2 + Math.floor(Math.random() * 3);
      for (let i = 1; i < count; i++) {
        const t = setTimeout(fireClick, i * (30 + Math.random() * 60));
        allTimeouts.push(t);
      }
    }
    const nextDelay = pickRandom(PRIMES) * (3 + Math.random() * 8);
    const t = setTimeout(scheduleClick, nextDelay);
    allTimeouts.push(t);
  };
  const t3 = setTimeout(scheduleClick, 2000 + Math.random() * 3000);
  allTimeouts.push(t3);

  // ─── 5. Harmonic texture layer ───────────────────────────────────────────────
  // Very slow, very quiet sine tones at inharmonic intervals
  // Creates a sense of vast space and latent intelligence
  const textureFreqs = [41.2, 66.7, 107.9, 174.6, 282.5, 457.1];
  textureFreqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;

    // Each texture tone has its own slow drift
    const driftOsc = ctx.createOscillator();
    driftOsc.type = "sine";
    driftOsc.frequency.value = 0.007 + i * 0.003;
    const driftGain = ctx.createGain();
    driftGain.gain.value = freq * 0.008;
    driftOsc.connect(driftGain);
    driftGain.connect(osc.frequency);

    // Very slow amplitude modulation
    const ampLfo = ctx.createOscillator();
    ampLfo.type = "sine";
    ampLfo.frequency.value = 0.011 + i * 0.007;
    const ampLfoGain = ctx.createGain();
    ampLfoGain.gain.value = 0.012;
    const ampOffset = ctx.createGain();
    ampOffset.gain.value = 0.015;

    const texGain = ctx.createGain();
    texGain.gain.value = 0;
    ampLfo.connect(ampLfoGain);
    ampLfoGain.connect(texGain.gain);
    ampOffset.connect(texGain.gain);

    osc.connect(texGain);
    texGain.connect(sink);

    osc.start();
    driftOsc.start();
    ampLfo.start();
    allSources.push(osc, driftOsc, ampLfo);
  });

  // ─── Cleanup ─────────────────────────────────────────────────────────────────
  const cleanup = () => {
    allSources.forEach((s) => { try { s.stop(); } catch {} });
    allIntervals.forEach(clearInterval);
    allTimeouts.forEach(clearTimeout);
    gainNode.disconnect();
  };

  return { gainNode, cleanup };
}

// Brown noise buffer
function createBrownNoise(ctx: AudioContext, durationSec: number): AudioBuffer {
  const bufferSize = Math.floor(ctx.sampleRate * durationSec);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = data[i];
    data[i] *= 3.5;
  }
  // Fade in/out to prevent loop clicks
  const fadeLen = Math.floor(ctx.sampleRate * 0.05);
  for (let i = 0; i < fadeLen; i++) {
    const t = i / fadeLen;
    data[i] *= t;
    data[bufferSize - 1 - i] *= t;
  }
  return buffer;
}
