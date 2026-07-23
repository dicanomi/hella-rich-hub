/**
 * RadioPage — HELLA_RADIO at hella.rich/radio
 *
 * The radio experience is a self-contained app (custom <x-dc> runtime + Web Audio
 * + canvas) served as static files from /radio/ and mounted in an isolated
 * full-bleed iframe. Global navigation comes from the shared React shell.
 */
import { useEffect } from 'react';

export default function RadioPage() {
  const src = `${import.meta.env.BASE_URL}radio/index.html?hub=1`;

  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = '#000';
    return () => { document.body.style.background = prev; };
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 1 }}>
      <iframe
        src={src}
        title="HELLA_RADIO"
        allow="autoplay"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', display: 'block' }}
      />
    </div>
  );
}
