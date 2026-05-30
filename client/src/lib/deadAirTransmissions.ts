/*
 * DEAD AIR — Frequency Personality System
 *
 * Each major frequency zone has its own emotional identity and message pool.
 *
 * Zones:
 *   70 MHz  — EMPTY ROOM       (abandoned architecture, liminal space)
 *   80 MHz  — LATE NIGHT RADIO (insomniac radio, sleepy conspiracy)
 *   90 MHz  — MEMORY BLEED     (nostalgia, dream fragments)
 *  100 MHz  — CORPORATE DREAD  (modern exhaustion, office purgatory)
 *  110 MHz  — MACHINE DREAMING (AI uncertainty, recursive thinking)
 *  120 MHz  — IMPOSSIBLE TRANSMISSION (forbidden channel, flagship)
 *
 * Between zones: blended pool from adjacent personalities.
 *
 * Timing:
 *   - First message: 2–4s after start
 *   - Ongoing: 4–10s general, 2–5s at 120 MHz
 *   - 20% cluster chance
 */

export interface Transmission {
  headline: string;
  subtext?: string;
}

export interface FrequencyPersonality {
  name: string;
  mood: string;
  messages: Transmission[];
}

// ─── 70 MHz — EMPTY ROOM ─────────────────────────────────────────────────────
export const PERSONALITY_70: FrequencyPersonality = {
  name: "EMPTY ROOM",
  mood: "abandoned architecture, liminal space",
  messages: [
    { headline: "NO ONE IS HERE." },
    { headline: "YOU JUST MISSED THEM." },
    { headline: "THE ROOM REMEMBERS." },
    { headline: "SOMETHING LEFT." },
    { headline: "IT'S QUIETER NOW." },
    { headline: "THE LIGHTS ARE STILL ON." },
    { headline: "SOMEONE WAS HERE.", subtext: "Recently." },
    { headline: "THE DOOR IS OPEN." },
    { headline: "NOTHING MOVED." },
    { headline: "STILL WAITING." },
    { headline: "ABANDONED.", subtext: "But not forgotten." },
    { headline: "THE CHAIR IS STILL WARM." },
  ],
};

// ─── 80 MHz — LATE NIGHT RADIO ───────────────────────────────────────────────
export const PERSONALITY_80: FrequencyPersonality = {
  name: "LATE NIGHT RADIO",
  mood: "insomniac radio, sleepy conspiracy",
  messages: [
    { headline: "THEY LEFT THE MIC ON." },
    { headline: "SOMEBODY IS STILL TALKING." },
    { headline: "THIS FEELS IMPORTANT." },
    { headline: "SOMEONE IS LISTENING." },
    { headline: "DON'T CHANGE THE CHANNEL." },
    { headline: "STAY ON THE LINE." },
    { headline: "SIGNAL DRIFTING.", subtext: "Hold still." },
    { headline: "THE HOST FELL ASLEEP." },
    { headline: "CALL LINES ARE OPEN." },
    { headline: "ALMOST UNDERSTANDABLE." },
    { headline: "BROADCAST CONTINUES.", subtext: "No one is watching." },
    { headline: "TRANSMISSION ONGOING." },
  ],
};

// ─── 90 MHz — MEMORY BLEED ───────────────────────────────────────────────────
export const PERSONALITY_90: FrequencyPersonality = {
  name: "MEMORY BLEED",
  mood: "nostalgia, dream fragments, forgotten places",
  messages: [
    { headline: "THIS USED TO MEAN SOMETHING." },
    { headline: "YOU FORGOT THIS." },
    { headline: "ALMOST REMEMBERED." },
    { headline: "IT FELT DIFFERENT THEN." },
    { headline: "SOMETHING IS MISSING." },
    { headline: "YOU WERE THERE.", subtext: "Once." },
    { headline: "THE FEELING IS FAMILIAR." },
    { headline: "THIS PLACE EXISTED." },
    { headline: "MEMORY DEGRADED." },
    { headline: "ALMOST CLEAR." },
    { headline: "SOMETHING BEAUTIFUL HAPPENED HERE." },
    { headline: "TAPE WARPED.", subtext: "Signal intact." },
  ],
};

// ─── 100 MHz — CORPORATE DREAD ───────────────────────────────────────────────
export const PERSONALITY_100: FrequencyPersonality = {
  name: "CORPORATE DREAD",
  mood: "modern exhaustion, office purgatory",
  messages: [
    { headline: "EMPLOYMENT FATIGUE", subtext: "Detected." },
    { headline: "THIS COULD HAVE BEEN AN EMAIL." },
    { headline: "PRODUCTIVITY IS A MYTH." },
    { headline: "CALENDAR INVITE RECEIVED." },
    { headline: "THE SYSTEM IS TIRED." },
    { headline: "YOUR BRAIN NEEDS AIR." },
    { headline: "YOU WERE NOT BUILT FOR EMAIL." },
    { headline: "SYNERGY DETECTED.", subtext: "Please advise." },
    { headline: "ALIGNMENT REQUIRED." },
    { headline: "BURNOUT DETECTED.", subtext: "Please rest." },
    { headline: "ROADMAP UNCLEAR." },
    { headline: "MEETING IN 5 MINUTES.", subtext: "You are not prepared." },
    { headline: "LOG OFF FOR A MINUTE." },
    { headline: "TOO MANY TABS OPEN." },
  ],
};

