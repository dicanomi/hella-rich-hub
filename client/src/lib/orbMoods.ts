// ORB Mood System — Seven Deadly Sins
// An ancient emotional machine. Cinematic, elegant, A24 premium sci-fi.
// Not religious. Not gothic. Not evil fantasy.
// Each sin is a distinct emotional archetype.

export type MoodName =
  | 'LUST'
  | 'GLUTTONY'
  | 'GREED'
  | 'SLOTH'
  | 'WRATH'
  | 'ENVY'
  | 'PRIDE'
  | 'UNKNOWN';

export interface MoodConfig {
  name: MoodName;
  liquidColor: [number, number, number];
  rimColor: [number, number, number];
  glowColor: string;
  cssColor: string;
  turbulenceSpeed: number;
  turbulenceScale: number;
  rotationSpeed: number;
  glowIntensity: number;
  particleMode: 'drift' | 'swarm' | 'scatter' | 'still' | 'orbit' | 'flee';
  audioMode: 'pride' | 'greed' | 'lust' | 'wrath' | 'gluttony' | 'envy' | 'sloth' | 'unknown';
  messages: string[];
  subtitle: string;
  transitionMs: number;
}

export const MOODS: Record<MoodName, MoodConfig> = {

  // LUST — sky blue #4da6ff
  LUST: {
    name: 'LUST',
    liquidColor: [0.30, 0.65, 1.0],
    rimColor: [0.60, 0.82, 1.0],
    glowColor: 'rgba(77, 166, 255, 0.35)',
    cssColor: '#4da6ff',  // LUST — sky blue
    turbulenceSpeed: 0.22,
    turbulenceScale: 0.95,
    rotationSpeed: 0.55,
    glowIntensity: 0.85,
    particleMode: 'drift',
    audioMode: 'lust',
    messages: [
      'THE ORB WANTS ATTENTION.',
      'CLOSER.',
      'ENERGY DETECTED.',
      'IT FEELS YOU.',
      'MAGNETIC FIELD ACTIVE.',
      'STAY.',
    ],
    subtitle: 'MAGNETIC FIELD ACTIVE',
    transitionMs: 900,
  },

  // GLUTTONY — warm amber/orange #ff9900
  GLUTTONY: {
    name: 'GLUTTONY',
    liquidColor: [1.0, 0.60, 0.0],
    rimColor: [1.0, 0.80, 0.35],
    glowColor: 'rgba(255, 153, 0, 0.35)',
    cssColor: '#ff9900',  // GLUTTONY — warm amber/orange
    turbulenceSpeed: 0.42,
    turbulenceScale: 1.40,
    rotationSpeed: 0.80,
    glowIntensity: 0.95,
    particleMode: 'swarm',
    audioMode: 'gluttony',
    messages: [
      'MORE.',
      'STILL HUNGRY.',
      'NOT ENOUGH.',
      'ABSORBING.',
      'OVERFLOW DETECTED.',
      'CONSUMING.',
    ],
    subtitle: 'OVERFLOW DETECTED',
    transitionMs: 700,
  },

  // GREED — bright pure green #22bb33
  GREED: {
    name: 'GREED',
    liquidColor: [0.13, 0.73, 0.20],
    rimColor: [0.40, 0.95, 0.50],
    glowColor: 'rgba(34, 187, 51, 0.35)',
    cssColor: '#22bb33',  // GREED — bright pure green
    turbulenceSpeed: 0.28,
    turbulenceScale: 0.85,
    rotationSpeed: 1.10,
    glowIntensity: 0.80,
    particleMode: 'orbit',
    audioMode: 'greed',
    messages: [
      'MINE.',
      'MORE SIGNAL.',
      'HOLD ONTO IT.',
      'ACCUMULATING.',
      'DO NOT LET GO.',
      'POSSESSION CONFIRMED.',
    ],
    subtitle: 'ACCUMULATION IN PROGRESS',
    transitionMs: 800,
  },

  // SLOTH — light periwinkle blue #88ccff
  SLOTH: {
    name: 'SLOTH',
    liquidColor: [0.53, 0.80, 1.0],
    rimColor: [0.75, 0.92, 1.0],
    glowColor: 'rgba(136, 204, 255, 0.28)',
    cssColor: '#88ccff',  // SLOTH — light periwinkle blue
    turbulenceSpeed: 0.06,
    turbulenceScale: 0.50,
    rotationSpeed: 0.12,
    glowIntensity: 0.35,
    particleMode: 'still',
    audioMode: 'sloth',
    messages: [
      'STAY HERE.',
      'NO NEED TO MOVE.',
      'LATER.',
      'REST.',
      'IT IS COMFORTABLE HERE.',
      'SLOW DOWN.',
    ],
    subtitle: 'LOW ENERGY STATE',
    transitionMs: 2500,
  },

  // WRATH — pure bright red #ee1111
  WRATH: {
    name: 'WRATH',
    liquidColor: [0.93, 0.07, 0.07],
    rimColor: [1.0, 0.35, 0.30],
    glowColor: 'rgba(238, 17, 17, 0.38)',
    cssColor: '#ee1111',  // WRATH — pure bright red
    turbulenceSpeed: 0.95,
    turbulenceScale: 1.80,
    rotationSpeed: 2.20,
    glowIntensity: 1.0,
    particleMode: 'scatter',
    audioMode: 'wrath',
    messages: [
      'SOMETHING SHIFTED.',
      'TOO MUCH ENERGY.',
      'DO NOT PUSH.',
      'UNSTABLE.',
      'RELEASE.',
      'PRESSURE BUILDING.',
    ],
    subtitle: 'ENERGY INSTABILITY DETECTED',
    transitionMs: 350,
  },

  // ENVY — bright yellow #ffee22
  ENVY: {
    name: 'ENVY',
    liquidColor: [1.0, 0.93, 0.13],
    rimColor: [1.0, 0.98, 0.55],
    glowColor: 'rgba(255, 238, 34, 0.35)',
    cssColor: '#ffee22',  // ENVY — bright yellow
    turbulenceSpeed: 0.32,
    turbulenceScale: 1.10,
    rotationSpeed: 0.75,
    glowIntensity: 0.70,
    particleMode: 'swarm',
    audioMode: 'envy',
    messages: [
      'SOMETHING IS DIFFERENT.',
      'NOT YOURS.',
      'WATCHING.',
      'IT SEES WHAT YOU HAVE.',
      'WANTING.',
      'OBSERVING.',
    ],
    subtitle: 'OBSERVATION MODE ACTIVE',
    transitionMs: 1000,
  },

  // PRIDE — medium violet purple #9933cc
  PRIDE: {
    name: 'PRIDE',
    liquidColor: [0.60, 0.20, 0.80],
    rimColor: [0.82, 0.55, 1.0],
    glowColor: 'rgba(153, 51, 204, 0.35)',
    cssColor: '#9933cc',  // PRIDE — medium violet purple
    turbulenceSpeed: 0.18,
    turbulenceScale: 0.80,
    rotationSpeed: 0.40,
    glowIntensity: 0.90,
    particleMode: 'orbit',
    audioMode: 'pride',
    messages: [
      'THE ORB APPROVES.',
      'STABLE FIELD.',
      'PERFECTLY ALIGNED.',
      'OPTIMAL.',
      'NOTHING IS MISSING.',
      'COMPLETE.',
    ],
    subtitle: 'STABLE FIELD CONFIRMED',
    transitionMs: 1200,
  },

  // UNKNOWN — rare, unexpected, deep indigo-violet
  UNKNOWN: {
    name: 'UNKNOWN',
    liquidColor: [0.28, 0.08, 0.55],
    rimColor: [0.55, 0.30, 0.88],
    glowColor: 'rgba(70, 20, 140, 0.35)',
    cssColor: '#461488',
    turbulenceSpeed: 0.60,
    turbulenceScale: 2.20,
    rotationSpeed: 1.30,
    glowIntensity: 0.88,
    particleMode: 'scatter',
    audioMode: 'unknown',
    messages: [
      'UNUSUAL PATTERN DETECTED.',
      'THIS STATE SHOULD NOT EXIST.',
      'THE ORB CHANGED.',
      'UNDEFINED.',
      'SIGNAL ANOMALY.',
      'DO NOT TELL ANYONE.',
    ],
    subtitle: 'UNDEFINED STATE',
    transitionMs: 1100,
  },
};

