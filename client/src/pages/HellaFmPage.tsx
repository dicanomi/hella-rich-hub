/**
 * HellaFmPage - HELLA.FM local station simulator.
 *
 * The prototype is bundled as a self-contained static app so local folder
 * uploads and radio-state experiments can evolve without disturbing /radio.
 */
import { useEffect } from 'react';

export default function HellaFmPage() {
  const src = `${import.meta.env.BASE_URL}hella.fm/index.html?hub=1`;

  useEffect(() => {
    const previous = document.body.style.background;
    document.body.style.background = '#161920';
    return () => {
      document.body.style.background = previous;
    };
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#161920', zIndex: 1 }}>
      <iframe
        src={src}
        title="HELLA.FM"
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
  );
}
