/**
 * PlanetSignalModal — Randomized curated retro electro transmission system
 *
 * Behavior:
 * - Always starts with Planet Rock (track 0)
 * - After that: random selection from verified pool, no repeat of last 3
 * - NEXT: random next (no recent repeats)
 * - PREV: returns to history stack
 * - Auto-advances on video end
 * - All 20 videos verified embeddable via YouTube oEmbed API
 */

import { useEffect, useRef, useState } from "react";

// ─── Verified pool — all checked via YouTube oEmbed API ──────────────────────
const POOL = [
  // Anchor — always first
  { id: "9J3lwZjHenA", title: "PLANET ROCK",                  artist: "AFRIKA BAMBAATAA" },
  // Verified embeddable
  { id: "zOfh7YdugzQ", title: "TRANS-EUROPA EXPRESS",         artist: "KRAFTWERK" },
  { id: "QVKs1gIIjyk", title: "COMPUTER LOVE",                artist: "KRAFTWERK" },
  { id: "9Sbvylpwah8", title: "NUMBERS",                      artist: "KRAFTWERK" },
  { id: "rTe7U92ecX8", title: "TOUR DE FRANCE",               artist: "KRAFTWERK" },
  { id: "gowc32WbIio", title: "BEAT BOP",                     artist: "RAMMELLZEE VS K-ROB" },
  { id: "rHQ11l4uiM4", title: "LOOKING FOR THE PERFECT BEAT", artist: "AFRIKA BAMBAATAA" },
  { id: "YT4qqZHN8no", title: "CLEAR",                        artist: "CYBOTRON" },
  { id: "Bh9I5k8NeeE", title: "CLEAR (OFFICIAL AUDIO)",       artist: "CYBOTRON" },
  { id: "GHhD4PD75zY", title: "ROCKIT",                       artist: "HERBIE HANCOCK" },
  { id: "i8EjK2TrM9c", title: "COMPUTER GAME",                artist: "YELLOW MAGIC ORCHESTRA" },
  { id: "-sFK0-lcjGU", title: "CLOSE (TO THE EDIT)",          artist: "ART OF NOISE" },
  { id: "PfAu8vqAHxc", title: "FROM HERE TO ETERNITY",        artist: "GIORGIO MORODER" },
  { id: "M-0Z_2j1a1U", title: "JAM ON IT",                    artist: "NEWCLEUS" },
  { id: "bDVuQyzDECs", title: "WHIP IT",                      artist: "DEVO" },
  { id: "Cb2LB1g15ro", title: "LOOKING FOR THE PERFECT BEAT (12\")", artist: "AFRIKA BAMBAATAA" },
  { id: "7BgDTKtB7Cw", title: "BEAT BOP (OFFICIAL)",          artist: "RAMMELLZEE & K-ROB" },
  { id: "Yt3p-F2x7rY", title: "TOUR DE FRANCE (ORIGINAL)",    artist: "KRAFTWERK" },
  { id: "WnungT4zGOM", title: "CLOSE (TO THE EDIT) (ALT)",    artist: "ART OF NOISE" },
  { id: "qTFEyFEu1Fk", title: "FROM HERE TO ETERNITY (HD)",   artist: "GIORGIO MORODER" },
];

const NO_REPEAT_COUNT = 3; // avoid repeating last N tracks

function pickRandom(recentIds: string[]): number {
  const available = POOL.slice(1) // never random-pick index 0 (Planet Rock is always first)
    .map((t, i) => ({ ...t, idx: i + 1 }))
    .filter(t => !recentIds.includes(t.id));
  if (available.length === 0) return 1 + Math.floor(Math.random() * (POOL.length - 1));
  const pick = available[Math.floor(Math.random() * available.length)];
  return pick.idx;
}

