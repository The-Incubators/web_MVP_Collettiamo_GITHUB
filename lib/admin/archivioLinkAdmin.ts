import { dbAdmin } from "../firebase/admin";
import type { Archivio, VoceLink } from "./migrazioneLink";

/** L'archivio dei link su Firestore, letto e scritto con l'Admin SDK. */
export function archivioLinkAdmin(): Archivio {
  const db = dbAdmin();
  return {
    async leggi() {
      const voci: VoceLink[] = [];
      for (const d of (await db.collection("prodotti").get()).docs) {
        voci.push({ percorso: d.ref.path, campo: "urlEsterno", attuale: (d.get("urlEsterno") as string | undefined) ?? null, asin: (d.get("asin") as string | undefined) ?? null, ambito: "catalogo", daCatalogo: true });
      }
      for (const d of (await db.collection("collette").get()).docs) {
        voci.push({ percorso: d.ref.path, campo: "prodotto.urlEsterno", attuale: (d.get("prodotto.urlEsterno") as string | undefined) ?? null, asin: null, ambito: "colletta", daCatalogo: !!d.get("prodotto.prodottoId") });
      }
      for (const d of (await db.collectionGroup("proposte").get()).docs) {
        voci.push({ percorso: d.ref.path, campo: "prodotto.urlEsterno", attuale: (d.get("prodotto.urlEsterno") as string | undefined) ?? null, asin: null, ambito: "proposta", daCatalogo: !!d.get("prodotto.prodottoId") });
      }
      return voci;
    },
    async scrivi(percorso, campo, valore) {
      await db.doc(percorso).update(campo, valore);
    },
  };
}
