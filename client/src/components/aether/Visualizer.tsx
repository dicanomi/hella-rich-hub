/**
 * ÆTHER Wavetable Visualizer
 * Design: Teenage Engineering × Braun × cinematic ambient hardware synth
 *
 * Architecture:
 * ─────────────────────────────────────────────────────────────────────────────
 * LAYER 1 — DEEP FIELD (background)
 *   Very slow, large-amplitude sine waves. Near-invisible. Creates depth.
 *   These are purely generative — not audio-reactive. They breathe.
 *
 * LAYER 2 — HARMONIC RIBBONS (mid)
 *   3–4 stacked wavetable ribbons, each offset in phase and amplitude.
 *   Driven by FFT energy bands (bass, mid, high).
 *   Smooth interpolation — no jitter. Organic, not mechanical.
 *
 * LAYER 3 — PRIMARY WAVEFORM (hero)
 *   Single premium hairline waveform from time-domain data.
 *   Bezier-smoothed. The emotional centerpiece.
 *   Glows softly with the mood color.
 *
 * LAYER 4 — PARTICLES (atmosphere)
 *   Sparse drifting dots. Minimal. Atmospheric. Not reactive to beats.
 *
 * No bars. No spectrum analyzer. No EDM energy.
 * Movement: analog, organic, alive, cinematic.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useCallback, useEffect, useRef } from "react";

interface VisualizerProps {
  getAnalyserData: () => Float32Array | null;
  getWaveformData: () => Float32Array | null;
  isPlaying: boolean;
  moodColor: string;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
}

// Brand palette hex → RGB
function moodToRgb(hex: string): [number, number, number] {
  const map: Record<string, [number, number, number]> = {
    "#E8622A": [232, 98,  42],   // warm orange
    "#2E3D4F": [46,  61,  79],   // steel navy
    "#F2C14E": [242, 193, 78],   // golden amber
    "#1E2028": [30,  32,  40],   // dark charcoal
    "#C9383A": [201, 56,  58],   // crimson
    "#E8E6D0": [232, 230, 208],  // parchment cream
    "#0D0F14": [13,  15,  20],   // deep black
  };
  return map[hex] || [46, 61, 79];
}

function rgb(r: number, g: number, b: number, a: number): string {
  return `rgba(${r},${g},${b},${a})`;
}

export function Visualizer({ getAnalyserData, getWaveformData, isPlaying, moodColor, className }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const tRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);

  // Smoothed data buffers
  const waveSmoothedRef = useRef<Float32Array>(new Float32Array(512).fill(0));
  const fftSmoothedRef = useRef<Float32Array>(new Float32Array(256).fill(0));
  const energyRef = useRef({ bass: 0, mid: 0, high: 0, overall: 0 });

  // Initialize particles
  const initParticles = useCallback((w: number, h: number) => {
    const count = Math.min(40, Math.floor((w * h) / 20000));
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.08,
      size: 0.6 + Math.random() * 1.2,
      opacity: 0,
      life: Math.random() * 300,
      maxLife: 200 + Math.random() * 300,
    }));
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width / window.devicePixelRatio;
    const H = canvas.height / window.devicePixelRatio;
    const dpr = window.devicePixelRatio || 1;

    // Use logical pixels for all drawing
    ctx.save();
    ctx.scale(dpr, dpr);

    tRef.current += 0.006;
    const t = tRef.current;
    const [mr, mg, mb] = moodToRgb(moodColor);

    // ── Update audio data ─────────────────────────────────────────────────
    const rawWave = getWaveformData();
    const rawFft = getAnalyserData();
    const ws = waveSmoothedRef.current;
    const fs = fftSmoothedRef.current;

    if (rawWave && isPlaying) {
      for (let i = 0; i < ws.length; i++) {
        ws[i] = ws[i] * 0.80 + (rawWave[i] || 0) * 0.20;
      }
    } else {
      // Gentle idle breathing — slow sine
      for (let i = 0; i < ws.length; i++) {
        const idle = Math.sin(t * 0.6 + i * 0.04) * 0.018
                   + Math.sin(t * 0.25 + i * 0.015) * 0.010;
        ws[i] = ws[i] * 0.97 + idle * 0.03;
      }
    }

    if (rawFft && isPlaying) {
      for (let i = 0; i < fs.length; i++) {
        const norm = Math.max(0, (rawFft[i] + 100) / 80);
        fs[i] = fs[i] * 0.88 + norm * 0.12;
      }
    } else {
      for (let i = 0; i < fs.length; i++) {
        fs[i] *= 0.98;
      }
    }

    // Energy bands
    const bassEnd = Math.floor(fs.length * 0.08);
    const midEnd = Math.floor(fs.length * 0.4);
    let bass = 0, mid = 0, high = 0;
    for (let i = 0; i < bassEnd; i++) bass += fs[i];
    for (let i = bassEnd; i < midEnd; i++) mid += fs[i];
    for (let i = midEnd; i < fs.length; i++) high += fs[i];
    bass /= bassEnd; mid /= (midEnd - bassEnd); high /= (fs.length - midEnd);
    const e = energyRef.current;
    e.bass    = e.bass    * 0.88 + bass    * 0.12;
    e.mid     = e.mid     * 0.88 + mid     * 0.12;
    e.high    = e.high    * 0.88 + high    * 0.12;
    e.overall = e.overall * 0.88 + (bass * 0.5 + mid * 0.3 + high * 0.2) * 0.12;

    // ── Clear ─────────────────────────────────────────────────────────────
    ctx.clearRect(0, 0, W, H);

    // ── LAYER 1: DEEP FIELD ───────────────────────────────────────────────
    // Very slow, large generative sine waves — pure atmosphere, not audio-reactive
    {
      const numDeep = 3;
      for (let d = 0; d < numDeep; d++) {
        const phase = (d / numDeep) * Math.PI * 2;
        const amp = H * (0.06 + d * 0.03);
        const freq = 0.8 + d * 0.4;
        const speed = 0.15 + d * 0.08;
        const yBase = H * (0.3 + d * 0.15);
        const alpha = (0.025 - d * 0.006) * (isPlaying ? 1 : 0.4);

        ctx.save();
        ctx.strokeStyle = rgb(mr, mg, mb, alpha);
        ctx.lineWidth = 0.5;
        ctx.beginPath();

        for (let x = 0; x <= W; x += 3) {
          const y = yBase
            + Math.sin(x / W * Math.PI * freq + t * speed + phase) * amp
            + Math.sin(x / W * Math.PI * freq * 1.7 + t * speed * 0.6 + phase * 1.3) * amp * 0.4;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      }
    }

    // ── LAYER 2: HARMONIC RIBBONS ─────────────────────────────────────────
    // Stacked wavetable ribbons driven by audio energy bands
    // Each ribbon is a smoothed, bezier-interpolated wave
    {
      const ribbons = [
        { yFrac: 0.38, ampBase: H * 0.08, energy: e.bass,    speed: 0.4, alpha: 0.12, width: 1.0 },
        { yFrac: 0.46, ampBase: H * 0.06, energy: e.mid,     speed: 0.6, alpha: 0.09, width: 0.7 },
        { yFrac: 0.54, ampBase: H * 0.05, energy: e.high,    speed: 0.9, alpha: 0.07, width: 0.5 },
        { yFrac: 0.50, ampBase: H * 0.10, energy: e.overall, speed: 0.3, alpha: 0.06, width: 1.5 },
      ];

      ribbons.forEach((r, ri) => {
        const yCenter = H * r.yFrac;
        const amp = r.ampBase * (1 + r.energy * 3);
        const pts: [number, number][] = [];
        const step = 8;

        for (let x = 0; x <= W; x += step) {
          const nx = x / W;
          // Multi-harmonic wave — organic, not mechanical
          const y = yCenter
            + Math.sin(nx * Math.PI * 2 + t * r.speed + ri * 0.8) * amp
            + Math.sin(nx * Math.PI * 3.7 + t * r.speed * 1.3 + ri * 1.2) * amp * 0.45
            + Math.sin(nx * Math.PI * 1.3 + t * r.speed * 0.7 + ri * 0.5) * amp * 0.3
            + ws[Math.floor(nx * ws.length)] * H * 0.04;
          pts.push([x, y]);
        }

        // Draw with quadratic bezier for smoothness
        ctx.save();
        ctx.strokeStyle = rgb(mr, mg, mb, r.alpha * (isPlaying ? 1 : 0.35));
        ctx.lineWidth = r.width;
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length - 1; i++) {
          const mx = (pts[i][0] + pts[i + 1][0]) / 2;
          const my = (pts[i][1] + pts[i + 1][1]) / 2;
          ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
        }
        ctx.stroke();
        ctx.restore();
      });
    }

    // ── LAYER 3: PRIMARY WAVEFORM (hero) ─────────────────────────────────
    // Single premium waveform — the emotional centerpiece
    // Audio data + generative motion layered for constant movement
    {
      const yCenter = H * 0.5;
      // Larger amplitude: audio data amplified + generative motion always present
      const audioAmp = H * (0.22 + e.overall * 0.28);
      // Generative motion amplitude — always moving even at low audio levels
      const genAmp = H * (0.08 + e.overall * 0.06);
      const pts: [number, number][] = [];
      const step = 2; // finer resolution for smoother curves

      for (let i = 0; i < ws.length; i += step) {
        const x = (i / ws.length) * W;
        const nx = i / ws.length;

        // Audio-reactive component (amplified)
        const audioY = ws[i] * audioAmp;

        // Generative motion — always present, gives life when audio is quiet
        const genY = Math.sin(nx * Math.PI * 2.5 + t * 0.7) * genAmp
                   + Math.sin(nx * Math.PI * 4.1 + t * 1.1) * genAmp * 0.5
                   + Math.sin(nx * Math.PI * 1.2 + t * 0.4) * genAmp * 0.35;

        pts.push([x, yCenter + audioY + genY]);
      }

      // Outer glow — wide and soft
      ctx.save();
      ctx.shadowBlur = isPlaying ? 28 : 10;
      ctx.shadowColor = rgb(mr, mg, mb, 0.5);
      ctx.strokeStyle = rgb(mr, mg, mb, isPlaying ? 0.18 : 0.06);
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i][0] + pts[i + 1][0]) / 2;
        const my = (pts[i][1] + pts[i + 1][1]) / 2;
        ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
      }
      ctx.stroke();
      ctx.restore();

      // Mid glow — tighter
      ctx.save();
      ctx.strokeStyle = rgb(mr, mg, mb, isPlaying ? 0.30 : 0.10);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i][0] + pts[i + 1][0]) / 2;
        const my = (pts[i][1] + pts[i + 1][1]) / 2;
        ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
      }
      ctx.stroke();
      ctx.restore();

      // Core line — bright and sharp
      ctx.save();
      ctx.strokeStyle = rgb(mr, mg, mb, isPlaying ? 0.88 : 0.35);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i][0] + pts[i + 1][0]) / 2;
        const my = (pts[i][1] + pts[i + 1][1]) / 2;
        ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
      }
      ctx.stroke();
      ctx.restore();

      // Center baseline — very subtle reference line
      ctx.save();
      ctx.strokeStyle = rgb(mr, mg, mb, 0.05);
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, yCenter);
      ctx.lineTo(W, yCenter);
      ctx.stroke();
      ctx.restore();
    }

    // ── LAYER 4: PARTICLES ────────────────────────────────────────────────
    // Sparse, slow, atmospheric — not beat-reactive
    {
      particlesRef.current.forEach(p => {
        p.life += 1;
        if (p.life > p.maxLife) {
          p.x = Math.random() * W;
          p.y = Math.random() * H;
          p.life = 0;
          p.maxLife = 200 + Math.random() * 300;
        }

        // Gentle drift — no audio reactivity on particles
        p.x += p.vx + Math.sin(t * 0.2 + p.y * 0.01) * 0.08;
        p.y += p.vy + Math.cos(t * 0.15 + p.x * 0.01) * 0.04;

        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;

        const lr = p.life / p.maxLife;
        const fade = Math.min(1, lr * 4) * Math.max(0, 1 - (lr - 0.75) * 4);
        const maxAlpha = 0.12 + e.overall * 0.08;
        p.opacity = maxAlpha * fade * (isPlaying ? 1 : 0.3);

        if (p.opacity > 0.005) {
          ctx.save();
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = rgb(mr, mg, mb, 1);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });
    }

    ctx.restore();
    animRef.current = requestAnimationFrame(render);
  }, [getAnalyserData, getWaveformData, isPlaying, moodColor]);

  // Handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      initParticles(rect.width, rect.height);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [initParticles]);

  // Animation loop
  useEffect(() => {
    animRef.current = requestAnimationFrame(render);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [render]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}
