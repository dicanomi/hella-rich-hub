/**
 * RadioPage - HELLA_RADIO at hella.rich/radio.
 *
 * The self-contained radio app is served from /radio/ and mounted in an
 * isolated full-bleed iframe. Global navigation comes from the shared shell.
 */
import { useEffect, useRef } from 'react';

type RadioFrameWindow = Window & {
  __hellaRadioTransport?: (command: string) => void;
};

export default function RadioPage() {
  const src = `${import.meta.env.BASE_URL}radio/index.html?hub=1`;
  const frameRef = useRef<HTMLIFrameElement>(null);

  const hideEmbeddedNav = (frame: HTMLIFrameElement) => {
    const frameDocument = frame.contentDocument;
    if (!frameDocument || frameDocument.getElementById('hella-radio-embedded-nav-hide')) return;

    const style = frameDocument.createElement('style');
    style.id = 'hella-radio-embedded-nav-hide';
    style.textContent = '#hrNav{display:none!important}';
    frameDocument.head.appendChild(style);
  };

  useEffect(() => {
    const previous = document.body.style.background;
    document.body.style.background = '#edf2f5';
    return () => {
      document.body.style.background = previous;
    };
  }, []);

  useEffect(() => {
    const forwardTransportKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName || '';
      if (
        target?.isContentEditable ||
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        tag === 'BUTTON' ||
        tag === 'A'
      ) {
        return;
      }

      const command =
        event.code === 'Space' || event.key === ' ' || event.key === 'Spacebar'
          ? 'toggle-playback'
          : event.key === 'ArrowLeft'
            ? 'previous-station'
            : event.key === 'ArrowRight'
              ? 'next-station'
              : null;

      if (!command || event.repeat) return;
      event.preventDefault();
      const radioWindow = frameRef.current?.contentWindow as RadioFrameWindow | null;
      if (radioWindow?.__hellaRadioTransport) {
        radioWindow.__hellaRadioTransport(command);
      } else {
        radioWindow?.postMessage(
          { type: 'hella-radio-transport', command },
          window.location.origin,
        );
      }
    };

    window.addEventListener('keydown', forwardTransportKey);
    return () => window.removeEventListener('keydown', forwardTransportKey);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#edf2f5', zIndex: 1 }}>
      <iframe
        ref={frameRef}
        src={src}
        title="HELLA_RADIO"
        allow="autoplay"
        onLoad={(event) => hideEmbeddedNav(event.currentTarget)}
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
