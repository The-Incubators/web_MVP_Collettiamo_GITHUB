"use client";

// «Visti di recente»: restano solo in questo browser (localStorage), mai nell'account né nelle analisi.
// Per il Garante è uno strumento tecnico mostrato come funzione: basta l'informativa (Gifty-ingressi-e-uscite.md §4.3).

import { useSyncExternalStore } from "react";
import { conVisto, leggiVisti } from "./dominio/visti";

const CHIAVE = "gifty.vistiDiRecente";
const EVENTO = "gifty:visti";
const VUOTA: string[] = [];

let cache: { grezzo: string | null; valore: string[] } = { grezzo: null, valore: VUOTA };

function leggi(): string[] {
  let grezzo: string | null = null;
  try {
    grezzo = window.localStorage.getItem(CHIAVE);
  } catch {
    return VUOTA;
  }
  if (grezzo === cache.grezzo) return cache.valore;
  cache = { grezzo, valore: leggiVisti(grezzo) };
  return cache.valore;
}

/** Segna `slug` come appena visto. */
export function segnaVisto(slug: string) {
  try {
    window.localStorage.setItem(CHIAVE, JSON.stringify(conVisto(leggi(), slug)));
  } catch {
    return; /* senza localStorage la striscia semplicemente non c'è */
  }
  window.dispatchEvent(new Event(EVENTO));
}

function iscrivi(cb: () => void) {
  window.addEventListener(EVENTO, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENTO, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useVistiDiRecente(): string[] {
  return useSyncExternalStore(iscrivi, leggi, () => VUOTA);
}
