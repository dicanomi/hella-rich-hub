/**
 * FOURCAST — hella.rich Anxiety Weather Engine
 *
 * Modes:
 *   A) DISASTER SEQUENCE — stages 1–9, heat escalation replacing cold/ice
 *   B) TOMORROW ENGINE   — weighted random emotional weather
 *   C) ALIEN TRANSMISSION — final event, replaces UI entirely
 *
 * Heat progression: 72° → 85° → 103° → 118° → 132° → 149° → 166°
 * Final stage 9 triggers ALIEN TRANSMISSION
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { HellaRichSEO } from '../components/HellaRichSEO';

// ─── Tomorrow Weather States ──────────────────────────────────────────────────

type TomorrowType = 'perfect' | 'normal' | 'uneasy' | 'storm' | 'apocalypse' | 'existential';
type IconType = 'sun' | 'sun-glitch' | 'cloud' | 'hail' | 'tornado' | 'chaos' | 'panic' | 'void' | 'heat' | 'inferno';

interface TomorrowState {
  type: TomorrowType;
  temp: string;
  condition: string;
  conditionSub: string;
  messages: string[];
  wind: string;
  humidity: string;
  uvIndex: string;
  confidence: string;
  ticker: string;
  cardClass: string;
  iconType: IconType;
  warnings: string[];
  bigMessage: string;
}

const TOMORROW_STATES: Record<TomorrowType, Omit<TomorrowState, 'type'>> = {
  perfect: {
    temp: '72°', condition: 'PERFECT', conditionSub: 'Unusually beautiful conditions.',
    messages: ['TODAY LOOKS PERFECT.', 'NOTHING FEELS WRONG.', 'UNUSUALLY BEAUTIFUL CONDITIONS.', 'THE SKY SUPPORTS YOU.', 'MAYBE THINGS ARE TURNING AROUND.', 'WHY WERE YOU WORRIED?'],
    wind: '4 MPH', humidity: '38%', uvIndex: '3 MOD', confidence: '100%\n(OBVIOUSLY)',
    ticker: 'PERFECT CONDITIONS DETECTED · THE SKY SUPPORTS YOU · NOTHING FEELS WRONG · WHY WERE YOU WORRIED · HAVE A WONDERFUL DAY',
    cardClass: '', iconType: 'sun', warnings: [], bigMessage: 'TODAY LOOKS PERFECT.',
  },
  normal: {
    temp: '68°', condition: 'ACCEPTABLE', conditionSub: 'Weather appears acceptable.',
    messages: ['HAVE A WONDERFUL DAY.', 'YOU ARE DOING GREAT.', 'WEATHER APPEARS ACCEPTABLE.', 'ENJOY YOUR DAY.'],
    wind: '12 MPH', humidity: '52%', uvIndex: '2 LOW', confidence: '100%\n(OBVIOUSLY)',
    ticker: 'HAVE A WONDERFUL DAY · YOU ARE DOING GREAT · WEATHER APPEARS ACCEPTABLE · ENJOY YOUR DAY',
    cardClass: 'stage-3', iconType: 'cloud', warnings: [], bigMessage: 'HAVE A WONDERFUL DAY.',
  },
  uneasy: {
    temp: '103°', condition: 'UNEASY', conditionSub: 'The atmosphere appears committed.',
    messages: ['MINOR ATMOSPHERIC DISAGREEMENT.', 'PLEASE REMAIN CASUAL.', 'THE ATMOSPHERE APPEARS COMMITTED.', 'SOMETHING FEELS DIFFERENT.', 'DO NOT PANIC YET.'],
    wind: '8 MPH', humidity: '12%', uvIndex: '9 HIGH', confidence: '100%\n(CAUTIOUS)',
    ticker: 'HYDRATION RECOMMENDED · THE ATMOSPHERE APPEARS COMMITTED · SOMETHING FEELS DIFFERENT · DO NOT PANIC YET · PLEASE REMAIN COMFORTABLE',
    cardClass: 'stage-heat-2', iconType: 'heat', warnings: ['⚠ HEAT ADVISORY DETECTED'],
    bigMessage: 'DO NOT PANIC YET.',
  },
  storm: {
    temp: '132°', condition: 'WARMTH EVENT', conditionSub: 'This is a warmth event.',
    messages: ['THIS IS STILL TECHNICALLY WEATHER.', 'PLEASE REMAIN OPTIMISTIC.', 'THIS IS A WARMTH EVENT.', 'YOU WILL PROBABLY BE OKAY.', 'EVERYTHING IS STILL PROBABLY FINE.'],
    wind: '22 MPH', humidity: '4%', uvIndex: '∞ MAX', confidence: '100%\n(AGGRESSIVE)',
    ticker: 'THIS IS A WARMTH EVENT · PLEASE REMAIN COMFORTABLE · YOU WILL PROBABLY BE OKAY · HYDRATION RECOMMENDED · EVERYTHING IS STILL PROBABLY FINE',
    cardClass: 'stage-heat-3', iconType: 'inferno', warnings: ['⚠ EXTREME HEAT WARNING', '⚠ SKY BEHAVING INCORRECTLY'],
    bigMessage: 'YOU WILL PROBABLY BE OKAY.',
  },
  apocalypse: {
    temp: '166°', condition: 'APOCALYPSE', conditionSub: 'The sun has made choices.',
    messages: ['PRAY NOW.', 'GO TO GREENLAND NOW.', 'GET THE GOLD.', 'MOVE FORWARD.', 'THE CLOUDS HAVE FORMED OPINIONS.', 'THE OCEAN HAS QUESTIONS.', 'THE SUN HAS MADE CHOICES.', 'TAKE THE GOOD SHOES.', 'HAVE A WONDERFUL DAY.', 'YOU WILL BE OKAY.', 'EVERYTHING IS FINE.'],
    wind: '∞ MPH', humidity: '0%', uvIndex: '∞ MAX', confidence: '100%\n(OBVIOUSLY)',
    ticker: 'EMERGENCY ALERT · THE SUN HAS MADE CHOICES · THE OCEAN HAS QUESTIONS · THE CLOUDS HAVE FORMED OPINIONS · GO TO GREENLAND NOW · HAVE A WONDERFUL DAY',
    cardClass: 'stage-heat-4', iconType: 'inferno', warnings: ['⚠ CIVIL EMERGENCY ALERT', '⚠ TOTAL HEAT FAILURE', '✓ EVERYTHING IS FINE'],
    bigMessage: 'THE SUN HAS MADE CHOICES.',
  },
  existential: {
    temp: '???', condition: 'EXISTENTIAL', conditionSub: 'Reality is buffering.',
    messages: ['REALITY IS BUFFERING.', 'THE MOON IS TOO CLOSE.', 'TIME APPEARS UNCERTAIN.', 'FORECAST CONFIDENCE: UNKNOWN.', 'THIS MAY PASS.', 'PLEASE REMAIN CALM.', 'YOU STILL MATTER.', 'THANK YOU FOR USING FOURCAST.'],
    wind: '???', humidity: '???', uvIndex: '??? ???', confidence: 'SPIRITUALLY\nUNCERTAIN',
    ticker: 'REALITY IS BUFFERING · THE MOON IS TOO CLOSE · TIME APPEARS UNCERTAIN · FORECAST CONFIDENCE: UNKNOWN · YOU STILL MATTER · THANK YOU FOR USING FOURCAST',
    cardClass: 'stage-9', iconType: 'void', warnings: ['⚠ REALITY UNAVAILABLE', '⚠ EMERGENCY OPTIMISM ADVISORY'],
    bigMessage: 'REALITY IS BUFFERING.',
  },
};

function pickTomorrowType(history: TomorrowType[]): TomorrowType {
  const last3 = history.slice(-3);
  const goodTypes: TomorrowType[] = ['perfect', 'normal'];
  const badTypes: TomorrowType[] = ['storm', 'apocalypse', 'existential'];
  const allGood = last3.length === 3 && last3.every(t => goodTypes.includes(t));
  const allBad  = last3.length === 3 && last3.every(t => badTypes.includes(t));
  if (allBad) return 'perfect';
  const weights: [TomorrowType, number][] = [
    ['perfect', allGood ? 5 : 30], ['normal', 25], ['uneasy', 20],
    ['storm', 15], ['apocalypse', allGood ? 20 : 8], ['existential', allGood ? 5 : 2],
  ];
  const total = weights.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [type, w] of weights) { r -= w; if (r <= 0) return type; }
  return 'normal';
}

// ─── Disaster Sequence Data ───────────────────────────────────────────────────

type Stage = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

interface StageData {
  temp: string;
  condition: string;
  conditionSub: string;
  footerMessages: string[];
  wind: string;
  humidity: string;
  uvIndex: string;
  confidenceMessages: string[];
  ticker: string;
  cardClass: string;
  iconType: IconType;
}

const STAGE_DURATIONS_MS = [0, 3000, 2000, 3000, 4000, 5000, 5000, 7000, 9000, 99999];

const STAGES: StageData[] = [
  // 0 idle
  { temp: '72°', condition: 'SUNNY', conditionSub: 'Feels amazing.', footerMessages: ['TODAY LOOKS PERFECT.\nNOTHING BAD WILL HAPPEN.'], wind: '6 MPH', humidity: '42%', uvIndex: '2 LOW', confidenceMessages: ['100%\n(OBVIOUSLY)'], ticker: 'LOCAL OPTIMISM ADVISORY IN EFFECT · FORECAST CONFIDENCE: EMOTIONALLY HIGH · NOTHING BAD WILL HAPPEN · HAVE A WONDERFUL DAY', cardClass: '', iconType: 'sun' },
  // 1 sunny
  { temp: '72°', condition: 'SUNNY', conditionSub: 'Feels amazing.', footerMessages: ['TODAY LOOKS PERFECT.\nNOTHING BAD WILL HAPPEN.'], wind: '6 MPH', humidity: '42%', uvIndex: '2 LOW', confidenceMessages: ['100%\n(OBVIOUSLY)'], ticker: 'LOCAL OPTIMISM ADVISORY IN EFFECT · FORECAST CONFIDENCE: EMOTIONALLY HIGH · NOTHING BAD WILL HAPPEN · HAVE A WONDERFUL DAY', cardClass: '', iconType: 'sun' },
  // 2 glitch
  { temp: '85°', condition: 'WARM', conditionSub: 'Hydration recommended.', footerMessages: ['THE SKY IS THINKING\nABOUT STUFF.'], wind: '4 MPH', humidity: '28%', uvIndex: '6 HIGH', confidenceMessages: ['100%\n(STILL)'], ticker: 'FORECAST UPDATED · HYDRATION RECOMMENDED · STILL TECHNICALLY A DAY · LOCAL OPTIMISM ADVISORY REMAINS IN EFFECT', cardClass: 'stage-2', iconType: 'sun-glitch' },
  // 3 heating up
  { temp: '103°', condition: 'HOT', conditionSub: 'The atmosphere appears committed.', footerMessages: ['PLEASE REMAIN\nCOMFORTABLE.'], wind: '8 MPH', humidity: '14%', uvIndex: '9 HIGH', confidenceMessages: ['100%\n(CAUTIOUS)'], ticker: 'HEAT ADVISORY · HYDRATION RECOMMENDED · THE ATMOSPHERE APPEARS COMMITTED · STILL FINE · PROBABLY FINE', cardClass: 'stage-heat-1', iconType: 'heat' },
  // 4 very hot
  { temp: '118°', condition: 'EXTREME HEAT', conditionSub: 'This is a warmth event.', footerMessages: ['THIS IS A WARMTH EVENT.\nEVERYTHING IS STILL FINE.'], wind: '12 MPH', humidity: '6%', uvIndex: '11 EXT', confidenceMessages: ['100%\n(AGGRESSIVE)'], ticker: 'EXTREME HEAT WARNING · THIS IS A WARMTH EVENT · HYDRATION RECOMMENDED · STILL A GREAT DAY · FORECAST: WARM', cardClass: 'stage-heat-2', iconType: 'heat' },
  // 5 dangerous heat
  { temp: '132°', condition: 'HEAT CRISIS', conditionSub: "The sky is committed.", footerMessages: ['EVERYTHING IS STILL\nPROBABLY FINE.'], wind: '18 MPH', humidity: '2%', uvIndex: '∞ MAX', confidenceMessages: ['100%\n(UNREASONABLE)'], ticker: 'HEAT CRISIS · SKY BEHAVING INCORRECTLY · DISTANT FIRES DETECTED · PLEASE REMAIN COMFORTABLE · STILL FINE', cardClass: 'stage-heat-3', iconType: 'inferno' },
  // 6 catastrophic heat
  { temp: '149°', condition: 'CATASTROPHIC', conditionSub: 'The sun has made choices.', footerMessages: ['EVERYTHING IS FINE.\nTHIS IS FINE.'], wind: '∞ MPH', humidity: '0%', uvIndex: '∞ MAX', confidenceMessages: ['100%\n(OBVIOUSLY)'], ticker: 'EVERYTHING IS FINE · HAVE A WONDERFUL DAY · FORECAST: WONDERFUL · THE SUN HAS MADE CHOICES · NOTHING BAD IS HAPPENING', cardClass: 'stage-heat-4', iconType: 'inferno' },
  // 7 national panic (heat)
  { temp: '166°', condition: 'NATIONAL PANIC', conditionSub: 'Minor atmospheric disagreement.', footerMessages: ['EVERYTHING APPEARS\nMANAGEABLE.', 'A BEAUTIFUL DAY CAN\nTAKE MANY FORMS.', 'HYDRATION RECOMMENDED.', 'YOU ARE DOING GREAT.'], wind: '∞ MPH', humidity: '0%', uvIndex: '∞ MAX', confidenceMessages: ['EMOTIONALLY\nSTABLE'], ticker: 'EMERGENCY ALERT · CIVIL ADVISORY IN EFFECT · SATELLITE SIGNAL DEGRADED · POWER FLUCTUATIONS DETECTED · YOU ARE DOING GREAT · EVERYTHING APPEARS MANAGEABLE', cardClass: 'stage-7', iconType: 'panic' },
  // 8 total earth failure (heat)
  { temp: '166°', condition: 'EARTH FAILURE', conditionSub: 'Try a warm beverage.', footerMessages: ['EVERYTHING WILL\nPROBABLY BE ALRIGHT.', 'REMAIN OPTIMISTIC.', 'TRY A WARM BEVERAGE.', 'TAKE A MOMENT\nFOR YOURSELF.', 'BREATHE NORMALLY.', 'THE ATMOSPHERE\nAPPRECIATES YOUR PATIENCE.'], wind: '∞ MPH', humidity: '0%', uvIndex: '∞ MAX', confidenceMessages: ['EMOTIONALLY\nSTABLE', 'QUESTIONABLE', 'UNKNOWN', 'HONESTLY\nUNCLEAR'], ticker: 'TOTAL EARTH FAILURE · HEAT ADVISORY · ELECTRICAL SYSTEMS OFFLINE · BIRDS UNAVAILABLE · DISTANT FIRES DETECTED · BREATHE NORMALLY · REMAIN OPTIMISTIC', cardClass: 'stage-8', iconType: 'void' },
  // 9 → triggers alien transmission
  { temp: '???', condition: 'SIGNAL LOST', conditionSub: 'Incoming transmission.', footerMessages: ['PLEASE STAND BY.'], wind: '???', humidity: '???', uvIndex: '??? ???', confidenceMessages: ['UNKNOWN'], ticker: 'SIGNAL LOST · INCOMING TRANSMISSION · PLEASE STAND BY · FOURCAST SYSTEMS OFFLINE · HAVE A WONDERFUL DAY', cardClass: 'stage-9', iconType: 'void' },
];

// ─── Pixel Weather Icons ──────────────────────────────────────────────────────

function SunIcon({ glitch = false }: { glitch?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="pixel-icon" style={{ opacity: glitch ? 0.6 : 1 }}>
      <rect x="30" y="4" width="4" height="8" fill="currentColor" /><rect x="30" y="52" width="4" height="8" fill="currentColor" />
      <rect x="4" y="30" width="8" height="4" fill="currentColor" /><rect x="52" y="30" width="8" height="4" fill="currentColor" />
      <rect x="12" y="12" width="4" height="4" fill="currentColor" /><rect x="16" y="16" width="4" height="4" fill="currentColor" />
      <rect x="44" y="12" width="4" height="4" fill="currentColor" /><rect x="48" y="16" width="4" height="4" fill="currentColor" />
      <rect x="12" y="48" width="4" height="4" fill="currentColor" /><rect x="16" y="44" width="4" height="4" fill="currentColor" />
      <rect x="44" y="48" width="4" height="4" fill="currentColor" /><rect x="48" y="44" width="4" height="4" fill="currentColor" />
      <rect x="20" y="20" width="24" height="24" fill="currentColor" />
      <rect x="18" y="22" width="28" height="20" fill="currentColor" />
      <rect x="22" y="18" width="20" height="28" fill="currentColor" />
      {glitch && <rect x="20" y="28" width="24" height="4" fill="rgba(255,0,0,0.5)" />}
    </svg>
  );
}
function CloudIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="pixel-icon">
      <rect x="16" y="28" width="32" height="16" fill="currentColor" /><rect x="20" y="24" width="24" height="8" fill="currentColor" />
      <rect x="24" y="20" width="16" height="8" fill="currentColor" /><rect x="12" y="32" width="8" height="8" fill="currentColor" />
      <rect x="44" y="32" width="8" height="8" fill="currentColor" />
      <rect x="8" y="50" width="20" height="3" fill="currentColor" opacity="0.5" /><rect x="12" y="55" width="28" height="3" fill="currentColor" opacity="0.4" />
    </svg>
  );
}
function HeatIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="pixel-icon">
      {/* Oversized sun */}
      <rect x="28" y="2" width="8" height="10" fill="currentColor" /><rect x="28" y="52" width="8" height="10" fill="currentColor" />
      <rect x="2" y="28" width="10" height="8" fill="currentColor" /><rect x="52" y="28" width="10" height="8" fill="currentColor" />
      <rect x="8" y="8" width="6" height="6" fill="currentColor" /><rect x="14" y="14" width="6" height="6" fill="currentColor" />
      <rect x="44" y="8" width="6" height="6" fill="currentColor" /><rect x="50" y="14" width="6" height="6" fill="currentColor" />
      <rect x="8" y="50" width="6" height="6" fill="currentColor" /><rect x="14" y="44" width="6" height="6" fill="currentColor" />
      <rect x="44" y="50" width="6" height="6" fill="currentColor" /><rect x="50" y="44" width="6" height="6" fill="currentColor" />
      <rect x="16" y="16" width="32" height="32" fill="currentColor" />
      <rect x="14" y="18" width="36" height="28" fill="currentColor" />
      <rect x="18" y="14" width="28" height="36" fill="currentColor" />
      {/* Heat shimmer lines */}
      <rect x="20" y="58" width="24" height="2" fill="currentColor" opacity="0.4" />
      <rect x="16" y="62" width="32" height="2" fill="currentColor" opacity="0.25" />
    </svg>
  );
}
function InfernoIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="pixel-icon">
      {/* Massive sun with fire corona */}
      <rect x="26" y="0" width="12" height="12" fill="currentColor" />
      <rect x="26" y="52" width="12" height="12" fill="currentColor" />
      <rect x="0" y="26" width="12" height="12" fill="currentColor" />
      <rect x="52" y="26" width="12" height="12" fill="currentColor" />
      <rect x="6" y="6" width="8" height="8" fill="currentColor" /><rect x="12" y="12" width="8" height="8" fill="currentColor" />
      <rect x="50" y="6" width="8" height="8" fill="currentColor" /><rect x="44" y="12" width="8" height="8" fill="currentColor" />
      <rect x="6" y="50" width="8" height="8" fill="currentColor" /><rect x="12" y="44" width="8" height="8" fill="currentColor" />
      <rect x="50" y="50" width="8" height="8" fill="currentColor" /><rect x="44" y="44" width="8" height="8" fill="currentColor" />
      <rect x="14" y="14" width="36" height="36" fill="currentColor" />
      <rect x="12" y="16" width="40" height="32" fill="currentColor" />
      <rect x="16" y="12" width="32" height="40" fill="currentColor" />
    </svg>
  );
}
function TornadoIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="pixel-icon">
      <rect x="8" y="8" width="48" height="6" fill="currentColor" /><rect x="12" y="16" width="40" height="5" fill="currentColor" />
      <rect x="16" y="23" width="32" height="5" fill="currentColor" /><rect x="20" y="30" width="24" height="5" fill="currentColor" />
      <rect x="24" y="37" width="16" height="5" fill="currentColor" /><rect x="28" y="44" width="8" height="5" fill="currentColor" />
      <rect x="30" y="51" width="4" height="6" fill="currentColor" />
      <rect x="4" y="36" width="4" height="4" fill="currentColor" opacity="0.6" /><rect x="56" y="28" width="4" height="4" fill="currentColor" opacity="0.6" />
    </svg>
  );
}
function ChaosIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="pixel-icon">
      <rect x="28" y="4" width="12" height="4" fill="currentColor" /><rect x="24" y="8" width="12" height="4" fill="currentColor" />
      <rect x="20" y="12" width="12" height="4" fill="currentColor" /><rect x="24" y="16" width="12" height="4" fill="currentColor" />
      <rect x="20" y="20" width="12" height="4" fill="currentColor" /><rect x="16" y="24" width="12" height="4" fill="currentColor" />
      <rect x="4" y="16" width="8" height="6" fill="currentColor" opacity="0.7" /><rect x="52" y="8" width="6" height="8" fill="currentColor" opacity="0.7" />
      <rect x="48" y="36" width="8" height="5" fill="currentColor" opacity="0.6" /><rect x="4" y="44" width="10" height="4" fill="currentColor" opacity="0.5" />
    </svg>
  );
}
function PanicIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="pixel-icon">
      <rect x="28" y="6" width="8" height="4" fill="currentColor" /><rect x="24" y="10" width="16" height="4" fill="currentColor" />
      <rect x="20" y="14" width="24" height="4" fill="currentColor" /><rect x="16" y="18" width="32" height="4" fill="currentColor" />
      <rect x="12" y="22" width="40" height="4" fill="currentColor" /><rect x="8" y="26" width="48" height="4" fill="currentColor" />
      <rect x="4" y="30" width="56" height="4" fill="currentColor" /><rect x="4" y="34" width="56" height="4" fill="currentColor" />
      <rect x="30" y="16" width="4" height="12" fill="var(--card)" /><rect x="30" y="30" width="4" height="4" fill="var(--card)" />
      <rect x="4" y="50" width="8" height="4" fill="currentColor" opacity="0.5" /><rect x="52" y="46" width="6" height="6" fill="currentColor" opacity="0.5" />
    </svg>
  );
}
function VoidIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="pixel-icon">
      <rect x="28" y="0" width="4" height="16" fill="currentColor" opacity="0.8" /><rect x="24" y="8" width="8" height="4" fill="currentColor" opacity="0.6" />
      <rect x="8" y="8" width="3" height="3" fill="currentColor" opacity="0.9" /><rect x="50" y="12" width="3" height="3" fill="currentColor" opacity="0.9" />
      <rect x="16" y="20" width="2" height="2" fill="currentColor" opacity="0.7" /><rect x="46" y="24" width="2" height="2" fill="currentColor" opacity="0.7" />
      <rect x="28" y="28" width="8" height="4" fill="currentColor" /><rect x="32" y="32" width="4" height="4" fill="currentColor" />
      <rect x="28" y="36" width="4" height="4" fill="currentColor" /><rect x="28" y="42" width="4" height="4" fill="currentColor" />
    </svg>
  );
}
function WeatherIcon({ type }: { type: IconType }) {
  switch (type) {
    case 'sun': return <SunIcon />;
    case 'sun-glitch': return <SunIcon glitch />;
    case 'cloud': return <CloudIcon />;
    case 'hail': return <HeatIcon />;
    case 'heat': return <HeatIcon />;
    case 'inferno': return <InfernoIcon />;
    case 'tornado': return <TornadoIcon />;
    case 'chaos': return <ChaosIcon />;
    case 'panic': return <PanicIcon />;
    case 'void': return <VoidIcon />;
  }
}

