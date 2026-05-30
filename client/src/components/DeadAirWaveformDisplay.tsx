/*
 * WaveformDisplay — Right side (desktop) / bottom stacked (mobile) signal panel
 * Design: Braun Noir — amber dot-matrix spectrum, analog oscilloscope feel
 * Responsive: fills container width at all sizes
 */

import { useEffect, useRef } from "react";

interface WaveformDisplayProps {
  analyserNode: AnalyserNode | null;
  signalStrength: number;
  started: boolean;
}

export default function WaveformDisplay({
  analyserNode,
  signalStrength,
  started,
}: WaveformDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const COLS = 22;
    const ROWS = 20;
    const dotR = 2.0;
    const cw = W / COLS;
    const rh = H / ROWS;

    const draw = () => {
      timeRef.current += 0.016;
      ctx.clearRect(0, 0, W, H);

      let colData: number[] = [];

      if (!started || !analyserNode) {
        for (let c = 0; c < COLS; c++) {
          const wave = Math.sin(timeRef.current * 0.4 + c * 0.5) * 0.5 + 0.5;
          colData.push(wave * 0.14 + Math.random() * 0.04);
        }
      } else {
        const bufLen = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufLen);
        analyserNode.getByteFrequencyData(dataArray);

        for (let c = 0; c < COLS; c++) {
          const start = Math.floor((c / COLS) * bufLen * 0.7);
          const end = Math.floor(((c + 1) / COLS) * bufLen * 0.7);
          let sum = 0;
          for (let i = start; i < end; i++) sum += dataArray[i];
          const avg = end > start ? sum / (end - start) : 0;
          colData.push((avg / 255) * signalStrength + Math.random() * 0.025);
        }
      }

      for (let c = 0; c < COLS; c++) {
        const level = Math.min(1, colData[c]);
        const activeDots = Math.round(level * ROWS);

        for (let r = 0; r < ROWS; r++) {
          const x = (c + 0.5) * cw;
          const y = H - (r + 0.5) * rh;
          const isActive = r < activeDots;

          if (isActive) {
            const brightness = 0.42 + (r / ROWS) * 0.58;
            ctx.fillStyle = `rgba(230, 160, 32, ${brightness})`;
            ctx.beginPath();
            ctx.arc(x, y, dotR, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = "rgba(200, 190, 175, 0.055)";
            ctx.beginPath();
            ctx.arc(x, y, dotR * 0.6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Vertical cursor line
      ctx.strokeStyle = "rgba(230, 160, 32, 0.28)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(W / 2, 4);
      ctx.lineTo(W / 2, H - 4);
      ctx.stroke();
      ctx.setLineDash([]);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [analyserNode, signalStrength, started]);

  return (
    <div
      style={{
        background: "oklch(0.105 0.006 60 / 88%)",
        border: "1px solid oklch(1 0 0 / 7%)",
        borderRadius: "12px",
        padding: "clamp(14px, 2vw, 24px)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 4px 28px oklch(0 0 0 / 55%), inset 0 1px 0 oklch(1 0 0 / 5%)",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "clamp(0.5rem, 0.85vw, 0.6rem)",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "oklch(0.45 0.007 75)",
          marginBottom: "10px",
        }}
      >
        Signal
      </div>
      <canvas
        ref={canvasRef}
        width={220}
        height={120}
        style={{ width: "100%", display: "block" }}
        aria-label="Signal spectrum display"
      />
    </div>
  );
}
