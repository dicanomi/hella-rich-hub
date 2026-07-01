// THE_MACHINE.EXE — Terminal Status Bar
import { useEffect, useState, useCallback } from 'react';

const BASE_MESSAGES = [
  'THE MACHINE IS WATCHING.',
  'THE MACHINE APPROVES.',
  'THE MACHINE REMEMBERS 2008.',
  'THE MACHINE DETECTS GREED.',
  'YOUR CONFIDENCE EXCEEDS YOUR CAPITAL.',
  'BUY HIGH.',
  'SELL LOWER.',
  'YOU ARE SOMEONE\'S EXIT LIQUIDITY.',
  'THE MACHINE PREFERS CASH TODAY.',
  'CHARACTER DEVELOPMENT DETECTED.',
  'THE MACHINE HAS SEEN THIS BEFORE.',
  'THE MACHINE IS HUNGRY.',
  'PORTFOLIOS ARE MAKING PHONE CALLS.',
  'THE MACHINE IS BREATHING.',
  'THE MACHINE IS CALCULATING YOUR NEXT MISTAKE.',
  'RISK IS JUST REGRET YOU HAVEN\'T FELT YET.',
  'THE MACHINE DOES NOT SLEEP.',
  'PATIENCE IS A POSITION.',
  'THE MARKET IS INDIFFERENT TO YOUR FEELINGS.',
  'THE MACHINE NOTES YOUR HESITATION.',
];

interface TerminalBarProps {
  holdingSymbols?: string[];
  portfolioGain?: number;
  healthScore?: number;
}

export function TerminalBar({ holdingSymbols = [], portfolioGain = 0, healthScore }: TerminalBarProps) {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(true);

  const pick = useCallback(() => {
    const pool = [...BASE_MESSAGES];
    if (healthScore !== undefined && healthScore < 30) {
      pool.push('THE MACHINE DETECTS SYSTEMIC STRESS.', 'THE CHART HAS CHOSEN VIOLENCE.');
    }
    if (healthScore !== undefined && healthScore > 80) {
      pool.push('THE MACHINE DETECTS EUPHORIA.', 'EVERYONE THINKS THEY ARE A GENIUS.');
    }
    if (portfolioGain > 1000) pool.push('THE MACHINE NOTES YOUR OVERCONFIDENCE.', 'THIS IS HOW BAD DECISIONS BEGIN.');
    if (portfolioGain < -1000) pool.push('THE MACHINE PREDICTED THIS.', 'THIS IS WHY WE PAPER TRADE.');
    holdingSymbols.forEach(sym => {
      pool.push(`THE MACHINE IS MONITORING ${sym}.`);
    });
    return pool[Math.floor(Math.random() * pool.length)];
  }, [holdingSymbols, portfolioGain, healthScore]);

  useEffect(() => {
    setMessage(pick());

    const cycle = () => {
      setVisible(false);
      setTimeout(() => {
        setMessage(pick());
        setVisible(true);
      }, 400);
    };

    const delay = 8000 + Math.random() * 7000;
    let id: ReturnType<typeof setTimeout>;
    const schedule = () => {
      id = setTimeout(() => { cycle(); schedule(); }, 8000 + Math.random() * 7000);
    };
    id = setTimeout(() => { cycle(); schedule(); }, delay);
    return () => clearTimeout(id);
  }, [pick]);

  return (
    <div style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      zIndex: 400,
      background: '#000',
      borderTop: '1px solid rgba(244,241,234,0.08)',
      padding: '8px clamp(20px,4vw,48px)',
      display: 'flex', alignItems: 'center', gap: '16px',
    }}>
      <span style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 'clamp(7px,0.7vw,9px)',
        letterSpacing: '0.22em',
        color: '#FFA84A',
        textTransform: 'uppercase',
        flexShrink: 0,
      }}>
        THE MACHINE
      </span>
      <span style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 'clamp(7px,0.7vw,9px)',
        letterSpacing: '0.18em',
        color: '#8E877B',
        textTransform: 'uppercase',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {message}
      </span>
    </div>
  );
}
