// Affinità fra le risposte del percorso e i prodotti del nostro catalogo, più i filtri dei risultati.
// Il percorso di partenza pesava: parole chiave 3, categoria 2, occasione 2, destinatario 1. Qui la «categoria»
// sono i nostri temi e il «destinatario» i nostri destinatari (uomo, donna).
//
// Il tema vale 1, non 2: le categorie dell'altro sito erano sette e strette, i nostri temi sono tre e larghissimi
// (l'arredamento da solo è il 42% del catalogo). A 2 punti un tema valeva quasi quanto una parola trovata nel testo
// e i risultati venivano fuori appiattiti, con decine di prodotti a pari punteggio: ora il tema separa i pari merito.
// Nessun prodotto viene escluso dal punteggio: i filtri (prezzo, ordine) restano una scelta esplicita.

import { INTERESSI } from "./dati";
import type { StatoRicerca } from "./stato";
import { FASCE_PREZZO, type Prodotto } from "../tipi";

export const ORDINI = [
  { id: "rilevanza", etichetta: "Rilevanza" },
  { id: "scelti", etichetta: "I nostri preferiti" },
  { id: "prezzo-su", etichetta: "Dal più economico" },
  { id: "prezzo-giu", etichetta: "Dal meno economico" },
] as const;

export type IdOrdine = (typeof ORDINI)[number]["id"];

/** Le fasce di prezzo dei risultati sono quelle del catalogo (FASCE_PREZZO), più «tutte». */
export const FASCIA_TUTTE = "tutte";

export interface FiltriRisultati {
  /** FASCIA_TUTTE, oppure l'id di una fascia di FASCE_PREZZO */
  fascia: string;
  ordine: IdOrdine;
}

export const filtriIniziali = (): FiltriRisultati => ({ fascia: FASCIA_TUTTE, ordine: "rilevanza" });

const perId = new Map(INTERESSI.map((x) => [x.id, x]));

/** Minuscolo, senza accenti, con i segni ridotti a spazi: "Caffè & Co." → " caffe   co ". */
export function normalizza(testo: string): string {
  return ` ${testo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()} `;
}

/** I testi del prodotto in cui si cercano le parole degli interessi. */
export function testoProdotto(p: Prodotto): string {
  return normalizza([p.nome, p.descrizione, p.perche ?? "", p.marca, p.sottocategoria ?? ""].join(" "));
}

export function punteggio(p: Prodotto, s: StatoRicerca, testo = testoProdotto(p)): number {
  let n = 0;
  const temi = p.temi ?? [];
  for (const id of s.interessi) {
    const interesse = perId.get(id);
    if (!interesse) continue;
    if (interesse.parole.some((parola) => testo.includes(normalizza(parola).trimEnd()))) n += 3;
    if (interesse.temi.some((t) => temi.includes(t))) n += 1;
  }
  // Il catalogo di Amazon non porta ancora le occasioni (`occasioni` è vuoto): la regola resta pronta per quando le avrà.
  if (s.occasione && s.occasione !== "altro" && p.occasioni.includes(s.occasione)) n += 2;
  // Quasi tutti i prodotti valgono per entrambi: questo distingue solo quelli pensati per una persona sola.
  if (s.genere && (p.destinatari ?? []).length === 1 && (p.destinatari ?? []).includes(s.genere)) n += 1;
  return n;
}

/** L'ordine deciso da chi gestisce il sito (1 = in cima); senza posizione si va in coda. */
const posizione = (p: Prodotto) => p.posizione ?? Number.MAX_SAFE_INTEGER;

export function ordinaProdotti(prodotti: Prodotto[], s: StatoRicerca, filtri: FiltriRisultati = filtriIniziali()): Prodotto[] {
  // «tutte» (e qualunque id sconosciuto) non filtra nulla.
  const fascia = filtri.fascia === FASCIA_TUTTE ? undefined : FASCE_PREZZO.find((f) => f.id === filtri.fascia);
  const righe = prodotti
    .filter((p) => !fascia || (p.prezzoCent > fascia.minCent && p.prezzoCent <= fascia.maxCent))
    .map((p) => ({ p, n: punteggio(p, s) }));
  // A pari merito vince l'ordine del sito: così due prodotti equivalenti escono sempre nello stesso ordine.
  const rilevanza = (a: { p: Prodotto; n: number }, b: { p: Prodotto; n: number }) =>
    b.n - a.n || posizione(a.p) - posizione(b.p) || a.p.prezzoCent - b.p.prezzoCent || a.p.nome.localeCompare(b.p.nome, "it");
  const confronti: Record<IdOrdine, (a: { p: Prodotto; n: number }, b: { p: Prodotto; n: number }) => number> = {
    rilevanza,
    scelti: (a, b) => posizione(a.p) - posizione(b.p) || rilevanza(a, b),
    "prezzo-su": (a, b) => a.p.prezzoCent - b.p.prezzoCent || rilevanza(a, b),
    "prezzo-giu": (a, b) => b.p.prezzoCent - a.p.prezzoCent || rilevanza(a, b),
  };
  return righe.sort(confronti[filtri.ordine] ?? rilevanza).map((r) => r.p);
}
