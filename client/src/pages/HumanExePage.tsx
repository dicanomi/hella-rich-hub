/**
 * HUMAN.EXE — hella.rich
 * A fake human diagnostic machine.
 * Model: HUMAN.EXE MKII | Serial: HR-1956-HMN | Node: 1956
 *
 * Design: Cold-war laboratory equipment × Braun industrial × Retro-futurism
 * Palette: Deep black-brown bg / aged cream machine / amber accent / muted green activity / faded cyan signal
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { HellaRichSEO } from '../components/HellaRichSEO';
import { HumanScanner3D } from '../components/HumanScanner3D';

// ── Types ──────────────────────────────────────────────────────────────────
type ScanState = 'idle' | 'powering' | 'scanning' | 'analysis' | 'results';

interface Metric {
  id: string;
  label: string;
  value: number; // 0–100
  bodyZone: string; // which body zone lights up
  color: string;
}

interface DiagnosticResult {
  metrics: Metric[];
  finalReport: string;
  subjectId: string;
}

// ── Data ───────────────────────────────────────────────────────────────────
const METRICS_POOL = [
  { id: 'anxiety',        label: 'ANXIETY',          bodyZone: 'head',    color: '#e8a020' },
  { id: 'denial',         label: 'DENIAL',           bodyZone: 'chest',   color: '#c0a060' },
  { id: 'caffeine',       label: 'CAFFEINE',         bodyZone: 'heart',   color: '#e05020' },
  { id: 'focus',          label: 'FOCUS',            bodyZone: 'head',    color: '#40c0a0' },
  { id: 'social_battery', label: 'SOCIAL BATTERY',   bodyZone: 'arms',    color: '#60a0e0' },
  { id: 'snack_urgency',  label: 'SNACK URGENCY',    bodyZone: 'gut',     color: '#e08030' },
  { id: 'main_character', label: 'MAIN CHARACTER',   bodyZone: 'full',    color: '#d0b040' },
  { id: 'spiritual_debt', label: 'SPIRITUAL DEBT',   bodyZone: 'chest',   color: '#9060c0' },
  { id: 'existential',    label: 'EXISTENTIAL STATIC', bodyZone: 'head',  color: '#40a0c0' },
  { id: 'regret_cache',   label: 'REGRET CACHE',     bodyZone: 'gut',     color: '#a06040' },
  { id: 'vibe_integrity', label: 'VIBE INTEGRITY',   bodyZone: 'full',    color: '#60c060' },
  { id: 'dream_residue',  label: 'DREAM RESIDUE',    bodyZone: 'head',    color: '#8060d0' },
  { id: 'emotional_wifi', label: 'EMOTIONAL WIFI',   bodyZone: 'chest',   color: '#40b0e0' },
  { id: 'impulse_ctrl',   label: 'IMPULSE CONTROL',  bodyZone: 'arms',    color: '#e06040' },
  { id: 'thought_noise',  label: 'THOUGHT NOISE',    bodyZone: 'head',    color: '#a0a0a0' },
];

const FINAL_REPORTS = [
  'USER IS FUNCTIONAL BUT STRANGELY LIT FROM WITHIN.',
  'SUBJECT CONTAINS 14% WEATHER.',
  'EMOTIONAL FIRMWARE OUTDATED. UPDATE PENDING.',
  'USER APPEARS NORMAL UNTIL LEFT ALONE WITH A DECISION.',
  'SOUL DETECTED. PLEASE CONFIRM.',
  'BRAIN OPERATING WITH MINIMAL SUPERVISION.',
  'SUBJECT IS MOSTLY WATER AND UNFINISHED TASKS.',
  'REGRET CACHE APPROACHING CAPACITY.',
  'HUMAN DETECTED. CLASSIFICATION: PROBABLY FINE.',
  'SUBJECT RADIATES MILD EXISTENTIAL WARMTH.',
  'INTERNAL MONOLOGUE LOUDER THAN EXPECTED.',
  'VIBE INTEGRITY COMPROMISED. SOURCE: UNKNOWN.',
  'PURPOSE NOT FOUND. CONTINUING ANYWAY.',
  'SUBJECT CONTAINS TRACES OF EARLIER VERSIONS.',
  'THOUGHT NOISE WITHIN ACCEPTABLE PARAMETERS. BARELY.',
  'MAIN CHARACTER INDEX: ELEVATED. PROCEED WITH CAUTION.',
  'EMOTIONAL WIFI SIGNAL WEAK. RECONNECTING...',
  'CAFFEINE DEPENDENCY CONFIRMED. MACHINE APPROVES.',
  'SPIRITUAL DEBT NOTED. MACHINE DOES NOT JUDGE.',
  'DREAM RESIDUE DETECTED. ORIGIN: UNCLEAR.',
];

const LOG_MESSAGES = [
  'BOOTING HUMAN.EXE...',
  'CALIBRATING SUBJECT...',
  'INITIALIZING SCAN ARRAY...',
  'DETECTING HUMAN...',
  'HUMAN DETECTED.',
  'SCANNING REGRET CACHE...',
  'CHECKING EMOTIONAL WIFI...',
  'MEASURING THOUGHT NOISE...',
  'ANALYZING SPINE SIGNAL...',
  'VERIFYING PURPOSE...',
  'PURPOSE NOT FOUND.',
  'CHECKING SNACK URGENCY...',
  'CALCULATING MAIN CHARACTER INDEX...',
  'SCANNING CAFFEINE LEVELS...',
  'DETECTING VIBE INTEGRITY...',
  'MEASURING EXISTENTIAL STATIC...',
  'RUNNING FINAL ANALYSIS...',
  'CROSS-REFERENCING HUMAN DATABASE...',
  'COMPILING DIAGNOSTIC REPORT...',
  'ANALYSIS COMPLETE.',
];

const SUBJECT_IDS = ['HMN-0042', 'HMN-1138', 'HMN-7734', 'HMN-2001', 'HMN-9999', 'HMN-0001', 'HMN-3141', 'HMN-6502'];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateDiagnostics(): DiagnosticResult {
  const count = randomInt(6, 9);
  const pool = [...METRICS_POOL].sort(() => Math.random() - 0.5).slice(0, count);
  const metrics = pool.map(m => ({ ...m, value: randomInt(12, 97) }));
  return {
    metrics,
    finalReport: FINAL_REPORTS[Math.floor(Math.random() * FINAL_REPORTS.length)],
    subjectId: SUBJECT_IDS[Math.floor(Math.random() * SUBJECT_IDS.length)],
  };
}

// ── Human Body SVG ─────────────────────────────────────────────────────────
function HumanBody({ activeZones, scanY, scanState }: {
  activeZones: string[];
  scanY: number; // 0-100 percent
  scanState: ScanState;
}) {
  const isActive = (zone: string) => activeZones.includes(zone) || activeZones.includes('full');
  const isScanning = scanState === 'scanning' || scanState === 'analysis';

  return (
    <svg
      viewBox="0 0 200 480"
      style={{ width: '100%', height: '100%', overflow: 'visible' }}
      aria-hidden="true"
    >
      <defs>
        <filter id="glow-amber">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="glow-cyan">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="glow-green">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <radialGradient id="zone-head" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e8a020" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#e8a020" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="zone-chest" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#40c0a0" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#40c0a0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="zone-gut" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e08030" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#e08030" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="zone-heart" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e05020" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#e05020" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="scan-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#40e0d0" stopOpacity="0" />
          <stop offset="45%" stopColor="#40e0d0" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#80ffff" stopOpacity="0.9" />
          <stop offset="55%" stopColor="#40e0d0" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#40e0d0" stopOpacity="0" />
        </linearGradient>
        <clipPath id="body-clip">
          <path d="
            M100 10
            C115 10 128 20 132 35
            L140 35 C148 35 155 42 155 50
            C155 58 148 65 140 65
            L138 65 C138 80 145 95 148 110
            L160 115 C175 120 185 135 185 152
            L185 260 C185 270 178 278 168 278
            L168 370 C168 382 160 390 148 390
            L148 460 C148 472 140 480 128 480
            L72 480 C60 480 52 472 52 460
            L52 390 C40 390 32 382 32 370
            L32 278 C22 278 15 270 15 260
            L15 152 C15 135 25 120 40 115
            L52 110 C55 95 62 80 62 65
            L60 65 C52 65 45 58 45 50
            C45 42 52 35 60 35
            L68 35 C72 20 85 10 100 10 Z
          " />
        </clipPath>
      </defs>

      {/* ── Body silhouette ── */}
      <g clipPath="url(#body-clip)">
        {/* Base fill */}
        <rect x="0" y="0" width="200" height="480"
          fill={scanState === 'idle' ? '#0d0d0a' : '#111108'}
          opacity="0.95"
        />

        {/* Internal grid lines — diagnostic mesh */}
        {scanState !== 'idle' && Array.from({ length: 12 }, (_, i) => (
          <line key={`h${i}`}
            x1="0" y1={i * 40} x2="200" y2={i * 40}
            stroke="#40c060" strokeWidth="0.3" opacity="0.15"
          />
        ))}
        {scanState !== 'idle' && Array.from({ length: 6 }, (_, i) => (
          <line key={`v${i}`}
            x1={i * 40} y1="0" x2={i * 40} y2="480"
            stroke="#40c060" strokeWidth="0.3" opacity="0.15"
          />
        ))}

        {/* Zone glow overlays */}
        {(isActive('head') || isActive('full')) && (
          <ellipse cx="100" cy="55" rx="45" ry="50"
            fill="url(#zone-head)" opacity={isActive('head') ? 0.8 : 0.3}
          />
        )}
        {(isActive('chest') || isActive('full')) && (
          <ellipse cx="100" cy="175" rx="55" ry="60"
            fill="url(#zone-chest)" opacity={0.7}
          />
        )}
        {(isActive('heart') || isActive('full')) && (
          <ellipse cx="85" cy="155" rx="20" ry="20"
            fill="url(#zone-heart)" opacity={0.9}
          />
        )}
        {(isActive('gut') || isActive('full')) && (
          <ellipse cx="100" cy="255" rx="45" ry="45"
            fill="url(#zone-gut)" opacity={0.7}
          />
        )}
        {(isActive('arms') || isActive('full')) && (
          <>
            <ellipse cx="32" cy="200" rx="18" ry="55"
              fill="#60a0e0" fillOpacity="0.25"
            />
            <ellipse cx="168" cy="200" rx="18" ry="55"
              fill="#60a0e0" fillOpacity="0.25"
            />
          </>
        )}

        {/* Scan beam */}
        {isScanning && (
          <rect
            x="0"
            y={scanY * 4.8 - 30}
            width="200"
            height="60"
            fill="url(#scan-beam)"
          />
        )}
      </g>

      {/* ── Body outline ── */}
      <path d="
        M100 10
        C115 10 128 20 132 35
        L140 35 C148 35 155 42 155 50
        C155 58 148 65 140 65
        L138 65 C138 80 145 95 148 110
        L160 115 C175 120 185 135 185 152
        L185 260 C185 270 178 278 168 278
        L168 370 C168 382 160 390 148 390
        L148 460 C148 472 140 480 128 480
        L72 480 C60 480 52 472 52 460
        L52 390 C40 390 32 382 32 370
        L32 278 C22 278 15 270 15 260
        L15 152 C15 135 25 120 40 115
        L52 110 C55 95 62 80 62 65
        L60 65 C52 65 45 58 45 50
        C45 42 52 35 60 35
        L68 35 C72 20 85 10 100 10 Z
      "
        fill="none"
        stroke={scanState === 'idle' ? '#3a3a2a' : '#60c060'}
        strokeWidth={scanState === 'idle' ? '1' : '1.5'}
        opacity={scanState === 'idle' ? 0.4 : 0.7}
        filter={scanState !== 'idle' ? 'url(#glow-green)' : undefined}
      />

      {/* ── Skeletal structure lines ── */}
      {scanState !== 'idle' && (
        <g stroke="#40c0a0" strokeWidth="0.8" opacity="0.35" fill="none">
          {/* Spine */}
          <line x1="100" y1="65" x2="100" y2="370" />
          {/* Ribs */}
          {[130, 150, 170, 190, 210].map(y => (
            <g key={y}>
              <path d={`M100 ${y} C80 ${y-5} 60 ${y+8} 52 ${y+15}`} />
              <path d={`M100 ${y} C120 ${y-5} 140 ${y+8} 148 ${y+15}`} />
            </g>
          ))}
          {/* Collar bones */}
          <path d="M100 100 C80 95 65 100 55 112" />
          <path d="M100 100 C120 95 135 100 145 112" />
          {/* Pelvis */}
          <path d="M65 310 C70 330 100 340 130 330 C140 320 140 310 135 310 L65 310 Z" />
        </g>
      )}

      {/* ── Target acquisition markers ── */}
      {scanState === 'analysis' && (
        <g stroke="#e8a020" strokeWidth="1" fill="none" opacity="0.8">
          {/* Head target */}
          <circle cx="100" cy="55" r="30" strokeDasharray="4 3" />
          <line x1="70" y1="55" x2="60" y2="55" />
          <line x1="130" y1="55" x2="140" y2="55" />
          <line x1="100" y1="25" x2="100" y2="15" />
          <line x1="100" y1="85" x2="100" y2="95" />
          {/* Chest target */}
          <circle cx="100" cy="175" r="25" strokeDasharray="3 4" opacity="0.6" />
          {/* Gut target */}
          <circle cx="100" cy="255" r="20" strokeDasharray="2 5" opacity="0.5" />
        </g>
      )}

      {/* ── Diagnostic node dots ── */}
      {scanState !== 'idle' && [
        [100, 55], [85, 155], [100, 175], [100, 255],
        [32, 200], [168, 200], [100, 330], [75, 430], [125, 430],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="3"
          fill={scanState === 'results' ? '#60c060' : '#40c0a0'}
          opacity={0.6 + Math.sin(i) * 0.3}
          filter="url(#glow-cyan)"
        />
      ))}

      {/* ── Pulse ring on heart ── */}
      {(isActive('heart') || isActive('full')) && (
        <circle cx="85" cy="155" r="12"
          fill="none" stroke="#e05020" strokeWidth="1.5"
          opacity="0.7" filter="url(#glow-amber)"
        />
      )}
    </svg>
  );
}

