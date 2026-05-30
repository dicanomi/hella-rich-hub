/*
 * IntroOverlay — Initial glass pill overlay
 * Design: Braun Noir — dark glass pill, white headline, amber subtext
 * Dismisses on: click, spacebar (handled in parent), dial interaction
 */

interface IntroOverlayProps {
  onStart: () => void;
}

export default function IntroOverlay({ onStart }: IntroOverlayProps) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "oklch(0.085 0.005 60 / 55%)",
        backdropFilter: "blur(3px)",
        cursor: "pointer",
      }}
      onClick={onStart}
      role="button"
      aria-label="Begin scanning"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.code === "Space" || e.code === "Enter") {
          e.preventDefault();
          onStart();
        }
      }}
    >
      <div
        style={{
          background: "oklch(0.12 0.006 60 / 88%)",
          backdropFilter: "blur(20px) saturate(1.3)",
          border: "1px solid oklch(1 0 0 / 10%)",
          boxShadow: "0 0 0 1px oklch(0 0 0 / 25%), 0 12px 40px oklch(0 0 0 / 50%), inset 0 1px 0 oklch(1 0 0 / 8%)",
          borderRadius: "100px",
          padding: "clamp(16px, 2.5vmin, 24px) clamp(32px, 5vmin, 56px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          animation: "overlayIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes overlayIn {
            from { opacity: 0; transform: scale(0.95) translateY(4px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>
        <div
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "clamp(0.7rem, 1.8vw, 0.95rem)",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "oklch(0.88 0.012 75)",
            whiteSpace: "nowrap",
          }}
        >
          Press Space or Tap Dial
        </div>
        <div
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "clamp(0.5rem, 1.1vw, 0.62rem)",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "oklch(0.72 0.14 65)",
          }}
        >
          Begin Scanning
        </div>
      </div>
    </div>
  );
}