// ─── Pixel Alien Head ─────────────────────────────────────────────────────────

function AlienHead({ mouthOpen }: { mouthOpen: boolean }) {
  return (
    <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="pixel-icon alien-head">
      {/* Head shape */}
      <rect x="20" y="4" width="40" height="4" fill="#888" />
      <rect x="12" y="8" width="56" height="4" fill="#888" />
      <rect x="8" y="12" width="64" height="4" fill="#999" />
      <rect x="4" y="16" width="72" height="4" fill="#999" />
      <rect x="4" y="20" width="72" height="4" fill="#aaa" />
      <rect x="4" y="24" width="72" height="40" fill="#aaa" />
      <rect x="4" y="64" width="72" height="4" fill="#999" />
      <rect x="8" y="68" width="64" height="4" fill="#999" />
      <rect x="12" y="72" width="56" height="4" fill="#888" />
      <rect x="20" y="76" width="40" height="4" fill="#888" />
      {/* Neck */}
      <rect x="28" y="80" width="24" height="4" fill="#888" />
      <rect x="32" y="84" width="16" height="4" fill="#777" />
      <rect x="32" y="88" width="16" height="4" fill="#777" />
      {/* Eyes — large almond, no pupils */}
      <rect x="12" y="28" width="20" height="4" fill="#222" />
      <rect x="10" y="32" width="24" height="8" fill="#222" />
      <rect x="12" y="40" width="20" height="4" fill="#222" />
      <rect x="48" y="28" width="20" height="4" fill="#222" />
      <rect x="46" y="32" width="24" height="8" fill="#222" />
      <rect x="48" y="40" width="20" height="4" fill="#222" />
      {/* Nose — minimal */}
      <rect x="36" y="48" width="4" height="4" fill="#888" />
      <rect x="34" y="52" width="8" height="2" fill="#888" />
      {/* Mouth */}
      {mouthOpen ? (
        <>
          <rect x="24" y="58" width="32" height="4" fill="#222" />
          <rect x="26" y="62" width="28" height="4" fill="#333" />
          <rect x="28" y="66" width="24" height="2" fill="#222" />
        </>
      ) : (
        <rect x="26" y="60" width="28" height="3" fill="#777" />
      )}
      {/* Subtle CRT scanlines via opacity bands */}
      <rect x="4" y="20" width="72" height="2" fill="rgba(0,0,0,0.08)" />
      <rect x="4" y="28" width="72" height="2" fill="rgba(0,0,0,0.08)" />
      <rect x="4" y="36" width="72" height="2" fill="rgba(0,0,0,0.08)" />
      <rect x="4" y="44" width="72" height="2" fill="rgba(0,0,0,0.08)" />
      <rect x="4" y="52" width="72" height="2" fill="rgba(0,0,0,0.08)" />
      <rect x="4" y="60" width="72" height="2" fill="rgba(0,0,0,0.08)" />
    </svg>
  );
}

