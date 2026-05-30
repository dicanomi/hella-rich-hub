/**
 * MacroSlider — Premium hardware-style slider
 * Design: Scandinavian Instrument Minimalism
 * Feels like a physical fader on a Braun audio console
 */

import { useCallback, useEffect, useRef, useState } from "react";

interface MacroSliderProps {
  label: string;
  value: number; // 0–1
  onChange: (value: number) => void;
  color?: string;
  description?: string;
}

export function MacroSlider({ label, value, onChange, color = "#1C1C1A", description }: MacroSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const getValueFromEvent = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return value;
    const rect = track.getBoundingClientRect();
    const raw = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(1, raw));
  }, [value]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    setIsDragging(true);
    onChange(getValueFromEvent(e.clientX));
  }, [getValueFromEvent, onChange]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    setIsDragging(true);
    onChange(getValueFromEvent(e.touches[0].clientX));
  }, [getValueFromEvent, onChange]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      onChange(getValueFromEvent(e.clientX));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      onChange(getValueFromEvent(e.touches[0].clientX));
    };

    const handleUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [getValueFromEvent, onChange]);

  const displayPercent = Math.round(value * 100);

  return (
    <div
      className="macro-slider"
      onMouseEnter={() => { setIsHovered(true); setShowTooltip(true); }}
      onMouseLeave={() => { setIsHovered(false); setShowTooltip(false); }}
    >
      {/* Label row */}
      <div className="macro-label-row">
        <span className="macro-label">{label}</span>
        <span className={`macro-value ${isDragging || isHovered ? "macro-value--visible" : ""}`}>
          {displayPercent}
        </span>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        className={`macro-track ${isDragging ? "macro-track--active" : ""}`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={displayPercent}
        aria-label={label}
        tabIndex={0}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 0.1 : 0.02;
          if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            e.preventDefault();
            onChange(Math.min(1, value + step));
          } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            e.preventDefault();
            onChange(Math.max(0, value - step));
          }
        }}
      >
        {/* Fill */}
        <div
          className="macro-fill"
          style={{ width: `${value * 100}%` }}
        />

        {/* Thumb */}
        <div
          className={`macro-thumb ${isDragging ? "macro-thumb--active" : ""}`}
          style={{ left: `${value * 100}%` }}
        />

        {/* Tick marks */}
        <div className="macro-ticks">
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
            <div
              key={tick}
              className="macro-tick"
              style={{ left: `${tick * 100}%` }}
            />
          ))}
        </div>
      </div>

      {/* Description tooltip */}
      {description && showTooltip && (
        <div className="macro-description">{description}</div>
      )}
    </div>
  );
}
