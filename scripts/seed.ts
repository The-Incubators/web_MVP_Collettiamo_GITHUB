// Scrive il catalogo finto su Firestore con l'Admin SDK. Idempotente: lo slug è l'id del documento.
// Uso: pnpm seed   (legge .env.local)

import { CATALOGO } from "../lib/dati/catalogo-dati";
import { firebaseAdminConfigurato } from "../lib/config";
import { dbAdmin } from "../lib/firebase/admin";

if (!firebaseAdminConfigurato()) {
  console.error("Le variabili FIREBASE_ADMIN_* valgono ancora INSERIRE: configura .env.local prima di lanciare il seed.");
  process.exit(1);
}

async function main() {
  const db = dbAdmin();
  const batch = db.batch();
  for (const { slug, ...resto } of CATALOGO) {
    // merge: così non si perde la posizione decisa da chi gestisce il sito
    batch.set(db.collection("prodotti").doc(slug), { slug, ...resto }, { merge: true });
  }
  // Il catalogo è quello dell'importazione: i prodotti che non ne fanno più parte si tolgono. Quelli importati
  // dal backoffice (`importato: true`) non stanno nel file e restano.
  const attuali = new Set(CATALOGO.map((p) => p.slug));
  const esistenti = await db.collection("prodotti").get();
  const vecchi = esistenti.docs.filter((d) => !attuali.has(d.id) && d.data().importato !== true);
  vecchi.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  console.log(`Catalogo scritto: ${CATALOGO.length} prodotti${vecchi.length ? `, ${vecchi.length} vecchi rimossi` : ""}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
