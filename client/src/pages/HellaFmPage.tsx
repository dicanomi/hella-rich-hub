/**
 * HellaFmPage - HELLA.FM curated station simulator.
 *
 * The prototype is bundled as a self-contained static app so preprogrammed
 * frequencies, voice stations, and radio-state experiments can evolve without
 * disturbing /radio.
 */
import { useEffect } from 'react';

export default function HellaFmPage() {
  const src = `${import.meta.env.BASE_URL}hella.fm/index.html`;

  useEffect(() => {
    window.location.replace(src);
  }, []);

  return (
    <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: '#161920', color: '#eef0ea' }}>
      Loading HELLA.FM…
    </div>
  );
}
