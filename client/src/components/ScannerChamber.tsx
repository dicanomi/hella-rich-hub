/**
 * ScannerChamber — CSS-based scanner chamber
 *
 * The scan beam REVEALS the alien as it passes — below the beam the alien
 * is visible, above the beam the human is visible. This creates the effect
 * of the machine "discovering" the alien through the scan.
 *
 * Morph sequence (triggered after scan):
 * - Human visible at rest
 * - Scan beam sweeps: alien revealed below beam
 * - After scan: brief flashes of alien, then full morph
 * - Alien fully revealed in alien/emergency/final states
 *
 * Terminal green only. No rotation. No 3D.
 */
import type { ScanState } from './HumanScanner3D';

interface ScannerChamberProps {
  scanState: ScanState;
  scanProgress: number; // 0–100
  morphProgress: number; // 0–1
}

const GREEN = '#33ff33';

export function ScannerChamber({ scanState, scanProgress, morphProgress }: ScannerChamberProps) {
  const isScanning = scanState === 'scanning';
  const isGlitch = scanState === 'glitch';
  const isEmergency = ['emergency', 'final'].includes(scanState);
  const isAlienState = ['alien', 'emergency', 'final'].includes(scanState);
  const isMorphing = scanState === 'morphing';

  // During scan: alien is revealed below the beam line
  // beamY is 0–100 (top to bottom percentage)
  const beamY = scanProgress;

  // Human opacity
  const humanOpacity = isAlienState ? 0
    : isMorphing ? Math.max(0, 1 - morphProgress * 2)
    : 1;

  // Alien opacity
  const alienOpacity = isAlienState ? 1
    : isMorphing ? Math.max(0, morphProgress * 2 - 1)
    : 0;

  // Show alien layer during scan (revealed below beam) and morph states
  const showAlienLayer = isScanning || isMorphing || isAlienState || scanState === 'glitch' || scanState === 'anomaly';

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      background: '#010601',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <style>{`
        @keyframes particleFloat {
          0%   { transform: translateY(0) translateX(0) scale(1); opacity: 0.3; }
          33%  { transform: translateY(-8px) translateX(4px) scale(1.1); opacity: 0.5; }
          66%  { transform: translateY(-4px) translateX(-6px) scale(0.9); opacity: 0.25; }
          100% { transform: translateY(0) translateX(0) scale(1); opacity: 0.3; }
        }
        @keyframes glitchFlicker {
          0%,100% { opacity: 1; transform: translateX(0); filter: none; }
          10%  { opacity: 0.3; transform: translateX(-4px); filter: hue-rotate(30deg); }
          20%  { opacity: 0.8; transform: translateX(4px); }
          30%  { opacity: 0.2; transform: translateX(-2px); filter: hue-rotate(-20deg); }
          50%  { opacity: 0.7; transform: translateX(2px); }
          70%  { opacity: 0.4; transform: translateX(-1px); filter: brightness(1.5); }
        }
        @keyframes emergencyPulse {
          0%,100% { filter: brightness(1); }
          50%     { filter: brightness(1.25); }
        }
        @keyframes targetSpin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to   { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .scanner-figure {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
        .scanner-figure img {
          max-height: 88%;
          max-width: 72%;
          object-fit: contain;
          filter: drop-shadow(0 0 6px rgba(51,255,51,0.35));
        }
        .particle {
          position: absolute;
          border-radius: 50%;
          background: ${GREEN};
          opacity: 0.3;
          animation: particleFloat var(--dur) ease-in-out infinite;
          animation-delay: var(--delay);
        }
        .target-ring {
          position: absolute;
          border: 1px solid ${GREEN};
          border-radius: 50%;
          pointer-events: none;
        }
      `}</style>

      {/* Floating particles */}
      {Array.from({ length: 16 }, (_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${8 + (i * 73 % 84)}%`,
            top: `${4 + (i * 47 % 90)}%`,
            '--dur': `${2.5 + (i * 0.4 % 2.5)}s`,
            '--delay': `${(i * 0.3 % 2.5)}s`,
            width: `${3 + (i % 4)}px`,
            height: `${3 + (i % 4)}px`,
          } as React.CSSProperties}
        />
      ))}

      {/* ── HUMAN figure ── */}
      <div
        className="scanner-figure"
        style={{
          opacity: humanOpacity,
          transition: isMorphing ? 'opacity 0.3s ease' : 'none',
          animation: isGlitch ? 'glitchFlicker 0.12s steps(1) infinite' : 'none',
        }}
      >
        <img src="/human-outline.png" alt="HUMAN SUBJECT" />
      </div>

      {/* ── ALIEN figure — revealed below scan beam during scan ── */}
      {showAlienLayer && (
        <div
          className="scanner-figure"
          style={{
            opacity: isAlienState ? alienOpacity
              : isMorphing ? alienOpacity
              : 1, // during scan, clipping mask handles visibility
            transition: isMorphing ? 'opacity 0.3s ease' : 'none',
            animation: isEmergency ? 'emergencyPulse 0.7s ease infinite' : 'none',
            // During scan: clip to only show alien below the beam
            clipPath: isScanning
              ? `inset(${beamY}% 0 0 0)`
              : 'none',
          }}
        >
          <img src="/alien-outline.png" alt="UNKNOWN LIFEFORM" />
        </div>
      )}

      {/* ── Scan beam ── */}
      {isScanning && (
        <>
          {/* Bright beam line */}
          <div style={{
            position: 'absolute',
            left: 0, right: 0,
            top: `${beamY}%`,
            height: '2px',
            background: GREEN,
            boxShadow: `0 0 10px ${GREEN}, 0 0 24px rgba(51,255,51,0.5)`,
            pointerEvents: 'none',
            zIndex: 10,
          }} />
          {/* Glow above beam */}
          <div style={{
            position: 'absolute',
            left: 0, right: 0,
            top: `calc(${beamY}% - 30px)`,
            height: '30px',
            background: 'linear-gradient(to bottom, transparent, rgba(51,255,51,0.08))',
            pointerEvents: 'none',
            zIndex: 9,
          }} />
        </>
      )}

      {/* ── Target rings — analysis state ── */}
      {scanState === 'analysis' && (
        <>
          <div style={{
            position: 'absolute',
            width: '70px', height: '70px',
            left: '50%', top: '14%',
            border: `1px solid ${GREEN}`,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'targetSpin 2s linear infinite',
            opacity: 0.7,
          }} />
          <div style={{
            position: 'absolute',
            width: '100px', height: '100px',
            left: '50%', top: '40%',
            border: `1px solid ${GREEN}`,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'targetSpin 3s linear infinite reverse',
            opacity: 0.5,
          }} />
        </>
      )}

      {/* ── Emergency overlay ── */}
      {isEmergency && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(51,255,51,0.02)',
          pointerEvents: 'none',
          animation: 'emergencyPulse 0.5s ease infinite',
        }} />
      )}
    </div>
  );
}
