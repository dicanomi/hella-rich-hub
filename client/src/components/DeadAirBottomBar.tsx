/*
 * BottomBar — Volume control, elapsed time, system label
 * Design: Braun Noir — minimal, monospace, amber accent
 * Desktop: fixed at bottom of viewport
 * Mobile: flows naturally after stacked panels (not fixed)
 */

import { useEffect, useState } from "react";

interface BottomBarProps {
  volume: number;
  onVolumeChange: (v: number) => void;
  started: boolean;
}

function useElapsedTime(started: boolean) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!started) return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [started]);
  const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export default function BottomBar({ volume, onVolumeChange, started }: BottomBarProps) {
  const elapsed = useElapsedTime(started);
  const volPct = Math.round(volume * 100);

  return (
    <>
      <style>{`
        .dead-air-range {
          -webkit-appearance: none;
          appearance: none;
          height: 2px;
          outline: none;
          cursor: pointer;
          border-radius: 1px;
        }
        .dead-air-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: oklch(0.72 0.14 65);
          box-shadow: 0 0 6px oklch(0.72 0.14 65 / 55%);
          cursor: pointer;
        }
        .dead-air-range::-moz-range-thumb {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: oklch(0.72 0.14 65);
          border: none;
          cursor: pointer;
        }
        .dead-air-bottom {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: clamp(6px, 1.2vmin, 12px) clamp(16px, 3vw, 44px) clamp(12px, 2vmin, 20px);
          flex-shrink: 0;
        }
        /* On mobile, add a top border to separate from stacked panels */
        @media (max-width: 959px) {
          .dead-air-bottom {
            border-top: 1px solid oklch(1 0 0 / 6%);
            margin-top: clamp(8px, 2vmin, 16px);
          }
        }
      `}</style>

      <div className="dead-air-bottom">
        {/* Volume */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "clamp(0.48rem, 0.82vw, 0.58rem)",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "oklch(0.36 0.005 75)",
            }}
          >
            Volume
          </span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" style={{ opacity: 0.3 }}>
            <path d="M1.5 4H3.5L6 1.5V10.5L3.5 8H1.5V4Z" fill="oklch(0.88 0.012 75)" />
            <path d="M7.5 3.5C8.2 4.2 8.6 5 8.6 6C8.6 7 8.2 7.8 7.5 8.5" stroke="oklch(0.88 0.012 75)" strokeWidth="1" strokeLinecap="round" />
          </svg>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="dead-air-range"
            style={{
              width: "clamp(72px, 9vw, 130px)",
              background: `linear-gradient(to right, oklch(0.72 0.14 65) ${volPct}%, oklch(1 0 0 / 11%) ${volPct}%)`,
            }}
            aria-label="Volume"
          />
        </div>

        {/* Elapsed time — centered */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            fontFamily: "'Space Mono', monospace",
            fontSize: "clamp(0.55rem, 1.1vw, 0.68rem)",
            letterSpacing: "0.15em",
            color: started ? "oklch(0.48 0.007 75)" : "oklch(0.28 0.004 75)",
            fontVariantNumeric: "tabular-nums",
            transition: "color 0.5s ease",
          }}
        >
          {started ? elapsed : "00:00:00"}
        </div>

        {/* Right label */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "clamp(0.44rem, 0.78vw, 0.56rem)",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "oklch(0.28 0.004 75)",
            }}
          >
            Late Night Radio Scanner
          </span>
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: started ? "oklch(0.72 0.14 65)" : "oklch(0.28 0.004 75)",
              boxShadow: started ? "0 0 8px oklch(0.72 0.14 65 / 75%)" : "none",
              transition: "all 0.6s ease",
              flexShrink: 0,
            }}
          />
        </div>
      </div>
    </>
  );
}
