/*
 * FrequencyPanel — Left side info panel (desktop) / top stacked panel (mobile)
 * Design: Braun Noir — dark glass, amber frequency digits, signal bar graph
 * Responsive: fills container width at all sizes
 */

import { useEffect, useRef } from "react";

interface FrequencyPanelProps {
  frequency: number;
  signalStrength: number;
  isStatic: boolean;
  started: boolean;
}

export default function FrequencyPanel({
  frequency,
  signalStrength,
  isStatic,
  started,
}: FrequencyPanelProps) {
  const freqStr = frequency.toFixed(1);
  const [intPart, decPart] = freqStr.split(".");
  const barCount = 12;
  const activeBars = started ? Math.round(signalStrength * barCount) : 0;

  const flickerRef = useRef<number[]>(Array(barCount).fill(1));
  useEffect(() => {
    if (!isStatic || !started) return;
    const interval = setInterval(() => {
      flickerRef.current = Array(barCount).fill(0).map(() => 0.3 + Math.random() * 0.7);
    }, 80);
    return () => clearInterval(interval);
  }, [isStatic, started]);

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
      {/* Frequency section */}
      <div style={{ marginBottom: "clamp(12px, 1.8vw, 20px)" }}>
        <div
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "clamp(0.5rem, 0.85vw, 0.6rem)",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "oklch(0.45 0.007 75)",
            marginBottom: "8px",
          }}
        >
          Frequency
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
          <span
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "clamp(1.6rem, 3.2vw, 2.6rem)",
              fontWeight: 700,
              lineHeight: 1,
              color: started ? "oklch(0.72 0.14 65)" : "oklch(0.72 0.14 65 / 30%)",
              transition: "color 0.4s ease, text-shadow 0.4s ease",
              fontVariantNumeric: "tabular-nums",
              textShadow: started ? "0 0 28px oklch(0.72 0.14 65 / 30%)" : "none",
            }}
          >
            {intPart}
            <span style={{ fontSize: "52%", fontWeight: 400 }}>.{decPart}</span>
          </span>
          <span
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "clamp(0.48rem, 0.82vw, 0.58rem)",
              color: "oklch(0.42 0.007 75)",
              letterSpacing: "0.1em",
              paddingBottom: "2px",
            }}
          >
            MHz
          </span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "oklch(1 0 0 / 6%)", marginBottom: "clamp(12px, 1.8vw, 18px)" }} />

      {/* Signal section */}
      <div>
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
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "clamp(2px, 0.4vw, 4px)",
            height: "clamp(20px, 3.5vmin, 30px)",
          }}
        >
          {Array.from({ length: barCount }).map((_, i) => {
            const isActive = i < activeBars;
            const heightPct = 22 + (i / (barCount - 1)) * 78;
            const flicker = flickerRef.current[i] ?? 1;
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${heightPct}%`,
                  borderRadius: "1px",
                  background: isActive
                    ? `oklch(0.72 0.14 65 / ${isStatic ? flicker : 1})`
                    : "oklch(1 0 0 / 7%)",
                  transition: isStatic ? "none" : "background 0.15s ease",
                  boxShadow: isActive ? "0 0 6px oklch(0.72 0.14 65 / 35%)" : "none",
                  alignSelf: "flex-end",
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
