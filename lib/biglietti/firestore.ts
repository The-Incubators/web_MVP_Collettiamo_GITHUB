// Archivio dei biglietti su Firestore, solo con l'Admin SDK (le regole negano ogni accesso dal browser).
// Collezioni: /biglietti/{id}, /biglietti/{id}/firme/{firmaId}, /biglietti/{id}/immagini/{nome}, /slugBiglietti/{slug},
// /biglietti/{id}/audio/{nome} (indice: quanti pezzi) e /biglietti/{id}/audio/{nome}~{i} (i pezzi dell'MP3).

import { FieldValue } from "firebase-admin/firestore";
import { dbAdmin } from "../firebase/admin";
import type { ArchivioBiglietti, BigliettoServer, FirmaServer } from "./tipi";
import { MAX_FIRME_PER_BIGLIETTO } from "./tipi";

/** Un documento Firestore arriva al massimo a 1 MiB: l'MP3 si divide in pezzi più piccoli. */
const PEZZO_AUDIO = 900 * 1024;

function senzaId<T extends { id: string }>(x: T): Omit<T, "id"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...resto } = x;
  return resto;
}

export function archivioBigliettiFirestore(): ArchivioBiglietti {
  const db = dbAdmin();
  const col = db.collection("biglietti");
  const slugCol = db.collection("slugBiglietti");
  const daDoc = (id: string, d: FirebaseFirestore.DocumentData | undefined) => (d ? ({ ...d, id } as BigliettoServer) : null);

  return {
    async crea(b) {
      await col.doc(b.id).create(senzaId(b));
    },
    async leggi(id) {
      const d = await col.doc(id).get();
      return d.exists ? daDoc(id, d.data()) : null;
    },
    async perSlug(slug) {
      const r = await slugCol.doc(slug).get();
      const id = r.exists ? (r.get("bigliettoId") as string) : null;
      if (!id) return null;
      const d = await col.doc(id).get();
      return d.exists ? daDoc(id, d.data()) : null;
    },
    async aggiorna(id, patch) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _x, ...resto } = patch as BigliettoServer;
      await col.doc(id).set(resto, { merge: true });
    },
    async slugOccupato(slug, escludiId) {
      const r = await slugCol.doc(slug).get();
      return r.exists && r.get("bigliettoId") !== escludiId;
    },
    async prenotaSlug(id, slug) {
      return db.runTransaction(async (tx) => {
        const rif = slugCol.doc(slug);
        const [r, b] = await Promise.all([tx.get(rif), tx.get(col.doc(id))]);
        if (!b.exists) return false;
        if (r.exists && r.get("bigliettoId") !== id) return false;
        const vecchio = b.get("slug") as string;
        if (vecchio && vecchio !== slug) {
          const rv = await tx.get(slugCol.doc(vecchio));
          if (rv.exists && rv.get("bigliettoId") === id) tx.delete(slugCol.doc(vecchio));
        }
        tx.set(rif, { bigliettoId: id });
        tx.update(col.doc(id), { slug });
        return true;
      });
    },
    async firme(id) {
      const snap = await col.doc(id).collection("firme").get();
      return snap.docs.map((d) => ({ ...(d.data() as FirmaServer), id: d.id }));
    },
    async firma(id, firmaId) {
      const d = await col.doc(id).collection("firme").doc(firmaId).get();
      return d.exists ? ({ ...(d.data() as FirmaServer), id: d.id }) : null;
    },
    async salvaFirma(id, f) {
      return db.runTransaction(async (tx) => {
        const rb = col.doc(id);
        const rf = rb.collection("firme").doc(f.id);
        const [b, prima] = await Promise.all([tx.get(rb), tx.get(rf)]);
        if (!b.exists || b.get("stato") !== "aperto") return { errore: "chiuso" as const };
        if (!prima.exists && (b.get("nFirme") as number) >= MAX_FIRME_PER_BIGLIETTO) return { errore: "pieno" as const };
        tx.set(rf, senzaId(prima.exists ? { ...f, creatoIl: prima.get("creatoIl") as number } : f));
        if (!prima.exists) tx.update(rb, { nFirme: FieldValue.increment(1) });
        return { nuova: !prima.exists };
      });
    },
    async eliminaFirma(id, firmaId, opzioni) {
      return db.runTransaction(async (tx) => {
        const rb = col.doc(id);
        const rf = rb.collection("firme").doc(firmaId);
        const [b, f] = await Promise.all([tx.get(rb), tx.get(rf)]);
        if (!b.exists || (b.get("stato") !== "aperto" && !opzioni?.qualsiasiStato)) return { errore: "chiuso" as const };
        if (!f.exists) return { eliminata: false };
        tx.delete(rf);
        tx.update(rb, { nFirme: FieldValue.increment(-1) });
        return { eliminata: true };
      });
    },
    async nascondiFirma(id, firmaId, nascosta) {
      const rf = col.doc(id).collection("firme").doc(firmaId);
      if (!(await rf.get()).exists) return false;
      await rf.update({ nascosta });
      return true;
    },
    async salvaImmagine(id, nome, img) {
      await col.doc(id).collection("immagini").doc(nome).set({ mime: img.mime, dati: Buffer.from(img.dati) });
    },
    async leggiImmagine(id, nome) {
      const d = await col.doc(id).collection("immagini").doc(nome).get();
      if (!d.exists) return null;
      const dati = d.get("dati") as Buffer;
      return { mime: d.get("mime") as string, dati: new Uint8Array(dati) };
    },
    async eliminaImmagine(id, nome) {
      await col.doc(id).collection("immagini").doc(nome).delete();
    },
    async salvaAudio(id, nome, dati) {
      const c = col.doc(id).collection("audio");
      const parti = Math.max(1, Math.ceil(dati.length / PEZZO_AUDIO));
      const batch = db.batch();
      for (let i = 0; i < parti; i++) batch.set(c.doc(`${nome}~${i}`), { dati: Buffer.from(dati.subarray(i * PEZZO_AUDIO, (i + 1) * PEZZO_AUDIO)) });
      // l'indice per ultimo nello stesso batch: o c'è tutto o niente
      batch.set(c.doc(nome), { parti, byte: dati.length });
      await batch.commit();
    },
    async leggiAudio(id, nome) {
      const c = col.doc(id).collection("audio");
      const indice = await c.doc(nome).get();
      if (!indice.exists) return null;
      const pezzi = await db.getAll(...Array.from({ length: indice.get("parti") as number }, (_, i) => c.doc(`${nome}~${i}`)));
      if (pezzi.some((d) => !d.exists)) return null;
      return new Uint8Array(Buffer.concat(pezzi.map((d) => d.get("dati") as Buffer)));
    },
    async eliminaAudio(id, nome) {
      const c = col.doc(id).collection("audio");
      const indice = await c.doc(nome).get();
      const parti = indice.exists ? (indice.get("parti") as number) : 0;
      const batch = db.batch();
      for (let i = 0; i < parti; i++) batch.delete(c.doc(`${nome}~${i}`));
      batch.delete(c.doc(nome));
      await batch.commit();
    },
    async perOrganizzatore(uid) {
      const snap = await col.where("organizzatoreUid", "==", uid).get();
      return snap.docs.map((d) => daDoc(d.id, d.data()) as BigliettoServer).sort((a, b) => b.creatoIl - a.creatoIl);
    },
  };
}
