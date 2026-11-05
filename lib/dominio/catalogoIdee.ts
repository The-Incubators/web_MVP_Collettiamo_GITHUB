// I filtri del catalogo di Idee regalo (Gifty UX v2, prototipi/catalogo.html): temi a chip (le passioni di «Trova il
// regalo»), fasce di prezzo a segmenti, ordine curato come predefinito. Più le «Altre idee» della scheda prodotto.
// Funzioni pure.

import { CATEGORIE_INTERESSI, INTERESSI } from "../regalo/dati";
import { microDelProdotto } from "../regalo/punteggio";
import type { Prodotto } from "../tipi";

/** I temi nell'ordine del prototipo; le ultime due passioni seguono, perché hanno molti prodotti. */
const ORDINE_TEMI = ["casa", "tecnologia", "viaggi", "cultura", "stile", "gusto", "bellezza", "giochi"] as const;

export const TEMI_CATALOGO: { valore: string; etichetta: string }[] = ORDINE_TEMI.map((id) => ({
  valore: id,
  etichetta: CATEGORIE_INTERESSI.find((c) => c.id === id)?.etichetta ?? id,
}));

export const FASCE_CATALOGO = [
  { valore: "50", etichetta: "Fino a 50 €", minCent: 0, maxCent: 5000 },
  { valore: "150", etichetta: "50–150 €", minCent: 5000, maxCent: 15000 },
  { valore: "oltre", etichetta: "Oltre 150 €", minCent: 15000, maxCent: Infinity },
] as const;

export interface FiltriCatalogo {
  tema?: string;
  fascia?: string;
}

/** I filtri dell'indirizzo, solo se esistono. */
export function leggiFiltriCatalogo(tema: string | undefined, fascia: string | undefined): FiltriCatalogo {
  return {
    tema: TEMI_CATALOGO.find((t) => t.valore === tema)?.valore,
    fascia: FASCE_CATALOGO.find((f) => f.valore === fascia)?.valore,
  };
}

const categoriaDi = new Map(INTERESSI.map((x) => [x.id, x.categoria]));

/** I temi (passioni) di un prodotto, dalle sue micro-categorie. */
export function temiDelProdotto(p: Prodotto): string[] {
  return [...new Set(microDelProdotto(p).map((id) => categoriaDi.get(id)).filter((c): c is string => !!c))];
}

/** Filtra senza cambiare l'ordine (quello curato). Il limite superiore di una fascia è compreso. */
export function filtraCatalogo(prodotti: Prodotto[], f: FiltriCatalogo): Prodotto[] {
  const fascia = FASCE_CATALOGO.find((x) => x.valore === f.fascia);
  return prodotti.filter(
    (p) => (!f.tema || temiDelProdotto(p).includes(f.tema)) && (!fascia || (p.prezzoCent > fascia.minCent && p.prezzoCent <= fascia.maxCent)),
  );
}

/** L'indirizzo del catalogo con questi filtri; `modo` e `mostra` si scrivono solo se ci sono. */
export function hrefCatalogo(f: FiltriCatalogo & { modo?: string; mostra?: number }): string {
  const q = new URLSearchParams();
  if (f.modo) q.set("modo", f.modo);
  if (f.tema) q.set("tema", f.tema);
  if (f.fascia) q.set("fascia", f.fascia);
  if (f.mostra) q.set("mostra", String(f.mostra));
  const s = q.toString();
  return s ? `/catalogo?${s}` : "/catalogo";
}

/**
 * Le «Altre idee» sotto la scheda: i prodotti con più micro-categorie in comune, poi con lo stesso tema; a pari merito
 * l'ordine curato. Mai il prodotto stesso.
 */
export function altreIdee(p: Prodotto, tutti: Prodotto[], quante = 4): Prodotto[] {
  const micro = new Set(microDelProdotto(p));
  const temi = new Set(temiDelProdotto(p));
  return tutti
    .filter((x) => x.slug !== p.slug)
    .map((x, i) => {
      const suoi = microDelProdotto(x);
      const n = suoi.filter((m) => micro.has(m)).length * 10 + temiDelProdotto(x).filter((t) => temi.has(t)).length;
      return { x, n, i };
    })
    .sort((a, b) => b.n - a.n || a.i - b.i)
    .slice(0, quante)
    .map((r) => r.x);
}
