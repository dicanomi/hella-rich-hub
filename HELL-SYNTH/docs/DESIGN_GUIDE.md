# DESIGN_GUIDE.md — Design system & style guide

Aesthetic: **boutique hardware synth** — near-black surfaces, hairline
borders, recessed dark displays with glowing traces, hardware LEDs,
industrial typography. Restraint first: motion means something or it
doesn't exist.

## Color tokens

All defined once in `app/src/index.css` (`:root`) and mirrored into
Tailwind names in `tailwind.config.js`. Use Tailwind names in markup.

| Token | Tailwind | Hex | Use |
|---|---|---|---|
| `--bg-abyss` | `abyss` | `#0A0A0C` | page background |
| `--bg-panel` | `panel` | `#121216` | module/panel surface |
| `--bg-raised` | `raised` | `#1A1A20` | elevated surface (dropdowns, tooltips) |
| `--bg-display` | `display` | `#08080A` | recessed screens (scope, curve, XY pad) |
| `--line-hair` | `line-hair` | — | 1px hairline borders |
| `--line-bright` | `line-bright` | — | hover/focus border |
| `--ink-hi` | `ink-hi` | `#F2F0EB` | primary text (warm off-white) |
| `--ink-mid` | `ink-mid` | `#8E8E96` | labels |
| `--ink-low` | `ink-low` | `#55555E` | micro-labels, hints |
| `--accent-magenta` | `magenta` | `#FF2E88` | primary accent / ENV 1 / steps |
| `--accent-magenta-dim` | `magenta-dim` | `#8A1B4D` | accent shadow/glow |
| `--accent-cyan` | `cyan` | `#00E5C7` | traces, status, SYNC |
| `--accent-cyan-dim` | `cyan-dim` | `#0B6B5F` | cyan glow |
| `--signal-red` | `signal-red` | — | record, delete |
| `--warn-amber` | `warn-amber` | — | latency warnings |
| `--led-green` | `led-green` | `#7CFF6B` | LED on |
| `--env-2` | `env2` | `#FF7A3D` | ENV 2 identity |
| `--lfo-2` / `--lfo-3` | `lfo2` / `lfo3` | — | LFO identity colors |
| HUMAN identity | — | `#FFD166` | HUMAN source chip / clap LED |

Shadows: `shadow-recessed` (inset, for displays), `shadow-raised`,
`shadow-glow-magenta` / `glow-cyan` for lit LEDs.

## Typography

Loaded in `index.html` from Google Fonts:

| Role | Font | Tailwind | Usage |
|---|---|---|---|
| Display | Bricolage Grotesque (400/600/800) | `font-display` | hero headlines, big numbers |
| UI | Archivo (400–700) | `font-sans` | labels, buttons; `ss01` feature on |
| Data | Fragment Mono | `font-mono` | values, readouts, status bar; `tabular-nums` enforced |

Scale conventions: panel titles 10px semibold uppercase tracking 0.18em;
micro-labels 8–9px mono uppercase; values 10–13px mono. Radius is
`rounded-[2px]`–`rounded-[4px]` everywhere — never pill shapes on panels.

## Component anatomy

**ModuleSection** (`src/components/controls/ModuleSection.tsx`) is the
canonical panel: LED dot + 10px uppercase title + right-aligned status,
1px hairline under header, `p-4` body. Every instrument module uses it.

**Controls** (`src/components/controls/`): `Knob` (mini/std sizes,
drag ↕, double-click reset, shift = fine), `LEDToggle`, `SegControl`,
`BipolarSlider`, `DarkSelect`. Knobs are magenta or cyan by function.

**Displays**: recessed `bg-display` wells drawing to canvas — scope,
filter curve, envelope editor, XY pad (phosphor trail), HUMAN trace.

## Layout (instrument)

- Root: `flex h-[100dvh] flex-col overflow-hidden` — TopBar, Visualizer
  strip, `main` (scrolls), KeyboardStrip, StatusBar.
- `main`: `grid grid-cols-12 gap-3` → 3 / 6 / 3 columns
  (filter+modulation | oscillators+sequencer | FX+XY).
- 1024–1279px = compact: right column moves into a slide-in drawer.
- <1024px: desktop-only gate screen.
- `main` reserves `scrollbar-gutter: stable` so scrollbars never shift
  the layout.

## Motion rules (hard-won — follow them)

1. **Containers never animate size or position.** No boot stagger, no
   height tweens on panels. Motion is allowed *inside* displays
   (canvases), on micro-interactions (hover color, LED pulse), and for
   user-summoned overlays (drawer, modal).
2. **Never put a `height: 100%` canvas in normal flow inside an
   auto-height container.** A canvas's backing-store size is its intrinsic
   size; combined with percentage CSS it forms a feedback loop that grows
   the layout on every resize ("the melt", fixed in Aug 2026 — see
   HANDOFF_NOTES). Canvases in flexible containers must be
   `absolute inset-0 h-full w-full` inside a `relative` parent that has a
   definite or flex-stretched height.
3. Flex/grid children that contain shrinking content get `min-w-0`.
4. Rows that can overflow at narrow widths wrap (`flex-wrap`) instead of
   spilling.
5. Status LEDs pulse (`vox-led-pulse`, opacity only) — the one always-on
   ambient motion besides the displays.

## Iconography & copy

lucide icons only. Copy is terse, uppercase, technical:
`CLICK = GATE · DRAG ↕↔ = PITCH · № = LENGTH`. Signal-flow footer:
`KEYS → OSC A+B → LADDER → MATRIX → FX → OUT`.
