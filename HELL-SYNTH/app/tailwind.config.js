/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // VOXFORM design tokens (mirrored from CSS custom properties in index.css)
        abyss: "var(--bg-abyss)",
        panel: "var(--bg-panel)",
        raised: "var(--bg-raised)",
        display: "var(--bg-display)",
        "line-hair": "var(--line-hair)",
        "line-bright": "var(--line-bright)",
        "ink-hi": "var(--ink-hi)",
        "ink-mid": "var(--ink-mid)",
        "ink-low": "var(--ink-low)",
        magenta: "var(--accent-magenta)",
        "magenta-dim": "var(--accent-magenta-dim)",
        cyan: "var(--accent-cyan)",
        "cyan-dim": "var(--accent-cyan-dim)",
        "signal-red": "var(--signal-red)",
        "warn-amber": "var(--warn-amber)",
        "led-green": "var(--led-green)",
        env2: "var(--env-2)",
        lfo2: "var(--lfo-2)",
        lfo3: "var(--lfo-3)",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      fontFamily: {
        display: ["'Bricolage Grotesque'", "system-ui", "sans-serif"],
        sans: ["'Archivo'", "system-ui", "sans-serif"],
        mono: ["'Fragment Mono'", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        // Machined-instrument shadows (design.md §4)
        display: "inset 0 2px 8px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(0,0,0,0.9)",
        knob: "0 1px 0 rgba(255,255,255,0.06) inset, 0 8px 16px rgba(0,0,0,0.5)",
        "glow-magenta": "0 0 12px rgba(255,46,136,0.35)",
        "glow-cyan": "0 0 12px rgba(0,229,199,0.3)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}