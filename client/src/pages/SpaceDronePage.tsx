/**
 * hella.rich — SPACE DRONE
 * The real Space Drone experience, integrated into hella.rich.
 * Adapted from the standalone drone app.
 */

import { DroneKnob } from "../components/DroneKnob";
import { DroneViz } from "../components/DroneViz";
import { FullscreenButton } from "../components/FullscreenButton";
import { PlanetRockModal } from "../components/PlanetRockModal";
import { SpaceBackground } from "../components/SpaceBackground";
import { droneEngine } from "../lib/droneEngine";
import { useCallback, useEffect, useRef, useState } from "react";

const SIGNAL_MESSAGES = [
  "SIGNAL STABLE", "LOW ORBIT DETECTED", "DEEP SPACE",
  "SYSTEMS NOMINAL", "TRANSMISSION CLEAR", "ORBIT CONFIRMED",
  "DRIFT ACTIVE", "HULL INTEGRITY NOMINAL",
];

function getTimeOfDay(): "morning" | "afternoon" | "night" {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 20) return "afternoon";
  return "night";
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function SpaceDrone() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [intensity, setIntensity] = useState(0.65);
  
  const [volume, setVolume] = useState(0.80);
  const [powerPressed, setPowerPressed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [planetRock, setPlanetRock] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [hintFading, setHintFading] = useState(false);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const sessionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPlayingRef = useRef(false);
  isPlayingRef.current = isPlaying;
  const [signalMsg, setSignalMsg] = useState<string | null>(null);
  const signalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cursorVisible, setCursorVisible] = useState(true);
  const cursorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [timeOfDay] = useState(getTimeOfDay);
  const isLoadingRef = useRef(false);
  isLoadingRef.current = isLoading;

  useEffect(() => {
    droneEngine.updateParams({ intensity, volume });
  }, [intensity, volume]);

  const handlePower = useCallback(async () => {
    if (isLoadingRef.current) return;
    setHintFading(true);
    hintTimerRef.current = setTimeout(() => setShowHint(false), 700);
    setIsLoading(true);
    try {
      const playing = droneEngine.getIsPlaying();
      if (playing) {
        await droneEngine.stop();
        setIsPlaying(false);
      } else {
        await droneEngine.start();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error("Audio engine error:", err);
      setIsPlaying(droneEngine.getIsPlaying());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        if (!isLoadingRef.current) handlePower();
      }
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [handlePower]);

  useEffect(() => {
    document.title = isPlaying ? "SPACE DRONE · ◉" : "SPACE DRONE";
    return () => { document.title = "hella.rich"; };
  }, [isPlaying]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const handleBackgroundDblClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".drone-panel")) return;
    toggleFullscreen();
  }, [toggleFullscreen]);

  useEffect(() => {
    return () => { if (hintTimerRef.current) clearTimeout(hintTimerRef.current); };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      sessionIntervalRef.current = setInterval(() => setSessionSeconds(s => s + 1), 1000);
    } else {
      if (sessionIntervalRef.current) { clearInterval(sessionIntervalRef.current); sessionIntervalRef.current = null; }
    }
    return () => { if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current); };
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;
    const scheduleNext = () => {
      const delay = (30 + Math.random() * 30) * 60 * 1000;
      signalTimerRef.current = setTimeout(() => {
        const msg = SIGNAL_MESSAGES[Math.floor(Math.random() * SIGNAL_MESSAGES.length)];
        setSignalMsg(msg);
        setTimeout(() => setSignalMsg(null), 3500);
        scheduleNext();
      }, delay);
    };
    scheduleNext();
    return () => { if (signalTimerRef.current) clearTimeout(signalTimerRef.current); };
  }, [isPlaying]);

  useEffect(() => {
    if (!isFullscreen) { setCursorVisible(true); return; }
    const showCursor = () => {
      setCursorVisible(true);
      if (cursorTimerRef.current) clearTimeout(cursorTimerRef.current);
      cursorTimerRef.current = setTimeout(() => setCursorVisible(false), 3000);
    };
    showCursor();
    window.addEventListener("mousemove", showCursor, { passive: true });
    return () => { window.removeEventListener("mousemove", showCursor); if (cursorTimerRef.current) clearTimeout(cursorTimerRef.current); setCursorVisible(true); };
  }, [isFullscreen]);

  useEffect(() => {
    return () => { droneEngine.stop(); document.title = "hella.rich"; };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        padding: "clamp(20px, 5vw, 60px)",
        position: "relative",
        cursor: isFullscreen && !cursorVisible ? "none" : "default",
        overflow: "hidden",
      }}
      onDoubleClick={handleBackgroundDblClick}
    >
      <SpaceBackground isPlaying={isPlaying} timeOfDay={timeOfDay} />
      <FullscreenButton isFullscreen={isFullscreen} onToggle={toggleFullscreen} />
      {planetRock && <PlanetRockModal onClose={() => setPlanetRock(false)} />}

      {showHint && (
        <button
          onClick={handlePower}
          style={{
            position: "fixed", bottom: "clamp(28px, 5vh, 52px)", left: "50%", transform: "translateX(-50%)",
            zIndex: 10, fontFamily: "'Space Mono', monospace", fontSize: "clamp(10px, 1.1vw, 13px)",
            letterSpacing: "0.16em", textTransform: "uppercase", color: "#F0EDE8",
            background: "oklch(0.18 0.008 65 / 0.88)", border: "1.5px solid oklch(0.62 0.18 42 / 0.75)",
            borderRadius: 100, padding: "12px 28px", cursor: "pointer", backdropFilter: "blur(12px)",
            boxShadow: "0 0 24px oklch(0.62 0.18 42 / 0.25), 0 4px 16px oklch(0 0 0 / 0.5)",
            opacity: hintFading ? 0 : 1, transition: "opacity 0.65s ease", lineHeight: 1, whiteSpace: "nowrap",
          }}
        >
          PRESS SPACE OR TAP PLAY
          <div style={{ fontSize: "clamp(8px, 0.85vw, 10px)", letterSpacing: "0.14em", color: "oklch(0.72 0.18 42)", opacity: 0.9, marginTop: 6 }}>
            BEGIN TRANSMISSION
          </div>
        </button>
      )}

      {signalMsg && (
        <div style={{
          position: "fixed", top: "22%", left: "50%", transform: "translateX(-50%)",
          zIndex: 10, fontFamily: "'Space Mono', monospace", fontSize: "clamp(8px, 0.9vw, 10px)",
          letterSpacing: "0.22em", textTransform: "uppercase", color: "oklch(0.62 0.18 42)",
          opacity: 0.55, pointerEvents: "none", animation: "drone-signal-fade 3.5s ease forwards",
        }}>
          {signalMsg}
        </div>
      )}

      <div style={{
        position: "relative", zIndex: 1, width: "100%",
        display: "flex", flexDirection: "column", alignItems: "center",
        transition: "filter 0.3s ease, opacity 0.3s ease",
        filter: planetRock ? "blur(6px)" : "none",
        opacity: planetRock ? 0.92 : 1,
      }}>
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          width: "clamp(400px, 100vw, 900px)", height: "clamp(300px, 70vh, 700px)",
          background: "radial-gradient(ellipse at center, oklch(0.85 0.006 75 / 0.06) 0%, transparent 70%)",
          pointerEvents: "none", zIndex: 0,
        }} />

        <div className="drone-panel drone-device-enter" style={{ position: "relative", zIndex: 1, width: "clamp(300px, 80vw, 580px)", padding: "clamp(28px, 4.5vw, 52px) clamp(28px, 4vw, 48px)" }}>
          <div className="drone-scanlines" style={{ position: "absolute", inset: 0, borderRadius: "inherit", pointerEvents: "none", zIndex: 1 }} />
          <div style={{ position: "relative", zIndex: 3 }}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "clamp(20px, 3.5vw, 36px)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className={`drone-led ${isPlaying ? "active" : ""}`} style={{ width: 8, height: 8, flexShrink: 0 }} />
                <span style={{ fontFamily: "'Space Grotesk', 'Space Mono', sans-serif", fontWeight: 700, fontSize: "clamp(20px, 3.5vw, 30px)", letterSpacing: "0.28em", textTransform: "uppercase", color: "var(--drone-text)", lineHeight: 1 }}>
                  SPACE DRONE
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "clamp(7px, 0.85vw, 9px)", letterSpacing: "0.14em", textTransform: "uppercase", color: "#C8C5C0", opacity: 0.65 }}>
                  {isLoading ? "INIT" : isPlaying ? "ENGAGED" : "STANDBY"}
                </span>
                {sessionSeconds > 0 && (
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "clamp(6px, 0.7vw, 8px)", letterSpacing: "0.10em", textTransform: "uppercase", color: "oklch(0.62 0.18 42)", opacity: isPlaying ? 0.65 : 0.35, transition: "opacity 0.5s ease" }}>
                    IN DRIFT: {formatDuration(sessionSeconds)}
                  </span>
                )}
              </div>
            </div>

            <div style={{ background: "oklch(0.74 0.006 75)", borderRadius: 6, padding: "2px 8px", marginBottom: "clamp(24px, 4vw, 40px)", boxShadow: "inset 0 2px 5px oklch(0 0 0 / 0.22), inset 0 1px 0 oklch(0 0 0 / 0.1)", overflow: "hidden" }}>
              <DroneViz isPlaying={isPlaying} intensity={intensity} />
            </div>

            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "clamp(12px, 3vw, 28px)" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <button
                  className={`drone-power-btn ${isPlaying ? "playing" : ""}`}
                  onClick={handlePower}
                  onPointerDown={() => setPowerPressed(true)}
                  onPointerUp={() => setPowerPressed(false)}
                  onPointerLeave={() => setPowerPressed(false)}
                  disabled={isLoading}
                  aria-label={isPlaying ? "Stop drone" : "Start drone"}
                  style={{
                    width: "clamp(52px, 9vw, 72px)", height: "clamp(52px, 9vw, 72px)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transform: powerPressed ? "scale(0.92)" : "scale(1)",
                    transition: "transform 0.1s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.35s ease",
                  }}
                >
                  <div className={`drone-power-ring ${isPlaying ? "active" : ""}`} />
                  {isLoading ? (
                    <div style={{ width: 22, height: 22, border: "2px solid oklch(0.38 0.008 65)", borderTopColor: "oklch(0.72 0.18 42)", borderRadius: "50%", animation: "drone-spin 0.75s linear infinite" }} />
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                      stroke={isPlaying ? "oklch(0.72 0.18 42)" : "oklch(0.50 0.008 65)"}
                      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transition: "stroke 0.4s ease" }}>
                      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                      <line x1="12" y1="2" x2="12" y2="12" />
                    </svg>
                  )}
                </button>
                <span className="drone-label">PLAY</span>
              </div>

              <div style={{ width: 1, height: 88, background: "var(--drone-groove)", opacity: 0.4, flexShrink: 0, alignSelf: "center", marginBottom: 22 }} />

              <DroneKnob value={intensity} onChange={setIntensity} label="INTENSITY" />
              
              <DroneKnob value={volume}    onChange={setVolume}    label="VOL" />
            </div>

            <div style={{ display: "flex", justifyContent: "center", marginTop: "clamp(14px, 2.5vw, 22px)" }}>
              <button
                onClick={() => setPlanetRock(true)}
                style={{ fontFamily: "'Space Mono', monospace", fontSize: "clamp(7px, 0.8vw, 9px)", letterSpacing: "0.14em", textTransform: "uppercase", background: "transparent", border: "1px solid oklch(0.52 0.008 65)", color: "oklch(0.52 0.008 65)", padding: "5px 14px", borderRadius: 3, cursor: "pointer", transition: "all 0.2s ease", opacity: 0.5 }}
                onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.borderColor = "oklch(0.62 0.18 42)"; e.currentTarget.style.color = "oklch(0.72 0.18 42)"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "0.5"; e.currentTarget.style.borderColor = "oklch(0.52 0.008 65)"; e.currentTarget.style.color = "oklch(0.52 0.008 65)"; }}
              >
                PLANET SIGNAL
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "clamp(20px, 3.5vw, 36px)", paddingTop: "clamp(10px, 1.5vw, 14px)", borderTop: "1px solid var(--drone-groove)", opacity: 0.3 }}>
              <span className="drone-value" style={{ fontSize: "clamp(7px, 0.75vw, 9px)" }}>AMBIENT MACHINE</span>
              <span className="drone-value" style={{ fontSize: "clamp(7px, 0.75vw, 9px)" }}>SPACE · PRESS SPACE</span>
              <span className="drone-value" style={{ fontSize: "clamp(7px, 0.75vw, 9px)" }}>V7.0</span>
            </div>

          </div>
        </div>

        <p className="drone-label" style={{ marginTop: "clamp(14px, 2vw, 20px)", opacity: 0.28, textAlign: "center", fontSize: "clamp(7px, 0.85vw, 9px)", color: "#E2E0DC", fontWeight: 400, letterSpacing: "0.10em" }}>
          Spacebar or click PLAY · Drag knobs vertically · Double-click to reset
        </p>
      </div>

      <style>{`
        @keyframes drone-spin { to { transform: rotate(360deg); } }
        @keyframes drone-signal-fade {
          0% { opacity: 0; } 15% { opacity: 0.55; } 75% { opacity: 0.55; } 100% { opacity: 0; }
        }
            `}</style>
    </div>
  );
}
