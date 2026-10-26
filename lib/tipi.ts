// Tipi di dominio. I nomi dei campi sono quelli esatti della sezione 5 della specifica.
// Gli istanti (Timestamp in Firestore) qui sono millisecondi dall'epoca: gli adattatori
// Firestore convertono da e verso Timestamp.

export const CATEGORIE = [
  "audio",
  "casa",
  "cucina",
  "benessere",
  "esperienze",
  "viaggio",
  "gioco",
  "ufficio",
] as const;
export type Categoria = (typeof CATEGORIE)[number];

export const OCCASIONI = [
  "compleanno",
  "laurea",
  "pensione",
  "nascita",
  "matrimonio",
  "saluto",
] as const;
export type Occasione = (typeof OCCASIONI)[number];

export const METODI = ["paypal", "satispay", "bonifico", "contanti"] as const;
export type Metodo = (typeof METODI)[number];

export type ModoQuota = "fissa" | "divisa" | "libera";
export type StatoColletta = "bozza" | "aperta" | "chiusa";
export type StatoPartecipante =
  | "invitato"
  | "aderito"
  | "dichiarato"
  | "confermato"
  | "rinunciato";

export interface Immagine {
  seme: string;
  icona: Categoria;
  /** percorso pubblico della foto (es. /foto-prodotti/PRD-001.webp); senza, si disegna l'illustrazione */
  foto?: string;
}

export interface Prodotto {
  slug: string;
  nome: string;
  marca: string;
  prezzoCent: number;
  categoria: Categoria;
  occasioni: string[];
  descrizione: string;
  consegnaGiorni: number;
  urlEsterno: string;
  immagine: Immagine;
  attivo: boolean;
  /** estensioni del catalogo reale */
  id?: string;
  perche?: string;
  /** "uomo" | "donna" */
  destinatari?: string[];
  /** "viaggio" | "tecnologia" | "arredamento" */
  temi?: string[];
  asin?: string;
  /** giorno in cui è stato rilevato il prezzo (AAAA-MM-GG) */
  rilevatoIl?: string;
  /** per l'arredamento: lampade da tavolo, vasi, specchi… */
  sottocategoria?: string;
  /** posizione nel catalogo decisa da chi gestisce il sito (1 = in cima); senza, si ordina per prezzo */
  posizione?: number;
  /**
   * Eliminato dall'area riservata: il prodotto resta nel catalogo (e nel file sorgente), ma non si mostra
   * più a chi visita il sito. È un campo a parte e non `attivo` perché `pnpm seed` riscrive `attivo: true`
   * a ogni importazione: un prodotto eliminato tornerebbe visibile da solo. Questo campo il seed non lo tocca.
   */
  eliminato?: boolean;
  /** fasce d'età dei prodotti importati dal backoffice (per gli altri vale lib/dati/eta-prodotti.ts) */
  eta?: string[];
  /**
   * Importato dal backoffice e non dal file del catalogo: `pnpm seed`, che toglie i prodotti assenti dal file,
   * questi li lascia stare.
   */
  importato?: boolean;
}

export interface ProdottoColletta {
  prodottoId: string | null;
  nome: string;
  prezzoCent: number;
  consegnaGiorni: number;
  urlEsterno: string;
  immagine: Immagine;
}

export interface Metodi {
  paypal: { attivo: boolean; valore: string };
  satispay: { attivo: boolean; valore: string };
  bonifico: { attivo: boolean; valore: string; intestatario: string };
  contanti: { attivo: boolean };
}

export type DestinazioneAvanzo = "biglietto" | "restituito" | "extra";

export interface Acquisto {
  fatto: boolean;
  speseCent: number | null;
  ricevutaUrl: string | null;
  destinazioneAvanzo: DestinazioneAvanzo | null;
}

/**
 * La votazione del regalo (estensione dello schema). Se presente, il regalo non è ancora deciso:
 * `prodotto` è un segnaposto finché la votazione non si chiude e vi viene scritto il vincitore.
 */
export interface Votazione {
  durataOre: number;
  /** chi partecipa può proporre altri regali */
  consentiProposte: boolean;
  /** null finché la raccolta non è aperta (bozza) */
  apertaIl: number | null;
  scade: number | null;
  chiusa: boolean;
  chiusaIl: number | null;
  propostaVincenteId: string | null;
}

/** Un regalo candidato: /collette/{slug}/proposte/{id} */
export interface Proposta {
  id: string;
  prodotto: ProdottoColletta;
  daOrganizzatore: boolean;
  autoreUid: string;
  autoreNome: string;
  creatoIl: number;
}

