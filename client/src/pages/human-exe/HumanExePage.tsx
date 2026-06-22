/**
 * HUMAN.EXE — hella.rich
 * Human Diagnostic Machine. NODE_1956.
 *
 * ACT 1 — HUMAN DETECTED: scanner fills screen, human rotates, BEGIN SCAN
 * ACT 2 — BIOLOGICAL SCAN: beam sweeps, alien revealed above beam
 * ACT 3 — ALERT: scan complete, WARNING, red flash, machine panic
 * ACT 4 — RECOGNITION: silence, IDENTITY VERIFIED, WELCOME BACK, ENGAGE button
 * ACT 5 — CONTACT EVENT: arcade game
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { HellaRichSEO } from '../../components/HellaRichSEO';
import { ScannerChamber } from '../../components/human-exe/ScannerChamber';
import { ContactEventArcade } from '../../components/human-exe/ContactEventArcade';
import type { ScanState } from '../../components/human-exe/ScannerChamber';
import { useHumanExeAudio } from '../../hooks/human-exe/useHumanExeAudio';

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

function AsciiBar({ value, width = 16 }: { value: number; width?: number }) {
  const filled = Math.round(value / 100 * width);
  return (
    <span style={{ fontFamily: 'monospace', letterSpacing: 0 }}>
      [{'█'.repeat(filled)}{'░'.repeat(width - filled)}] {String(value).padStart(3)}
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function HumanExePage() {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scanProgress, setScanProgress] = useState(0);
  const [morphProgress, setMorphProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('SUBJECT DETECTED');
  const [subStatusMsg, setSubStatusMsg] = useState('READY FOR ANALYSIS');
  const [result, setResult] = useState<ReturnType<typeof generateResult> | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showEngage, setShowEngage] = useState(false);
  const [showArcade, setShowArcade] = useState(false);
  const [isRare, setIsRare] = useState(false);
  const [alertActive, setAlertActive] = useState(false);

  const scanRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const contactEventPlayed = useRef(false);
  const audio = useHumanExeAudio();

  const canStart = ['idle', 'alien', 'final', 'empty'].includes(scanState);

  // ── Scan ───────────────────────────────────────────────────────────────
  const startScan = useCallback(() => {
    if (!canStart) return;
    if (scanRef.current) clearInterval(scanRef.current);

    setResult(null);
    setScanProgress(0);
    setMorphProgress(0);
    setShowResults(false);
    setShowEngage(false);
    setIsRare(false);
    setAlertActive(false);
    contactEventPlayed.current = false;
    setScanState('powering');
    setStatusMsg('CALIBRATING SUBJECT');
    setSubStatusMsg('ESTABLISHING BIOLOGICAL PROFILE');
    audio.powerOn();

    setTimeout(() => {
      setScanState('scanning');
      setStatusMsg('SCANNING NEURAL STRUCTURE');
      setSubStatusMsg('VERIFYING HUMAN CLASSIFICATION');
      audio.startScanHum();

      let y = 0;
      let lastClick = -8;
      scanRef.current = setInterval(() => {
        y += 0.8; // slower scan — more dramatic
        setScanProgress(Math.min(y, 100));

        if (y - lastClick > 14 + Math.random() * 8) {
          audio.relayClick();
          lastClick = y;
        }

        if (y >= 100) {
          clearInterval(scanRef.current!);

          // ACT 2 complete — generate results
          const r = generateResult();
          setResult(r);
          setShowResults(true);
          setScanState('results');
          setStatusMsg('SUBJECT APPEARS STABLE');
          setSubStatusMsg('BIOLOGICAL PROFILE WITHIN EXPECTED RANGE');
          audio.scanComplete();

          // ACT 3 — Contact event audio (0.5s after results, once only)
          setTimeout(() => {
            if (!contactEventPlayed.current) {
              contactEventPlayed.current = true;
              audio.contactEvent();
            }
          }, 500);

          // ALERT after 4.5s (lets contact event audio finish first)
          setTimeout(() => {
            setAlertActive(true);
            setScanState('emergency');
            setStatusMsg('WARNING');
            setSubStatusMsg('UNAUTHORIZED LIFEFORM DETECTED');
            audio.targetLock();
            setTimeout(() => audio.targetLock(), 400);
          }, 4500);

          setTimeout(() => setSubStatusMsg('CONTACT EVENT DETECTED'), 4200);
          setTimeout(() => setSubStatusMsg('BIOLOGICAL CLASSIFICATION FAILURE'), 5400);

          // ACT 4 — RECOGNITION: silence
          setTimeout(() => {
            setAlertActive(false);
            setScanState('final');
            setStatusMsg('IDENTITY VERIFIED');
            setSubStatusMsg('WELCOME BACK');
          }, 7000);

          // Show ENGAGE button
          setTimeout(() => {
            setShowEngage(true);
            setSubStatusMsg('TERMINAL DEFENSE SYSTEM AVAILABLE');
          }, 9000);
        }
      }, 40);
    }, 900);
  }, [canStart, audio]);

  useEffect(() => {
    return () => { if (scanRef.current) clearInterval(scanRef.current); };
  }, []);

  const G = '#33ff33';
  const DIM = 'rgba(51,255,51,0.35)';
  const DIMMER = 'rgba(51,255,51,0.15)';
  const BG = '#010601';
  const FONT = "'Courier New', 'Lucida Console', monospace";
  const isEmergency = scanState === 'emergency';

  const btnLabel =
    scanState === 'idle' ? '[ BEGIN SCAN ]' :
    scanState === 'powering' ? '[ POWERING UP... ]' :
    scanState === 'scanning' ? `[ SCANNING ${Math.round(scanProgress)}% ]` :
    scanState === 'analysis' ? '[ ANALYZING... ]' :
    scanState === 'results' ? '[ PROCESSING... ]' :
    scanState === 'emergency' ? '[ WARNING ]' :
    canStart ? '[ SCAN NEXT SUBJECT ]' :
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
        @keyframes alertFlash { 0%,100%{background:rgba(1,6,1,0)} 50%{background:rgba(51,255,51,0.04)} }
        @keyframes alertShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-3px)} 40%{transform:translateX(3px)} 60%{transform:translateX(-2px)} 80%{transform:translateX(2px)} }
        @keyframes engageIn { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
        .human-exe { font-family: ${FONT}; }
        .alert-active { animation: alertFlash 0.5s ease infinite, alertShake 0.15s steps(1) infinite; }
        .scan-btn:hover:not(:disabled) { background: rgba(51,255,51,0.08) !important; }
      `}</style>

      <div className={`human-exe${alertActive ? ' alert-active' : ''}`} style={{ minHeight: '100vh', background: BG, color: G, overflowX: 'hidden' }}>
        {/* CRT scanlines */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 200, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)' }} />

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
            <div><div style={{ color: DIMMER }}>STATUS</div>
              <div style={{ color: isEmergency ? G : DIM }}>
                {isEmergency ? '!!! ALERT !!!' : scanState === 'idle' ? 'STANDBY' : 'ACTIVE'}
              </div>
            </div>
          </div>
        </header>

        {/* ── Main layout ── */}
        <main style={{
          display: 'grid',
          gridTemplateColumns: showResults ? '1fr clamp(200px,32vw,320px) 1fr' : '1fr clamp(240px,42vw,440px) 1fr',
          gap: 'clamp(8px,1.5vw,16px)',
          padding: 'clamp(10px,1.5vh,16px) clamp(16px,3vw,24px)',
          minHeight: 'calc(100vh - 120px)',
          alignItems: 'start',
          transition: 'grid-template-columns 0.5s ease',
        }}>

          {/* ── Left: status ── */}
          <div style={{ paddingTop: '8px', fontFamily: FONT }}>
            <div style={{ marginBottom: '16px' }}>
              {statusMsg && (
                <div style={{ fontSize: 'clamp(9px,1vw,11px)', letterSpacing: '0.15em', color: isEmergency ? G : G, lineHeight: 1.8 }}>
                  {statusMsg}
                </div>
              )}
              {subStatusMsg && (
                <div style={{ fontSize: 'clamp(8px,0.85vw,10px)', letterSpacing: '0.12em', color: DIM, lineHeight: 1.8 }}>
                  {subStatusMsg}
                </div>
              )}
            </div>

            {/* Scan log */}
            {['scanning', 'analysis'].includes(scanState) && (
              <div style={{ fontSize: '8px', color: DIMMER, letterSpacing: '0.1em', lineHeight: 2 }}>
                <div>&gt; NODE_1956 ACTIVE</div>
                <div>&gt; BIOLOGICAL SCAN IN PROGRESS</div>
                <div>&gt; SCAN {Math.round(scanProgress)}% COMPLETE</div>
              </div>
            )}

            {/* Results metrics */}
            {showResults && result && (
              <div style={{ animation: 'resultIn 0.5s ease', marginTop: '8px' }}>
                <div style={{ fontSize: '8px', color: DIM, letterSpacing: '0.2em', marginBottom: '10px' }}>
                  +-- DIAGNOSTIC METRICS --+
                </div>
                {result.metrics.map((m, i) => (
                  <div key={m.id} style={{ marginBottom: '6px', animation: `resultIn 0.3s ease ${i * 0.04}s both` }}>
                    <div style={{ fontSize: '7px', color: DIMMER, letterSpacing: '0.1em', marginBottom: '2px' }}>{m.label}</div>
                    <div style={{ fontSize: 'clamp(7px,0.75vw,9px)', color: DIM }}><AsciiBar value={m.value} /></div>
                  </div>
                ))}
                <div style={{ marginTop: '12px', fontSize: '8px', color: DIM, letterSpacing: '0.1em', lineHeight: 1.7, borderTop: `1px solid ${DIMMER}`, paddingTop: '8px' }}>
                  {result.report}
                </div>
              </div>
            )}
          </div>

          {/* ── Center: Scanner chamber ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{
              position: 'relative',
              border: `1px solid ${isEmergency ? G : DIMMER}`,
              background: '#010601',
              transition: 'border-color 0.3s ease',
            }}>
              {/* Corner markers */}
              {(['top-left','top-right','bottom-left','bottom-right'] as const).map((pos) => (
                <div key={pos} style={{
                  position: 'absolute',
                  top: pos.includes('top') ? 0 : 'auto',
                  bottom: pos.includes('bottom') ? 0 : 'auto',
                  left: pos.includes('left') ? 0 : 'auto',
                  right: pos.includes('right') ? 0 : 'auto',
                  color: G, fontSize: '10px', lineHeight: 1, padding: '2px',
                }}>+</div>
              ))}

              {/* Subject ID */}
              <div style={{ textAlign: 'center', fontSize: '8px', color: DIM, letterSpacing: '0.2em', padding: '6px 0 4px', fontFamily: FONT }}>
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
                  <div style={{ height: '100%', background: G, width: `${scanProgress}%`, transition: 'width 0.08s linear' }} />
                </div>
              )}

              {/* Scan / action button */}
              <div style={{ padding: '8px' }}>
                {/* ENGAGE button — shown after recognition */}
                {showEngage && (
                  <button
                    onClick={() => setShowArcade(true)}
                    style={{
                      width: '100%',
                      background: 'rgba(51,255,51,0.06)',
                      border: `1px solid ${G}`,
                      color: G,
                      fontFamily: FONT,
                      fontSize: 'clamp(10px,1vw,13px)',
                      letterSpacing: '0.35em',
                      padding: '12px',
                      cursor: 'pointer',
                      marginBottom: '6px',
                      animation: 'engageIn 0.4s ease',
                    }}
                  >
                    [ ENGAGE ]
                  </button>
                )}

                {/* Main scan button */}
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
              <div style={{ border: `1px solid ${G}`, padding: '14px', textAlign: 'center', fontFamily: FONT, animation: 'resultIn 0.5s ease' }}>
                <div style={{ fontSize: 'clamp(9px,1vw,11px)', letterSpacing: '0.2em', lineHeight: 1.8 }}>
                  NO HUMAN DETECTED.<br /><span style={{ color: DIM }}>SUBJECT NOT PRESENT.</span>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: machine info ── */}
          <div style={{ paddingTop: '8px', fontFamily: FONT, fontSize: 'clamp(8px,0.8vw,9px)' }}>
            <div style={{ color: DIM, marginBottom: '8px', letterSpacing: '0.15em' }}>+-- MACHINE SPECIFICATIONS --+</div>
            {[
              ['SCAN MODE', 'HUMAN'],
              ['CALIBRATION', 'NOMINAL'],
              ['CERTIFICATION', 'CLASSIFIED'],
              ['FIRMWARE', 'v4.2.0-BETA'],
              ['UPTIME', '...'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: `1px solid ${DIMMER}`, color: DIMMER }}>
                <span>{k}</span><span style={{ color: DIM }}>{v}</span>
              </div>
            ))}
            <div style={{ marginTop: '16px', color: DIMMER, lineHeight: 1.8 }}>
              <div style={{ color: DIM, marginBottom: '4px' }}>+-- CERTIFICATION --+</div>
              <div>HUMAN.EXE MKII</div>
              <div>AUTHORIZED BIOLOGICAL</div>
              <div>ANALYSIS ONLY.</div>
              <div>CALIBRATION: NOMINAL.</div>
              <div style={{ marginTop: '8px', color: DIMMER }}>{`(C) HELLA.RICH / NODE_1956`}</div>
            </div>
          </div>
        </main>

        {/* ── ARCADE ── */}
        {showArcade && (
          <ContactEventArcade
            onComplete={() => {
              setShowArcade(false);
              setScanState('final');
              setStatusMsg('CONTACT COMPLETE');
              setSubStatusMsg('CLASSIFICATION UPDATED — WELCOME BACK');
              setShowEngage(false);
            }}
            onExit={() => setShowArcade(false)}
          />
        )}
      </div>
    </>
  );
}
