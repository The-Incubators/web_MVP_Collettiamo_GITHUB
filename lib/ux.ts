/**
 * Il contesto del catalogo: da dove si arriva decide quali azioni mostra (Gifty-spec-prodotto.md §5, §9).
 *
 * Fino al 5 novembre 2026 qui c'erano tre meccanismi di varianti (il cookie di «Scegli UX», `HOME_ATTIVA` e il
 * `?modo=` predefinito che dipendeva dalla home attiva). Sono stati tolti con la fase 1 della specifica (UX-02):
 * c'è una sola home e un solo sito. Resta solo `?modo=gruppo`, il contesto del regalo di gruppo, finché la fase 3
 * non lo sostituisce con il contesto del gruppo vero (la scelta o la proposta per il voto dentro una colletta).
 */

/**
 * «singolo» (da Idee regalo, la barra, i preferiti): cuore e «Guarda su Amazon».
 * «gruppo» (dal regalo di gruppo e dalle collette): la quota a testa, «Simula per N invitati» e «Regalalo».
 * Anche la scheda del prodotto (/prodotto/…) ha i due contesti, e il catalogo le passa il suo.
 */
export type ModoCatalogo = "gruppo" | "singolo";

/** Senza `?modo=` il catalogo è quello di Idee regalo. */
export const MODO_CATALOGO_PREDEFINITO: ModoCatalogo = "singolo";

/** Il catalogo del regalo di gruppo: lo usano le pagine del regalo di gruppo e delle collette. */
export const CATALOGO_GRUPPO = "/catalogo?modo=gruppo";

export function modoCatalogo(v: string | undefined): ModoCatalogo {
  return v === "gruppo" || v === "singolo" ? v : MODO_CATALOGO_PREDEFINITO;
}

/** Un indirizzo del catalogo o di una scheda prodotto nel contesto `modo` (si scrive solo se non è quello predefinito). */
export function conModo(percorso: string, modo: ModoCatalogo): string {
  return modo === MODO_CATALOGO_PREDEFINITO ? percorso : `${percorso}?modo=${modo}`;
}
