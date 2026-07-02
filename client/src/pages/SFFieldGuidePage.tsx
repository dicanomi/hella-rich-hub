/**
 * SF FIELD GUIDE — hella.rich
 *
 * Layout: Left sidebar nav | Center map | Right observations panel | Bottom legend bar
 * Design: National Park Service 1967 × USGS topographic × WPA park graphics
 * Reference: printed ranger handbook adapted for the web
 *
 * Data: SF Open Data (Socrata) — free, no key required
 * Graceful fallback to demo data on fetch failure
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { HellaRichSEO } from '../components/HellaRichSEO';

// ─── Tokens ────────────────────────────────────────────────────────────────
const C = {
  canvas:     '#F2E8D5',
  paper:      '#EDE0C4',
  paperDark:  '#E0D0B0',
  forest:     '#3D5A35',
  forestDark: '#2C4128',
  moss:       '#5C6B4A',
  sage:       '#8A9478',
  leather:    '#7A4E2D',
  rust:       '#B84B28',
  orange:     '#C96830',
  creekBlue:  '#4A7A8A',
  navy:       '#2E4A6A',
  charcoal:   '#2A2820',
  ink:        '#1C1A16',
  faded:      'rgba(42,40,32,0.5)',
  fadedLight: 'rgba(42,40,32,0.18)',
  fadedXLight:'rgba(42,40,32,0.09)',
  border:     'rgba(42,40,32,0.22)',
};

const FONT_COND   = "'IBM Plex Sans Condensed', 'Arial Narrow', 'Trade Gothic', sans-serif";
const FONT_SERIF  = "'Playfair Display', 'Georgia', serif";
const FONT_MONO   = "'IBM Plex Mono', 'Courier New', monospace";

// ─── Types ─────────────────────────────────────────────────────────────────
interface Observation {
  id: string;
  category: 'encampment' | 'police' | 'fire' | 'support' | 'medical' | 'food' | 'restroom';
  label: string;
  neighborhood: string;
  address: string;
  timestamp: string;
  status?: string;
  lat?: number;
  lng?: number;
}

interface Stats {
  trailNotes: number;
  policeActivity: number;
  fireEMS: number;
  supportSites: number;
  lastUpdated: string;
}

// ─── SF Neighborhood map centroids (SVG 760×640 canvas) ────────────────────
// Calibrated to match the reference image geography
const ZONES: Record<string, [number, number]> = {
  'Presidio':           [148, 175],
  'Richmond District':  [195, 235],
  'Golden Gate Park':   [230, 310],
  'Sunset District':    [175, 390],
  'Ingleside':          [255, 490],
  'Excelsior':          [340, 510],
  'Visitacion Valley':  [440, 545],
  'Bayview':            [520, 460],
  'Potrero Hill':       [490, 360],
  'The Mission':        [420, 360],
  'SoMa':               [460, 290],
  'Haight-Ashbury':     [310, 330],
  'Twin Peaks':         [295, 415],
  'Pacific Heights':    [300, 220],
  'Marina':             [330, 165],
  'North Beach':        [430, 190],
  'Russian Hill':       [400, 215],
  'Chinatown':          [450, 245],
  'Financial District': [490, 250],
  'Tenderloin':         [420, 280],
  'Civic Center':       [400, 305],
  'Noe Valley':         [370, 400],
  'Bernal Heights':     [430, 430],
  'Glen Park':          [355, 455],
  'Portola':            [390, 490],
};

const SF_NEIGHBORHOODS = Object.keys(ZONES);

// ─── Category metadata ─────────────────────────────────────────────────────
const CAT: Record<string, { label: string; color: string; icon: string; bg: string }> = {
  encampment: { label: '311 Encampment',   color: C.orange,    icon: '⚠', bg: '#C9680020' },
  police:     { label: 'Police Activity',  color: C.navy,      icon: '✦', bg: '#2E4A6A20' },
  fire:       { label: 'Fire / EMS',       color: C.rust,      icon: '▲', bg: '#B84B2820' },
  support:    { label: 'Support Services', color: C.forest,    icon: '⌂', bg: '#3D5A3520' },
  medical:    { label: 'Medical Aid',      color: C.creekBlue, icon: '+', bg: '#4A7A8A20' },
  food:       { label: 'Food Resource',    color: C.moss,      icon: '◈', bg: '#5C6B4A20' },
  restroom:   { label: 'Restroom',         color: C.leather,   icon: '◻', bg: '#7A4E2D20' },
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function rnd(arr: string[]) { return arr[Math.floor(Math.random() * arr.length)]; }
function hoursAgo(h: number) { return new Date(Date.now() - h * 3600000).toISOString(); }

function relTime(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 2) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtTime(iso: string): string {
  try { return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }); }
  catch { return '—'; }
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
  } catch { return '—'; }
}

// ─── Demo data ──────────────────────────────────────────────────────────────
function buildDemo(): { observations: Observation[]; stats: Stats } {
  const obs: Observation[] = [
    { id:'1', category:'encampment', label:'Encampment reported', neighborhood:'The Mission',  address:'16th St & Mission St', timestamp: hoursAgo(0.05) },
    { id:'2', category:'police',     label:'Police activity',     neighborhood:'SoMa',          address:'Market St & 8th St',   timestamp: hoursAgo(0.2) },
    { id:'3', category:'medical',    label:'Medical aid',         neighborhood:'Civic Center',  address:'Civic Center Plaza',   timestamp: hoursAgo(0.3) },
    { id:'4', category:'encampment', label:'Encampment reported', neighborhood:'SoMa',          address:'Bryant St & 7th St',   timestamp: hoursAgo(0.45) },
    { id:'5', category:'fire',       label:'Fire department response', neighborhood:'Potrero Hill', address:'Potrero Ave & 18th St', timestamp: hoursAgo(0.58) },
    { id:'6', category:'police',     label:'Police activity',     neighborhood:'Tenderloin',    address:'Turk & Hyde St',       timestamp: hoursAgo(1.1) },
    { id:'7', category:'support',    label:'Support services',    neighborhood:'Haight-Ashbury',address:'Haight & Masonic',     timestamp: hoursAgo(1.5) },
    { id:'8', category:'encampment', label:'Encampment reported', neighborhood:'Richmond District', address:'Geary & 6th Ave',  timestamp: hoursAgo(2.2) },
    { id:'9', category:'fire',       label:'Fire dispatch',       neighborhood:'North Beach',   address:'Columbus & Broadway',  timestamp: hoursAgo(2.8) },
    { id:'10',category:'police',     label:'Police call',         neighborhood:'Bayview',       address:'3rd & Cesar Chavez',   timestamp: hoursAgo(3.5) },
    { id:'11',category:'support',    label:'Outreach services',   neighborhood:'Excelsior',     address:'Mission & Geneva',     timestamp: hoursAgo(4.0) },
    { id:'12',category:'encampment', label:'Encampment reported', neighborhood:'Sunset District',address:'Irving & 19th Ave',   timestamp: hoursAgo(5.0) },
  ];
  // Assign approximate coords
  obs.forEach(o => {
    const c = ZONES[o.neighborhood];
    if (c) { o.lat = c[1]; o.lng = c[0]; }
  });
  return {
    observations: obs,
    stats: { trailNotes: 246, policeActivity: 128, fireEMS: 43, supportSites: 87, lastUpdated: new Date().toISOString() },
  };
}

// ─── Live data fetch ─────────────────────────────────────────────────────────
async function fetchLive(): Promise<{ observations: Observation[]; stats: Stats }> {
  const ft = (url: string) => fetch(url, { signal: AbortSignal.timeout(6000) });
  const obs: Observation[] = [];
  let trailNotes = 0, policeActivity = 0, fireEMS = 0, supportSites = 87;

  const [encR, polR, firR] = await Promise.allSettled([
    ft('https://data.sfgov.org/resource/vw6y-z8j6.json?$where=service_subtype=%27Encampments%27&$limit=50&$order=requested_datetime%20DESC'),
    ft('https://data.sfgov.org/resource/gnap-fj3t.json?$limit=50&$order=dispatch_dttm%20DESC'),
    ft('https://data.sfgov.org/resource/nuek-vuh3.json?$limit=50&$order=entry_dttm%20DESC'),
  ]);

  if (encR.status === 'fulfilled' && encR.value.ok) {
    const d = await encR.value.json();
    trailNotes = d.length;
    d.slice(0, 6).forEach((r: Record<string,string>, i: number) => {
      const nbr = r.neighborhoods_sffind_boundaries || rnd(SF_NEIGHBORHOODS);
      const c = ZONES[nbr] || [300, 300];
      obs.push({ id:`enc-${i}`, category:'encampment', label:'Encampment reported', neighborhood: nbr,
        address: r.address || '', timestamp: r.requested_datetime || new Date().toISOString(),
        status: r.service_request_status, lat: c[1], lng: c[0] });
    });
  }
  if (polR.status === 'fulfilled' && polR.value.ok) {
    const d = await polR.value.json();
    policeActivity = d.length;
    d.slice(0, 5).forEach((r: Record<string,string>, i: number) => {
      const nbr = r.analysis_neighborhood || rnd(SF_NEIGHBORHOODS);
      const c = ZONES[nbr] || [350, 300];
      obs.push({ id:`pol-${i}`, category:'police', label: r.call_type_final_desc || 'Police activity', neighborhood: nbr,
        address: r.intersection_name || '', timestamp: r.dispatch_dttm || new Date().toISOString(),
        lat: c[1], lng: c[0] });
    });
  }
  if (firR.status === 'fulfilled' && firR.value.ok) {
    const d = await firR.value.json();
    fireEMS = d.length;
    d.slice(0, 4).forEach((r: Record<string,string>, i: number) => {
      const nbr = r.neighborhoods_analysis_boundaries || rnd(SF_NEIGHBORHOODS);
      const c = ZONES[nbr] || [400, 300];
      obs.push({ id:`fir-${i}`, category:'fire', label: r.call_type_final_desc || 'Fire / EMS dispatch', neighborhood: nbr,
        address: r.address || '', timestamp: r.entry_dttm || new Date().toISOString(),
        lat: c[1], lng: c[0] });
    });
  }

  if (obs.length === 0) throw new Error('no data');
  obs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return { observations: obs, stats: { trailNotes, policeActivity, fireEMS, supportSites, lastUpdated: new Date().toISOString() } };
}

// ─── SVG Map ────────────────────────────────────────────────────────────────
// Full SF peninsula, hand-drawn feel, topographic, printed atlas style
function SFMap({ observations, overlays }: { observations: Observation[]; overlays: Record<string, boolean> }) {
  // Aggregate pins by zone
  const pins: { x: number; y: number; cat: string; count: number }[] = [];
  const byZone: Record<string, { cat: string; count: number }> = {};
  for (const o of observations) {
    if (!overlays[o.category]) continue;
    const key = o.neighborhood;
    if (!byZone[key]) byZone[key] = { cat: o.category, count: 0 };
    byZone[key].count++;
  }
  for (const [nbr, d] of Object.entries(byZone)) {
    const c = ZONES[nbr];
    if (c) pins.push({ x: c[0], y: c[1], cat: d.cat, count: d.count });
  }

  return (
    <svg viewBox="0 0 760 640" style={{ width: '100%', height: '100%', display: 'block' }} aria-label="San Francisco field map">
      <defs>
        {/* Paper texture */}
        <filter id="sfg-paper" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" seed="2" result="noise"/>
          <feColorMatrix type="saturate" values="0" in="noise" result="gray"/>
          <feBlend in="SourceGraphic" in2="gray" mode="multiply"/>
        </filter>
        {/* Rough edge displacement */}
        <filter id="sfg-rough">
          <feTurbulence type="turbulence" baseFrequency="0.025" numOctaves="3" seed="5" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
        {/* Glow for hot spots */}
        <filter id="sfg-glow">
          <feGaussianBlur stdDeviation="6" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
        <radialGradient id="sfg-hotspot-enc" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.orange} stopOpacity="0.55"/>
          <stop offset="100%" stopColor={C.orange} stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="sfg-hotspot-pol" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.navy} stopOpacity="0.4"/>
          <stop offset="100%" stopColor={C.navy} stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="sfg-hotspot-fir" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.rust} stopOpacity="0.45"/>
          <stop offset="100%" stopColor={C.rust} stopOpacity="0"/>
        </radialGradient>
      </defs>

      {/* ── Ocean / Bay ── */}
      <rect x="0" y="0" width="760" height="640" fill="#B8CDD4" opacity="0.45"/>

      {/* ── SF Peninsula body ── */}
      <path
        d="M 110,30 L 160,18 L 220,14 L 290,12 L 360,14 L 430,18 L 490,26 L 540,38 L 570,55 L 585,80 L 592,110 L 590,145 L 580,180 L 565,215 L 548,250 L 530,285 L 512,320 L 495,355 L 478,390 L 460,425 L 440,458 L 415,488 L 388,512 L 358,530 L 325,542 L 290,548 L 255,545 L 220,535 L 188,518 L 160,495 L 136,468 L 116,438 L 100,405 L 88,370 L 80,335 L 76,298 L 75,260 L 78,222 L 84,185 L 92,148 L 100,112 L 107,72 Z"
        fill={C.canvas}
        stroke={C.charcoal}
        strokeWidth="1.2"
        filter="url(#sfg-rough)"
      />

      {/* ── Contour lines ── */}
      {[
        "M 130,80 Q 300,60 480,90 Q 560,110 570,160 Q 575,220 540,280 Q 500,340 450,390 Q 390,440 320,470 Q 250,495 185,470 Q 130,445 108,390 Q 88,335 90,270 Q 92,200 115,145 Z",
        "M 155,95 Q 310,78 470,105 Q 545,125 552,172 Q 556,228 524,285 Q 487,342 440,388 Q 382,435 315,462 Q 248,485 188,460 Q 138,436 118,383 Q 100,330 102,268 Q 104,200 128,148 Z",
      ].map((d, i) => (
        <path key={i} d={d} fill="none" stroke={C.moss} strokeWidth="0.5" opacity={0.22 - i * 0.06}/>
      ))}

      {/* ── Survey grid ── */}
      {[120,180,240,300,360,420,480,540].map(x => (
        <line key={`gx${x}`} x1={x} y1="12" x2={x} y2="548" stroke={C.charcoal} strokeWidth="0.3" opacity="0.12" strokeDasharray="3,9"/>
      ))}
      {[80,140,200,260,320,380,440,500].map(y => (
        <line key={`gy${y}`} x1="75" y1={y} x2="592" y2={y} stroke={C.charcoal} strokeWidth="0.3" opacity="0.12" strokeDasharray="3,9"/>
      ))}
      {/* Grid labels A-G (x) */}
      {['A','B','C','D','E','F','G'].map((l, i) => (
        <text key={l} x={120 + i * 60} y="570" textAnchor="middle" fontFamily={FONT_MONO} fontSize="9" fill={C.charcoal} opacity="0.4">{l}</text>
      ))}
      {/* Grid labels 1-6 (y) */}
      {[1,2,3,4,5,6].map((n, i) => (
        <text key={n} x="92" y={100 + i * 80} textAnchor="middle" fontFamily={FONT_MONO} fontSize="9" fill={C.charcoal} opacity="0.4">{n}</text>
      ))}

      {/* ── Water labels ── */}
      <text x="52" y="300" fontFamily={FONT_COND} fontSize="11" fill={C.creekBlue} opacity="0.6" transform="rotate(-90,52,300)" letterSpacing="0.12em">PACIFIC OCEAN</text>
      <text x="640" y="280" fontFamily={FONT_COND} fontSize="10" fill={C.creekBlue} opacity="0.55" transform="rotate(90,640,280)" letterSpacing="0.1em">SAN FRANCISCO BAY</text>

      {/* ── Golden Gate strait ── */}
      <path d="M 108,50 Q 180,30 260,28" fill="none" stroke={C.creekBlue} strokeWidth="1.2" opacity="0.5" strokeDasharray="5,4"/>
      <text x="185" y="22" textAnchor="middle" fontFamily={FONT_COND} fontSize="9" fill={C.creekBlue} opacity="0.65" letterSpacing="0.1em">Golden Gate</text>

      {/* ── Parks ── */}
      {/* Golden Gate Park */}
      <rect x="148" y="282" width="168" height="52" rx="2" fill={C.moss} opacity="0.22" filter="url(#sfg-rough)"/>
      <text x="232" y="312" textAnchor="middle" fontFamily={FONT_COND} fontSize="9" fill={C.forestDark} opacity="0.7" letterSpacing="0.08em">Golden Gate Park</text>
      {/* Presidio */}
      <ellipse cx="148" cy="175" rx="52" ry="42" fill={C.moss} opacity="0.18" filter="url(#sfg-rough)"/>
      <text x="148" y="178" textAnchor="middle" fontFamily={FONT_COND} fontSize="9" fill={C.forestDark} opacity="0.65" letterSpacing="0.06em">Presidio</text>

      {/* ── Major roads ── */}
      {/* Market St diagonal */}
      <path d="M 340,540 L 500,270" stroke={C.charcoal} strokeWidth="1.2" opacity="0.28"/>
      {/* 101 freeway */}
      <path d="M 490,560 L 490,200" stroke={C.charcoal} strokeWidth="1.8" opacity="0.2" strokeDasharray="8,4"/>
      <circle cx="490" cy="560" r="10" fill="none" stroke={C.charcoal} strokeWidth="1" opacity="0.25"/>
      <text x="490" y="564" textAnchor="middle" fontFamily={FONT_MONO} fontSize="7" fill={C.charcoal} opacity="0.4">101</text>
      <circle cx="490" cy="200" r="10" fill="none" stroke={C.charcoal} strokeWidth="1" opacity="0.25"/>
      <text x="490" y="204" textAnchor="middle" fontFamily={FONT_MONO} fontSize="7" fill={C.charcoal} opacity="0.4">101</text>
      {/* Van Ness */}
      <line x1="390" y1="30" x2="370" y2="540" stroke={C.charcoal} strokeWidth="0.8" opacity="0.2"/>
      {/* Geary */}
      <line x1="100" y1="235" x2="490" y2="225" stroke={C.charcoal} strokeWidth="0.8" opacity="0.18"/>
      {/* Mission */}
      <line x1="300" y1="540" x2="500" y2="270" stroke={C.charcoal} strokeWidth="0.8" opacity="0.18"/>

      {/* ── Neighborhood labels ── */}
      {[
        ['MARINA DISTRICT', 330, 155],
        ['NORTH BEACH', 455, 178],
        ['RUSSIAN HILL', 415, 205],
        ['PACIFIC HEIGHTS', 295, 215],
        ['RICHMOND DISTRICT', 198, 248],
        ['HAIGHT ASHBURY', 308, 340],
        ['THE MISSION', 418, 368],
        ['SOMA', 468, 295],
        ['POTRERO HILL', 498, 368],
        ['SUNSET DISTRICT', 172, 408],
        ['TWIN PEAKS', 295, 428],
        ['EXCELSIOR', 345, 518],
        ['BAYVIEW', 528, 468],
        ['INGLESIDE', 255, 498],
        ['VISITACION VALLEY', 438, 555],
      ].map(([label, x, y]) => (
        <text key={label as string} x={x as number} y={y as number} textAnchor="middle"
          fontFamily={FONT_COND} fontSize="8.5" fill={C.charcoal} opacity="0.42"
          letterSpacing="0.08em" fontWeight="600">
          {(label as string).toUpperCase()}
        </text>
      ))}

      {/* ── Zoom controls (decorative) ── */}
      <g transform="translate(108, 148)">
        <rect x="0" y="0" width="22" height="22" fill={C.paper} stroke={C.border} strokeWidth="0.8"/>
        <text x="11" y="15" textAnchor="middle" fontFamily={FONT_MONO} fontSize="14" fill={C.charcoal} opacity="0.6">+</text>
        <rect x="0" y="24" width="22" height="22" fill={C.paper} stroke={C.border} strokeWidth="0.8"/>
        <text x="11" y="39" textAnchor="middle" fontFamily={FONT_MONO} fontSize="14" fill={C.charcoal} opacity="0.6">−</text>
        <rect x="0" y="48" width="22" height="22" fill={C.paper} stroke={C.border} strokeWidth="0.8"/>
        <text x="11" y="63" textAnchor="middle" fontFamily={FONT_MONO} fontSize="11" fill={C.charcoal} opacity="0.6">⊕</text>
      </g>

      {/* ── Hotspot glows ── */}
      {pins.map((p, i) => {
        const r = Math.min(18 + p.count * 8, 48);
        const gradId = p.cat === 'encampment' ? 'sfg-hotspot-enc' : p.cat === 'police' ? 'sfg-hotspot-pol' : 'sfg-hotspot-fir';
        return (
          <circle key={`glow-${i}`} cx={p.x} cy={p.y} r={r} fill={`url(#${gradId})`} opacity="0.9"/>
        );
      })}

      {/* ── Observation pins ── */}
      {pins.map((p, i) => {
        const meta = CAT[p.cat] || CAT.encampment;
        const jx = p.x + (i % 3 - 1) * 4;
        const jy = p.y + (i % 2 === 0 ? -2 : 2);
        return (
          <g key={`pin-${i}`} transform={`translate(${jx},${jy})`}>
            <circle cx="0" cy="0" r="9" fill={meta.color} opacity="0.92" stroke={C.canvas} strokeWidth="1.2"/>
            <text x="0" y="4" textAnchor="middle" fontFamily={FONT_MONO} fontSize="8" fill="white" fontWeight="700">{meta.icon}</text>
          </g>
        );
      })}

      {/* ── Scale bar ── */}
      <g transform="translate(440, 578)">
        <line x1="0" y1="0" x2="120" y2="0" stroke={C.charcoal} strokeWidth="1" opacity="0.5"/>
        <line x1="0" y1="-4" x2="0" y2="4" stroke={C.charcoal} strokeWidth="1" opacity="0.5"/>
        <line x1="40" y1="-3" x2="40" y2="3" stroke={C.charcoal} strokeWidth="0.8" opacity="0.4"/>
        <line x1="80" y1="-3" x2="80" y2="3" stroke={C.charcoal} strokeWidth="0.8" opacity="0.4"/>
        <line x1="120" y1="-4" x2="120" y2="4" stroke={C.charcoal} strokeWidth="1" opacity="0.5"/>
        <text x="0"   y="-7" textAnchor="middle" fontFamily={FONT_MONO} fontSize="7" fill={C.charcoal} opacity="0.5">0</text>
        <text x="40"  y="-7" textAnchor="middle" fontFamily={FONT_MONO} fontSize="7" fill={C.charcoal} opacity="0.5">0.5</text>
        <text x="80"  y="-7" textAnchor="middle" fontFamily={FONT_MONO} fontSize="7" fill={C.charcoal} opacity="0.5">1</text>
        <text x="120" y="-7" textAnchor="middle" fontFamily={FONT_MONO} fontSize="7" fill={C.charcoal} opacity="0.5">1.5</text>
        <text x="60"  y="13" textAnchor="middle" fontFamily={FONT_MONO} fontSize="7" fill={C.charcoal} opacity="0.4">2 MI.</text>
      </g>
    </svg>
  );
}

