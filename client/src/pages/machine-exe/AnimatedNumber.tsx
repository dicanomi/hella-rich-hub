// MARKET.EXE — Smoothly animated number display
import { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  format?: (v: number) => string;
  flash?: 'up' | 'down' | null;
  style?: React.CSSProperties;
  className?: string;
}

const defaultFormat = (v: number) =>
  v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function AnimatedNumber({
  value,
  format = defaultFormat,
  flash,
  style,
  className,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;

    const duration = 400;
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(elapsed / duration, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        fromRef.current = to;
        startRef.current = null;
      }
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startRef.current = null;
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  const flashColor =
    flash === 'up'
      ? 'rgba(74,222,128,0.9)'
      : flash === 'down'
      ? 'rgba(248,113,113,0.9)'
      : undefined;

  return (
    <span
      className={className}
      style={{
        transition: flashColor ? 'color 0s' : 'color 0.4s ease',
        color: flashColor,
        ...style,
      }}
    >
      {format(display)}
    </span>
  );
}

export function formatCurrency(v: number): string {
  return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatPercent(v: number): string {
  return (v >= 0 ? '+' : '') + v.toFixed(2) + '%';
}

export function formatShares(v: number): string {
  return v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 4 });
}
