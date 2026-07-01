// THE_MACHINE.EXE — Trade Modal v4
// Completely unrestricted input. User types anything. Machine tells them if it's possible.
import { useEffect, useState, useRef, useCallback } from 'react';
import { StockQuote } from './types';
import { formatCurrency } from './AnimatedNumber';

type InputMode = 'shares' | 'dollars';

interface TradeModalProps {
  mode: 'buy' | 'sell';
  quote: StockQuote;
  ownedShares: number;
  cash: number;
  onConfirm: (shares: number) => void;
  onClose: () => void;
  sound: { click: () => void; buy: () => void; sell: () => void; error: () => void };
}

export function TradeModal({ mode, quote, ownedShares, cash, onConfirm, onClose, sound }: TradeModalProps) {
  const [rawInput, setRawInput] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('shares');
  const inputRef = useRef<HTMLInputElement>(null);

  const parsedRaw = parseFloat(rawInput) || 0;
  const shares = inputMode === 'shares' ? parsedRaw : parsedRaw / quote.price;
  const estimatedTotal = shares * quote.price;

  const isBuy = mode === 'buy';
  const shortfall = isBuy ? estimatedTotal - cash : 0;
  const shareShortfall = !isBuy ? shares - ownedShares : 0;
  const canExecute = parsedRaw > 0 && (isBuy ? estimatedTotal <= cash : shares <= ownedShares);
  const hasError = parsedRaw > 0 && !canExecute;

  const fillPct = useCallback((pct: number) => {
    const s = isBuy ? (cash * pct) / quote.price : ownedShares * pct;
    const rounded = Math.floor(s * 10000) / 10000;
    setRawInput(inputMode === 'shares' ? String(rounded) : String(Math.floor(rounded * quote.price * 100) / 100));
  }, [isBuy, cash, quote.price, ownedShares, inputMode]);

  function handleConfirm() {
    if (!canExecute) { sound.error(); return; }
    isBuy ? sound.buy() : sound.sell();
    onConfirm(Math.floor(shares * 10000) / 10000);
  }

  // Always-current reference to handleConfirm so the mount-only key listener
  // below can invoke the latest version without re-subscribing every render.
  const handleConfirmRef = useRef(handleConfirm);
  useEffect(() => { handleConfirmRef.current = handleConfirm; });

  // Mount-only setup: lock background scroll, focus the input once, wire Esc/Enter.
  // No reactive deps — this must NOT re-run while the user types. The previous
  // version depended on [canExecute] and called input.select() on each re-run,
  // which re-selected the field after every keystroke and blocked multi-digit entry.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Enter') handleConfirmRef.current();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      clearTimeout(focusTimer);
    };
  }, []);

  const accentColor = isBuy ? 'rgba(110,200,130,0.9)' : 'rgba(210,90,90,0.9)';
  const label = isBuy ? 'INCREASE EXPOSURE' : 'REDUCE EXPOSURE';

  const ls: React.CSSProperties = { fontFamily: "'DM Mono', monospace", fontSize: 'clamp(7px,0.75vw,9px)', letterSpacing: '0.22em', color: '#8E877B', textTransform: 'uppercase', marginBottom: '5px' };
  const vs: React.CSSProperties = { fontFamily: "'DM Mono', monospace", fontSize: 'clamp(13px,1.4vw,17px)', color: '#F4F1EA', letterSpacing: '-0.01em' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', animation: 'mxFadeIn 0.2s ease' }} onClick={onClose}>
      <div style={{ background: '#0a0908', border: '1px solid rgba(244,241,234,0.18)', padding: 'clamp(24px,3.5vw,40px)', width: 'min(500px, 94vw)', position: 'relative', animation: 'mxFadeIn 0.2s ease' }} onClick={e => e.stopPropagation()}>

        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(8px,0.85vw,10px)', letterSpacing: '0.22em', color: accentColor, textTransform: 'uppercase', marginBottom: '20px' }}>
          {label} / {quote.symbol}
          {quote.name !== quote.symbol && <span style={{ color: '#8E877B', marginLeft: '10px', fontWeight: 300 }}>{quote.name}</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px', borderBottom: '1px solid rgba(244,241,234,0.08)', paddingBottom: '20px' }}>
          <div><div style={ls}>Current Price</div><div style={vs}>{formatCurrency(quote.price)}</div></div>
          {isBuy
            ? <div><div style={ls}>Available Capital</div><div style={vs}>{formatCurrency(cash)}</div></div>
            : <div><div style={ls}>Shares Owned</div><div style={vs}>{ownedShares.toLocaleString('en-US', { maximumFractionDigits: 4 })}</div></div>
          }
        </div>

        <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
          {(['shares', 'dollars'] as InputMode[]).map(m => (
            <button key={m} onClick={() => { setInputMode(m); setRawInput(''); }}
              style={{ flex: 1, padding: '6px', background: inputMode === m ? 'rgba(244,241,234,0.1)' : 'transparent', border: `1px solid ${inputMode === m ? 'rgba(244,241,234,0.25)' : 'rgba(244,241,234,0.1)'}`, color: inputMode === m ? '#F4F1EA' : '#8E877B', fontFamily: "'DM Mono', monospace", fontSize: 'clamp(8px,0.8vw,10px)', letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.15s' }}>
              {m === 'shares' ? 'SHARES' : '$'}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: '12px' }}>
          <div style={ls}>{inputMode === 'shares' ? 'Quantity' : 'Dollar Amount'}</div>
          <input ref={inputRef} type="text" inputMode="decimal" value={rawInput} onChange={e => setRawInput(e.target.value)} placeholder={inputMode === 'shares' ? '0' : '$0.00'}
            style={{ width: '100%', background: 'rgba(244,241,234,0.04)', border: `1px solid ${hasError ? 'rgba(210,90,90,0.4)' : 'rgba(244,241,234,0.18)'}`, borderRadius: '2px', padding: '12px 16px', fontFamily: "'DM Mono', monospace", fontSize: 'clamp(18px,2.2vw,26px)', color: '#F4F1EA', outline: 'none', letterSpacing: '0.04em', boxSizing: 'border-box', transition: 'border-color 0.2s' }} />
        </div>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
          {[['25%', 0.25], ['50%', 0.5], ['75%', 0.75], ['MAX', 1.0]].map(([lbl, pct]) => (
            <button key={lbl as string} onClick={() => fillPct(pct as number)}
              style={{ flex: 1, padding: '7px 4px', background: 'transparent', border: '1px solid rgba(244,241,234,0.12)', color: '#B8B2A7', fontFamily: "'DM Mono', monospace", fontSize: 'clamp(8px,0.8vw,10px)', letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(244,241,234,0.07)'; (e.currentTarget as HTMLElement).style.color = '#F4F1EA'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#B8B2A7'; }}
            >{lbl as string}</button>
          ))}
        </div>

        <div style={{ borderTop: '1px solid rgba(244,241,234,0.08)', paddingTop: '16px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {inputMode === 'dollars' && shares > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={ls}>Shares</span>
              <span style={{ ...vs, fontSize: 'clamp(12px,1.2vw,15px)', color: '#B8B2A7' }}>{shares.toLocaleString('en-US', { maximumFractionDigits: 4 })}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={ls}>{isBuy ? 'Estimated Cost' : 'Estimated Proceeds'}</span>
            <span style={{ ...vs, color: hasError ? 'rgba(210,90,90,0.9)' : '#F4F1EA' }}>{estimatedTotal > 0 ? formatCurrency(estimatedTotal) : '—'}</span>
          </div>

          {isBuy && hasError && (
            <div style={{ background: 'rgba(210,90,90,0.06)', border: '1px solid rgba(210,90,90,0.2)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(9px,0.9vw,11px)', letterSpacing: '0.2em', color: 'rgba(210,90,90,0.9)', textTransform: 'uppercase', fontWeight: 600 }}>INSUFFICIENT CAPITAL</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                <div><div style={{ ...ls, marginBottom: '2px' }}>Required</div><div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(11px,1.1vw,13px)', color: '#F4F1EA' }}>{formatCurrency(estimatedTotal)}</div></div>
                <div><div style={{ ...ls, marginBottom: '2px' }}>Available</div><div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(11px,1.1vw,13px)', color: '#F4F1EA' }}>{formatCurrency(cash)}</div></div>
                <div style={{ gridColumn: '1 / -1' }}><div style={{ ...ls, marginBottom: '2px' }}>Short</div><div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(11px,1.1vw,13px)', color: 'rgba(210,90,90,0.85)' }}>{formatCurrency(shortfall)}</div></div>
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(7px,0.75vw,9px)', letterSpacing: '0.16em', color: '#8E877B', textTransform: 'uppercase', marginTop: '4px' }}>REALITY HAS ENTERED THE TRADE.</div>
            </div>
          )}

          {!isBuy && hasError && (
            <div style={{ background: 'rgba(210,90,90,0.06)', border: '1px solid rgba(210,90,90,0.2)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(9px,0.9vw,11px)', letterSpacing: '0.2em', color: 'rgba(210,90,90,0.9)', textTransform: 'uppercase', fontWeight: 600 }}>INSUFFICIENT SHARES</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                <div><div style={{ ...ls, marginBottom: '2px' }}>Owned</div><div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(11px,1.1vw,13px)', color: '#F4F1EA' }}>{ownedShares.toLocaleString('en-US', { maximumFractionDigits: 4 })}</div></div>
                <div><div style={{ ...ls, marginBottom: '2px' }}>Requested</div><div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(11px,1.1vw,13px)', color: 'rgba(210,90,90,0.85)' }}>{shares.toLocaleString('en-US', { maximumFractionDigits: 4 })}</div></div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '13px', background: 'transparent', border: '1px solid rgba(244,241,234,0.12)', color: '#8E877B', fontFamily: "'DM Mono', monospace", fontSize: 'clamp(9px,0.9vw,11px)', letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(244,241,234,0.25)'; (e.currentTarget as HTMLElement).style.color = '#F4F1EA'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(244,241,234,0.12)'; (e.currentTarget as HTMLElement).style.color = '#8E877B'; }}
          >Cancel</button>
          <button onClick={handleConfirm} disabled={!canExecute}
            style={{ flex: 2, padding: '13px', background: canExecute ? accentColor : 'rgba(244,241,234,0.05)', border: 'none', color: canExecute ? '#000' : '#8E877B', fontFamily: "'DM Mono', monospace", fontSize: 'clamp(9px,0.9vw,11px)', letterSpacing: '0.2em', textTransform: 'uppercase', cursor: canExecute ? 'pointer' : 'not-allowed', fontWeight: 600, transition: 'all 0.15s' }}
            onMouseEnter={e => { if (canExecute) (e.currentTarget as HTMLElement).style.filter = 'brightness(1.1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = ''; }}
            onMouseDown={e => { if (canExecute) (e.currentTarget as HTMLElement).style.transform = 'scale(0.98)'; }}
            onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}
          >EXECUTE</button>
        </div>

        <button onClick={onClose} style={{ position: 'absolute', top: '14px', right: '14px', background: 'none', border: 'none', cursor: 'pointer', color: '#8E877B', padding: '4px', transition: 'color 0.2s' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#F4F1EA')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#8E877B')}
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
            <line x1="2" y1="2" x2="12" y2="12"/><line x1="12" y1="2" x2="2" y2="12"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
