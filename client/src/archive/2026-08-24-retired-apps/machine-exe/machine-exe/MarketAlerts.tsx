// MARKET.EXE — Rotating Market Alert System
import { useEffect, useState, useCallback } from 'react';

const BASE_ALERTS = [
  'BUY THE DIP?',
  'WHICH ONE?',
  'VOLATILITY HAS ENTERED THE CHAT',
  'MARKET HAS CHOSEN VIOLENCE',
  'GREEN CANDLE DETECTED',
  'RED CANDLE DETECTED',
  'SOMEONE ON THE INTERNET IS EXTREMELY CONFIDENT',
  'BUY BUY BUY',
  'SELL SELL SELL',
  'HOLD HOLD HOLD',
  'THE CHART HAS FEELINGS',
  'SPY IS PRETENDING EVERYTHING IS FINE',
  'MARKET CONFIDENCE DETECTED. REDUCE IMMEDIATELY.',
  'YOU ARE NOT WARREN BUFFETT',
  'CASH IS ALSO A POSITION, COWARD',
  'GREEN CANDLE. HUMAN DOPAMINE ACTIVATED.',
  'RED CANDLE. PERSONALITY TEST BEGINS.',
  'URGENT: SOMEONE ON THE INTERNET IS VERY CONFIDENT',
  'PORTFOLIO DEVELOPING MAIN CHARACTER ENERGY',
  'THE MARKET HAS NO MEMORY, BUT YOU DO',
  'VOLATILITY IS JUST THE MARKET BREATHING',
  'YOUR STOP LOSS IS A SUGGESTION',
  'FUNDAMENTALS ARE A VIBE',
  'TECHNICAL ANALYSIS SAYS: MAYBE',
  'THE INVISIBLE HAND IS POINTING AT YOU',
  'RISK TOLERANCE: THEORETICAL',
  'DIAMOND HANDS. PAPER BRAIN.',
];

const UP_ALERTS = [
  'PORTFOLIO UP. GENIUS CONFIRMED.',
  "YOU'RE FEELING INVINCIBLE",
  'THIS IS HOW BAD DECISIONS BEGIN',
  'THE MARKET IS REWARDING YOUR CONFIDENCE\u2026 FOR NOW',
  'UNREALIZED GAINS ARE STILL GAINS. PROBABLY.',
  'CONSIDER QUITTING YOUR JOB.',
  'THE MARKET AGREES WITH YOUR PERSONALITY.',
  'OVERCONFIDENCE LOADING... 87%',
];

const DOWN_ALERTS = [
  'THIS IS FINE.',
  'MAYBE DON\'T LOOK FOR A MINUTE',
  'THIS IS WHY WE PAPER TRADE',
  'CHARACTER DEVELOPMENT DETECTED',
  'LOSSES ARE JUST GAINS IN DISGUISE. (THEY ARE NOT.)',
  'THE MARKET IS WRONG. YOU ARE RIGHT.',
  'CONSIDER HOLDING FOREVER.',
  'HAVE YOU TRIED NOT LOOKING AT IT?',
  'YOUR PORTFOLIO NEEDS A HUG.',
  'ZOOM OUT. NO, FURTHER. FURTHER.',
];

const TICKER_ALERTS: Record<string, string[]> = {
  AAPL: ['AAPL ENTERED QUIET PANIC MODE', 'AAPL WOULD LIKE A WORD', 'AAPL IS THINKING ABOUT IT'],
  NVDA: ['NVDA JUST LOOKED AT YOU', 'NVDA IS CURRENTLY TESTING YOUR PATIENCE', 'NVDA DOING NVDA THINGS'],
  TSLA: ['YOUR TSLA POSITION APPEARS TO BE MAKING DECISIONS FOR YOU', 'TSLA VIBES: UNCERTAIN', 'TSLA HAS ENTERED THE CHAT'],
  META: ['META KNOWS WHAT YOU WANT', 'META IS WATCHING THE WATCHERS'],
  AMZN: ['AMZN WILL DELIVER YOUR LOSSES TOMORROW', 'AMZN: TWO-DAY SHIPPING ON REGRET'],
  MSFT: ['MSFT IS QUIETLY FINE', 'MSFT: BORING IS A STRATEGY'],
  SPY: ['SPY IS PRETENDING EVERYTHING IS FINE', 'SPY SEES ALL. JUDGES NOTHING.'],
  QQQ: ['QQQ: TECH FEELINGS INDEX', 'QQQ ENTERED EXISTENTIAL MODE'],
};