// ── Analog Gauge ───────────────────────────────────────────────────────────
function AnalogGauge({ label, value, color }: { label: string; value: number; color: string }) {
  const angle = -135 + (value / 100) * 270;
  const r = 28;
  const cx = 36, cy = 36;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
    }}>
      <svg width="72" height="72" viewBox="0 0 72 72">
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth="4"
          strokeDasharray={`${2 * Math.PI * r * 0.75} ${2 * Math.PI * r * 0.25}`}
          strokeDashoffset={`${2 * Math.PI * r * 0.125}`}
          strokeLinecap="round"
          transform={`rotate(-225 ${cx} ${cy})`}
        />
        {/* Fill */}
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth="4"
          strokeDasharray={`${2 * Math.PI * r * 0.75 * value / 100} ${2 * Math.PI * r}`}
          strokeDashoffset={`${2 * Math.PI * r * 0.125}`}
          strokeLinecap="round"
          transform={`rotate(-225 ${cx} ${cy})`}
          opacity="0.85"
        />
        {/* Needle */}
        <g transform={`rotate(${angle} ${cx} ${cy})`}>
          <line x1={cx} y1={cy} x2={cx} y2={cy - r + 6}
            stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.9"
          />
        </g>
        {/* Center dot */}
        <circle cx={cx} cy={cy} r="3" fill={color} opacity="0.7" />
        {/* Value */}
        <text x={cx} y={cy + 14} textAnchor="middle"
          fill="rgba(255,255,255,0.7)" fontSize="9" fontFamily="'DM Mono', monospace"
          letterSpacing="0.05em"
        >
          {value}
        </text>
      </svg>
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: '7px',
        letterSpacing: '0.15em',
        color: 'rgba(255,255,255,0.4)',
        textTransform: 'uppercase',
        textAlign: 'center',
        maxWidth: '72px',
        lineHeight: 1.2,
      }}>
        {label}
      </div>
    </div>
  );
}

