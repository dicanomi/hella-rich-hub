export type HellaChatLink = {
  label: string;
  href?: string;
  action?: "contact";
};

export type HellaChatAnswer = {
  id: string;
  label: string;
  match: string[];
  answer: string[];
  vocabulary?: string[];
  links?: HellaChatLink[];
};

export const HELLA_CHAT_FALLBACK =
  "I can answer best on hella.rich: the site, the apps, the stack, design, AI tools, audio, contact, or how it was made.";

export const HELLA_CHAT_STARTERS = [
  "Who is hella.rich?",
  "How was this built?",
  "Show the apps",
  "What is the AI stack?",
];

const PRODUCT_LINKS: HellaChatLink[] = [
  { label: "HELLA.4", href: "/deck" },
  { label: "HAPPY HUMAN", href: "/happy-human" },
  { label: "HELLA.FM", href: "/hella.fm" },
  { label: "HELLA_RADIO", href: "/radio" },
  { label: "HELLA.SYNTH", href: "/synth" },
  { label: "HELLA CONVERT", href: "/tools/convert" },
  { label: "HELLA EFFECTS", href: "/tools/effects" },
  { label: "THE_MACHINE.EXE", href: "/machine-exe" },
  { label: "HUMAN.EXE", href: "/human-exe" },
  { label: "ORB", href: "/orb" },
  { label: "DEAD AIR", href: "/dead-air" },
  { label: "AETHER", href: "/aether" },
  { label: "SPACE DRONE", href: "/space-drone" },
  { label: "LOW BATTERY", href: "/low-battery" },
  { label: "FOURCAST", href: "/fourcast" },
  { label: "THE EYE", href: "/the-eye" },
];