declare global {
  interface Window {
    YT: {
      Player: new (
        el: HTMLElement | string,
        opts: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (e: { target: YTPlayer }) => void;
            onStateChange?: (e: { data: number }) => void;
          };
        }
      ) => YTPlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayer {
  playVideo(): void;
  loadVideoById(videoId: string): void;
  destroy(): void;
}

function loadYTScript(): Promise<void> {
  return new Promise((resolve) => {
    if (window.YT?.Player) { resolve(); return; }
    if (!document.getElementById("yt-iframe-api")) {
      const s = document.createElement("script");
      s.id = "yt-iframe-api";
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { if (prev) prev(); resolve(); };
    if (window.YT?.Player) resolve();
  });
}

interface PlanetRockModalProps {
  onClose: () => void;
}

export function PlanetRockModal({ onClose }: PlanetRockModalProps) {
  const [visible, setVisible] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0); // always starts at 0 (Planet Rock)
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const playerReadyRef = useRef(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  // History stack for PREV navigation
  const historyRef = useRef<number[]>([0]); // starts with Planet Rock
  const historyPosRef = useRef(0); // current position in history

  // Current index ref for callbacks
  const currentIdxRef = useRef(0);
  useEffect(() => { currentIdxRef.current = currentIdx; }, [currentIdx]);

  // Fade in
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // Init YouTube IFrame API
  useEffect(() => {
    let destroyed = false;

    loadYTScript().then(() => {
      if (destroyed || !playerContainerRef.current) return;
      try {
        playerRef.current = new window.YT.Player(playerContainerRef.current, {
          videoId: POOL[0].id,
          playerVars: { autoplay: 1, rel: 0, modestbranding: 1, playsinline: 1 },
          events: {
            onReady: (e) => {
              if (!destroyed) { playerReadyRef.current = true; e.target.playVideo(); }
            },
            onStateChange: (e) => {
              if (e.data === 0 && !destroyed) goNext(); // auto-advance on end
            },
          },
        });
      } catch (err) {
        console.warn("YT init error:", err);
      }
    });

    return () => {
      destroyed = true;
      playerReadyRef.current = false;
      try { playerRef.current?.destroy(); } catch {}
      playerRef.current = null;
    };
  }, []);

  const loadTrack = (idx: number) => {
    currentIdxRef.current = idx;
    setCurrentIdx(idx);
    if (playerRef.current && playerReadyRef.current) {
      playerRef.current.loadVideoById(POOL[idx].id);
    }
  };

  const goNext = () => {
    // Get recent IDs to avoid repeating
    const history = historyRef.current;
    const pos = historyPosRef.current;
    const recent = history.slice(Math.max(0, pos - NO_REPEAT_COUNT + 1), pos + 1)
      .map(i => POOL[i].id);
    const nextIdx = pickRandom(recent);

    // If we're not at the end of history, truncate forward history
    historyRef.current = history.slice(0, pos + 1);
    historyRef.current.push(nextIdx);
    historyPosRef.current = historyRef.current.length - 1;

    loadTrack(nextIdx);
  };

  const goPrev = () => {
    const pos = historyPosRef.current;
    if (pos > 0) {
      historyPosRef.current = pos - 1;
      loadTrack(historyRef.current[historyPosRef.current]);
    }
  };

  // Keyboard: ESC, ←, →
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); onClose(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); goNext(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [onClose]);

  const current = POOL[currentIdx];
  const historyPos = historyPosRef.current;
  const canGoPrev = historyPos > 0;

  return (
    <div
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0, 0, 0, 0.08)",
        opacity: visible ? 1 : 0, transition: "opacity 0.25s ease",
        padding: "clamp(16px, 4vw, 48px)",
      }}
    >
      <div
        className="drone-panel"
        style={{
          width: "min(860px, 100%)", padding: 0, overflow: "hidden",
          transform: visible ? "scale(1) translateY(0)" : "scale(0.97) translateY(8px)",
          transition: "transform 0.22s cubic-bezier(0.23, 1, 0.32, 1)",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drone-scanlines" style={{ position: "absolute", inset: 0, borderRadius: "inherit", pointerEvents: "none", zIndex: 10 }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 22px 8px", borderBottom: "1px solid var(--drone-groove)", position: "relative", zIndex: 5 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="drone-led active" style={{ width: 7, height: 7, flexShrink: 0 }} />
            <span style={{ fontFamily: "'Space Grotesk', 'Space Mono', sans-serif", fontWeight: 700, fontSize: "clamp(11px, 1.4vw, 14px)", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--drone-text)" }}>
              PLANET SIGNAL
            </span>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "clamp(7px, 0.75vw, 9px)", letterSpacing: "0.14em", textTransform: "uppercase", color: "oklch(0.62 0.18 42)", opacity: 0.7, marginLeft: 2 }}>
              · TRANSMISSION
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "clamp(7px, 0.75vw, 9px)", letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--drone-text)", opacity: 0.85 }}>
                {current.title}
              </div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "clamp(6px, 0.65vw, 8px)", letterSpacing: "0.10em", textTransform: "uppercase", color: "oklch(0.62 0.18 42)", opacity: 0.6 }}>
                {current.artist}
              </div>
            </div>
            <button onClick={onClose} aria-label="Close"
              style={{ background: "none", border: "1px solid oklch(0.52 0.008 65 / 0.4)", borderRadius: 3, color: "var(--drone-text-dim)", cursor: "pointer", fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: "0.1em", padding: "3px 8px", opacity: 0.5, transition: "opacity 0.15s ease" }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "1"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "0.5"; }}
            >
              CLOSE
            </button>
          </div>
        </div>


        {/* Player */}
        <div style={{ margin: "8px 14px 12px", borderRadius: 5, overflow: "hidden", background: "#000", boxShadow: "inset 0 2px 5px oklch(0 0 0 / 0.4)", position: "relative", zIndex: 5 }}>
          <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
            <div ref={playerContainerRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} />
          </div>
        </div>

        {/* Navigation footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 22px 14px", position: "relative", zIndex: 5 }}>
          <button
            onClick={goPrev}
            disabled={!canGoPrev}
            aria-label="Previous signal"
            style={{
              background: "none", border: "1px solid oklch(0.52 0.008 65 / 0.35)", borderRadius: 3,
              color: "var(--drone-text-dim)", cursor: canGoPrev ? "pointer" : "default",
              fontFamily: "'Space Mono', monospace", fontSize: "clamp(7px, 0.8vw, 9px)",
              letterSpacing: "0.14em", textTransform: "uppercase", padding: "5px 14px",
              opacity: canGoPrev ? 0.45 : 0.2, transition: "opacity 0.15s ease, border-color 0.15s ease, color 0.15s ease",
            }}
            onMouseEnter={e => { if (canGoPrev) { e.currentTarget.style.opacity = "1"; e.currentTarget.style.borderColor = "oklch(0.62 0.18 42 / 0.6)"; e.currentTarget.style.color = "oklch(0.72 0.18 42)"; } }}
            onMouseLeave={e => { e.currentTarget.style.opacity = canGoPrev ? "0.45" : "0.2"; e.currentTarget.style.borderColor = "oklch(0.52 0.008 65 / 0.35)"; e.currentTarget.style.color = "var(--drone-text-dim)"; }}
          >
            ◀ PREVIOUS SIGNAL
          </button>

          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "clamp(6px, 0.65vw, 8px)", letterSpacing: "0.12em", textTransform: "uppercase", color: "oklch(0.62 0.18 42)", opacity: 0.35 }}>
            ESC TO CLOSE
          </span>

          <button
            onClick={goNext}
            aria-label="Next signal"
            style={{
              background: "none", border: "1px solid oklch(0.52 0.008 65 / 0.35)", borderRadius: 3,
              color: "var(--drone-text-dim)", cursor: "pointer",
              fontFamily: "'Space Mono', monospace", fontSize: "clamp(7px, 0.8vw, 9px)",
              letterSpacing: "0.14em", textTransform: "uppercase", padding: "5px 14px",
              opacity: 0.45, transition: "opacity 0.15s ease, border-color 0.15s ease, color 0.15s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.borderColor = "oklch(0.62 0.18 42 / 0.6)"; e.currentTarget.style.color = "oklch(0.72 0.18 42)"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "0.45"; e.currentTarget.style.borderColor = "oklch(0.52 0.008 65 / 0.35)"; e.currentTarget.style.color = "var(--drone-text-dim)"; }}
          >
            NEXT SIGNAL ▶
          </button>
        </div>
      </div>
    </div>
  );
}
