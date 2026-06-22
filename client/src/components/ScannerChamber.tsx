/**
 * ScannerChamber — CSS-based scanner chamber
 *
 * No Three.js. No rotation. No 3D grid.
 * Just the figures, the scan beam, and the morph crossfade.
 *
 * Human outline fades out as alien fades in during morph.
 * Scan beam sweeps top→bottom during scanning state.
 * Floating particles via CSS animation.
 * Terminal green only.
 */
import { useEffect, useRef, useState } from 'react';
import type { ScanState } from './HumanScanner3D';

interface ScannerChamberProps {
  scanState: ScanState;
  scanProgress: number; // 0–100
  morphProgress: number; // 0–1
}

const GREEN = '#33ff33';
const GREEN_DIM = 'rgba(51,255,51,0.25)';

export function ScannerChamber({ scanState, scanProgress, morphProgress }: ScannerChamberProps) {
  const isScanning = scanState === 'scanning';
  const isGlitch = scanState === 'glitch';
  const isEmergency = ['emergency', 'final'].includes(scanState);
  const isAlienVisible = morphProgress > 0 || ['alien', 'emergency', 'final'].includes(scanState);

  // Human: fully visible when morphProgress=0, fades out as morph progresses
  const humanOpacity = morphProgress === 0 ? 1 : Math.max(0, 1 - morphProgress * 2);
  // Alien: fades in as morph passes 0.5, full opacity in alien/emergency/final states
  const alienOpacity = ['alien', 'emergency', 'final'].includes(scanState)
    ? 1
    : Math.max(0, morphProgress * 2 - 1);
  const finalAlienOpacity = alienOpacity;

  // Scan beam Y position as percentage
  const beamY = scanProgress;

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
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0.3; }
          33% { transform: translateY(-8px) translateX(4px) scale(1.1); opacity: 0.5; }
          66% { transform: translateY(-4px) translateX(-6px) scale(0.9); opacity: 0.25; }
          100% { transform: translateY(0) translateX(0) scale(1); opacity: 0.3; }
        }
        @keyframes glitchFlicker {
          0%,100% { opacity: 1; transform: translateX(0); }
          10% { opacity: 0.3; transform: translateX(-3px); }
          20% { opacity: 0.8; transform: translateX(3px); }
          30% { opacity: 0.2; transform: translateX(-2px); }
          40% { opacity: 0.9; transform: translateX(0); }
          50% { opacity: 0.1; transform: translateX(2px); }
          60% { opacity: 0.7; transform: translateX(-1px); }
        }
        @keyframes emergencyPulse {
          0%,100% { filter: brightness(1); }
          50% { filter: brightness(1.3) hue-rotate(10deg); }
        }
        .scanner-figure {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.3s ease;
        }
        .scanner-figure img {
          max-height: 90%;
          max-width: 80%;
          object-fit: contain;
          filter: drop-shadow(0 0 4px rgba(51,255,51,0.3));
        }
        .scanner-glitch .scanner-figure {
          animation: glitchFlicker 0.12s steps(1) infinite;
        }
        .scanner-emergency .scanner-figure {
          animation: emergencyPulse 0.8s ease infinite;
        }
        .scan-beam {
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          background: ${GREEN};
          box-shadow: 0 0 8px ${GREEN}, 0 0 20px rgba(51,255,51,0.4);
          pointer-events: none;
          transition: top 0.08s linear;
        }
        .scan-glow {
          position: absolute;
          left: 0;
          right: 0;
          height: 40px;
          background: linear-gradient(to bottom, transparent, rgba(51,255,51,0.06), transparent);
          pointer-events: none;
          transition: top 0.08s linear;
        }
        .particle {
          position: absolute;
          width: 4px;
          height: 4px;
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
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }
        .target-ring.active {
          opacity: 0.7;
          animation: targetSpin var(--spin-dur) linear infinite;
        }
        @keyframes targetSpin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>

      {/* Floating particles */}
      {Array.from({ length: 18 }, (_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${10 + (i * 73 % 80)}%`,
            top: `${5 + (i * 47 % 88)}%`,
            '--dur': `${2.5 + (i * 0.4 % 2.5)}s`,
            '--delay': `${(i * 0.3 % 2.5)}s`,
            width: `${3 + (i % 4)}px`,
            height: `${3 + (i % 4)}px`,
          } as React.CSSProperties}
        />
      ))}

      {/* Scanner figures container */}
      <div
        className={`${isGlitch ? 'scanner-glitch' : ''} ${isEmergency ? 'scanner-emergency' : ''}`}
        style={{ position: 'absolute', inset: 0 }}
      >
        {/* Human figure */}
        <div
          className="scanner-figure"
          style={{ opacity: humanOpacity }}
        >
          <img src="/human-outline.png" alt="HUMAN SUBJECT" />
        </div>

        {/* Alien figure */}
        {isAlienVisible && (
          <div
            className="scanner-figure"
            style={{ opacity: finalAlienOpacity }}
          >
            <img src="/alien-outline.png" alt="UNKNOWN LIFEFORM" />
          </div>
        )}
      </div>

      {/* Scan beam */}
      {isScanning && (
        <>
          <div
            className="scan-beam"
            style={{ top: `${beamY}%` }}
          />
          <div
            className="scan-glow"
            style={{ top: `calc(${beamY}% - 20px)` }}
          />
        </>
      )}

      {/* Target rings — analysis state */}
      {scanState === 'analysis' && (
        <>
          {/* Head ring */}
          <div
            className="target-ring active"
            style={{
              width: '60px',
              height: '60px',
              left: '50%',
              top: '12%',
              '--spin-dur': '2s',
            } as React.CSSProperties}
          />
          {/* Torso ring */}
          <div
            className="target-ring active"
            style={{
              width: '90px',
              height: '90px',
              left: '50%',
              top: '38%',
              '--spin-dur': '3s',
              animationDirection: 'reverse',
            } as React.CSSProperties}
          />
        </>
      )}

      {/* Emergency red flash overlay */}
      {isEmergency && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(51,255,51,0.03)',
          pointerEvents: 'none',
          animation: 'emergencyPulse 0.6s ease infinite',
        }} />
      )}
    </div>
  );
}
