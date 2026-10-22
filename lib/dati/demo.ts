// La colletta dimostrativa: slug fisso "demo", dodici partecipanti negli stati della sezione 10.6,
// quattro messaggi sul biglietto. Serve alla home e alle dimostrazioni: non va mai mostrata come reale.

import type { Colletta, Evento, Partecipante, StatoPartecipante } from "../tipi";
import { CATALOGO } from "./catalogo-dati";

export const SLUG_DEMO = "demo";
export const UID_ORGANIZZATORE_DEMO = "demo-organizzatore";
const GIORNO = 86_400_000;

type Riga = [nome: string, stato: StatoPartecipante, metodo: Partecipante["metodo"], messaggio: string | null];

const RIGHE: Riga[] = [
  ["Anna", "confermato", "paypal", "Buon compleanno Giulia! Che il tuo ingresso sia sempre in ordine."],
  ["Luca", "confermato", "bonifico", "Ti vogliamo bene: finalmente un posto per tutte le tue giacche!"],
  ["Sara", "confermato", "satispay", null],
  ["Paolo", "confermato", "paypal", "Auguri da tutto l'ufficio, e grazie per le mille risate."],
  ["Elena", "confermato", "bonifico", "Un abbraccio grande."],
  ["Davide", "dichiarato", "paypal", null],
  ["Chiara", "dichiarato", "satispay", null],
  ["Franco", "aderito", "contanti", null],
  ["Irene", "aderito", null, null],
  ["Marta", "invitato", null, null],
  ["Giorgio", "invitato", null, null],
  ["Tommaso", "rinunciato", null, null],
];

export function costruisciDemo(adesso: number = Date.now()): {
  colletta: Colletta;
  partecipanti: Partecipante[];
  eventi: Evento[];
} {
  const prodotto = CATALOGO.find((p) => p.id === "PRD-028")!;
  const scadenza = adesso + 6 * GIORNO;

  const partecipanti: Partecipante[] = RIGHE.map(([nome, stato, metodo, messaggio], i) => ({
    id: `demo-${i + 1}`,
    nome,
    uidAnonimo: stato === "invitato" ? null : `demo-uid-${i + 1}`,
    stato,
    metodo,
    importoCent: stato === "confermato" ? 1000 : null,
    causale: `GIULIA-${nome.toUpperCase()}`,
    messaggio,
    nota: null,
    creatoIl: adesso - (10 - i) * 3_600_000,
    dichiaratoIl: stato === "dichiarato" || stato === "confermato" ? adesso - (8 - i) * 3_600_000 : null,
    confermatoIl: stato === "confermato" ? adesso - (6 - i) * 3_600_000 : null,
    solleciti: 0,
  }));

  const confermati = partecipanti.filter((p) => p.stato === "confermato");
  const colletta: Colletta = {
    slug: SLUG_DEMO,
    organizzatoreUid: UID_ORGANIZZATORE_DEMO,
    organizzatoreNome: "Marco",
    festeggiato: "Giulia",
    occasione: "compleanno",
    dataRegalo: scadenza + 4 * GIORNO,
    scadenza,
    sorpresa: false,
    prodotto: {
      prodottoId: prodotto.slug,
      nome: prodotto.nome,
      prezzoCent: prodotto.prezzoCent,
      consegnaGiorni: prodotto.consegnaGiorni,
      urlEsterno: prodotto.urlEsterno,
      immagine: prodotto.immagine,
    },
    modoQuota: "fissa",
    quotaCent: 1000,
    quotaCongelata: true,
    previsti: 12,
    metodi: {
      paypal: { attivo: true, valore: "marco.demo" },
      satispay: { attivo: true, valore: "333 000 0000" },
      bonifico: { attivo: true, valore: "IT60X0542811101000000123456", intestatario: "Marco Esempio" },
      contanti: { attivo: true },
    },
    listaAperta: false,
    stato: "aperta",
    totaleConfermatoCent: confermati.length * 1000,
    nConfermati: confermati.length,
    nAttesi: partecipanti.filter((p) => p.stato !== "rinunciato").length,
    nAderenti: partecipanti.filter((p) => ["aderito", "dichiarato", "confermato"].includes(p.stato)).length,
    acquisto: null,
    votazione: null,
    creatoIl: adesso - 2 * GIORNO,
    aggiornatoIl: adesso,
  };

  const eventi: Evento[] = [];
  for (const p of partecipanti) {
    if (p.stato === "invitato") continue;
    const base = p.creatoIl;
    const aggiungi = (tipo: Evento["tipo"], dt: number, meta: Evento["meta"] = {}) =>
      eventi.push({ id: `demo-ev-${eventi.length + 1}`, tipo, uidAnonimo: p.uidAnonimo, partecipanteId: p.id, meta, ts: base + dt });
    aggiungi("apertura", 0);
    if (p.stato === "rinunciato") {
      aggiungi("rinuncia", 20_000);
      continue;
    }
    aggiungi("adesione", 30_000);
    if (p.metodo) aggiungi("metodo_scelto", 60_000, { metodo: p.metodo });
    if (p.stato === "dichiarato" || p.stato === "confermato") aggiungi("dichiarazione", 150_000, { metodo: p.metodo ?? "paypal" });
    if (p.messaggio) aggiungi("messaggio", 200_000);
    if (p.stato === "confermato") aggiungi("conferma", 3_600_000, { importoCent: 1000 });
  }
  return { colletta, partecipanti, eventi };
}
