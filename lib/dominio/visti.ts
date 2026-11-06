// «Visti di recente» (Gifty-ingressi-e-uscite.md §4.2; Cri, 6 nov): gli ultimi prodotti aperti, il più recente per primo.

/** Quante schede ricorda e mostra la striscia in home: una fila da quattro. */
export const MAX_VISTI = 4;

/** Uno slug del catalogo: lettere minuscole, cifre e trattini. Tutto il resto si scarta. */
const SLUG = /^[a-z0-9][a-z0-9-]{0,119}$/;

export function slugValido(s: unknown): s is string {
  return typeof s === "string" && SLUG.test(s);
}

/** La lista dopo aver aperto `slug`: in cima, senza doppioni, al massimo `max`. */
export function conVisto(lista: readonly string[], slug: string, max = MAX_VISTI): string[] {
  if (!slugValido(slug)) return [...lista];
  return [slug, ...lista.filter((s) => s !== slug)].slice(0, max);
}

/** Legge la lista salvata: ignora valori rovinati o estranei. */
export function leggiVisti(grezzo: string | null, max = MAX_VISTI): string[] {
  if (!grezzo) return [];
  try {
    const dati: unknown = JSON.parse(grezzo);
    if (!Array.isArray(dati)) return [];
    return [...new Set(dati.filter(slugValido))].slice(0, max);
  } catch {
    return [];
  }
}