// ─── Alien Audio ──────────────────────────────────────────────────────────────

function playAlienLine(ctx: AudioContext, master: GainNode, lineIndex: number): number {
  // Each line gets a distinct synthetic "alien language" pattern
  // Returns approximate duration in ms
  const patterns: Array<{ freq: number; dur: number; type: OscillatorType }[]> = [
    // "WE ARE HERE" — rising confident tones
    [{freq:320,dur:0.12,type:'square'},{freq:480,dur:0.08,type:'square'},{freq:640,dur:0.18,type:'square'},{freq:580,dur:0.1,type:'sawtooth'},{freq:720,dur:0.22,type:'square'}],
    // "WE HAVE ALWAYS BEEN HERE" — longer, ancient feeling
    [{freq:180,dur:0.2,type:'sawtooth'},{freq:240,dur:0.1,type:'square'},{freq:360,dur:0.15,type:'square'},{freq:280,dur:0.12,type:'sawtooth'},{freq:420,dur:0.18,type:'square'},{freq:340,dur:0.1,type:'square'},{freq:520,dur:0.2,type:'sawtooth'}],
    // "HARVESTING YOUR HUMAN FORMS" — mechanical, clicking
    [{freq:800,dur:0.06,type:'square'},{freq:600,dur:0.06,type:'square'},{freq:1000,dur:0.06,type:'square'},{freq:700,dur:0.06,type:'square'},{freq:900,dur:0.1,type:'sawtooth'},{freq:650,dur:0.08,type:'square'},{freq:850,dur:0.06,type:'square'},{freq:1100,dur:0.12,type:'sawtooth'}],
    // "CREATING CROSS BREEDS" — warbling, strange
    [{freq:440,dur:0.15,type:'sawtooth'},{freq:330,dur:0.1,type:'sawtooth'},{freq:550,dur:0.18,type:'sawtooth'},{freq:415,dur:0.12,type:'square'},{freq:660,dur:0.2,type:'sawtooth'}],
    // "YOU ARE US" — short, declarative
    [{freq:520,dur:0.18,type:'square'},{freq:390,dur:0.12,type:'square'},{freq:650,dur:0.25,type:'sawtooth'}],
    // "NOW IS THE TIME" — final, rising
    [{freq:260,dur:0.14,type:'sawtooth'},{freq:390,dur:0.14,type:'sawtooth'},{freq:520,dur:0.14,type:'sawtooth'},{freq:780,dur:0.28,type:'square'}],
  ];

  const pattern = patterns[lineIndex % patterns.length];
  let t = ctx.currentTime + 0.05;
  let totalDur = 0;

  pattern.forEach((note, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = note.freq * 1.2;
    filter.Q.value = 2.5;

    osc.type = note.type;
    osc.frequency.value = note.freq;

    // Add slight pitch wobble for organic feel
    const lfo = ctx.createOscillator();
    const lfoG = ctx.createGain();
    lfo.frequency.value = 8 + Math.random() * 6;
    lfoG.gain.value = note.freq * 0.02;
    lfo.connect(lfoG);
    lfoG.connect(osc.frequency);

    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.22, t + 0.015);
    g.gain.setValueAtTime(0.22, t + note.dur - 0.02);
    g.gain.linearRampToValueAtTime(0, t + note.dur);

    osc.connect(filter);
    filter.connect(g);
    g.connect(master);

    lfo.start(t); osc.start(t);
    lfo.stop(t + note.dur + 0.05);
    osc.stop(t + note.dur + 0.05);

    t += note.dur + 0.04 + Math.random() * 0.03;
    totalDur = (t - ctx.currentTime) * 1000;
  });

  // Add a radio artifact chirp at the end
  const chirp = ctx.createOscillator();
  const chirpG = ctx.createGain();
  chirp.type = 'sine';
  chirp.frequency.setValueAtTime(2400, t);
  chirp.frequency.exponentialRampToValueAtTime(400, t + 0.08);
  chirpG.gain.setValueAtTime(0.08, t);
  chirpG.gain.linearRampToValueAtTime(0, t + 0.08);
  chirp.connect(chirpG); chirpG.connect(master);
  chirp.start(t); chirp.stop(t + 0.1);

  return totalDur + 300;
}

