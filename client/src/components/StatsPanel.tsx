/**
 * LOW BATTERY — Stats Panel v2
 * Layout cleanup:
 * - Removed FLIES SPLATTED section
 * - Removed sanity status labels (nominal/stable/etc)
 * - NAH, I'M GOOD button inline with sanity bar row
 * - Cleaner, more minimal, better spacing
 */

import { useState } from 'react';

interface StatsPanelProps {
  ignoredBeepSeconds: number;
  sanity: number;
  isNightMode: boolean;
  onNightModeToggle: () => void;
  onReplaceBattery: () => void;
  onMute: () => void;
  isMuted: boolean;
  replaceBatteryState: 'idle' | 'loading' | 'done';
  showJudgment: boolean;
  onSurrenderSanity: () => void;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function SanityBar({ sanity }: { sanity: number }) {
  const totalSegments = 20;
  const activeSegments = Math.round((sanity / 100) * totalSegments);
  return (
    <div className="sanity-bar" style={{ gap: '2px' }}>
      {Array.from({ length: totalSegments }, (_, i) => {
        const isActive = i < activeSegments;
        // High segments (near 100%) = red/amber (broken), low = white (stable)
        let activeColor = 'rgba(255,255,255,0.65)';
        if (i >= 16) activeColor = '#E8291A';
        else if (i >= 12) activeColor = '#D4720A';
        return (
          <div
            key={i}
            className="sanity-segment"
            style={{
              backgroundColor: isActive ? activeColor : 'rgba(255,255,255,0.1)',
              opacity: isActive ? 1 : 0.5,
              transition: 'background-color 0.4s ease, opacity 0.4s ease',
            }}
          />
        );
      })}
    </div>
  );
}

export function StatsPanel({
  ignoredBeepSeconds,
  sanity,
  isNightMode,
  onNightModeToggle,
  onReplaceBattery,
  onMute,
  isMuted,
  replaceBatteryState,
  showJudgment,
  onSurrenderSanity,
}: StatsPanelProps) {
  const [mutePressed, setMutePressed] = useState(false);
  const [surrenderMsg, setSurrenderMsg] = useState<string | null>(null);

  const handleMuteClick = () => {
    setMutePressed(true);
    onMute();
    setTimeout(() => setMutePressed(false), 160);
  };

  const handleSurrender = () => {
    onSurrenderSanity();
    const msgs = ['momentary peace.', 'acceptance achieved.', 'briefly okay with it.'];
    setSurrenderMsg(msgs[Math.floor(Math.random() * msgs.length)]);
    setTimeout(() => setSurrenderMsg(null), 2200);
  };

  const isReplaceDone = replaceBatteryState === 'done';
  const isReplaceLoading = replaceBatteryState === 'loading';

  const replaceBatteryLabel = () => {
    if (isReplaceLoading) return 'attempting optimism...';
    if (isReplaceDone) return 'Maybe tomorrow.';
    return 'REPLACE BATTERY';
  };

  return (
    <div
      className="glass-panel"
      style={{
        position: 'absolute',
        bottom: 'clamp(10px, 2vh, 24px)',
        left: 'clamp(10px, 2vw, 32px)',
        right: 'clamp(10px, 2vw, 32px)',
        borderRadius: '10px',
        padding: 'clamp(12px, 2vh, 20px) clamp(14px, 2vw, 24px)',
        display: 'flex',
        alignItems: 'center',
        gap: 'clamp(10px, 1.8vw, 24px)',
        zIndex: 10,
        flexWrap: 'nowrap',
        overflowX: 'auto',
      }}
    >
      {/* ── Stat 1: Ignored Beep Timer ── */}
      <div style={{ flex: '1.2', minWidth: 0 }}>
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 'clamp(8px, 1vw, 10px)',
          fontWeight: 500,
          letterSpacing: '0.15em',
          color: 'var(--stat-label)',
          textTransform: 'uppercase',
          marginBottom: '6px',
        }}>
          IGNORED BEEP
        </div>
        <div
          className="seg-display"
          style={{
            fontSize: 'clamp(22px, 3.5vw, 40px)',
            fontWeight: 400,
            color: 'var(--stat-value)',
            letterSpacing: '0.05em',
            lineHeight: 1,
          }}
        >
          {formatTime(ignoredBeepSeconds)}
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: '1px', height: '48px', background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

