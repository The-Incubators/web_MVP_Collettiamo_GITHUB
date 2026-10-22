"use client";

// Chiamate dal browser alle rotte del biglietto. Le chiavi segrete vivono in localStorage (in try/catch):
// - una per ogni bozza creata da questo browser (la possiede anche senza account);
// - una per chi firma (la stessa persona, sullo stesso dispositivo, ritrova e aggiorna la sua firma).

import { useCallback, useMemo } from "react";
import { useApp } from "@/components/AppProvider";
import { leggiLocale, scriviLocale } from "../auth/tipi";

const CHIAVI_BOZZE = "colletta.biglietti.chiavi";
const CHIAVE_FIRMATARIO = "colletta.firmatario";

function chiaviBozze(): Record<string, string> {
  try {
    return JSON.parse(leggiLocale(CHIAVI_BOZZE) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

export function salvaChiaveBozza(id: string, chiave: string) {
  scriviLocale(CHIAVI_BOZZE, JSON.stringify({ ...chiaviBozze(), [id]: chiave }));
}

export function chiaveBozza(id: string): string | null {
  return chiaviBozze()[id] ?? null;
}

function generaChiave(): string {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const inMemoria = new Map<string, string>();

/**
 * La chiave di chi firma. Ce n'è una per biglietto, così su un dispositivo condiviso ognuno può avere
 * la sua («Sono un'altra persona»); in mancanza vale quella generale, che è anche quella di chi ha
 * firmato prima di questa modifica: continua a poter modificare il suo messaggio.
 */
export function chiaveFirmatario(slug: string): string {
  const perBiglietto = `${CHIAVE_FIRMATARIO}.${slug}`;
  const c = leggiLocale(perBiglietto) ?? inMemoria.get(perBiglietto) ?? leggiLocale(CHIAVE_FIRMATARIO) ?? inMemoria.get(CHIAVE_FIRMATARIO);
  if (c) return c;
  const nuova = generaChiave();
  inMemoria.set(CHIAVE_FIRMATARIO, nuova);
  scriviLocale(CHIAVE_FIRMATARIO, nuova);
  return nuova;
}

/** «Sono un'altra persona»: da qui in poi, su questo biglietto, questo dispositivo firma come qualcun altro. */
export function cambiaFirmatario(slug: string): void {
  const perBiglietto = `${CHIAVE_FIRMATARIO}.${slug}`;
  const nuova = generaChiave();
  inMemoria.set(perBiglietto, nuova);
  scriviLocale(perBiglietto, nuova);
}

export class ErroreApi extends Error {
  constructor(
    messaggio: string,
    public status: number,
    public dati: Record<string, unknown>,
  ) {
    super(messaggio);
  }
}

export type Chiamata = <T = Record<string, unknown>>(url: string, opzioni?: { metodo?: string; corpo?: unknown; bigliettoId?: string; firmatario?: string }) => Promise<T>;

/** fetch con le intestazioni giuste: chiave della bozza, chiave di chi firma, account (token o, in prova, uid). */
export function useApi(): Chiamata {
  const { auth, utente, modalita } = useApp();
  const uid = utente?.uid;
  const nome = utente?.nome;
  const email = utente?.email;
  const chiama = useCallback<Chiamata>(
    async (url, { metodo = "GET", corpo, bigliettoId, firmatario } = {}) => {
      const h: Record<string, string> = {};
      if (corpo !== undefined) h["content-type"] = "application/json";
      if (bigliettoId) {
        const k = chiaveBozza(bigliettoId);
        if (k) h["x-chiave-biglietto"] = k;
      }
      if (firmatario) h["x-chiave-firmatario"] = chiaveFirmatario(firmatario);
      if (uid) {
        if (modalita === "memoria") {
          h["x-uid-prova"] = uid;
          if (nome) h["x-nome-prova"] = nome;
          if (email) h["x-email-prova"] = email;
        } else {
          const t = await auth.token().catch(() => null);
          if (t) h.authorization = `Bearer ${t}`;
        }
      }
      const r = await fetch(url, { method: metodo, headers: h, body: corpo === undefined ? undefined : JSON.stringify(corpo), cache: "no-store" });
      let dati: Record<string, unknown> = {};
      try {
        dati = (await r.json()) as Record<string, unknown>;
      } catch {
        /* risposta vuota */
      }
      if (!r.ok || dati.ok === false) throw new ErroreApi(typeof dati.errore === "string" ? dati.errore : "Qualcosa non ha funzionato. Riprova.", r.status, dati);
      return dati as never;
    },
    [auth, uid, nome, email, modalita],
  );
  return useMemo(() => chiama, [chiama]);
}

/** Lettura/scrittura in sessionStorage (bozza dei campi a ogni battitura), in try/catch. */
export function leggiSessione<T>(chiave: string): T | null {
  try {
    const v = window.sessionStorage.getItem(chiave);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}
export function scriviSessione(chiave: string, valore: unknown) {
  try {
    if (valore === null) window.sessionStorage.removeItem(chiave);
    else window.sessionStorage.setItem(chiave, JSON.stringify(valore));
  } catch {
    /* ignorato */
  }
}

/** Una sola volta per utente (coachmark): localStorage in try/catch. */
export function giaVisto(chiave: string): boolean {
  return leggiLocale(`colletta.visto.${chiave}`) === "1";
}
export function segnaVisto(chiave: string) {
  scriviLocale(`colletta.visto.${chiave}`, "1");
}
