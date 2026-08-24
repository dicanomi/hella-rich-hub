// MARKET.EXE — Leaderboard Panel (Terminal Side Panel)
import { formatCurrency } from './AnimatedNumber';

interface LeaderboardProps {
  yourValue: number;
}

const FAKE_KINGS = [
  { name: 'NancyP_420',       value: 148_230 },
  { name: 'SoftBankruptcy',   value: 132_900 },
  { name: 'DiamondGoblin',    value: 118_440 },
  { name: 'YieldGremlin',     value: 104_020 },
];

export function Leaderboard({ yourValue }: LeaderboardProps) {
  // Build full list including "You" and sort
  const allEntries = [
    ...FAKE_KINGS.map(k => ({ name: k.name, value: k.value, isYou: false })),
    { name: 'You', value: yourValue, isYou: true },
  ].sort((a, b) => b.value - a.value);

  return (
    <div style={{
      border: '1px solid rgba(244,241,234,0.18)',
      background: 'rgba(255,255,255,0.015)',
      padding: '20px',
      minWidth: '220px',
      maxWidth: '260px',
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: '9px',
        letterSpacing: '0.28em',
        color: '#FF8A00',
        textTransform: 'uppercase',
        marginBottom: '16px',
        paddingBottom: '10px',
        borderBottom: '1px solid rgba(244,241,234,0.1)',
      }}>
        Top Paper Kings
      </div>

      {/* Entries */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {allEntries.map((entry, i) => (
          <div
            key={entry.name}
            style={{
              display: 'grid',
              gridTemplateColumns: '18px 1fr auto',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 6px',
              background: entry.isYou ? 'rgba(255,138,0,0.07)' : 'transparent',
              border: entry.isYou ? '1px solid rgba(255,138,0,0.2)' : '1px solid transparent',
              transition: 'background 0.2s',
            }}
          >
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '9px',
              color: i === 0 ? '#FF8A00' : '#8E877B',
              letterSpacing: '0.1em',
            }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.06em',
              color: entry.isYou ? '#FF8A00' : '#B8B2A7',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: entry.isYou ? 600 : 400,
            }}>
              {entry.name}
            </span>
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '10px',
              color: entry.isYou ? '#F4F1EA' : '#8E877B',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.01em',
            }}>
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div style={{
        marginTop: '14px',
        paddingTop: '10px',
        borderTop: '1px solid rgba(244,241,234,0.08)',
        fontFamily: "'DM Mono', monospace",
        fontSize: '8px',
        letterSpacing: '0.14em',
        color: '#8E877B',
        textTransform: 'uppercase',
        lineHeight: 1.5,
      }}>
        Paper only.<br />No real money.<br />Real emotions.
      </div>
    </div>
  );
}
