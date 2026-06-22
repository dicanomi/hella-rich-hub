/**
 * HUMAN.EXE — hella.rich
 * Human Diagnostic Machine. NODE_1956.
 *
 * 4-Act cinematic experience:
 * ACT 1 — Human Analysis (scanner as hero, minimal UI)
 * ACT 2 — Anomaly Detection (machine confusion)
 * ACT 3 — Contact Event (alien reveal through scan beam)
 * ACT 4 — Reclassification (SUBJECT WAS NEVER HUMAN)
 *
 * Design: spacecraft diagnostic chamber × cultdeadcow terminal
 * Color: terminal green (#33ff33) only
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { HellaRichSEO } from '../components/HellaRichSEO';
import { ScannerChamber } from '../components/ScannerChamber';
import type { ScanState } from '../components/HumanScanner3D';
import { useHumanExeAudio } from '../hooks/useHumanExeAudio';

// ── Data ───────────────────────────────────────────────────────────────────
const METRICS = [
  { id: 'anxiety',        label: 'ANXIETY' },
  { id: 'thought_noise',  label: 'THOUGHT NOISE' },
  { id: 'focus',          label: 'FOCUS' },
  { id: 'social_battery', label: 'SOCIAL BATTERY' },
  { id: 'regret_cache',   label: 'REGRET CACHE' },
  { id: 'main_character', label: 'MAIN CHARACTER INDEX' },
  { id: 'vibe_integrity', label: 'VIBE INTEGRITY' },
  { id: 'dream_residue',  label: 'DREAM RESIDUE' },
  { id: 'caffeine',       label: 'CAFFEINE' },
  { id: 'snack_urgency',  label: 'SNACK URGENCY' },
  { id: 'existential',    label: 'EXISTENTIAL STATIC' },
  { id: 'impulse_ctrl',   label: 'IMPULSE CONTROL' },
];

const REPORTS = [
  'SUBJECT APPEARS STABLE. BIOLOGICAL PROFILE WITHIN EXPECTED RANGE.',
  'SUBJECT FUNCTIONAL. EMOTIONAL FIRMWARE SLIGHTLY OUTDATED.',
  'SUBJECT CONTAINS 14% UNRESOLVED WEATHER.',
  'BRAIN OPERATING WITH MINIMAL SUPERVISION. WITHIN TOLERANCE.',
  'SOUL DETECTED. PLEASE CONFIRM.',
  'SUBJECT IS MOSTLY WATER AND UNFINISHED TASKS.',
  'INTERNAL MONOLOGUE LOUDER THAN EXPECTED. NON-CRITICAL.',
  'PURPOSE NOT FOUND. CONTINUING ANYWAY. STATUS: NOMINAL.',
];

const SUBJECT_IDS = ['HMN-0042', 'HMN-1138', 'HMN-7734', 'HMN-2001', 'HMN-9999', 'HMN-0001', 'HMN-3141', 'HMN-6502'];

const ACT4_MESSAGES = [
  'RECHECKING PREVIOUS SCANS...',
  'RECHECKING PREVIOUS SCANS...',
  'MATCH FOUND',
  'YOU HAVE BEEN SCANNED BEFORE',
  'SIGNAL RECOGNIZED',
  'WELCOME BACK',
];

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateResult() {
  const count = rnd(6, 8);
  const pool = [...METRICS].sort(() => Math.random() - 0.5).slice(0, count);
  return {
    metrics: pool.map(m => ({ ...m, value: rnd(12, 97) })),
    report: REPORTS[Math.floor(Math.random() * REPORTS.length)],
    subjectId: SUBJECT_IDS[Math.floor(Math.random() * SUBJECT_IDS.length)],
  };
}

// ── ASCII bar ──────────────────────────────────────────────────────────────
function AsciiBar({ value, width = 18 }: { value: number; width?: number }) {
  const filled = Math.round(value / 100 * width);
  return (
    <span style={{ fontFamily: 'monospace', letterSpacing: 0 }}>
      [{'█'.repeat(filled)}{'░'.repeat(width - filled)}] {String(value).padStart(3)}
    </span>
  );
}

// ── Status ticker ──────────────────────────────────────────────────────────
function StatusTicker({ message, dim = false }: { message: string; dim?: boolean }) {
  return (
    <div style={{
      fontFamily: "'Courier New', monospace",
      fontSize: 'clamp(9px, 1vw, 11px)',
      letterSpacing: '0.15em',
      color: dim ? 'rgba(51,255,51,0.4)' : '#33ff33',
      lineHeight: 1.8,
    }}>
      {message}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function HumanExePage() {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scanProgress, setScanProgress] = useState(0);
  const [morphProgress, setMorphProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('SYSTEM READY');
  const [subStatusMsg, setSubStatusMsg] = useState('BIOLOGICAL ANALYSIS AVAILABLE');
  const [result, setResult] = useState<ReturnType<typeof generateResult> | null>(null);
  const [act4Msg, setAct4Msg] = useState('');
  const [climaxVisible, setClimaxVisible] = useState(false);
  const [isRare, setIsRare] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const scanRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const morphRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audio = useHumanExeAudio();

  const canStart = ['idle', 'alien', 'final', 'empty'].includes(scanState);

  // ── Reveal sequence ────────────────────────────────────────────────────
  const triggerReveal = useCallback(() => {
    // 1% rare: empty chamber
    if (Math.random() < 0.01) {
      setIsRare(true);
      setScanState('empty');
      setStatusMsg('NO HUMAN DETECTED');
      setSubStatusMsg('CHAMBER IS EMPTY');
      return;
    }

    // ACT 2: Anomaly
    setTimeout(() => {
      setScanState('anomaly');
      setStatusMsg('REVIEWING RESULTS...');
      setSubStatusMsg('VERIFYING BIOLOGICAL SIGNATURE...');
    }, 3000);

    setTimeout(() => setSubStatusMsg('PLEASE WAIT...'), 4200);
    setTimeout(() => setSubStatusMsg('CROSS-CHECKING DNA RECORDS...'), 5400);
    setTimeout(() => { setStatusMsg('DATABASE MISMATCH'); setSubStatusMsg('UNKNOWN SIGNATURE DETECTED'); }, 6400);
    setTimeout(() => setSubStatusMsg('RECHECKING RESULTS'), 7000);
    setTimeout(() => setSubStatusMsg('RECHECKING RESULTS'), 7600);
    setTimeout(() => setSubStatusMsg('RECHECKING RESULTS'), 8200);

    // ACT 3: Glitch + Contact
    setTimeout(() => {
      setScanState('glitch');
      setStatusMsg('WARNING');
      setSubStatusMsg('UNAUTHORIZED BIOLOGICAL STRUCTURE');
    }, 9000);
    setTimeout(() => setSubStatusMsg('SUBJECT DOES NOT MATCH HUMAN RECORDS'), 9600);
    setTimeout(() => setSubStatusMsg('SUBJECT DOES NOT MATCH ANY RECORDS'), 10400);
    setTimeout(() => setSubStatusMsg('SUBJECT SHOULD NOT EXIST'), 11200);

    // Morph: human fades out, alien fades in
    setTimeout(() => {
      setScanState('morphing');
      setStatusMsg('CONTACT EVENT DETECTED');
      setSubStatusMsg('UNKNOWN LIFEFORM IDENTIFIED');
      let mp = 0;
      if (morphRef.current) clearInterval(morphRef.current);
      morphRef.current = setInterval(() => {
        mp += 0.012;
        setMorphProgress(Math.min(mp, 1));
        if (mp >= 1) { clearInterval(morphRef.current!); morphRef.current = null; }
      }, 40);
    }, 12000);

    // Alien revealed
    setTimeout(() => {
      setScanState('alien');
      setStatusMsg('BIOLOGICAL CLASSIFICATION FAILURE');
      setSubStatusMsg('HUMAN CLASSIFICATION REVOKED');
    }, 17000);

    // Emergency
    setTimeout(() => {
      setScanState('emergency');
      setStatusMsg('DATABASE FAILURE');
      setSubStatusMsg('ORIGIN UNKNOWN — QUARANTINE RECOMMENDED');
    }, 18000);

    // CLIMAX: SUBJECT WAS NEVER HUMAN
    setTimeout(() => {
      setClimaxVisible(true);
      setStatusMsg('');
      setSubStatusMsg('');
    }, 20000);

    // Climax holds, then ACT 4
    setTimeout(() => {
      setClimaxVisible(false);
    }, 23000);

    setTimeout(() => {
      setScanState('final');
      setStatusMsg('RECHECKING PREVIOUS SCANS...');
      setSubStatusMsg('');
    }, 24000);

    // ACT 4 messages
    ACT4_MESSAGES.forEach((msg, i) => {
      setTimeout(() => {
        if (i < 3) setStatusMsg(msg);
        else setAct4Msg(msg);
      }, 25000 + i * 1200);
    });

    // Final stable state
    setTimeout(() => {
      setStatusMsg('SIGNAL RECOGNIZED');
      setSubStatusMsg('WELCOME BACK');
    }, 32000);

  }, []);

  // ── Start scan ─────────────────────────────────────────────────────────
  const startScan = useCallback(() => {
    if (!canStart) return;
    if (scanRef.current) clearInterval(scanRef.current);
    if (morphRef.current) { clearInterval(morphRef.current); morphRef.current = null; }

    setResult(null);
    setScanProgress(0);
    setMorphProgress(0);
    setAct4Msg('');
    setClimaxVisible(false);
    setIsRare(false);
    setShowResults(false);
    setScanState('powering');
    setStatusMsg('CALIBRATING SUBJECT');
    setSubStatusMsg('ESTABLISHING BIOLOGICAL PROFILE');
    audio.powerOn();

    setTimeout(() => {
      setScanState('scanning');
      setStatusMsg('SCANNING NEURAL STRUCTURE');
      setSubStatusMsg('ANALYZING ORGANIC SYSTEMS');
      audio.startScanHum();

      let y = 0;
      let lastClick = -8;
      let lastBeep = -15;
      scanRef.current = setInterval(() => {
        y += 1.2;
        setScanProgress(Math.min(y, 100));
        if (y - lastClick > 12 + Math.random() * 8) { audio.relayClick(); lastClick = y; }
        if (y - lastBeep > 18 + Math.random() * 12) { audio.beep(440 + Math.random() * 880, 0.06, 0.08); lastBeep = y; }

        if (y >= 100) {
          clearInterval(scanRef.current!);
          setScanState('analysis');
          setStatusMsg('VERIFYING HUMAN CLASSIFICATION');
          setSubStatusMsg('GENERATING REPORT');
          setTimeout(() => audio.targetLock(), 300);
          setTimeout(() => audio.targetLock(), 700);

          setTimeout(() => {
            const r = generateResult();
            setResult(r);
            setScanState('results');
            setStatusMsg('SUBJECT APPEARS STABLE.');
            setSubStatusMsg('BIOLOGICAL PROFILE WITHIN EXPECTED RANGE.');
            setShowResults(true);
            audio.scanComplete();
            triggerReveal();
          }, 2200);
        }
      }, 40);
    }, 900);
  }, [canStart, audio, triggerReveal]);

  useEffect(() => {
    return () => {
      if (scanRef.current) clearInterval(scanRef.current);
      if (morphRef.current) clearInterval(morphRef.current);
    };
  }, []);

  const G = '#33ff33';
  const DIM = 'rgba(51,255,51,0.35)';
  const DIMMER = 'rgba(51,255,51,0.15)';
  const BG = '#010601';
  const FONT = "'Courier New', 'Lucida Console', monospace";
  const isEmergency = ['emergency', 'final'].includes(scanState);

  const btnLabel =
    scanState === 'idle' ? '[ BEGIN SCAN ]' :
    scanState === 'powering' ? '[ POWERING UP... ]' :
    scanState === 'scanning' ? `[ SCANNING ${Math.round(scanProgress)}% ]` :
    scanState === 'analysis' ? '[ ANALYZING... ]' :
    ['anomaly','glitch','morphing','emergency'].includes(scanState) ? '[ PROCESSING... ]' :
    scanState === 'empty' ? '[ NEXT SUBJECT ]' :
    canStart ? '[ NEXT SUBJECT ]' :
    '[ PROCESSING... ]';

  return (
    <>
      <HellaRichSEO
        title="HUMAN.EXE — hella.rich"
        description="HUMAN.EXE. Human diagnostic machine. Biological analysis system. NODE_1956."
        keywords="human scanner, diagnostic machine, hella.rich, HUMAN.EXE, biological analysis"
      />
      <style>{`
        @keyframes cursorBlink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
        @keyframes resultIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes climaxIn { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
        @keyframes climaxOut { from{opacity:1} to{opacity:0} }
        @keyframes scannerGlow { 0%,100%{box-shadow:0 0 0 rgba(51,255,51,0)} 50%{box-shadow:0 0 20px rgba(51,255,51,0.08)} }
        .human-exe { font-family: ${FONT}; }
        .scan-btn:hover:not(:disabled) { background: rgba(51,255,51,0.08) !important; }
        .scan-btn:active:not(:disabled) { transform: scale(0.98); }
      `}</style>

      <div className="human-exe" style={{ minHeight: '100vh', background: BG, color: G, overflowX: 'hidden' }}>
        {/* CRT scanlines */}
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 200,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
        }} />

        {/* ── Header ── */}
        <header style={{
          padding: 'clamp(52px,8vh,68px) clamp(16px,3vw,24px) clamp(8px,1.5vh,12px)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          borderBottom: `1px solid ${DIMMER}`,
        }}>
          <div>
            <div style={{ fontSize: 'clamp(11px,1.2vw,14px)', letterSpacing: '0.3em' }}>HUMAN.EXE</div>
            <div style={{ fontSize: 'clamp(8px,0.8vw,9px)', color: DIM, letterSpacing: '0.15em' }}>HUMAN DIAGNOSTIC MACHINE</div>
          </div>
          <div style={{ display: 'flex', gap: '20px', fontSize: 'clamp(7px,0.75vw,9px)', color: DIM, letterSpacing: '0.12em', textAlign: 'right' }}>
            <div><div style={{ color: DIMMER }}>NODE</div><div>NODE_1956</div></div>
            <div><div style={{ color: DIMMER }}>STATUS</div><div style={{ color: isEmergency ? G : DIM }}>{isEmergency ? '!!! ALERT !!!' : scanState === 'idle' ? 'STANDBY' : 'ACTIVE'}</div></div>
          </div>
        </header>

        {/* ── Main layout ── */}
        <main style={{
          display: 'grid',
          gridTemplateColumns: showResults ? '1fr clamp(200px,32vw,320px) 1fr' : '1fr clamp(240px,40vw,420px) 1fr',
          gap: 'clamp(8px,1.5vw,16px)',
          padding: 'clamp(10px,1.5vh,16px) clamp(16px,3vw,24px)',
          minHeight: 'calc(100vh - 120px)',
          alignItems: 'start',
          transition: 'grid-template-columns 0.5s ease',
        }}>

          {/* ── Left: status messages ── */}
          <div style={{ paddingTop: '8px', fontFamily: FONT }}>
            {/* Status messages */}
            <div style={{ marginBottom: '16px' }}>
              {statusMsg && <StatusTicker message={statusMsg} />}
              {subStatusMsg && <StatusTicker message={subStatusMsg} dim />}
              {act4Msg && (
                <div style={{
                  fontSize: 'clamp(10px,1.1vw,13px)',
                  letterSpacing: '0.2em',
                  color: G,
                  marginTop: '8px',
                  animation: 'resultIn 0.4s ease',
                }}>
                  {act4Msg}
                </div>
              )}
            </div>

            {/* System log — only show during scan */}
            {['scanning', 'analysis', 'anomaly', 'glitch', 'morphing'].includes(scanState) && (
              <div style={{
                fontSize: 'clamp(8px,0.8vw,9px)',
                color: DIMMER,
                letterSpacing: '0.1em',
                lineHeight: 1.8,
              }}>
                <div>&gt; NODE_1956 ACTIVE</div>
                <div>&gt; BIOLOGICAL SCAN IN PROGRESS</div>
                {scanState === 'scanning' && <div>&gt; SCAN {Math.round(scanProgress)}% COMPLETE</div>}
                {scanState === 'analysis' && <div>&gt; RUNNING FINAL ANALYSIS...</div>}
                {scanState === 'anomaly' && <div>&gt; ANOMALY DETECTED</div>}
                {scanState === 'glitch' && <div>&gt; !!! SYSTEM INSTABILITY !!!</div>}
                {scanState === 'morphing' && <div>&gt; CONTACT EVENT IN PROGRESS</div>}
              </div>
            )}

            {/* Results — human metrics */}
            {showResults && result && (
              <div style={{ animation: 'resultIn 0.5s ease', marginTop: '8px' }}>
                <div style={{ fontSize: '8px', color: DIM, letterSpacing: '0.2em', marginBottom: '10px' }}>
                  +-- DIAGNOSTIC METRICS --+
                </div>
                {result.metrics.map((m, i) => (
                  <div key={m.id} style={{
                    marginBottom: '6px',
                    animation: `resultIn 0.3s ease ${i * 0.04}s both`,
                  }}>
                    <div style={{ fontSize: '7px', color: DIMMER, letterSpacing: '0.1em', marginBottom: '2px' }}>{m.label}</div>
                    <div style={{ fontSize: 'clamp(7px,0.75vw,9px)', color: DIM }}>
                      <AsciiBar value={m.value} width={14} />
                    </div>
                  </div>
                ))}
                <div style={{
                  marginTop: '12px',
                  fontSize: '8px',
                  color: DIM,
                  letterSpacing: '0.1em',
                  lineHeight: 1.7,
                  borderTop: `1px solid ${DIMMER}`,
                  paddingTop: '8px',
                }}>
                  {result.report}
                </div>
              </div>
            )}
          </div>

          {/* ── Center: Scanner chamber (HERO) ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

            {/* Chamber */}
            <div style={{
              position: 'relative',
              border: `1px solid ${isEmergency ? G : DIMMER}`,
              background: '#010601',
              animation: isEmergency ? 'scannerGlow 0.6s ease infinite' : 'none',
            }}>
              {/* Corner markers */}
              {[['0','0'],['0','auto'],['auto','0'],['auto','auto']].map(([t,b], i) => (
                <div key={i} style={{
                  position: 'absolute',
                  top: t === '0' ? 0 : 'auto',
                  bottom: b === 'auto' ? 0 : 'auto',
                  left: i < 2 ? 0 : 'auto',
                  right: i >= 2 ? 0 : 'auto',
                  color: G, fontSize: '10px', lineHeight: 1, padding: '2px',
                }}>+</div>
              ))}

              {/* Subject ID */}
              <div style={{
                textAlign: 'center',
                fontSize: '8px',
                color: DIM,
                letterSpacing: '0.2em',
                padding: '6px 0 4px',
                fontFamily: FONT,
              }}>
                SUBJECT: {result?.subjectId || '---'}
              </div>

              {/* Scanner */}
              <div style={{ height: 'clamp(320px,55vw,520px)', position: 'relative' }}>
                <ScannerChamber
                  scanState={scanState}
                  scanProgress={scanProgress}
                  morphProgress={morphProgress}
                />
              </div>

              {/* Scan progress bar */}
              {scanState === 'scanning' && (
                <div style={{ height: '2px', background: DIMMER }}>
                  <div style={{ height: '100%', background: G, width: `${scanProgress}%`, transition: 'width 0.1s linear' }} />
                </div>
              )}

              {/* Scan button */}
              <div style={{ padding: '8px' }}>
                <button
                  className="scan-btn"
                  onClick={startScan}
                  disabled={!canStart}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: `1px solid ${canStart ? G : DIMMER}`,
                    color: canStart ? G : DIMMER,
                    fontFamily: FONT,
                    fontSize: 'clamp(9px,0.9vw,11px)',
                    letterSpacing: '0.3em',
                    padding: '10px',
                    cursor: canStart ? 'pointer' : 'not-allowed',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {btnLabel}
                </button>
              </div>
            </div>

            {/* Rare event */}
            {isRare && (
              <div style={{
                border: `1px solid ${G}`,
                padding: '14px',
                textAlign: 'center',
                fontFamily: FONT,
                animation: 'resultIn 0.5s ease',
              }}>
                <div style={{ fontSize: 'clamp(9px,1vw,11px)', letterSpacing: '0.2em', lineHeight: 1.8 }}>
                  NO HUMAN DETECTED.<br />
                  <span style={{ color: DIM }}>SUBJECT NOT PRESENT.</span>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: machine info ── */}
          <div style={{ paddingTop: '8px', fontFamily: FONT, fontSize: 'clamp(8px,0.8vw,9px)' }}>
            <div style={{ color: DIM, marginBottom: '8px', letterSpacing: '0.15em' }}>
              +-- MACHINE SPECIFICATIONS --+
            </div>
            {[
              ['SCAN MODE', 'HUMAN'],
              ['CALIBRATION', 'NOMINAL'],
              ['CERTIFICATION', 'CLASSIFIED'],
              ['FIRMWARE', 'v4.2.0-BETA'],
              ['UPTIME', '...'],
            ].map(([k, v]) => (
              <div key={k} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '3px 0',
                borderBottom: `1px solid ${DIMMER}`,
                color: DIMMER,
              }}>
                <span>{k}</span><span style={{ color: DIM }}>{v}</span>
              </div>
            ))}

            {/* Certification */}
            <div style={{ marginTop: '16px', color: DIMMER, lineHeight: 1.8 }}>
              <div style={{ color: DIM, marginBottom: '4px' }}>+-- CERTIFICATION --+</div>
              <div>HUMAN.EXE MKII</div>
              <div>AUTHORIZED BIOLOGICAL</div>
              <div>ANALYSIS ONLY.</div>
              <div>CALIBRATION: NOMINAL.</div>
              <div style={{ marginTop: '8px', color: DIMMER }}>
                {`(C) HELLA.RICH / NODE_1956`}
              </div>
            </div>
          </div>
        </main>

        {/* ── CLIMAX OVERLAY: SUBJECT WAS NEVER HUMAN ── */}
        {climaxVisible && (
          <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(1,6,1,0.96)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 500,
            animation: 'climaxIn 0.5s ease',
          }}>
            <div style={{
              fontFamily: FONT,
              fontSize: 'clamp(18px,3.5vw,42px)',
              letterSpacing: '0.2em',
              color: G,
              textAlign: 'center',
              lineHeight: 1.4,
            }}>
              SUBJECT WAS NEVER HUMAN
            </div>
          </div>
        )}
      </div>
    </>
  );
}
