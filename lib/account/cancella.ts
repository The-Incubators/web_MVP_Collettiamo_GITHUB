// La cancellazione dell'account lato server (design.md §10.3): riepilogo, verifica dell'accesso recente, esecuzione.
// Lo stesso codice per le due modalità: cambiano solo gli archivi (memoria, o Firestore e Firebase Auth con l'Admin SDK).

import { randomBytes } from "node:crypto";
import { archivioBiglietti } from "../biglietti";
import { nomeDaUrl } from "../biglietti/immagini";
import { modalitaDati } from "../config";
import { archivioAccountFirestore } from "../dati/account-admin";
import { archivioAccountMemoria } from "../dati/memoria";
import type { ArchivioAccount } from "../dati/tipi";
import { pianoCancellazione, type DatiAccount, type PianoCancellazione } from "../dominio/cancellazione";
import { authAdmin } from "../firebase/admin";

/** L'accesso dev'essere di pochi minuti fa (Firebase chiede un accesso recente per cancellare un utente). */
export const ACCESSO_RECENTE_S = 5 * 60;

export interface AccountRichiesta {
  uid: string;
  accesso: "google" | "email";
  /** secondi dall'epoca dell'ultimo accesso (auth_time del token); null in memoria */
  accessoIl: number | null;
}

/**
 * Chi chiede di cancellare l'account. Con Firebase: il token nell'intestazione Authorization, verificato con l'Admin SDK
 * (anche se è stato revocato), mai un'identità anonima. In memoria: le intestazioni di prova, come le altre rotte.
 */
export async function accountDa(richiesta: Request): Promise<AccountRichiesta | null> {
  if (modalitaDati() === "memoria") {
    const uid = richiesta.headers.get("x-uid-prova")?.trim();
    if (!uid || uid.startsWith("anon-")) return null;
    return { uid, accesso: richiesta.headers.get("x-accesso-prova") === "email" ? "email" : "google", accessoIl: null };
  }
  const h = richiesta.headers.get("authorization") ?? "";
  const token = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
  if (!token) return null;
  try {
    const t = await authAdmin().verifyIdToken(token, true);
    const provider = t.firebase?.sign_in_provider;
    if (!provider || provider === "anonymous") return null;
    return { uid: t.uid, accesso: provider === "google.com" ? "google" : "email", accessoIl: typeof t.auth_time === "number" ? t.auth_time : null };
  } catch {
    return null;
  }
}

/** In memoria non c'è un vero accesso: vale sempre. Con Firebase l'accesso deve avere al massimo cinque minuti. */
export function accessoRecente(a: AccountRichiesta, adessoS = Math.floor(Date.now() / 1000)): boolean {
  if (modalitaDati() === "memoria") return true;
  return a.accessoIl !== null && adessoS - a.accessoIl <= ACCESSO_RECENTE_S;
}

function archivioAccount(): ArchivioAccount {
  return modalitaDati() === "firestore" ? archivioAccountFirestore() : archivioAccountMemoria();
}

async function raccogli(a: AccountRichiesta): Promise<DatiAccount> {
  const biglietti = archivioBiglietti();
  const [gruppi, creati, firme] = await Promise.all([archivioAccount().raccogli(a.uid), biglietti.perOrganizzatore(a.uid), biglietti.firmeDiAccount(a.uid)]);
  return {
    uid: a.uid,
    accesso: a.accesso,
    ...gruppi,
    bigliettiCreati: creati.map((b) => ({ id: b.id, festeggiato: b.festeggiato, stato: b.stato })),
    firme: firme
      .filter((f) => f.biglietto.organizzatoreUid !== a.uid)
      .map((f) => ({ bigliettoId: f.biglietto.id, firmaId: f.firma.id, festeggiato: f.biglietto.festeggiato })),
  };
}

const nuovoId = () => randomBytes(15).toString("base64url").replace(/[-_]/g, "x").slice(0, 20);

export async function pianoPer(a: AccountRichiesta): Promise<PianoCancellazione> {
  return pianoCancellazione(await raccogli(a), nuovoId, Date.now());
}

/**
 * Cancella: prima regali, preferiti, ricorrenze e profilo; poi biglietti e firme; per ultimo l'utente in Firebase Auth.
 * Se qualcosa si ferma a metà l'utente resta e la richiesta si può ripetere: il piano si ricalcola su quello che è
 * rimasto. Il servizio email (D-18) non esiste ancora: quando ci sarà, qui andrà la richiesta di cancellare il contatto
 * (GDPR art. 19).
 */
export async function cancellaAccount(a: AccountRichiesta): Promise<void> {
  const piano = await pianoPer(a);
  await archivioAccount().applica(piano, a.uid);
  const biglietti = archivioBiglietti();
  for (const { bigliettoId, firmaId } of piano.eliminaFirme) {
    const f = await biglietti.firma(bigliettoId, firmaId);
    await biglietti.eliminaFirma(bigliettoId, firmaId, { qualsiasiStato: true });
    const foto = nomeDaUrl(bigliettoId, f?.immagine?.url);
    if (foto) await biglietti.eliminaImmagine(bigliettoId, foto);
  }
  for (const id of piano.eliminaBiglietti) await biglietti.eliminaBiglietto(id);
  if (modalitaDati() === "firestore") {
    try {
      await authAdmin().deleteUser(a.uid);
    } catch (e) {
      // già cancellato da un tentativo precedente: va bene
      if ((e as { code?: string }).code !== "auth/user-not-found") throw e;
    }
  }
}
