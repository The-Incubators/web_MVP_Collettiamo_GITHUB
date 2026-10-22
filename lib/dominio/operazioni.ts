// Il cuore delle regole di dominio: ogni cambio di stato di un partecipante, calcolato come funzione pura.
// Gli adattatori dati la eseguono dentro una transazione (Firestore) o un blocco sincrono (memoria),
// così i totali della colletta cambiano insieme alla riga del partecipante (sezione 10.7).

import type {
  Colletta,
  Metodo,
  NuovoEvento,
  Partecipante,
  StatoPartecipante,
} from "../tipi";
import { generaCausale } from "./causale";
import { quotaEffettiva } from "./quota";

export class ErroreDominio extends Error {
  constructor(messaggio: string) {
    super(messaggio);
    this.name = "ErroreDominio";
  }
}

export type Operazione =
  // --- le fa il partecipante, solo sulla propria riga ---
  | { tipo: "aderisci"; nome: string; rivendica?: string }
  | { tipo: "sceglieMetodo"; metodo: Metodo }
  | { tipo: "dichiara"; metodo: Metodo; importoCent?: number | null }
  | { tipo: "messaggio"; testo: string }
  | { tipo: "rinuncia"; nome?: string }
  // --- le fa solo l'organizzatore ---
  | { tipo: "conferma"; importoCent?: number; metodo?: Metodo }
  | { tipo: "nonTrovato" }
  | { tipo: "segnaRinuncia" }
  | { tipo: "rimuovi" };

export const OPERAZIONI_ORGANIZZATORE: Operazione["tipo"][] = ["conferma", "nonTrovato", "segnaRinuncia", "rimuovi"];

export interface Contesto {
  colletta: Colletta;
  /** id della riga su cui si agisce */
  pid: string;
  /** la riga, se esiste già */
  riga: Partecipante | null;
  /** causali di tutte le altre righe della colletta (per le omonimie) */
  causaliAltre: string[];
  uid: string;
  ora: number;
}

export interface RigaScritta {
  id: string;
  /** null = eliminare la riga */
  valore: Partecipante | null;
}

export interface Risultato {
  righe: RigaScritta[];
  colletta: Partial<Colletta>;
  eventi: NuovoEvento[];
}

export const MAX_MESSAGGIO = 240;
export const MAX_NOME = 40;

const STATI_ADERENTI: StatoPartecipante[] = ["aderito", "dichiarato", "confermato"];

export function pulisciNome(nome: string): string {
  return nome.replace(/\s+/g, " ").trim().slice(0, MAX_NOME);
}

/** Che cosa pesa una riga sui totali della colletta. */
export function contributi(p: Partecipante | null) {
  return {
    attesi: p && p.stato !== "rinunciato" ? 1 : 0,
    aderenti: p && STATI_ADERENTI.includes(p.stato) ? 1 : 0,
    confermati: p?.stato === "confermato" ? 1 : 0,
    cent: p?.stato === "confermato" ? (p.importoCent ?? 0) : 0,
  };
}

/** Aggiorna i totali della colletta per il passaggio di una riga da `prima` a `dopo`. */
export function aggiornaTotali(
  c: Pick<Colletta, "nAttesi" | "nAderenti" | "nConfermati" | "totaleConfermatoCent">,
  prima: Partecipante | null,
  dopo: Partecipante | null,
): Pick<Colletta, "nAttesi" | "nAderenti" | "nConfermati" | "totaleConfermatoCent"> {
  const a = contributi(prima);
  const d = contributi(dopo);
  return {
    nAttesi: c.nAttesi + d.attesi - a.attesi,
    nAderenti: c.nAderenti + d.aderenti - a.aderenti,
    nConfermati: c.nConfermati + d.confermati - a.confermati,
    totaleConfermatoCent: c.totaleConfermatoCent + d.cent - a.cent,
  };
}

function rigaVuota(id: string, nome: string, uid: string | null, causale: string, ora: number): Partecipante {
  return {
    id,
    nome,
    uidAnonimo: uid,
    stato: "aderito",
    metodo: null,
    importoCent: null,
    causale,
    messaggio: null,
    nota: null,
    creatoIl: ora,
    dichiaratoIl: null,
    confermatoIl: null,
    solleciti: 0,
  };
}

function metodoAttivo(c: Colletta, m: Metodo): boolean {
  return c.metodi[m].attivo;
}

function esito(c: Colletta, prima: Partecipante | null, dopo: Partecipante | null, ora: number, eventi: NuovoEvento[], extra: Partial<Colletta> = {}): Risultato {
  const id = (dopo ?? prima)?.id ?? "";
  return {
    righe: id ? [{ id, valore: dopo }] : [],
    colletta: { ...aggiornaTotali(c, prima, dopo), ...extra, aggiornatoIl: ora },
    eventi,
  };
}