// ── LED Array ──────────────────────────────────────────────────────────────
function LEDArray({ value, color }: { value: number; color: string }) {
  const total = 12;
  const lit = Math.round(value / 100 * total);
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{
          width: 6, height: 14,
          borderRadius: '1px',
          background: i < lit ? color : 'rgba(255,255,255,0.06)',
          boxShadow: i < lit ? `0 0 4px ${color}` : 'none',
          transition: 'all 0.3s ease',
        }} />
      ))}
    </div>
  );
}

// ── System Log ─────────────────────────────────────────────────────────────
function SystemLog({ lines }: { lines: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [lines]);

  return (
    <div ref={ref} style={{
      height: '120px',
      overflowY: 'auto',
      background: 'rgba(0,0,0,0.4)',
      border: '1px solid rgba(255,255,255,0.06)',
      padding: '8px 10px',
      fontFamily: "'DM Mono', monospace",
      fontSize: '9px',
      letterSpacing: '0.12em',
      color: '#60c060',
      lineHeight: 1.8,
      scrollbarWidth: 'none',
    }}>
      {lines.map((line, i) => (
        <div key={i} style={{ opacity: i === lines.length - 1 ? 1 : 0.5 + (i / lines.length) * 0.5 }}>
          &gt; {line}
        </div>
      ))}
      <div style={{ display: 'inline-block', width: 6, height: 10, background: '#60c060', animation: 'cursorBlink 0.8s steps(1) infinite' }} />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function HumanExePage() {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scanY, setScanY] = useState(0);
  const [logLines, setLogLines] = useState<string[]>(['HUMAN.EXE MKII — READY.', 'AWAITING SUBJECT...']);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [activeZones, setActiveZones] = useState<string[]>([]);
  const [blinkState, setBlinkState] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const scanRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Idle blink
  useEffect(() => {
    const t = setInterval(() => setBlinkState(b => !b), 800);
    return () => clearInterval(t);
  }, []);

  const addLog = useCallback((msg: string) => {
    setLogLines(prev => [...prev.slice(-20), msg]);
  }, []);

  const startScan = useCallback(() => {
    if (scanState !== 'idle' && scanState !== 'results') return;
    setResult(null);
    setActiveZones([]);
    setScanProgress(0);
    setScanY(0);
    setScanState('powering');
    setLogLines(['BOOTING HUMAN.EXE...', 'CALIBRATING SUBJECT...']);

    // Power-up sequence
    setTimeout(() => {
      setScanState('scanning');
      addLog('DETECTING HUMAN...');
      addLog('HUMAN DETECTED.');

      // Scan beam animation
      let y = 0;
      let logIdx = 4;
      scanRef.current = setInterval(() => {
        y += 1.2;
        setScanY(Math.min(y, 100));
        setScanProgress(Math.min(y, 100));

        // Randomly activate zones during scan
        if (y % 15 < 1.5) {
          const zones = ['head', 'chest', 'gut', 'heart', 'arms'];
          setActiveZones([zones[Math.floor(Math.random() * zones.length)]]);
        }

        // Add log messages
        if (y % 8 < 1.2 && logIdx < LOG_MESSAGES.length) {
          addLog(LOG_MESSAGES[logIdx++]);
        }

        if (y >= 100) {
          clearInterval(scanRef.current!);
          setScanState('analysis');
          addLog('RUNNING FINAL ANALYSIS...');
          addLog('CROSS-REFERENCING HUMAN DATABASE...');

          setTimeout(() => {
            const diag = generateDiagnostics();
            setResult(diag);
            setActiveZones(diag.metrics.map(m => m.bodyZone));
            setScanState('results');
            addLog('ANALYSIS COMPLETE.');
            addLog(diag.finalReport);
          }, 2200);
        }
      }, 40);
    }, 900);
  }, [scanState, addLog]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (scanRef.current) clearInterval(scanRef.current);
      if (logRef.current) clearInterval(logRef.current);
    };
  }, []);

  const bg = '#0a0908';
  const cream = '#e8e0cc';
  const amber = '#d4900a';
  const green = '#4ab860';
  const cyan = '#40b8c0';

  return (
    <>
      <HellaRichSEO
        title="HUMAN.EXE — hella.rich"
        description="A fake human diagnostic machine. Stand in front of the scanner. The machine knows too much."
        keywords="human scanner, diagnostic machine, hella.rich, HUMAN.EXE, fake scanner, interactive art"
      />
      <style>{`
        @keyframes cursorBlink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
        @keyframes ledPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
        @keyframes scannerHum { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(1.02); } }
        @keyframes radarSweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes crtFlicker { 0%, 98%, 100% { opacity: 1; } 99% { opacity: 0.85; } }
        @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        @keyframes resultIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .human-exe-page { animation: crtFlicker 4s steps(1) infinite; }
        .scan-btn:hover { background: rgba(212,144,10,0.18) !important; border-color: rgba(212,144,10,0.7) !important; }
        .scan-btn:active { transform: scale(0.97); }
      `}</style>

      <div className="human-exe-page" style={{
        minHeight: '100vh',
        background: bg,
        color: cream,
        fontFamily: "'DM Mono', monospace",
        overflowX: 'hidden',
        position: 'relative',
      }}>
        {/* CRT scanlines overlay */}
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
        }} />

        {/* Machine header */}
        <header style={{
          padding: 'clamp(12px,2vh,20px) clamp(16px,3vw,32px)',
          borderBottom: `1px solid rgba(212,144,10,0.2)`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(0,0,0,0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Power indicator */}
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: scanState === 'idle' ? 'rgba(74,184,96,0.4)' : green,
              boxShadow: scanState !== 'idle' ? `0 0 8px ${green}` : 'none',
              animation: scanState === 'idle' ? 'ledPulse 2s ease infinite' : 'none',
            }} />
            <div>
              <div style={{ fontSize: 'clamp(10px,1.2vw,13px)', letterSpacing: '0.35em', color: amber, fontWeight: 400 }}>
                HUMAN.EXE
              </div>
              <div style={{ fontSize: '8px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
                DIAGNOSTIC SYSTEM MKII
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            {[
              ['MODEL', 'HUMAN.EXE MKII'],
              ['SERIAL', 'HR-1956-HMN'],
              ['STATUS', scanState === 'idle' ? 'STANDBY' : scanState === 'results' ? 'COMPLETE' : 'ACTIVE'],
            ].map(([k, v]) => (
              <div key={k} style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '7px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)' }}>{k}</div>
                <div style={{
                  fontSize: '9px', letterSpacing: '0.15em',
                  color: k === 'STATUS' && scanState !== 'idle' ? green : 'rgba(255,255,255,0.55)',
                }}>{v}</div>
              </div>
            ))}
          </div>
        </header>

        {/* Main chamber */}
        <main style={{
          display: 'grid',
          gridTemplateColumns: '1fr clamp(180px,28vw,320px) 1fr',
          gap: 'clamp(12px,2vw,24px)',
          padding: 'clamp(16px,2.5vh,28px) clamp(16px,3vw,32px)',
          minHeight: 'calc(100vh - 120px)',
          alignItems: 'start',
        }}>

          {/* ── Left panel: System log + machine details ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Machine spec plate */}
            <div style={{
              border: `1px solid rgba(212,144,10,0.15)`,
              padding: '14px',
              background: 'rgba(0,0,0,0.2)',
            }}>
              <div style={{ fontSize: '7px', letterSpacing: '0.3em', color: amber, marginBottom: '10px', opacity: 0.7 }}>
                MACHINE SPECIFICATIONS
              </div>
              {[
                ['NODE', 'NODE_1956'],
                ['SCAN MODE', 'HUMAN'],
                ['CALIBRATION', 'QUESTIONABLE'],
                ['CERTIFICATION', 'ABSOLUTELY NOT'],
                ['FIRMWARE', 'v4.2.0-BETA'],
                ['UPTIME', '∞'],
              ].map(([k, v]) => (
                <div key={k} style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: '8px', letterSpacing: '0.12em',
                  padding: '4px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  color: 'rgba(255,255,255,0.45)',
                }}>
                  <span style={{ color: 'rgba(255,255,255,0.25)' }}>{k}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>

            {/* Radar display */}
            <div style={{
              border: `1px solid rgba(64,184,192,0.15)`,
              padding: '14px',
              background: 'rgba(0,0,0,0.2)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
            }}>
              <div style={{ fontSize: '7px', letterSpacing: '0.3em', color: cyan, opacity: 0.7 }}>
                SIGNAL MONITOR
              </div>
              <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                <svg width="100" height="100" viewBox="0 0 100 100">
                  {[40, 30, 20, 10].map(r => (
                    <circle key={r} cx="50" cy="50" r={r}
                      fill="none" stroke={cyan} strokeWidth="0.5" opacity="0.2"
                    />
                  ))}
                  <line x1="10" y1="50" x2="90" y2="50" stroke={cyan} strokeWidth="0.5" opacity="0.2" />
                  <line x1="50" y1="10" x2="50" y2="90" stroke={cyan} strokeWidth="0.5" opacity="0.2" />
                  {scanState !== 'idle' && (
                    <g style={{ transformOrigin: '50px 50px', animation: 'radarSweep 3s linear infinite' }}>
                      <path d="M50 50 L50 10" stroke={cyan} strokeWidth="1.5" opacity="0.7" />
                      <path d="M50 50 L50 10 A40 40 0 0 1 90 50 Z"
                        fill={cyan} fillOpacity="0.06"
                      />
                    </g>
                  )}
                  {result && result.metrics.slice(0, 5).map((m, i) => {
                    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
                    const r = m.value / 100 * 38;
                    return (
                      <circle key={m.id}
                        cx={50 + Math.cos(angle) * r}
                        cy={50 + Math.sin(angle) * r}
                        r="3" fill={m.color} opacity="0.8"
                      />
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* System log */}
            <div style={{ border: `1px solid rgba(96,192,96,0.15)`, background: 'rgba(0,0,0,0.2)' }}>
              <div style={{ padding: '8px 10px 4px', fontSize: '7px', letterSpacing: '0.3em', color: green, opacity: 0.7 }}>
                SYSTEM LOG
              </div>
              <SystemLog lines={logLines} />
            </div>
          </div>

          {/* ── Center: Scanner chamber ── */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
          }}>
            {/* Chamber frame */}
            <div style={{
              position: 'relative',
              width: '100%',
              border: `2px solid rgba(212,144,10,${scanState !== 'idle' ? '0.4' : '0.15'})`,
              background: 'rgba(0,0,0,0.5)',
              padding: '12px',
              transition: 'border-color 0.5s ease',
              boxShadow: scanState !== 'idle' ? `0 0 20px rgba(212,144,10,0.1), inset 0 0 30px rgba(0,0,0,0.5)` : 'none',
            }}>
              {/* Corner markers */}
              {[['0 0', 'top left'], ['0 auto', 'top right'], ['auto 0', 'bottom left'], ['auto auto', 'bottom right']].map(([pos, label]) => (
                <div key={label} style={{
                  position: 'absolute',
                  top: pos.split(' ')[0] === '0' ? '-1px' : 'auto',
                  bottom: pos.split(' ')[0] === 'auto' ? '-1px' : 'auto',
                  left: pos.split(' ')[1] === '0' ? '-1px' : 'auto',
                  right: pos.split(' ')[1] === 'auto' ? '-1px' : 'auto',
                  width: '12px', height: '12px',
                  borderTop: pos.split(' ')[0] === '0' ? `2px solid ${amber}` : 'none',
                  borderBottom: pos.split(' ')[0] === 'auto' ? `2px solid ${amber}` : 'none',
                  borderLeft: pos.split(' ')[1] === '0' ? `2px solid ${amber}` : 'none',
                  borderRight: pos.split(' ')[1] === 'auto' ? `2px solid ${amber}` : 'none',
                }} />
              ))}

              {/* Subject ID */}
              <div style={{
                textAlign: 'center', fontSize: '8px', letterSpacing: '0.2em',
                color: 'rgba(255,255,255,0.3)', marginBottom: '8px',
              }}>
                SUBJECT: {result?.subjectId || '---'}
              </div>

              {/* 3D Human scanner */}
              <div style={{ height: 'clamp(280px,45vw,420px)', position: 'relative' }}>
                <HumanScanner3D scanState={scanState} scanProgress={scanProgress} activeZones={activeZones} />

                {/* Scan progress bar */}
                {(scanState === 'scanning') && (
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    height: '2px', background: 'rgba(255,255,255,0.05)',
                  }}>
                    <div style={{
                      height: '100%', background: cyan,
                      width: `${scanProgress}%`,
                      transition: 'width 0.1s linear',
                      boxShadow: `0 0 6px ${cyan}`,
                    }} />
                  </div>
                )}
              </div>

              {/* Scan button */}
              <div style={{ textAlign: 'center', marginTop: '12px' }}>
                <button
                  className="scan-btn"
                  onClick={startScan}
                  disabled={scanState === 'scanning' || scanState === 'analysis' || scanState === 'powering'}
                  style={{
                    background: scanState === 'idle' || scanState === 'results'
                      ? 'rgba(212,144,10,0.08)' : 'rgba(0,0,0,0.3)',
                    border: `1px solid rgba(212,144,10,${scanState === 'idle' || scanState === 'results' ? '0.5' : '0.2'})`,
                    color: scanState === 'idle' || scanState === 'results'
                      ? amber : 'rgba(255,255,255,0.2)',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '10px',
                    letterSpacing: '0.3em',
                    padding: '10px 24px',
                    cursor: scanState === 'idle' || scanState === 'results' ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease',
                    width: '100%',
                  }}
                >
                  {scanState === 'idle' ? 'BEGIN SCAN' :
                   scanState === 'powering' ? 'POWERING UP...' :
                   scanState === 'scanning' ? `SCANNING ${Math.round(scanProgress)}%` :
                   scanState === 'analysis' ? 'ANALYZING...' :
                   'SCAN AGAIN'}
                </button>
              </div>
            </div>

            {/* Final report */}
            {result && scanState === 'results' && (
              <div style={{
                width: '100%',
                border: `1px solid rgba(212,144,10,0.3)`,
                padding: '14px',
                background: 'rgba(212,144,10,0.04)',
                animation: 'resultIn 0.5s ease',
              }}>
                <div style={{ fontSize: '7px', letterSpacing: '0.3em', color: amber, opacity: 0.7, marginBottom: '8px' }}>
                  FINAL DIAGNOSTIC REPORT
                </div>
                <div style={{
                  fontSize: 'clamp(9px,1.1vw,11px)',
                  letterSpacing: '0.12em',
                  color: 'rgba(255,255,255,0.8)',
                  lineHeight: 1.6,
                }}>
                  {result.finalReport}
                </div>
              </div>
            )}
          </div>

          {/* ── Right panel: Metrics ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Gauges */}
            <div style={{
              border: `1px solid rgba(255,255,255,0.06)`,
              padding: '14px',
              background: 'rgba(0,0,0,0.2)',
            }}>
              <div style={{ fontSize: '7px', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.3)', marginBottom: '12px' }}>
                DIAGNOSTIC METRICS
              </div>
              {result ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
                  gap: '12px',
                }}>
                  {result.metrics.map((m, i) => (
                    <div key={m.id} style={{ animation: `resultIn 0.4s ease ${i * 0.06}s both` }}>
                      <AnalogGauge label={m.label} value={m.value} color={m.color} />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
                  gap: '12px',
                  opacity: 0.2,
                }}>
                  {Array.from({ length: 6 }, (_, i) => (
                    <AnalogGauge key={i} label="---" value={0} color="rgba(255,255,255,0.2)" />
                  ))}
                </div>
              )}
            </div>

            {/* LED arrays for top metrics */}
            {result && (
              <div style={{
                border: `1px solid rgba(255,255,255,0.06)`,
                padding: '14px',
                background: 'rgba(0,0,0,0.2)',
                animation: 'resultIn 0.5s ease 0.3s both',
              }}>
                <div style={{ fontSize: '7px', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.3)', marginBottom: '12px' }}>
                  SIGNAL LEVELS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {result.metrics.slice(0, 5).map(m => (
                    <div key={m.id}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        fontSize: '7px', letterSpacing: '0.12em',
                        color: 'rgba(255,255,255,0.35)', marginBottom: '4px',
                      }}>
                        <span>{m.label}</span>
                        <span style={{ color: m.color }}>{m.value}</span>
                      </div>
                      <LEDArray value={m.value} color={m.color} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Oscilloscope-style waveform */}
            <div style={{
              border: `1px solid rgba(64,184,192,0.15)`,
              padding: '14px',
              background: 'rgba(0,0,0,0.2)',
            }}>
              <div style={{ fontSize: '7px', letterSpacing: '0.3em', color: cyan, opacity: 0.7, marginBottom: '8px' }}>
                VITAL WAVEFORM
              </div>
              <svg width="100%" height="50" viewBox="0 0 200 50" preserveAspectRatio="none">
                <path
                  d={scanState === 'idle'
                    ? 'M0 25 L200 25'
                    : `M0 25 ${Array.from({ length: 20 }, (_, i) => {
                        const x = i * 10;
                        const y = 25 + Math.sin(i * 0.8 + Date.now() * 0.001) * 12 + Math.random() * 4;
                        return `L${x} ${y}`;
                      }).join(' ')}`
                  }
                  fill="none"
                  stroke={cyan}
                  strokeWidth="1.2"
                  opacity={scanState === 'idle' ? 0.2 : 0.7}
                />
              </svg>
            </div>

            {/* Certification plate */}
            <div style={{
              border: `1px solid rgba(212,144,10,0.1)`,
              padding: '10px 14px',
              background: 'rgba(0,0,0,0.15)',
              fontSize: '7px',
              letterSpacing: '0.15em',
              color: 'rgba(255,255,255,0.2)',
              lineHeight: 2,
            }}>
              <div style={{ color: amber, opacity: 0.5, marginBottom: '4px', letterSpacing: '0.3em' }}>CERTIFICATION</div>
              HUMAN.EXE IS NOT A MEDICAL DEVICE.<br />
              RESULTS ARE ENTIRELY FABRICATED.<br />
              MACHINE ACCEPTS NO RESPONSIBILITY.<br />
              CALIBRATION: QUESTIONABLE.<br />
              <span style={{ color: amber, opacity: 0.4 }}>© HELLA.RICH / NODE_1956</span>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
