// Letture lato server con l'Admin SDK: servono a rendere le pagine pubbliche (anteprime incluse),
// più la chiusura a tempo della votazione, che le regole non permettono a chi partecipa.

import { Timestamp } from "firebase-admin/firestore";
import { chiusuraVotazione, votazioneScaduta } from "../dominio/votazione";
import { dbAdmin } from "../firebase/admin";
import { aMs, collettaDaDoc, docDaColletta, partecipanteDaDoc, prodottoDaDoc, propostaDaDoc, votoDaDoc } from "./mappa";
import { confrontaProdotti, filtraProdotti, type DatiServer } from "./tipi";

export function creaDatiFirestoreAdmin(): DatiServer {
  const db = dbAdmin();
  return {
    async elencaProdotti(filtri) {
      const snap = await db.collection("prodotti").where("attivo", "==", true).get();
      return filtraProdotti(snap.docs.map((d) => prodottoDaDoc(d.id, d.data())), filtri);
    },
    async prodotto(slug) {
      const d = await db.collection("prodotti").doc(slug).get();
      if (!d.exists) return null;
      const p = prodottoDaDoc(d.id, d.data() ?? {});
      // Un prodotto eliminato non esiste più per chi visita: vale anche aprendone il link diretto.
      return p.eliminato ? null : p;
    },
    async colletta(slug) {
      const d = await db.collection("collette").doc(slug).get();
      return d.exists ? collettaDaDoc(d.data() ?? {}) : null;
    },
    async partecipanti(slug) {
      const snap = await db.collection("collette").doc(slug).collection("partecipanti").get();
      return snap.docs.map((d) => partecipanteDaDoc(d.id, d.data()));
    },
    async proposte(slug) {
      const snap = await db.collection("collette").doc(slug).collection("proposte").get();
      return snap.docs.map((d) => propostaDaDoc(d.id, d.data()));
    },
    async voti(slug) {
      const snap = await db.collection("collette").doc(slug).collection("voti").get();
      return snap.docs.map((d) => votoDaDoc(d.id, d.data()));
    },
    async impostazioniCatalogo() {
      const d = await db.collection("impostazioni").doc("catalogo").get();
      if (!d.exists) return null;
      const v = d.data() ?? {};
      return {
        modo: v.modo === "stelle" ? "stelle" : "trascinamento",
        ordine: Array.isArray(v.ordine) ? (v.ordine as string[]) : [],
        stelle: (v.stelle as Record<string, number>) ?? {},
        aggiornatoIl: aMs(v.aggiornatoIl),
        aggiornatoDa: String(v.aggiornatoDa ?? ""),
      };
    },
    async elencaProdottiPerGestione() {
      const snap = await db.collection("prodotti").where("attivo", "==", true).get();
      // Niente filtraProdotti: qui servono anche gli eliminati, per poterli ripristinare.
      return snap.docs.map((d) => prodottoDaDoc(d.id, d.data())).sort(confrontaProdotti);
    },
    async impostaProdottoEliminato(slug, eliminato) {
      // merge: si scrive solo questo campo, il resto del prodotto non si tocca.
      await db.collection("prodotti").doc(slug).set({ eliminato }, { merge: true });
    },
    async salvaOrdineCatalogo(imp, posizioni) {
      const voci = Object.entries(posizioni);
      for (let i = 0; i < voci.length; i += 400) {
        const batch = db.batch();
        // merge: si aggiunge solo la posizione, il resto del prodotto non si tocca
        for (const [slug, posizione] of voci.slice(i, i + 400)) batch.set(db.collection("prodotti").doc(slug), { posizione }, { merge: true });
        await batch.commit();
      }
      await db.collection("impostazioni").doc("catalogo").set({ ...imp, aggiornatoIl: Timestamp.fromMillis(imp.aggiornatoIl) });
    },
    async chiudiVotazioneScaduta(slug) {
      const ref = db.collection("collette").doc(slug);
      return db.runTransaction(async (tx) => {
        const cs = await tx.get(ref);
        if (!cs.exists) return null;
        const c = collettaDaDoc(cs.data() ?? {});
        const ora = Date.now();
        if (!votazioneScaduta(c, ora)) return null;
        const [ps, vs] = await Promise.all([tx.get(ref.collection("proposte")), tx.get(ref.collection("voti"))]);
        const patch = chiusuraVotazione(
          c,
          ps.docs.map((d) => propostaDaDoc(d.id, d.data())),
          vs.docs.map((d) => votoDaDoc(d.id, d.data())),
          ora,
        );
        if (!patch) return null;
        tx.update(ref, docDaColletta(patch, (ms) => Timestamp.fromMillis(ms)));
        return { ...c, ...patch };
      });
    },
  };
}
