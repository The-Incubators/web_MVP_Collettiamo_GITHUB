// Importazione di prodotti nuovi dal backoffice, in due fasi: si carica la cartella preparata dall'agente
// (Excel + immagini/), i prodotti finiscono «in revisione»; poi chi gestisce il sito decide uno per uno se
// importarli nel catalogo o scartarli, con i motivi. Le decisioni restano: sono il set di esempi «buoni» e
// «sbagliati» da dare all'agente per migliorare la ricerca.

import type { FasciaEta } from "../dati/eta-prodotti";

export type StatoCandidato = "in_revisione" | "importato" | "scartato";
export type Esito = "importato" | "scartato";

/**
 * Quello che il formato JSON dell'agente dice in più rispetto al catalogo: non va nel sito, ma si mostra in
 * revisione e finisce nell'esportazione, perché spiega le scelte dell'agente.
 */
export interface InfoAgente {
  categoria?: string;
  sottocategoria?: string;
  modello?: string;
  variante?: string;
  /** i destinatari descritti a parole («appassionati di vinile») */
  destinatari?: string[];
  limiti?: string[];
  statoVerifica?: string;
  verificheMancanti?: string[];
  disponibilita?: string;
  fonti?: { url: string; informazioni: string }[];
}

/** I campi di un prodotto come arrivano dal file dell'agente, già controllati. */
export interface DatiCandidato {
  /** l'ASIN è anche l'identificativo del candidato: due righe con lo stesso ASIN sono lo stesso prodotto */
  asin: string;
  /**
   * il riferimento dell'agente: il codice PRD-nnn dell'Excel, o «#001» (ordine editoriale) nel formato JSON.
   * Nel catalogo il prodotto prende comunque un codice PRD libero.
   */
  idOrigine: string;
  nome: string;
  marca: string;
  descrizione: string;
  perche: string;
  prezzoCent: number;
  /** link pulito alla scheda Amazon.it, senza tag affiliato */
  link: string;
  destinatari: string[];
  temi: string[];
  sottocategoria?: string;
  /** giorno della rilevazione del prezzo (AAAA-MM-GG) */
  rilevatoIl: string;
  /** solo dal formato JSON */
  agente?: InfoAgente;
}

export interface Decisione {
  esito: Esito;
  /** i motivi rapidi scelti (vedi MOTIVI) */
  motivi: string[];
  /** la frase libera, facoltativa */
  nota: string;
  il: number;
  da: string;
  /** solo per gli importati: dove è finito nel catalogo */
  slug?: string;
  id?: string;
  /** solo per gli importati: i dati completati in revisione (quelli dell'agente restano nel candidato) */
  destinatari?: string[];
  temi?: string[];
  sottocategoria?: string;
  eta?: FasciaEta[];
  stelle?: number;
}

export interface Candidato extends DatiCandidato {
  /** indirizzo della foto, servita da /api/img/prodotti/… */
  foto: string;
  /** il nome della cartella caricata, per ritrovare il lotto */
  lotto: string;
  caricatoIl: number;
  caricatoDa: string;
  stato: StatoCandidato;
  decisione: Decisione | null;
}

export interface FotoSalvata {
  mime: string;
  dati: Uint8Array;
}

/** Dove vivono i candidati e le loro foto: Firestore, o la memoria del server nelle prove in locale. */
export interface ArchivioImportazione {
  candidati(): Promise<Candidato[]>;
  candidato(asin: string): Promise<Candidato | null>;
  salvaCandidato(c: Candidato): Promise<void>;
  salvaFoto(nome: string, foto: FotoSalvata): Promise<void>;
  leggiFoto(nome: string): Promise<FotoSalvata | null>;
}

/**
 * I motivi rapidi. Restano fissi (sono le «etichette» del set di esempi per l'agente): se ne servono di
 * nuovi si aggiungono in fondo, senza rinominare quelli che ci sono, o i dati vecchi non tornano più.
 */
export const MOTIVI: Record<Esito, readonly string[]> = {
  importato: [
    "Ottimo regalo di gruppo",
    "Prezzo giusto",
    "Originale",
    "Piace a tanti",
    "Marca affidabile",
    "Bella foto",
    "Colma un vuoto del catalogo",
  ],
  scartato: [
    "Prezzo troppo alto",
    "Prezzo troppo basso",
    "Troppo personale",
    "Poco originale",
    "Simile a uno già in catalogo",
    "Qualità dubbia",
    "Foto non adatta",
    "Non è un regalo",
    "Link o dati sbagliati",
  ],
};
