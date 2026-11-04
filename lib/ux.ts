/**
 * Le varianti di front-end del sito, fra cui si sceglie da «Scegli UX».
 *
 * Il sito di oggi è **UX_V4**, sulle rotte di sempre: ha sostituito UX_V1 (che resta nell'etichetta git
 * `ux-v1`). Le varianti di prova UX_V2 e UX_V3 sono state tolte quando è arrivata V4 (restano nella storia
 * di git). Una variante nuova vive nelle sue rotte e si aggiunge qui con `disponibile: true` e il suo `percorso`.
 *
 * La scelta sta in un **cookie** e non in `localStorage` perché così la può leggere anche il server, e la
 * pagina giusta si costruisce subito, senza il lampo della variante sbagliata. Non è un dato sensibile:
 * la scrive il browser, e il server si limita a leggerla.
 *
 * Il nome del cookie usa il marchio di quando è nato (`regaloop.`; oggi il progetto si chiama Gifty) e non si
 * rinomina, perché chi ha già scelto non perda la scelta. Per lo stesso motivo le chiavi più vecchie
 * (`colletta.preferiti`, `colletta.listaRegali`) tengono il prefisso di prima ancora (vedi DECISIONI.md, sezioni 20 e 29).
 */

export const COOKIE_UX = "regaloop.ux";

/** Un anno: la scelta è una preferenza, non una sessione. */
export const DURATA_COOKIE_UX = 60 * 60 * 24 * 365;

export interface VarianteUx {
  /** valore scritto nel cookie */
  id: string;
  /** come la chiamiamo fra noi */
  nome: string;
  /** una riga per riconoscerla */
  sommario: string;
  descrizione: string;
  /** da dove si entra in questa variante */
  percorso: string;
  /** false = annunciata ma non ancora pronta: si vede in elenco e non si può scegliere */
  disponibile: boolean;
}

export const VARIANTI_UX: VarianteUx[] = [
  {
    // UX_V4 ha preso il posto di UX_V1 sulle rotte di sempre (V1 resta nell'etichetta git `ux-v1`).
    // Un cookie rimasto a «v1» non trova più la sua voce e ricade qui, che è la stessa rotta.
    id: "v4",
    nome: "UX_V4",
    sommario: "Il sito di oggi, più semplice",
    descrizione:
      "Meno testo, una sola azione per schermata, barra in basso sul telefono. Catalogo, «Trova il regalo», colletta e biglietto nel disegno nuovo.",
    percorso: "/",
    disponibile: true,
  },
];

export const UX_PREDEFINITA = VARIANTI_UX[0];

/** La variante scelta. Un valore sconosciuto, o una non ancora pronta, riporta a quella predefinita. */
export function varianteUx(id: string | undefined | null): VarianteUx {
  return VARIANTI_UX.find((v) => v.id === id && v.disponibile) ?? UX_PREDEFINITA;
}

// ---------- Home e catalogo: due percorsi, regalo singolo e regalo di gruppo (4 novembre 2026) ----------

export type VersioneHome = "classica" | "nuova";

/**
 * Quale home va su «/» (components/home/Home.tsx): la «nuova», in prova, o la «classica» sul regalo di gruppo,
 * che intanto resta su /regalo-di-gruppo. Per tornare alla classica basta cambiare questa riga.
 */
export const HOME_ATTIVA: VersioneHome = "nuova";

/**
 * Il catalogo ha due varianti, secondo da dove si arriva (`?modo=` nell'indirizzo):
 * «gruppo» (dal regalo di gruppo e dalle collette) con la frase sulla quota, «Simula per N invitati», la quota a
 * testa e «Regalalo»; «singolo» senza tutto questo, con «Aggiungi ai preferiti» e «Guarda su Amazon».
 * Senza `modo` (barra in basso, Trova il regalo, preferiti…) vale quella che va con la home attiva.
 * Anche la scheda del prodotto (/prodotto/…) ha le due varianti, e il catalogo le passa la sua.
 */
export type ModoCatalogo = "gruppo" | "singolo";

export const MODO_CATALOGO_PREDEFINITO: ModoCatalogo = HOME_ATTIVA === "nuova" ? "singolo" : "gruppo";

/** Il catalogo del regalo di gruppo: lo usano le pagine del regalo di gruppo e delle collette. */
export const CATALOGO_GRUPPO = "/catalogo?modo=gruppo";

export function modoCatalogo(v: string | undefined): ModoCatalogo {
  return v === "gruppo" || v === "singolo" ? v : MODO_CATALOGO_PREDEFINITO;
}

/** Un indirizzo del catalogo o di una scheda prodotto nella variante `modo` (si scrive solo se non è quella predefinita). */
export function conModo(percorso: string, modo: ModoCatalogo): string {
  return modo === MODO_CATALOGO_PREDEFINITO ? percorso : `${percorso}?modo=${modo}`;
}
