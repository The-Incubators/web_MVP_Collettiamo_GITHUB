// L'ordine con cui i prodotti compaiono nel catalogo, deciso da chi gestisce il sito.
// Due modi: «trascinamento» (l'ordine è quello della lista) e «stelle» (prima le stelle più alte;
// a parità, conta la posizione nella lista).

export type ModoOrdine = "trascinamento" | "stelle";

export const STELLE_PREDEFINITE = 3;

export interface ImpostazioniCatalogo {
  modo: ModoOrdine;
  /** gli slug nell'ordine manuale */
  ordine: string[];
  /** da 1 a 5; chi non c'è vale STELLE_PREDEFINITE */
  stelle: Record<string, number>;
  aggiornatoIl: number;
  aggiornatoDa: string;
}

type Base = Pick<ImpostazioniCatalogo, "modo" | "ordine" | "stelle">;

/** L'ordine manuale, completato con gli slug che non ci sono (in coda) e ripulito da quelli che non esistono più. */
export function ordineManuale(slugs: string[], ordine: string[]): string[] {
  const noti = new Set(slugs);
  const visti = new Set<string>();
  const out: string[] = [];
  for (const s of ordine) {
    if (noti.has(s) && !visti.has(s)) {
      visti.add(s);
      out.push(s);
    }
  }
  for (const s of slugs) if (!visti.has(s)) out.push(s);
  return out;
}

export function stelleDi(stelle: Record<string, number>, slug: string): number {
  const n = stelle[slug];
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : STELLE_PREDEFINITE;
}

/** L'ordine finale, quello con cui si mostrano i prodotti. */
export function ordineEffettivo(slugs: string[], imp: Base): string[] {
  const base = ordineManuale(slugs, imp.ordine);
  if (imp.modo === "trascinamento") return base;
  const posizione = new Map(base.map((s, i) => [s, i]));
  return [...base].sort((a, b) => stelleDi(imp.stelle, b) - stelleDi(imp.stelle, a) || (posizione.get(a) ?? 0) - (posizione.get(b) ?? 0));
}

/** slug → posizione (1 = in cima), da scrivere sui prodotti. */
export function posizioni(slugs: string[], imp: Base): Record<string, number> {
  return Object.fromEntries(ordineEffettivo(slugs, imp).map((s, i) => [s, i + 1]));
}

export function sposta<T>(lista: T[], da: number, a: number): T[] {
  if (da === a || da < 0 || a < 0 || da >= lista.length || a >= lista.length) return lista;
  const copia = [...lista];
  const [x] = copia.splice(da, 1);
  copia.splice(a, 0, x);
  return copia;
}

/** Controlla ciò che arriva dal browser: tutto sconosciuto o fuori scala viene rifiutato. */
export function validaImpostazioni(
  input: unknown,
  slugsNoti: string[],
): { ok: true; valore: Pick<ImpostazioniCatalogo, "modo" | "ordine" | "stelle"> } | { ok: false; errore: string } {
  if (!input || typeof input !== "object") return { ok: false, errore: "Dati non validi." };
  const d = input as Record<string, unknown>;
  if (d.modo !== "trascinamento" && d.modo !== "stelle") return { ok: false, errore: "Modo di ordinamento non valido." };
  const noti = new Set(slugsNoti);
  if (!Array.isArray(d.ordine) || d.ordine.length > 1000 || d.ordine.some((s) => typeof s !== "string" || !noti.has(s))) {
    return { ok: false, errore: "L'ordine contiene prodotti che non esistono." };
  }
  if (new Set(d.ordine as string[]).size !== d.ordine.length) return { ok: false, errore: "L'ordine contiene doppioni." };
  if (!d.stelle || typeof d.stelle !== "object" || Array.isArray(d.stelle)) return { ok: false, errore: "Stelle non valide." };
  const stelle: Record<string, number> = {};
  for (const [s, n] of Object.entries(d.stelle as Record<string, unknown>)) {
    if (!noti.has(s)) return { ok: false, errore: "Le stelle riguardano un prodotto che non esiste." };
    if (typeof n !== "number" || !Number.isInteger(n) || n < 1 || n > 5) return { ok: false, errore: "Le stelle vanno da 1 a 5." };
    stelle[s] = n;
  }
  return { ok: true, valore: { modo: d.modo, ordine: d.ordine as string[], stelle } };
}
