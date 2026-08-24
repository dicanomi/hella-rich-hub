/**
 * THE_MACHINE.EXE — Market Pulse (ECG + Audio Visualiser)
 *
 * ENGAGED: reads live waveform from MachineSoundEngine AnalyserNode.
 * MUTED:   falls back to scripted ECG heartbeat animation.
 */
import { useEffect, useRef } from 'react';
import { getMachineSoundEngine } from './MachineSoundEngine';

const WAVE_POINTS: [number, number][] = [
  [0.00,  0.000], [0.28,  0.000],
  [0.32,  0.000], [0.34,  0.030], [0.36,  0.045], [0.38,  0.030], [0.40,  0.000],
  [0.42,  0.000], [0.44, -0.040], [0.46,  0.000], [0.47,  0.420],
  [0.49, -0.180], [0.50, -0.220], [0.51, -0.160], [0.52,  0.000],
  [0.54,  0.050], [0.56,  0.080], [0.58,  0.060], [0.60,  0.030],
  [0.62,  0.000], [0.64,  0.040], [0.66,  0.060], [0.68,  0.040], [0.70,  0.000],
  [1.00,  0.000],
];

interface Particle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number; }

interface MarketPulseProps { width?: number | string; height?: number; }

export function MarketPulse({ width = '100%', height = 72 }: MarketPulseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const timeRef = useRef(0);
  const flickerRef = useRef(1.0);
  const flickerTargetRef = useRef(1.0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const CYCLE = 2.8;
    let lastSpawn = -1;

    const spawnParticle = (px: number, py: number) => {
      if (particlesRef.current.length > 18) return;
      particlesRef.current.push({
        x: px + (Math.random() - 0.5) * 6, y: py + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 0.6, vy: -(Math.random() * 0.8 + 0.2),
        life: 1.0, maxLife: 40 + Math.random() * 30, size: 0.8 + Math.random() * 1.2,
      });
    };

    const draw = (ts: number) => {
      const rect = canvas.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;
      const cy = H * 0.5;
      const amplitude = H * 0.38;

      if (Math.random() < 0.04) flickerTargetRef.current = 0.82 + Math.random() * 0.18;
      flickerRef.current += (flickerTargetRef.current - flickerRef.current) * 0.12;
      const flicker = flickerRef.current;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);

      const engine = getMachineSoundEngine();
      const analyser = engine.getAnalyser();
      const isMuted = engine.isMuted();

      if (analyser && !isMuted) {
        // ── AUDIO MODE ──────────────────────────────────────────────────────
        const bufLen = analyser.frequencyBinCount;
        const dataArr = new Float32Array(bufLen);
        analyser.getFloatTimeDomainData(dataArr);

        // Glow layer
        ctx.save();
        ctx.globalAlpha = flicker * 0.28;
        ctx.strokeStyle = '#FF8C2A';
        ctx.lineWidth = 5;
        ctx.filter = 'blur(4px)';
        ctx.beginPath();
        for (let i = 0; i < bufLen; i++) {
          const x = (i / bufLen) * W;
          const y = cy - dataArr[i] * amplitude * 2.8;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();

        // Core line
        ctx.save();
        ctx.globalAlpha = flicker;
        ctx.strokeStyle = '#FFB35A';
        ctx.lineWidth = 1.5;
        ctx.lineJoin = 'round';
        ctx.shadowColor = '#FF8C2A';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        for (let i = 0; i < bufLen; i++) {
          const x = (i / bufLen) * W;
          const y = cy - dataArr[i] * amplitude * 2.8;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();

        // Peak glow + particles
        let peakIdx = 0; let peakVal = 0;
        for (let i = 0; i < bufLen; i++) {
          if (Math.abs(dataArr[i]) > peakVal) { peakVal = Math.abs(dataArr[i]); peakIdx = i; }
        }
        const peakX = (peakIdx / bufLen) * W;
        const peakY = cy - dataArr[peakIdx] * amplitude * 2.8;
        if (peakVal > 0.04) {
          const grd = ctx.createRadialGradient(peakX, peakY, 0, peakX, peakY, 20 + peakVal * 50);
          grd.addColorStop(0, `rgba(255,179,90,${0.18 * peakVal * flicker})`);
          grd.addColorStop(1, 'rgba(255,140,42,0)');
          ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = grd;
          ctx.fillRect(peakX - 50, peakY - 50, 100, 100); ctx.restore();
          if (peakVal > 0.12 && Math.floor(ts / 250) !== lastSpawn) {
            lastSpawn = Math.floor(ts / 250); spawnParticle(peakX, peakY);
          }
        }

      } else {
        // ── SCRIPTED ECG MODE ───────────────────────────────────────────────
        timeRef.current = (ts / 1000 / CYCLE) % 1;
        const t = timeRef.current;
        const headX = t * W;

        const drawWave = (offsetX: number, alpha: number) => {
          if (alpha <= 0) return;
          ctx.save();
          ctx.globalAlpha = alpha * flicker * 0.35;
          ctx.strokeStyle = '#FF8C2A'; ctx.lineWidth = 5; ctx.filter = 'blur(4px)';
          ctx.beginPath();
          for (let i = 0; i < WAVE_POINTS.length; i++) {
            const [nx, ny] = WAVE_POINTS[i];
            const px = nx * W + offsetX; const py = cy - ny * amplitude;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.stroke(); ctx.restore();
          ctx.save();
          ctx.globalAlpha = alpha * flicker;
          ctx.strokeStyle = '#FFB35A'; ctx.lineWidth = 1.5;
          ctx.lineJoin = 'round'; ctx.shadowColor = '#FF8C2A'; ctx.shadowBlur = 6;
          ctx.beginPath();
          for (let i = 0; i < WAVE_POINTS.length; i++) {
            const [nx, ny] = WAVE_POINTS[i];
            const px = nx * W + offsetX; const py = cy - ny * amplitude;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.stroke(); ctx.restore();
        };

        ctx.save(); ctx.rect(0, 0, W, H); ctx.clip();
        drawWave(-t * W + W, 0.45);
        drawWave(-t * W, 1.0);
        ctx.restore();

        let scanY = cy;
        for (let i = 1; i < WAVE_POINTS.length; i++) {
          const [x0, y0] = WAVE_POINTS[i - 1]; const [x1, y1] = WAVE_POINTS[i];
          if (t >= x0 && t <= x1) {
            scanY = cy - (y0 + (y1 - y0) * ((t - x0) / (x1 - x0))) * amplitude; break;
          }
        }
        const spikeGlow = Math.max(0, 1 - Math.abs(t - 0.47) * 14);
        if (spikeGlow > 0.01) {
          const grd = ctx.createRadialGradient(headX, scanY, 0, headX, scanY, 28 + spikeGlow * 22);
          grd.addColorStop(0, `rgba(255,179,90,${0.28 * spikeGlow * flicker})`);
          grd.addColorStop(1, 'rgba(255,140,42,0)');
          ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = grd;
          ctx.fillRect(headX - 50, scanY - 50, 100, 100); ctx.restore();
          if (Math.floor(t * 100) !== lastSpawn && spikeGlow > 0.6) {
            lastSpawn = Math.floor(t * 100); spawnParticle(headX, scanY);
          }
        }
      }

      // Particles (shared)
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx; p.y += p.vy; p.vy *= 0.97; p.vx *= 0.98;
        p.life -= 1 / p.maxLife;
        if (p.life <= 0) return false;
        ctx.save(); ctx.globalAlpha = p.life * 0.55 * flicker;
        ctx.fillStyle = '#FFB35A'; ctx.shadowColor = '#FF8C2A'; ctx.shadowBlur = 4;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        return true;
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: typeof width === 'number' ? `${width}px` : width, height: `${height}px`, background: '#000' }}
      aria-hidden="true"
    />
  );
}
