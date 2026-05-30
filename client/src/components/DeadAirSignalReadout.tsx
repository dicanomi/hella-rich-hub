/*
 * SignalReadout — Station label that fades in when locked on a station
 * Design: Braun Noir — subtle amber text, appears/disappears with signal
 */

interface SignalReadoutProps {
  activeStation: { label: string; category: string } | null;
  signalStrength: number;
  started: boolean;
}

export default function SignalReadout({
  activeStation,
  signalStrength,
  started,
}: SignalReadoutProps) {
  const isLocked = started && signalStrength > 0.6 && activeStation !== null;

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none"
      style={{
        bottom: "clamp(3.5rem, 8vmin, 5rem)",
        opacity: isLocked ? 1 : 0,
        transition: "opacity 0.8s ease",
      }}
      aria-live="polite"
      aria-atomic="true"
    >
      {activeStation && (
        <>
          <div
            className="font-mono tracking-[0.3em] uppercase"
            style={{
              fontSize: "clamp(0.55rem, 1.2vw, 0.7rem)",
              color: "oklch(0.72 0.14 65 / 80%)",
              textShadow: "0 0 12px oklch(0.72 0.14 65 / 40%)",
            }}
          >
            {activeStation.label}
          </div>
          <div
            className="font-mono tracking-[0.2em] uppercase"
            style={{
              fontSize: "clamp(0.45rem, 1vw, 0.6rem)",
              color: "oklch(0.55 0.01 75 / 60%)",
            }}
          >
            {activeStation.category}
          </div>
        </>
      )}
    </div>
  );
}