interface MarketAlertsProps {
  holdingSymbols: string[];
  portfolioGain: number; // positive = up, negative = down
  healthScore?: number;  // 0-100 market health
  vix?: number | null;
  spyPct?: number;
}

export function MarketAlerts({ holdingSymbols, portfolioGain, healthScore, vix, spyPct }: MarketAlertsProps) {
  const [current, setCurrent] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const pickAlert = useCallback(() => {
    const pool: string[] = [...BASE_ALERTS];

    // Health-based alerts
    if (healthScore !== undefined) {
      if (healthScore > 80) pool.push('MARKET CONFIDENCE DETECTED. REDUCE IMMEDIATELY.', 'THE MACHINE IS HUMMING. SUSPICIOUS.');
      else if (healthScore >= 55) pool.push('THE MARKET IS WALKING NORMALLY. SUSPICIOUS.', 'WALL STREET IS PRETENDING THIS IS FINE.');
      else if (healthScore >= 40) pool.push('MIXED SIGNALS. EVERYONE IS LYING.', 'THE MARKET HAS TRUST ISSUES.');
      else if (healthScore >= 25) pool.push('RISK APPETITE HAS LEFT THE BUILDING.', 'PORTFOLIOS ARE MAKING PHONE CALLS.');
      else pool.push('PANIC HAS ENTERED THE CHAT.', 'THE CHART HAS CHOSEN VIOLENCE.');
    }
    if (vix && vix > 25) pool.push('VOLATILITY IS BREATHING LOUDLY.');
    if (spyPct && spyPct < -1) pool.push('SPY IS PRETENDING EVERYTHING IS FINE. IT IS NOT.');

    // Add portfolio-state alerts
    if (portfolioGain > 500) pool.push(...UP_ALERTS);
    if (portfolioGain < -500) pool.push(...DOWN_ALERTS);

    // Add ticker-specific alerts for owned stocks
    holdingSymbols.forEach(sym => {
      if (TICKER_ALERTS[sym]) pool.push(...TICKER_ALERTS[sym]);
    });

    return pool[Math.floor(Math.random() * pool.length)];
  }, [holdingSymbols, portfolioGain]);

  useEffect(() => {
    const show = () => {
      const alert = pickAlert();
      setCurrent(alert);
      setVisible(true);
      setTimeout(() => setVisible(false), 3500);
    };

    // Initial delay
    const initial = setTimeout(show, 4000);

    // Recurring interval: 8–15 seconds
    let intervalId: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const delay = 8000 + Math.random() * 7000;
      intervalId = setTimeout(() => {
        show();
        schedule();
      }, delay);
    };
    schedule();

    return () => {
      clearTimeout(initial);
      clearTimeout(intervalId);
    };
  }, [pickAlert]);

  if (!current) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'fixed',
        bottom: 'clamp(20px,3vh,32px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 500,
        pointerEvents: 'none',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease',
        maxWidth: 'min(520px, 90vw)',
        width: 'max-content',
      }}
    >
      <div style={{
        background: '#000',
        border: '1px solid rgba(255,138,0,0.35)',
        padding: '8px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: '9px',
          letterSpacing: '0.22em',
          color: '#FF8A00',
          textTransform: 'uppercase',
          flexShrink: 0,
        }}>
          ALERT
        </span>
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: '10px',
          letterSpacing: '0.14em',
          color: '#F4F1EA',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}>
          {current}
        </span>
      </div>
    </div>
  );
}
