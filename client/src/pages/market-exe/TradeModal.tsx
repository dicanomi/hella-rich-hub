// MARKET.EXE — Trade Modal (Buy / Sell)
import { useEffect, useState, useRef } from 'react';
import { StockQuote } from './types';
import { formatCurrency } from './AnimatedNumber';

interface TradeModalProps {
  mode: 'buy' | 'sell';
  quote: StockQuote;
  maxShares: number;   // for sell: owned shares; for buy: floor(cash / price)
  cash: number;
  onConfirm: (shares: number) => void;
  onClose: () => void;
  sound: { click: () => void; buy: () => void; sell: () => void; error: () => void };
}

export function TradeModal({
  mode,
  quote,
  maxShares,
  cash,
  onConfirm,
  onClose,
  sound,
}: TradeModalProps) {
  const [shares, setShares] = useState('1');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter') handleConfirm();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    setTimeout(() => inputRef.current?.select(), 50);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [shares]);

  const parsed = parseFloat(shares) || 0;
  const total = parsed * quote.price;
  const valid = parsed > 0 && parsed <= maxShares && (mode === 'sell' || total <= cash);

  function handleConfirm() {
    if (!valid) { sound.error(); return; }
    mode === 'buy' ? sound.buy() : sound.sell();
    onConfirm(parsed);
  }

  const accentColor = mode === 'buy' ? '#4ade80' : '#f87171';
  const label = mode === 'buy' ? 'BUY' : 'SELL';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#0a0908',
          border: '1px solid rgba(255,255,255,0.12)',
          padding: 'clamp(28px,4vw,48px)',
          width: 'min(420px, 92vw)',
          position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 'clamp(8px,0.85vw,10px)',
          letterSpacing: '0.22em',
          color: accentColor,
          textTransform: 'uppercase',
          marginBottom: '24px',
        }}>
          {label} / {quote.symbol}
        </div>

        {/* Price row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          marginBottom: '28px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          paddingBottom: '20px',
        }}>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 'clamp(8px,0.8vw,10px)',
            letterSpacing: '0.18em',
            color: 'rgba(255,255,255,0.3)',
            textTransform: 'uppercase',
          }}>Current Price</span>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 'clamp(20px,2.5vw,28px)',
            color: 'rgba(255,255,255,0.9)',
            letterSpacing: '-0.02em',
          }}>
            {formatCurrency(quote.price)}
          </span>
        </div>

        {/* Shares input */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 'clamp(8px,0.8vw,10px)',
            letterSpacing: '0.18em',
            color: 'rgba(255,255,255,0.3)',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}>
            Shares {mode === 'sell' ? `(max ${maxShares})` : ''}
          </div>
          <input
            ref={inputRef}
            type="number"
            min="0.0001"
            max={maxShares}
            step="1"
            value={shares}
            onChange={e => setShares(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '2px',
              padding: '12px 16px',
              fontFamily: "'DM Mono', monospace",
              fontSize: 'clamp(16px,2vw,22px)',
              color: 'rgba(255,255,255,0.9)',
              outline: 'none',
              letterSpacing: '0.05em',
              boxSizing: 'border-box',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
          />
        </div>

        {/* Estimated total */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          marginBottom: '32px',
          padding: '12px 0',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 'clamp(8px,0.8vw,10px)',
            letterSpacing: '0.18em',
            color: 'rgba(255,255,255,0.3)',
            textTransform: 'uppercase',
          }}>Estimated Total</span>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 'clamp(16px,2vw,22px)',
            color: valid ? 'rgba(255,255,255,0.88)' : 'rgba(248,113,113,0.7)',
            letterSpacing: '-0.01em',
          }}>
            {formatCurrency(total)}
          </span>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '14px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.4)',
              fontFamily: "'DM Mono', monospace",
              fontSize: 'clamp(9px,0.9vw,11px)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'border-color 0.2s, color 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.25)';
              (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
              (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)';
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!valid}
            style={{
              flex: 2,
              padding: '14px',
              background: valid ? accentColor : 'rgba(255,255,255,0.05)',
              border: 'none',
              color: valid ? '#0a0908' : 'rgba(255,255,255,0.2)',
              fontFamily: "'DM Mono', monospace",
              fontSize: 'clamp(9px,0.9vw,11px)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              cursor: valid ? 'pointer' : 'not-allowed',
              fontWeight: 600,
              transition: 'background 0.2s, transform 0.1s',
            }}
            onMouseEnter={e => { if (valid) (e.currentTarget as HTMLElement).style.filter = 'brightness(1.1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = ''; }}
            onMouseDown={e => { if (valid) (e.currentTarget as HTMLElement).style.transform = 'scale(0.98)'; }}
            onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}
          >
            {label}
          </button>
        </div>

        {/* Close X */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.3)', padding: '4px',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)')}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
            <line x1="2" y1="2" x2="12" y2="12"/>
            <line x1="12" y1="2" x2="2" y2="12"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
