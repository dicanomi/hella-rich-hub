/**
 * HellaDeckPage - HELLA•4 reel recorder.
 *
 * The recorder ships as a self-contained static app so its Web Audio engine,
 * microphone capture, IndexedDB takes, and reel physics stay isolated from the
 * hub and other products.
 */
import { useEffect } from 'react';
import { HellaRichSEO } from '../components/HellaRichSEO';

const frameBackground = '#f2f2f3';

export default function HellaDeckPage() {
  const src = `${import.meta.env.BASE_URL}hella-deck-app/index.html?hub=1`;

  useEffect(() => {
    const previous = document.body.style.background;
    document.body.style.background = frameBackground;
    return () => {
      document.body.style.background = previous;
    };
  }, []);

  return (
    <>
      <HellaRichSEO
        title="HELLA•4"
        description="HELLA•4 is a browser-native reel recorder with mic capture, jog-wheel scrubbing, and persistent takes."
        keywords="HELLA•4, hella.rich, browser recorder, Web Audio, reel recorder"
      />
      <div style={{ position: 'fixed', inset: 0, background: frameBackground, zIndex: 1 }}>
        <iframe
          src={src}
          title="HELLA•4"
          allow="autoplay; microphone"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
            background: frameBackground,
          }}
        />
      </div>
    </>
  );
}
