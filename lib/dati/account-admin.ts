// La cancellazione dell'account su Firestore, con l'Admin SDK (design.md §10.3). Non usa l'estensione Delete User Data,
// che chiude il 31 marzo 2027: le scritture sono quelle del piano di lib/dominio/cancellazione.ts.
//
// Le righe, i voti e le proposte dell'account nei regali di altri si trovano con query sul gruppo di raccolte
// (`collectionGroup`): servono gli indici di firestore.indexes.json (fieldOverrides su uidAnonimo, uid, autoreUid).

import { Timestamp, type DocumentReference, type Firestore } from "firebase-admin/firestore";
import type { GruppoDaCancellare } from "../dominio/cancellazione";
import { dbAdmin } from "../firebase/admin";
import { collettaDaDoc, docDaColletta, docDaPartecipante, partecipanteDaDoc, propostaDaDoc, votoDaDoc } from "./mappa";
import type { ArchivioAccount } from "./tipi";

const ts = (ms: number) => Timestamp.fromMillis(ms);

/** Lo slug del regalo da un documento /collette/{slug}/<raccolta>/{id}. */
function slugDi(ref: DocumentReference): string | null {
  const c = ref.parent.parent;
  return c && c.parent.id === "collette" ? c.id : null;
}

async function gruppo(db: Firestore, slug: string, soloDi?: string): Promise<GruppoDaCancellare | null> {
  const ref = db.collection("collette").doc(slug);
  const cs = await ref.get();
  if (!cs.exists) return null;
  const [r, v, p] = await Promise.all(
    soloDi
      ? [
          ref.collection("partecipanti").where("uidAnonimo", "==", soloDi).get(),
          ref.collection("voti").where("uid", "==", soloDi).get(),
          ref.collection("proposte").where("autoreUid", "==", soloDi).get(),
        ]
      : [ref.collection("partecipanti").get(), ref.collection("voti").get(), ref.collection("proposte").get()],
  );
  return {
    colletta: collettaDaDoc(cs.data() ?? {}),
    righe: r.docs.map((d) => partecipanteDaDoc(d.id, d.data())),
    voti: v.docs.map((d) => votoDaDoc(d.id, d.data())),
    proposte: p.docs.map((d) => propostaDaDoc(d.id, d.data())),
  };
}

export function archivioAccountFirestore(): ArchivioAccount {
  const db = dbAdmin();
  return {
    async raccogli(uid) {
      const utente = db.collection("utenti").doc(uid);
      const [pref, ric, org, righe, voti, proposte] = await Promise.all([
        utente.collection("preferiti").count().get(),
        utente.collection("reminder").count().get(),
        db.collection("collette").where("organizzatoreUid", "==", uid).get(),
        db.collectionGroup("partecipanti").where("uidAnonimo", "==", uid).get(),
        db.collectionGroup("voti").where("uid", "==", uid).get(),
        db.collectionGroup("proposte").where("autoreUid", "==", uid).get(),
      ]);
      const mie = new Set(org.docs.map((d) => d.id));
      const organizzati = (await Promise.all(org.docs.map((d) => gruppo(db, d.id)))).filter((g): g is GruppoDaCancellare => !!g);
      const altri = new Set<string>();
      for (const d of [...righe.docs, ...voti.docs, ...proposte.docs]) {
        const s = slugDi(d.ref);
        if (s && !mie.has(s)) altri.add(s);
      }
      const altrui = (await Promise.all([...altri].map((s) => gruppo(db, s, uid)))).filter((g): g is GruppoDaCancellare => !!g);
      return { preferiti: pref.data().count, ricorrenze: ric.data().count, organizzati, altrui };
    },

    async applica(piano, uid) {
      const col = db.collection("collette");
      const w = db.bulkWriter();
      // ogni scrittura ha la sua promessa: se una fallisce (dopo i tentativi del BulkWriter) la cancellazione si ferma
      // qui con un errore, prima di toccare l'utente in Firebase Auth, e si può ripetere
      const fatte: Promise<unknown>[] = [];
      const metti = (p: Promise<unknown>) => void fatte.push(p);
      for (const slug of piano.eliminaBozze) await db.recursiveDelete(col.doc(slug));
      for (const { slug, pid } of piano.eliminaRighe) metti(w.delete(col.doc(slug).collection("partecipanti").doc(pid)));
      for (const { slug, vecchioId, riga } of piano.scollegaRighe) {
        const righe = col.doc(slug).collection("partecipanti");
        // la riga nuova (senza uid, id nuovo) e via la vecchia, nella stessa transazione: o tutte e due o nessuna
        await db.runTransaction(async (tx) => {
          const vecchia = await tx.get(righe.doc(vecchioId));
          if (!vecchia.exists) return;
          tx.set(righe.doc(riga.id), docDaPartecipante(riga, ts));
          tx.delete(righe.doc(vecchioId));
        });
      }
      for (const { slug, patch } of piano.chiudi) metti(w.update(col.doc(slug), docDaColletta(patch, ts)));
      for (const { slug, votoId } of piano.eliminaVoti) metti(w.delete(col.doc(slug).collection("voti").doc(votoId)));
      for (const { slug, propostaId } of piano.anonimizzaProposte) metti(w.update(col.doc(slug).collection("proposte").doc(propostaId), { autoreUid: "", autoreNome: "" }));
      for (const { slug, tutti } of piano.eliminaEventi) {
        const eventi = col.doc(slug).collection("eventi");
        const snap = await (tutti ? eventi : eventi.where("uidAnonimo", "==", uid)).get();
        for (const d of snap.docs) metti(w.delete(d.ref));
      }
      await w.close();
      await Promise.all(fatte);
      // il profilo con preferiti e ricorrenze
      await db.recursiveDelete(db.collection("utenti").doc(uid));
    },
  };
}
