// La pagina del gruppo (Gifty UX v2, design.md §4 «Registro» e §8 decisione 7; prototipi/gestisci.html, invito.html,
// regali.html): il registro di chi organizza, la consegna, e lo stato di un regalo nell'elenco «I miei regali».
// Tutto calcolato da funzioni pure sui dati che ci sono già (colletta e righe): nessun campo nuovo da tenere in pari.

import type { Colletta, Partecipante, ProdottoColletta } from "../tipi";
import { aggiungiGiorni, giornoRoma, istanteRoma } from "./date";
import { formattaEuro } from "./importi";
import { ErroreDominio } from "./operazioni";
import { quotaAllaChiusuraAdesioni, quotaEffettiva } from "./quota";
import { regaloDaScegliere } from "./regali";
import { MIN_PROPOSTE_INIZIALI, ORE, prodottoSegnaposto, votazioneIniziale, votazioneInCorso } from "./votazione";

/** Il regalo è consegnato: da qui nessuno si aggiunge più (D-15), ma i rimborsi continuano. */
export function consegnato(c: Pick<Colletta, "consegnatoIl">): boolean {
  return typeof c.consegnatoIl === "number" && c.consegnatoIl > 0;
}

/** Gruppo finito: consegnato, oppure chiuso con la vecchia chiusura. Va fra «Consegnati» nell'account. */
export function gruppoConcluso(c: Pick<Colletta, "consegnatoIl" | "stato">): boolean {
  return consegnato(c) || c.stato === "chiusa";
}

/** Una riga aggiunta a mano da chi organizza: nessun account collegato (anche una riga scollegata da un account cancellato). */
export function aggiuntaAMano(r: Pick<Partecipante, "uidAnonimo">): boolean {
  return r.uidAnonimo === null;
}

/** Chi fa parte della divisione: tutte le righe tranne chi ha rinunciato. */
export function righeInDivisione(righe: Partecipante[]): Partecipante[] {
  return righe.filter((r) => r.stato !== "rinunciato");
}

/** Gli iscritti: chi ha aderito con il suo account (non le righe aggiunte a mano). «3 su 10» (AC-08). */
export function iscritti(righe: Partecipante[]): number {
  return righe.filter((r) => !aggiuntaAMano(r) && (r.stato === "aderito" || r.stato === "dichiarato" || r.stato === "confermato")).length;
}

export type AzioneRiga = { tipo: "ricevuto"; cent: number } | { tipo: "pagamento" } | null;

export interface RigaRegistro {
  riga: Partecipante;
  aMano: boolean;
  quotaCent: number;
  /** quanto la persona dice di aver dato (per le righe a mano: quanto ha segnato chi organizza) */
  dichiaratoCent: number;
  ricevutoCent: number;
  saldoCent: number;
  /** una sola azione per riga (design.md §8, decisione 7) */
  azione: AzioneRiga;
  /** lo stato in parole, per l'elenco sul telefono */
  stato: string;
}

/**
 * Il registro di chi organizza: quota, dichiarato, ricevuto e saldo per persona (spec §7.5). L'azione della riga è
 * «Segna ricevuto N €» quando la persona ha detto di aver pagato, «Segna un pagamento» per chi è aggiunto a mano. Il
 * «Promemoria» dopo la consegna (D-12) non c'è: serve il servizio email e la notifica nell'account (D-18), che non
 * esistono ancora.
 */
export function registro(c: Colletta, righe: Partecipante[]): RigaRegistro[] {
  const quota = quotaEffettiva(c);
  const fatto = consegnato(c);
  return ordinaRegistro(righeInDivisione(righe)).map((r) => {
    const ricevutoCent = r.stato === "confermato" ? (r.importoCent ?? 0) : 0;
    const dichiaratoCent = r.stato === "dichiarato" ? (r.importoCent ?? quota) : ricevutoCent;
    const saldoCent = Math.max(0, quota - ricevutoCent);
    const aMano = aggiuntaAMano(r);
    let azione: AzioneRiga = null;
    if (saldoCent > 0) {
      if (r.stato === "dichiarato") azione = { tipo: "ricevuto", cent: Math.max(0, dichiaratoCent - ricevutoCent) || saldoCent };
      else if (aMano) azione = { tipo: "pagamento" };
    }
    const stato =
      saldoCent === 0
        ? "Ha pagato, ricevuto"
        : r.stato === "dichiarato"
          ? `Dice di aver pagato ${formattaEuro(dichiaratoCent - ricevutoCent)}`
          : ricevutoCent > 0
            ? `Ricevuto ${formattaEuro(ricevutoCent)}`
            : fatto
              ? "Non ha ancora pagato"
              : "Ha aderito";
    return { riga: r, aMano, quotaCent: quota, dichiaratoCent, ricevutoCent, saldoCent, azione, stato };
  });
}

/** Chi organizza in cima, poi in ordine di arrivo: il registro non salta quando qualcuno paga. */
function ordinaRegistro(righe: Partecipante[]): Partecipante[] {
  return [...righe].sort((a, b) => a.creatoIl - b.creatoIl || a.nome.localeCompare(b.nome, "it"));
}

