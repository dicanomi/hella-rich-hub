/**
 * THE EYE — Flagship Experience
 * Design: Cinematic Product Lab
 * Source: dicanomi/the-eye (deployed repo) + new interactions from spec
 *
 * Features:
 * - Start pill (PRESS SPACE OR TAP PLAY)
 * - Cursor tracking with spring inertia + micro overshoot
 * - Realistic blinking (normal, slow, double)
 * - Pupil dilation based on cursor proximity
 * - Idle life: breathing, gaze shifts, micro movement, glow changes
 * - Rare eye contact: looks directly at user, pauses, blinks, returns
 * - Camera integration: small dark glass preview, eye glances toward it
 * - Cinematic message system: large, centered, fade/blur/rise
 * - Auto message rotation (5-10s) + click advances
 * - Memory system (localStorage): visits, interactions, time since last
 * - Time of day awareness: morning/afternoon/night/late night
 * - Rare event system (1 in 50-100 interactions)
 * - Audio: ambient drone hum + per-interaction sounds (no repeats)
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { TheEye } from '../components/TheEye';
import { usePerhapsAudio } from '../hooks/usePerhapsAudio';
import { getFortune, getMemoryFortune, FORTUNES } from '../lib/fortunes';

// ── Memory system ──────────────────────────────────────────────────────────
const MEM_KEY = 'hellaEyeMemory';
interface EyeMemory {
  visits: number;
  interactions: number;
  lastVisit: number;
}
function getMemory(): EyeMemory {
  try {
    const raw = localStorage.getItem(MEM_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* noop */ }
  return { visits: 0, interactions: 0, lastVisit: 0 };
}
function saveMemory(m: EyeMemory) {
  try { localStorage.setItem(MEM_KEY, JSON.stringify(m)); } catch { /* noop */ }
}

// ── Time of day ────────────────────────────────────────────────────────────
type TimeOfDay = 'morning' | 'afternoon' | 'night' | 'late-night';
function getTimeOfDay(): TimeOfDay {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'afternoon';
  if (h >= 18 && h < 23) return 'night';
  return 'late-night';
}

const TIME_MESSAGES: Record<TimeOfDay, string[]> = {
  morning: [
    "GOOD MORNING.\nTHE EYE\nNEVER SLEPT.",
    "MORNING.\nHOPEFUL.\nTHE EYE\nIS CAUTIOUSLY\nOPTIMISTIC.",
    "THE DAY\nHAS BEGUN.\nTHE EYE\nWAS ALREADY HERE.",
    "MORNING LIGHT.\nTHE EYE\nHAS SEEN\nBETTER MORNINGS.",
  ],
  afternoon: [
    "THE EYE\nOBSERVES\nYOUR AFTERNOON.",
    "MIDDAY.\nSTILL HERE.\nSTILL WATCHING.",
    "THE EYE\nNOTES YOUR\nPRODUCTIVITY.",
    "AFTERNOON.\nTHE EYE\nHAS QUESTIONS.",
  ],
  night: [
    "THE NIGHT\nBELONGS\nTO THE EYE.",
    "EVENING.\nSTRANGE\nTHINGS HAPPEN NOW.",
    "THE EYE\nIS MORE AWAKE\nTHAN YOU.",
    "NIGHT MODE\nACTIVATED.\nTHE EYE\nPREFERS THIS.",
  ],
  'late-night': [
    "LATE.\nVERY LATE.\nTHE EYE\nDOES NOT SLEEP.",
    "YOU SHOULD\nBE ASLEEP.\nTHE EYE\nKNOWS THIS.",
    "3AM ENERGY.\nTHE EYE\nAPPROVES.",
    "EXISTENTIAL\nHOURS.\nTHE EYE\nIS COMFORTABLE HERE.",
    "THE VOID\nLOOKS BACK.\nHELLO.",
    "NOTHING\nIS REAL\nAT THIS HOUR.\nTHE EYE\nIS REAL.",
  ],
};

