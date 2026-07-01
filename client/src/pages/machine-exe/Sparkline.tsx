// MARKET.EXE — Tiny Sparkline (recharts ResponsiveContainer + LineChart)
import { ResponsiveContainer, LineChart, Line, YAxis } from 'recharts';
import { SparklinePoint } from './types';

interface SparklineProps {
  data: SparklinePoint[];
  positive: boolean;
  width?: number | string;
  height?: number;
}

export function Sparkline({ data, positive, width = '100%', height = 40 }: SparklineProps) {
  if (!data || data.length < 2) {
    return (
      <div
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.2,
          fontFamily: "'DM Mono', monospace",
          fontSize: '9px',
          letterSpacing: '0.15em',
          color: 'rgba(255,255,255,0.5)',
        }}
      >
        ─ ─ ─
      </div>
    );
  }

  const color = positive ? '#4ade80' : '#f87171';
  const mapped = data.map(p => ({ v: p.v }));

  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={mapped} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <YAxis domain={['auto', 'auto']} hide />
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
