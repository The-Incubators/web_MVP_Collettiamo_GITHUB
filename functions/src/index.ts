// PRONTA E NON ATTIVA. Richiede il piano a consumo di Firebase (Blaze) e va aggiunta a firebase.json.
// Vedi DECISIONI.md, sezione «Promemoria».
//
// Ogni giorno alle 09:00 italiane guarda le collette aperte e, per ogni momento del calendario dei
// promemoria (sezione 12) che è arrivato, scrive UN evento `sollecito_preparato` con id stabile
// (`<slug>_<momento>`), così rilanciarla non duplica nulla. Non invia nulla a nessuno: i messaggi
// li inoltra chi organizza dalla dashboard. L'invio per email è fuori perimetro.
//
// Le regole di calendario ripetono quelle di lib/dominio/promemoria.ts: se cambiano là, cambiano qui.

import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";

initializeApp();

const GIORNO = 86_400_000;
const MAX_SOLLECITI = 4;

type Momento = "subito" | "meno5" | "meno3" | "meno1";
type Riga = { stato: string; solleciti?: number };

const MOMENTI: { momento: Momento; giorniPrima: number | null; pubblico: (r: Riga) => boolean }[] = [
  { momento: "subito", giorniPrima: null, pubblico: (r) => r.stato === "invitato" },
  { momento: "meno5", giorniPrima: 5, pubblico: (r) => r.stato === "invitato" },
  { momento: "meno3", giorniPrima: 3, pubblico: (r) => r.stato === "aderito" },
  { momento: "meno1", giorniPrima: 1, pubblico: (r) => r.stato === "invitato" || r.stato === "aderito" },
];

export const preparaPromemoria = onSchedule({ schedule: "0 9 * * *", timeZone: "Europe/Rome", region: "europe-west1" }, async () => {
  const db = getFirestore();
  const adesso = Date.now();
  const aperte = await db.collection("collette").where("stato", "==", "aperta").get();

  for (const doc of aperte.docs) {
    const c = doc.data();
    const scadenza = (c.scadenza as Timestamp).toMillis();
    const creata = (c.creatoIl as Timestamp).toMillis();
    const righe = (await doc.ref.collection("partecipanti").get()).docs.map((d) => d.data() as Riga);
    const attive = righe.filter((r) => r.stato !== "rinunciato");

    for (const m of MOMENTI) {
      const quando = m.giorniPrima === null ? creata : scadenza - m.giorniPrima * GIORNO;
      if (adesso < quando || adesso > scadenza) continue;
      const destinatari = attive.filter(m.pubblico).filter((r) => (r.solleciti ?? 0) < MAX_SOLLECITI).length;
      if (destinatari === 0 && !c.listaAperta) continue;
      // create() fallisce se l'evento esiste già: l'operazione è idempotente.
      await doc.ref
        .collection("eventi")
        .doc(`${doc.id}_${m.momento}`)
        .create({
          tipo: "sollecito_preparato",
          uidAnonimo: null,
          partecipanteId: null,
          meta: { momento: m.momento, destinatari, automatico: true },
          ts: Timestamp.now(),
        })
        .catch(() => undefined);
    }
  }
});
