import { useEffect } from 'react';
import { HellaRichSEO } from '../components/HellaRichSEO';

const synthUrl = `${import.meta.env.BASE_URL}hell-synth-app/index.html`;
const navOffset = 'clamp(66px, 7.5vh, 78px)';
const pageBackground = '#050505';

export default function HellaSynthPage() {
  useEffect(() => {
    const previous = document.body.style.background;
    document.body.style.background = pageBackground;
    return () => {
      document.body.style.background = previous;
    };
  }, []);

  return (
    <>
      <HellaRichSEO
        title="HELL.SYNTH"
        description="HELL.SYNTH is a browser-native instrument powered by a hand-written Web Audio engine."
        keywords="HELL.SYNTH, hella.rich, browser synthesizer, Web Audio, music instrument"
      />
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: pageBackground,
          zIndex: 1,
        }}
      >
        <iframe
          src={synthUrl}
          title="HELL.SYNTH"
          allow="autoplay; microphone"
          style={{
            position: 'absolute',
            top: navOffset,
            right: 0,
            bottom: 0,
            left: 0,
            width: '100%',
            height: `calc(100dvh - ${navOffset})`,
            border: 'none',
            display: 'block',
            background: pageBackground,
          }}
        />
      </div>
    </>
  );
}
