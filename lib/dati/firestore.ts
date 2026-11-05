// Adattatore Firestore per il browser (SDK web). Le regole di sicurezza fanno rispettare
// il confine del prodotto: il partecipante non può dichiararsi confermato.

import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { authFirebase, dbFirebase } from "../firebase/client";
import { creaInvitati, eseguiOperazione, ErroreDominio } from "../dominio/operazioni";
import { MAX_PROPOSTE_PER_PERSONA } from "../dominio/votazione";
import { oggiLocale, ripulisciElenco, validaReminder } from "../dominio/reminder";
import type { Colletta } from "../tipi";
import type { RegaloDellAccount } from "./tipi";
import { collettaDaDoc, docDaColletta, docDaPartecipante, docDaProposta, eventoDaDoc, partecipanteDaDoc, prodottoDaDoc, propostaDaDoc, votoDaDoc } from "./mappa";
import { idVoto } from "../dominio/votazione";
import { filtraProdotti, type Dati } from "./tipi";

const ts = (ms: number) => Timestamp.fromMillis(ms);

function identita(): string {
  const uid = authFirebase().currentUser?.uid;
  if (!uid) throw new Error("Non hai fatto l'accesso. Ricarica la pagina.");
  return uid;
}

export function creaDatiFirestore(): Dati {
  const db = dbFirebase();
  const refColletta = (slug: string) => doc(db, "collette", slug);
  const righe = (slug: string) => collection(db, "collette", slug, "partecipanti");
  const refProposte = (slug: string) => collection(db, "collette", slug, "proposte");
  const refVoti = (slug: string) => collection(db, "collette", slug, "voti");

  async function causaliDi(slug: string, escludi?: string): Promise<string[]> {
    const snap = await getDocs(righe(slug));
    return snap.docs.filter((d) => d.id !== escludi).map((d) => String(d.data().causale ?? ""));
  }

  return {
    async elencaProdotti(filtri) {
      const snap = await getDocs(query(collection(db, "prodotti"), where("attivo", "==", true)));
      return filtraProdotti(snap.docs.map((d) => prodottoDaDoc(d.id, d.data())), filtri);
    },
    async prodotto(slug) {
      const d = await getDoc(doc(db, "prodotti", slug));
      if (!d.exists()) return null;
      const p = prodottoDaDoc(d.id, d.data());
      return p.eliminato ? null : p;
    },
    async colletta(slug) {
      const d = await getDoc(refColletta(slug));
      return d.exists() ? collettaDaDoc(d.data()) : null;
    },
    async partecipanti(slug) {
      const snap = await getDocs(righe(slug));
      return snap.docs.map((d) => partecipanteDaDoc(d.id, d.data()));
    },

    async proposte(slug) {
      const snap = await getDocs(refProposte(slug));
      return snap.docs.map((d) => propostaDaDoc(d.id, d.data()));
    },
    async voti(slug) {
      const snap = await getDocs(refVoti(slug));
      return snap.docs.map((d) => votoDaDoc(d.id, d.data()));
    },
    osservaProposte(slug, cb, errore) {
      return onSnapshot(
        refProposte(slug),
        (snap) => cb(snap.docs.map((d) => propostaDaDoc(d.id, d.data()))),
        (e) => errore?.(e),
      );
    },
    osservaVoti(slug, cb, errore) {
      return onSnapshot(
        refVoti(slug),
        (snap) => cb(snap.docs.map((d) => votoDaDoc(d.id, d.data()))),
        (e) => errore?.(e),
      );
    },
    async impostaProposteIniziali(slug, prodotti) {
      const uid = identita();
      const c = await getDoc(refColletta(slug));
      const nome = String(c.data()?.organizzatoreNome ?? "");
      const esistenti = await getDocs(refProposte(slug));
      const batch = writeBatch(db);
      esistenti.docs.filter((d) => d.data().daOrganizzatore === true).forEach((d) => batch.delete(d.ref));
      prodotti.forEach((prodotto) => {
        batch.set(doc(refProposte(slug)), docDaProposta({ prodotto, daOrganizzatore: true, autoreUid: uid, autoreNome: nome, creatoIl: 0 }, () => serverTimestamp()));
      });
      await batch.commit();
    },
    async aggiungiProposta(slug, p) {
      const uid = identita();
      const c = await getDoc(refColletta(slug));
      const dati = c.data();
      const organizzatore = dati?.organizzatoreUid === uid;
      const nome = p.autoreNome.replace(/\s+/g, " ").trim().slice(0, 40);
      if (!nome) throw new ErroreDominio("Scrivi il tuo nome.");
      if (!organizzatore) {
        const mie = (await getDocs(refProposte(slug))).docs.filter((d) => d.data().autoreUid === uid && d.data().daOrganizzatore !== true).length;
        if (mie >= MAX_PROPOSTE_PER_PERSONA) throw new ErroreDominio(`Puoi proporre al massimo ${MAX_PROPOSTE_PER_PERSONA} regali.`);
      }
      await addDoc(refProposte(slug), docDaProposta({ prodotto: p.prodotto, daOrganizzatore: organizzatore, autoreUid: uid, autoreNome: nome, creatoIl: 0 }, () => serverTimestamp()));
    },
    async rimuoviProposta(slug, propostaId) {
      const batch = writeBatch(db);
      batch.delete(doc(refProposte(slug), propostaId));
      // anche i voti di quella proposta (solo chi organizza può cancellare i voti degli altri)
      try {
        const voti = await getDocs(refVoti(slug));
        voti.docs.filter((d) => d.data().propostaId === propostaId).forEach((d) => batch.delete(d.ref));
      } catch {
        /* ignorato */
      }
      await batch.commit();
    },
    async vota(slug, propostaId, stelle) {
      const uid = identita();
      if (!Number.isInteger(stelle) || stelle < 1 || stelle > 5) throw new ErroreDominio("Il voto va da 1 a 5 stelle.");
      await setDoc(doc(refVoti(slug), idVoto(uid, propostaId)), { propostaId, uid, stelle, ts: serverTimestamp() });
    },

    async scegliVoto(slug, propostaId) {
      const uid = identita();
      // le regole permettono a ciascuno di togliere i propri voti finché si vota (firestore.rules, /voti)
      const miei = await getDocs(query(refVoti(slug), where("uid", "==", uid)));
      const batch = writeBatch(db);
      miei.docs.filter((d) => d.data().propostaId !== propostaId).forEach((d) => batch.delete(d.ref));
      batch.set(doc(refVoti(slug), idVoto(uid, propostaId)), { propostaId, uid, stelle: 5, ts: serverTimestamp() });
      await batch.commit();
    },
    async mieiRegali(utente) {
      if (utente !== identita()) throw new ErroreDominio("Non puoi elencare i regali di altri.");
      const out: RegaloDellAccount[] = [];
      const organizzati = await getDocs(query(collection(db, "collette"), where("organizzatoreUid", "==", utente), orderBy("creatoIl", "desc"), limit(50)));
      for (const d of organizzati.docs) {
        const c = collettaDaDoc(d.data());
        if (c.stato === "bozza") continue;
        const r = await getDocs(righe(c.slug));
        out.push({ colletta: c, righe: r.docs.map((x) => partecipanteDaDoc(x.id, x.data())), organizzo: true });
      }
      // le proprie righe nei regali di altri: query sul gruppo di raccolte (indice in firestore.indexes.json, regola su
      // /{path=**}/partecipanti in firestore.rules)
      const mie = await getDocs(query(collectionGroup(db, "partecipanti"), where("uidAnonimo", "==", utente), limit(100)));
      for (const d of mie.docs) {
        const slug = d.ref.parent.parent?.id;
        if (!slug || out.some((x) => x.colletta.slug === slug)) continue;
        const riga = partecipanteDaDoc(d.id, d.data());
        if (riga.stato === "rinunciato") continue;
        const cs = await getDoc(refColletta(slug));
        if (!cs.exists()) continue;
        const c = collettaDaDoc(cs.data());
        if (c.stato === "bozza" || c.organizzatoreUid === utente) continue;
        out.push({ colletta: c, righe: [riga], organizzo: false });
      }
      return out.sort((x, y) => x.colletta.dataRegalo - y.colletta.dataRegalo);
    },
    async profilo(utente) {
      const d = await getDoc(doc(db, "utenti", utente));
      if (!d.exists()) return null;
      const v = d.data();
      return { nome: String(v.nome ?? ""), newsletter: v.newsletter === true };
    },
    async aggiornaProfilo(utente, patch) {
      const out: Record<string, unknown> = {};
      if (typeof patch.nome === "string") out.nome = patch.nome.replace(/\s+/g, " ").trim().slice(0, 60);
      if (typeof patch.newsletter === "boolean") out.newsletter = patch.newsletter;
      await setDoc(doc(db, "utenti", utente), out, { merge: true });
    },
    async preferiti(utente) {
      const snap = await getDocs(collection(db, "utenti", utente, "preferiti"));
      return snap.docs.map((d) => d.id);
    },
    async impostaPreferito(utente, prodottoSlug, preferito) {
      const ref = doc(db, "utenti", utente, "preferiti", prodottoSlug);
      if (preferito) await setDoc(ref, { creatoIl: serverTimestamp() });
      else await deleteDoc(ref);
    },

    async reminder(utente) {
      const snap = await getDocs(collection(db, "utenti", utente, "reminder"));
      return ripulisciElenco(
        snap.docs.map((d) => ({ ...d.data(), id: d.id })),
        oggiLocale(),
      );
    },
    async salvaReminder(utente, grezzo) {
      const { id, ...r } = validaReminder(grezzo, oggiLocale());
      await setDoc(doc(db, "utenti", utente, "reminder", id), { ...r, aggiornatoIl: serverTimestamp() });
    },
    async eliminaReminder(utente, id) {
      await deleteDoc(doc(db, "utenti", utente, "reminder", id));
    },

    async salvaUtente(u) {
      const ref = doc(db, "utenti", u.uid);
      if ((await getDoc(ref)).exists()) return;
      await setDoc(ref, { nome: u.nome, email: u.email, creatoIl: serverTimestamp() });
    },
    async slugLibero(slug) {
      return !(await getDoc(refColletta(slug))).exists();
    },
    async creaColletta(c) {
      await setDoc(refColletta(c.slug), docDaColletta(c, ts));
    },
    async aggiornaColletta(slug, patch: Partial<Colletta>) {
      await updateDoc(refColletta(slug), docDaColletta({ ...patch, aggiornatoIl: Date.now() }, ts));
    },
    async eliminaBozza(slug) {
      const snap = await getDocs(righe(slug));
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      batch.delete(refColletta(slug));
      await batch.commit();
    },
    async elencaCollette(organizzatoreUid) {
      const snap = await getDocs(
        query(collection(db, "collette"), where("organizzatoreUid", "==", organizzatoreUid), orderBy("creatoIl", "desc"), limit(50)),
      );
      return snap.docs.map((d) => collettaDaDoc(d.data()));
    },
    osservaColletta(slug, cb, errore) {
      return onSnapshot(
        refColletta(slug),
        (d) => cb(d.exists() ? collettaDaDoc(d.data()) : null),
        (e) => errore?.(e),
      );
    },
    osservaPartecipanti(slug, cb, errore) {
      return onSnapshot(
        righe(slug),
        (snap) => cb(snap.docs.map((d) => partecipanteDaDoc(d.id, d.data()))),
        (e) => errore?.(e),
      );
    },
    async eventi(slug) {
      const snap = await getDocs(query(collection(db, "collette", slug, "eventi"), orderBy("ts", "asc")));
      return snap.docs.map((d) => eventoDaDoc(d.id, d.data()));
    },
    async registraEvento(slug, e) {
      await addDoc(collection(db, "collette", slug, "eventi"), { ...e, ts: serverTimestamp() });
    },

    async esegui(slug, pid, op) {
      const uid = identita();
      const causaliAltre = op.tipo === "aderisci" || op.tipo === "rinuncia" ? await causaliDi(slug, pid) : [];
      await runTransaction(db, async (tx) => {
        const cRef = refColletta(slug);
        const pRef = doc(righe(slug), pid);
        const cSnap = await tx.get(cRef);
        if (!cSnap.exists()) throw new ErroreDominio("Questo regalo di gruppo non esiste.");
        const pSnap = await tx.get(pRef);
        const r = eseguiOperazione(op, {
          colletta: collettaDaDoc(cSnap.data()),
          pid,
          riga: pSnap.exists() ? partecipanteDaDoc(pSnap.id, pSnap.data()) : null,
          causaliAltre,
          uid,
          ora: Date.now(),
        });
        for (const { id, valore } of r.righe) {
          const ref = doc(righe(slug), id);
          if (valore === null) tx.delete(ref);
          else tx.set(ref, docDaPartecipante(valore, ts));
        }
        if (Object.keys(r.colletta).length) tx.update(cRef, docDaColletta(r.colletta, ts));
        for (const e of r.eventi) {
          tx.set(doc(collection(db, "collette", slug, "eventi")), { ...e, uidAnonimo: e.uidAnonimo ?? uid, ts: serverTimestamp() });
        }
      });
    },

    async aggiungiInvitati(slug, nomi) {
      const causali = await causaliDi(slug);
      await runTransaction(db, async (tx) => {
        const cRef = refColletta(slug);
        const cSnap = await tx.get(cRef);
        if (!cSnap.exists()) throw new ErroreDominio("Questo regalo di gruppo non esiste.");
        const r = creaInvitati(collettaDaDoc(cSnap.data()), nomi, causali, Date.now(), () => doc(righe(slug)).id);
        for (const { id, valore } of r.righe) {
          if (valore) tx.set(doc(righe(slug), id), docDaPartecipante(valore, ts));
        }
        tx.update(cRef, docDaColletta(r.colletta, ts));
      });
    },

    async registraSolleciti(slug, pid, momento) {
      const batch = writeBatch(db);
      for (const id of pid) batch.update(doc(righe(slug), id), { solleciti: increment(1) });
      batch.set(doc(collection(db, "collette", slug, "eventi")), {
        tipo: "sollecito_preparato",
        uidAnonimo: null,
        partecipanteId: null,
        meta: { momento, destinatari: pid.length },
        ts: serverTimestamp(),
      });
      await batch.commit();
    },
  };
}
