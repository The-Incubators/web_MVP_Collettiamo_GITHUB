// Autenticazione finta per la modalità senza Firebase: nessun invio di email, l'accesso è immediato.

import {
  CHIAVE_NOME_ACCESSO,
  CHIAVE_UID,
  leggiLocale,
  nomeDaEmail,
  scriviLocale,
  type Annulla,
  type Autenticazione,
  type Utente,
} from "./tipi";

const CHIAVE_ORG = "colletta.finto.organizzatore";

let uidInMemoria: string | null = null;
const ascoltatori = new Set<(u: Utente | null) => void>();

function nuovoUid(prefisso: string): string {
  return `${prefisso}-${globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

function organizzatoreSalvato(): Utente | null {
  const grezzo = leggiLocale(CHIAVE_ORG);
  if (!grezzo) return null;
  try {
    return JSON.parse(grezzo) as Utente;
  } catch {
    return null;
  }
}

function anonimo(): Utente {
  let uid = leggiLocale(CHIAVE_UID) ?? uidInMemoria;
  if (!uid) {
    uid = nuovoUid("anon");
    uidInMemoria = uid;
    scriviLocale(CHIAVE_UID, uid);
  }
  return { uid, nome: "", email: null, anonimo: true };
}

/** Sincrono: serve al proxy dei dati per dichiarare chi sta chiamando. */
export function uidCorrenteMemoria(): string {
  return (organizzatoreSalvato() ?? anonimo()).uid;
}

function notifica() {
  const u = organizzatoreSalvato();
  for (const cb of ascoltatori) cb(u);
}

export function creaAutenticazioneMemoria(): Autenticazione {
  return {
    osserva(cb): Annulla {
      ascoltatori.add(cb);
      cb(organizzatoreSalvato());
      return () => ascoltatori.delete(cb);
    },
    async assicuraIdentita() {
      return organizzatoreSalvato() ?? anonimo();
    },
    async inviaLinkEmail(email, nome) {
      const pulita = email.trim().toLowerCase();
      // L'uid dipende dall'indirizzo: la stessa email ritrova le proprie collette durante la prova.
      let hash = 0;
      for (const ch of pulita) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
      const utente: Utente = { uid: `org-${hash.toString(36)}`, nome: nome.trim() || nomeDaEmail(pulita), email: pulita, anonimo: false };
      scriviLocale(CHIAVE_ORG, JSON.stringify(utente));
      scriviLocale(CHIAVE_NOME_ACCESSO, null);
      notifica();
      return { accessoImmediato: true };
    },
    async completaLinkEmail() {
      return null;
    },
    async accediConGoogle(nome) {
      const utente: Utente = { uid: "org-google-prova", nome: nome?.trim() || "Organizzatore", email: "prova@example.com", anonimo: false };
      scriviLocale(CHIAVE_ORG, JSON.stringify(utente));
      notifica();
    },
    async esci() {
      scriviLocale(CHIAVE_ORG, null);
      notifica();
    },
    async token() {
      return null;
    },
  };
}