export interface Totali {
  /** la quota per tutte le persone in divisione: il budget previsto, mai denaro ricevuto */
  budgetCent: number;
  ricevutoCent: number;
  daRicevereCent: number;
}

export function totali(reg: RigaRegistro[]): Totali {
  return {
    budgetCent: reg.reduce((t, r) => t + r.quotaCent, 0),
    ricevutoCent: reg.reduce((t, r) => t + r.ricevutoCent, 0),
    daRicevereCent: reg.reduce((t, r) => t + r.saldoCent, 0),
  };
}

/** «Segna un pagamento»: il nuovo importo ricevuto si somma a quello già segnato. */
export function ricevutoDopoPagamento(r: Partecipante, cent: number): number {
  return (r.stato === "confermato" ? (r.importoCent ?? 0) : 0) + cent;
}

/**
 * «Regalo consegnato» (spec §7.6): chiude le adesioni e ferma la quota (in «divisa», il prezzo diviso fra chi ha davvero
 * aderito); l'acquisto prende il prezzo del regalo, se c'è. Durante il voto non si consegna: prima si sceglie il regalo.
 */
export function consegna(c: Colletta, ora: number): Partial<Colletta> {
  if (c.stato !== "aperta") throw new ErroreDominio("Il gruppo non è aperto.");
  if (votazioneInCorso(c)) throw new ErroreDominio("Prima si chiude la votazione.");
  if (consegnato(c)) return {};
  const speseCent = regaloDaScegliere(c.prodotto) ? null : c.prodotto.prezzoCent;
  return {
    consegnatoIl: ora,
    listaAperta: false,
    quotaCongelata: true,
    quotaCent: quotaAllaChiusuraAdesioni(c),
    acquisto: c.acquisto ?? { fatto: true, speseCent, ricevutaUrl: null, destinazioneAvanzo: null },
    aggiornatoIl: ora,
  };
}

/**
 * «Metti ai voti più regali» dalla pagina del gruppo partito dalle adesioni (G-01): la votazione si apre subito e finisce,
 * come nel wizard (design.md §10.1, decisione 6), fra quattro giorni alle 20:00, ma non dopo la data limite delle
 * adesioni e non prima di un'ora da adesso. Il regalo resta un segnaposto finché la votazione non si chiude.
 */
export function aperturaVoto(c: Colletta, candidati: ProdottoColletta[], ora: number): Partial<Colletta> {
  if (c.stato !== "aperta" || votazioneInCorso(c) || consegnato(c)) throw new ErroreDominio("Il voto si apre solo prima di scegliere il regalo.");
  if (candidati.length < MIN_PROPOSTE_INIZIALI) throw new ErroreDominio("Scegli almeno due regali da votare.");
  const proposta = istanteRoma(aggiungiGiorni(giornoRoma(ora), 4), 20);
  const limite = c.scadenza > ora ? Math.min(proposta, c.scadenza) : proposta;
  const scade = Math.max(ora + ORE, limite);
  return {
    prodotto: prodottoSegnaposto(candidati),
    votazione: { ...votazioneIniziale(Math.round((scade - ora) / ORE), true), apertaIl: ora, scade },
    aggiornatoIl: ora,
  };
}

// ---------- «I miei regali» ----------

export type TonoStato = "aperto" | "caldo" | "neutro";

export interface StatoRegalo {
  testo: string;
  tono: TonoStato;
}

/**
 * Lo stato di un regalo nell'elenco dell'account (design.md §10.2): per chi organizza «3 su 10 hanno aderito» o, dopo la
 * consegna, «2 quote da ricevere»; per chi partecipa «Quota da pagare», «In attesa della conferma di Marco»; per tutti
 * «Votazione aperta» e «Saldato».
 */
export function statoRegalo(c: Colletta, righe: Partecipante[], uid: string): StatoRegalo {
  if (votazioneInCorso(c) && c.stato === "aperta") return { testo: "Votazione aperta", tono: "aperto" };
  const organizzo = c.organizzatoreUid === uid;
  if (organizzo) {
    if (!gruppoConcluso(c)) return { testo: `${iscritti(righe)} su ${c.previsti} hanno aderito`, tono: "aperto" };
    const mancano = registro(c, righe).filter((r) => r.saldoCent > 0).length;
    if (mancano === 0) return { testo: "Saldato", tono: "neutro" };
    return { testo: mancano === 1 ? "1 quota da ricevere" : `${mancano} quote da ricevere`, tono: "caldo" };
  }
  const mia = righe.find((r) => r.uidAnonimo === uid) ?? null;
  const quota = quotaEffettiva(c);
  const ricevuto = mia?.stato === "confermato" ? (mia.importoCent ?? 0) : 0;
  if (!mia || mia.stato === "rinunciato") return { testo: "Le adesioni sono chiuse", tono: "neutro" };
  if (ricevuto >= quota) return { testo: "Saldato", tono: "neutro" };
  if (mia.stato === "dichiarato") return { testo: `In attesa della conferma di ${c.organizzatoreNome}`, tono: "neutro" };
  return { testo: "Quota da pagare", tono: "caldo" };
}
