/**
 * SF FIELD GUIDE — Build 01
 * hella.rich
 *
 * Real Leaflet map (Stamen Toner-Lite tiles styled warm) centered on SF.
 * 3-column layout: left nav | map hero | right observations panel.
 * Stripped to essentials only. No patches, no weather, no badges.
 *
 * Data: SF Open Data (Socrata) — no API key required.
 * Falls back to demo data gracefully.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { HellaRichSEO } from '../components/HellaRichSEO';

// ─── Design tokens ─────────────────────────────────────────────────────────
const C = {
  canvas:     '#F0E8D8',
  paper:      '#E7DFC8',
  paperDark:  '#DDD0B4',
  forest:     '#4E5B43',
  moss:       '#697257',
  sage:       '#8E9277',
  leather:    '#8A5A3B',
  rust:       '#B45A32',
  orange:     '#C46A35',
  creek:      '#6B8E95',
  charcoal:   '#2D2C28',
  ink:        '#1C1A16',
  faded:      'rgba(45,44,40,0.48)',
  border:     'rgba(45,44,40,0.20)',
  borderDark: 'rgba(45,44,40,0.35)',
};

const FONT = "'IBM Plex Sans Condensed', 'Arial Narrow', 'Franklin Gothic Medium Cond', sans-serif";
const MONO = "'IBM Plex Mono', 'Courier New', monospace";

// ─── Types ──────────────────────────────────────────────────────────────────
interface Obs {
  id: string;
  cat: 'enc' | 'police' | 'fire' | 'support';
  label: string;
  neighborhood: string;
  address: string;
  ts: string;
  lat: number;
  lng: number;
}

interface Stats {
  enc: number;
  police: number;
  fire: number;
  support: number;
  updated: string;
}

// ─── SF neighborhood lat/lng centroids ─────────────────────────────────────
const HOODS: Record<string, [number, number]> = {
  'Tenderloin':          [37.7835, -122.4127],
  'SoMa':                [37.7785, -122.4056],
  'The Mission':         [37.7599, -122.4148],
  'Civic Center':        [37.7793, -122.4193],
  'Haight-Ashbury':      [37.7692, -122.4481],
  'Castro':              [37.7609, -122.4350],
  'Noe Valley':          [37.7502, -122.4337],
  'Potrero Hill':        [37.7601, -122.4005],
  'Bayview':             [37.7341, -122.3899],
  'Excelsior':           [37.7237, -122.4238],
  'Sunset District':     [37.7525, -122.4918],
  'Richmond District':   [37.7785, -122.4830],
  'North Beach':         [37.8060, -122.4103],
  'Chinatown':           [37.7941, -122.4078],
  'Financial District':  [37.7946, -122.3999],
  'Pacific Heights':     [37.7925, -122.4382],
  'Marina':              [37.8030, -122.4360],
  'Presidio':            [37.7989, -122.4662],
  'Glen Park':           [37.7337, -122.4337],
  'Bernal Heights':      [37.7396, -122.4153],
  'Twin Peaks':          [37.7544, -122.4477],
  'Dogpatch':            [37.7601, -122.3897],
  'Visitacion Valley':   [37.7130, -122.4083],
  'Portola':             [37.7237, -122.4083],
  'Inner Sunset':        [37.7638, -122.4680],
  'Outer Sunset':        [37.7525, -122.5040],
  'Inner Richmond':      [37.7785, -122.4680],
  'Western Addition':    [37.7793, -122.4350],
  'Lower Haight':        [37.7720, -122.4350],
  'Hayes Valley':        [37.7760, -122.4230],
};

const HOOD_NAMES = Object.keys(HOODS);
function rndHood() { return HOOD_NAMES[Math.floor(Math.random() * HOOD_NAMES.length)]; }
function hoursAgo(h: number) { return new Date(Date.now() - h * 3600000).toISOString(); }

// ─── Demo data ──────────────────────────────────────────────────────────────
function buildDemo(): { obs: Obs[]; stats: Stats } {
  const raw: Omit<Obs, 'lat' | 'lng'>[] = [
    { id:'1', cat:'enc',    label:'Encampment reported',      neighborhood:'Tenderloin',        address:'Turk & Hyde St',          ts: hoursAgo(0.05) },
    { id:'2', cat:'police', label:'Police activity',          neighborhood:'SoMa',              address:'Market St & 8th St',      ts: hoursAgo(0.20) },
    { id:'3', cat:'fire',   label:'Medical aid',              neighborhood:'Civic Center',      address:'Civic Center Plaza',      ts: hoursAgo(0.30) },
    { id:'4', cat:'enc',    label:'Encampment reported',      neighborhood:'SoMa',              address:'Bryant St & 7th St',      ts: hoursAgo(0.45) },
    { id:'5', cat:'fire',   label:'Fire department response', neighborhood:'Potrero Hill',      address:'Potrero Ave & 18th St',   ts: hoursAgo(0.58) },
    { id:'6', cat:'police', label:'Police activity',          neighborhood:'Tenderloin',        address:'Turk & Hyde St',          ts: hoursAgo(1.10) },
    { id:'7', cat:'support',label:'Outreach services',        neighborhood:'Haight-Ashbury',    address:'Haight & Masonic',        ts: hoursAgo(1.50) },
    { id:'8', cat:'enc',    label:'Encampment reported',      neighborhood:'Richmond District', address:'Geary & 6th Ave',         ts: hoursAgo(2.20) },
    { id:'9', cat:'fire',   label:'Fire dispatch',            neighborhood:'North Beach',       address:'Columbus & Broadway',     ts: hoursAgo(2.80) },
    { id:'10',cat:'police', label:'Police call',              neighborhood:'Bayview',           address:'3rd & Cesar Chavez',      ts: hoursAgo(3.50) },
    { id:'11',cat:'enc',    label:'Encampment reported',      neighborhood:'Sunset District',   address:'Irving & 19th Ave',       ts: hoursAgo(4.00) },
    { id:'12',cat:'support',label:'Support services active',  neighborhood:'The Mission',       address:'16th & Valencia',         ts: hoursAgo(5.00) },
  ];
  return {
    obs: raw.map(r => {
      const c = HOODS[r.neighborhood] || [37.7749, -122.4194];
      // small jitter so pins don't stack
      const jlat = c[0] + (Math.random() - 0.5) * 0.004;
      const jlng = c[1] + (Math.random() - 0.5) * 0.004;
      return { ...r, lat: jlat, lng: jlng };
    }),
    stats: { enc: 47, police: 128, fire: 43, support: 87, updated: new Date().toISOString() },
  };
}

// ─── Live fetch ──────────────────────────────────────────────────────────────
async function fetchLive(): Promise<{ obs: Obs[]; stats: Stats }> {
  const ft = (url: string) => fetch(url, { signal: AbortSignal.timeout(6000) });
  const result: Obs[] = [];
  let encCount = 0, polCount = 0, firCount = 0;

  const [encR, polR, firR] = await Promise.allSettled([
    ft('https://data.sfgov.org/resource/vw6y-z8j6.json?$where=service_subtype=%27Encampments%27&$limit=50&$order=requested_datetime%20DESC'),
    ft('https://data.sfgov.org/resource/gnap-fj3t.json?$limit=50&$order=dispatch_dttm%20DESC'),
    ft('https://data.sfgov.org/resource/nuek-vuh3.json?$limit=50&$order=entry_dttm%20DESC'),
  ]);

  if (encR.status === 'fulfilled' && encR.value.ok) {
    const d = await encR.value.json();
    encCount = d.length;
    d.slice(0, 8).forEach((r: Record<string, string>, i: number) => {
      const nbr = r.neighborhoods_sffind_boundaries || rndHood();
      const base = HOODS[nbr] || [37.7749, -122.4194];
      result.push({
        id: `enc-${i}`, cat: 'enc', label: 'Encampment reported',
        neighborhood: nbr, address: r.address || '',
        ts: r.requested_datetime || new Date().toISOString(),
        lat: base[0] + (Math.random() - 0.5) * 0.003,
        lng: base[1] + (Math.random() - 0.5) * 0.003,
      });
    });
  }
  if (polR.status === 'fulfilled' && polR.value.ok) {
    const d = await polR.value.json();
    polCount = d.length;
    d.slice(0, 6).forEach((r: Record<string, string>, i: number) => {
      const nbr = r.analysis_neighborhood || rndHood();
      const base = HOODS[nbr] || [37.7749, -122.4194];
      result.push({
        id: `pol-${i}`, cat: 'police',
        label: r.call_type_final_desc || 'Police activity',
        neighborhood: nbr, address: r.intersection_name || '',
        ts: r.dispatch_dttm || new Date().toISOString(),
        lat: base[0] + (Math.random() - 0.5) * 0.003,
        lng: base[1] + (Math.random() - 0.5) * 0.003,
      });
    });
  }
  if (firR.status === 'fulfilled' && firR.value.ok) {
    const d = await firR.value.json();
    firCount = d.length;
    d.slice(0, 5).forEach((r: Record<string, string>, i: number) => {
      const nbr = r.neighborhoods_analysis_boundaries || rndHood();
      const base = HOODS[nbr] || [37.7749, -122.4194];
      result.push({
        id: `fir-${i}`, cat: 'fire',
        label: r.call_type_final_desc || 'Fire / EMS dispatch',
        neighborhood: nbr, address: r.address || '',
        ts: r.entry_dttm || new Date().toISOString(),
        lat: base[0] + (Math.random() - 0.5) * 0.003,
        lng: base[1] + (Math.random() - 0.5) * 0.003,
      });
    });
  }

  if (result.length === 0) throw new Error('no data');
  result.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
  return {
    obs: result,
    stats: { enc: encCount, police: polCount, fire: firCount, support: 87, updated: new Date().toISOString() },
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function relTime(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 2) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtTime(iso: string) {
  try { return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }); }
  catch { return '—'; }
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
  } catch { return '—'; }
}

const CAT_META = {
  enc:    { label: '311 Report',      color: C.orange,  symbol: '●', border: C.orange },
  police: { label: 'Police Activity', color: C.creek,   symbol: '◆', border: C.creek },
  fire:   { label: 'Fire / EMS',      color: C.rust,    symbol: '▲', border: C.rust },
  support:{ label: 'Waypoint',        color: C.forest,  symbol: '■', border: C.forest },
};

// ─── Leaflet Map Component ──────────────────────────────────────────────────
// Loaded dynamically to avoid SSR issues
interface MapProps {
  observations: Obs[];
  overlays: Record<string, boolean>;
}

function FieldMap({ observations, overlays }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const markersRef = useRef<import('leaflet').Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Dynamically import Leaflet to avoid SSR
    import('leaflet').then(L => {
      // Fix default icon paths
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(containerRef.current!, {
        center: [37.7749, -122.4394],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      mapRef.current = map;

      // Stamen Toner-Lite via Stadia (free, no key for low traffic)
      // Warm sepia CSS filter applied via the container
      L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
        attribution: '© Stadia Maps, © Stamen Design, © OpenStreetMap',
      }).addTo(map);

      // Attribution — small, bottom right
      L.control.attribution({ prefix: false, position: 'bottomright' }).addTo(map);

      // Custom zoom control — top left, field-guide style
      L.control.zoom({ position: 'topleft' }).addTo(map);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when observations or overlays change
  useEffect(() => {
    if (!mapRef.current) return;

    import('leaflet').then(L => {
      // Remove old markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      const visible = observations.filter(o => overlays[o.cat]);

      visible.forEach(obs => {
        const meta = CAT_META[obs.cat];

        // Custom DivIcon — stamped symbol, field-guide style
        const icon = L.divIcon({
          className: '',
          html: `
            <div style="
              width:22px; height:22px;
              background:${meta.color};
              border:2px solid rgba(255,255,255,0.85);
              border-radius:${obs.cat === 'fire' ? '2px' : obs.cat === 'police' ? '3px' : '50%'};
              display:flex; align-items:center; justify-content:center;
              box-shadow:0 1px 4px rgba(0,0,0,0.35);
              transform:${obs.cat === 'fire' ? 'rotate(0deg)' : 'none'};
            ">
              <span style="color:white;font-size:9px;font-weight:700;line-height:1;font-family:monospace;">${meta.symbol}</span>
            </div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const marker = L.marker([obs.lat, obs.lng], { icon })
          .bindPopup(`
            <div style="font-family:'IBM Plex Sans Condensed',sans-serif;min-width:160px;">
              <div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${meta.color};font-weight:700;margin-bottom:4px;">${meta.label}</div>
              <div style="font-size:13px;font-weight:600;color:#2D2C28;margin-bottom:2px;">${obs.label}</div>
              <div style="font-size:11px;color:#8A5A3B;">${obs.neighborhood}</div>
              ${obs.address ? `<div style="font-size:11px;color:#697257;margin-top:2px;">${obs.address}</div>` : ''}
              <div style="font-size:10px;color:rgba(45,44,40,0.45);margin-top:6px;font-family:'IBM Plex Mono',monospace;">${relTime(obs.ts)}</div>
            </div>
          `, {
            className: 'sfg-popup',
            maxWidth: 220,
          })
          .addTo(mapRef.current!);

        markersRef.current.push(marker);
      });
    });
  }, [observations, overlays]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Sepia / warm filter over the tile layer */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          filter: 'sepia(0.45) saturate(0.75) brightness(1.04) contrast(0.92)',
        }}
      />
    </div>
  );
}

