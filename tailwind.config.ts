import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        field: "var(--field)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        line: "var(--line)",
        "line-forte": "var(--line-forte)",
        accent: "var(--accent)",
        "accent-2": "var(--accent-2)",
        "on-accent": "var(--on-accent)",
        "accent-field": "var(--accent-field)",
        cta: "var(--cta)",
        "cta-2": "var(--cta-2)",
        "on-cta": "var(--on-cta)",
        "cta-field": "var(--cta-field)",
        gold: "var(--gold)",
        "gold-vivo": "var(--gold-vivo)",
        "gold-field": "var(--gold-field)",
        "gold-line": "var(--gold-line)",
        ok: "var(--ok)",
        "ok-field": "var(--ok-field)",
        error: "var(--error)",
        "error-field": "var(--error-field)",
      },
      borderRadius: {
        // UX_V4: card e fogli molto morbidi, controlli arrotondati; i bottoni sono pillole (rounded-full).
        contenitore: "24px",
        controllo: "16px",
      },
      boxShadow: {
        // Ombre calde e diffuse del design system V4: livello 1 per le card, livello 2 per ciò che galleggia.
        carta: "0 4px 16px -2px rgba(95, 107, 100, 0.06)",
        sollevata: "0 12px 32px -4px rgba(3, 57, 34, 0.10)",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-testo)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        partecipante: "420px",
        dashboard: "880px",
        catalogo: "1200px",
      },
      minHeight: { tocco: "44px", azione: "52px" },
      minWidth: { tocco: "44px" },
    },
  },
  plugins: [],
};

export default config;
