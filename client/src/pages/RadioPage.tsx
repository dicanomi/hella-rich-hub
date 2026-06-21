/**
 * RadioPage — HELLA_RADIO at hella.rich/radio
 *
 * The radio experience is a self-contained app (custom <x-dc> runtime + Web Audio
 * + canvas) that takes over its own document. It is served as static files from
 * /radio/ and mounted in an isolated full-bleed iframe. The hub's global nav is
 * rendered here explicitly, above the iframe, so it is guaranteed to sit on top.
 */
import { useEffect } from 'react';
import { HellaRichNav } from '../components/HellaRichNav';

export default function RadioPage() {
  // BASE_URL is "/" on live (hella.rich) and "/hella-rich-hub/" on the GitHub
  // Pages staging build, so the iframe src resolves correctly in both.
  const src = `${import.meta.env.BASE_URL}radio/index.html`;

  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = '#000';
    return () => { document.body.style.background = prev; };
  }, []);

  return (
    <>
      {/* Hub global nav — rendered above the iframe (its own z-index is 9000) */}
      <HellaRichNav />
      <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 1 }}>
        <iframe
          src={src}
          title="HELLA_RADIO"
          allow="autoplay"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
          }}
        />
      </div>
    </>
  );
}
