// Date di calendario ragionate sul fuso orario italiano, indipendentemente da dove gira il codice.

export const FUSO = "Europe/Rome";

export interface Giorno {
  a: number;
  m: number;
  g: number;
}

const formatoParti = new Intl.DateTimeFormat("en-GB", {
  timeZone: FUSO,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function partiRoma(ms: number) {
  const out: Record<string, number> = {};
  for (const p of formatoParti.formatToParts(new Date(ms))) {
    if (p.type !== "literal") out[p.type] = Number(p.value);
  }
  return out;
}

/** Il giorno di calendario a Roma in cui cade l'istante. */
export function giornoRoma(ms: number): Giorno {
  const p = partiRoma(ms);
  return { a: p.year, m: p.month, g: p.day };
}

export function aggiungiGiorni(d: Giorno, n: number): Giorno {
  const t = new Date(Date.UTC(d.a, d.m - 1, d.g + n));
  return { a: t.getUTCFullYear(), m: t.getUTCMonth() + 1, g: t.getUTCDate() };
}

export function differenzaGiorni(da: Giorno, a: Giorno): number {
  return Math.round((Date.UTC(a.a, a.m - 1, a.g) - Date.UTC(da.a, da.m - 1, da.g)) / 86400000);
}

export function confrontaGiorni(x: Giorno, y: Giorno): number {
  return differenzaGiorni(y, x);
}

/** Istante (ms) corrispondente all'ora locale italiana indicata. */
export function istanteRoma(d: Giorno, ora: number, minuti = 0): number {
  const nominale = Date.UTC(d.a, d.m - 1, d.g, ora, minuti);
  let stima = nominale;
  for (let i = 0; i < 2; i++) {
    const p = partiRoma(stima);
    const comeUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    stima += nominale - comeUtc;
  }
  return stima;
}

export function giornoDaIso(iso: string): Giorno | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const g = { a: Number(m[1]), m: Number(m[2]), g: Number(m[3]) };
  const verifica = aggiungiGiorni(g, 0);
  return verifica.a === g.a && verifica.m === g.m && verifica.g === g.g ? g : null;
}

export function giornoInIso(d: Giorno): string {
  return `${String(d.a).padStart(4, "0")}-${String(d.m).padStart(2, "0")}-${String(d.g).padStart(2, "0")}`;
}

const lungo = new Intl.DateTimeFormat("it-IT", {
  timeZone: FUSO,
  day: "numeric",
  month: "long",
  year: "numeric",
});
const breve = new Intl.DateTimeFormat("it-IT", { timeZone: FUSO, day: "numeric", month: "long" });
const conGiorno = new Intl.DateTimeFormat("it-IT", {
  timeZone: FUSO,
  weekday: "long",
  day: "numeric",
  month: "long",
});

/** "20 novembre 2026" */
export function dataLunga(ms: number): string {
  return lungo.format(new Date(ms));
}
/** "20 novembre" */
export function dataBreve(ms: number): string {
  return breve.format(new Date(ms));
}
/** "venerdì 20 novembre" */
export function dataConGiorno(ms: number): string {
  return conGiorno.format(new Date(ms));
}

// ---- Fusi orari qualsiasi (biglietto: la consegna ha un fuso scelto da chi organizza) ----

function partiNelFuso(ms: number, fuso: string) {
  const f = new Intl.DateTimeFormat("en-GB", { timeZone: fuso, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  const out: Record<string, number> = {};
  for (const p of f.formatToParts(new Date(ms))) if (p.type !== "literal") out[p.type] = Number(p.value);
  return out;
}

/** Istante (ms) dell'ora locale indicata nel fuso dato. */
export function istanteNelFuso(d: Giorno, ora: number, minuti: number, fuso: string): number {
  const nominale = Date.UTC(d.a, d.m - 1, d.g, ora, minuti);
  let stima = nominale;
  for (let i = 0; i < 2; i++) {
    const p = partiNelFuso(stima, fuso);
    stima += nominale - Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  }
  return stima;
}

/** Scarto dal tempo universale, in minuti, del fuso in quell'istante (es. Roma d'estate: 120). */
export function scartoFusoMinuti(fuso: string, ms: number): number {
  const p = partiNelFuso(ms, fuso);
  return Math.round((Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(ms / 1000) * 1000) / 60000);
}

/** "(UTC+02:00) Roma" */
export function etichettaFuso(fuso: string, ms: number): string {
  const s = scartoFusoMinuti(fuso, ms);
  const segno = s < 0 ? "-" : "+";
  const a = Math.abs(s);
  const citta = (fuso.split("/").pop() ?? fuso).replace(/_/g, " ");
  const nomi: Record<string, string> = { Rome: "Roma", London: "Londra", Paris: "Parigi", Berlin: "Berlino", Madrid: "Madrid", "New York": "New York", Zurich: "Zurigo", Vienna: "Vienna", Lisbon: "Lisbona", Athens: "Atene" };
  return `(UTC${segno}${String(Math.floor(a / 60)).padStart(2, "0")}:${String(a % 60).padStart(2, "0")}) ${nomi[citta] ?? citta}`;
}

export function fusoValido(fuso: string): boolean {
  try {
    new Intl.DateTimeFormat("it-IT", { timeZone: fuso });
    return true;
  } catch {
    return false;
  }
}