// ─── Main Audio Engine ────────────────────────────────────────────────────────

class WeatherAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private windSrc: AudioBufferSourceNode | null = null;
  private windGain: GainNode | null = null;
  private rumbleOsc: OscillatorNode | null = null;
  private rumbleGain: GainNode | null = null;
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private deepRumbleOsc: OscillatorNode | null = null;
  private deepRumbleGain: GainNode | null = null;
  private ambientSrc: AudioBufferSourceNode | null = null;
  private ambientGain: GainNode | null = null;
  enabled = false;

  private getCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      this.master.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  enable() { this.enabled = true; this.getCtx(); }

  playHappyChime() {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      const t = ctx.currentTime + i * 0.13;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.18, t + 0.04); g.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
      o.connect(g); g.connect(this.master!); o.start(t); o.stop(t + 0.7);
    });
  }

  playGlitch() {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    const sz = Math.floor(ctx.sampleRate * 0.07);
    const buf = ctx.createBuffer(1, sz, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < sz; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / sz);
    const src = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 0.6; g.gain.value = 0.35;
    src.buffer = buf; src.connect(f); f.connect(g); g.connect(this.master!); src.start();
  }

  startAmbient(type: TomorrowType) {
    this.stopAmbient();
    if (!this.enabled) return;
    const ctx = this.getCtx();
    this.ambientGain = ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0, ctx.currentTime);
    this.ambientGain.gain.linearRampToValueAtTime(type === 'perfect' ? 0.06 : 0.04, ctx.currentTime + 2);
    if (type === 'perfect' || type === 'normal') {
      const osc1 = ctx.createOscillator(), osc2 = ctx.createOscillator();
      osc1.type = 'sine'; osc2.type = 'sine'; osc1.frequency.value = 220; osc2.frequency.value = 329.63;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600;
      osc1.connect(lp); osc2.connect(lp); lp.connect(this.ambientGain); this.ambientGain.connect(this.master!);
      osc1.start(); osc2.start(); this.ambientSrc = osc1 as any;
    } else if (type === 'existential') {
      const osc = ctx.createOscillator();
      osc.type = 'sine'; osc.frequency.value = 22;
      const lfo = ctx.createOscillator(), lfoG = ctx.createGain();
      lfo.frequency.value = 0.05; lfoG.gain.value = 8;
      lfo.connect(lfoG); lfoG.connect(osc.frequency);
      osc.connect(this.ambientGain); this.ambientGain.connect(this.master!);
      this.ambientGain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 4);
      lfo.start(); osc.start(); this.ambientSrc = osc as any;
    }
  }

  stopAmbient() {
    try { (this.ambientSrc as any)?.stop(); } catch {}
    this.ambientSrc = null; this.ambientGain = null;
  }

  startRumble() {
    if (!this.enabled || this.rumbleOsc) return;
    const ctx = this.getCtx();
    this.rumbleGain = ctx.createGain();
    this.rumbleGain.gain.setValueAtTime(0, ctx.currentTime);
    this.rumbleGain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 1.5);
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
    o1.type = 'sawtooth'; o2.type = 'sine'; o1.frequency.value = 46; o2.frequency.value = 60;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 110;
    o1.connect(lp); o2.connect(lp); lp.connect(this.rumbleGain); this.rumbleGain.connect(this.master!);
    o1.start(); o2.start(); this.rumbleOsc = o1;
  }

  startWind() {
    if (!this.enabled || this.windSrc) return;
    const ctx = this.getCtx();
    const sz = ctx.sampleRate * 3, buf = ctx.createBuffer(1, sz, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < sz; i++) d[i] = Math.random() * 2 - 1;
    this.windGain = ctx.createGain();
    this.windGain.gain.setValueAtTime(0, ctx.currentTime);
    this.windGain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 2);
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 380; f.Q.value = 0.3;
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    src.connect(f); f.connect(this.windGain); this.windGain.connect(this.master!); src.start();
    this.windSrc = src;
  }

  intensifyWind() { if (this.windGain && this.ctx) this.windGain.gain.linearRampToValueAtTime(0.16, this.ctx.currentTime + 1); }
  maxWind()       { if (this.windGain && this.ctx) this.windGain.gain.linearRampToValueAtTime(0.24, this.ctx.currentTime + 2); }

  playThunder() {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    const sz = Math.floor(ctx.sampleRate * 1.4), buf = ctx.createBuffer(1, sz, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < sz; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.35));
    const src = ctx.createBufferSource(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 180; g.gain.value = 0.65;
    src.buffer = buf; src.connect(lp); lp.connect(g); g.connect(this.master!); src.start();
  }

  startSiren() {
    if (!this.enabled || this.sirenOsc) return;
    const ctx = this.getCtx();
    this.sirenGain = ctx.createGain();
    this.sirenGain.gain.setValueAtTime(0, ctx.currentTime);
    this.sirenGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 2);
    const osc = ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = 440;
    const lfo = ctx.createOscillator(), lfoGain = ctx.createGain();
    lfo.frequency.value = 0.4; lfoGain.gain.value = 180;
    lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
    const filter = ctx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 600; filter.Q.value = 1.5;
    osc.connect(filter); filter.connect(this.sirenGain); this.sirenGain.connect(this.master!);
    lfo.start(); osc.start(); this.sirenOsc = osc;
  }

  startDeepRumble() {
    if (!this.enabled || this.deepRumbleOsc) return;
    const ctx = this.getCtx();
    this.deepRumbleGain = ctx.createGain();
    this.deepRumbleGain.gain.setValueAtTime(0, ctx.currentTime);
    this.deepRumbleGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 3);
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
    o1.type = 'sine'; o2.type = 'sine'; o1.frequency.value = 28; o2.frequency.value = 19;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 80;
    o1.connect(lp); o2.connect(lp); lp.connect(this.deepRumbleGain); this.deepRumbleGain.connect(this.master!);
    o1.start(); o2.start(); this.deepRumbleOsc = o1;
  }

  playAlienLine(lineIndex: number): number {
    if (!this.enabled) return 1200;
    const ctx = this.getCtx();
    return playAlienLine(ctx, this.master!, lineIndex);
  }

  silenceAll() {
    if (!this.ctx || !this.master) return;
    this.master.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.4);
  }

  restoreMaster() {
    if (!this.ctx || !this.master) return;
    this.master.gain.linearRampToValueAtTime(0.55, this.ctx.currentTime + 0.1);
  }

  teardown() {
    [this.windSrc, this.rumbleOsc, this.sirenOsc, this.deepRumbleOsc, this.ambientSrc].forEach(n => { try { (n as any)?.stop(); } catch {} });
    try { this.ctx?.close(); } catch {}
    this.windSrc = null; this.rumbleOsc = null; this.sirenOsc = null; this.deepRumbleOsc = null;
    this.windGain = null; this.rumbleGain = null; this.sirenGain = null; this.deepRumbleGain = null;
    this.ambientSrc = null; this.ambientGain = null;
    this.ctx = null; this.master = null; this.enabled = false;
  }
}

