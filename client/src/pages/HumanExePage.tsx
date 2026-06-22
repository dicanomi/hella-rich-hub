/**
 * HUMAN.EXE — hella.rich
 * Human Diagnostic Machine. NODE_1956.
 *
 * Design: cultdeadcow.com ASCII terminal × spacecraft diagnostic
 * Color: terminal green (#33ff33) only. Black background.
 * Typography: monospace. Raw machine output.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { HellaRichSEO } from '../components/HellaRichSEO';
import { HumanScanner3D } from '../components/HumanScanner3D';
import type { ScanState } from '../components/HumanScanner3D';
import { useHumanExeAudio } from '../hooks/useHumanExeAudio';

// ── Types ──────────────────────────────────────────────────────────────────
interface Metric {
  id: string;
  label: string;
  value: number;
}

interface DiagnosticResult {
  metrics: Metric[];
  finalReport: string;
  subjectId: string;
}

// ── Data ───────────────────────────────────────────────────────────────────
const METRICS_POOL = [
  { id: 'anxiety',        label: 'ANXIETY' },
  { id: 'denial',         label: 'DENIAL' },
  { id: 'caffeine',       label: 'CAFFEINE' },
  { id: 'focus',          label: 'FOCUS' },
  { id: 'social_battery', label: 'SOCIAL BATTERY' },
  { id: 'snack_urgency',  label: 'SNACK URGENCY' },
  { id: 'main_character', label: 'MAIN CHARACTER' },
  { id: 'spiritual_debt', label: 'SPIRITUAL DEBT' },
  { id: 'existential',    label: 'EXISTENTIAL STATIC' },
  { id: 'regret_cache',   label: 'REGRET CACHE' },
  { id: 'vibe_integrity', label: 'VIBE INTEGRITY' },
  { id: 'thought_noise',  label: 'THOUGHT NOISE' },
  { id: 'impulse_ctrl',   label: 'IMPULSE CONTROL' },
  { id: 'dream_residue',  label: 'DREAM RESIDUE' },
  { id: 'emotional_wifi', label: 'EMOTIONAL WIFI' },
];

const FINAL_REPORTS = [
  'USER IS FUNCTIONAL BUT STRANGELY LIT FROM WITHIN.',
  'SUBJECT CONTAINS 14% WEATHER.',
  'EMOTIONAL FIRMWARE OUTDATED.',
  'USER APPEARS NORMAL UNTIL LEFT ALONE WITH A DECISION.',
  'SOUL DETECTED. PLEASE CONFIRM.',
  'BRAIN OPERATING WITH MINIMAL SUPERVISION.',
  'SUBJECT IS MOSTLY WATER AND UNFINISHED TASKS.',
  'REGRET CACHE APPROACHING CAPACITY.',
  'HUMAN DETECTED. CLASSIFICATION: PROBABLY FINE.',
  'INTERNAL MONOLOGUE LOUDER THAN EXPECTED.',
  'PURPOSE NOT FOUND. CONTINUING ANYWAY.',
  'THOUGHT NOISE WITHIN ACCEPTABLE PARAMETERS. BARELY.',
];

const ALIEN_FINAL_MESSAGES = [
  'THEY WERE NEVER HIDING.',
  'SUBJECT SUCCESSFULLY CONCEALED.',
  'CLASSIFICATION ERROR CORRECTED.',
  'HUMAN STATUS REMOVED.',
  'WE HAVE SEEN THIS BEFORE.',
  'YOU PASSED THE SCAN.',
  'WELCOME BACK.',
  'SIGNAL RECOGNIZED.',
  'BIOLOGICAL IDENTITY UPDATED.',
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
  'RUNNING FINAL ANALYSIS...',
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

// ── ASCII bar ──────────────────────────────────────────────────────────────
function AsciiBar({ value, width = 20 }: { value: number; width?: number }) {
  const filled = Math.round(value / 100 * width);
  const empty = width - filled;
  return (
    <span style={{ fontFamily: 'monospace', letterSpacing: '0' }}>
      [{'█'.repeat(filled)}{'░'.repeat(empty)}] {String(value).padStart(3)}
    </span>
  );
}

// ── System log ─────────────────────────────────────────────────────────────
function SystemLog({ lines }: { lines: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [lines]);
  return (
    <div ref={ref} style={{
      height: '110px',
      overflowY: 'auto',
      fontFamily: 'monospace',
      fontSize: 'clamp(9px,0.9vw,11px)',
      color: '#33ff33',
      lineHeight: 1.7,
      scrollbarWidth: 'none',
      padding: '4px 0',
    }}>
      {lines.map((line, i) => (
        <div key={i} style={{ opacity: i === lines.length - 1 ? 1 : 0.45 + (i / lines.length) * 0.4 }}>
          &gt; {line}
        </div>
      ))}
      <span style={{ display: 'inline-block', width: 7, height: 12, background: '#33ff33', animation: 'cursorBlink 0.7s steps(1) infinite', verticalAlign: 'middle' }} />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function HumanExePage() {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scanY, setScanY] = useState(0);
  const [logLines, setLogLines] = useState<string[]>(['HUMAN.EXE MKII -- READY.', 'AWAITING SUBJECT...']);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [activeZones, setActiveZones] = useState<string[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [morphProgress, setMorphProgress] = useState(0);
  const [finalMessage, setFinalMessage] = useState('');
  const [isRareEvent, setIsRareEvent] = useState(false);
  const scanRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const morphRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopScanHumRef = useRef<(() => void) | null>(null);
  const audio = useHumanExeAudio();

  const addLog = useCallback((msg: string) => {
    setLogLines(prev => [...prev.slice(-25), msg]);
  }, []);

  const triggerRevealSequence = useCallback(() => {
    // 1% rare: empty chamber
    if (Math.random() < 0.01) {
      setIsRareEvent(true);
      setScanState('empty');
      setTimeout(() => addLog('NO HUMAN DETECTED.'), 1200);
      setTimeout(() => addLog('CHAMBER IS EMPTY.'), 2200);
      setTimeout(() => addLog('CONTINUING SCAN...'), 3200);
      return;
    }
    // Anomaly
    setTimeout(() => { setScanState('anomaly'); addLog('REVIEWING RESULTS...'); addLog('VERIFYING HUMAN STATUS...'); }, 2500);
    setTimeout(() => addLog('ANALYZING BIOLOGICAL SIGNATURE...'), 3400);
    setTimeout(() => addLog('UNKNOWN PATTERN DETECTED'), 4200);
    setTimeout(() => addLog('CROSS-CHECKING DATABASE...'), 4800);
    setTimeout(() => addLog('DATABASE MISMATCH'), 5400);
    // Glitch
    setTimeout(() => { setScanState('glitch'); addLog('WARNING'); }, 5800);
    setTimeout(() => addLog('WARNING'), 6200);
    setTimeout(() => addLog('WARNING'), 6600);
    // Morph
    setTimeout(() => {
      setScanState('morphing');
      addLog('UNAUTHORIZED LIFEFORM DETECTED');
      let mp = 0;
      if (morphRef.current) clearInterval(morphRef.current);
      morphRef.current = setInterval(() => {
        mp += 0.012;
        setMorphProgress(Math.min(mp, 1));
        if (mp >= 1) { clearInterval(morphRef.current!); morphRef.current = null; }
      }, 40);
    }, 7000);
    // Alien revealed
    setTimeout(() => { setScanState('alien'); addLog('SPECIES UNKNOWN'); addLog('HUMAN CLASSIFICATION REVOKED'); }, 11200);
    // Emergency
    setTimeout(() => {
      setScanState('emergency');
      ['DATABASE FAILURE','BIOLOGICAL MISMATCH','UNAUTHORIZED LIFEFORM DETECTED','ORIGIN: UNKNOWN','CONTACT EVENT POSSIBLE','QUARANTINE RECOMMENDED','DO NOT TERMINATE ANALYSIS']
        .forEach((m, i) => setTimeout(() => addLog(m), i * 350));
    }, 12000);
    // Final message
    setTimeout(() => {
      setScanState('final');
      const msg = ALIEN_FINAL_MESSAGES[Math.floor(Math.random() * ALIEN_FINAL_MESSAGES.length)];
      setFinalMessage(msg);
      addLog(msg);
    }, 16000);
    setTimeout(() => setScanState('alien'), 20000);
  }, [addLog]);

  const startScan = useCallback(() => {
    const canStart = ['idle', 'results', 'alien', 'final', 'empty'].includes(scanState);
    if (!canStart) return;
    if (stopScanHumRef.current) { stopScanHumRef.current(); stopScanHumRef.current = null; }
    if (morphRef.current) { clearInterval(morphRef.current); morphRef.current = null; }

    setResult(null);
    setActiveZones([]);
    setScanProgress(0);
    setScanY(0);
    setMorphProgress(0);
    setFinalMessage('');
    setIsRareEvent(false);
    setScanState('powering');
    setLogLines(['BOOTING HUMAN.EXE...', 'CALIBRATING SUBJECT...']);
    audio.powerOn();

    setTimeout(() => {
      setScanState('scanning');
      addLog('DETECTING HUMAN...');
      addLog('HUMAN DETECTED.');
      stopScanHumRef.current = audio.startScanHum();

      let y = 0;
      let logIdx = 4;
      let lastClickY = -8;
      let lastBeepY = -15;
      scanRef.current = setInterval(() => {
        y += 1.2;
        setScanY(Math.min(y, 100));
        setScanProgress(Math.min(y, 100));

        if (y - lastClickY > 12 + Math.random() * 8) { audio.relayClick(); lastClickY = y; }
        if (y - lastBeepY > 18 + Math.random() * 12) { audio.beep(440 + Math.random() * 880, 0.06, 0.08); lastBeepY = y; }
        if (y % 8 < 1.2 && logIdx < LOG_MESSAGES.length) addLog(LOG_MESSAGES[logIdx++]);

        if (y >= 100) {
          clearInterval(scanRef.current!);
          if (stopScanHumRef.current) { stopScanHumRef.current(); stopScanHumRef.current = null; }
          setScanState('analysis');
          addLog('RUNNING FINAL ANALYSIS...');
          setTimeout(() => audio.targetLock(), 300);
          setTimeout(() => audio.targetLock(), 700);
          setTimeout(() => {
            const diag = generateDiagnostics();
            setResult(diag);
            setActiveZones(diag.metrics.map(() => 'full'));
            setScanState('results');
            addLog('ANALYSIS COMPLETE.');
            addLog(diag.finalReport);
            audio.scanComplete();
            triggerRevealSequence();
          }, 2200);
        }
      }, 40);
    }, 900);
  }, [scanState, addLog, audio, triggerRevealSequence]);

  useEffect(() => {
    return () => {
      if (scanRef.current) clearInterval(scanRef.current);
      if (morphRef.current) clearInterval(morphRef.current);
      if (stopScanHumRef.current) stopScanHumRef.current();
    };
  }, []);

  const G = '#33ff33';
  const DIM = 'rgba(51,255,51,0.35)';
  const DIMMER = 'rgba(51,255,51,0.18)';
  const BG = '#020a02';
  const FONT = "'Courier New', 'Lucida Console', monospace";

  const isEmergency = ['emergency', 'final'].includes(scanState);
  const isAlienState = ['alien', 'emergency', 'final'].includes(scanState);
  const canStart = ['idle', 'results', 'alien', 'final', 'empty'].includes(scanState);

  const statusLabel =
    scanState === 'idle' ? 'STANDBY' :
    scanState === 'powering' ? 'POWERING UP' :
    scanState === 'scanning' ? 'SCANNING' :
    scanState === 'analysis' ? 'ANALYZING' :
    scanState === 'results' ? 'COMPLETE' :
    scanState === 'anomaly' ? 'ANOMALY' :
    scanState === 'glitch' ? '!!! WARNING !!!' :
    scanState === 'morphing' ? 'MORPHING' :
    scanState === 'alien' ? 'UNKNOWN LIFEFORM' :
    scanState === 'emergency' ? '!!! EMERGENCY !!!' :
    scanState === 'final' ? 'CLASSIFICATION UPDATED' :
    scanState === 'empty' ? 'CHAMBER EMPTY' :
    'UNKNOWN';

  return (
    <>
      <HellaRichSEO
        title="HUMAN.EXE — hella.rich"
        description="HUMAN.EXE. Human diagnostic machine. Biological analysis system. NODE_1956."
        keywords="human scanner, diagnostic machine, hella.rich, HUMAN.EXE, biological analysis"
      />
      <style>{`
        @keyframes cursorBlink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
        @keyframes glitchShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-4px)} 40%{transform:translateX(4px)} 60%{transform:translateX(-2px)} 80%{transform:translateX(2px)} }
        @keyframes scanline { 0%{background-position:0 0} 100%{background-position:0 100%} }
        @keyframes resultIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .human-exe { font-family: ${FONT}; }
        .human-exe-glitch { animation: glitchShake 0.12s steps(1) infinite; }
        .ascii-border { border: 1px solid ${DIM}; }
        .ascii-border-bright { border: 1px solid ${G}; }
        .ascii-border-emergency { border: 1px solid ${G}; box-shadow: 0 0 12px rgba(51,255,51,0.15); }
      `}</style>

      <div
        className={`human-exe${scanState === 'glitch' ? ' human-exe-glitch' : ''}`}
        style={{ minHeight: '100vh', background: BG, color: G, overflowX: 'hidden', position: 'relative' }}
      >
        {/* CRT scanlines */}
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px)',
        }} />

        {/* ── Header ── */}
        <header style={{
          padding: 'clamp(52px,8vh,68px) clamp(12px,2vw,20px) clamp(8px,1.5vh,14px)',
          borderBottom: `1px solid ${DIM}`,
          fontFamily: FONT,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ fontSize: 'clamp(11px,1.3vw,14px)', letterSpacing: '0.3em', color: G }}>HUMAN.EXE</div>
              <div style={{ fontSize: 'clamp(8px,0.8vw,10px)', color: DIM, letterSpacing: '0.15em' }}>HUMAN DIAGNOSTIC MACHINE</div>
            </div>
            <div style={{ display: 'flex', gap: '24px', fontSize: 'clamp(8px,0.8vw,9px)', color: DIM, letterSpacing: '0.12em' }}>
              {[['MODEL','HUMAN.EXE MKII'],['SERIAL','HR-1956-HMN'],['STATUS', statusLabel]].map(([k,v]) => (
                <div key={k}>
                  <div style={{ color: DIMMER }}>{k}</div>
                  <div style={{ color: isEmergency && k === 'STATUS' ? G : DIM }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* ── Main ── */}
        <main style={{
          display: 'grid',
          gridTemplateColumns: '1fr clamp(160px,30vw,280px) 1fr',
          gap: 'clamp(8px,1.5vw,16px)',
          padding: 'clamp(10px,1.5vh,16px) clamp(12px,2vw,20px)',
          minHeight: 'calc(100vh - 120px)',
          alignItems: 'start',
        }}>

          {/* ── Left panel ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontFamily: FONT, fontSize: 'clamp(8px,0.85vw,10px)' }}>

            {/* Machine specs */}
            <div className="ascii-border" style={{ padding: '10px' }}>
              <div style={{ color: DIM, marginBottom: '6px', letterSpacing: '0.2em' }}>+-- MACHINE SPECIFICATIONS --+</div>
              {[
                ['NODE', 'NODE_1956'],
                ['SCAN MODE', 'HUMAN'],
                ['CALIBRATION', 'NOMINAL'],
                ['CERTIFICATION', 'CLASSIFIED'],
                ['FIRMWARE', 'v4.2.0-BETA'],
                ['UPTIME', '...'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: `1px solid ${DIMMER}`, color: DIM }}>
                  <span>{k}</span><span style={{ color: G }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Radar - ASCII style */}
            <div className="ascii-border" style={{ padding: '10px' }}>
              <div style={{ color: DIM, marginBottom: '6px', letterSpacing: '0.2em' }}>+-- SIGNAL MONITOR --+</div>
              <pre style={{ color: DIM, fontSize: 'clamp(7px,0.75vw,9px)', lineHeight: 1.3, margin: 0 }}>
{`    .  *  .  *  .
  *  .  |  .  *  .
  . ---(+)--- .  *
  *  .  |  .  *  .
    .  *  .  *  .`}
              </pre>
              <div style={{ color: DIMMER, marginTop: '4px' }}>
                {scanState !== 'idle' ? 'SIGNAL ACTIVE' : 'SIGNAL STANDBY'}
              </div>
            </div>

            {/* System log */}
            <div className="ascii-border" style={{ padding: '10px' }}>
              <div style={{ color: DIM, marginBottom: '4px', letterSpacing: '0.2em' }}>+-- SYSTEM LOG --+</div>
              <SystemLog lines={logLines} />
            </div>
          </div>

          {/* ── Center: Scanner chamber ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Chamber frame */}
            <div
              className={isEmergency ? 'ascii-border-emergency' : 'ascii-border'}
              style={{
                position: 'relative',
                background: '#010601',
                padding: '8px',
              }}
            >
              {/* Corner markers */}
              <div style={{ position: 'absolute', top: 0, left: 0, color: G, fontSize: '10px', lineHeight: 1, padding: '2px' }}>+</div>
              <div style={{ position: 'absolute', top: 0, right: 0, color: G, fontSize: '10px', lineHeight: 1, padding: '2px' }}>+</div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, color: G, fontSize: '10px', lineHeight: 1, padding: '2px' }}>+</div>
              <div style={{ position: 'absolute', bottom: 0, right: 0, color: G, fontSize: '10px', lineHeight: 1, padding: '2px' }}>+</div>

              {/* Subject ID */}
              <div style={{ textAlign: 'center', fontSize: '8px', color: DIM, letterSpacing: '0.2em', marginBottom: '4px', fontFamily: FONT }}>
                SUBJECT: {result?.subjectId || '---'}
              </div>

              {/* 3D scanner */}
              <div style={{ height: 'clamp(300px,48vw,440px)', position: 'relative' }}>
                <HumanScanner3D
                  scanState={scanState}
                  scanProgress={scanProgress}
                  activeZones={activeZones}
                  morphProgress={morphProgress}
                />
                {/* Scan progress */}
                {scanState === 'scanning' && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: DIMMER }}>
                    <div style={{ height: '100%', background: G, width: `${scanProgress}%`, transition: 'width 0.1s linear' }} />
                  </div>
                )}
              </div>

              {/* Scan button */}
              <div style={{ marginTop: '8px' }}>
                <button
                  onClick={startScan}
                  disabled={!canStart}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: `1px solid ${canStart ? G : DIM}`,
                    color: canStart ? G : DIM,
                    fontFamily: FONT,
                    fontSize: 'clamp(9px,0.9vw,11px)',
                    letterSpacing: '0.3em',
                    padding: '10px',
                    cursor: canStart ? 'pointer' : 'not-allowed',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => { if (canStart) (e.currentTarget as HTMLElement).style.background = 'rgba(51,255,51,0.08)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
                >
                  {scanState === 'idle' ? '[ BEGIN SCAN ]' :
                   scanState === 'powering' ? '[ POWERING UP... ]' :
                   scanState === 'scanning' ? `[ SCANNING ${Math.round(scanProgress)}% ]` :
                   scanState === 'analysis' ? '[ ANALYZING... ]' :
                   scanState === 'anomaly' ? '[ REVIEWING... ]' :
                   scanState === 'glitch' ? '[ !!! WARNING !!! ]' :
                   scanState === 'morphing' ? '[ MORPHING... ]' :
                   scanState === 'emergency' ? '[ !!! EMERGENCY !!! ]' :
                   scanState === 'empty' ? '[ SCAN NEXT SUBJECT ]' :
                   isAlienState ? '[ SCAN NEXT SUBJECT ]' :
                   '[ SCAN AGAIN ]'}
                </button>
              </div>
            </div>

            {/* Emergency alert */}
            {isEmergency && (
              <div className="ascii-border-bright" style={{ padding: '10px', fontFamily: FONT, animation: 'resultIn 0.3s ease' }}>
                <pre style={{ color: G, fontSize: 'clamp(7px,0.75vw,9px)', margin: 0, lineHeight: 1.5 }}>
{`!!! CRITICAL ALERT !!!
SPECIES UNKNOWN
BIOLOGICAL MISMATCH CONFIRMED
QUARANTINE RECOMMENDED`}
                </pre>
              </div>
            )}

            {/* Final message */}
            {scanState === 'final' && finalMessage && (
              <div className="ascii-border-bright" style={{ padding: '12px', fontFamily: FONT, textAlign: 'center', animation: 'resultIn 0.5s ease' }}>
                <div style={{ fontSize: 'clamp(9px,1vw,12px)', letterSpacing: '0.15em', color: G, lineHeight: 1.6 }}>
                  {finalMessage}
                </div>
              </div>
            )}

            {/* Rare event */}
            {scanState === 'empty' && (
              <div className="ascii-border" style={{ padding: '12px', fontFamily: FONT, textAlign: 'center', animation: 'resultIn 0.5s ease' }}>
                <pre style={{ color: G, fontSize: 'clamp(8px,0.85vw,10px)', margin: 0, lineHeight: 1.6 }}>
{`NO HUMAN DETECTED.
CHAMBER IS EMPTY.
CONTINUING SCAN...`}
                </pre>
              </div>
            )}

            {/* Final report */}
            {result && scanState === 'results' && (
              <div className="ascii-border" style={{ padding: '10px', fontFamily: FONT, animation: 'resultIn 0.5s ease' }}>
                <div style={{ color: DIM, fontSize: '8px', letterSpacing: '0.2em', marginBottom: '6px' }}>+-- FINAL DIAGNOSTIC REPORT --+</div>
                <div style={{ color: G, fontSize: 'clamp(8px,0.85vw,10px)', letterSpacing: '0.1em', lineHeight: 1.6 }}>
                  {result.finalReport}
                </div>
              </div>
            )}
          </div>

          {/* ── Right panel: Metrics ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontFamily: FONT, fontSize: 'clamp(8px,0.85vw,10px)' }}>

            {/* Diagnostic metrics */}
            <div className="ascii-border" style={{ padding: '10px' }}>
              <div style={{ color: DIM, marginBottom: '8px', letterSpacing: '0.2em' }}>+-- DIAGNOSTIC METRICS --+</div>
              {result ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {result.metrics.map((m, i) => (
                    <div key={m.id} style={{ animation: `resultIn 0.3s ease ${i * 0.05}s both` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: DIM, marginBottom: '2px' }}>
                        <span>{m.label}</span>
                      </div>
                      <div style={{ color: G, fontSize: 'clamp(7px,0.75vw,9px)' }}>
                        <AsciiBar value={m.value} width={16} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: DIMMER }}>
                  {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} style={{ marginBottom: '6px' }}>
                      <div style={{ color: DIMMER }}>---</div>
                      <div style={{ color: DIMMER, fontSize: '9px' }}>[░░░░░░░░░░░░░░░░]   0</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Vital waveform - ASCII */}
            <div className="ascii-border" style={{ padding: '10px' }}>
              <div style={{ color: DIM, marginBottom: '6px', letterSpacing: '0.2em' }}>+-- VITAL WAVEFORM --+</div>
              <pre style={{ color: DIM, fontSize: 'clamp(7px,0.75vw,9px)', margin: 0, lineHeight: 1.2 }}>
{scanState === 'idle'
  ? '_____________________________'
  : '___/\\___/\\__/\\___/\\___/\\____'}
              </pre>
            </div>

            {/* Certification */}
            <div className="ascii-border" style={{ padding: '10px' }}>
              <div style={{ color: DIM, marginBottom: '6px', letterSpacing: '0.2em' }}>+-- CERTIFICATION --+</div>
              <pre style={{ color: DIMMER, fontSize: 'clamp(7px,0.75vw,8px)', margin: 0, lineHeight: 1.6 }}>
{`HUMAN.EXE MKII
AUTHORIZED BIOLOGICAL
ANALYSIS ONLY.
RESULTS: INFORMATIONAL.
CALIBRATION: NOMINAL.
(C) HELLA.RICH / NODE_1956`}
              </pre>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