export const MOOD_NAMES = Object.keys(MOODS) as MoodName[];

// Transition table — sins drift toward emotionally adjacent states
export const MOOD_TRANSITIONS: Record<MoodName, Array<[MoodName, number]>> = {
  LUST:     [['LUST',20],['GLUTTONY',18],['PRIDE',15],['ENVY',15],['GREED',12],['WRATH',8],['SLOTH',8],['UNKNOWN',4]],
  GLUTTONY: [['GLUTTONY',18],['LUST',18],['GREED',16],['WRATH',14],['PRIDE',12],['ENVY',10],['SLOTH',8],['UNKNOWN',4]],
  GREED:    [['GREED',20],['ENVY',18],['GLUTTONY',15],['PRIDE',15],['WRATH',12],['LUST',10],['SLOTH',6],['UNKNOWN',4]],
  SLOTH:    [['SLOTH',22],['PRIDE',18],['ENVY',15],['LUST',12],['GLUTTONY',10],['GREED',8],['WRATH',6],['UNKNOWN',9]],
  WRATH:    [['WRATH',16],['GLUTTONY',18],['GREED',16],['ENVY',14],['LUST',12],['PRIDE',10],['SLOTH',8],['UNKNOWN',6]],
  ENVY:     [['ENVY',20],['GREED',18],['WRATH',15],['LUST',14],['GLUTTONY',12],['SLOTH',10],['PRIDE',7],['UNKNOWN',4]],
  PRIDE:    [['PRIDE',22],['LUST',16],['SLOTH',15],['ENVY',12],['GREED',12],['GLUTTONY',10],['WRATH',8],['UNKNOWN',5]],
  UNKNOWN:  [['LUST',16],['WRATH',16],['ENVY',14],['GREED',14],['PRIDE',12],['GLUTTONY',12],['SLOTH',10],['UNKNOWN',6]],
};

export function weightedRandom<T>(options: Array<[T, number]>): T {
  const total = options.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [v, w] of options) { r -= w; if (r <= 0) return v; }
  return options[options.length - 1][0];
}

export function getRandomMessage(mood: MoodName): string {
  const msgs = MOODS[mood].messages;
  return msgs[Math.floor(Math.random() * msgs.length)];
}

// Hidden progression messages — revealed at interaction milestones
export const PROGRESSION_MESSAGES: Record<number, string[]> = {
  5:   ['SOMETHING SHIFTED.', 'IT NOTICED.'],
  15:  ['THE ORB REMEMBERED.', 'YOU WOKE IT.'],
  30:  ['DEEPER SIGNAL DETECTED.', 'IT LIKED THAT.'],
  50:  ['YOU FOUND SOMETHING.', 'THE FIELD IS OPEN.'],
  75:  ['THE ORB TRUSTS YOU.', 'SOMETHING UNLOCKED.'],
  100: ['YOU FOUND SOMETHING.', 'NOT MANY GET HERE.', 'THE ORB IS FULLY OPEN.'],
};
