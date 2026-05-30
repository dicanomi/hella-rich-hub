/**
 * MoodToggle — 3-position physical toggle switch
 *
 * Design: Teenage Engineering OP-1 style hardware toggle
 * - Three discrete positions: Deep Space / Orbit / Derelict
 * - Physical toggle aesthetic with a sliding rubber thumb
 * - Click labels or track to change position
 * - Smooth transition between positions
 */

// MoodToggle is no longer used in v3 — kept for reference only
type MoodType = "deep-space" | "orbit" | "derelict";

interface MoodToggleProps {
  value: MoodType;
  onChange: (value: MoodType) => void;
  disabled?: boolean;
}

const MOODS: { value: MoodType; label: string }[] = [
  { value: "deep-space", label: "DEEP" },
  { value: "orbit",      label: "ORBIT" },
  { value: "derelict",   label: "DRLCT" },
];

const TRACK_H = 76;
const THUMB_H = 22;
const THUMB_PADDING = 3;

const thumbPositions = [
  THUMB_PADDING,
  (TRACK_H - THUMB_H) / 2,
  TRACK_H - THUMB_H - THUMB_PADDING,
];

export function MoodToggle({ value, onChange, disabled = false }: MoodToggleProps) {
  const currentIndex = MOODS.findIndex((m) => m.value === value);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        opacity: disabled ? 0.4 : 1,
        userSelect: "none",
      }}
    >
      {/* Toggle assembly */}
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}>
        {/* Track */}
        <div
          className="drone-toggle-track"
          style={{
            width: 22,
            height: TRACK_H,
            cursor: disabled ? "default" : "pointer",
            flexShrink: 0,
          }}
        >
          {/* Thumb */}
          <div
            className="drone-toggle-thumb"
            style={{
              position: "absolute",
              left: 3,
              right: 3,
              height: THUMB_H,
              top: thumbPositions[currentIndex],
              transition: "top 0.14s cubic-bezier(0.23, 1, 0.32, 1)",
            }}
          />

          {/* Click zones */}
          {MOODS.map((_, i) => (
            <div
              key={i}
              onClick={() => !disabled && onChange(MOODS[i].value)}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                height: `${100 / 3}%`,
                top: `${(i * 100) / 3}%`,
              }}
            />
          ))}
        </div>

        {/* Position labels */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: TRACK_H,
          }}
        >
          {MOODS.map((mood, i) => (
            <button
              key={mood.value}
              onClick={() => !disabled && onChange(mood.value)}
              disabled={disabled}
              style={{
                fontFamily: "'Space Mono', 'Courier New', monospace",
                fontSize: "clamp(7px, 0.85vw, 9px)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: currentIndex === i ? "oklch(0.62 0.18 42)" : "var(--drone-label)",
                opacity: currentIndex === i ? 1 : 0.38,
                background: "none",
                border: "none",
                padding: 0,
                cursor: disabled ? "default" : "pointer",
                transition: "color 0.2s ease, opacity 0.2s ease",
                textAlign: "left",
                lineHeight: 1,
              }}
            >
              {mood.label}
            </button>
          ))}
        </div>
      </div>

      {/* Label */}
      <span className="drone-label">MOOD</span>
    </div>
  );
}
