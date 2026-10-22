"use client";

// La «lista dei regali»: i prodotti messi da parte con il «+» mentre si scorre il catalogo.
// Resta nel browser (localStorage, con ripiego in memoria) e alimenta la votazione nel wizard.

import { useSyncExternalStore } from "react";
import { conRegalo, stessoRegalo } from "./dominio/regali";
import type { ProdottoColletta } from "./tipi";

const CHIAVE = "colletta.listaRegali";
const EVENTO = "colletta:lista";
const VUOTA: ProdottoColletta[] = [];

let inMemoria: ProdottoColletta[] = VUOTA;
let cache: { grezzo: string | null; valore: ProdottoColletta[] } = { grezzo: null, valore: VUOTA };

function leggiGrezzo(): string | null {
  try {
    return window.localStorage.getItem(CHIAVE);
  } catch {
    return null;
  }
}

export function leggiLista(): ProdottoColletta[] {
  const grezzo = leggiGrezzo();
  if (grezzo === null) return inMemoria;
  if (grezzo === cache.grezzo) return cache.valore;
  let valore = VUOTA;
  try {
    const dati = JSON.parse(grezzo);
    if (Array.isArray(dati)) valore = dati as ProdottoColletta[];
  } catch {
    /* lista rovinata: si riparte vuoti */
  }
  cache = { grezzo, valore };
  return valore;
}

function scrivi(lista: ProdottoColletta[]) {
  inMemoria = lista.length ? lista : VUOTA;
  try {
    if (lista.length) window.localStorage.setItem(CHIAVE, JSON.stringify(lista));
    else window.localStorage.removeItem(CHIAVE);
  } catch {
    /* senza localStorage la lista vale finché la pagina resta aperta */
  }
  window.dispatchEvent(new Event(EVENTO));
}

export function aggiungiARegali(p: ProdottoColletta) {
  scrivi(conRegalo(leggiLista(), p));
}

export function togliDaRegali(p: ProdottoColletta) {
  scrivi(leggiLista().filter((x) => !stessoRegalo(x, p)));
}

export function svuotaRegali() {
  scrivi([]);
}

function iscrivi(cb: () => void) {
  window.addEventListener(EVENTO, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENTO, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useListaRegali(): ProdottoColletta[] {
  return useSyncExternalStore(iscrivi, leggiLista, () => VUOTA);
}