const PRODUCT_MATCH_TERMS = PRODUCT_LINKS.flatMap(({ label, href }) => [
  label,
  href.replace(/^\//, ""),
  href.replace(/^\//, "").replace(/[-/]/g, " "),
]);

const CORE_SITE_TERMS = [
  "hella",
  "hella rich",
  "hella.rich",
  "site",
  "website",
  "homepage",
  "home page",
  "portfolio",
  "lab",
  "product lab",
  "web app",
  "web apps",
  "browser",
  "creative",
  "interactive",
  "experiment",
  "experiments",
];

export const HELLA_CHAT_ANSWERS: HellaChatAnswer[] = [
  {
    id: "who",
    label: "who",
    match: ["who", "who is hella rich", "who is hella.rich", "jeffrey", "willis", "about", "bio", "creator", "founder", ...CORE_SITE_TERMS],
    answer: [
      "hella.rich is the product world of Jeffrey Willis: a collection of AI-native web apps, sound machines, visual systems, and strange useful browser tools.",
      "It shows how he thinks, designs, builds, tests, and ships interactive work with taste, speed, and a little controlled weirdness.",
    ],
    links: [
      { label: "LinkedIn", href: "https://www.linkedin.com/in/jeffreywillis/" },
      { label: "Contact hella.rich", action: "contact" },
    ],
  },
  {
    id: "why",
    label: "why",
    match: ["why", "purpose", "point", "meaning", "mission", "what is hella.rich", "hella rich"],
    answer: [
      "hella.rich is a small internet product lab. Built with AI, directed by a human.",
      "It exists to test what useful, weird, polished software can feel like when creative direction, interaction design, AI tools, audio, and browser tech all work together.",
    ],
  },
  {
    id: "apps",
    label: "apps",
    match: [
      "app",
      "apps",
      "products",
      "projects",
      "web apps",
      "tools",
      "show",
      "surface",
      "surfaces",
      ...PRODUCT_MATCH_TERMS,
    ],
    answer: [
      "Current surfaces: HELLA.4, HAPPY HUMAN, HELLA.FM, HELLA_RADIO, HELLA.SYNTH, HELLA CONVERT, HELLA EFFECTS, THE_MACHINE.EXE, HUMAN.EXE, ORB, DEAD AIR, AETHER, SPACE DRONE, LOW BATTERY, FOURCAST, and THE EYE.",
      "They cover browser audio, DSP, motion, image tools, market psychology, weird utilities, playful interfaces, and AI-assisted product experiments.",
    ],
    vocabulary: ["catalog", "grid", "stacked", "list", "launch", "record", "tune", "convert", "style", "play"],
    links: PRODUCT_LINKS,
  },
  {
    id: "built",
    label: "built",
    match: [
      "built",
      "build",
      "made",
      "how",
      "tech",
      "stack",
      "code",
      "frontend",
      "front end",
      "backend",
      "back end",
      "html",
      "css",
      "javascript",
      "typescript",
      "tsx",
      "react",
      "vite",
      "wouter",
      "tailwind",
      "radix",
      "cloudflare",
      "github",
      "wrangler",
    ],
    answer: [
      "hella.rich is a React 19 and TypeScript single-page app built with Vite, HTML, TSX, wouter routing, Tailwind CSS v4, custom CSS, Radix UI primitives, and lazy-loaded product routes.",
      "Production runs through GitHub, Cloudflare Pages, Cloudflare Pages Functions, Wrangler checks, route verification, responsive QA, and rollback-safe commits.",
    ],
    vocabulary: ["node", "json", "markdown", "seo", "sitemap", "robots", "llms.txt", "open graph", "asset", "route", "component"],
  },
  {
    id: "design",
    label: "design",
    match: ["design", "visual", "style", "brand", "motion", "3d", "webgl", "figma"],
    answer: [
      "The visual system is cinematic product lab: near-black surfaces, restrained type, strange product artifacts, thin borders, animated line sculptures, and a handmade AI-native edge.",
      "Design and motion stack includes Figma, Three.js, WebGL, Canvas 2D, SVG, GLB, PNG, WebP, custom fonts, Framer Motion thinking, GSAP thinking, and responsive clamp sizing.",
    ],
    vocabulary: ["animation", "animated", "line", "lines", "sculpture", "card", "cards", "image", "images", "visual", "visuals", "motion", "brand", "logo"],
  },
  {
    id: "ai",
    label: "ai",
    match: ["ai", "ai stack", "gemini", "openai", "codex", "claude", "manus", "kimi", "higgsfield", "midjourney", "gpt image", "claude code", "suno", "nano banana", "model"],
    answer: [
      "AI tools used across hella.rich include OpenAI GPT / Codex, Manus, Kimi, Claude, Gemini, Higgsfield, Midjourney, GPT Image, Claude Code, Claude Cowork, Nano Banana, and Suno.",
      "The pattern is human direction first: AI assists writing, code, debugging, QA, image generation, audio direction, and iteration. Final taste and shipping calls stay with Jeffrey.",
    ],
  },
  {
    id: "audio",
    label: "audio",
    match: ["audio", "sound", "music", "synth", "dsp", "radio", "fm"],
    answer: [
      "Audio work uses Tone.js, Web Audio API, oscillators, filters, envelopes, LFO modulation, FFT and waveform analysis, compression, limiting, waveshaping, delay, reverb, chorus, distortion, bitcrushing, static, MP3 station libraries, and browser-native playback systems.",
      "HELLA.FM, HELLA.SYNTH, DEAD AIR, AETHER, LOW BATTERY, and SPACE DRONE all live in that sound-first world.",
    ],
    vocabulary: ["tone", "tonejs", "web audio", "oscillator", "filter", "lfo", "fft", "waveform", "mp3", "station", "signal", "frequency", "drone"],
  },
  {
    id: "contact",
    label: "contact",
    match: ["contact", "email", "hire", "work", "linkedin", "reach", "collab", "collaborate"],
    answer: [
      "Contact hella.rich at hello@hella.rich.",
      "LinkedIn: linkedin.com/in/jeffreywillis.",
    ],
    links: [
      { label: "Contact hella.rich", action: "contact" },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/jeffreywillis/" },
    ],
  },
];

export function findHellaChatAnswer(rawQuestion: string) {
  const question = rawQuestion.toLowerCase().trim();
  if (!question) return HELLA_CHAT_ANSWERS[0];

  const normalized = question
    .replace(/[_•.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = new Set(normalized.split(" ").filter(Boolean));

  const scored = HELLA_CHAT_ANSWERS.map((answer) => {
    const searchable = [
      answer.label,
      ...answer.match,
      ...(answer.vocabulary ?? []),
      ...answer.answer,
      ...(answer.links ?? []).flatMap((link) => [link.label, link.href ?? ""]),
    ];

    const score = searchable.reduce((total, term) => {
      const normalizedTerm = term.toLowerCase().replace(/[_•.]/g, " ").replace(/\s+/g, " ").trim();
      if (normalized === normalizedTerm) return total + 100 + normalizedTerm.length;
      if (normalized.includes(normalizedTerm)) return total + 20 + normalizedTerm.length;
      if (normalizedTerm.includes(normalized)) return total + 12 + normalized.length;
      if (words.has(normalizedTerm)) return total + 14 + normalizedTerm.length;
      const termWords = normalizedTerm.split(" ").filter(Boolean);
      const overlap = termWords.filter((word) => words.has(word)).length;
      if (overlap) return total + overlap * 5;
      return total;
    }, 0);
    return { answer, score };
  }).sort((a, b) => b.score - a.score);

  return scored[0]?.score ? scored[0].answer : null;
}
