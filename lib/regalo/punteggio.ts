// Affinità fra le risposte del percorso e i prodotti del nostro catalogo, più i filtri dei risultati.
// Pesi: micro-categoria scelta 3, macro-categoria scelta 2, tema 1, occasione 2, destinatario 1.
// Le micro di un prodotto vengono da lib/dati/microcategorie-prodotti.ts; per un prodotto non ancora classificato
// si ricavano dalle parole delle micro trovate nei suoi testi.
//
// Il tema vale 1: i nostri temi sono tre e larghissimi (l'arredamento da solo è il 42% del catalogo), quindi serve
// solo a separare i pari merito. Nessun prodotto viene escluso dal punteggio: lo escludono solo la fascia d'età della
// seconda domanda (un filtro, perché un regalo per un bambino non può essere un vino) e il filtro di prezzo.

import { fasceEta, type FasciaEta } from "../dati/eta-prodotti";
import { microDiCatalogo } from "../dati/microcategorie-prodotti";
import { INTERESSI } from "./dati";
import type { StatoRicerca } from "./stato";
import { FASCE_PREZZO, type Prodotto } from "../tipi";

export const ORDINI = [
  { id: "rilevanza", etichetta: "Rilevanza" },
  { id: "scelti", etichetta: "I nostri preferiti" },
  { id: "prezzo-su", etichetta: "Dal più economico" },
  { id: "prezzo-giu", etichetta: "Dal più caro" },
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

/**
 * Il prodotto va bene per la fascia d'età scelta? Senza fascia scelta vanno bene tutti; un prodotto senza età (per
 * esempio un regalo da link, fuori dal catalogo) non si esclude, perché non sappiamo per chi è.
 */
export function adattoAllEta(p: Pick<Prodotto, "id">, eta: string | null): boolean {
  if (!eta) return true;
  const sue = fasceEta(p);
  return sue.length === 0 || sue.includes(eta as FasciaEta);
}

/** Solo i prodotti adatti alla fascia d'età scelta (vedi `adattoAllEta`). */
export const perEta = <T extends Pick<Prodotto, "id">>(prodotti: T[], eta: string | null): T[] =>
  prodotti.filter((p) => adattoAllEta(p, eta));

/** L'ordine deciso da chi gestisce il sito (1 = in cima); senza posizione si va in coda. */
const posizione = (p: Prodotto) => p.posizione ?? Number.MAX_SAFE_INTEGER;

export function ordinaProdotti(prodotti: Prodotto[], s: StatoRicerca, filtri: FiltriRisultati = filtriIniziali()): Prodotto[] {
  // «tutte» (e qualunque id sconosciuto) non filtra nulla.
  const fascia = filtri.fascia === FASCIA_TUTTE ? undefined : FASCE_PREZZO.find((f) => f.id === filtri.fascia);
  const righe = perEta(prodotti, s.eta)
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

/** Quanti prodotti ha ogni micro e ogni passione nel catalogo: nelle domande quelle sotto la soglia non si mostrano. */
export interface ConteggiPassioni {
  micro: Record<string, number>;
  macro: Record<string, number>;
}

/** I conteggi, calcolati sul server: al browser non serve l'intero catalogo. */
export function contaPassioni(prodotti: Prodotto[]): ConteggiPassioni {
  const categoriaDi = new Map(INTERESSI.map((x) => [x.id, x.categoria]));
  const micro: Record<string, number> = {};
  const macro: Record<string, number> = {};
  for (const p of prodotti) {
    const sue = microDelProdotto(p);
    for (const id of sue) micro[id] = (micro[id] ?? 0) + 1;
    for (const c of new Set(sue.map((id) => categoriaDi.get(id)))) if (c) macro[c] = (macro[c] ?? 0) + 1;
  }
  return { micro, macro };
}
