/**
 * Le sezioni della navigazione principale (Gifty-spec-prodotto.md §5): a quale voce appartiene una pagina.
 *
 * Si guarda il primo segmento esatto dell'indirizzo, non il prefisso: così /regalo-di-gruppo non accende più
 * «Trova regalo» come faceva il confronto con `startsWith("/regalo")` (UX-11).
 */

export type Sezione = "home" | "idee" | "gruppo" | "biglietto" | "preferiti" | "account";

const SEZIONI: Record<string, Sezione> = {
  // Idee regalo raccoglie le domande e il catalogo (S-02…S-05)
  idee: "idee",
  regalo: "idee",
  catalogo: "idee",
  prodotto: "idee",
  // il regalo di gruppo, dalla spiegazione alle pagine del gruppo (S-06…S-09)
  "regalo-di-gruppo": "gruppo",
  crea: "gruppo",
  gestisci: "gruppo",
  c: "gruppo",
  // il biglietto è un servizio a sé (Gifty-architettura-e-flussi.md §2)
  biglietto: "biglietto",
  preferiti: "preferiti",
  // le pagine che finiranno nell'account (S-11, S-12)
  account: "account",
  "le-mie-collette": "account",
  reminder: "account",
  accedi: "account",
};

/** La sezione di un indirizzo; `null` per le pagine fuori dalla navigazione (firma del biglietto, privacy, backoffice…). */
export function sezioneDi(percorso: string): Sezione | null {
  const primo = percorso.split(/[?#]/)[0].split("/").filter(Boolean)[0];
  if (primo === undefined) return "home";
  return SEZIONI[primo] ?? null;
}

/**
 * Il piè di pagina non c'è nei percorsi a passi (domande, wizard, editor del biglietto, accesso): a metà di un compito
 * distrae (audit T-05).
 */
export function piePaginaVisibile(percorso: string): boolean {
  const p = percorso.split(/[?#]/)[0];
  if (p === "/regalo" || ["/crea", "/accedi", "/biglietto/nuovo"].some((x) => p.startsWith(x))) return false;
  return !/^\/biglietto\/[^/]+\/(dettagli|design|anteprima)/.test(p);
}

/**
 * Le voci dell'account, uguali nel menu utente e nel piè di pagina (revisione di Cri, 5 novembre 2026). Finché l'area
 * dell'account non è rifatta portano alle pagine che esistono: i regali di gruppo organizzati sono in /le-mie-collette;
 * un elenco dei biglietti non c'è ancora, quindi «I miei biglietti» apre l'account.
 */
export const VOCI_ACCOUNT: { href: string; testo: string }[] = [
  { href: "/le-mie-collette", testo: "I miei regali" },
  { href: "/account", testo: "I miei biglietti" },
  { href: "/account", testo: "Il mio account" },
];
