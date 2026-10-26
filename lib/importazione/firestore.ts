// Archivio su Firestore, solo dal server (Admin SDK): le regole non aprono queste collezioni a nessun browser.
// /candidati/{asin}: i prodotti caricati dall'agente, con la decisione. /fotoProdotti/{nome}: le foto
// (già rimpicciolite nel browser, sotto il limite di un documento), come le immagini dei biglietti.

import { dbAdmin } from "../firebase/admin";
import type { ArchivioImportazione, Candidato } from "./tipi";

export function creaArchivioImportazioneFirestore(): ArchivioImportazione {
  const db = dbAdmin();
  const candidati = db.collection("candidati");
  const foto = db.collection("fotoProdotti");
  return {
    async candidati() {
      const snap = await candidati.get();
      return snap.docs.map((d) => d.data() as Candidato);
    },
    async candidato(asin) {
      const d = await candidati.doc(asin).get();
      return d.exists ? (d.data() as Candidato) : null;
    },
    async salvaCandidato(c) {
      // JSON: toglie gli undefined, che Firestore rifiuta
      await candidati.doc(c.asin).set(JSON.parse(JSON.stringify(c)));
    },
    async salvaFoto(nome, f) {
      await foto.doc(nome).set({ mime: f.mime, dati: Buffer.from(f.dati) });
    },
    async leggiFoto(nome) {
      const d = await foto.doc(nome).get();
      if (!d.exists) return null;
      const v = d.data() ?? {};
      return { mime: String(v.mime), dati: new Uint8Array(v.dati as Buffer) };
    },
  };
}
