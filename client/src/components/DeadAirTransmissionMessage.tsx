/*
 * TransmissionMessage — Atmospheric text overlay
 * Design: Braun Noir — large amber headline, low-contrast gray subtext
 * Behavior: fades in 0.5s, stays 2.5–3.5s, fades out 0.6s — never interrupts
 */

import { useEffect, useRef, useState } from "react";
import type { Transmission } from "../lib/deadAirTransmissions";

interface TransmissionMessageProps {
  transmission: Transmission | null;
}

// Display duration: 2.5s visible + 0.5s fade-in + 0.6s fade-out
const DISPLAY_MS = 2500;

export default function TransmissionMessage({ transmission }: TransmissionMessageProps) {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<Transmission | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!transmission) return;

    // Clear pending timers
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (swapTimerRef.current) clearTimeout(swapTimerRef.current);

    if (visible && current) {
      // Fade out current, then swap in new
      setVisible(false);
      swapTimerRef.current = setTimeout(() => {
        setCurrent(transmission);
        setVisible(true);
        hideTimerRef.current = setTimeout(() => setVisible(false), DISPLAY_MS);
      }, 450);
    } else {
      setCurrent(transmission);
      setVisible(true);
      hideTimerRef.current = setTimeout(() => setVisible(false), DISPLAY_MS);
    }

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (swapTimerRef.current) clearTimeout(swapTimerRef.current);
    };
  }, [transmission]);

  if (!current) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: "absolute",
        top: "clamp(68px, 11vh, 108px)",
        left: "50%",
        transform: "translateX(-50%)",
        textAlign: "center",
        pointerEvents: "none",
        zIndex: 20,
        opacity: visible ? 1 : 0,
        transition: visible
          ? "opacity 0.5s cubic-bezier(0.23, 1, 0.32, 1)"
          : "opacity 0.6s ease-in",
        whiteSpace: "nowrap",
        maxWidth: "90vw",
      }}
    >
      {/* Headline */}
      <div
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "clamp(0.7rem, 1.7vw, 1.1rem)",
          fontWeight: 700,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: "oklch(0.72 0.14 65)",
          textShadow: "0 0 28px oklch(0.72 0.14 65 / 50%)",
          lineHeight: 1.1,
        }}
      >
        {current.headline}
      </div>

      {/* Optional subtext */}
      {current.subtext && (
        <div
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "clamp(0.42rem, 0.9vw, 0.58rem)",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "oklch(0.42 0.006 75)",
            marginTop: "6px",
            lineHeight: 1.3,
          }}
        >
          {current.subtext}
        </div>
      )}
    </div>
  );
}
