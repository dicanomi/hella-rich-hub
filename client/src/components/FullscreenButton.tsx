/**
 * FullscreenButton — Minimal corner fullscreen toggle
 *
 * Design: Teenage Engineering inspired — simple outline icon, minimal weight.
 * Hover: slight opacity increase.
 * Position: top-right corner of the viewport, fixed.
 */

interface FullscreenButtonProps {
  isFullscreen: boolean;
  onToggle: () => void;
}

export function FullscreenButton({ isFullscreen, onToggle }: FullscreenButtonProps) {
  return (
    <button
      onClick={onToggle}
      aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      title={isFullscreen ? "Exit fullscreen (ESC)" : "Enter fullscreen"}
      style={{
        position: "fixed",
        top: 16,
        right: 18,
        zIndex: 10,
        background: "none",
        border: "none",
        padding: 6,
        cursor: "pointer",
        opacity: 0.28,
        transition: "opacity 0.2s ease",
        lineHeight: 0,
      }}
      onMouseEnter={e => (e.currentTarget.style.opacity = "0.65")}
      onMouseLeave={e => (e.currentTarget.style.opacity = "0.28")}
    >
      {isFullscreen ? (
        // Exit fullscreen icon — inward arrows
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
          stroke="#E2E0DC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2v4H2M10 2v4h4M6 14v-4H2M10 14v-4h4" />
        </svg>
      ) : (
        // Enter fullscreen icon — outward arrows
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
          stroke="#E2E0DC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" />
        </svg>
      )}
    </button>
  );
}
