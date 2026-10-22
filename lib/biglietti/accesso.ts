// Chi può fare cosa con un biglietto.
// - La bozza appartiene a chi l'ha creata, anche senza account: il server gli dà una chiave segreta (tenuta nel
//   browser) e ne conserva solo l'impronta. Dopo la pubblicazione appartiene anche all'account dell'organizzatore.
// - Chi firma non ha account: il browser tiene una sua chiave segreta; l'id della firma ne deriva, così la stessa
//   persona sullo stesso dispositivo aggiorna la sua firma invece di duplicarla.

import { createHash, randomBytes } from "node:crypto";
import { modalitaDati } from "../config";
import { authAdmin } from "../firebase/admin";
import type { BigliettoServer } from "./tipi";

export function nuovaChiave(): string {
  return randomBytes(32).toString("base64url");
}

export function nuovoId(byte = 15): string {
  return randomBytes(byte).toString("base64url").replace(/[-_]/g, "x");
}

export function impronta(chiave: string): string {
  return createHash("sha256").update(chiave).digest("hex");
}

/** L'id della firma di quel firmatario su quel biglietto. */
export function idFirma(chiaveFirmatario: string, bigliettoId: string): string {
  return createHash("sha256").update(`${chiaveFirmatario}:${bigliettoId}`).digest("hex").slice(0, 24);
}

export function chiaveValida(c: string | null): c is string {
  return !!c && /^[A-Za-z0-9_-]{32,64}$/.test(c);
}

export interface UtenteRichiesta {
  uid: string;
  nome: string | null;
  email: string | null;
}

/**
 * L'account che fa la richiesta, se c'è. Con Firebase: token nell'intestazione Authorization (non anonimo).
 * Senza Firebase (solo prove in locale): intestazioni x-uid-prova / x-nome-prova / x-email-prova.
 */
export async function utenteDa(richiesta: Request): Promise<UtenteRichiesta | null> {
  if (modalitaDati() === "memoria") {
    const uid = richiesta.headers.get("x-uid-prova")?.trim();
    return uid ? { uid, nome: richiesta.headers.get("x-nome-prova"), email: richiesta.headers.get("x-email-prova") } : null;
  }
  const h = richiesta.headers.get("authorization") ?? "";
  const token = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
  if (!token) return null;
  try {
    const t = await authAdmin().verifyIdToken(token);
    if (t.firebase?.sign_in_provider === "anonymous") return null;
    return { uid: t.uid, nome: (t.name as string | undefined) ?? null, email: t.email ?? null };
  } catch {
    return null;
  }
}

/** È chi organizza: ha la chiave della bozza, oppure è l'account a cui il biglietto è stato assegnato. */
export async function eProprietario(b: BigliettoServer, richiesta: Request): Promise<boolean> {
  const chiave = richiesta.headers.get("x-chiave-biglietto");
  if (chiaveValida(chiave) && impronta(chiave) === b.hashChiave) return true;
  if (!b.organizzatoreUid) return false;
  const u = await utenteDa(richiesta);
  return !!u && u.uid === b.organizzatoreUid;
}

/** Senza i campi che non escono mai dal server. */
export function senzaSegreti(b: BigliettoServer) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { hashChiave, tokenDestinatario, ...resto } = b;
  return resto;
}