// ─── Patch SVG ──────────────────────────────────────────────────────────────
function Patch({ label, sub, color, icon }: { label: string; sub: string; color: string; icon: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      width: 80, flexShrink: 0,
    }}>
      <div style={{
        width: 72, height: 82,
        background: `linear-gradient(160deg, ${color}22, ${color}44)`,
        border: `2px solid ${color}88`,
        borderRadius: '4px 4px 36px 36px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '4px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* inner border */}
        <div style={{
          position: 'absolute', inset: '4px',
          border: `1px solid ${color}55`,
          borderRadius: '2px 2px 32px 32px',
          pointerEvents: 'none',
        }}/>
        <div style={{ fontSize: '22px', lineHeight: 1 }}>{icon}</div>
        <div style={{ fontFamily: FONT_COND, fontSize: '8px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color, textAlign: 'center', lineHeight: 1.2, padding: '0 6px' }}>{label}</div>
      </div>
      <div style={{ fontFamily: FONT_MONO, fontSize: '8px', color: C.faded, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px', textAlign: 'center' }}>{sub}</div>
    </div>
  );
}

// ─── GitHub Star Footer ─────────────────────────────────────────────────────
function GitHubStar() {
  const [stars, setStars] = useState<number | null>(null);
  useEffect(() => {
    fetch('https://api.github.com/repos/dicanomi/hella-rich-hub')
      .then(r => r.json())
      .then(d => { if (typeof d.stargazers_count === 'number') setStars(d.stargazers_count); })
      .catch(() => {});
  }, []);
  return (
    <a href="https://github.com/dicanomi" target="_blank" rel="noopener noreferrer"
      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontFamily: FONT_MONO, fontSize: '9px', letterSpacing: '0.14em', color: C.faded, textDecoration: 'none', transition: 'color 0.18s' }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = C.rust)}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = C.faded)}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.11.82-.26.82-.58v-2.03c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02.005 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
      </svg>
      ★ {stars !== null ? stars : '—'}
    </a>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
