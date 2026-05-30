/*
 * useAudioEngine — Web Audio API synthesis engine for DEAD AIR
 * Generates all audio procedurally: static, drones, tones, pulses, choir
 * Features: seamless crossfades, signal instability, reverb, delay, LFO
 * No external audio files — everything synthesized in real-time
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { Station } from "../lib/deadAirStations";
import { buildImpossibleTransmission } from "../lib/deadAirImpossibleTransmission";
import { ZoneAtmosphereManager } from "../lib/deadAirZoneAtmosphere";

interface UseAudioEngineProps {
  frequency: number;
  stations: Station[];
  volume: number;
  started: boolean;
}

interface AudioEngineResult {
  activeStation: { label: string; category: string } | null;
  signalStrength: number;
  isStatic: boolean;
  analyserNode: AnalyserNode | null;
  start: () => Promise<void>;
}

// Compute signal strength for a station at a given tuning frequency
function computeSignal(stationFreq: number, currentFreq: number, bandwidth: number): number {
  const dist = Math.abs(stationFreq - currentFreq);
  if (dist > bandwidth * 2.2) return 0;
  const raw = Math.max(0, 1 - dist / bandwidth);
  return raw * raw;
}

// Create a looping noise buffer
function createNoiseBuffer(
  ctx: AudioContext,
  color: "white" | "pink" | "brown" = "white",
  durationSec = 3
): AudioBuffer {
  const bufferSize = Math.floor(ctx.sampleRate * durationSec);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  if (color === "white") {
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.7;
  } else if (color === "pink") {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.96900 * b2 + w * 0.1538520;
      b3 = 0.86650 * b3 + w * 0.3104856;
      b4 = 0.55000 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
  } else if (color === "brown") {
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const w = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * w) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }
  }

  // Fade in/out to prevent clicks at loop points
  const fadeLen = Math.floor(ctx.sampleRate * 0.05);
  for (let i = 0; i < fadeLen; i++) {
    const t = i / fadeLen;
    data[i] *= t;
    data[bufferSize - 1 - i] *= t;
  }

  return buffer;
}

// Simple convolution reverb via feedback delay network
function createReverbNode(ctx: AudioContext, wet: number): { input: GainNode; output: GainNode } {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();
  dryGain.gain.value = 1 - wet;
  wetGain.gain.value = wet * 0.8;

  // 4-tap feedback delay network
  const delays = [0.083, 0.127, 0.211, 0.317].map((t) => {
    const d = ctx.createDelay(2);
    d.delayTime.value = t;
    return d;
  });
  const fbs = [0.45, 0.38, 0.32, 0.28].map((g) => {
    const n = ctx.createGain();
    n.gain.value = g;
    return n;
  });
  const lpf = ctx.createBiquadFilter();
  lpf.type = "lowpass";
  lpf.frequency.value = 3500;

  delays.forEach((d, i) => {
    input.connect(d);
    d.connect(fbs[i]);
    fbs[i].connect(d);
    d.connect(lpf);
  });
  lpf.connect(wetGain);
  input.connect(dryGain);
  dryGain.connect(output);
  wetGain.connect(output);

  return { input, output };
}

// Build all audio nodes for a station
function buildStationNodes(
  ctx: AudioContext,
  station: Station,
  destination: AudioNode
): { gainNode: GainNode; cleanup: () => void } {
  const params = station.audioParams;
  const gainNode = ctx.createGain();
  gainNode.gain.value = 0;

  const sources: (AudioBufferSourceNode | OscillatorNode)[] = [];

  // Build reverb if needed
  let sink: AudioNode;
  if (params.reverbWet && params.reverbWet > 0.05) {
    const rev = createReverbNode(ctx, params.reverbWet);
    rev.output.connect(gainNode);
    sink = rev.input;
  } else {
    sink = gainNode;
  }

  // Delay line
  if (params.delayTime && params.delayFeedback) {
    const delay = ctx.createDelay(2);
    delay.delayTime.value = params.delayTime;
    const fb = ctx.createGain();
    fb.gain.value = params.delayFeedback;
    const delayIn = ctx.createGain();
    delayIn.connect(delay);
    delay.connect(fb);
    fb.connect(delay);
    delay.connect(sink);
    delayIn.connect(sink);
    sink = delayIn;
  }

  // Main filter
  const filter = ctx.createBiquadFilter();
  filter.type = params.type === "noise" ? "bandpass" : "lowpass";
  filter.frequency.value = params.filterFreq ?? 2000;
  filter.Q.value = params.filterQ ?? 1;
  filter.connect(sink);

  // LFO on filter frequency
  if (params.lfoRate && params.lfoDepth) {
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = params.lfoRate;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = (params.filterFreq ?? 1000) * params.lfoDepth * 0.4;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
    sources.push(lfo);
  }

  const vol = params.volume ?? 0.5;

  if (params.type === "silence") {
    // intentionally empty
  } else if (params.type === "noise") {
    const buf = createNoiseBuffer(ctx, params.noiseColor ?? "white");
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const g = ctx.createGain();
    g.gain.value = vol * 1.2;
    src.connect(g);
    g.connect(filter);
    src.start();
    sources.push(src);
  } else if (params.type === "tone" || params.type === "drone" || params.type === "choir") {
    const harmonics = params.harmonics ?? [1];
    const baseFreq = params.baseFreq ?? 220;

    harmonics.forEach((ratio, i) => {
      const osc = ctx.createOscillator();
      if (params.type === "choir") {
        osc.type = "sine";
      } else if (params.type === "drone") {
        osc.type = i % 3 === 0 ? "sawtooth" : i % 3 === 1 ? "triangle" : "sine";
      } else {
        osc.type = i % 2 === 0 ? "sawtooth" : "sine";
      }
      osc.frequency.value = baseFreq * ratio;

      // Pitch drift LFO
      if (params.pitchDrift && params.pitchDrift > 0) {
        const driftLfo = ctx.createOscillator();
        driftLfo.type = "sine";
        driftLfo.frequency.value = 0.02 + Math.random() * 0.08;
        const driftGain = ctx.createGain();
        driftGain.gain.value = params.pitchDrift * (1 + Math.random() * 0.5);
        driftLfo.connect(driftGain);
        driftGain.connect(osc.frequency);
        driftLfo.start();
        sources.push(driftLfo);
      }

      const oscGain = ctx.createGain();
      oscGain.gain.value = (vol / harmonics.length) * (1 / (1 + i * 0.4));
      osc.connect(oscGain);
      oscGain.connect(filter);
      osc.start();
      sources.push(osc);
    });
  } else if (params.type === "pulse") {
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = params.baseFreq ?? 440;
    const g = ctx.createGain();
    g.gain.value = vol * 0.4;

    if (params.pulseRate) {
      const pulseLfo = ctx.createOscillator();
      pulseLfo.type = "square";
      pulseLfo.frequency.value = params.pulseRate;
      const plg = ctx.createGain();
      plg.gain.value = vol * 0.3;
      pulseLfo.connect(plg);
      plg.connect(g.gain);
      pulseLfo.start();
      sources.push(pulseLfo);
    }

    osc.connect(g);
    g.connect(filter);
    osc.start();
    sources.push(osc);
  }

  gainNode.connect(destination);

  const cleanup = () => {
    sources.forEach((s) => { try { s.stop(); } catch {} });
    gainNode.disconnect();
  };

  return { gainNode, cleanup };
}

export function useAudioEngine({
  frequency,
  stations,
  volume,
  started,
}: UseAudioEngineProps): AudioEngineResult {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const staticGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const stationNodesRef = useRef<Map<string, { gainNode: GainNode; cleanup: () => void }>>(new Map());
  const staticCleanupRef = useRef<(() => void) | null>(null);
  const zoneAtmosphereRef = useRef<ZoneAtmosphereManager | null>(null);
  const [activeStation, setActiveStation] = useState<{ label: string; category: string } | null>(null);
  const [signalStrength, setSignalStrength] = useState(0);
  const [isStatic, setIsStatic] = useState(true);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const analyserStateRef = useRef<AnalyserNode | null>(null);

  const start = useCallback(async () => {
    if (ctxRef.current) return;

    // Safari iOS: use webkitAudioContext fallback
    const AC = (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    const ctx = new AC();
    ctxRef.current = ctx;
    console.log('[audio] context created, state:', ctx.state);

    // iOS-safe unlock: silent buffer + resume in gesture stack
    console.log('[audio] context state before resume:', ctx.state);
    if (ctx.state !== 'running') {
      try {
        const buf = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start(0);
        console.log('[audio] iOS unlock silent buffer played');
      } catch {}
      try { await ctx.resume(); } catch {}
    }
    console.log('[audio] context state after resume:', ctx.state);
    if (ctx.state === 'running') console.log('[audio] iOS unlock success');
    console.log('[audio] audio start success, state:', ctx.state);

    // Master gain → analyser → destination
    const masterGain = ctx.createGain();
    masterGain.gain.value = volume;
    masterGainRef.current = masterGain;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.85;
    analyserRef.current = analyser;

    masterGain.connect(analyser);
    analyser.connect(ctx.destination);
    analyserStateRef.current = analyser;
    setAnalyserNode(analyser);

    // Static noise layer — kept subtle so tonal stations can be heard
    const staticGain = ctx.createGain();
    staticGain.gain.value = 0.06;
    staticGainRef.current = staticGain;
    staticGain.connect(masterGain);

    const staticBuf = createNoiseBuffer(ctx, "white", 4);
    const staticSrc = ctx.createBufferSource();
    staticSrc.buffer = staticBuf;
    staticSrc.loop = true;
    const staticFilter = ctx.createBiquadFilter();
    staticFilter.type = "bandpass";
    staticFilter.frequency.value = 4000;
    staticFilter.Q.value = 0.4;
    staticSrc.connect(staticFilter);
    staticFilter.connect(staticGain);
    staticSrc.start();
    staticCleanupRef.current = () => { try { staticSrc.stop(); } catch {} };

    // Initialize zone atmosphere manager
    zoneAtmosphereRef.current = new ZoneAtmosphereManager(ctx, masterGain);

    // Build station nodes
    stations.forEach((station) => {
      // Special-case: IMPOSSIBLE TRANSMISSION gets its own bespoke synthesizer
      if (station.audioParams.type === "impossible") {
        const nodes = buildImpossibleTransmission(ctx, masterGain);
        stationNodesRef.current.set(station.id, nodes);
      } else {
        const nodes = buildStationNodes(ctx, station, masterGain);
        stationNodesRef.current.set(station.id, nodes);
      }
    });
  }, [stations, volume]);

  // Update master volume
  useEffect(() => {
    const ctx = ctxRef.current;
    const mg = masterGainRef.current;
    if (!ctx || !mg) return;
    mg.gain.setTargetAtTime(volume, ctx.currentTime, 0.05);
  }, [volume]);

  // Update station gains based on tuning frequency
  useEffect(() => {
    if (!started || !ctxRef.current) return;
    const ctx = ctxRef.current;

    let bestStation: Station | null = null;
    let bestSignal = 0;

    stations.forEach((station) => {
      const signal = computeSignal(station.frequency, frequency, station.bandwidth);
      const nodes = stationNodesRef.current.get(station.id);
      if (!nodes) return;

      // Tiny random instability for analog feel
      // The impossible transmission gets extra instability as you approach it
      const isImpossible = station.audioParams.type === "impossible";
      const instabilityRange = isImpossible ? 0.12 : 0.04;
      const instability = 1 - Math.random() * instabilityRange;
      const finalSignal = signal * instability;
      const targetGain = finalSignal * (station.audioParams.volume ?? 0.5);
      // Impossible transmission fades in more slowly (more dramatic reveal)
      const fadeTime = isImpossible ? 0.4 : 0.12;

      nodes.gainNode.gain.setTargetAtTime(targetGain, ctx.currentTime, fadeTime);

      if (finalSignal > bestSignal) {
        bestSignal = finalSignal;
        bestStation = station;
      }
    });

    // Update zone atmosphere — returns dominant zone gain (0–1)
    const zoneGain = zoneAtmosphereRef.current
      ? zoneAtmosphereRef.current.update(frequency)
      : 0;

    // Static: suppressed by station signal AND zone atmosphere
    // Anchor stations (wide bandwidth, rarity=0) will strongly suppress static
    const staticSuppression = Math.max(bestSignal * 3.5, zoneGain * 4.0);
    const staticLevel = Math.max(0.004, 0.06 * (1 - Math.min(1, staticSuppression)));
    if (staticGainRef.current) {
      staticGainRef.current.gain.setTargetAtTime(staticLevel, ctx.currentTime, 0.2);
    }

    setSignalStrength(bestSignal);
    setIsStatic(bestSignal < 0.35);
    setActiveStation(
      bestStation && bestSignal > 0.4
        ? { label: (bestStation as Station).label, category: (bestStation as Station).category }
        : null
    );
  }, [frequency, stations, started]);

  // Resume context on interaction
  useEffect(() => {
    if (!started || !ctxRef.current) return;
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
  }, [started]);

  // Cleanup
  useEffect(() => {
    return () => {
      stationNodesRef.current.forEach(({ cleanup }) => cleanup());
      staticCleanupRef.current?.();
      zoneAtmosphereRef.current?.destroy();
      ctxRef.current?.close();
    };
  }, []);

  return { activeStation, signalStrength, isStatic, analyserNode: analyserNode ?? analyserStateRef.current, start };
}
