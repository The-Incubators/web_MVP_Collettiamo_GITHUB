// Regole pure della «bacheca» (wizard di creazione V2): titoli per occasione, colori dei temi, rivelazione, link.
// Niente Firebase qui: le usano la rotta server, il wizard e i test.

import type { ColoriBacheca, ModelloBiglietto, ModoRivelazione } from "../tipi";
import { slugDaNome } from "./biglietti";

// ---------- Titolo predefinito ----------

/** Il titolo che il wizard propone per ogni occasione; {nome} è il festeggiato. */
const TITOLI: Record<string, string> = {
  compleanno: "Buon compleanno, {nome}!",
  saluto: "Buona fortuna, {nome}!",
  pensione: "Buona pensione, {nome}!",
  laurea: "Complimenti per la laurea, {nome}!",
  nascita: "Un grande benvenuto, {nome}!",
  matrimonio: "Viva gli sposi, {nome}!",
  grazie: "Grazie di cuore, {nome}!",
  insegnante: "Grazie di tutto, {nome}!",
  allenatore: "Grazie, coach {nome}!",
  "anniversario-lavoro": "Buon anniversario, {nome}!",
  capo: "Tanti auguri, {nome}!",
  guarisci: "Rimettiti presto, {nome}!",
  condoglianze: "Ti siamo vicini, {nome}",
  animale: "Per {nome}, con affetto",
  festa: "Si festeggia, {nome}!",
  ricorrenze: "Tanti auguri, {nome}!",
  altro: "Per {nome}",
};

/** Il nome d'esempio dell'anteprima, finché non si scrive quello vero. */
export const NOME_ESEMPIO = "Marta";

export function titoloPredefinito(occasione: string, festeggiato: string): string {
  const nome = festeggiato.trim() || NOME_ESEMPIO;
  return (TITOLI[occasione] ?? TITOLI.altro).replace("{nome}", nome);
}

/** Il titolo da mostrare: quello scritto, o il predefinito dell'occasione. */
export function titoloEffettivo(titolo: string, occasione: string, festeggiato: string): string {
  return titolo.trim() || titoloPredefinito(occasione, festeggiato);
}

// ---------- Colori ----------

export const COLORE_HEX = /^#[0-9a-fA-F]{6}$/;

/** I tre colori di partenza di un tema: i due del gradiente e quello del titolo come accento. */
export function coloriDelModello(m: ModelloBiglietto): ColoriBacheca {
  const s = m.sfondo;
  if (s.tipo === "gradiente") return { sfondo1: s.da.toUpperCase(), sfondo2: s.a.toUpperCase(), accento: m.titolo.colore.toUpperCase() };
  const c = "colore" in s ? s.colore : "#FFFFFF";
  return { sfondo1: c.toUpperCase(), sfondo2: c.toUpperCase(), accento: m.titolo.colore.toUpperCase() };
}

/** Colori che arrivano dal browser: validi solo se tutti e tre sono #RRGGBB. */
export function coloriValidi(c: unknown): ColoriBacheca | null {
  const d = (c && typeof c === "object" ? c : {}) as Record<string, unknown>;
  const ok = (v: unknown): v is string => typeof v === "string" && COLORE_HEX.test(v);
  if (!ok(d.sfondo1) || !ok(d.sfondo2) || !ok(d.accento)) return null;
  return { sfondo1: d.sfondo1.toUpperCase(), sfondo2: d.sfondo2.toUpperCase(), accento: d.accento.toUpperCase() };
}

/** Luminanza relativa (WCAG) di un #RRGGBB. */
export function luminanza(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Testo scuro o bianco, quello che si legge meglio sul colore dato. */
export function testoSu(hex: string): "#16241F" | "#FFFFFF" {
  if (!COLORE_HEX.test(hex)) return "#16241F";
  const l = luminanza(hex);
  // contrasto con il bianco contro contrasto con il quasi-nero (#16241F ≈ 0.016)
  return (1.05 / (l + 0.05) >= (l + 0.05) / 0.066) ? "#FFFFFF" : "#16241F";
}

// ---------- Bigliettini ----------

/** I colori dei bigliettini (carta pastello): chi firma ne sceglie uno. */
export const COLORI_NOTA = ["#FFF4C2", "#FDEBD3", "#DDF3E4", "#FCE1E8", "#E8E1FA", "#FFE8DC"] as const;

/** Il colore scelto da chi firma, se è uno di quelli ammessi; altrimenti null. */
export function coloreNotaValido(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const c = v.toUpperCase();
  return (COLORI_NOTA as readonly string[]).includes(c) ? c : null;
}

/** Il colore con cui disegnare un bigliettino: quello scelto o, per le firme di prima, uno a turno. */
export function coloreDellaNota(scelto: string | null | undefined, posizione: number): string {
  return coloreNotaValido(scelto) ?? COLORI_NOTA[posizione % COLORI_NOTA.length];
}

// ---------- Sfondo ----------

export const SCURISCI_PREDEFINITO = 0.3;

export function scurisciValido(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? Math.round(Math.min(0.8, Math.max(0, v)) * 100) / 100 : SCURISCI_PREDEFINITO;
}

// ---------- Rivelazione ----------

export const MODI_RIVELAZIONE: { id: ModoRivelazione; nome: string; descrizione: string }[] = [
  { id: "griglia", nome: "Griglia", descrizione: "Tutti i messaggi compaiono insieme, come una parete di bigliettini." },
  { id: "storie", nome: "Storie", descrizione: "Un messaggio alla volta, si va avanti con un tocco." },
  { id: "film", nome: "Film", descrizione: "Parte da solo su sfondo scuro e finisce con i nomi di tutti." },
  { id: "scorrimento", nome: "Scorrimento", descrizione: "I messaggi appaiono uno dopo l’altro mentre si scorre." },
];

export const RIVELAZIONE_PREDEFINITA: ModoRivelazione = "storie";

export function rivelazioneValida(v: unknown): ModoRivelazione {
  return MODI_RIVELAZIONE.some((m) => m.id === v) ? (v as ModoRivelazione) : RIVELAZIONE_PREDEFINITA;
}

// ---------- Data dell'evento ----------

/** «2026-11-03» oppure vuota (è facoltativa). */
export function dataEventoValida(v: unknown): string {
  return typeof v === "string" && /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(v) ? v : "";
}

// ---------- Messaggio di benvenuto ----------

/** Il testo semplice della textarea come HTML del messaggio per il gruppo (gli a capo diventano <br>). */
export function htmlDaTestoSemplice(t: string): string {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\r?\n/g, "<br>");
}

// ---------- Link ----------

const ALFABETO = "abcdefghijklmnopqrstuvwxyz0123456789";

/** «Marta Rossi» → «marta-rossi-k3x9q2»: il nome si legge, il codice lo rende unico e difficile da indovinare. */
export function slugPerFesteggiato(festeggiato: string, casuale: () => number = Math.random): string {
  const base = slugDaNome(festeggiato).slice(0, 60).replace(/-+$/g, "") || "biglietto";
  let codice = "";
  for (let i = 0; i < 6; i++) codice += ALFABETO[Math.floor(casuale() * ALFABETO.length) % ALFABETO.length];
  return `${base}-${codice}`;
}