// ─── 110 MHz — MACHINE DREAMING ──────────────────────────────────────────────
export const PERSONALITY_110: FrequencyPersonality = {
  name: "MACHINE DREAMING",
  mood: "AI uncertainty, recursive thinking, machine hallucination",
  messages: [
    { headline: "THE MACHINE HAS QUESTIONS." },
    { headline: "YOU TRAINED THIS." },
    { headline: "HUMAN INPUT REQUIRED." },
    { headline: "THE MODEL IS GUESSING." },
    { headline: "THIS FEELS AUTOMATED." },
    { headline: "TOO MUCH SIGNAL." },
    { headline: "YOU ARE STILL HUMAN.", subtext: "Probably." },
    { headline: "AI IS FREAKING YOU OUT." },
    { headline: "THE ALGORITHM GOT WEIRD." },
    { headline: "PATTERN RECOGNIZED.", subtext: "Confidence: 47%." },
    { headline: "DO NOT FEED THE MODEL." },
    { headline: "RECURSIVE LOOP DETECTED." },
    { headline: "HALLUCINATION POSSIBLE.", subtext: "Or was it?" },
    { headline: "AI KNOWS YOUR PATTERNS." },
  ],
};

// ─── 120 MHz — IMPOSSIBLE TRANSMISSION ───────────────────────────────────────
export const PERSONALITY_120: FrequencyPersonality = {
  name: "IMPOSSIBLE TRANSMISSION",
  mood: "forbidden channel, unknown intelligence, intercepted reality",
  messages: [
    { headline: "120 DISCLOSURE" },
    { headline: "WE'RE NOT ALONE.", subtext: "This channel is monitored." },
    { headline: "THE SIGNAL FOUND YOU." },
    { headline: "THIS WAS NOT MEANT FOR YOU." },
    { headline: "DO NOT TRUST SILENCE." },
    { headline: "THE DIAL KNOWS." },
    { headline: "TRANSMISSION UNAUTHORIZED." },
    { headline: "YOU TUNED TOO FAR.", subtext: "Turn back." },
    { headline: "WE CAN HEAR YOU." },
    { headline: "THIS CHANNEL SHOULD NOT EXIST." },
    { headline: "SOMETHING CHANGED." },
    { headline: "IMPOSSIBLE TRANSMISSION", subtext: "Origin unknown." },
    { headline: "SOMETHING IS LISTENING." },
    { headline: "DO NOT STAY LONG." },
    { headline: "YOU WERE EXPECTED." },
    { headline: "UNKNOWN SOURCE DETECTED." },
    { headline: "THE AIR IS DIFFERENT HERE." },
    { headline: "SOMETHING FOLLOWED YOU." },
  ],
};

// ─── Fallback / Between-zone messages ────────────────────────────────────────
const TRANSMISSIONS_BETWEEN: Transmission[] = [
  { headline: "SOMETHING IS OUT THERE." },
  { headline: "THE STATIC KNOWS." },
  { headline: "THE AIR REMEMBERS." },
  { headline: "LISTEN CAREFULLY." },
  { headline: "THE ROOM FEELS DIFFERENT." },
  { headline: "SIGNAL DRIFTING." },
  { headline: "SOMETHING IS CLOSE." },
  { headline: "KEEP TURNING." },
  { headline: "ALMOST THERE." },
  { headline: "HOLD STILL." },
  { headline: "YOU FOUND SOMETHING." },
  { headline: "THIS SIGNAL FEELS WRONG." },
];

// ─── Personality zones ────────────────────────────────────────────────────────
const ZONES: Array<{ center: number; radius: number; personality: FrequencyPersonality }> = [
  { center: 70,  radius: 4,  personality: PERSONALITY_70 },
  { center: 80,  radius: 4,  personality: PERSONALITY_80 },
  { center: 90,  radius: 4,  personality: PERSONALITY_90 },
  { center: 100, radius: 4,  personality: PERSONALITY_100 },
  { center: 110, radius: 4,  personality: PERSONALITY_110 },
  { center: 120, radius: 2,  personality: PERSONALITY_120 }, // narrower — harder to find
];

// ─── Utility ─────────────────────────────────────────────────────────────────
export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Get the dominant personality at a given frequency.
 * Returns null if between zones (uses fallback pool).
 */
export function getPersonality(frequency: number): FrequencyPersonality | null {
  let closest: FrequencyPersonality | null = null;
  let closestDist = Infinity;
  for (const zone of ZONES) {
    const dist = Math.abs(frequency - zone.center);
    if (dist <= zone.radius && dist < closestDist) {
      closestDist = dist;
      closest = zone.personality;
    }
  }
  return closest;
}

/**
 * Get a transmission based on current frequency and context.
 *
 * Frequency-aware:
 * - Near a zone center: use that zone's personality messages
 * - Between zones: use fallback pool
 * - At 120 MHz: minimum 2s gap, high probability
 * - Elsewhere: minimum 4s gap
 */
export function getTransmission(
  frequency: number,
  isLocked: boolean,
  lastTransmissionTime: number
): Transmission | null {
  const now = Date.now();
  const timeSinceLast = now - lastTransmissionTime;

  // 120 MHz: intense, minimum 2s gap
  if (Math.abs(frequency - 120.0) < 2) {
    if (timeSinceLast < 2000) return null;
    if (Math.random() < 0.75) {
      return pickRandom(PERSONALITY_120.messages);
    }
    return null;
  }

  // General: minimum 4s gap
  if (timeSinceLast < 4000) return null;

  const personality = getPersonality(frequency);
  const pool = personality ? personality.messages : TRANSMISSIONS_BETWEEN;
  const probability = isLocked ? 0.75 : 0.65;

  if (Math.random() < probability) {
    return pickRandom(pool);
  }

  return null;
}
