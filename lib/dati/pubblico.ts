import type { Partecipante } from "../tipi";

/** Le righe che il server consegna alla pagina pubblica: senza importi, messaggi e note. */
export function righePubbliche(righe: Partecipante[]): Partecipante[] {
  return righe.map((r) => ({ ...r, importoCent: null, messaggio: null, nota: null }));
}
