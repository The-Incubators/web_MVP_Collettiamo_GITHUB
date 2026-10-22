// Autenticazione Firebase: collegamento via email e Google per chi organizza, anonima per chi partecipa.

import {
  GoogleAuthProvider,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInAnonymously,
  signInWithEmailLink,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from "firebase/auth";
import { authFirebase } from "../firebase/client";
import {
  CHIAVE_EMAIL_ACCESSO,
  CHIAVE_NOME_ACCESSO,
  CHIAVE_UID,
  leggiLocale,
  nomeDaEmail,
  scriviLocale,
  type Autenticazione,
  type Utente,
} from "./tipi";

function daUtente(u: User): Utente {
  const nomeSalvato = leggiLocale(CHIAVE_NOME_ACCESSO);
  return {
    uid: u.uid,
    // Il nome scritto da chi accede vale più di quello del profilo Google.
    nome: u.isAnonymous ? "" : (nomeSalvato ?? u.displayName ?? nomeDaEmail(u.email ?? "")),
    email: u.email,
    anonimo: u.isAnonymous,
  };
}

export function creaAutenticazioneFirebase(): Autenticazione {
  const auth = authFirebase();
  return {
    osserva(cb) {
      return onAuthStateChanged(auth, (u) => cb(u && !u.isAnonymous ? daUtente(u) : null));
    },
    async assicuraIdentita() {
      await auth.authStateReady();
      const u = auth.currentUser ?? (await signInAnonymously(auth)).user;
      if (u.isAnonymous) scriviLocale(CHIAVE_UID, u.uid);
      return daUtente(u);
    },
    async inviaLinkEmail(email, nome) {
      const url = `${window.location.origin}/accedi`;
      await sendSignInLinkToEmail(auth, email.trim(), { url, handleCodeInApp: true });
      scriviLocale(CHIAVE_EMAIL_ACCESSO, email.trim());
      scriviLocale(CHIAVE_NOME_ACCESSO, nome.trim() || null);
      return { accessoImmediato: false };
    },
    async completaLinkEmail(url) {
      if (!isSignInWithEmailLink(auth, url)) return null;
      const email = leggiLocale(CHIAVE_EMAIL_ACCESSO) ?? window.prompt("Per completare l'accesso, riscrivi la tua email");
      if (!email) return null;
      const risultato = await signInWithEmailLink(auth, email, url);
      scriviLocale(CHIAVE_EMAIL_ACCESSO, null);
      return daUtente(risultato.user);
    },
    async accediConGoogle(nome) {
      scriviLocale(CHIAVE_NOME_ACCESSO, nome?.trim() || null);
      const provider = new GoogleAuthProvider();
      try {
        await signInWithPopup(auth, provider);
      } catch (e) {
        const codice = (e as { code?: string }).code;
        // La finestra chiusa da chi accede non è un errore.
        if (codice === "auth/popup-closed-by-user" || codice === "auth/cancelled-popup-request") return;
        // Dove le finestre non si aprono (alcuni browser dentro le app), si passa dalla pagina di Google.
        if (codice === "auth/popup-blocked" || codice === "auth/operation-not-supported-in-this-environment") {
          await signInWithRedirect(auth, provider);
          return;
        }
        throw e;
      }
    },
    async esci() {
      await signOut(auth);
    },
    async token() {
      await auth.authStateReady();
      return (await auth.currentUser?.getIdToken()) ?? null;
    },
  };
}
