/**
 * THE_MACHINE.EXE — Real Sparkline
 *
 * Fetches actual intraday candle data from Finnhub.
 * Falls back to 5-day if 1-day is unavailable.
 * Never generates fake data.
 * Caches per-symbol so it doesn't refetch on every render.
 *
 * SVG: 1.5px stroke, no axes, no labels, no fill, rounded caps/joins.
 * Colors: muted green (up), muted red (down), off-white (flat).
 */
import { useEffect, useState, useRef } from 'react';
import { fhFetchSparkline, getSparklineFromHistory } from './useStockData';

// ── Cache ────────────────────────────────────────────────────────────────────
interface SparkCache {
  points: number[];
  ts: number;
  trend: 'up' | 'down' | 'flat';
}
const sparkCache = new Map<string, SparkCache>();
const SPARK_TTL = 5 * 60 * 1000; // 5 minutes

// ── Trend color ──────────────────────────────────────────────────────────────
function trendColor(trend: 'up' | 'down' | 'flat'): string {
  if (trend === 'up')   return 'rgba(110,200,130,0.8)';
  if (trend === 'down') return 'rgba(210,90,90,0.75)';
  return 'rgba(244,241,234,0.45)';
}

function calcTrend(points: number[]): 'up' | 'down' | 'flat' {
  if (points.length < 2) return 'flat';
  const first = points[0];
  const last = points[points.length - 1];
  const pct = (last - first) / first;
  if (pct > 0.001) return 'up';
  if (pct < -0.001) return 'down';
  return 'flat';
}

// ── SVG path builder ─────────────────────────────────────────────────────────
function buildPath(points: number[], w: number, h: number): string {
  if (points.length < 2) return '';
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const pad = h * 0.1;

  const coords = points.map((v, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = pad + ((max - v) / range) * (h - pad * 2);
    return [x, y] as [number, number];
  });

  // Smooth with catmull-rom-like cubic bezier
  let d = `M ${coords[0][0].toFixed(1)} ${coords[0][1].toFixed(1)}`;
  for (let i = 1; i < coords.length; i++) {
    const [x0, y0] = coords[i - 1];
    const [x1, y1] = coords[i];
    const cpx = (x0 + x1) / 2;
    d += ` C ${cpx.toFixed(1)} ${y0.toFixed(1)}, ${cpx.toFixed(1)} ${y1.toFixed(1)}, ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  return d;
}

// ── Props ────────────────────────────────────────────────────────────────────
interface RealSparklineProps {
  symbol: string;
  width?: number;
  height?: number;
  currentPrice?: number; // append latest quote to sparkline
}

export function RealSparkline({ symbol, width = 80, height = 28, currentPrice }: RealSparklineProps) {
  const [points, setPoints] = useState<number[] | null>(null);
  const [trend, setTrend] = useState<'up' | 'down' | 'flat'>('flat');
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!symbol) return;
    const sym = symbol.toUpperCase();

    // Check in-memory quote history first (zero extra API calls)
    const historyPts = getSparklineFromHistory(sym);
    if (historyPts && historyPts.length >= 2) {
      const t = calcTrend(historyPts);
      setPoints(historyPts);
      setTrend(t);
      setLoading(false);
    } else {
      setLoading(true);
    }

    // Poll for history updates as quotes arrive (every 5s)
    const poll = setInterval(() => {
      if (!mountedRef.current) return;
      const pts = getSparklineFromHistory(sym);
      if (pts && pts.length >= 2) {
        const t = calcTrend(pts);
        setPoints(pts);
        setTrend(t);
        setLoading(false);
      }
    }, 5000);

    return () => clearInterval(poll);
  }, [symbol]);

  // Append current price to sparkline when it updates
  useEffect(() => {
    if (!currentPrice || !points || points.length < 2) return;
    const last = points[points.length - 1];
    if (Math.abs(last - currentPrice) / last > 0.0001) {
      const updated = [...points.slice(-49), currentPrice];
      const t = calcTrend(updated);
      sparkCache.set(symbol.toUpperCase(), { points: updated, ts: Date.now(), trend: t });
      setPoints(updated);
      setTrend(t);
    }
  }, [currentPrice]);

  const color = trendColor(trend);

  if (loading) {
    // Loading state: thin flat line
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', overflow: 'visible' }}>
        <line
          x1="0" y1={height / 2} x2={width} y2={height / 2}
          stroke="rgba(244,241,234,0.12)" strokeWidth="1" strokeDasharray="3 3"
        />
      </svg>
    );
  }

  if (!points || points.length < 2) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="rgba(244,241,234,0.15)" strokeWidth="1" />
      </svg>
    );
  }

  const d = buildPath(points, width, height);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block', overflow: 'visible' }}
      aria-hidden="true"
    >
      {/* Soft glow */}
      <path d={d} fill="none" stroke={color} strokeWidth="4" strokeOpacity="0.15"
        strokeLinecap="round" strokeLinejoin="round"
        style={{ filter: 'blur(2px)' }}
      />
      {/* Core line */}
      <path d={d} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}
