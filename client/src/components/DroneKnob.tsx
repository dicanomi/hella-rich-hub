/**
 * DroneKnob — Rotary knob control v3
 *
 * Design: Teenage Engineering OP-1 style, calmer and cleaner
 * - Drag vertically (up = more, down = less)
 * - SVG arc track + indicator line
 * - Touch-friendly with pointer capture
 * - Double-click to reset to 0.5
 * - Keyboard accessible
 */

import { useCallback, useRef, useState } from "react";

interface DroneKnobProps {
  value: number;      // 0–1
  onChange: (value: number) => void;
  label: string;
  disabled?: boolean;
}

const valueToAngle = (v: number) => -135 + v * 270;
const SIZE = 58;

export function DroneKnob({ value, onChange, label, disabled = false }: DroneKnobProps) {
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startValue = useRef(0);
  const [isActive, setIsActive] = useState(false);

  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const trackR = SIZE / 2 - 4;
  const indicatorOuter = SIZE / 2 - 9;
  const indicatorInner = SIZE / 2 - 16;

  const angle = valueToAngle(value);
  const rad = (angle - 90) * (Math.PI / 180);
  const x1 = cx + Math.cos(rad) * indicatorInner;
  const y1 = cy + Math.sin(rad) * indicatorInner;
  const x2 = cx + Math.cos(rad) * indicatorOuter;
  const y2 = cy + Math.sin(rad) * indicatorOuter;

  const describeArc = (startDeg: number, endDeg: number, r: number) => {
    const s = (startDeg - 90) * (Math.PI / 180);
    const e = (endDeg - 90) * (Math.PI / 180);
    const sx = cx + Math.cos(s) * r;
    const sy = cy + Math.sin(s) * r;
    const ex = cx + Math.cos(e) * r;
    const ey = cy + Math.sin(e) * r;
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`;
  };

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (disabled) return;
    e.preventDefault();
    isDragging.current = true;
    startY.current = e.clientY;
    startValue.current = value;
    setIsActive(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [value, disabled]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const dy = startY.current - e.clientY;
    const newVal = Math.max(0, Math.min(1, startValue.current + dy * 0.0035));
    onChange(newVal);
  }, [onChange]);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
    setIsActive(false);
  }, []);

  const handleDoubleClick = useCallback(() => {
    if (!disabled) onChange(0.5);
  }, [onChange, disabled]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        opacity: disabled ? 0.4 : 1,
        userSelect: "none",
      }}
    >
      <div
        className="drone-knob"
        style={{
          width: SIZE,
          height: SIZE,
          transform: isActive ? "scale(1.05)" : "scale(1)",
          transition: "transform 0.1s cubic-bezier(0.23, 1, 0.32, 1)",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
        aria-label={label}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (disabled) return;
          const step = e.shiftKey ? 0.01 : 0.05;
          if (e.key === "ArrowUp" || e.key === "ArrowRight") {
            e.preventDefault();
            onChange(Math.min(1, value + step));
          } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
            e.preventDefault();
            onChange(Math.max(0, value - step));
          }
        }}
      >
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
        >
          {/* Background arc */}
          <path
            d={describeArc(-135, 135, trackR)}
            fill="none"
            stroke="oklch(0.30 0.008 65 / 0.55)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Value arc */}
          {value > 0.005 && (
            <path
              d={describeArc(-135, valueToAngle(value), trackR)}
              fill="none"
              stroke="oklch(0.68 0.18 42)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}
          {/* Indicator line */}
          <line
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="oklch(0.75 0.18 42)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Center dot */}
          <circle cx={cx} cy={cy} r={2.5} fill="oklch(0.35 0.008 65)" />
        </svg>
      </div>
      <span className="drone-label">{label}</span>
    </div>
  );
}
