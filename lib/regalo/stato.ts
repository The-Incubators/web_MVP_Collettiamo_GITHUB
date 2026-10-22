// La macchina a stati del percorso «Trova il regalo»: funzioni pure, nessun DOM.
// Le regole sono quelle del percorso di partenza: si torna a una tappa già raggiunta, non si salta avanti.

import { GENERI, INTERESSI, MAX_INTERESSI, MIN_INTERESSI, OCCASIONI_REGALO } from "./dati";

export interface StatoRicerca {
  genere: string | null;
  occasione: string | null;
  interessi: string[];
  tappa: number;
}

const idInteressi = new Set(INTERESSI.map((x) => x.id));
const idOccasioni = new Set<string>(OCCASIONI_REGALO.map((o) => o.id));
const idGeneri = new Set<string>(GENERI.map((g) => g.id));

export const statoIniziale = (): StatoRicerca => ({
  genere: null,
  occasione: null,
  interessi: [],
  tappa: 1,
});

export function tappaCompleta(s: StatoRicerca, tappa: number): boolean {
  if (tappa === 1) return Boolean(s.genere);
  if (tappa === 2) return Boolean(s.occasione);
  if (tappa === 3) return s.interessi.length >= MIN_INTERESSI;
  return false;
}

export const puoAvanzare = (s: StatoRicerca): boolean => s.tappa < 4 && tappaCompleta(s, s.tappa);

/** La prima tappa non ancora valida (4 se il questionario è completo). */
export const primaTappaIncompleta = (s: StatoRicerca): number => [1, 2, 3].find((t) => !tappaCompleta(s, t)) ?? 4;

export const puoAndareA = (s: StatoRicerca, tappa: number): boolean =>
  tappa >= 1 && tappa <= 4 && tappa <= primaTappaIncompleta(s);

export function scegliGenere(s: StatoRicerca, genere: string): StatoRicerca {
  return idGeneri.has(genere) ? { ...s, genere } : s;
}

export function scegliOccasione(s: StatoRicerca, occasione: string): StatoRicerca {
  return idOccasioni.has(occasione) ? { ...s, occasione } : s;
}

export const limiteInteressiRaggiunto = (s: StatoRicerca): boolean => s.interessi.length >= MAX_INTERESSI;

/** Aggiunge o toglie; oltre il massimo lo stato resta invariato. */
export function cambiaInteresse(s: StatoRicerca, id: string): StatoRicerca {
  if (!idInteressi.has(id)) return s;
  if (s.interessi.includes(id)) return { ...s, interessi: s.interessi.filter((x) => x !== id) };
  if (limiteInteressiRaggiunto(s)) return s;
  return { ...s, interessi: [...s.interessi, id] };
}

export function avanza(s: StatoRicerca): StatoRicerca {
  return puoAvanzare(s) ? { ...s, tappa: s.tappa + 1 } : s;
}

export function vaiAllaTappa(s: StatoRicerca, tappa: number): StatoRicerca {
  return puoAndareA(s, tappa) ? { ...s, tappa } : s;
}

/** Ripulisce lo stato riletto dal browser: ignora valori sconosciuti e tappe non raggiungibili. */
export function ripulisci(grezzo: unknown): StatoRicerca {
  const base = statoIniziale();
  if (!grezzo || typeof grezzo !== "object") return base;
  const r = grezzo as Record<string, unknown>;
  let s = base;
  if (typeof r.genere === "string") s = scegliGenere(s, r.genere);
  if (typeof r.occasione === "string") s = scegliOccasione(s, r.occasione);
  const scelti = Array.isArray(r.interessi) ? [...new Set(r.interessi)] : [];
  for (const id of scelti) if (typeof id === "string") s = cambiaInteresse(s, id);
  const tappa = Number.isInteger(r.tappa) ? (r.tappa as number) : 1;
  return { ...s, tappa: puoAndareA(s, tappa) ? tappa : primaTappaIncompleta(s) };
}

export const CHIAVE_SESSIONE = "colletta.trova-regalo";

/** Rilegge il percorso dalla sessione del browser; qualunque problema (modalità privata, dati corrotti) riparte da zero. */
export function leggiDallaSessione(): StatoRicerca {
  try {
    return ripulisci(JSON.parse(globalThis.sessionStorage?.getItem(CHIAVE_SESSIONE) || "null"));
  } catch {
    return statoIniziale();
  }
}

export function scriviNellaSessione(s: StatoRicerca): void {
  try {
    globalThis.sessionStorage?.setItem(CHIAVE_SESSIONE, JSON.stringify(s));
  } catch {
    // Modalità privata o spazio esaurito: il percorso funziona comunque in memoria.
  }
}