// ─── Rotating message hook ────────────────────────────────────────────────────

function useRotating(messages: string[], intervalMs: number): string {
  const [idx, setIdx] = useState(0);
  useEffect(() => { setIdx(0); }, [messages]);
  useEffect(() => {
    if (messages.length <= 1) return;
    const id = setInterval(() => setIdx(i => (i + 1) % messages.length), intervalMs);
    return () => clearInterval(id);
  }, [messages, intervalMs]);
  return messages[Math.min(idx, messages.length - 1)] ?? messages[0];
}

// ─── Alien Transmission Component ────────────────────────────────────────────

const ALIEN_SUBTITLES = [
  'WE ARE HERE.',
  'WE HAVE ALWAYS BEEN HERE.',
  'HARVESTING YOUR HUMAN FORMS.',
  'CREATING CROSS BREEDS.',
  'YOU ARE US.',
  'NOW IS THE TIME.',
];

interface AlienTransmissionProps {
  onCheckTomorrow: () => void;
  audioRef: React.MutableRefObject<WeatherAudio>;
  soundOn: boolean;
}

// Ending sequence steps after main subtitles
type EndingStep =
  | 'stare'          // 2.5s silent stare
  | 'translating'    // TRANSLATING...
  | 'nevermind'      // ACTUALLY NEVERMIND.
  | 'weather'        // TOMORROW: 74° PARTLY CLOUDY
  | 'confidence'     // FORECAST CONFIDENCE 2% SEEMS FINE.
  | 'believe'        // WE BELIEVE IN YOU.
  | 'happens'        // THIS HAPPENS SOMETIMES.
  | 'anyway'         // ANYWAY.
  | 'button';        // CHECK TOMORROW