/** Il voto di una persona a una proposta: /collette/{slug}/voti/{uid}__{propostaId} */
export interface Voto {
  id: string;
  propostaId: string;
  uid: string;
  stelle: number;
  ts: number;
}

export interface NuovaProposta {
  prodotto: ProdottoColletta;
  autoreNome: string;
}

export interface Colletta {
  slug: string;
  organizzatoreUid: string;
  organizzatoreNome: string;

  festeggiato: string;
  occasione: string;
  dataRegalo: number;
  scadenza: number;
  sorpresa: boolean;

  prodotto: ProdottoColletta;

  modoQuota: ModoQuota;
  quotaCent: number;
  quotaCongelata: boolean;
  previsti: number;

  metodi: Metodi;

  listaAperta: boolean;
  stato: StatoColletta;

  totaleConfermatoCent: number;
  nConfermati: number;
  nAttesi: number;
  /** Estensione dello schema: partecipanti con stato aderito, dichiarato o confermato. Serve alla quota "divisa". */
  nAderenti: number;

  acquisto: Acquisto | null;
  /** estensione: null = il regalo l'ha scelto chi organizza */
  votazione: Votazione | null;

  creatoIl: number;
  aggiornatoIl: number;
}

export interface Partecipante {
  /** id del documento (non fa parte del documento stesso) */
  id: string;
  nome: string;
  uidAnonimo: string | null;
  stato: StatoPartecipante;
  metodo: Metodo | null;
  importoCent: number | null;
  causale: string;
  messaggio: string | null;
  /** Estensione dello schema: nota dell'organizzatore (es. «Pagamento non trovato»), visibile alla persona. */
  nota: string | null;
  creatoIl: number;
  dichiaratoIl: number | null;
  confermatoIl: number | null;
  solleciti: number;
}

export type TipoEvento =
  | "apertura"
  | "adesione"
  | "metodo_scelto"
  | "dichiarazione"
  | "messaggio"
  | "rinuncia"
  | "sollecito_preparato"
  | "conferma"
  | "voto"
  | "proposta";

export interface NuovoEvento {
  tipo: TipoEvento;
  uidAnonimo: string | null;
  partecipanteId: string | null;
  meta: Record<string, string | number | boolean>;
}

export interface Evento extends NuovoEvento {
  id: string;
  ts: number;
}

export interface FiltriProdotti {
  /** "uomo" | "donna" */
  per?: string;
  /** "viaggio" | "tecnologia" | "arredamento" */
  tema?: string;
  /** chiave della sottocategoria (vedi chiaveSottocategoria) */
  tipo?: string;
  /** id della fascia di prezzo, vedi FASCE_PREZZO */
  fascia?: string;
}

export const DESTINATARI = ["uomo", "donna"] as const;
export const TEMI = ["viaggio", "tecnologia", "arredamento"] as const;

export const FASCE_PREZZO = [
  { id: "30", etichetta: "Fino a 30 €", minCent: 0, maxCent: 3000 },
  { id: "80", etichetta: "30 – 80 €", minCent: 3000, maxCent: 8000 },
  { id: "150", etichetta: "80 – 150 €", minCent: 8000, maxCent: 15000 },
  { id: "200", etichetta: "150 – 200 €", minCent: 15000, maxCent: 20000 },
  { id: "oltre", etichetta: "Oltre 200 €", minCent: 20000, maxCent: Infinity },
] as const;

// ======================================================================
// Biglietto di auguri digitale (nuova funzionalità, vedi SPEC_BIGLIETTO)
// ======================================================================

/** Occasioni del biglietto: emoji, voce e valore (sezione 4.1 della specifica). */
export const OCCASIONI_BIGLIETTO = [
  { emoji: "🎂", voce: "Compleanno", valore: "compleanno" },
  { emoji: "👋", voce: "Saluto / addio", valore: "saluto" },
  { emoji: "🌅", voce: "Pensione", valore: "pensione" },
  { emoji: "🎓", voce: "Laurea", valore: "laurea" },
  { emoji: "👶", voce: "Nascita", valore: "nascita" },
  { emoji: "💍", voce: "Matrimonio", valore: "matrimonio" },
  { emoji: "🙏", voce: "Grazie", valore: "grazie" },
  { emoji: "🍎", voce: "Insegnante", valore: "insegnante" },
  { emoji: "🏅", voce: "Allenatore", valore: "allenatore" },
  { emoji: "🏆", voce: "Anniversario di lavoro", valore: "anniversario-lavoro" },
  { emoji: "💼", voce: "Capo", valore: "capo" },
  { emoji: "🌷", voce: "Guarisci presto", valore: "guarisci" },
  { emoji: "🤍", voce: "Condoglianze", valore: "condoglianze" },
  { emoji: "🐾", voce: "Per un amico a quattro zampe", valore: "animale" },
  { emoji: "🎉", voce: "Festeggiamo", valore: "festa" },
  { emoji: "🎊", voce: "Ricorrenze (Natale, Festa della mamma…)", valore: "ricorrenze" },
  { emoji: "✍️", voce: "Altro", valore: "altro" },
] as const;