// ── Rare event messages ────────────────────────────────────────────────────
const RARE_EVENTS = [
  "I SHOULDN'T\nSAY THIS.",
  "THE EYE\nHAS BEEN\nWATCHING YOU\nSPECIFICALLY.",
  "YOU ARE\nTHE ONLY ONE\nWHO COMES HERE\nLIKE THIS.",
  "THE EYE\nLIKES YOU.\nDON'T TELL ANYONE.",
  "SOMETHING\nIS DIFFERENT\nABOUT YOU.",
];

// ── Auras ──────────────────────────────────────────────────────────────────
const AURAS = [
  { css: '#50a8c8', glow: 'rgba(80,168,200,0.6)', rgb: '80,168,200' }, // cyan-blue (default)
  { css: '#c8a050', glow: 'rgba(200,160,80,0.6)',  rgb: '200,160,80'  },
  { css: '#50c896', glow: 'rgba(80,200,150,0.6)',  rgb: '80,200,150'  },
  { css: '#c050b4', glow: 'rgba(192,80,180,0.6)',  rgb: '192,80,180'  },
  { css: '#5068c8', glow: 'rgba(80,104,200,0.6)',  rgb: '80,104,200'  },
  { css: '#c84050', glow: 'rgba(200,64,80,0.6)',   rgb: '200,64,80'   },
];

type Phase = 'idle' | 'awakening' | 'suspense' | 'revealing' | 'showing' | 'dissolving';