// ─── GitHub star ─────────────────────────────────────────────────────────────
function GitHubStar() {
  const [stars, setStars] = useState<number | null>(null);
  useEffect(() => {
    fetch('https://api.github.com/repos/dicanomi/hella-rich-hub')
      .then(r => r.json())
      .then(d => { if (typeof d.stargazers_count === 'number') setStars(d.stargazers_count); })
      .catch(() => {});
  }, []);
  return (
    <a
      href="https://github.com/dicanomi"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em',
        color: C.faded, textDecoration: 'none',
        transition: 'color 0.18s',
      }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = C.rust)}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = C.faded)}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.11.82-.26.82-.58v-2.03c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02.005 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
      </svg>
      ★ {stars ?? '—'}
    </a>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
const NAV = [
  { key: 'map',       label: 'FIELD GUIDE',    sub: 'Overview Map' },
  { key: 'notes',     label: 'TRAIL NOTES',    sub: 'View Reports' },
  { key: 'ranger',    label: 'RANGER REPORTS', sub: 'Daily Updates' },
  { key: 'waypoints', label: 'WAYPOINTS',      sub: 'Resources & Services' },
  { key: 'overlays',  label: 'OVERLAYS',       sub: 'Map Layers' },
];

export default function SFFieldGuidePage() {
  const [data, setData] = useState<{ obs: Obs[]; stats: Stats } | null>(null);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(true);
  const [activeNav, setActiveNav] = useState('map');
  const [overlays, setOverlays] = useState({ enc: true, police: true, fire: true, support: true });

  const load = useCallback(async () => {
    setLoading(true);
    try { const d = await fetchLive(); setData(d); setLive(true); }
    catch { setData(buildDemo()); setLive(false); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const obs = data?.obs ?? [];
  const stats = data?.stats;

  // Top neighborhood for field alert
  const topHood = (() => {
    const c: Record<string, number> = {};
    obs.forEach(o => { c[o.neighborhood] = (c[o.neighborhood] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] || 'The Mission';
  })();

  const toggleOverlay = (key: keyof typeof overlays) =>
    setOverlays(p => ({ ...p, [key]: !p[key] }));

  return (
    <>
      <HellaRichSEO
        title="SF Field Guide — hella.rich"
        description="An urban field guide to San Francisco street conditions. Civic data. Printed atlas feel."
        keywords="San Francisco, field guide, civic data, 311, urban conditions"
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Condensed:wght@400;600;700&family=IBM+Plex+Mono:wght@400&display=swap');
        @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');

        .sfg-root, .sfg-root * { box-sizing: border-box; }
        .sfg-root {
          font-family: ${FONT};
          background: ${C.canvas};
          color: ${C.ink};
          height: calc(100vh - clamp(44px,6vh,56px));
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* Leaflet popup custom style */
        .sfg-popup .leaflet-popup-content-wrapper {
          background: ${C.paper};
          border: 1px solid ${C.border};
          border-radius: 2px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.18);
          padding: 0;
        }
        .sfg-popup .leaflet-popup-content {
          margin: 12px 14px;
        }
        .sfg-popup .leaflet-popup-tip {
          background: ${C.paper};
        }

        /* Leaflet zoom control */
        .leaflet-control-zoom {
          border: 1px solid ${C.border} !important;
          border-radius: 2px !important;
          box-shadow: none !important;
        }
        .leaflet-control-zoom a {
          background: ${C.paper} !important;
          color: ${C.charcoal} !important;
          border-bottom: 1px solid ${C.border} !important;
          font-family: ${MONO} !important;
          font-size: 16px !important;
          line-height: 26px !important;
          width: 26px !important;
          height: 26px !important;
        }
        .leaflet-control-zoom a:hover {
          background: ${C.canvas} !important;
          color: ${C.rust} !important;
        }
        .leaflet-control-zoom-in { border-radius: 2px 2px 0 0 !important; }
        .leaflet-control-zoom-out { border-radius: 0 0 2px 2px !important; border-bottom: none !important; }

        /* Attribution */
        .leaflet-control-attribution {
          background: rgba(240,232,216,0.75) !important;
          font-family: ${MONO} !important;
          font-size: 9px !important;
          color: ${C.faded} !important;
          padding: 2px 6px !important;
        }
        .leaflet-control-attribution a { color: ${C.leather} !important; }

        /* Nav button */
        .sfg-nav-btn {
          display: flex; align-items: flex-start; gap: 8px;
          padding: clamp(6px,0.8vh,9px) clamp(10px,1vw,14px);
          cursor: pointer; border: none; background: none; width: 100%; text-align: left;
          border-left: 2px solid transparent;
          transition: background 0.15s, border-color 0.15s;
        }
        .sfg-nav-btn:hover { background: rgba(45,44,40,0.06); }
        .sfg-nav-btn.active { background: rgba(45,44,40,0.07); border-left-color: ${C.rust}; }

        /* Obs row */
        .sfg-obs-row {
          display: flex; gap: 9px; align-items: flex-start;
          padding: clamp(7px,0.9vh,10px) 0;
          border-bottom: 1px solid rgba(45,44,40,0.10);
        }
        .sfg-obs-row:last-child { border-bottom: none; }

        /* Overlay toggle */
        .sfg-ov-row {
          display: flex; align-items: center; gap: 8px;
          padding: 5px 0; cursor: pointer;
          transition: opacity 0.15s;
        }
        .sfg-ov-row:hover { opacity: 0.75; }

        /* Scrollbar */
        .sfg-scroll::-webkit-scrollbar { width: 3px; }
        .sfg-scroll::-webkit-scrollbar-track { background: transparent; }
        .sfg-scroll::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }

        @keyframes sfgFade { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:translateY(0); } }
        .sfg-fade { animation: sfgFade 0.3s ease forwards; }

        @keyframes sfgPulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
        .sfg-pulse { animation: sfgPulse 2.2s ease infinite; }

        /* Responsive: stack on mobile */
        @media (max-width: 768px) {
          .sfg-root { height: auto; overflow: auto; }
          .sfg-body { flex-direction: column !important; }
          .sfg-left { width: 100% !important; flex-direction: row !important; flex-wrap: wrap; border-right: none !important; border-bottom: 1px solid ${C.border}; }
          .sfg-map-col { min-height: 55vw !important; }
          .sfg-right { width: 100% !important; border-left: none !important; border-top: 1px solid ${C.border}; max-height: none !important; }
        }
      `}</style>

      <div className="sfg-root">

        {/* ── TOP HEADER ─────────────────────────────────────────────────── */}
        <header style={{
          background: C.paper,
          borderBottom: `1px solid ${C.borderDark}`,
          display: 'flex',
          alignItems: 'stretch',
          flexShrink: 0,
          position: 'relative',
        }}>
          {/* Rust rule top */}
          <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:C.rust, opacity:0.85 }}/>
          <div style={{ position:'absolute', top:3, left:0, right:0, height:1, background:C.rust, opacity:0.25 }}/>

          {/* Left header — location */}
          <div style={{
            width: 'clamp(160px,14vw,200px)', flexShrink:0,
            borderRight: `1px solid ${C.border}`,
            padding: 'clamp(10px,1.2vh,14px) clamp(10px,1.2vw,16px)',
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          }}>
            <div style={{ fontFamily: MONO, fontSize: 'clamp(8px,0.75vw,10px)', letterSpacing: '0.2em', color: C.faded, textTransform: 'uppercase', lineHeight: 1.5 }}>
              SAN FRANCISCO<br/>CALIFORNIA
            </div>
          </div>

          {/* Center — Current Conditions */}
          <div style={{ flex:1, padding: 'clamp(8px,1vh,12px) clamp(12px,1.5vw,20px)', display:'flex', flexDirection:'column', gap: 'clamp(6px,0.8vh,8px)' }}>
            <div style={{ fontFamily: FONT, fontSize: 'clamp(9px,0.85vw,11px)', letterSpacing: '0.28em', color: C.rust, fontWeight:700, textTransform:'uppercase' }}>
              Current Conditions
            </div>
            <div style={{ display:'flex', gap:'clamp(6px,0.8vw,10px)', flexWrap:'wrap' }}>
              {[
                { label:'TRAIL NOTES',     sub:'311 Reports',      val: stats?.enc     ?? '—', color: C.orange },
                { label:'POLICE ACTIVITY', sub:'Dispatched Calls', val: stats?.police  ?? '—', color: C.creek },
                { label:'FIRE / EMS',      sub:'Dispatch Calls',   val: stats?.fire    ?? '—', color: C.rust },
                { label:'SUPPORT SITES',   sub:'Resources',        val: stats?.support ?? '—', color: C.forest },
              ].map(s => (
                <div key={s.label} style={{
                  border: `1px solid ${C.border}`,
                  padding: 'clamp(5px,0.6vh,8px) clamp(8px,0.9vw,12px)',
                  background: C.canvas,
                  minWidth: 'clamp(80px,8vw,110px)',
                  flex: '1 1 80px',
                }}>
                  <div style={{ fontFamily: FONT, fontSize: 'clamp(8px,0.75vw,9px)', letterSpacing: '0.18em', fontWeight:700, textTransform:'uppercase', color: C.charcoal }}>{s.label}</div>
                  <div style={{ fontFamily: MONO, fontSize: 'clamp(7px,0.7vw,8px)', color: C.faded, marginTop:1 }}>{s.sub}</div>
                  <div style={{ fontFamily: FONT, fontSize: 'clamp(20px,2.2vw,30px)', fontWeight:700, color: s.color, lineHeight:1, marginTop:3 }}>
                    {loading ? '—' : s.val}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Last updated */}
          <div style={{
            width: 'clamp(110px,10vw,140px)', flexShrink:0,
            borderLeft: `1px solid ${C.border}`,
            padding: 'clamp(8px,1vh,12px) clamp(10px,1.2vw,14px)',
            display:'flex', flexDirection:'column', justifyContent:'center', gap:4,
          }}>
            <div style={{ fontFamily: FONT, fontSize: 'clamp(8px,0.75vw,9px)', letterSpacing: '0.2em', fontWeight:700, textTransform:'uppercase', color: C.charcoal }}>Last Updated</div>
            <div style={{ fontFamily: MONO, fontSize: 'clamp(8px,0.75vw,9px)', color: C.faded, lineHeight:1.6 }}>
              {stats ? fmtDate(stats.updated) : '—'}<br/>
              {stats ? fmtTime(stats.updated) : '—'}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:2 }}>
              <div className="sfg-pulse" style={{ width:6, height:6, borderRadius:'50%', background: live ? C.forest : C.leather, flexShrink:0 }}/>
              <span style={{ fontFamily: MONO, fontSize: 'clamp(7px,0.7vw,8px)', color: C.faded, textTransform:'uppercase', letterSpacing:'0.12em' }}>{live ? 'Live' : 'Cached'}</span>
            </div>
          </div>
        </header>

        {/* ── BODY ───────────────────────────────────────────────────────── */}
        <div className="sfg-body" style={{ flex:1, display:'flex', minHeight:0, overflow:'hidden' }}>

          {/* LEFT NAV */}
          <div className="sfg-left" style={{
            width: 'clamp(160px,14vw,200px)', flexShrink:0,
            borderRight: `1px solid ${C.border}`,
            background: C.paper,
            display:'flex', flexDirection:'column',
            overflow:'hidden',
          }}>
            {/* Logo */}
            <div style={{
              padding: 'clamp(12px,1.5vh,18px) clamp(10px,1.2vw,16px)',
              borderBottom: `1px solid ${C.border}`,
              flexShrink:0,
            }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                {/* Tree — simple CSS, no SVG blob */}
                <div style={{ flexShrink:0, marginTop:2 }}>
                  <div style={{ width:0, height:0, borderLeft:'9px solid transparent', borderRight:'9px solid transparent', borderBottom:`14px solid ${C.forest}`, opacity:0.85 }}/>
                  <div style={{ width:0, height:0, borderLeft:'12px solid transparent', borderRight:'12px solid transparent', borderBottom:`16px solid ${C.forest}`, marginTop:-4, marginLeft:-3, opacity:0.85 }}/>
                  <div style={{ width:6, height:6, background:C.leather, margin:'0 auto', opacity:0.7 }}/>
                </div>
                <div>
                  <div style={{ fontFamily: FONT, fontSize:'clamp(20px,2.2vw,28px)', fontWeight:700, color:C.forest, lineHeight:0.92, letterSpacing:'-0.01em', textTransform:'uppercase' }}>
                    FIELD<br/>GUIDE
                  </div>
                  <div style={{ fontFamily: FONT, fontSize:'clamp(7px,0.7vw,8px)', letterSpacing:'0.22em', color:C.rust, textTransform:'uppercase', marginTop:5, fontWeight:700, lineHeight:1.3 }}>
                    URBAN OBSERVATION<br/>MAP
                  </div>
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav style={{ flex:1, padding:'clamp(4px,0.5vh,6px) 0', overflowY:'auto' }}>
              {NAV.map(item => (
                <button
                  key={item.key}
                  className={`sfg-nav-btn${activeNav === item.key ? ' active' : ''}`}
                  onClick={() => setActiveNav(item.key)}
                >
                  <div>
                    <div style={{ fontFamily: FONT, fontSize:'clamp(9px,0.9vw,11px)', letterSpacing:'0.16em', fontWeight:700, textTransform:'uppercase', color: activeNav === item.key ? C.rust : C.charcoal }}>{item.label}</div>
                    <div style={{ fontFamily: MONO, fontSize:'clamp(8px,0.75vw,9px)', color:C.faded, marginTop:1 }}>{item.sub}</div>
                  </div>
                </button>
              ))}
            </nav>

            {/* Overlay toggles */}
            <div style={{ padding:'clamp(8px,1vh,12px) clamp(10px,1.2vw,14px)', borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
              <div style={{ fontFamily: FONT, fontSize:'clamp(8px,0.75vw,9px)', letterSpacing:'0.22em', fontWeight:700, textTransform:'uppercase', color:C.charcoal, marginBottom:6 }}>Overlays</div>
              {(Object.keys(overlays) as (keyof typeof overlays)[]).map(key => {
                const meta = CAT_META[key];
                return (
                  <div key={key} className="sfg-ov-row" onClick={() => toggleOverlay(key)}>
                    <div style={{
                      width:13, height:13, flexShrink:0,
                      border:`1.5px solid ${meta.color}`,
                      background: overlays[key] ? meta.color : 'transparent',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      transition:'background 0.15s',
                    }}>
                      {overlays[key] && <span style={{ fontFamily:MONO, fontSize:8, color:'white', lineHeight:1 }}>✓</span>}
                    </div>
                    <span style={{ fontFamily:FONT, fontSize:'clamp(9px,0.9vw,10px)', color:C.charcoal, opacity:0.85 }}>{meta.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{ padding:'clamp(8px,1vh,10px) clamp(10px,1.2vw,14px)', borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
              <GitHubStar/>
            </div>
          </div>

          {/* MAP — hero */}
          <div className="sfg-map-col" style={{ flex:1, minWidth:0, position:'relative', background:C.canvas }}>
            <FieldMap observations={obs} overlays={overlays}/>
          </div>

          {/* RIGHT PANEL */}
          <div className="sfg-right" style={{
            width: 'clamp(200px,18vw,250px)', flexShrink:0,
            borderLeft: `1px solid ${C.border}`,
            background: C.paper,
            display:'flex', flexDirection:'column',
            overflow:'hidden',
          }}>

            {/* Latest Observations */}
            <div style={{ flex:1, display:'flex', flexDirection:'column', minHeight:0, borderBottom:`1px solid ${C.border}` }}>
              <div style={{ padding:'clamp(8px,1vh,12px) clamp(10px,1.2vw,14px)', borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
                <div style={{ fontFamily:FONT, fontSize:'clamp(9px,0.9vw,10px)', letterSpacing:'0.24em', fontWeight:700, textTransform:'uppercase', color:C.charcoal }}>
                  Latest Observations
                </div>
              </div>
              <div className="sfg-scroll sfg-fade" style={{ flex:1, overflowY:'auto', padding:'0 clamp(10px,1.2vw,14px)' }}>
                {loading ? (
                  <div style={{ padding:'16px 0', fontFamily:MONO, fontSize:10, color:C.faded, letterSpacing:'0.12em' }}>Consulting field notes…</div>
                ) : obs.slice(0, 12).map(o => {
                  const meta = CAT_META[o.cat];
                  return (
                    <div key={o.id} className="sfg-obs-row">
                      <div style={{
                        width:18, height:18, borderRadius: o.cat === 'fire' ? '2px' : o.cat === 'police' ? '3px' : '50%',
                        background:meta.color, display:'flex', alignItems:'center', justifyContent:'center',
                        flexShrink:0, marginTop:1,
                      }}>
                        <span style={{ fontFamily:MONO, fontSize:8, color:'white', fontWeight:700 }}>{meta.symbol}</span>
                      </div>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontFamily:MONO, fontSize:'clamp(8px,0.75vw,9px)', color:C.faded, letterSpacing:'0.08em' }}>{relTime(o.ts)}</div>
                        <div style={{ fontFamily:FONT, fontSize:'clamp(11px,1.05vw,13px)', color:C.charcoal, fontWeight:600, lineHeight:1.25, marginTop:1 }}>{o.label}</div>
                        <div style={{ fontFamily:MONO, fontSize:'clamp(8px,0.75vw,9px)', color:C.faded, marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                          {o.address || o.neighborhood}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Field Alert */}
            <div style={{ padding:'clamp(10px,1.2vh,14px) clamp(10px,1.2vw,14px)', flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                <div style={{ width:14, height:14, border:`1.5px solid ${C.orange}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontFamily:MONO, fontSize:8, color:C.orange, fontWeight:700, lineHeight:1 }}>!</span>
                </div>
                <span style={{ fontFamily:FONT, fontSize:'clamp(9px,0.9vw,10px)', letterSpacing:'0.22em', fontWeight:700, textTransform:'uppercase', color:C.charcoal }}>Field Alert</span>
              </div>
              <p style={{ fontFamily:FONT, fontSize:'clamp(11px,1.05vw,13px)', color:C.charcoal, lineHeight:1.55, opacity:0.82, margin:0 }}>
                Increased reports in {topHood}. Outreach teams active in surrounding area.
              </p>
              <button
                onClick={load}
                style={{
                  marginTop:10, background:'none', border:`1px solid ${C.border}`,
                  padding:'4px 10px', cursor:'pointer', fontFamily:MONO,
                  fontSize:'clamp(8px,0.75vw,9px)', letterSpacing:'0.16em',
                  textTransform:'uppercase', color:C.faded,
                  transition:'color 0.15s, border-color 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.rust; (e.currentTarget as HTMLElement).style.borderColor = C.rust + '88'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.faded; (e.currentTarget as HTMLElement).style.borderColor = C.border; }}
              >
                ↺ Refresh
              </button>
            </div>

          </div>
        </div>

      </div>
    </>
  );
}