const PATCHES = [
  { label: 'Twin Peaks', sub: 'Observer',  color: C.forest,    icon: '⛰' },
  { label: 'Mission',    sub: 'Survey',    color: C.leather,   icon: '⛪' },
  { label: 'Golden Gate',sub: 'Ranger',    color: C.creekBlue, icon: '🌉' },
  { label: 'Ocean Beach',sub: 'Watch',     color: C.navy,      icon: '🌊' },
  { label: 'Fog Patrol', sub: '',          color: C.moss,      icon: '🌫' },
];

const NAV_ITEMS = [
  { key: 'map',       icon: '⊞', label: 'FIELD GUIDE',    sub: 'Overview Map' },
  { key: 'notes',     icon: '≡', label: 'TRAIL NOTES',    sub: 'View Reports' },
  { key: 'ranger',    icon: '≡', label: 'RANGER REPORTS', sub: 'Daily Updates' },
  { key: 'waypoints', icon: '⊙', label: 'WAYPOINTS',      sub: 'Resources & Services' },
  { key: 'overlays',  icon: '⊕', label: 'OVERLAYS',       sub: 'Map Layers' },
  { key: 'patches',   icon: '⬡', label: 'PATCHES',        sub: 'My Badges' },
  { key: 'settings',  icon: '⚙', label: 'SETTINGS',       sub: 'Preferences' },
];

