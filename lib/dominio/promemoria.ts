// Il servizio prepara, l'organizzatore inoltra (sezione 12).
// Regole del codice: mai più di quattro messaggi per persona; mai un tono di rimprovero;
// ogni messaggio contiene il link e la pagina ha sempre «Non partecipo».

import type { Colletta, Partecipante } from "../tipi";
import { formattaEuro } from "./importi";
import { aggiungiGiorni, differenzaGiorni, giornoRoma, istanteRoma } from "./date";

export const MAX_SOLLECITI_PER_PERSONA = 4;

export type MomentoPromemoria = "subito" | "meno5" | "meno3" | "meno1";

export interface Promemoria {
  momento: MomentoPromemoria;
  titolo: string;
  destinatari: string;
  testo: string;
  /** istante in cui il promemoria diventa opportuno */
  quando: number;
  /** righe nominate a cui il messaggio è destinato (vuoto se la lista è aperta) */
  pidDestinatari: string[];
  /** quante persone note rientrano nel pubblico, null se la lista è aperta e non si può sapere */
  nDestinatari: number | null;
  /** true se è il momento di mandarlo (o è già passato) */
  maturo: boolean;
  /** true se tutte le persone note hanno già ricevuto il massimo dei messaggi */
  esaurito: boolean;
}

export const NOMI_MOMENTO: Record<MomentoPromemoria, string> = {
  subito: "Subito dopo l'invito",
  meno5: "5 giorni prima",
  meno3: "3 giorni prima",
  meno1: "1 giorno prima",
};

/** I testi dei promemoria, senza calcoli di calendario. */
export function testiPromemoria(c: Colletta, url: string): Record<MomentoPromemoria, string> {
  const quota = formattaEuro(c.quotaCent);
  return {
    subito: `${c.organizzatoreNome} sta organizzando il regalo per ${c.festeggiato}. Dai un'occhiata: ${url}`,
    meno5: `Partecipi al regalo per ${c.festeggiato}? Bastano ${quota}: ${url}`,
    meno3: `Manca la tua quota per il regalo di ${c.festeggiato}: ${quota}. ${url}`,
    meno1: `Domani ${c.organizzatoreNome} compra il regalo. Se vuoi esserci, è il momento: ${url}`,
  };
}

export function promemoriaCalendario(
  c: Colletta,
  partecipanti: Partecipante[],
  url: string,
  adesso: number,
): Promemoria[] {
  const testi = testiPromemoria(c, url);
  const giornoScadenza = giornoRoma(c.scadenza);
  const ammessi = (p: Partecipante) => p.solleciti < MAX_SOLLECITI_PER_PERSONA;
  const attivi = partecipanti.filter((p) => p.stato !== "rinunciato");
  const nominati = !c.listaAperta;

  const pubblici: Record<MomentoPromemoria, { titolo: string; destinatari: string; rigaTarget: (p: Partecipante) => boolean; giorni: number | null }> = {
    subito: {
      titolo: NOMI_MOMENTO.subito,
      destinatari: "Chi non ha ancora aperto il link",
      rigaTarget: (p) => p.stato === "invitato",
      giorni: null,
    },
    meno5: {
      titolo: NOMI_MOMENTO.meno5,
      destinatari: "Chi non ha ancora aderito",
      rigaTarget: (p) => p.stato === "invitato",
      giorni: -5,
    },
    meno3: {
      titolo: NOMI_MOMENTO.meno3,
      destinatari: "Chi ha aderito e non ha pagato",
      rigaTarget: (p) => p.stato === "aderito",
      giorni: -3,
    },
    meno1: {
      titolo: NOMI_MOMENTO.meno1,
      destinatari: "Chi ancora manca",
      rigaTarget: (p) => p.stato === "invitato" || p.stato === "aderito",
      giorni: -1,
    },
  };

  return (Object.keys(pubblici) as MomentoPromemoria[]).map((momento) => {
    const def = pubblici[momento];
    const quando =
      def.giorni === null ? c.creatoIl : istanteRoma(aggiungiGiorni(giornoScadenza, def.giorni), 9);
    const target = attivi.filter(def.rigaTarget);
    const raggiungibili = target.filter(ammessi);
    return {
      momento,
      titolo: def.titolo,
      destinatari: def.destinatari,
      testo: testi[momento],
      quando,
      pidDestinatari: raggiungibili.map((p) => p.id),
      nDestinatari: nominati || momento === "meno3" ? target.length : null,
      maturo: adesso >= quando,
      esaurito: (nominati || momento === "meno3") && target.length > 0 && raggiungibili.length === 0,
    };
  });
}

/** Il promemoria per chi organizza alla scadenza. */
export function testoScadenza(quoteMancanti: number): string {
  return quoteMancanti === 1
    ? "Manca 1 quota. Vuoi aspettare un giorno, procedere lo stesso o sollecitare ancora?"
    : `Mancano ${quoteMancanti} quote. Vuoi aspettare un giorno, procedere lo stesso o sollecitare ancora?`;
}

export function giorniAllaScadenza(scadenza: number, adesso: number): number {
  return differenzaGiorni(giornoRoma(adesso), giornoRoma(scadenza));
}
