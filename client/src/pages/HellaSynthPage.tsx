/**
 * HellaSynthPage - HELLA.SYNTH browser instrument.
 *
 * The synth ships as a self-contained static app so its audio engine,
 * sequencer, and visual system stay isolated from the hub and other products.
 */
import { useEffect } from 'react';
import { HellaRichSEO } from '../components/HellaRichSEO';

const frameBackground = '#050505';

export default function HellaSynthPage() {
  const src = `${import.meta.env.BASE_URL}hella-synth-app/index.html?hub=1`;

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
        title="HELLA.SYNTH"
        description="HELLA.SYNTH is a browser-native instrument powered by a hand-written Web Audio engine."
        keywords="HELLA.SYNTH, hella.rich, browser synthesizer, Web Audio, music instrument"
      />
      <div style={{ position: 'fixed', inset: 0, background: frameBackground, zIndex: 1 }}>
        <iframe
          src={src}
          title="HELLA.SYNTH"
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
