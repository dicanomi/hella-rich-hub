/**
 * LOW BATTERY — Fly Canvas Component
 * Design: Braun + Teenage Engineering industrial restraint
 * Renders the fly, splat stains, and click interaction
 */

import { useCallback } from 'react';
import type { FlyState } from '../hooks/useFlySystem';

interface SplatMark {
  id: number;
  x: number;
  y: number;
}

interface FlyCanvasProps {
  fly: FlyState | null;
  splats: SplatMark[];
  onFlyClick: () => void;
}

function FlyIcon({ rotation, scale, opacity, phase }: {
  rotation: number;
  scale: number;
  opacity: number;
  phase: FlyState['phase'];
}) {
  const isSplatted = phase === 'splatted';

  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      style={{
        opacity,
        transform: `rotate(${rotation}deg) scale(${isSplatted ? 1.6 : scale})`,
        transition: isSplatted ? 'transform 0.15s ease-out, opacity 0.5s ease' : 'none',
        filter: isSplatted ? 'blur(1px)' : 'none',
      }}
    >
      {/* Body */}
      <ellipse cx="12" cy="13" rx="3.5" ry="4.5"
        fill={isSplatted ? 'rgba(60,40,20,0.9)' : 'rgba(30,25,20,0.95)'} />
      {/* Left wing */}
      <ellipse cx="6.5" cy="10" rx="5.5" ry="2.8"
        fill={isSplatted ? 'rgba(60,40,20,0.5)' : 'rgba(200,195,185,0.55)'}
        transform="rotate(-15 6.5 10)" />
      {/* Right wing */}
      <ellipse cx="17.5" cy="10" rx="5.5" ry="2.8"
        fill={isSplatted ? 'rgba(60,40,20,0.5)' : 'rgba(200,195,185,0.55)'}
        transform="rotate(15 17.5 10)" />
      {/* Head */}
      <circle cx="12" cy="8.5" r="2.5"
        fill={isSplatted ? 'rgba(60,40,20,0.9)' : 'rgba(30,25,20,0.95)'} />
      {/* Eyes */}
      {!isSplatted && (
        <>
          <circle cx="10.8" cy="7.8" r="0.7" fill="rgba(180,30,10,0.9)" />
          <circle cx="13.2" cy="7.8" r="0.7" fill="rgba(180,30,10,0.9)" />
        </>
      )}
      {/* Legs */}
      {!isSplatted && (
        <>
          <line x1="9" y1="13" x2="6" y2="15" stroke="rgba(30,25,20,0.7)" strokeWidth="0.8" />
          <line x1="9" y1="14" x2="6" y2="17" stroke="rgba(30,25,20,0.7)" strokeWidth="0.8" />
          <line x1="15" y1="13" x2="18" y2="15" stroke="rgba(30,25,20,0.7)" strokeWidth="0.8" />
          <line x1="15" y1="14" x2="18" y2="17" stroke="rgba(30,25,20,0.7)" strokeWidth="0.8" />
        </>
      )}
    </svg>
  );
}

function SplatStain({ x, y }: { x: number; y: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: x - 8,
        top: y - 8,
        width: 16,
        height: 16,
        pointerEvents: 'none',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <ellipse cx="8" cy="8" rx="5" ry="4" fill="rgba(40,30,20,0.35)" />
        <ellipse cx="8" cy="8" rx="2.5" ry="2" fill="rgba(40,30,20,0.5)" />
        {/* Splat particles */}
        <circle cx="3" cy="5" r="1" fill="rgba(40,30,20,0.3)" />
        <circle cx="13" cy="6" r="0.8" fill="rgba(40,30,20,0.25)" />
        <circle cx="5" cy="13" r="0.7" fill="rgba(40,30,20,0.2)" />
        <circle cx="12" cy="12" r="1" fill="rgba(40,30,20,0.25)" />
        <circle cx="2" cy="10" r="0.6" fill="rgba(40,30,20,0.2)" />
      </svg>
    </div>
  );
}

export function FlyCanvas({ fly, splats, onFlyClick }: FlyCanvasProps) {
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!fly || fly.phase === 'splatted' || fly.phase === 'dead') return;
    e.stopPropagation();
    onFlyClick();
  }, [fly, onFlyClick]);

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
      {/* Splat stains */}
      {splats.map(splat => (
        <SplatStain key={splat.id} x={splat.x} y={splat.y} />
      ))}

      {/* Live fly */}
      {fly && fly.phase !== 'dead' && (
        <div
          onClick={handleClick}
          style={{
            position: 'absolute',
            left: fly.x - 6,
            top: fly.y - 6,
            width: 12,
            height: 12,
            pointerEvents: fly.phase === 'splatted' ? 'none' : 'auto',
            cursor: fly.phase === 'splatted' ? 'default' : 'crosshair',
            zIndex: 6,
            animation: (fly.phase === 'crawling' || fly.phase === 'landing')
              ? 'fly-buzz 0.08s linear infinite'
              : 'fly-buzz 0.06s linear infinite',
          }}
        >
          <FlyIcon
            rotation={fly.rotation}
            scale={fly.scale}
            opacity={fly.opacity}
            phase={fly.phase}
          />
        </div>
      )}
    </div>
  );
}
