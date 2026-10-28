import type { Biglietto, Firma } from "../tipi";

/** Il biglietto come lo conserva il server: con l'impronta della chiave della bozza e il token del destinatario. */
export interface BigliettoServer extends Biglietto {
  /** sha256 della chiave segreta data a chi ha creato la bozza (anche senza account) */
  hashChiave: string;
  /** per il link di apertura del festeggiato (fase di consegna) */
  tokenDestinatario: string;
}

export interface FirmaServer extends Firma {
  /** per il link di modifica via email (fase successiva) */
  tokenModifica: string;
}

export interface ImmagineSalvata {
  mime: string;
  dati: Uint8Array;
}

/** Dove vivono biglietti, firme e immagini. Due implementazioni: memoria (prove) e Firestore (Admin SDK). */
export interface ArchivioBiglietti {
  crea(b: BigliettoServer): Promise<void>;
  leggi(id: string): Promise<BigliettoServer | null>;
  perSlug(slug: string): Promise<BigliettoServer | null>;
  aggiorna(id: string, patch: Partial<BigliettoServer>): Promise<void>;
  slugOccupato(slug: string, escludiId?: string): Promise<boolean>;
  /** Prenota lo slug per il biglietto (e libera il precedente) in modo atomico. false se è di un altro. */
  prenotaSlug(id: string, slug: string): Promise<boolean>;
  firme(id: string): Promise<FirmaServer[]>;
  firma(id: string, firmaId: string): Promise<FirmaServer | null>;
  /** Crea o aggiorna la firma; nFirme sale solo alla creazione. Rifiuta se il biglietto non è aperto. */
  salvaFirma(id: string, f: FirmaServer): Promise<{ nuova: boolean } | { errore: "chiuso" | "pieno" }>;
  /** Elimina la firma e fa scendere nFirme. Rifiuta se il biglietto non è aperto; false se la firma non c'era. */
  eliminaFirma(id: string, firmaId: string): Promise<{ eliminata: boolean } | { errore: "chiuso" }>;
  salvaImmagine(id: string, nome: string, img: ImmagineSalvata): Promise<void>;
  leggiImmagine(id: string, nome: string): Promise<ImmagineSalvata | null>;
  eliminaImmagine(id: string, nome: string): Promise<void>;
  perOrganizzatore(uid: string): Promise<BigliettoServer[]>;
}

export const MAX_FIRME_PER_BIGLIETTO = 500;
export const MAX_BYTE_IMMAGINE = 900 * 1024;
