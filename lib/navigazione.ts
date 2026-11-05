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
  // la cancellazione dell'account ha una sola via d'uscita, «Annulla» (prototipi/cancella-account.html, data-piede="no")
  if (p === "/regalo" || ["/crea", "/accedi", "/biglietto/nuovo", "/account/cancella"].some((x) => p.startsWith(x))) return false;
  return !/^\/biglietto\/[^/]+\/(dettagli|design|anteprima)/.test(p);
}

/**
 * Le voci dell'account, uguali nel menu utente (tendina su desktop, foglio della barra in basso sul telefono) e nel piè
 * di pagina (design.md §10.2; revisione di Cri, 5 novembre 2026). `icona` è il nome di IconaTratto.
 */
export const VOCI_ACCOUNT: { href: string; testo: string; icona: "regalo" | "biglietto" | "account" }[] = [
  { href: "/account/regali", testo: "I miei regali", icona: "regalo" },
  { href: "/account/biglietti", testo: "I miei biglietti", icona: "biglietto" },
  { href: "/account", testo: "Il mio account", icona: "account" },
];