function AlienTransmission({ onCheckTomorrow, audioRef, soundOn }: AlienTransmissionProps) {
  const [subtitleIdx, setSubtitleIdx] = useState(-1);
  const [mouthOpen, setMouthOpen] = useState(false);
  const [glitch, setGlitch] = useState(false);
  const [headOffset, setHeadOffset] = useState({ x: 0, y: 0 });
  const [endingStep, setEndingStep] = useState<EndingStep | null>(null);

  useEffect(() => {
    const t = setTimeout(() => runSubtitle(0), 2000);
    return () => clearTimeout(t);
  }, []);

  const runEnding = () => {
    // Step 1: silent stare 2.5s
    setEndingStep('stare');
    let t = 2500;

    // Step 2: TRANSLATING...
    setTimeout(() => setEndingStep('translating'), t); t += 900;
    // Step 3: ACTUALLY NEVERMIND.
    setTimeout(() => setEndingStep('nevermind'), t); t += 1100;
    // Step 4: weather glitch
    setTimeout(() => setEndingStep('weather'), t); t += 1200;
    // Step 5: confidence
    setTimeout(() => setEndingStep('confidence'), t); t += 1400;
    // Step 6a: WE BELIEVE IN YOU.
    setTimeout(() => { setEndingStep('believe'); setMouthOpen(true); audioRef.current.playAlienLine(0); }, t); t += 1600;
    // Step 6b: THIS HAPPENS SOMETIMES.
    setTimeout(() => { setEndingStep('happens'); setMouthOpen(true); audioRef.current.playAlienLine(1); }, t); t += 1600;
    // Step 7: ANYWAY.
    setTimeout(() => { setEndingStep('anyway'); setMouthOpen(false); }, t); t += 1200;
    // Show button
    setTimeout(() => setEndingStep('button'), t);
  };

  const runSubtitle = (idx: number) => {
    if (idx >= ALIEN_SUBTITLES.length) {
      setSubtitleIdx(ALIEN_SUBTITLES.length);
      setMouthOpen(false);
      runEnding();
      return;
    }
    setSubtitleIdx(idx);
    setMouthOpen(true);
    const dur = audioRef.current.playAlienLine(idx);
    const headTimer = setInterval(() => {
      setHeadOffset({ x: (Math.random() - 0.5) * 3, y: (Math.random() - 0.5) * 2 });
    }, 180);
    const glitchTimer = setTimeout(() => {
      setGlitch(true); setTimeout(() => setGlitch(false), 120);
    }, dur * 0.6);
    setTimeout(() => {
      clearInterval(headTimer); setMouthOpen(false); setHeadOffset({ x: 0, y: 0 });
      setTimeout(() => runSubtitle(idx + 1), 800);
    }, dur);
    return () => { clearInterval(headTimer); clearTimeout(glitchTimer); };
  };

  const currentSubtitle = subtitleIdx >= 0 && subtitleIdx < ALIEN_SUBTITLES.length
    ? ALIEN_SUBTITLES[subtitleIdx] : null;

  // Ending overlay content
  const endingContent = () => {
    if (!endingStep || endingStep === 'stare') return null;
    if (endingStep === 'translating') return (
      <div className="alien-ending-msg">TRANSLATING...</div>
    );
    if (endingStep === 'nevermind') return (
      <div className="alien-ending-msg">ACTUALLY NEVERMIND.</div>
    );
    if (endingStep === 'weather') return (
      <div className="alien-ending-msg alien-ending-weather">
        TOMORROW: 74°<br />PARTLY CLOUDY
      </div>
    );
    if (endingStep === 'confidence') return (
      <div className="alien-ending-msg">
        FORECAST CONFIDENCE<br />
        <span style={{ fontSize: '1.8em', letterSpacing: '0.05em' }}>2%</span><br />
        SEEMS FINE.
      </div>
    );
    if (endingStep === 'believe') return (
      <div className="alien-subtitle"><span>WE BELIEVE IN YOU.</span></div>
    );
    if (endingStep === 'happens') return (
      <div className="alien-subtitle"><span>THIS HAPPENS SOMETIMES.</span></div>
    );
    if (endingStep === 'anyway') return (
      <div className="alien-subtitle"><span>ANYWAY.</span></div>
    );
    if (endingStep === 'button') return (
      <button className="alien-tomorrow-btn" onClick={onCheckTomorrow}>
        CHECK TOMORROW
      </button>
    );
    return null;
  };

  return (
    <div className="alien-screen">
      <div className="alien-crt" />
      <div
        className={`alien-head-wrap${glitch ? ' alien-glitch' : ''}`}
        style={{ transform: `translate(${headOffset.x}px, ${headOffset.y}px)` }}
      >
        <AlienHead mouthOpen={mouthOpen} />
      </div>
      {currentSubtitle && (
        <div className="alien-subtitle" key={subtitleIdx}>
          <span>{currentSubtitle}</span>
        </div>
      )}
      {endingContent()}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type AppMode = 'idle' | 'disaster' | 'tomorrow' | 'alien';

export default function Home() {
  const [mode, setMode] = useState<AppMode>('idle');
  const [stage, setStage] = useState<Stage>(0);
  const [tomorrow, setTomorrow] = useState<TomorrowState | null>(null);
  const [history, setHistory] = useState<TomorrowType[]>([]);
  const [city, setCity] = useState('YOUR CITY');
  const [glitching, setGlitching] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [lightning, setLightning] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [screenCrack, setScreenCrack] = useState(false);
  const [powerFlicker, setPowerFlicker] = useState(false);
  const [dayCount, setDayCount] = useState(0);

  const audioRef = useRef(new WeatherAudio());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lightningRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stageData = STAGES[stage];
  const tomorrowData = tomorrow;

  const displayTemp      = mode === 'tomorrow' && tomorrowData ? tomorrowData.temp : stageData.temp;
  const displayCondition = mode === 'tomorrow' && tomorrowData ? tomorrowData.condition : stageData.condition;
  const displayCondSub   = mode === 'tomorrow' && tomorrowData ? tomorrowData.conditionSub : stageData.conditionSub;
  const displayWind      = mode === 'tomorrow' && tomorrowData ? tomorrowData.wind : stageData.wind;
  const displayHumidity  = mode === 'tomorrow' && tomorrowData ? tomorrowData.humidity : stageData.humidity;
  const displayUV        = mode === 'tomorrow' && tomorrowData ? tomorrowData.uvIndex : stageData.uvIndex;
  const displayTicker    = mode === 'tomorrow' && tomorrowData ? tomorrowData.ticker : stageData.ticker;
  const displayCardClass = mode === 'tomorrow' && tomorrowData ? tomorrowData.cardClass : stageData.cardClass;
  const displayIconType  = mode === 'tomorrow' && tomorrowData ? tomorrowData.iconType : stageData.iconType;
  const displayWarnings  = mode === 'tomorrow' && tomorrowData ? tomorrowData.warnings : [];

  const footerMessages     = mode === 'tomorrow' && tomorrowData ? tomorrowData.messages : stageData.footerMessages;
  const confidenceMessages = mode === 'tomorrow' && tomorrowData ? [tomorrowData.confidence] : stageData.confidenceMessages;

  const footerMsg      = useRotating(footerMessages, 2800);
  const confidenceMsg  = useRotating(confidenceMessages, 2200);
  const bigMsgRotating = useRotating(mode === 'tomorrow' && tomorrowData ? tomorrowData.messages : ['HAVE A WONDERFUL DAY.'], 3000);

  const last3 = history.slice(-3);
  const goodTypes: TomorrowType[] = ['perfect', 'normal'];
  const badTypes: TomorrowType[] = ['storm', 'apocalypse', 'existential'];
  const allGood3 = last3.length === 3 && last3.every(t => goodTypes.includes(t));
  const allBad3  = last3.length === 3 && last3.every(t => badTypes.includes(t));
  const memoryMsg = allGood3 ? 'THIS LEVEL OF CALM IS STATISTICALLY CONCERNING.' : allBad3 ? 'YESTERDAY WAS LIKELY TEMPORARY.' : null;

  // ── Clock ──
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  // ── Geolocation ──
  useEffect(() => {
    const tryIpApi = () =>
      fetch('https://ip-api.com/json/?fields=status,city,regionCode,countryCode')
        .then(r => r.json())
        .then(d => {
          if (d.status === 'success' && d.city) {
            const c = d.city.toUpperCase();
            const r = d.regionCode || d.countryCode || '';
            setCity(r ? `${c}, ${r}` : c);
            return true;
          }
          return false;
        })
        .catch(() => false);

    const tryIpApiCo = () =>
      fetch('https://ipapi.co/json/')
        .then(r => r.json())
        .then(d => {
          if (d.city) {
            const c = d.city.toUpperCase();
            const r = d.region_code || d.country_code || '';
            setCity(r ? `${c}, ${r}` : c);
          }
        })
        .catch(() => {});

    tryIpApi().then(ok => { if (!ok) tryIpApiCo(); });
  }, []);

  // ── Cleanup ──
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (lightningRef.current) clearInterval(lightningRef.current);
      if (flickerRef.current) clearInterval(flickerRef.current);
      audioRef.current.teardown();
    };
  }, []);

  // ── Disaster stage runner ──
  const runStage = useCallback((s: Stage) => {
    setStage(s);
    const audio = audioRef.current;

    if (s === 1) {
      audio.playHappyChime(); setShaking(false); setScreenCrack(false); setPowerFlicker(false);
      if (lightningRef.current) { clearInterval(lightningRef.current); lightningRef.current = null; }
      if (flickerRef.current) { clearInterval(flickerRef.current); flickerRef.current = null; }
    }
    if (s === 2) { setGlitching(true); audio.playGlitch(); setTimeout(() => setGlitching(false), 900); }
    if (s === 3) { audio.startRumble(); }
    if (s === 4) { audio.startWind(); audio.intensifyWind(); setShaking(true); }
    if (s === 5) { audio.maxWind(); audio.playThunder(); lightningRef.current = setInterval(() => { setLightning(true); audio.playThunder(); setTimeout(() => setLightning(false), 90 + Math.random() * 80); }, 1600 + Math.random() * 1800); }
    if (s === 6) { audio.startSiren(); }
    if (s === 7) { audio.startDeepRumble(); flickerRef.current = setInterval(() => { setPowerFlicker(true); setTimeout(() => setPowerFlicker(false), 80 + Math.random() * 120); }, 2000 + Math.random() * 3000); }
    if (s === 8) {
      if (lightningRef.current) clearInterval(lightningRef.current);
      lightningRef.current = setInterval(() => { setLightning(true); audio.playThunder(); setTimeout(() => setLightning(false), 60 + Math.random() * 60); }, 800 + Math.random() * 1200);
    }
    if (s === 9) {
      // Trigger alien transmission: silence everything, flicker, then switch mode
      setScreenCrack(true);
      setShaking(false);
      setTimeout(() => {
        audio.silenceAll();
        if (lightningRef.current) { clearInterval(lightningRef.current); lightningRef.current = null; }
        if (flickerRef.current) { clearInterval(flickerRef.current); flickerRef.current = null; }
        setLightning(false);
        setPowerFlicker(false);
        // Brief flicker then alien screen
        setGlitching(true);
        setTimeout(() => {
          setGlitching(false);
          audio.restoreMaster();
          setMode('alien');
        }, 1800);
      }, 1200);
      return; // don't schedule next stage
    }

    if (s < 9) timerRef.current = setTimeout(() => runStage((s + 1) as Stage), STAGE_DURATIONS_MS[s]);
  }, []);

  // ── CHECK MY DAY ──
  const handleCheckDay = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (lightningRef.current) { clearInterval(lightningRef.current); lightningRef.current = null; }
    if (flickerRef.current) { clearInterval(flickerRef.current); flickerRef.current = null; }
    setGlitching(false); setLightning(false); setShaking(false); setScreenCrack(false); setPowerFlicker(false);
    setTomorrow(null);
    setMode('disaster');

    if (!hasInteracted) { setHasInteracted(true); setSoundOn(true); audioRef.current.enable(); }
    if (hasInteracted) { audioRef.current.teardown(); audioRef.current = new WeatherAudio(); if (soundOn) audioRef.current.enable(); }
    runStage(1);
  }, [hasInteracted, soundOn, runStage]);

  // ── CHECK TOMORROW ──
  const handleCheckTomorrow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (lightningRef.current) { clearInterval(lightningRef.current); lightningRef.current = null; }
    if (flickerRef.current) { clearInterval(flickerRef.current); flickerRef.current = null; }
    setGlitching(false); setLightning(false); setShaking(false); setScreenCrack(false); setPowerFlicker(false);
    setStage(0);

    if (!hasInteracted) { setHasInteracted(true); setSoundOn(true); audioRef.current.enable(); }
    if (hasInteracted) { audioRef.current.teardown(); audioRef.current = new WeatherAudio(); if (soundOn) audioRef.current.enable(); }

    const type = pickTomorrowType(history);
    const newHistory = [...history, type].slice(-10);
    setHistory(newHistory);
    setDayCount(c => c + 1);

    const state: TomorrowState = { ...TOMORROW_STATES[type], type };
    setTomorrow(state);
    setMode('tomorrow');

    const audio = audioRef.current;
    if (type === 'perfect' || type === 'normal') { audio.playHappyChime(); audio.startAmbient(type); }
    else if (type === 'uneasy') { audio.playGlitch(); audio.startRumble(); }
    else if (type === 'storm') {
      audio.startRumble(); audio.startWind(); audio.intensifyWind(); audio.playThunder();
      lightningRef.current = setInterval(() => { setLightning(true); audio.playThunder(); setTimeout(() => setLightning(false), 90 + Math.random() * 80); }, 1800 + Math.random() * 2000);
    } else if (type === 'apocalypse') {
      audio.startSiren(); audio.startRumble(); audio.startWind(); audio.maxWind();
      lightningRef.current = setInterval(() => { setLightning(true); audio.playThunder(); setTimeout(() => setLightning(false), 60 + Math.random() * 80); }, 900 + Math.random() * 1200);
      setShaking(true);
    } else if (type === 'existential') {
      audio.startAmbient('existential'); audio.startDeepRumble(); setScreenCrack(true);
      flickerRef.current = setInterval(() => { setGlitching(true); audio.playGlitch(); setTimeout(() => setGlitching(false), 400 + Math.random() * 500); }, 3500 + Math.random() * 4000);
    }
  }, [hasInteracted, soundOn, history]);

  // ── Alien reset → 72° sunny ──
  const handleAlienReset = useCallback(() => {
    audioRef.current.teardown();
    audioRef.current = new WeatherAudio();
    if (soundOn) audioRef.current.enable();
    setMode('idle');
    setStage(0);
    setTomorrow(null);
    setGlitching(false); setLightning(false); setShaking(false); setScreenCrack(false); setPowerFlicker(false);
  }, [soundOn]);

  // ─── Alien screen ───
  if (mode === 'alien') {
    return <AlienTransmission onCheckTomorrow={handleAlienReset} audioRef={audioRef} soundOn={soundOn} />;
  }

  const isDisasterRunning = mode === 'disaster' && stage > 0 && stage < 9;
  const isEndgame = mode === 'disaster' && stage >= 6;
  const isTomorrow = mode === 'tomorrow';
  const isDark = isEndgame || (isTomorrow && tomorrowData && ['apocalypse', 'existential', 'storm'].includes(tomorrowData.type));
  const isExistential = (mode === 'disaster' && stage === 9) || (isTomorrow && tomorrowData?.type === 'existential');
  const isApocalypse = isTomorrow && tomorrowData?.type === 'apocalypse';
  const showBigMessage = isTomorrow && tomorrowData && ['apocalypse', 'existential', 'uneasy', 'storm'].includes(tomorrowData.type);
  const isHeatStage = mode === 'disaster' && stage >= 3 && stage <= 8;
  const heatIntensity = mode === 'disaster' ? Math.max(0, (stage - 2) / 7) : 0;

  const cardClasses = ['haf-card', displayCardClass, glitching ? 'glitching' : '', shaking ? 'shaking' : '', powerFlicker ? 'power-flicker' : ''].filter(Boolean).join(' ');
  const iconColor = isDark ? 'rgba(255,255,255,0.85)' : isHeatStage ? `rgba(${Math.round(180 + heatIntensity * 60)},${Math.round(80 - heatIntensity * 60)},0,0.9)` : 'var(--ink)';

  return (
    <div className={`haf-app${screenCrack ? ' screen-crack' : ''}${isHeatStage ? ' heat-mode' : ''}`}
      style={isHeatStage ? { '--heat': heatIntensity } as React.CSSProperties : undefined}>
      {lightning && <div className="haf-lightning" />}
      {(stage >= 7 || isApocalypse) && <div className="haf-fire-glow" style={{ opacity: isApocalypse ? 0.8 : Math.min(1, (stage - 6) * 0.4) }} />}
      {isHeatStage && <div className="haf-heat-shimmer" style={{ opacity: heatIntensity * 0.6 }} />}
      {isExistential && <div className="haf-sky-crack" />}

      {showBigMessage && (
        <div className={`haf-big-message-overlay${isApocalypse ? ' haf-big-message-apocalypse' : ''}${isExistential ? ' haf-big-message-existential' : ''}`}>
          <div className="haf-big-message-text haf-rotating">{bigMsgRotating}</div>
        </div>
      )}

      {memoryMsg && isTomorrow && <div className="haf-memory-notice">{memoryMsg}</div>}
      {dayCount > 0 && <div className="haf-day-counter">DAY {dayCount}</div>}

      <header className="haf-header">
        <div className="haf-header-top">
          <h1 className="haf-title">FOURCAST</h1>

        </div>
        <div className="haf-tagline">HAVE A WONDERFUL DAY</div>
      </header>

      <div className={cardClasses}>
        {(stage >= 4 || (isTomorrow && tomorrowData && ['storm', 'apocalypse'].includes(tomorrowData.type))) && (
          <div className="haf-card-particles">
            {Array.from({ length: stage >= 7 || isApocalypse ? 28 : 18 }, (_, i) => (
              <div key={i} className="haf-hail-drop" style={{ left: `${(i * 13 + 7) % 100}%`, top: `${(i * 17 + 5) % 100}%`, animationDuration: `${0.4 + (i % 5) * 0.12}s`, animationDelay: `${(i * 0.09) % 0.8}s`, width: `${4 + (i % 3) * 2}px`, height: `${4 + (i % 3) * 2}px` }} />
            ))}
          </div>
        )}

        <div className="haf-card-inner" style={{ position: 'relative', zIndex: 2 }}>
          <div className="haf-card-top">
            <div className="haf-location-wrap">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" style={{ flexShrink: 0, opacity: 0.6 }}>
                <rect x="4" y="0" width="4" height="2" /><rect x="2" y="2" width="8" height="2" /><rect x="0" y="4" width="12" height="4" /><rect x="2" y="8" width="8" height="2" /><rect x="4" y="10" width="4" height="2" />
              </svg>
              <div className="haf-location">
                <span style={{ fontSize: 'clamp(5px, 0.8vw, 7px)', opacity: 0.6 }}>CURRENT LOCATION</span>
                <strong>{city}</strong>
              </div>
            </div>
            <div className="haf-time">{currentTime}</div>
          </div>

          <div className="haf-weather-row">
            <div className="haf-weather-icon" style={{ color: iconColor }}>
              <WeatherIcon type={displayIconType} />
            </div>
            <div className="haf-temp-block">
              <div className={`haf-temp${glitching ? ' haf-temp-glitch' : ''}`}>{displayTemp}</div>
              <div className="haf-condition-label">{displayCondition}</div>
              <div className="haf-condition-sub">{displayCondSub}</div>
            </div>
          </div>

          <hr className="haf-divider" />

          {(isEndgame || isApocalypse || isExistential) ? (
            <div className="haf-main-message-bar">
              <div className="haf-main-message">
                <span>HAVE A WONDERFUL</span><span>DAY</span><em className="haf-smiley">:)</em>
              </div>
            </div>
          ) : (
            <div className="haf-main-message">
              <span>HAVE A WONDERFUL</span><span>DAY</span><em className="haf-smiley">:)</em>
            </div>
          )}

          {(stage >= 4 || (isTomorrow && displayWarnings.length > 0)) && (
            <div className="haf-warnings">
              {isTomorrow ? displayWarnings.map((w, i) => (
                <div key={i} className={`haf-warning ${w.startsWith('✓') ? 'haf-warning-green' : w.includes('REALITY') ? 'haf-warning-purple' : w.includes('EARTH') || w.includes('EMERGENCY') ? 'haf-warning-orange' : 'haf-warning-red'}`}>{w}</div>
              )) : <>
                {stage >= 4 && <div className="haf-warning haf-warning-red">⚠ EXTREME HEAT WARNING</div>}
                {stage >= 5 && <div className="haf-warning haf-warning-orange">⚠ SKY BEHAVING INCORRECTLY</div>}
                {stage >= 6 && <div className="haf-warning haf-warning-red">⚠ CATASTROPHIC HEAT EVENT</div>}
                {stage >= 7 && <div className="haf-warning haf-warning-red haf-warning-flash">⚠ CIVIL EMERGENCY ALERT</div>}
                {stage >= 8 && <div className="haf-warning haf-warning-orange">⚠ TOTAL EARTH FAILURE</div>}
                {stage >= 6 && <div className="haf-warning haf-warning-green">✓ EVERYTHING IS FINE</div>}
              </>}
            </div>
          )}

          <div className="haf-stats">
            {[['WIND', displayWind], ['HUMIDITY', displayHumidity], ['UV INDEX', displayUV], ['CONFIDENCE', confidenceMsg]].map(([label, value]) => (
              <div key={label} className="haf-stat">
                <div className="haf-stat-label">{label}</div>
                <div className="haf-stat-value haf-rotating" style={{ whiteSpace: 'pre-line' }}>{value}</div>
                <div className="haf-stat-divider" />
              </div>
            ))}
          </div>

          <div className="haf-footer-copy haf-rotating" style={{ whiteSpace: 'pre-line' }}>{footerMsg}</div>
        </div>
      </div>

      {mode === 'disaster' && (
        <div className="haf-stage-dots" aria-hidden="true">
          {[1,2,3,4,5,6,7,8,9].map(s => (
            <div key={s} className={`haf-dot${stage >= s ? ' active' : ''}${s >= 7 ? ' haf-dot-endgame' : ''}`} />
          ))}
        </div>
      )}

      {mode === 'tomorrow' && history.length > 0 && (
        <div className="haf-stage-dots" aria-hidden="true">
          {history.slice(-9).map((t, i) => (
            <div key={i} className={`haf-dot active haf-dot-history haf-dot-${t}`} title={t} />
          ))}
        </div>
      )}

      <div className="haf-cta">
        {mode === 'idle' && (
          <button className="haf-btn" onClick={handleCheckDay}>
            CHECK MY DAY <span className="haf-btn-arrow">→</span>
          </button>
        )}
        {isDisasterRunning && (
          <div className="haf-running">
            <span className="haf-running-dot" />
            UPDATING FORECAST
          </div>
        )}
        {(mode === 'tomorrow') && (
          <button className="haf-btn haf-btn-tomorrow" onClick={handleCheckTomorrow}>
            CHECK TOMORROW <span className="haf-btn-arrow">→</span>
          </button>
        )}
        {(mode === 'tomorrow') && (
          <button className="haf-btn haf-btn-replay" onClick={handleCheckDay} style={{ marginTop: '8px' }}>
            CHECK TODAY <span className="haf-btn-arrow">→</span>
          </button>
        )}
      </div>

      <div className="haf-ticker-outer">
        <div className="haf-ticker-inner" key={`${mode}-${stage}-${tomorrowData?.type}`}>
          {displayTicker} · {displayTicker}
        </div>
      </div>

      {/* Below-fold SEO / AEO content — invisible to the experience */}
      <HellaRichSEO title="Fourcast" description="A weather app predicting the end of the world. Politely. Check your day." keywords="Fourcast, hella.rich, weather app, anxiety forecast, interactive humor, end of the world, web experience" />
    </div>
  );
}
