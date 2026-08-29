import type { Config } from "tailwindcss";

/**
 * Design tokens mirror DESIGN.md exactly.
 * Every value here is driven by a CSS variable declared in app/globals.css.
 * DESIGN.md §8: never hardcode a hex color inline in a component — use these tokens.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // DESIGN.md §1 — Primary
        primary: "var(--color-primary)",
        "primary-light": "var(--color-primary-light)",
        accent: "var(--color-accent)",

        // DESIGN.md §1 — Background
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        "surface-alt": "var(--color-surface-alt)",

        // DESIGN.md §1 — Text
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-muted": "var(--color-text-muted)",
        "text-on-primary": "var(--color-text-on-primary)",
        "text-on-accent": "var(--color-text-on-accent)",

        // DESIGN.md §1 — Status
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)",
        "success-tint": "var(--color-success-tint)",
        "warning-tint": "var(--color-warning-tint)",
        "danger-tint": "var(--color-danger-tint)",

        // DESIGN.md §1 — Borders
        border: "var(--color-border)",
        "border-strong": "var(--color-border-strong)",
      },
      fontSize: {
        // DESIGN.md §2
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["14px", { lineHeight: "20px" }],
        base: ["16px", { lineHeight: "24px" }],
        lg: ["18px", { lineHeight: "26px" }],
        xl: ["22px", { lineHeight: "30px" }],
        "2xl": ["28px", { lineHeight: "36px" }],
        "3xl": ["36px", { lineHeight: "44px" }],
      },
      fontWeight: {
        // DESIGN.md §2 — two weights only, never a third.
        normal: "400",
        semibold: "600",
      },
      spacing: {
        // DESIGN.md §3 — 4px base unit
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        6: "24px",
        8: "32px",
        12: "48px",
      },
      borderRadius: {
        // DESIGN.md §4
        sm: "6px",
        md: "10px",
        lg: "16px",
        full: "9999px",
      },
      maxWidth: {
        // DESIGN.md §3 — desktop content max-width
        content: "1200px",
      },
      minHeight: {
        // DESIGN.md §5.1 general touch target / §6 organizer-screen touch target
        touch: "44px",
        "touch-organizer": "48px",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        // DESIGN.md §2 — booking codes and prices use tabular/monospace figures
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
