// Il lato browser dell'adattatore in memoria: chiama /api/memoria e simula il tempo reale con un sondaggio.

import { ErroreDominio } from "../dominio/operazioni";
import type { Colletta, Partecipante, Proposta, Voto } from "../tipi";
import type { Annulla, Dati } from "./tipi";

const INTERVALLO_MS = 1500;

export function creaDatiMemoriaClient(leggiUid: () => string): Dati {
  async function chiama<T>(metodo: string, ...args: unknown[]): Promise<T> {
    const risposta = await fetch("/api/memoria", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ metodo, args, uid: leggiUid() }),
    });
    const corpo = (await risposta.json()) as { ok: boolean; valore?: T; errore?: string; dominio?: boolean };
    if (!corpo.ok) throw corpo.dominio ? new ErroreDominio(corpo.errore ?? "Errore") : new Error(corpo.errore ?? "Errore");
    return corpo.valore as T;
  }

  function sondaggio<T>(leggi: () => Promise<T>, cb: (v: T) => void, errore?: (e: Error) => void): Annulla {
    let attivo = true;
    let ultimo = "";
    const giro = async () => {
      try {
        const v = await leggi();
        const s = JSON.stringify(v);
        if (attivo && s !== ultimo) {
          ultimo = s;
          cb(v);
        }
      } catch (e) {
        if (attivo) errore?.(e instanceof Error ? e : new Error(String(e)));
      }
    };
    void giro();
    const timer = setInterval(giro, INTERVALLO_MS);
    return () => {
      attivo = false;
      clearInterval(timer);
    };
  }

  return {
    elencaProdotti: (f) => chiama("elencaProdotti", f),
    prodotto: (slug) => chiama("prodotto", slug),
    colletta: (slug) => chiama("colletta", slug),
    partecipanti: (slug) => chiama("partecipanti", slug),
    proposte: (slug) => chiama("proposte", slug),
    voti: (slug) => chiama("voti", slug),
    osservaProposte: (slug, cb, errore) => sondaggio(() => chiama<Proposta[]>("proposte", slug), cb, errore),
    osservaVoti: (slug, cb, errore) => sondaggio(() => chiama<Voto[]>("voti", slug), cb, errore),
    impostaProposteIniziali: (slug, prodotti) => chiama("impostaProposteIniziali", slug, prodotti),
    aggiungiProposta: (slug, p) => chiama("aggiungiProposta", slug, p),
    rimuoviProposta: (slug, id) => chiama("rimuoviProposta", slug, id),
    vota: (slug, id, stelle) => chiama("vota", slug, id, stelle),
    preferiti: (uid) => chiama("preferiti", uid),
    impostaPreferito: (uid, slug, on) => chiama("impostaPreferito", uid, slug, on),
    salvaUtente: (u) => chiama("salvaUtente", u),
    slugLibero: (slug) => chiama("slugLibero", slug),
    creaColletta: (c) => chiama("creaColletta", c),
    aggiornaColletta: (slug, patch) => chiama("aggiornaColletta", slug, patch),
    eliminaBozza: (slug) => chiama("eliminaBozza", slug),
    elencaCollette: (uid) => chiama("elencaCollette", uid),
    osservaColletta: (slug, cb, errore) => sondaggio(() => chiama<Colletta | null>("colletta", slug), cb, errore),
    osservaPartecipanti: (slug, cb, errore) => sondaggio(() => chiama<Partecipante[]>("partecipanti", slug), cb, errore),
    eventi: (slug) => chiama("eventi", slug),
    registraEvento: (slug, e) => chiama("registraEvento", slug, e),
    esegui: (slug, pid, op) => chiama("esegui", slug, pid, op),
    aggiungiInvitati: (slug, nomi) => chiama("aggiungiInvitati", slug, nomi),
    registraSolleciti: (slug, pid, momento) => chiama("registraSolleciti", slug, pid, momento),
  };
}
