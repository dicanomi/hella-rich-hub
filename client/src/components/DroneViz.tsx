/**
 * DroneViz — Analog oscilloscope line v7
 *
 * Design: 1980s spacecraft oscilloscope. One continuous horizontal line.
 * Dark charcoal line on the warm aluminum panel — like a real CRT scope.
 *
 * Behavior:
 * - Playing: slow organic sine-based movement, very low amplitude
 * - Stopped: line gently settles to center flat
 * - Reads real audio from AnalyserNode when available
 * - Falls back to slow organic simulation
 *
 * Visual:
 * - Single continuous bezier curve
 * - Dark charcoal line (oklch(0.18 0.008 65)) — not black, not orange
 * - Very subtle shadow/glow for depth
 * - No bars, no columns, no bouncing
 * - Thin line weight (1.5–2px)
 * - Rounded caps and joins
 */

import { droneEngine } from "@/lib/droneEngine";
import { useEffect, useRef } from "react";

interface DroneVizProps {
  isPlaying: boolean;
  intensity: number;
}

export function DroneViz({ isPlaying, intensity }: DroneVizProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stateRef = useRef({
    frameId: 0,
    time: 0,
    display: null as Float32Array | null,
    // Simulation phases — ultra-slow
    phase1: 0,
    phase2: 1.3,
    phase3: 2.8,
    phase4: 4.1,
    // Amplitude envelope
    amplitude: 0,
  });

  const isPlayingRef = useRef(isPlaying);
  const intensityRef = useRef(intensity);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { intensityRef.current = intensity; }, [intensity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = stateRef.current;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.scale(dpr, dpr);
      s.display = null;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const draw = (timestamp: number) => {
      const dt = Math.min(timestamp - (s.time || timestamp), 50);
      s.time = timestamp;

      const W = canvas.getBoundingClientRect().width;
      const H = canvas.getBoundingClientRect().height;
      if (W === 0 || H === 0) { s.frameId = requestAnimationFrame(draw); return; }

      ctx.clearRect(0, 0, W, H);

      const playing = isPlayingRef.current;
      const intens = intensityRef.current;
      const N = Math.min(300, Math.floor(W));

      if (!s.display || s.display.length !== N) {
        s.display = new Float32Array(N);
      }

      // Smooth amplitude envelope — very slow
      const ampTarget = playing ? 0.30 + intens * 0.25 : 0;
      s.amplitude += (ampTarget - s.amplitude) * (playing ? 0.015 : 0.008);

      // Advance simulation phases — ultra-slow, organic
      const spd = dt / 16;
      s.phase1 += 0.0008 * spd;
      s.phase2 += 0.00055 * spd;
      s.phase3 += 0.00035 * spd;
      s.phase4 += 0.00020 * spd;

      // Get real audio data if available
      const analyser = droneEngine.analyser;
      let rawBuf: Float32Array | null = null;
      if (playing && analyser) {
        rawBuf = new Float32Array(analyser.fftSize);
        analyser.getFloatTimeDomainData(rawBuf);
      }

      // Build display buffer
      for (let i = 0; i < N; i++) {
        const norm = i / (N - 1);
        let target = 0;

        if (playing && rawBuf) {
          // Real audio — amplified and heavily smoothed
          const srcIdx = Math.floor(norm * (rawBuf.length - 1));
          target = rawBuf[srcIdx] * 60;
        } else if (playing) {
          // Organic simulation — multiple slow sines
          target =
            Math.sin(norm * Math.PI * 2.2 + s.phase1) * 0.40 +
            Math.sin(norm * Math.PI * 1.3 + s.phase2) * 0.25 +
            Math.sin(norm * Math.PI * 3.7 + s.phase3) * 0.15 +
            Math.sin(norm * Math.PI * 0.8 + s.phase4) * 0.20;
        }

        // Very smooth — slow convergence
        const k = playing ? 0.10 : 0.03;
        s.display![i] += (target - s.display![i]) * k;
      }

      const midY = H / 2;
      const vScale = H * 0.38 * s.amplitude;

      // Draw flat center line when silent
      if (s.amplitude < 0.003) {
        ctx.beginPath();
        ctx.moveTo(0, midY);
        ctx.lineTo(W, midY);
        ctx.strokeStyle = "oklch(0.22 0.008 65 / 0.18)";
        ctx.lineWidth = 1;
        ctx.stroke();
        s.frameId = requestAnimationFrame(draw);
        return;
      }

      // Build smooth bezier path
      const buildPath = () => {
        ctx.beginPath();
        const y0 = midY + s.display![0] * vScale;
        ctx.moveTo(0, y0);
        for (let i = 1; i < N; i++) {
          const px = ((i - 1) / (N - 1)) * W;
          const py = midY + s.display![i - 1] * vScale;
          const cx2 = (i / (N - 1)) * W;
          const cy2 = midY + s.display![i] * vScale;
          ctx.quadraticCurveTo(px, py, (px + cx2) / 2, (py + cy2) / 2);
        }
        ctx.lineTo(W, midY + s.display![N - 1] * vScale);
      };

      const a = s.amplitude;

      // Pass 1: Very soft shadow (warm, barely visible)
      ctx.save();
      ctx.filter = `blur(${Math.round(2.5 * (window.devicePixelRatio || 1))}px)`;
      buildPath();
      ctx.strokeStyle = `oklch(0.18 0.008 65 / ${(a * 0.25).toFixed(2)})`;
      ctx.lineWidth = 4;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.restore();

      // Pass 2: Core line — dark charcoal
      buildPath();
      ctx.strokeStyle = `oklch(0.22 0.008 65 / ${(0.55 + a * 0.30).toFixed(2)})`;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();

      s.frameId = requestAnimationFrame(draw);
    };

    s.frameId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(s.frameId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: 48, display: "block" }}
    />
  );
}
