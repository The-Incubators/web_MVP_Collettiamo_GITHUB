// La macchina a stati del percorso «Trova il regalo»: funzioni pure, nessun DOM.
// Le regole sono quelle del percorso di partenza: si torna a una tappa già raggiunta, non si salta avanti.

import { CATEGORIE_INTERESSI, GENERI, INTERESSI, MAX_MACRO, MAX_MICRO, MIN_MACRO, OCCASIONI_REGALO } from "./dati";

export interface StatoRicerca {
  genere: string | null;
  occasione: string | null;
  /** le macro-categorie scelte nella terza tappa (da MIN_MACRO a MAX_MACRO) */
  macro: string[];
  /** le micro-categorie scelte per restringere, solo delle macro scelte; nessuna = «va bene tutto» */
  interessi: string[];
  tappa: number;
}

const idMacro = new Set<string>(CATEGORIE_INTERESSI.map((c) => c.id));
const macroDi = new Map(INTERESSI.map((x) => [x.id, x.categoria]));
const idOccasioni = new Set<string>(OCCASIONI_REGALO.map((o) => o.id));
const idGeneri = new Set<string>(GENERI.map((g) => g.id));

export const statoIniziale = (): StatoRicerca => ({
  genere: null,
  occasione: null,
  macro: [],
  interessi: [],
  tappa: 1,
});

export function tappaCompleta(s: StatoRicerca, tappa: number): boolean {
  if (tappa === 1) return Boolean(s.genere);
  if (tappa === 2) return Boolean(s.occasione);
  if (tappa === 3) return s.macro.length >= MIN_MACRO;
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

export const limiteMacroRaggiunto = (s: StatoRicerca): boolean => s.macro.length >= MAX_MACRO;
export const limiteInteressiRaggiunto = (s: StatoRicerca): boolean => s.interessi.length >= MAX_MICRO;

/** Aggiunge o toglie una macro; oltre il massimo lo stato resta invariato. Togliendola se ne vanno anche le sue micro. */
export function cambiaMacro(s: StatoRicerca, id: string): StatoRicerca {
  if (!idMacro.has(id)) return s;
  if (s.macro.includes(id)) return { ...s, macro: s.macro.filter((x) => x !== id), interessi: s.interessi.filter((x) => macroDi.get(x) !== id) };
  if (limiteMacroRaggiunto(s)) return s;
  return { ...s, macro: [...s.macro, id] };
}

/** Aggiunge o toglie una micro, solo se la sua macro è scelta; oltre il massimo lo stato resta invariato. */
export function cambiaInteresse(s: StatoRicerca, id: string): StatoRicerca {
  const macro = macroDi.get(id);
  if (!macro || !s.macro.includes(macro)) return s;
  if (s.interessi.includes(id)) return { ...s, interessi: s.interessi.filter((x) => x !== id) };
  if (limiteInteressiRaggiunto(s)) return s;
  return { ...s, interessi: [...s.interessi, id] };
}

/** «Va bene tutto» per una macro: toglie le sue micro. */
export function tuttaLaMacro(s: StatoRicerca, macro: string): StatoRicerca {
  return { ...s, interessi: s.interessi.filter((x) => macroDi.get(x) !== macro) };
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
  // un percorso salvato con i vecchi 36 interessi non ha `macro`: si riparte dalla terza tappa
  const macro = Array.isArray(r.macro) ? [...new Set(r.macro)] : [];
  for (const id of macro) if (typeof id === "string") s = cambiaMacro(s, id);
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
