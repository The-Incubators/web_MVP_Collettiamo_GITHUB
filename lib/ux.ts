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
