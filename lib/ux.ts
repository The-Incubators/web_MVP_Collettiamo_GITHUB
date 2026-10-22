/**
 * Le varianti di front-end del sito, fra cui si sceglie da «Scegli UX».
 *
 * Il sito di oggi è **UX_V4**, sulle rotte di sempre: ha sostituito UX_V1 (che resta nell'etichetta git
 * `ux-v1`). Le varianti di prova (UX_V2, UX_V3) vivono nelle loro rotte, così nessuna può rompere le altre;
 * una nuova si aggiunge in elenco con `disponibile: true` e il suo `percorso`.
 *
 * La scelta sta in un **cookie** e non in `localStorage` perché così la può leggere anche il server, e la
 * pagina giusta si costruisce subito, senza il lampo della variante sbagliata. Non è un dato sensibile:
 * la scrive il browser, e il server si limita a leggerla.
 *
 * Il nome del cookie usa il marchio nuovo (`regaloop.`), a differenza delle chiavi già in giro
 * (`colletta.preferiti`, `colletta.listaRegali`), che hanno il vecchio prefisso solo per non far perdere
 * a chi già usa il sito quello che aveva salvato (vedi sezione 20 di DECISIONI.md).
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
  {
    id: "v2",
    nome: "UX_V2",
    sommario: "Expressive Warmth, pensata per il telefono",
    descrizione:
      "Fondo crema, barra di navigazione in basso sempre a portata di pollice e creazione della colletta guidata in tre passi. È in costruzione: per ora ci sono la home e il primo passo della creazione, il resto del percorso continua nel sito principale.",
    percorso: "/v2",
    disponibile: true,
  },
  {
    id: "v3",
    nome: "UX_V3",
    sommario: "Interactive Action: simula la quota e parti",
    descrizione:
      "Stessi colori di UX_V2, interazione diversa: in home un simulatore che calcola la quota mentre scrivi, catalogo con filtri veri e due modi di sfogliare (griglia o una card alla volta), creazione in tre passi su una pagina sola con l'anteprima del messaggio.",
    percorso: "/v3",
    disponibile: true,
  },
];

export const UX_PREDEFINITA = VARIANTI_UX[0];

/** La variante scelta. Un valore sconosciuto, o una non ancora pronta, riporta a quella predefinita. */
export function varianteUx(id: string | undefined | null): VarianteUx {
  return VARIANTI_UX.find((v) => v.id === id && v.disponibile) ?? UX_PREDEFINITA;
}