/** Esegue un'operazione. Lancia ErroreDominio se non è consentita. */
export function eseguiOperazione(op: Operazione, ctx: Contesto): Risultato {
  const { colletta: c, riga, uid, ora } = ctx;
  const siaOrganizzatore = uid === c.organizzatoreUid;

  if (c.stato === "aperta" && c.votazione && !c.votazione.chiusa) {
    throw new ErroreDominio("Prima si sceglie il regalo con il voto: i pagamenti si aprono quando la votazione si chiude.");
  }

  if (OPERAZIONI_ORGANIZZATORE.includes(op.tipo)) {
    if (!siaOrganizzatore) throw new ErroreDominio("Solo chi organizza può farlo.");
    if (c.stato === "chiusa") throw new ErroreDominio("La colletta è chiusa.");
    if (!riga) throw new ErroreDominio("Partecipante non trovato.");
  } else if (c.stato !== "aperta") {
    throw new ErroreDominio(c.stato === "chiusa" ? "La raccolta è chiusa." : "La raccolta non è ancora aperta.");
  }

  switch (op.tipo) {
    case "aderisci": {
      const nome = pulisciNome(op.nome);
      if (op.rivendica) {
        if (!riga) throw new ErroreDominio("Non trovo questo nome.");
        if (riga.uidAnonimo === null && riga.stato === "invitato") {
          // un nome della lista chiusa: chi lo sceglie ne diventa il proprietario
          const dopo: Partecipante = { ...riga, uidAnonimo: uid, stato: "aderito" };
          return esito(c, riga, dopo, ora, [{ tipo: "adesione", uidAnonimo: uid, partecipanteId: riga.id, meta: { rivendicata: true } }]);
        }
        if (riga.uidAnonimo === null) throw new ErroreDominio("Questo nome non è disponibile.");
        // «Hai già partecipato?»: dal nuovo dispositivo si riprende la riga esistente, senza toccarne lo stato
        if (riga.uidAnonimo === uid) return { righe: [], colletta: {}, eventi: [] };
        const dopo: Partecipante = { ...riga, uidAnonimo: uid };
        return { righe: [{ id: riga.id, valore: dopo }], colletta: {}, eventi: [] };
      }
      if (riga && riga.stato !== "rinunciato") return { righe: [], colletta: {}, eventi: [] }; // già dentro
      if (!riga && !c.listaAperta) {
        throw new ErroreDominio(`L'elenco è chiuso: chiedi a ${c.organizzatoreNome} di aggiungerti.`);
      }
      if (!nome) throw new ErroreDominio("Scrivi il tuo nome.");
      const dopo = riga
        ? { ...riga, nome, stato: "aderito" as const }
        : rigaVuota(ctx.pid, nome, uid, generaCausale(c.festeggiato, nome, ctx.causaliAltre), ora);
      return esito(c, riga, dopo, ora, [{ tipo: "adesione", uidAnonimo: uid, partecipanteId: dopo.id, meta: {} }]);
    }

    case "sceglieMetodo": {
      const mia = rigaPropria(riga, uid);
      if (mia.stato !== "aderito" && mia.stato !== "dichiarato") throw new ErroreDominio("Prima partecipa alla colletta.");
      if (!metodoAttivo(c, op.metodo)) throw new ErroreDominio("Questo metodo non è disponibile.");
      const dopo = { ...mia, metodo: op.metodo };
      return esito(c, mia, dopo, ora, [{ tipo: "metodo_scelto", uidAnonimo: uid, partecipanteId: mia.id, meta: { metodo: op.metodo } }]);
    }

    case "dichiara": {
      const mia = rigaPropria(riga, uid);
      if (mia.stato === "confermato") return { righe: [], colletta: {}, eventi: [] };
      if (mia.stato !== "aderito" && mia.stato !== "dichiarato") throw new ErroreDominio("Prima partecipa alla colletta.");
      if (op.metodo === "contanti") throw new ErroreDominio("I contanti li segna chi organizza quando li riceve.");
      if (!metodoAttivo(c, op.metodo)) throw new ErroreDominio("Questo metodo non è disponibile.");
      let importoCent = mia.importoCent;
      if (c.modoQuota === "libera" && !(op.importoCent && op.importoCent > 0)) throw new ErroreDominio("Scrivi quanto hai dato.");
      // L'importo che la persona ha visto e pagato: chi organizza lo ritrova in conferma e può correggerlo.
      if (op.importoCent && op.importoCent > 0) importoCent = op.importoCent;
      const dopo: Partecipante = {
        ...mia,
        stato: "dichiarato",
        metodo: op.metodo,
        importoCent,
        dichiaratoIl: mia.dichiaratoIl ?? ora,
      };
      const eventi: NuovoEvento[] =
        mia.stato === "dichiarato"
          ? []
          : [{ tipo: "dichiarazione", uidAnonimo: uid, partecipanteId: mia.id, meta: { metodo: op.metodo } }];
      return esito(c, mia, dopo, ora, eventi);
    }

    case "messaggio": {
      const mia = rigaPropria(riga, uid);
      if (mia.stato === "rinunciato" || mia.stato === "invitato") throw new ErroreDominio("Prima partecipa alla colletta.");
      const testo = op.testo.trim().slice(0, MAX_MESSAGGIO);
      const dopo = { ...mia, messaggio: testo === "" ? null : testo };
      return esito(c, mia, dopo, ora, testo ? [{ tipo: "messaggio", uidAnonimo: uid, partecipanteId: mia.id, meta: { lunghezza: testo.length } }] : []);
    }

    case "rinuncia": {
      if (!riga) {
        const nome = pulisciNome(op.nome ?? "");
        const eventi: NuovoEvento[] = [{ tipo: "rinuncia", uidAnonimo: uid, partecipanteId: null, meta: {} }];
        if (!nome) return { righe: [], colletta: {}, eventi };
        const nuova: Partecipante = {
          ...rigaVuota(ctx.pid, nome, uid, generaCausale(c.festeggiato, nome, ctx.causaliAltre), ora),
          stato: "rinunciato",
        };
        return { ...esito(c, null, nuova, ora, eventi) };
      }
      const mia = rigaPropria(riga, uid);
      if (mia.stato === "confermato") throw new ErroreDominio("Il tuo pagamento è già confermato: scrivi a chi organizza.");
      const dopo = { ...mia, stato: "rinunciato" as const };
      return esito(c, mia, dopo, ora, [{ tipo: "rinuncia", uidAnonimo: uid, partecipanteId: mia.id, meta: {} }]);
    }

    case "conferma": {
      const r = riga as Partecipante;
      const importoCent = op.importoCent ?? r.importoCent ?? quotaEffettiva(c);
      if (!Number.isInteger(importoCent) || importoCent <= 0) throw new ErroreDominio("Importo non valido.");
      const metodo = op.metodo ?? r.metodo;
      const dopo: Partecipante = {
        ...r,
        stato: "confermato",
        metodo,
        importoCent,
        nota: null,
        confermatoIl: r.confermatoIl ?? ora,
        dichiaratoIl: r.dichiaratoIl ?? (r.stato === "dichiarato" ? ora : null),
      };
      // Congelamento della quota (10.3): al primo passaggio a confermato.
      const extra: Partial<Colletta> = c.quotaCongelata ? {} : { quotaCongelata: true, quotaCent: quotaEffettiva(c) };
      return esito(c, r, dopo, ora, [{ tipo: "conferma", uidAnonimo: r.uidAnonimo, partecipanteId: r.id, meta: { importoCent } }], extra);
    }

    case "nonTrovato": {
      const r = riga as Partecipante;
      if (r.stato !== "dichiarato") throw new ErroreDominio("Non c'è nessuna dichiarazione da respingere.");
      const dopo: Partecipante = { ...r, stato: "aderito", dichiaratoIl: null, nota: "Pagamento non trovato" };
      return esito(c, r, dopo, ora, []);
    }

    case "segnaRinuncia": {
      const r = riga as Partecipante;
      const dopo: Partecipante = { ...r, stato: "rinunciato" };
      return esito(c, r, dopo, ora, [{ tipo: "rinuncia", uidAnonimo: r.uidAnonimo, partecipanteId: r.id, meta: { daOrganizzatore: true } }]);
    }

    case "rimuovi": {
      const r = riga as Partecipante;
      return esito(c, r, null, ora, []);
    }
  }
}

