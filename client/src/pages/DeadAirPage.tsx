/*
 * DEAD AIR — Main Experience Page
 * Design: Braun Noir — no header, dial is absolute hero, generous negative space
 *
 * Responsive layout:
 * Desktop (≥960px): 3-column grid — [freq panel] [dial] [waveform panel]
 * Mobile (<960px):  1-column stack — dial → freq panel → waveform panel
 *
 * The layout uses a CSS class injected via <style> to keep media queries clean.
 * On desktop, panels are at the edges with guaranteed clearance from the arc.
 * On mobile, panels sit below the dial with generous vertical spacing.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { HellaRichSEO } from "../components/HellaRichSEO";
import { useAudioEngine } from "../hooks/useDeadAirAudio";
import { STATIONS } from "../lib/deadAirStations";
import { getTransmission, type Transmission } from "../lib/deadAirTransmissions";
import IntroOverlay from "../components/DeadAirIntroOverlay";
import TuningDial from "../components/DeadAirTuningDial";
import FrequencyPanel from "../components/DeadAirFrequencyPanel";
import WaveformDisplay from "../components/DeadAirWaveformDisplay";
import BottomBar from "../components/DeadAirBottomBar";
import TransmissionMessage from "../components/DeadAirTransmissionMessage";

const FREQ_MIN = 70;
const FREQ_MAX = 120;

const SYSTEM_MESSAGES = [
  "Searching for signal...",
  "Something is out there.",
  "Transmission unstable.",
  "Nothing worth finding.",
  "You almost had it.",
  "Signal lost.",
  "Keep turning.",
  "Almost there.",
  "Dead air.",
  "Someone was here.",
  "Frequency unknown.",
  "Scanning...",
  "Hold still.",
  "Don't stop now.",
  "Reception unclear.",
  "Try further left.",
  "Static and silence.",
  "The dial knows.",
];

// Arc constants — must match TuningDial exactly
const ARC_START = -225;
const ARC_SPAN = 270;
const NOTCH_OFFSET = -90;

function getFrequency(dialAngle: number): number {
  const needleDeg = NOTCH_OFFSET + dialAngle;
  let relDeg = ((needleDeg - ARC_START) % 360 + 360) % 360;
  const norm = Math.max(0, Math.min(1, relDeg / ARC_SPAN));
  return FREQ_MIN + norm * (FREQ_MAX - FREQ_MIN);
}

export default function DeadAir() {
  const [started, setStarted] = useState(false);
  const [dialAngle, setDialAngle] = useState(0);
  const [frequency, setFrequency] = useState(getFrequency(0));
  const [systemMsg, setSystemMsg] = useState(SYSTEM_MESSAGES[0]);
  const [msgVisible, setMsgVisible] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const [transmission, setTransmission] = useState<Transmission | null>(null);
  const lastTransmissionTimeRef = useRef<number>(0);
  const msgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transmissionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { activeStation, signalStrength, isStatic, analyserNode, start } =
    useAudioEngine({ frequency, stations: STATIONS, volume, started });

  useEffect(() => {
    if (!started) return;
    const rotate = () => {
      setMsgVisible(false);
      setTimeout(() => {
        setSystemMsg(SYSTEM_MESSAGES[Math.floor(Math.random() * SYSTEM_MESSAGES.length)]);
        setMsgVisible(true);
      }, 400);
      msgTimerRef.current = setTimeout(rotate, 5000 + Math.random() * 7000);
    };
    msgTimerRef.current = setTimeout(rotate, 6000);
    return () => { if (msgTimerRef.current) clearTimeout(msgTimerRef.current); };
  }, [started]);

  useEffect(() => {
    setFrequency(getFrequency(dialAngle));
  }, [dialAngle]);

  const handleDialChange = useCallback((delta: number) => {
    setDialAngle((prev) => prev + delta);
  }, []);

  const handleDialSet = useCallback((targetAngle: number) => {
    setDialAngle(targetAngle);
  }, []);

  const handleStart = useCallback(async () => {
    await start();
    setStarted(true);
  }, [start]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!started) {
        if (e.code === "Space") { e.preventDefault(); handleStart(); }
        return;
      }
      if (e.code === "ArrowRight") { e.preventDefault(); setDialAngle((p) => p + 3); }
      else if (e.code === "ArrowLeft") { e.preventDefault(); setDialAngle((p) => p - 3); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, handleStart]);

  const isLocked = started && signalStrength > 0.6 && activeStation !== null;

  // Transmission polling
  // First message: 2–4s after start
  // Ongoing: poll every 2–5s at 120 MHz, 4–10s elsewhere
  // Occasional clustering: 20% chance of a follow-up message 3–6s later
  useEffect(() => {
    if (!started) return;

    const fire = () => {
      const msg = getTransmission(frequency, isLocked, lastTransmissionTimeRef.current);
      if (msg) {
        lastTransmissionTimeRef.current = Date.now();
        setTransmission({ ...msg }); // new object reference forces useEffect in child

        // 20% chance of a quick follow-up (clustering effect)
        if (Math.random() < 0.20) {
          const followDelay = 3500 + Math.random() * 2500;
          transmissionTimerRef.current = setTimeout(() => {
            const follow = getTransmission(frequency, isLocked, lastTransmissionTimeRef.current);
            if (follow) {
              lastTransmissionTimeRef.current = Date.now();
              setTransmission({ ...follow });
            }
          }, followDelay);
          return;
        }
      }

      // Schedule next poll
      const isNear120 = Math.abs(frequency - 120.0) < 0.15;
      const nextDelay = isNear120
        ? 2000 + Math.random() * 3000   // 2–5s at 120 MHz
        : 4000 + Math.random() * 6000;  // 4–10s elsewhere
      transmissionTimerRef.current = setTimeout(fire, nextDelay);
    };

    // First message: 2–4 seconds after start
    transmissionTimerRef.current = setTimeout(fire, 2000 + Math.random() * 2000);
    return () => { if (transmissionTimerRef.current) clearTimeout(transmissionTimerRef.current); };
  }, [started, frequency, isLocked]);

  return (
    <>
      {/*
        Responsive styles injected once.
        Breakpoint: 960px — below this, switch to stacked mobile layout.
        The outer wrapper uses overflow-y: auto on mobile to allow scrolling
        when panels stack below the dial.
      */}
      <style>{`
        .dead-air-root {
          position: fixed;
          inset: 0;
          background: oklch(0.085 0.005 60);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          font-family: 'Space Mono', monospace;
        }

        /* Desktop: fixed viewport, no scroll */
        @media (min-width: 960px) {
          .dead-air-root {
            overflow: hidden;
          }
          .dead-air-main {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 0;
            overflow: hidden;
            position: relative;
          }
          .dead-air-layout {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            position: relative;
          }
          /* Panels: absolutely positioned at edges */
          .dead-air-panel-left {
            position: absolute;
            left: clamp(20px, 3.5vw, 52px);
            top: 50%;
            transform: translateY(-50%);
            width: clamp(148px, 14vw, 204px);
            z-index: 2;
          }
          .dead-air-panel-right {
            position: absolute;
            right: clamp(20px, 3.5vw, 52px);
            top: 50%;
            transform: translateY(-50%);
            width: clamp(148px, 14vw, 204px);
            z-index: 2;
          }
          /* Center: dial + messages */
          .dead-air-center {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1;
          }
          .dead-air-messages {
            margin-top: clamp(14px, 2.8vmin, 32px);
            text-align: center;
            min-height: 2.6em;
          }
        }

        /* Mobile/Tablet: scrollable, stacked layout */
        @media (max-width: 959px) {
          .dead-air-root {
            overflow-y: auto;
            overflow-x: hidden;
          }
          .dead-air-main {
            flex: none;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            padding: clamp(24px, 5vmin, 48px) clamp(16px, 5vw, 32px) clamp(16px, 4vmin, 32px);
            width: 100%;
          }
          .dead-air-layout {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            gap: clamp(20px, 4vmin, 36px);
          }
          /* On mobile, panels are full-width below the dial */
          .dead-air-panel-left,
          .dead-air-panel-right {
            width: 100%;
            max-width: 420px;
          }
          /* Center: dial + messages */
          .dead-air-center {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .dead-air-messages {
            margin-top: clamp(12px, 2.5vmin, 24px);
            text-align: center;
            min-height: 2.4em;
          }
        }
      `}</style>

      <div className="dead-air-root">
        {/* Spacer for fixed HellaRichNav — matches nav height */}
        <div aria-hidden="true" style={{ height: "clamp(44px, 6vh, 56px)", flexShrink: 0, zIndex: 1 }} />

        {/* Noise texture */}
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: "256px 256px", mixBlendMode: "overlay", opacity: 0.025 }} />

        {/* Radial vignette */}
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, background: "radial-gradient(ellipse 90% 90% at 50% 50%, transparent 35%, oklch(0.04 0.003 60 / 65%) 100%)" }} />

        {/* Atmospheric transmission messages */}
        <TransmissionMessage transmission={started ? transmission : null} />

        {/* Main content */}
        <main className="dead-air-main" style={{ position: "relative", zIndex: 10 }}>
          <div className="dead-air-layout">

            {/* Left panel: Frequency + Signal */}
            <div className="dead-air-panel-left">
              <FrequencyPanel
                frequency={frequency}
                signalStrength={signalStrength}
                isStatic={isStatic}
                started={started}
              />
            </div>

            {/* Center: Dial + messages */}
            <div className="dead-air-center">              
              {/* Branding — part of the object, not a header */}
              <div
                style={{
                  textAlign: "center",
                  marginBottom: "clamp(10px, 2.5vmin, 28px)",
                  userSelect: "none",
                }}
              >
                <h1
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 300,
                    fontSize: "clamp(1.4rem, 3.5vw, 3rem)",
                    letterSpacing: "0.55em",
                    textTransform: "uppercase",
                    color: "oklch(0.84 0.010 72)",
                    margin: 0,
                    lineHeight: 1,
                    opacity: 0.88,
                  }}
                >
                  Dead Air
                </h1>
                <p
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "clamp(0.42rem, 0.85vw, 0.56rem)",
                    letterSpacing: "0.32em",
                    textTransform: "uppercase",
                    color: "oklch(0.72 0.14 65 / 55%)",
                    margin: "clamp(5px, 1vmin, 10px) 0 0",
                  }}
                >
                  The dial knows.
                </p>
              </div>
              <TuningDial
                angle={dialAngle}
                onAngleChange={handleDialChange}
                onAngleSet={handleDialSet}
                onStart={handleStart}
                started={started}
                frequency={frequency}
                freqMin={FREQ_MIN}
                freqMax={FREQ_MAX}
                signalStrength={signalStrength}
              />

              <div className="dead-air-messages">
                <p
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "clamp(0.52rem, 1.1vw, 0.68rem)",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: started ? "oklch(0.72 0.14 65)" : "oklch(0.72 0.14 65 / 28%)",
                    opacity: msgVisible ? 1 : 0,
                    transition: "opacity 0.4s ease, color 0.5s ease",
                    margin: 0,
                  }}
                >
                  {started ? systemMsg : "Searching for signal..."}
                </p>

                <div
                  style={{
                    marginTop: "6px",
                    opacity: isLocked ? 1 : 0,
                    transition: "opacity 0.9s ease",
                    minHeight: "1.2em",
                  }}
                  aria-live="polite"
                >
                  {activeStation && (
                    <p
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: "clamp(0.42rem, 0.85vw, 0.54rem)",
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color: "oklch(0.48 0.008 75 / 55%)",
                        margin: 0,
                      }}
                    >
                      {activeStation.label}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right panel: Waveform */}
            <div className="dead-air-panel-right">
              <WaveformDisplay
                analyserNode={analyserNode}
                signalStrength={signalStrength}
                started={started}
              />
            </div>

          </div>
        </main>

        {/* Bottom bar — always visible */}
        <BottomBar volume={volume} onVolumeChange={setVolume} started={started} />

        {/* Intro overlay */}
        {!started && <IntroOverlay onStart={handleStart} />}
      </div>
      <HellaRichSEO title="Dead Air" description="Late night radio scanner. Tune in to analog transmissions from the void." keywords="Dead Air, hella.rich, radio scanner, ambient audio, analog transmission, late night, web experience" />
    </>
  );
}
