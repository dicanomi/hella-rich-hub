/*
 * TuningDial — The primary interaction element
 *
 * Sizing strategy:
 * - Desktop: min(68vmin, 520px) outer container (arc SVG fills this)
 * - Mobile: min(90vw, 420px) — fills most of the screen width
 * - Dial image = 65% of outer container
 *
 * Alignment: single source of truth
 * - Notch is at top of dial image (12 o'clock)
 * - NOTCH_OFFSET = -90° (top = -90° in screen coords)
 * - needleDeg = NOTCH_OFFSET + angle → needle always matches notch
 * - Nearest tick to needle is highlighted amber
 *
 * Clickable frequency numbers:
 * - Each major tick label (70, 80, 90, 100, 110, 120) is tappable
 * - Click triggers smooth weighted animation to that frequency
 * - 120 MHz: slower travel, slight overshoot, special tension
 * - Hover: subtle amber glow on label
 * - Touch targets: 12×12 SVG units (generous)
 */

import { useCallback, useEffect, useRef, useState } from "react";

const DIAL_IMAGE_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663292290338/9ZxPKGjDMY2C56HR5iUGn8/dial-eUGeMiXR6xxUeNgQFS9Mns.webp";

// Arc constants — must match DeadAir.tsx exactly
const ARC_START = -225;
const ARC_SPAN = 270;
const NOTCH_OFFSET = -90;

interface TuningDialProps {
  angle: number;
  onAngleChange: (delta: number) => void;
  onAngleSet: (targetAngle: number) => void; // for animated jumps
  onStart: () => void;
  started: boolean;
  frequency: number;
  freqMin: number;
  freqMax: number;
  signalStrength?: number;
}

/**
 * Convert a target frequency to the dial angle that produces it.
 * Inverse of getFrequency() in DeadAir.tsx.
 */
function freqToAngle(freq: number, freqMin: number, freqMax: number): number {
  const norm = (freq - freqMin) / (freqMax - freqMin);
  // relDeg = norm * ARC_SPAN
  // needleDeg = ARC_START + relDeg
  // needleDeg = NOTCH_OFFSET + angle → angle = needleDeg - NOTCH_OFFSET
  const needleDeg = ARC_START + norm * ARC_SPAN;
  return needleDeg - NOTCH_OFFSET;
}