function rigaPropria(riga: Partecipante | null, uid: string): Partecipante {
  if (!riga || riga.uidAnonimo !== uid) throw new ErroreDominio("Non trovo la tua partecipazione.");
  return riga;
}

/** L'organizzatore aggiunge nomi alla lista degli attesi (stato "invitato"). */
export function creaInvitati(
  c: Colletta,
  nomi: string[],
  causaliEsistenti: string[],
  ora: number,
  nuovoId: () => string,
): Risultato {
  const causali = [...causaliEsistenti];
  const righe: RigaScritta[] = [];
  let colletta = { ...c };
  for (const grezzo of nomi) {
    const nome = pulisciNome(grezzo);
    if (!nome) continue;
    const causale = generaCausale(c.festeggiato, nome, causali);
    causali.push(causale);
    const valore: Partecipante = { ...rigaVuota(nuovoId(), nome, null, causale, ora), stato: "invitato" };
    righe.push({ id: valore.id, valore });
    colletta = { ...colletta, ...aggiornaTotali(colletta, null, valore) };
  }
  return {
    righe,
    colletta: {
      nAttesi: colletta.nAttesi,
      nAderenti: colletta.nAderenti,
      nConfermati: colletta.nConfermati,
      totaleConfermatoCent: colletta.totaleConfermatoCent,
      aggiornatoIl: ora,
    },
    eventi: [],
  };
}

/** Le operazioni che il partecipante può fare sulla propria riga, per i test e per l'adattatore memoria. */
export function eOperazioneOrganizzatore(op: Operazione): boolean {
  return OPERAZIONI_ORGANIZZATORE.includes(op.tipo);
}
