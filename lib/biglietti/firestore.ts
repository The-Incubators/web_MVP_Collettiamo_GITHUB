// Archivio dei biglietti su Firestore, solo con l'Admin SDK (le regole negano ogni accesso dal browser).
// Collezioni: /biglietti/{id}, /biglietti/{id}/firme/{firmaId}, /biglietti/{id}/immagini/{nome}, /slugBiglietti/{slug}.

import { FieldValue } from "firebase-admin/firestore";
import { dbAdmin } from "../firebase/admin";
import type { ArchivioBiglietti, BigliettoServer, FirmaServer } from "./tipi";
import { MAX_FIRME_PER_BIGLIETTO } from "./tipi";

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
    async eliminaFirma(id, firmaId) {
      return db.runTransaction(async (tx) => {
        const rb = col.doc(id);
        const rf = rb.collection("firme").doc(firmaId);
        const [b, f] = await Promise.all([tx.get(rb), tx.get(rf)]);
        if (!b.exists || b.get("stato") !== "aperto") return { errore: "chiuso" as const };
        if (!f.exists) return { eliminata: false };
        tx.delete(rf);
        tx.update(rb, { nFirme: FieldValue.increment(-1) });
        return { eliminata: true };
      });
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
    async perOrganizzatore(uid) {
      const snap = await col.where("organizzatoreUid", "==", uid).get();
      return snap.docs.map((d) => daDoc(d.id, d.data()) as BigliettoServer).sort((a, b) => b.creatoIl - a.creatoIl);
    },
  };
}
