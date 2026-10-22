// Scrive la colletta dimostrativa (slug "demo") su Firestore con l'Admin SDK.
// Idempotente: ricrea ogni volta la colletta, i dodici partecipanti e gli eventi.
// Uso: pnpm seed:demo   (legge .env.local)

import { Timestamp } from "firebase-admin/firestore";
import { firebaseAdminConfigurato } from "../lib/config";
import { dbAdmin } from "../lib/firebase/admin";
import { costruisciDemo, SLUG_DEMO } from "../lib/dati/demo";
import { docDaColletta, docDaPartecipante } from "../lib/dati/mappa";

if (!firebaseAdminConfigurato()) {
  console.error("Le variabili FIREBASE_ADMIN_* valgono ancora INSERIRE: configura .env.local prima di lanciare il seed.");
  process.exit(1);
}

async function main() {
  const db = dbAdmin();
  const ts = (ms: number) => Timestamp.fromMillis(ms);
  const { colletta, partecipanti, eventi } = costruisciDemo();
  const ref = db.collection("collette").doc(SLUG_DEMO);

  // Pulizia delle sottocollezioni, così il seed si può rilanciare.
  for (const sotto of ["partecipanti", "eventi"]) {
    const vecchi = await ref.collection(sotto).get();
    const pulizia = db.batch();
    vecchi.docs.forEach((d) => pulizia.delete(d.ref));
    await pulizia.commit();
  }

  const batch = db.batch();
  batch.set(ref, docDaColletta(colletta, ts));
  for (const p of partecipanti) batch.set(ref.collection("partecipanti").doc(p.id), docDaPartecipante(p, ts));
  for (const e of eventi) {
    const { id, ts: istante, ...resto } = e;
    batch.set(ref.collection("eventi").doc(id), { ...resto, ts: ts(istante) });
  }
  await batch.commit();
  console.log(`Colletta dimostrativa "${SLUG_DEMO}" scritta: ${partecipanti.length} partecipanti, ${eventi.length} eventi.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