export function emojiOccasione(valore: string): string {
  return OCCASIONI_BIGLIETTO.find((o) => o.valore === valore)?.emoji ?? "✍️";
}

export type DimensioneTesto = "xs" | "s" | "m" | "l" | "xl" | "xxl";

/** Una zona di testo sulla copertina, in percentuale del formato della carta. */
export interface ZonaTitolo {
  x: number;
  y: number;
  w: number;
  font: string;
  colore: string;
  /** dimensione in px alla dimensione logica della carta (vedi lib/dominio/biglietto) */
  dimensione: number;
  maiuscolo: boolean;
  allineamento: "left" | "center" | "right";
  segnaposto: string;
}

/**
 * Sfondo della copertina. Nel prototipo i modelli sono disegni nostri generati (gradiente + motivo),
 * non illustrazioni esterne: lo `sfondo` descrive come disegnarli, invece di puntare a un file.
 */
export type SfondoModello =
  | { tipo: "gradiente"; da: string; a: string; motivo: string }
  | { tipo: "tinta"; colore: string; motivo: string };

export interface ModelloBiglietto {
  id: string;
  nome: string;
  occasioni: string[];
  tipo: "illustrato" | "foto-intera" | "carica-immagine" | "magico";
  sfondo: SfondoModello;
  titolo: ZonaTitolo;
  sottotitolo: ZonaTitolo | null;
  testoFisso: string | null;
  ordine: number;
  attivo: boolean;
}

export interface StileFirma {
  font: string;
  colore: string;
  dimensione: DimensioneTesto;
}

export interface ImmagineFirma {
  tipo: "caricata" | "giphy" | "unsplash" | "magica";
  url: string;
  larghezza: number;
  altezza: number;
  attribuzione: string | null;
}

export interface Firma {
  id: string;
  uid: string;
  /** HTML ripulito lato server: solo <b> <i> <u> <br> ed emoji */
  messaggioHtml: string;
  stile: StileFirma;
  immagine: ImmagineFirma | null;
  daParteDi: string;
  /**
   * Ruolo o parentela («Amica del liceo», «Collega»): facoltativo, si vede sotto la firma sul biglietto.
   * Le firme salvate prima che esistesse non ce l'hanno, quindi può mancare.
   */
  ruolo?: string | null;
  nome: string;
  cognome: string | null;
  email: string | null;
  nascosta: boolean;
  creatoIl: number;
  aggiornatoIl: number;
}

export type StatoBiglietto = "bozza" | "aperto" | "chiuso" | "consegnato";

export interface CopertinaBiglietto {
  modelloId: string;
  variante: number;
  titolo: string;
  sottotitolo: string | null;
  immagineUrl: string | null;
}

export interface Biglietto {
  id: string;
  slug: string;
  organizzatoreUid: string;
  organizzatoreNome: string | null;
  tipo: "solo-biglietto" | "con-colletta";
  collettaSlug: string | null;
  occasione: string;
  festeggiato: string;
  daParteDi: string;
  destinatario: "festeggiato" | "organizzatore";
  /** privato: mai nell'HTML pubblico */
  emailDestinatario: string;
  /** l'altra email digitata al passo 2 (si ritrova cambiando scelta); privata */
  emailAlternativa?: string;
  /** quando: istante; data/ora: come le ha scelte chi organizza, nel suo fuso (servono a modificarle) */
  consegna: { quando: number; fuso: string; data: string; ora: string };
  messaggioGruppo: string;
  nome: string;
  copertina: CopertinaBiglietto;
  colonne: 1 | 2 | 3;
  ordineFirme: string[] | null;
  stato: StatoBiglietto;
  nFirme: number;
  creatoIl: number;
  aggiornatoIl: number;
  consegnatoIl: number | null;
}

/** La vista pubblica del biglietto: ciò che il server consegna alla pagina del firmatario (niente email/token). */
export interface BigliettoPubblico {
  slug: string;
  organizzatoreNome: string | null;
  occasione: string;
  festeggiato: string;
  messaggioGruppo: string;
  nome: string;
  copertina: CopertinaBiglietto;
  colonne: 1 | 2 | 3;
  ordineFirme: string[] | null;
  stato: StatoBiglietto;
  nFirme: number;
}