      {/* ── Stat 2: Sanity ── */}
      <div style={{ flex: '2', minWidth: 0 }}>
        {/* Label row */}
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 'clamp(8px, 1vw, 10px)',
          fontWeight: 500,
          letterSpacing: '0.15em',
          color: 'var(--stat-label)',
          textTransform: 'uppercase',
          marginBottom: '6px',
        }}>
          SANITY
        </div>

        {/* Value row */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
          <span
            className="seg-display"
            style={{
              fontSize: 'clamp(22px, 3.5vw, 40px)',
              fontWeight: 400,
              color: sanity >= 75 ? '#E8291A' : sanity >= 50 ? '#D4720A' : 'var(--stat-value)',
              letterSpacing: '0.02em',
              lineHeight: 1,
              transition: 'color 0.5s ease',
            }}
          >
            {String(Math.round(sanity)).padStart(2, ' ')}
          </span>
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(12px, 1.5vw, 18px)',
            color: 'rgba(255,255,255,0.5)',
            fontWeight: 300,
          }}>%</span>
        </div>

        {/* Bar + NAH I'M GOOD inline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <SanityBar sanity={sanity} />
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={handleSurrender}
              className="btn-press"
              style={{
                padding: '4px 10px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.16s var(--ease-snap)',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 'clamp(7px, 0.85vw, 10px)',
                fontWeight: 500,
                letterSpacing: '0.1em',
                color: 'rgba(255,255,255,0.45)',
                textTransform: 'uppercase',
              }}>
                NAH, I'M GOOD
              </span>
            </button>
            {surrenderMsg && (
              <span style={{
                position: 'absolute',
                left: '50%',
                bottom: 'calc(100% + 6px)',
                transform: 'translateX(-50%)',
                fontFamily: "'DM Mono', monospace",
                fontSize: 'clamp(7px, 0.8vw, 9px)',
                color: 'rgba(255,255,255,0.28)',
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
                animation: 'fade-in 0.2s ease',
              }}>
                {surrenderMsg}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: '1px', height: '48px', background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

      {/* ── Action: Replace Battery ── */}
      <div style={{ flex: '1.2', minWidth: 0 }}>
        <button
          onClick={onReplaceBattery}
          className="btn-press"
          style={{
            width: '100%',
            padding: 'clamp(8px, 1.3vh, 13px) clamp(8px, 1.3vw, 14px)',
            background: isReplaceDone ? 'rgba(212,114,10,0.06)' : 'rgba(212,114,10,0.12)',
            border: `1px solid ${isReplaceDone ? 'rgba(212,114,10,0.18)' : 'rgba(212,114,10,0.35)'}`,
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s var(--ease-snap)',
            textAlign: 'center',
          }}
        >
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(9px, 1.1vw, 11px)',
            fontWeight: 600,
            letterSpacing: '0.12em',
            color: isReplaceLoading ? 'rgba(212,114,10,0.6)' : '#D4720A',
            textTransform: isReplaceDone || isReplaceLoading ? 'none' : 'uppercase',
            marginBottom: '4px',
            transition: 'color 0.3s ease',
          }}>
            {replaceBatteryLabel()}
          </div>
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 'clamp(7px, 0.8vw, 9px)',
            color: 'rgba(212,114,10,0.35)',
            letterSpacing: '0.05em',
          }}>
            {isReplaceLoading ? '···' : isReplaceDone ? 'nothing changed' : 'Maybe tomorrow.'}
          </div>
        </button>
      </div>

      {/* ── Action: Mute ── */}
      <div style={{ flex: '0.8', minWidth: 0 }}>
        <button
          onClick={handleMuteClick}
          className="btn-press"
          title="Replace battery."
          style={{
            width: '100%',
            padding: 'clamp(8px, 1.3vh, 13px) clamp(8px, 1.3vw, 14px)',
            background: mutePressed ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.16s var(--ease-snap)',
            textAlign: 'center',
          }}
        >
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(9px, 1.1vw, 12px)',
            fontWeight: 500,
            letterSpacing: '0.12em',
            color: 'rgba(255,255,255,0.45)',
            textTransform: 'uppercase',
            marginBottom: '4px',
          }}>
            MUTE
          </div>
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 'clamp(7px, 0.8vw, 9px)',
            color: 'rgba(255,255,255,0.2)',
            letterSpacing: '0.05em',
          }}>
            (does nothing)
          </div>
        </button>
      </div>

      {/* Hidden judgment text */}
      {showJudgment && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 12px)',
          right: 'clamp(16px, 2.5vw, 28px)',
          fontFamily: "'DM Mono', monospace",
          fontSize: 'clamp(9px, 1vw, 11px)',
          color: 'rgba(255,255,255,0.22)',
          letterSpacing: '0.05em',
          pointerEvents: 'none',
        }}>
          You could have changed the battery by now.
        </div>
      )}
    </div>
  );
}
