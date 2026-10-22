// Porta i link ai prodotti Amazon.it sul link affiliato (tag pacestefano77-21), nei dati su Firestore.
//
//   pnpm migra:link                          prova: mostra che cosa cambierebbe, senza scrivere nulla
//   pnpm migra:link --applica                scrive, dopo aver salvato un backup in backup/
//   pnpm migra:link --ripristina <file>      rimette i valori originali da un backup
//
// Idempotente: rieseguirla non cambia più nulla. Usa le credenziali dell'Admin SDK (vedi README).

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { firebaseAdminConfigurato } from "../lib/config";
import { creaBackup, daScrivere, eseguiPiano, pianifica, ripristina, type Backup } from "../lib/admin/migrazioneLink";
import { archivioLinkAdmin } from "../lib/admin/archivioLinkAdmin";

if (!firebaseAdminConfigurato()) {
  console.error("Le variabili FIREBASE_ADMIN_* valgono ancora INSERIRE: configura .env.local prima di lanciare la migrazione.");
  process.exit(1);
}

async function main() {
  const argomenti = process.argv.slice(2);
  const archivio = archivioLinkAdmin();

  const iRip = argomenti.indexOf("--ripristina");
  if (iRip >= 0) {
    const file = argomenti[iRip + 1];
    if (!file) throw new Error("Indica il file di backup: --ripristina backup/link-affiliati-….json");
    const r = await ripristina(archivio, JSON.parse(readFileSync(file, "utf8")) as Backup);
    console.log(`Ripristinati ${r.ripristinati} campi; saltati ${r.saltati} (cambiati da altri dopo la migrazione).`);
    return;
  }

  const piano = pianifica(await archivio.leggi());
  console.log("Riepilogo:", piano.riepilogo);
  for (const d of piano.decisioni.filter((x) => ["malformato", "mancante", "ignorato"].includes(x.stato))) {
    console.log(`  ${d.stato.toUpperCase()}  ${d.percorso}  ${d.prima ?? "(vuoto)"}  — ${d.motivo ?? ""}`);
  }
  const modifiche = daScrivere(piano);
  const es = modifiche[0];
  if (es) console.log(`Esempio:\n  prima: ${es.prima ?? "(vuoto)"}\n  dopo:  ${es.dopo}`);

  if (!argomenti.includes("--applica")) {
    console.log(`\nProva: nessun dato modificato. ${modifiche.length} campi verrebbero aggiornati. Aggiungi --applica per scriverli.`);
    return;
  }
  if (modifiche.length === 0) {
    console.log("\nNiente da fare: i link sono già tutti a posto.");
    return;
  }
  mkdirSync("backup", { recursive: true });
  const file = `backup/link-affiliati-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  writeFileSync(file, JSON.stringify(creaBackup(piano), null, 1));
  console.log(`\nBackup salvato in ${file}`);
  const r = await eseguiPiano(archivio, piano);
  console.log(`Aggiornati ${r.scritti} campi. Per annullare: pnpm migra:link --ripristina ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