export default function TheEyePage() {
  const [started, setStarted] = useState(false);
  const [startFading, setStartFading] = useState(false);
  const [phase, setPhaseState] = useState<Phase>('idle');
  const [fortune, setFortune] = useState('');
  const [isRare, setIsRare] = useState(false);
  const [isGlitch, setIsGlitch] = useState(false);
  const [aura, setAura] = useState(AURAS[0]);
  const [muted, setMutedState] = useState(false);
  const [cameraGranted, setCameraGranted] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [messageVisible, setMessageVisible] = useState(false);
  const [interactionCount, setInteractionCount] = useState(0);
  const [memory] = useState<EyeMemory>(() => getMemory());
  const [timeOfDay] = useState<TimeOfDay>(() => getTimeOfDay());

  const phaseRef = useRef<Phase>('idle');
  const tRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const autoMsgRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const msgQueueRef = useRef<string[]>([]);

  const { playActivation, playGlitch, startPulse, setMuted } = usePerhapsAudio();

  const setPhase = (p: Phase) => { phaseRef.current = p; setPhaseState(p); };
  const addT = (fn: () => void, ms: number) => { const id = setTimeout(fn, ms); tRefs.current.push(id); };
  const clearT = () => { tRefs.current.forEach(clearTimeout); tRefs.current = []; };

  // ── Memory: record visit ─────────────────────────────────────────────────
  useEffect(() => {
    const m = getMemory();
    m.visits += 1;
    m.lastVisit = Date.now();
    saveMemory(m);
  }, []);

  // ── Start handler ─────────────────────────────────────────────────────────
  const handleStart = useCallback(async () => {
    if (started) return;
    setStartFading(true);
    startPulse();
    setTimeout(() => setStarted(true), 700);

    // Try camera after a brief delay
    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 160, height: 120 } });
        setCameraStream(stream);
        setCameraGranted(true);
        setShowCamera(true);
      } catch {
        // Camera denied — that's fine
      }
    }, 2000);
  }, [started, startPulse]);

  // ── Attach camera stream to video element ─────────────────────────────────
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
    return () => {
      if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
    };
  }, [cameraStream]);

  // ── Spacebar ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (!started) { handleStart(); return; }
        activate();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [started, handleStart]);

  // ── Message queue builder ─────────────────────────────────────────────────
  const buildMessageQueue = useCallback(() => {
    const queue: string[] = [];

    // Memory-aware opening message
    const daysSinceLast = memory.lastVisit
      ? (Date.now() - memory.lastVisit) / (1000 * 60 * 60 * 24)
      : 999;
    const memMsg = getMemoryFortune(memory.visits, daysSinceLast);
    if (memMsg) queue.push(memMsg);

    // Time of day message
    const todMsgs = TIME_MESSAGES[timeOfDay];
    queue.push(todMsgs[Math.floor(Math.random() * todMsgs.length)]);

    // Fill with fortunes
    const shuffled = [...FORTUNES].sort(() => Math.random() - 0.5);
    queue.push(...shuffled.slice(0, 8));

    msgQueueRef.current = queue;
  }, [memory, timeOfDay]);

  useEffect(() => {
    if (started) buildMessageQueue();
  }, [started, buildMessageQueue]);

  // ── Auto message rotation ─────────────────────────────────────────────────
  const scheduleNextMessage = useCallback(() => {
    if (autoMsgRef.current) clearTimeout(autoMsgRef.current);
    const delay = 5000 + Math.random() * 5000;
    autoMsgRef.current = setTimeout(() => {
      if (phaseRef.current === 'idle') activate();
      scheduleNextMessage();
    }, delay);
  }, []);

  useEffect(() => {
    if (!started) return;
    const t = setTimeout(() => scheduleNextMessage(), 6000);
    return () => clearTimeout(t);
  }, [started, scheduleNextMessage]);

  // ── Activate (show fortune) ───────────────────────────────────────────────
  const activate = useCallback(() => {
    const cur = phaseRef.current;
    if (cur === 'showing' || cur === 'revealing') {
      clearT();
      setPhase('dissolving');
      setMessageVisible(false);
      addT(() => { setPhase('idle'); setFortune(''); }, 400);
      return;
    }
    if (cur !== 'idle') return;
    clearT();

    const newCount = interactionCount + 1;
    setInteractionCount(newCount);

    // Save interaction count
    const m = getMemory();
    m.interactions = newCount;
    saveMemory(m);

    // Rare event (1 in 50-100)
    const isRareEvent = Math.random() < 0.015;
    const isGlitchEvent = Math.random() < 0.02;

    const newAura = AURAS[Math.floor(Math.random() * AURAS.length)];
    setAura(newAura);

    setPhase('awakening');
    isGlitchEvent ? playGlitch() : playActivation();

    addT(() => setPhase('suspense'), 200);

    const suspense = 380 + Math.random() * 280;
    addT(() => {
      let text: string;
      let rare = false;
      let glitch = false;

      if (isRareEvent) {
        text = RARE_EVENTS[Math.floor(Math.random() * RARE_EVENTS.length)];
        rare = true;
      } else if (isGlitchEvent) {
        const result = getFortune();
        text = result.text;
        glitch = true;
      } else if (msgQueueRef.current.length > 0) {
        text = msgQueueRef.current.shift()!;
        // Refill if empty
        if (msgQueueRef.current.length === 0) buildMessageQueue();
      } else {
        const result = getFortune();
        text = result.text;
        rare = result.isRare;
        glitch = result.isGlitch;
      }

      setFortune(text);
      setIsRare(rare);
      setIsGlitch(glitch);
      setPhase('revealing');
      setMessageVisible(true);

      addT(() => {
        setPhase('showing');
        const hold = rare ? 5500 : 3200 + Math.random() * 1800;
        addT(() => {
          setPhase('dissolving');
          setMessageVisible(false);
          addT(() => { setPhase('idle'); setFortune(''); }, 500);
        }, hold);
      }, 200);
    }, 600 + suspense);
  }, [interactionCount, playActivation, playGlitch, buildMessageQueue]);

  const isActive = phase !== 'idle';
  const showFort = ['revealing', 'showing', 'dissolving'].includes(phase);

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#060608',
      position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <style>{`
        @keyframes scanSweep {
          from { opacity: 0.8; }
          to   { opacity: 0; }
        }
        @keyframes bloomPulse {
          0%   { opacity: 0; }
          30%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes msgAppear {
          0%   { opacity: 0; filter: blur(8px); transform: translate(-50%, -50%) translateY(12px); }
          100% { opacity: 1; filter: blur(0px); transform: translate(-50%, -50%) translateY(0); }
        }
        @keyframes msgDissolve {
          0%   { opacity: 1; filter: blur(0px); }
          100% { opacity: 0; filter: blur(6px); }
        }
        @keyframes dot-pulse {
          0%, 100% { opacity: 0.3; }
          50%       { opacity: 0.8; }
        }
        @keyframes cameraGlance {
          0%   { opacity: 0.6; }
          50%  { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>

      {/* ── Title ── */}
      <div style={{
        position: 'absolute',
        top: 'clamp(28px,7%,56px)',
        left: '50%', transform: 'translateX(-50%)',
        zIndex: 10, textAlign: 'center', userSelect: 'none',
        opacity: started ? 1 : 0.3,
        transition: 'opacity 1.5s ease',
      }}>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontWeight: 300,
          fontSize: 'clamp(18px,3.5vmin,26px)',
          letterSpacing: '0.55em',
          color: 'rgba(220,210,195,0.72)',
          lineHeight: 1,
          paddingLeft: '0.55em',
        }}>
          THE EYE
        </div>
        <div style={{ width: '28px', height: '1px', background: 'rgba(220,210,195,0.18)', margin: '8px auto 0' }} />
      </div>

      {/* ── THE EYE ── */}
      <TheEye
        phase={phase}
        aura={aura}
        isActive={isActive}
        onClick={() => started ? activate() : handleStart()}
        started={started}
      />

      {/* ── Fortune message ── */}
      {showFort && fortune && (
        <div
          style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 8,
            textAlign: 'center',
            pointerEvents: 'none',
            width: 'min(88vw, 680px)',
            marginTop: 'clamp(160px, 32vmin, 280px)',
            animation: phase === 'dissolving' ? 'msgDissolve 0.5s ease forwards' : 'msgAppear 0.6s cubic-bezier(0.23,1,0.32,1) forwards',
          }}
        >
          <div style={{
            fontFamily: isGlitch ? "'Space Mono', monospace" : "'Cormorant Garamond', serif",
            fontWeight: isGlitch ? 700 : 300,
            fontStyle: isGlitch ? 'normal' : 'italic',
            fontSize: 'clamp(28px, 7.5vmin, 82px)',
            lineHeight: 1.12,
            letterSpacing: isGlitch ? '0.06em' : '0.03em',
            color: isRare
              ? aura.css
              : isGlitch
              ? 'rgba(220,210,195,0.5)'
              : 'rgba(220,210,195,0.94)',
            textShadow: isRare
              ? `0 0 50px ${aura.glow}, 0 0 15px ${aura.glow}, 0 0 3px ${aura.glow}`
              : isGlitch
              ? `0 0 20px rgba(${aura.rgb},0.4)`
              : '0 2px 60px rgba(0,0,0,0.9)',
            whiteSpace: 'pre-line',
            userSelect: 'none',
          }}>
            {fortune}
          </div>
          {isRare && (
            <div style={{
              marginTop: '18px',
              fontFamily: "'Space Mono', monospace",
              fontSize: 'clamp(7px,1.1vmin,9px)',
              letterSpacing: '0.3em',
              color: aura.css,
              opacity: 0.55,
              animation: 'dot-pulse 2s ease-in-out infinite',
            }}>
              ◈ RARE TRANSMISSION
            </div>
          )}
        </div>
      )}

      {/* ── Camera preview ── */}
      {showCamera && cameraGranted && (
        <div style={{
          position: 'absolute',
          bottom: 'clamp(20px,4vh,40px)',
          right: 'clamp(20px,4vw,40px)',
          zIndex: 12,
          width: 'clamp(80px,10vw,120px)',
          aspectRatio: '4/3',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
          opacity: 0.7,
          transition: 'opacity 0.3s ease',
          animation: 'cameraGlance 8s ease-in-out infinite',
        }}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)', // mirror
              filter: 'brightness(0.7) contrast(1.1)',
            }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, rgba(0,0,0,0.3) 0%, transparent 60%)',
            pointerEvents: 'none',
          }} />
        </div>
      )}

      {/* ── Start pill ── */}
      {!started && (
        <div style={{
          position: 'absolute',
          bottom: 'clamp(28px,5vh,52px)',
          left: '50%', transform: 'translateX(-50%)',
          zIndex: 20,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
          opacity: startFading ? 0 : 1,
          transition: 'opacity 0.65s ease',
          pointerEvents: startFading ? 'none' : 'all',
        }}>
          <button
            onClick={handleStart}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: '100px',
              padding: 'clamp(10px,1.5vh,14px) clamp(22px,3vw,36px)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '10px',
              transition: 'background 0.2s ease, border-color 0.2s ease',
              backdropFilter: 'blur(12px)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.10)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.22)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.14)';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <polygon points="3,1 13,7 3,13" fill="rgba(255,255,255,0.7)"/>
            </svg>
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 'clamp(9px,1vw,11px)',
              letterSpacing: '0.2em',
              color: 'rgba(255,255,255,0.75)',
              textTransform: 'uppercase',
            }}>
              Press Space or Tap Play
            </span>
          </button>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(11px,1.3vw,14px)',
            fontStyle: 'italic',
            color: 'rgba(220,210,195,0.28)',
            letterSpacing: '0.08em',
          }}>
            {memory.visits > 1 ? 'THE EYE REMEMBERS YOU.' : 'LET IT NOTICE YOU.'}
          </div>
        </div>
      )}

      {/* ── Bottom controls (when started) ── */}
      {started && (
        <div style={{
          position: 'absolute',
          bottom: 'clamp(14px,2.5vh,26px)',
          left: '50%', transform: 'translateX(-50%)',
          zIndex: 10,
          display: 'flex', alignItems: 'center', gap: '16px',
          opacity: showFort ? 0 : 1,
          transition: 'opacity 0.4s ease',
          whiteSpace: 'nowrap',
        }}>
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 'clamp(6px,0.9vmin,8px)',
            letterSpacing: '0.22em',
            color: 'rgba(220,210,195,0.13)',
            textTransform: 'uppercase',
          }}>
            TAP · SPACE · BLINK
          </div>
          <button
            onClick={() => {
              const next = !muted;
              setMutedState(next);
              setMuted(next);
            }}
            aria-label={muted ? 'Unmute' : 'Mute'}
            style={{
              background: 'none', border: 'none', padding: '4px 6px',
              cursor: 'pointer', outline: 'none',
              fontFamily: "'Space Mono', monospace",
              fontSize: 'clamp(6px,0.9vmin,8px)',
              letterSpacing: '0.18em',
              color: muted ? 'rgba(220,210,195,0.35)' : 'rgba(220,210,195,0.13)',
              textTransform: 'uppercase',
              transition: 'color 0.2s ease',
            }}
          >
            {muted ? '◎ SOUND OFF' : '◉ SOUND ON'}
          </button>
        </div>
      )}

      {/* ── Footer nav ── */}
      <div style={{
        position: 'absolute',
        bottom: 'clamp(14px,2.5vh,26px)',
        right: 'clamp(16px,2.5vw,28px)',
        zIndex: 10,
      }}>
        <a
          href="/"
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 'clamp(7px,0.8vw,9px)',
            letterSpacing: '0.18em',
            color: 'rgba(255,255,255,0.18)',
            textTransform: 'uppercase',
            textDecoration: 'none',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.18)')}
        >
          ← hella.rich
        </a>
      </div>
    </div>
  );
}
