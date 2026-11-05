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
        // Gifty UX v2 (docs/specs/gifty-ux-v2/design.md §3.1)
        paper: "var(--paper)",
        wall: "var(--wall)",
        table: "var(--table)",
        "card-paper": "var(--card-paper)",
        muted: "var(--muted)",
        "line-strong": "var(--line-strong)",
        green: "var(--green)",
        "green-hover": "var(--green-hover)",
        "green-press": "var(--green-press)",
        "green-field": "var(--green-field)",
        orange: "var(--orange)",
        peach: "var(--peach)",
      },
      borderRadius: {
        // Direzione A: superfici 20 px, controlli e bottoni 10 px.
        contenitore: "20px",
        controllo: "10px",
        // UX v2: raggi per ruolo
        paper: "var(--r-paper)",
        control: "var(--r-control)",
        surface: "var(--r-surface)",
        pill: "var(--r-pill)",
      },
      boxShadow: {
        // Ombre calde e diffuse del design system V4: livello 1 per le card, livello 2 per ciò che galleggia.
        carta: "0 4px 16px -2px rgba(95, 107, 100, 0.06)",
        sollevata: "0 12px 32px -4px rgba(3, 57, 34, 0.10)",
        // UX v2: l'unica ombra, per gli oggetti appoggiati sulla scena
        oggetto: "var(--ombra-carta)",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-testo)", "system-ui", "sans-serif"],
        // solo scritte a mano dentro gli oggetti-biglietto
        mano: ["var(--font-mano)", "cursive"],
      },
      fontSize: {
        // UX v2 §3.2; t-hero e t-pagina crescono da 768 px (classi in app/sistema.css)
        piccolo: ["14px", "1.4"],
        corpo: ["16px", "1.45"],
        titolo: ["20px", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "700" }],
        sezione: ["24px", { lineHeight: "1.25", letterSpacing: "-0.015em", fontWeight: "700" }],
      },
      maxWidth: {
        partecipante: "420px",
        dashboard: "880px",
        catalogo: "1200px",
        pagina: "var(--page-max)",
      },
      minHeight: { tocco: "44px", azione: "52px" },
      minWidth: { tocco: "44px" },
    },
  },
  plugins: [],
};

export default config;
