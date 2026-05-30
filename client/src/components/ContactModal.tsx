/**
 * ContactModal — hella.rich homepage only
 * Formspree endpoint xkoezagn → jeffreywillis@gmail.com
 * Design: minimal, premium, Braun/Teenage Engineering influence, dark UI
 */

import { useEffect, useRef, useState } from 'react';

interface ContactModalProps {
  onClose: () => void;
}

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

const FORMSPREE = 'https://formspree.io/f/xkoezagn';

export function ContactModal({ onClose }: ContactModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const emailRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus email on open (name is optional so skip it)
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  // ESC closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) return;
    setSubmitState('submitting');
    try {
      const res = await fetch(FORMSPREE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name: name || '(no name)', email, message }),
      });
      setSubmitState(res.ok ? 'success' : 'error');
    } catch {
      setSubmitState('error');
    }
  };

  // ── Shared style tokens ──────────────────────────────────────────────────
  const mono: React.CSSProperties = {
    fontFamily: "'DM Mono', 'Space Mono', monospace",
  };

  const fieldBase: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: '2px',
    padding: 'clamp(8px, 1.2vh, 11px) clamp(10px, 1.4vw, 14px)',
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 'clamp(13px, 1.3vw, 15px)',
    fontWeight: 300,
    color: 'rgba(255,255,255,0.80)',
    outline: 'none',
    transition: 'border-color 0.18s ease',
    boxSizing: 'border-box' as const,
    WebkitAppearance: 'none',
  };

  const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)';
  };
  const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)';
  };

  const labelStyle: React.CSSProperties = {
    ...mono,
    display: 'block',
    fontSize: 'clamp(8px, 0.8vw, 9px)',
    letterSpacing: '0.22em',
    color: 'rgba(255,255,255,0.28)',
    textTransform: 'uppercase',
    marginBottom: '6px',
  };

  return (
    /* Backdrop */
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Contact"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(10, 9, 8, 0.86)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(20px, 4vw, 60px)',
        animation: 'hrModalIn 0.18s ease',
      }}
    >
      <style>{`
        @keyframes hrModalIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes hrPanelIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Panel */}
      <div
        ref={panelRef}
        style={{
          position: 'relative',
          width: '100%', maxWidth: '480px',
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '3px',
          padding: 'clamp(28px, 4.5vw, 48px)',
          animation: 'hrPanelIn 0.22s ease',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="modal-close-btn"
          style={{
            position: 'absolute', top: '14px', right: '14px',
            background: 'none', border: 'none',
            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.35)', cursor: 'pointer',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none" strokeWidth="1.6" strokeLinecap="round" stroke="currentColor">
            <line x1="3" y1="3" x2="15" y2="15"/><line x1="15" y1="3" x2="3" y2="15"/>
          </svg>
        </button>

        {/* Title */}
        <div style={{
          ...mono,
          fontSize: 'clamp(9px, 0.9vw, 10px)',
          letterSpacing: '0.30em',
          color: 'rgba(255,255,255,0.28)',
          textTransform: 'uppercase',
          marginBottom: 'clamp(6px, 1vh, 10px)',
        }}>
          CONTACT
        </div>

        {/* Supporting text */}
        <p style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 'clamp(13px, 1.3vw, 15px)',
          fontWeight: 300,
          color: 'rgba(255,255,255,0.42)',
          lineHeight: 1.55,
          margin: '0 0 clamp(20px, 3vh, 28px)',
          letterSpacing: '-0.01em',
        }}>
          Questions, ideas, collaborations, weird thoughts, or broken things? Reach out.
        </p>

        {submitState === 'success' ? (
          /* Success */
          <div style={{
            padding: 'clamp(20px, 3.5vh, 32px) 0',
            textAlign: 'center',
          }}>
            <div style={{
              ...mono,
              fontSize: 'clamp(10px, 1vw, 12px)',
              letterSpacing: '0.28em',
              color: 'rgba(255,255,255,0.55)',
            }}>
              Message sent.
            </div>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(14px, 2vh, 18px)' }}>

            {/* Name (optional) */}
            <div>
              <label htmlFor="hr-contact-name" style={labelStyle}>Name <span style={{ opacity: 0.45 }}>(optional)</span></label>
              <input
                id="hr-contact-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
                style={fieldBase}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </div>

            {/* Email (required) */}
            <div>
              <label htmlFor="hr-contact-email" style={labelStyle}>Email</label>
              <input
                id="hr-contact-email"
                ref={emailRef}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={fieldBase}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </div>

            {/* Message (required) */}
            <div>
              <label htmlFor="hr-contact-message" style={labelStyle}>Message</label>
              <textarea
                id="hr-contact-message"
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
                rows={4}
                style={{
                  ...fieldBase,
                  resize: 'vertical',
                  minHeight: '96px',
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </div>

            {/* Error */}
            {submitState === 'error' && (
              <div style={{
                ...mono,
                fontSize: 'clamp(8px, 0.8vw, 9px)',
                letterSpacing: '0.15em',
                color: 'rgba(240, 90, 70, 0.85)',
              }}>
                Something went wrong. Try again.
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitState === 'submitting' || !email || !message}
              style={{
                ...mono,
                alignSelf: 'flex-start',
                padding: 'clamp(9px, 1.4vh, 13px) clamp(20px, 2.8vw, 28px)',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: '2px',
                fontSize: 'clamp(9px, 0.9vw, 10px)',
                letterSpacing: '0.22em',
                color: (submitState === 'submitting' || !email || !message)
                  ? 'rgba(255,255,255,0.28)'
                  : 'rgba(255,255,255,0.72)',
                cursor: (submitState === 'submitting' || !email || !message) ? 'default' : 'pointer',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={e => {
                if (submitState !== 'submitting' && email && message) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.24)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.92)';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)';
                e.currentTarget.style.color = (submitState === 'submitting' || !email || !message)
                  ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.72)';
              }}
            >
              {submitState === 'submitting' ? 'SENDING…' : 'SEND'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
