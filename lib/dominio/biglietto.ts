// Impaginazione e misure del biglietto: logica pura, una sola fonte per galleria, firma, anteprima, apertura,
// gestione e PDF (sezione 11 della specifica). Tutto è calcolato a una dimensione logica fissa della carta,
// così lo stile del testo appare identico ovunque (criterio di accettazione).

import type { DimensioneTesto, Firma } from "../tipi";

// Formato A (rapporto 1 : 1,414), reso a una dimensione logica fissa e poi scalato alla larghezza voluta.
export const LARGHEZZA_CARTA = 700;
export const RAPPORTO_CARTA = 1.4142135624;
export const ALTEZZA_CARTA = Math.round(LARGHEZZA_CARTA * RAPPORTO_CARTA); // 990
export const PADDING_PAGINA = 40;
export const GAP_COLONNE = 16;
export const GAP_RIQUADRI = 16;

/** Dimensioni del testo del messaggio, in px alla dimensione logica della carta. */
export const PX_DIMENSIONE: Record<DimensioneTesto, number> = { xs: 13, s: 17, m: 22, l: 30, xl: 40, xxl: 54 };

export function altezzaUtilePagina(): number {
  return ALTEZZA_CARTA - PADDING_PAGINA * 2;
}

export function larghezzaColonna(colonne: number): number {
  return (LARGHEZZA_CARTA - PADDING_PAGINA * 2 - GAP_COLONNE * (colonne - 1)) / colonne;
}

export interface MisuraRiquadro {
  id: string;
  altezza: number;
}

/** Una pagina interna impaginata: per ogni colonna, gli id dei riquadri nell'ordine. */
export interface PaginaImpaginata {
  colonne: string[][];
}

/**
 * Distribuisce i riquadri (di altezza nota) in pagine a `colonne` colonne, mettendo ogni riquadro nella colonna
 * più corta (a parità, la prima). Quando un riquadro non ci starebbe nella colonna più corta della pagina
 * corrente, si apre una pagina nuova. Un riquadro più alto dell'intera pagina viene messo da solo.
 */
export function impaginaMessaggi(
  misure: MisuraRiquadro[],
  colonne: number,
  usable: number = altezzaUtilePagina(),
  gap: number = GAP_RIQUADRI,
): PaginaImpaginata[] {
  const pagine: PaginaImpaginata[] = [];
  let cols: string[][] = [];
  let alt: number[] = [];
  const nuova = () => {
    cols = Array.from({ length: colonne }, () => []);
    alt = new Array(colonne).fill(0);
    pagine.push({ colonne: cols });
  };
  nuova();
  for (const m of misure) {
    let c = 0;
    for (let i = 1; i < colonne; i++) if (alt[i] < alt[c]) c = i;
    const serve = alt[c] + (cols[c].length ? gap : 0) + m.altezza;
    const paginaVuota = alt.every((x) => x === 0);
    if (serve > usable && !paginaVuota) {
      nuova();
      c = 0;
    }
    alt[c] += (cols[c].length ? gap : 0) + m.altezza;
    cols[c].push(m.id);
  }
  return pagine;
}

/** Numero totale di pagine del biglietto: 1 copertina + le pagine dei messaggi. */
export function numeroPagine(pagineMessaggi: PaginaImpaginata[]): number {
  return 1 + Math.max(0, pagineMessaggi.length);
}

/** Le firme da mostrare, nell'ordine scelto (ordineFirme) o per data; le nascoste si scartano. */
export function firmeOrdinate(firme: Firma[], ordine: string[] | null): Firma[] {
  const visibili = firme.filter((f) => !f.nascosta);
  if (!ordine) return [...visibili].sort((a, b) => a.creatoIl - b.creatoIl);
  const perId = new Map(visibili.map((f) => [f.id, f]));
  const out: Firma[] = [];
  for (const id of ordine) {
    const f = perId.get(id);
    if (f) {
      out.push(f);
      perId.delete(id);
    }
  }
  // le firme non ancora nell'ordine (arrivate dopo) vanno in coda, per data
  for (const f of [...perId.values()].sort((a, b) => a.creatoIl - b.creatoIl)) out.push(f);
  return out;
}

/** La prima pagina (1-based, copertina = 1) che ha ancora spazio in almeno una colonna, per la firma. */
export function primaPaginaConSpazio(pagineMessaggi: PaginaImpaginata[]): number {
  // Si firma in coda: l'ultima pagina dei messaggi, o la prima pagina interna se non ce ne sono.
  return pagineMessaggi.length === 0 ? 2 : 1 + pagineMessaggi.length;
}
