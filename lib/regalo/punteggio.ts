// Affinità fra le risposte del percorso e i prodotti del nostro catalogo, più i filtri dei risultati.
// Pesi: micro-categoria scelta 3, macro-categoria scelta 2, tema 1, occasione 2, destinatario 1.
// Le micro di un prodotto vengono da lib/dati/microcategorie-prodotti.ts; per un prodotto non ancora classificato
// si ricavano dalle parole delle micro trovate nei suoi testi.
//
// Il tema vale 1: i nostri temi sono tre e larghissimi (l'arredamento da solo è il 42% del catalogo), quindi serve
// solo a separare i pari merito. Nessun prodotto viene escluso dal punteggio: il filtro di prezzo resta una scelta esplicita.

import { microDiCatalogo } from "../dati/microcategorie-prodotti";
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

/** Le micro-categorie di un prodotto: quelle del catalogo o, se non è ancora classificato, quelle le cui parole sono nei suoi testi. */
export function microDelProdotto(p: Prodotto, testo?: string): string[] {
  const note = microDiCatalogo(p);
  if (note.length) return note;
  const t = testo ?? testoProdotto(p);
  return INTERESSI.filter((x) => x.parole.some((parola) => t.includes(normalizza(parola).trimEnd()))).map((x) => x.id);
}

export function punteggio(p: Prodotto, s: StatoRicerca, testo?: string): number {
  let n = 0;
  const temi = p.temi ?? [];
  const micro = microDelProdotto(p, testo);
  for (const id of s.interessi) if (micro.includes(id)) n += 3;
  for (const macro of s.macro) {
    if (micro.some((m) => perId.get(m)?.categoria === macro)) n += 2;
    // il tema delle micro scelte di questa macro, o di tutta la macro se si è lasciato «va bene tutto»
    const delleScelte = s.interessi.map((id) => perId.get(id)).filter((x) => x?.categoria === macro);
    const affini = delleScelte.length ? delleScelte : INTERESSI.filter((x) => x.categoria === macro);
    if (affini.some((x) => x?.temi.some((t) => temi.includes(t)))) n += 1;
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