export default function TuningDial({
  angle,
  onAngleChange,
  onAngleSet,
  onStart,
  started,
  frequency,
  freqMin,
  freqMax,
  signalStrength = 0,
}: TuningDialProps) {
  const dialRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastAngle = useRef(0);
  const velocityRef = useRef(0);
  const lastTimeRef = useRef(0);
  const inertiaRef = useRef<number | null>(null);
  const animRef = useRef<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDraggingState, setIsDraggingState] = useState(false);
  const [hoveredFreq, setHoveredFreq] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const getPointerAngle = useCallback((clientX: number, clientY: number) => {
    const el = dialRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
  }, []);

  const stopInertia = useCallback(() => {
    if (inertiaRef.current !== null) {
      cancelAnimationFrame(inertiaRef.current);
      inertiaRef.current = null;
    }
  }, []);

  const stopAnimation = useCallback(() => {
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    setIsAnimating(false);
  }, []);

  const applyInertia = useCallback((velocity: number) => {
    stopInertia();
    let v = velocity;
    const decay = 0.91;
    const step = () => {
      if (Math.abs(v) < 0.04) return;
      onAngleChange(v);
      v *= decay;
      inertiaRef.current = requestAnimationFrame(step);
    };
    inertiaRef.current = requestAnimationFrame(step);
  }, [onAngleChange, stopInertia]);

  /**
   * Animate dial to a target frequency.
   * Uses a spring-like easing with slight overshoot for premium feel.
   * 120 MHz: slower, more deliberate, tiny extra overshoot.
   */
  const animateToFrequency = useCallback((targetFreq: number) => {
    if (!started) { onStart(); return; }
    stopInertia();
    stopAnimation();

    const targetAngle = freqToAngle(targetFreq, freqMin, freqMax);
    const startAngle = angle;
    const distance = Math.abs(targetAngle - startAngle);

    // Duration: 600–1200ms based on distance, 120 MHz gets +200ms
    const baseDuration = Math.min(1200, Math.max(600, distance * 3.5));
    const duration = targetFreq === 120 ? baseDuration + 200 : baseDuration;

    // Overshoot amount: subtle, more for 120 MHz
    const overshootDeg = targetFreq === 120 ? 4.5 : 2.5;
    const overshootAngle = targetAngle + (targetAngle > startAngle ? overshootDeg : -overshootDeg);

    const startTime = performance.now();
    setIsAnimating(true);

    // Phase 1: ease to overshoot (0 → 0.78 of duration)
    // Phase 2: spring back to target (0.78 → 1.0)
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);

      let currentAngle: number;

      if (t < 0.78) {
        // Ease out expo to overshoot
        const t1 = t / 0.78;
        const eased = t1 === 1 ? 1 : 1 - Math.pow(2, -10 * t1);
        currentAngle = startAngle + (overshootAngle - startAngle) * eased;
      } else {
        // Spring back from overshoot to target
        const t2 = (t - 0.78) / 0.22;
        const eased = t2 === 1 ? 1 : 1 - Math.pow(2, -10 * t2);
        currentAngle = overshootAngle + (targetAngle - overshootAngle) * eased;
      }

      onAngleSet(currentAngle);

      if (t < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        onAngleSet(targetAngle);
        setIsAnimating(false);
        animRef.current = null;
      }
    };

    animRef.current = requestAnimationFrame(tick);
  }, [started, onStart, angle, freqMin, freqMax, onAngleSet, stopInertia, stopAnimation]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (!started) { onStart(); return; }
    stopInertia();
    stopAnimation();
    isDragging.current = true;
    setIsDraggingState(true);
    lastAngle.current = getPointerAngle(e.clientX, e.clientY);
    lastTimeRef.current = Date.now();
    velocityRef.current = 0;
  }, [started, onStart, getPointerAngle, stopInertia, stopAnimation]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const newAngle = getPointerAngle(e.clientX, e.clientY);
      let delta = newAngle - lastAngle.current;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      const now = Date.now();
      const dt = now - lastTimeRef.current;
      if (dt > 0) velocityRef.current = delta / (dt / 16);
      lastAngle.current = newAngle;
      lastTimeRef.current = now;
      onAngleChange(delta);
    };
    const onMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      setIsDraggingState(false);
      applyInertia(velocityRef.current);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [getPointerAngle, onAngleChange, applyInertia]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (!started) { onStart(); return; }
    stopInertia();
    stopAnimation();
    isDragging.current = true;
    const t = e.touches[0];
    lastAngle.current = getPointerAngle(t.clientX, t.clientY);
    lastTimeRef.current = Date.now();
    velocityRef.current = 0;
  }, [started, onStart, getPointerAngle, stopInertia, stopAnimation]);

  useEffect(() => {
    const el = dialRef.current;
    if (!el) return;
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const t = e.touches[0];
      const newAngle = getPointerAngle(t.clientX, t.clientY);
      let delta = newAngle - lastAngle.current;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      const now = Date.now();
      const dt = now - lastTimeRef.current;
      if (dt > 0) velocityRef.current = delta / (dt / 16);
      lastAngle.current = newAngle;
      lastTimeRef.current = now;
      onAngleChange(delta);
    };
    const onTouchEnd = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      applyInertia(velocityRef.current);
    };
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [getPointerAngle, onAngleChange, applyInertia]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (!started) { onStart(); return; }
    stopAnimation();
    onAngleChange(e.deltaY * 0.12);
  }, [started, onStart, onAngleChange, stopAnimation]);

  // Arc geometry
  const needleDeg = NOTCH_OFFSET + angle;
  const CX = 100, CY = 100;
  const toXY = (r: number, deg: number) => ({
    x: CX + r * Math.cos((deg * Math.PI) / 180),
    y: CY + r * Math.sin((deg * Math.PI) / 180),
  });

  const ticks: { freq: number; norm: number }[] = [];
  for (let f = Math.ceil(freqMin / 10) * 10; f <= freqMax; f += 10) {
    ticks.push({ freq: f, norm: (f - freqMin) / (freqMax - freqMin) });
  }
  const minorTicks: number[] = [];
  for (let f = freqMin + 5; f < freqMax; f += 10) {
    minorTicks.push((f - freqMin) / (freqMax - freqMin));
  }

  // Find nearest major tick to needle for amber highlight
  const normalizedNeedle = ((needleDeg % 360) + 360) % 360;
  let closestTick = ticks[0];
  let closestDist = Infinity;
  ticks.forEach((t) => {
    const tickDeg = ARC_START + t.norm * ARC_SPAN;
    const normalizedTick = ((tickDeg % 360) + 360) % 360;
    let dist = Math.abs(normalizedNeedle - normalizedTick);
    if (dist > 180) dist = 360 - dist;
    if (dist < closestDist) { closestDist = dist; closestTick = t; }
  });
  const isActiveTick = (t: typeof ticks[0]) => t.freq === closestTick.freq && closestDist < 8;

  const DIAL_FRAC = 0.65;
  const glowAlpha = signalStrength * 0.18;
  const glowPx = 16 + signalStrength * 20;

  return (
    <>
      <style>{`
        .dead-air-dial-outer {
          position: relative;
          width: min(68vmin, 520px);
          height: min(68vmin, 520px);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        @media (max-width: 959px) {
          .dead-air-dial-outer {
            width: min(88vw, 420px);
            height: min(88vw, 420px);
          }
        }
        .dial-freq-btn {
          cursor: pointer;
          outline: none;
        }
        .dial-freq-btn:focus-visible text {
          filter: drop-shadow(0 0 4px oklch(0.72 0.14 65 / 0.9)) !important;
        }
      `}</style>

      <div className="dead-air-dial-outer">
        {/* Arc SVG — fills entire outer wrapper */}
        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            zIndex: 1,
            overflow: "hidden",
          }}
          viewBox="0 0 200 200"
          aria-label="Frequency scale"
        >
          {/* Major ticks + clickable labels */}
          {ticks.map((t) => {
            const deg = ARC_START + t.norm * ARC_SPAN;
            const p1 = toXY(70, deg);
            const p2 = toXY(77, deg);
            const pl = toXY(85, deg);
            const active = isActiveTick(t);
            const hovered = hoveredFreq === t.freq;
            const is120 = t.freq === 120;

            // Visual state
            const labelColor = active
              ? "oklch(0.72 0.14 65)"
              : hovered
              ? `oklch(${is120 ? "0.78 0.16 65" : "0.68 0.12 65"})`
              : "rgba(175,165,150,0.60)";
            const labelSize = active ? 6.5 : hovered ? 6.8 : 6;
            const labelWeight = active || hovered ? "bold" : "normal";
            const labelFilter = active
              ? "drop-shadow(0 0 3px oklch(0.72 0.14 65 / 0.6))"
              : hovered
              ? `drop-shadow(0 0 ${is120 ? "5px" : "3px"} oklch(0.72 0.14 65 / ${is120 ? "0.7" : "0.5"}))`
              : undefined;

            // Touch target: invisible rect around the label (12×12 units)
            const hitPl = toXY(85, deg);

            return (
              <g
                key={t.freq}
                className="dial-freq-btn"
                role="button"
                aria-label={`Tune to ${t.freq} MHz`}
                tabIndex={started ? 0 : -1}
                onClick={() => {
                  if (!started) { onStart(); return; }
                  animateToFrequency(t.freq);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (!started) { onStart(); return; }
                    animateToFrequency(t.freq);
                  }
                }}
                onMouseEnter={() => setHoveredFreq(t.freq)}
                onMouseLeave={() => setHoveredFreq(null)}
              >
                {/* Invisible hit area — generous touch target */}
                <rect
                  x={hitPl.x - 7}
                  y={hitPl.y - 7}
                  width={14}
                  height={14}
                  fill="transparent"
                  style={{ cursor: "pointer" }}
                />

                <line
                  x1={p1.x} y1={p1.y}
                  x2={p2.x} y2={p2.y}
                  stroke={active || hovered ? "oklch(0.72 0.14 65 / 0.9)" : "rgba(220,210,195,0.50)"}
                  strokeWidth={active || hovered ? 1.2 : 0.9}
                  strokeLinecap="round"
                  style={(active || hovered) ? { filter: "drop-shadow(0 0 2px oklch(0.72 0.14 65 / 0.8))" } : undefined}
                  pointerEvents="none"
                />
                <text
                  x={pl.x} y={pl.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={labelColor}
                  fontSize={labelSize}
                  fontFamily="'Space Mono', monospace"
                  fontWeight={labelWeight}
                  style={{
                    filter: labelFilter,
                    transition: "font-size 0.15s ease, fill 0.15s ease",
                    pointerEvents: "none",
                    userSelect: "none",
                  }}
                >
                  {t.freq}
                </text>
              </g>
            );
          })}

          {/* Minor ticks — not interactive */}
          {minorTicks.map((norm, i) => {
            const deg = ARC_START + norm * ARC_SPAN;
            const p1 = toXY(72, deg);
            const p2 = toXY(77, deg);
            return (
              <line
                key={i}
                x1={p1.x} y1={p1.y}
                x2={p2.x} y2={p2.y}
                stroke="rgba(220,210,195,0.18)"
                strokeWidth="0.6"
                strokeLinecap="round"
                style={{ pointerEvents: "none" }}
              />
            );
          })}

          {/* Amber needle — tracks the physical notch */}
          {(() => {
            const p1 = toXY(67, needleDeg);
            const p2 = toXY(78, needleDeg);
            return (
              <line
                x1={p1.x} y1={p1.y}
                x2={p2.x} y2={p2.y}
                stroke={`oklch(0.72 0.14 65 / ${0.5 + signalStrength * 0.5})`}
                strokeWidth="1.2"
                strokeLinecap="round"
                style={{
                  filter: `drop-shadow(0 0 ${1.5 + signalStrength * 2.5}px oklch(0.72 0.14 65 / ${0.7 + signalStrength * 0.3}))`,
                  pointerEvents: "none",
                }}
              />
            );
          })()}
        </svg>

        {/* Ambient glow ring */}
        {started && signalStrength > 0.1 && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: `-${glowPx}px`,
              borderRadius: "50%",
              background: `radial-gradient(circle, oklch(0.72 0.14 65 / ${glowAlpha}) 0%, transparent 65%)`,
              pointerEvents: "none",
              zIndex: 0,
              transition: "all 0.5s ease",
            }}
          />
        )}

        {/* Dial image — rotates */}
        <div
          ref={dialRef}
          style={{
            position: "relative",
            zIndex: 2,
            width: `${DIAL_FRAC * 100}%`,
            height: `${DIAL_FRAC * 100}%`,
            borderRadius: "50%",
            cursor: isDraggingState ? "grabbing" : isHovered ? "grab" : isAnimating ? "default" : "pointer",
            transform: `rotate(${angle}deg)`,
            transition: isDraggingState ? "none" : "transform 0.04s linear",
            filter: isHovered
              ? `drop-shadow(0 0 ${glowPx}px oklch(0.72 0.14 65 / ${0.08 + glowAlpha})) drop-shadow(0 10px 44px oklch(0 0 0 / 72%))`
              : `drop-shadow(0 10px 44px oklch(0 0 0 / 68%))`,
            userSelect: "none",
          }}
          onMouseDown={onMouseDown}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={onTouchStart}
          onWheel={onWheel}
          role="slider"
          aria-label="Radio tuning dial"
          aria-valuemin={freqMin}
          aria-valuemax={freqMax}
          aria-valuenow={Math.round(frequency * 10) / 10}
          tabIndex={0}
        >
          <img
            src={DIAL_IMAGE_URL}
            alt="Tuning dial"
            style={{ width: "100%", height: "100%", borderRadius: "50%", display: "block" }}
            draggable={false}
          />
        </div>
      </div>
    </>
  );
}