const OVERLAY_KEYS = ['encampment', 'police', 'fire', 'support', 'restroom', 'food'] as const;

export default function SFFieldGuidePage() {
  const [data, setData] = useState<{ observations: Observation[]; stats: Stats } | null>(null);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(true);
  const [activeNav, setActiveNav] = useState('map');
  const [overlays, setOverlays] = useState<Record<string, boolean>>({
    encampment: true, police: true, fire: true, support: true, restroom: false, food: false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchLive();
      setData(d); setLive(true);
    } catch {
      setData(buildDemo()); setLive(false);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const obs = data?.observations ?? [];
  const stats = data?.stats;
  const visibleObs = obs.filter(o => overlays[o.category]);

  // Weather (static — SF average)
  const weather = { temp: 58, desc: 'Partly Cloudy', wind: 'SW 6 MPH', high: 63, low: 52 };

  // Field alert derived from data
  const topNeighborhood = (() => {
    const counts: Record<string, number> = {};
    for (const o of obs) counts[o.neighborhood] = (counts[o.neighborhood] || 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'The Mission';
  })();

  return (
    <>
      <HellaRichSEO
        title="SF Field Guide — hella.rich"
        description="An urban field guide visualizing San Francisco civic conditions. NPS-inspired. Data-driven. Respectful."
        keywords="San Francisco, field guide, civic data, 311, urban conditions"
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Condensed:ital,wght@0,400;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@400;500&family=Playfair+Display:wght@700&display=swap');

        .sfg * { box-sizing: border-box; margin: 0; padding: 0; }
        .sfg { font-family: ${FONT_COND}; background: ${C.canvas}; color: ${C.ink}; }

        .sfg-nav-item {
          display: flex; align-items: flex-start; gap: 8px;
          padding: 7px 10px; cursor: pointer; border: none; background: none;
          width: 100%; text-align: left;
          border-left: 2px solid transparent;
          transition: background 0.15s, border-color 0.15s;
        }
        .sfg-nav-item:hover { background: ${C.fadedXLight}; }
        .sfg-nav-item.active { background: ${C.fadedXLight}; border-left-color: ${C.rust}; }

        .sfg-stat-box {
          border: 1px solid ${C.border};
          padding: 8px 12px;
          background: ${C.paper};
          display: flex; flex-direction: column; gap: 2px;
          min-width: 0;
        }

        .sfg-obs-row {
          display: flex; gap: 10px; align-items: flex-start;
          padding: 8px 0;
          border-bottom: 1px solid ${C.fadedXLight};
        }

        .sfg-overlay-row {
          display: flex; align-items: center; gap: 8px;
          padding: 4px 0;
          cursor: pointer;
        }
        .sfg-overlay-row:hover { opacity: 0.8; }

        @keyframes sfgFade { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
        .sfg-fade { animation: sfgFade 0.35s ease forwards; }

        @keyframes sfgPulse { 0%,100% { opacity:0.5; } 50% { opacity:1; } }
        .sfg-pulse { animation: sfgPulse 2s ease infinite; }

        /* Scrollbar */
        .sfg-scroll::-webkit-scrollbar { width: 4px; }
        .sfg-scroll::-webkit-scrollbar-track { background: transparent; }
        .sfg-scroll::-webkit-scrollbar-thumb { background: ${C.fadedLight}; border-radius: 2px; }
      `}</style>

      {/* Nav spacer */}
      <div style={{ height: 'clamp(44px,6vh,56px)' }}/>

      <div className="sfg" style={{ minHeight: 'calc(100vh - clamp(44px,6vh,56px))', display: 'flex', flexDirection: 'column' }}>

        {/* ══ TOP HEADER ══════════════════════════════════════════════════════ */}
        <div style={{
          background: C.paper,
          borderBottom: `2px solid ${C.charcoal}`,
          display: 'flex', alignItems: 'stretch',
          position: 'relative',
        }}>
          {/* Red rule */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: C.rust, opacity: 0.8 }}/>
          <div style={{ position: 'absolute', top: 3, left: 0, right: 0, height: 1, background: C.rust, opacity: 0.3 }}/>

          {/* Left sidebar header */}
          <div style={{ width: 200, flexShrink: 0, borderRight: `1px solid ${C.border}`, padding: '14px 16px 10px' }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: '0.2em', color: C.faded, textTransform: 'uppercase', marginBottom: 4 }}>
              SAN FRANCISCO<br/>CALIFORNIA
            </div>
          </div>

          {/* Center header — Current Conditions */}
          <div style={{ flex: 1, padding: '10px 16px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontFamily: FONT_COND, fontSize: 11, letterSpacing: '0.28em', color: C.rust, fontWeight: 700, textTransform: 'uppercase' }}>
              Current Conditions
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { label: 'TRAIL NOTES',     sub: '311 Reports',       val: stats?.trailNotes ?? '—',      icon: '⚠', color: C.orange },
                { label: 'POLICE ACTIVITY', sub: 'Dispatched Calls',  val: stats?.policeActivity ?? '—',  icon: '✦', color: C.navy },
                { label: 'FIRE / EMS',      sub: 'Dispatch Calls',    val: stats?.fireEMS ?? '—',         icon: '▲', color: C.rust },
                { label: 'SUPPORT SITES',   sub: 'Resources',         val: stats?.supportSites ?? '—',    icon: '⌂', color: C.forest },
              ].map(s => (
                <div key={s.label} className="sfg-stat-box" style={{ flex: '1 1 100px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 11, color: s.color }}>{s.icon}</span>
                    <span style={{ fontFamily: FONT_COND, fontSize: 9, letterSpacing: '0.18em', fontWeight: 700, textTransform: 'uppercase', color: C.charcoal }}>{s.label}</span>
                  </div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: C.faded, letterSpacing: '0.1em' }}>{s.sub}</div>
                  <div style={{ fontFamily: FONT_COND, fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1, marginTop: 2 }}>{loading ? '—' : s.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Last updated box */}
          <div style={{
            width: 130, flexShrink: 0, borderLeft: `1px solid ${C.border}`,
            padding: '10px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4,
          }}>
            <div style={{ fontFamily: FONT_COND, fontSize: 9, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase', color: C.charcoal }}>Last Updated</div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.faded }}>
              {stats ? fmtDate(stats.lastUpdated) : '—'}<br/>
              {stats ? fmtTime(stats.lastUpdated) : '—'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
              <div className="sfg-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: live ? C.forest : C.leather, flexShrink: 0 }}/>
              <span style={{ fontFamily: FONT_MONO, fontSize: 8, color: C.faded, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{live ? 'Live' : 'Cached'}</span>
            </div>
          </div>
        </div>

        {/* ══ BODY ════════════════════════════════════════════════════════════ */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>

          {/* ── LEFT SIDEBAR ── */}
          <div style={{
            width: 200, flexShrink: 0,
            borderRight: `1px solid ${C.border}`,
            background: C.paper,
            display: 'flex', flexDirection: 'column',
          }}>
            {/* Logo */}
            <div style={{ padding: '18px 16px 14px', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                {/* Tree icon */}
                <svg width="28" height="36" viewBox="0 0 28 36" style={{ flexShrink: 0, marginTop: 2 }}>
                  <polygon points="14,2 26,18 20,18 24,28 4,28 8,18 2,18" fill={C.forest} opacity="0.85"/>
                  <rect x="11" y="28" width="6" height="6" fill={C.leather} opacity="0.7"/>
                </svg>
                <div>
                  <div style={{ fontFamily: FONT_SERIF, fontSize: 30, fontWeight: 700, color: C.forestDark, lineHeight: 0.92, letterSpacing: '-0.01em' }}>
                    FIELD<br/>GUIDE
                  </div>
                  <div style={{ fontFamily: FONT_COND, fontSize: 8, letterSpacing: '0.22em', color: C.rust, textTransform: 'uppercase', marginTop: 5, fontWeight: 700 }}>
                    URBAN OBSERVATION MAP
                  </div>
                </div>
              </div>
            </div>

            {/* Nav items */}
            <nav style={{ flex: 1, padding: '8px 0' }}>
              {NAV_ITEMS.map(item => (
                <button
                  key={item.key}
                  className={`sfg-nav-item${activeNav === item.key ? ' active' : ''}`}
                  onClick={() => setActiveNav(item.key)}
                >
                  <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: activeNav === item.key ? C.rust : C.faded, flexShrink: 0, marginTop: 1, width: 16, textAlign: 'center' }}>{item.icon}</span>
                  <div>
                    <div style={{ fontFamily: FONT_COND, fontSize: 11, letterSpacing: '0.16em', fontWeight: 700, textTransform: 'uppercase', color: activeNav === item.key ? C.rust : C.charcoal }}>{item.label}</div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: C.faded, marginTop: 1 }}>{item.sub}</div>
                  </div>
                </button>
              ))}
            </nav>

            {/* Compass */}
            <div style={{ padding: '16px', borderTop: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="36" fill={C.canvas} stroke={C.charcoal} strokeWidth="1.2" opacity="0.9"/>
                <circle cx="40" cy="40" r="30" fill="none" stroke={C.charcoal} strokeWidth="0.5" opacity="0.3"/>
                {/* Cardinal points */}
                {[['N',40,10,C.rust],['S',40,72,C.charcoal],['W',8,44,C.charcoal],['E',72,44,C.charcoal]].map(([l,x,y,c]) => (
                  <text key={l as string} x={x as number} y={y as number} textAnchor="middle" fontFamily={FONT_COND} fontSize="10" fontWeight="700" fill={c as string} opacity="0.85">{l}</text>
                ))}
                {/* Needle */}
                <polygon points="40,16 43,40 40,36 37,40" fill={C.rust} opacity="0.9"/>
                <polygon points="40,64 43,40 40,44 37,40" fill={C.charcoal} opacity="0.5"/>
                {/* Tick marks */}
                {Array.from({length: 16}, (_,i) => {
                  const a = (i * 22.5) * Math.PI / 180;
                  const r1 = i % 4 === 0 ? 26 : 28;
                  const r2 = 31;
                  return <line key={i} x1={40 + r1*Math.sin(a)} y1={40 - r1*Math.cos(a)} x2={40 + r2*Math.sin(a)} y2={40 - r2*Math.cos(a)} stroke={C.charcoal} strokeWidth={i%4===0?1:0.6} opacity="0.4"/>;
                })}
                <circle cx="40" cy="40" r="3" fill={C.charcoal} opacity="0.7"/>
              </svg>
              <div style={{ fontFamily: FONT_COND, fontSize: 9, letterSpacing: '0.2em', color: C.rust, textTransform: 'uppercase', textAlign: 'center', fontWeight: 700 }}>
                STAY AWARE.<br/>STAY KIND.
              </div>
            </div>
          </div>

          {/* ── CENTER MAP ── */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', position: 'relative', background: C.canvas }}>
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
              <SFMap observations={visibleObs} overlays={overlays}/>
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div style={{
            width: 220, flexShrink: 0,
            borderLeft: `1px solid ${C.border}`,
            background: C.paper,
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>

            {/* Latest Observations */}
            <div style={{ borderBottom: `1px solid ${C.border}`, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                {/* Tree icon small */}
                <svg width="12" height="14" viewBox="0 0 12 14">
                  <polygon points="6,1 11,7 8.5,7 10,11 2,11 3.5,7 1,7" fill={C.forest} opacity="0.8"/>
                  <rect x="4.5" y="11" width="3" height="2.5" fill={C.leather} opacity="0.7"/>
                </svg>
                <span style={{ fontFamily: FONT_COND, fontSize: 10, letterSpacing: '0.22em', fontWeight: 700, textTransform: 'uppercase', color: C.charcoal }}>Latest Observations</span>
              </div>
              <div className="sfg-scroll" style={{ maxHeight: 260, overflowY: 'auto' }}>
                {loading ? (
                  <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.faded, padding: '8px 0', letterSpacing: '0.12em' }}>Consulting field notes…</div>
                ) : obs.slice(0, 8).map(o => {
                  const meta = CAT[o.category] || CAT.encampment;
                  return (
                    <div key={o.id} className="sfg-obs-row">
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                        <span style={{ fontFamily: FONT_MONO, fontSize: 8, color: 'white', fontWeight: 700 }}>{meta.icon}</span>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: C.faded, letterSpacing: '0.1em' }}>{relTime(o.timestamp)}</div>
                        <div style={{ fontFamily: FONT_COND, fontSize: 10, color: C.charcoal, fontWeight: 600, lineHeight: 1.3 }}>{o.label}</div>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: C.faded, marginTop: 1 }}>{o.address || o.neighborhood}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Field Alerts */}
            <div style={{ borderBottom: `1px solid ${C.border}`, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: C.orange }}>⚠</span>
                <span style={{ fontFamily: FONT_COND, fontSize: 10, letterSpacing: '0.22em', fontWeight: 700, textTransform: 'uppercase', color: C.charcoal }}>Field Alerts</span>
              </div>
              <p style={{ fontFamily: FONT_COND, fontSize: 11, color: C.charcoal, lineHeight: 1.55, opacity: 0.8 }}>
                Increased reports in the {topNeighborhood}. Outreach teams active in surrounding area.
              </p>
              <div style={{ marginTop: 6, fontFamily: FONT_MONO, fontSize: 9, color: C.rust, letterSpacing: '0.1em', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: C.rust + '55' }}>
                View Trail Notes →
              </div>
            </div>

            {/* Weather */}
            <div style={{ padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: C.orange }}>☀</span>
                <span style={{ fontFamily: FONT_COND, fontSize: 10, letterSpacing: '0.22em', fontWeight: 700, textTransform: 'uppercase', color: C.charcoal }}>Weather</span>
              </div>
              <div style={{ fontFamily: FONT_COND, fontSize: 28, fontWeight: 700, color: C.charcoal, lineHeight: 1 }}>{weather.temp}°F</div>
              <div style={{ fontFamily: FONT_COND, fontSize: 11, color: C.faded, marginTop: 3 }}>{weather.desc}</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.faded, marginTop: 2 }}>{weather.wind}</div>
              <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
                <div>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 8, color: C.faded, letterSpacing: '0.1em' }}>HIGH </span>
                  <span style={{ fontFamily: FONT_COND, fontSize: 11, color: C.charcoal, fontWeight: 600 }}>{weather.high}°</span>
                </div>
                <div>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 8, color: C.faded, letterSpacing: '0.1em' }}>LOW </span>
                  <span style={{ fontFamily: FONT_COND, fontSize: 11, color: C.charcoal, fontWeight: 600 }}>{weather.low}°</span>
                </div>
              </div>
            </div>

            {/* Spacer + GitHub */}
            <div style={{ flex: 1 }}/>
            <div style={{ padding: '10px 12px', borderTop: `1px solid ${C.border}` }}>
              <GitHubStar/>
            </div>
          </div>
        </div>

        {/* ══ BOTTOM BAR ══════════════════════════════════════════════════════ */}
        <div style={{
          borderTop: `2px solid ${C.charcoal}`,
          background: C.paper,
          display: 'flex',
          flexWrap: 'wrap',
          minHeight: 0,
        }}>

          {/* Map Legend */}
          <div style={{ flex: '1 1 200px', padding: '12px 16px', borderRight: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: FONT_COND, fontSize: 10, letterSpacing: '0.22em', fontWeight: 700, textTransform: 'uppercase', color: C.charcoal, marginBottom: 8 }}>Map Legend</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { color: C.orange,    icon: '⚠', label: '311 Encampment Reports' },
                { color: C.navy,      icon: '✦', label: 'Police Activity' },
                { color: C.rust,      icon: '▲', label: 'Fire / EMS' },
                { color: C.forest,    icon: '⌂', label: 'Support Services' },
                { color: C.charcoal,  icon: '▦', label: 'High Activity Area', hatched: true },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  {l.hatched ? (
                    <div style={{ width: 14, height: 14, background: `repeating-linear-gradient(45deg, ${C.charcoal}22, ${C.charcoal}22 2px, transparent 2px, transparent 6px)`, border: `1px solid ${C.charcoal}44`, flexShrink: 0 }}/>
                  ) : (
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: l.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 7, color: 'white', fontWeight: 700 }}>{l.icon}</span>
                    </div>
                  )}
                  <span style={{ fontFamily: FONT_COND, fontSize: 10, color: C.charcoal, opacity: 0.8 }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Map Overlays */}
          <div style={{ flex: '1 1 160px', padding: '12px 16px', borderRight: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: FONT_COND, fontSize: 10, letterSpacing: '0.22em', fontWeight: 700, textTransform: 'uppercase', color: C.charcoal, marginBottom: 8 }}>Map Overlays</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {[
                { key: 'encampment', label: '311 Reports',    color: C.orange },
                { key: 'police',     label: 'Police Activity',color: C.navy },
                { key: 'fire',       label: 'Fire / EMS',     color: C.rust },
                { key: 'support',    label: 'Support Services',color: C.forest },
                { key: 'restroom',   label: 'Restrooms',      color: C.charcoal },
                { key: 'food',       label: 'Food Resources', color: C.moss },
              ].map(ov => (
                <label key={ov.key} className="sfg-overlay-row" style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
                  <div
                    onClick={() => setOverlays(prev => ({ ...prev, [ov.key]: !prev[ov.key] }))}
                    style={{
                      width: 13, height: 13, border: `1.5px solid ${ov.color}`,
                      background: overlays[ov.key] ? ov.color : 'transparent',
                      flexShrink: 0, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 0.15s',
                    }}
                  >
                    {overlays[ov.key] && <span style={{ fontFamily: FONT_MONO, fontSize: 8, color: 'white', lineHeight: 1 }}>✓</span>}
                  </div>
                  <span style={{ fontFamily: FONT_COND, fontSize: 10, color: C.charcoal, opacity: 0.8 }}>{ov.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Earned Patches */}
          <div style={{ flex: '2 1 400px', padding: '12px 16px' }}>
            <div style={{ fontFamily: FONT_COND, fontSize: 10, letterSpacing: '0.22em', fontWeight: 700, textTransform: 'uppercase', color: C.charcoal, marginBottom: 8 }}>Earned Patches</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {PATCHES.map(p => <Patch key={p.label} {...p}/>)}
            </div>
            <div style={{ marginTop: 8, fontFamily: FONT_MONO, fontSize: 9, color: C.rust, letterSpacing: '0.1em', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: C.rust + '55' }}>
              View All Patches →
            </div>
          </div>
        </div>

        {/* ══ FOOTER ══════════════════════════════════════════════════════════ */}
        <div style={{
          background: C.paperDark,
          borderTop: `1px solid ${C.border}`,
          padding: '8px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 8,
        }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: C.faded, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            SF FIELD GUIDE — DATA: SF OPEN DATA PORTAL — SFGOV.ORG — NOT FOR SURVEILLANCE
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={load} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT_MONO, fontSize: 8, letterSpacing: '0.14em', color: C.faded, textTransform: 'uppercase', transition: 'color 0.15s' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = C.rust)}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = C.faded)}>
              ↺ Refresh
            </button>
            <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: C.faded, letterSpacing: '0.1em' }}>© {new Date().getFullYear()} hella.rich</div>
          </div>
        </div>

      </div>
    </>
  );
}
