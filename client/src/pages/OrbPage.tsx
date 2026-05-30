// ORB — Home Page
// Continuous rotating synth backbone, always alive after TAP TO WAKE
// Large cinematic state display below orb
// No rare events, no silence, one endless performance

import { useState, useCallback, useRef, useEffect } from 'react';
import { HellaRichSEO } from '../components/HellaRichSEO';
import OrbCanvas from '../components/OrbCanvas';
import { MoodName, MOODS } from '../lib/orbMoods';
import { orbAudio } from '../lib/orbAudio';

interface Message {
  id: number;
  text: string;
  key: number;
  isRare: boolean;
}

let msgId = 0;

// State subtitle phrases — cinematic, minimal
const STATE_SUBTITLES: Record<MoodName, string> = {
  LUST:     'MAGNETIC FIELD ACTIVE',
  GLUTTONY: 'OVERFLOW DETECTED',
  GREED:    'ACCUMULATION IN PROGRESS',
  SLOTH:    'LOW ENERGY STATE',
  WRATH:    'ENERGY INSTABILITY DETECTED',
  ENVY:     'OBSERVATION MODE ACTIVE',
  PRIDE:    'STABLE FIELD CONFIRMED',
  UNKNOWN:  'UNDEFINED STATE',
};

// Animated starfield
function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const stars = Array.from({ length: 160 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() < 0.85 ? 0.3 + Math.random() * 0.6 : 0.8 + Math.random() * 0.5,
      alpha: 0.05 + Math.random() * 0.22,
      speed: 0.3 + Math.random() * 0.9,
      phase: Math.random() * Math.PI * 2,
    }));
    let animId = 0;
    const t0 = performance.now();
    const draw = () => {
      const t = (performance.now() - t0) / 1000;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        const a = Math.max(0.02, s.alpha + Math.sin(t * s.speed + s.phase) * 0.07);
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(215, 208, 196, ${a})`; ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    };
    animId = requestAnimationFrame(draw);
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.45 }} />;
}

export default function Home() {
  const [mood, setMood] = useState<MoodName>('PRIDE');
  const [messages, setMessages] = useState<Message[]>([]);
  const [started, setStarted] = useState(false);
  const [startFading, setStartFading] = useState(false);
  const [messageVisible, setMessageVisible] = useState(false);
  const [progressionLevel, setProgressionLevel] = useState(0);
  const [interactionCount, setInteractionCount] = useState(0);
  const [stateVisible, setStateVisible] = useState(false);
  const [displayedMood, setDisplayedMood] = useState<MoodName>('PRIDE');
  const [autoMode, setAutoMode] = useState(true); // AUTO sequencer on by default
  const [driftOn, setDriftOn] = useState(true); // DRIFT on by default
  const msgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateTransitionRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moodRef = useRef<MoodName>('PRIDE');
  const microShiftRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const macroShiftRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sequencerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seqIndexRef = useRef(0); // current position in the sin sequence
  const autoModeRef = useRef(true);

  const moodConfig = MOODS[mood];
  const displayMoodConfig = MOODS[displayedMood];

  const handleMoodChange = useCallback((m: MoodName) => {
    setMood(m);
    moodRef.current = m;
    // Fade state display out, update, fade back in
    setStateVisible(false);
    if (stateTransitionRef.current) clearTimeout(stateTransitionRef.current);
    stateTransitionRef.current = setTimeout(() => {
      setDisplayedMood(m);
      setStateVisible(true);
    }, 600);
  }, []);

  const handleMessage = useCallback((text: string, isRare = false) => {
    setMessages(prev => [{ id: ++msgId, text, key: Date.now(), isRare }, ...prev].slice(0, 6));
    setMessageVisible(true);
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
    msgTimerRef.current = setTimeout(() => setMessageVisible(false), isRare ? 6000 : 4000);
  }, []);

  const handleStart = useCallback(async () => {
    if (started) return;
    setStartFading(true);
    // iOS Safari: AudioContext must be created in the synchronous
    // part of the gesture handler. We call init() immediately (no await)
    // so the context is created synchronously, then the async setup
    // (oscillators, nodes) continues in the background.
    const initPromise = orbAudio.init();
    // Set mode immediately (synchronous part of init already ran)
    orbAudio.setMode('pride');
    orbAudio.enableDrift();
    await initPromise;
    setTimeout(() => {
      setStarted(true);
      setStateVisible(true);
      handleMessage('THE ORB IS WAITING.');
    }, 800);
  }, [started, handleMessage]);

  // Spacebar also starts the app
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !started) {
        e.preventDefault();
        handleStart();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [started, handleStart]);

  const handleInteractionStart = useCallback(() => {}, []);

  const handleDriftToggle = useCallback(() => {
    if (!orbAudio.isInitialized()) return;
    const next = !driftOn;
    setDriftOn(next);
    if (next) orbAudio.enableDrift();
    else orbAudio.disableDrift();
  }, [driftOn]);

  const handleProgressionUpdate = useCallback((level: number, count: number) => {
    setProgressionLevel(level);
    setInteractionCount(count);
  }, []);

  // ---- SEVEN DEADLY SINS STEP SEQUENCER ----
  // The canonical sequence order — forms a dark hypnotic melody
  const SIN_SEQUENCE: MoodName[] = ['PRIDE', 'GREED', 'LUST', 'WRATH', 'GLUTTONY', 'ENVY', 'SLOTH'];

  // Advance to next sin in sequence
  const advanceSequencer = useCallback(() => {
    if (!autoModeRef.current) return;
    const idx = seqIndexRef.current;
    const next = SIN_SEQUENCE[idx % SIN_SEQUENCE.length];
    seqIndexRef.current = (idx + 1) % SIN_SEQUENCE.length;

    handleMoodChange(next);
    if (orbAudio.isInitialized()) {
      orbAudio.setMode(MOODS[next].audioMode);
      orbAudio.triggerMelodicNote(MOODS[next].audioMode);
    }
    // Occasionally show a message
    if (Math.random() < 0.4) {
      const msgs = MOODS[next].messages;
      handleMessage(msgs[Math.floor(Math.random() * msgs.length)]);
    }
  }, [handleMoodChange, handleMessage]);

  // Schedule next sequencer step — 3–7s with slight randomness
  const scheduleNextStep = useCallback(() => {
    if (sequencerRef.current) clearTimeout(sequencerRef.current);
    // Timing varies: sometimes 3s, sometimes 7s, never robotic
    const base = 4000 + Math.random() * 3000;
    const jitter = (Math.random() - 0.5) * 1500;
    const delay = Math.max(2500, base + jitter);
    sequencerRef.current = setTimeout(() => {
      advanceSequencer();
      scheduleNextStep();
    }, delay);
  }, [advanceSequencer]);

  // Micro audio shifts — keep the sound alive between steps
  const scheduleMicroShift = useCallback(() => {
    if (microShiftRef.current) clearTimeout(microShiftRef.current);
    const delay = 1200 + Math.random() * 2200;
    microShiftRef.current = setTimeout(() => {
      if (orbAudio.isInitialized()) {
        const r = Math.random();
        if (r < 0.35) orbAudio.triggerDrag(Math.random());
        else if (r < 0.65) orbAudio.triggerRubHarmonics(0.06 + Math.random() * 0.20);
        else orbAudio.setIntensity(0.04 + Math.random() * 0.18);
      }
      scheduleMicroShift();
    }, delay);
  }, []);

  // Keep autoModeRef in sync
  useEffect(() => { autoModeRef.current = autoMode; }, [autoMode]);

  // Start sequencer when user wakes ORB
  useEffect(() => {
    if (started) {
      moodRef.current = mood;
      seqIndexRef.current = 0;
      // First step fires after a short pause to let the orb wake up
      setTimeout(() => {
        advanceSequencer();
        scheduleNextStep();
        scheduleMicroShift();
      }, 2500);
    }
    return () => {
      if (sequencerRef.current) clearTimeout(sequencerRef.current);
      if (microShiftRef.current) clearTimeout(microShiftRef.current);
      if (macroShiftRef.current) clearTimeout(macroShiftRef.current);
    };
  }, [started]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMoodButtonClick = useCallback((m: MoodName) => {
    if (!started) return;
    handleMoodChange(m);
    orbAudio.setMode(MOODS[m].audioMode);
    orbAudio.triggerMelodicNote(MOODS[m].audioMode);
    handleMessage(MOODS[m].messages[Math.floor(Math.random() * MOODS[m].messages.length)]);
    // Sync sequencer to this position so it continues from here
    const idx = SIN_SEQUENCE.indexOf(m);
    if (idx >= 0) seqIndexRef.current = (idx + 1) % SIN_SEQUENCE.length;
    // Restart the step timer from this point
    scheduleNextStep();
  }, [started, handleMoodChange, handleMessage, scheduleNextStep]);

  const latestMessage = messages[0];
  const displayMoods: MoodName[] = ['LUST', 'GLUTTONY', 'GREED', 'WRATH', 'ENVY', 'SLOTH', 'PRIDE'];

  return (
    <>
    <div style={{
      width: '100vw', height: '100vh',
      background: '#060608',
      position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Starfield />

      {/* ORB° title */}
      <div style={{
        position: 'absolute', top: '8%', left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10, textAlign: 'center', userSelect: 'none',
        opacity: started ? 1 : 0.4,
        transition: 'opacity 1.5s ease',
      }}>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontWeight: 300,
          fontSize: 'clamp(18px, 3.5vmin, 26px)',
          letterSpacing: '0.55em',
          color: 'rgba(220, 210, 195, 0.72)',
          lineHeight: 1,
        }}>ORB°</div>
        <div style={{ width: '28px', height: '1px', background: 'rgba(220, 210, 195, 0.22)', margin: '8px auto 0' }} />
      </div>

      {/* WebGL Orb */}
      <div
        style={{ position: 'absolute', inset: 0, zIndex: 2, transform: 'translateY(-8%)' }}
        onTouchStart={() => {
          // iOS Safari audio unlock: resume context on any touch
          if (orbAudio.isInitialized()) {
            const ctx = (orbAudio as unknown as { ctx: AudioContext | null }).ctx;
            if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
          }
        }}
      >
        <OrbCanvas
          onMoodChange={handleMoodChange}
          onMessage={handleMessage}
          currentMood={mood}
          onInteractionStart={handleInteractionStart}
          onProgressionUpdate={handleProgressionUpdate}
        />
      </div>

      {/* DRIFT ambient bloom — wider atmospheric glow when DRIFT is on */}
      {driftOn && started && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -58%)',
          width: '88vmin', height: '88vmin', borderRadius: '50%',
          background: `radial-gradient(ellipse at center, transparent 38%, ${moodConfig.cssColor}18 56%, transparent 72%)`,
          zIndex: 1, pointerEvents: 'none',
          transition: 'background 2.5s ease',
          filter: 'blur(22px)',
          opacity: 0.7,
        }} />
      )}

      {/* Floating message — brief, above state display */}
      {started && messageVisible && latestMessage && (
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, 24vmin)',
          zIndex: 5, textAlign: 'center',
          pointerEvents: 'none',
          width: '100%', maxWidth: '560px', padding: '0 32px',
          opacity: messageVisible ? 1 : 0,
          transition: 'opacity 1.4s ease',
        }}>
          <div key={latestMessage.key} style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 'clamp(9px, 1.8vw, 11px)',
            letterSpacing: '0.28em',
            color: 'rgba(220, 210, 195, 0.50)',
            lineHeight: 1.8, whiteSpace: 'nowrap',
          }}>
            {latestMessage.text}
          </div>
        </div>
      )}

      {/* ---- BOTTOM SECTION ---- */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        zIndex: 6,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center',
        background: 'linear-gradient(to top, rgba(6,6,8,0.98) 0%, rgba(6,6,8,0.72) 55%, transparent 100%)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingTop: 'clamp(32px, 5vh, 52px)',
      }}>

        {/* ---- STATE DISPLAY ---- large, readable, cinematic */}
        {started && (
          <div style={{
            textAlign: 'center',
            opacity: stateVisible ? 1 : 0,
            transition: 'opacity 0.8s ease',
            marginBottom: 'clamp(16px, 2.5vh, 28px)',
          }}>
            {/* State name — large */}
            <div style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 'clamp(14px, 3vw, 24px)',
              fontWeight: 700,
              letterSpacing: '0.32em',
              color: displayMoodConfig.cssColor,
              lineHeight: 1,
              transition: 'color 1.2s ease',
              textShadow: `0 0 30px ${displayMoodConfig.cssColor}44`,
            }}>
              {displayedMood}
            </div>
            {/* Subtitle — small, cinematic */}
            <div style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 'clamp(8px, 1.5vw, 10px)',
              letterSpacing: '0.30em',
              color: 'rgba(220, 210, 195, 0.32)',
              marginTop: '8px',
              lineHeight: 1,
            }}>
              {STATE_SUBTITLES[displayedMood]}
            </div>
          </div>
        )}

        {/* Mood selector buttons — smaller, secondary */}
        {started && (
          <div style={{
            display: 'flex', alignItems: 'stretch',
            width: '100%', maxWidth: '640px',
            padding: '0 12px 22px', gap: '4px',
          }}>
            {displayMoods.map(m => {
              const isActive = mood === m;
              const cfg = MOODS[m];
              return (
                <button
                  key={m}
                  onClick={() => handleMoodButtonClick(m)}
                  style={{
                    flex: 1,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: '5px', padding: '8px 4px 10px',
                    background: isActive
                      ? `rgba(${hexToRgb(cfg.cssColor)}, 0.08)`
                      : 'transparent',
                    border: isActive
                      ? `1px solid rgba(${hexToRgb(cfg.cssColor)}, 0.25)`
                      : '1px solid rgba(220, 210, 195, 0.06)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.5s ease',
                    minHeight: '44px',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <div style={{
                    width: '4px', height: '4px', borderRadius: '50%',
                    background: isActive ? cfg.cssColor : 'rgba(220, 210, 195, 0.18)',
                    boxShadow: isActive ? `0 0 6px ${cfg.cssColor}` : 'none',
                    transition: 'all 0.5s ease',
                    animation: isActive ? 'dot-pulse 2.5s ease-in-out infinite' : 'none',
                    flexShrink: 0,
                  }} />
                  <div style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 'clamp(7px, 1.5vw, 9px)',
                    letterSpacing: '0.15em',
                    color: isActive ? cfg.cssColor : 'rgba(220, 210, 195, 0.28)',
                    fontWeight: isActive ? 700 : 400,
                    transition: 'color 0.5s ease',
                    lineHeight: 1,
                  }}>
                    {m}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* AUTO + DRIFT toggles */}
        {started && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '4px' }}>
            <button
              onClick={() => setAutoMode(a => !a)}
              style={{
                background: 'none', border: 'none', padding: '4px 8px',
                fontFamily: "'Space Mono', monospace",
                fontSize: 'clamp(7px, 1.2vw, 9px)',
                letterSpacing: '0.25em',
                color: autoMode ? 'rgba(220, 210, 195, 0.55)' : 'rgba(220, 210, 195, 0.22)',
                cursor: 'pointer',
                transition: 'color 0.3s ease',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {autoMode ? '● AUTO' : '○ AUTO'}
            </button>
            <div style={{ width: '1px', height: '10px', background: 'rgba(220,210,195,0.10)' }} />
            <button
              onClick={handleDriftToggle}
              style={{
                background: 'none', border: 'none', padding: '4px 8px',
                fontFamily: "'Space Mono', monospace",
                fontSize: 'clamp(7px, 1.2vw, 9px)',
                letterSpacing: '0.25em',
                color: driftOn ? moodConfig.cssColor : 'rgba(220, 210, 195, 0.22)',
                cursor: 'pointer',
                transition: 'color 0.5s ease',
                textShadow: driftOn ? `0 0 12px ${moodConfig.cssColor}66` : 'none',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {driftOn ? '◈ DRIFT' : '◇ DRIFT'}
            </button>
          </div>
        )}

        {/* Progression bar */}
        {started && interactionCount >= 5 && (
          <div style={{
            width: '40px', height: '1px',
            background: 'rgba(220, 210, 195, 0.07)',
            position: 'relative', overflow: 'hidden',
            marginBottom: '12px',
          }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: `${progressionLevel * 100}%`,
              background: moodConfig.cssColor,
              transition: 'width 1.2s ease, background 1.8s ease',
              opacity: 0.50,
            }} />
          </div>
        )}

      </div>

      {/* ---- START OVERLAY ---- */}
      {!started && (
        <div
          onClick={handleStart}
          style={{
            position: 'absolute', inset: 0, zIndex: 30,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            opacity: startFading ? 0 : 1,
            transition: 'opacity 0.8s ease',
            background: 'rgba(6, 6, 8, 0.45)',
          }}
        >
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '10px',
            padding: '18px 36px',
            background: 'rgba(220, 210, 195, 0.06)',
            border: '1px solid rgba(220, 210, 195, 0.18)',
            borderRadius: '60px',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            userSelect: 'none',
          }}>
            <div style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 'clamp(11px, 2.2vw, 14px)',
              letterSpacing: '0.35em',
              color: 'rgba(220, 210, 195, 0.88)',
              lineHeight: 1,
            }}>
              TAP TO WAKE ORB
            </div>
            <div style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 'clamp(8px, 1.4vw, 10px)',
              letterSpacing: '0.25em',
              color: 'rgba(220, 210, 195, 0.38)',
              lineHeight: 1,
            }}>
              TAP OR PRESS SPACE
            </div>
          </div>
        </div>
            )}
    </div>
    <HellaRichSEO title="ORB" description="A living object. Seven deadly sins as emotional states. Touch it." keywords="ORB, hella.rich, interactive art, ambient audio, seven deadly sins, living object, web experience" />
    </>
  );
}
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '220, 210, 195';
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}
