// Lo stato del wizard di creazione e le sue conversioni da e verso la colletta.

import { aggiungiGiorni, giornoDaIso, giornoInIso, giornoRoma, istanteRoma } from "@/lib/dominio/date";
import { leggiEuro } from "@/lib/dominio/importi";
import { validaIban } from "@/lib/dominio/iban";
import { estraiHandlePaypal } from "@/lib/dominio/paypal";
import { quotaProposta } from "@/lib/dominio/quota";
import { calcolaScadenza } from "@/lib/dominio/scadenza";
import { MAX_ORE, MIN_ORE, ORE, MIN_PROPOSTE_INIZIALI, prodottoSegnaposto, votazioneIniziale } from "@/lib/dominio/votazione";
import type { Categoria, Colletta, Metodi, ModoQuota, ProdottoColletta } from "@/lib/tipi";

export type Passo = 1 | 2 | 3 | 4 | 5 | 6;

export interface StatoWizard {
  /** uid di chi ha iniziato: se cambia, il lavoro salvato non è suo */
  uid: string;
  passo: Passo;
  slug: string | null;
  prodotto: ProdottoColletta | null;
  organizzatoreNome: string;
  festeggiato: string;
  occasione: string;
  dataRegalo: string;
  sorpresa: boolean;
  modoQuota: ModoQuota;
  quotaEuro: string;
  quotaManuale: boolean;
  previsti: number;
  paypalAttivo: boolean;
  paypal: string;
  satispayAttivo: boolean;
  satispay: string;
  bonificoAttivo: boolean;
  iban: string;
  intestatario: string;
  contantiAttivo: boolean;
  listaAperta: boolean;
  nomiLista: string;
  /** i nomi per cui esistono già righe "invitato", per non duplicarle tornando indietro */
  nomiCreati: string[];
  /** il regalo lo sceglie il gruppo con un voto */
  votazioneAttiva: boolean;
  votazioneOre: number;
  consentiProposte: boolean;
  candidati: ProdottoColletta[];
  /** i candidati già scritti come proposte nella bozza (chiave JSON), per non rifarli a ogni passo */
  candidatiSalvati: string;
}

export const CHIAVE_WIZARD = "colletta.wizard";

export function statoIniziale(uid: string, nome: string): StatoWizard {
  return {
    uid,
    passo: 1,
    slug: null,
    prodotto: null,
    organizzatoreNome: nome,
    festeggiato: "",
    occasione: "compleanno",
    dataRegalo: "",
    sorpresa: true,
    modoQuota: "fissa",
    quotaEuro: "",
    quotaManuale: false,
    previsti: 10,
    paypalAttivo: false,
    paypal: "",
    satispayAttivo: false,
    satispay: "",
    bonificoAttivo: false,
    iban: "",
    intestatario: "",
    contantiAttivo: false,
    listaAperta: true,
    nomiLista: "",
    nomiCreati: [],
    votazioneAttiva: false,
    votazioneOre: 24,
    consentiProposte: true,
    candidati: [],
    candidatiSalvati: "",
  };
}

/** Il regalo "provvisorio" mentre si vota: prezzo medio e consegna massima dei candidati. */
export function prodottoDaStato(s: StatoWizard): ProdottoColletta | null {
  if (!s.votazioneAttiva) return s.prodotto;
  return s.candidati.length ? prodottoSegnaposto(s.candidati) : null;
}

export function candidatiChiave(candidati: ProdottoColletta[]): string {
  return JSON.stringify(candidati);
}

export function nomiDaLista(testo: string): string[] {
  return testo
    .split("\n")
    .map((r) => r.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

/** La data del regalo suggerita: la prima possibile, più una settimana. */
export function dataSuggerita(consegnaGiorni: number, adesso: number): string {
  const prima = calcolaScadenza(giornoRoma(adesso), consegnaGiorni, adesso).primaDataPossibile;
  return giornoInIso(aggiungiGiorni(prima, 7));
}

export function domaniIso(adesso: number): string {
  return giornoInIso(aggiungiGiorni(giornoRoma(adesso), 1));
}

export function quotaDaStato(s: StatoWizard): number {
  const prezzo = prodottoDaStato(s)?.prezzoCent ?? 0;
  if (s.votazioneAttiva && s.modoQuota === "fissa") return quotaProposta(prezzo, s.previsti);
  if (s.modoQuota === "divisa") return Math.ceil(prezzo / Math.max(1, s.previsti));
  if (s.modoQuota === "fissa") return leggiEuro(s.quotaEuro) ?? quotaProposta(prezzo, s.previsti);
  return quotaProposta(prezzo, s.previsti);
}

export function metodiDaStato(s: StatoWizard): Metodi {
  return {
    paypal: { attivo: s.paypalAttivo, valore: s.paypal.trim() },
    satispay: { attivo: s.satispayAttivo, valore: s.satispay.trim() },
    bonifico: {
      attivo: s.bonificoAttivo,
      valore: s.bonificoAttivo ? (validaIban(s.iban).valido ? s.iban.replace(/\s+/g, "").toUpperCase() : s.iban.trim()) : s.iban.trim(),
      intestatario: s.intestatario.trim(),
    },
    contanti: { attivo: s.contantiAttivo },
  };
}

/** I campi della colletta che il wizard governa; si riscrivono a ogni passo. */
export function campiDaStato(s: StatoWizard, adesso: number): Partial<Colletta> {
  const giorno = giornoDaIso(s.dataRegalo);
  const prodotto = prodottoDaStato(s);
  const consegna = prodotto?.consegnaGiorni ?? 3;
  return {
    organizzatoreNome: s.organizzatoreNome.trim(),
    festeggiato: s.festeggiato.trim(),
    occasione: s.occasione,
    ...(giorno
      ? { dataRegalo: istanteRoma(giorno, 12), scadenza: calcolaScadenza(giorno, consegna, adesso).scadenza }
      : {}),
    sorpresa: s.sorpresa,
    ...(prodotto ? { prodotto } : {}),
    modoQuota: s.modoQuota,
    quotaCent: quotaDaStato(s),
    previsti: s.previsti,
    metodi: metodiDaStato(s),
    listaAperta: s.listaAperta,
    votazione: s.votazioneAttiva ? votazioneIniziale(s.votazioneOre, s.consentiProposte) : null,
  };
}

export function nuovaColletta(s: StatoWizard, slug: string, adesso: number): Colletta {
  const giorno = giornoDaIso(s.dataRegalo) ?? giornoRoma(adesso);
  const prodotto = prodottoDaStato(s) as ProdottoColletta;
  return {
    slug,
    organizzatoreUid: s.uid,
    organizzatoreNome: s.organizzatoreNome.trim(),
    festeggiato: s.festeggiato.trim(),
    occasione: s.occasione,
    dataRegalo: istanteRoma(giorno, 12),
    scadenza: calcolaScadenza(giorno, prodotto.consegnaGiorni, adesso).scadenza,
    sorpresa: s.sorpresa,
    prodotto,
    modoQuota: s.modoQuota,
    quotaCent: quotaDaStato(s),
    quotaCongelata: false,
    previsti: s.previsti,
    metodi: metodiDaStato(s),
    listaAperta: s.listaAperta,
    stato: "bozza",
    totaleConfermatoCent: 0,
    nConfermati: 0,
    nAttesi: 0,
    nAderenti: 0,
    acquisto: null,
    votazione: s.votazioneAttiva ? votazioneIniziale(s.votazioneOre, s.consentiProposte) : null,
    creatoIl: adesso,
    aggiornatoIl: adesso,
  };
}

export function statoDaColletta(c: Colletta, uid: string, candidati: ProdottoColletta[] = []): StatoWizard {
  const b = c.metodi.bonifico;
  return {
    ...statoIniziale(uid, c.organizzatoreNome),
    slug: c.slug,
    prodotto: c.votazione ? null : c.prodotto,
    votazioneAttiva: !!c.votazione,
    votazioneOre: c.votazione?.durataOre ?? 24,
    consentiProposte: c.votazione?.consentiProposte ?? true,
    candidati,
    candidatiSalvati: c.votazione ? candidatiChiave(candidati) : "",
    festeggiato: c.festeggiato,
    occasione: c.occasione,
    dataRegalo: giornoInIso(giornoRoma(c.dataRegalo)),
    sorpresa: c.sorpresa,
    modoQuota: c.modoQuota,
    quotaEuro: c.modoQuota === "fissa" ? String(c.quotaCent / 100).replace(".", ",") : "",
    quotaManuale: c.modoQuota === "fissa",
    previsti: c.previsti,
    paypalAttivo: c.metodi.paypal.attivo,
    paypal: c.metodi.paypal.valore,
    satispayAttivo: c.metodi.satispay.attivo,
    satispay: c.metodi.satispay.valore,
    bonificoAttivo: b.attivo,
    iban: b.valore,
    intestatario: b.intestatario,
    contantiAttivo: c.metodi.contanti.attivo,
    listaAperta: c.listaAperta,
  };
}

export type Errori = Record<string, string>;

export function validaTelefono(testo: string): boolean {
  const cifre = testo.replace(/[\s.-]/g, "").replace(/^\+/, "");
  return /^\d{8,15}$/.test(cifre);
}

export function erroriPasso(s: StatoWizard, passo: Passo, adesso: number): Errori {
  const e: Errori = {};
  if (passo === 1) {
    if (s.votazioneAttiva) {
      if (s.candidati.length < MIN_PROPOSTE_INIZIALI) e.prodotto = `Servono almeno ${MIN_PROPOSTE_INIZIALI} regali da far votare: aggiungili alla lista.`;
      if (!Number.isInteger(s.votazioneOre) || s.votazioneOre < MIN_ORE || s.votazioneOre > MAX_ORE) e.ore = `La votazione dura da ${MIN_ORE} a ${MAX_ORE} ore.`;
    } else if (!s.prodotto) {
      e.prodotto = "Scegli un regalo dal catalogo o inserisci i dati a mano.";
    }
  }
  if (passo === 2) {
    if (!s.festeggiato.trim()) e.festeggiato = "Scrivi per chi è il regalo.";
    if (!s.organizzatoreNome.trim()) e.organizzatoreNome = "Scrivi il tuo nome: lo vedranno i partecipanti.";
    const giorno = giornoDaIso(s.dataRegalo);
    if (!giorno) e.dataRegalo = "Scegli la data del regalo.";
    else {
      const esito = calcolaScadenza(giorno, prodottoDaStato(s)?.consegnaGiorni ?? 3, adesso);
      if (!esito.compatibile) e.dataRegalo = "Con questa data non c'è il tempo per la consegna.";
      else if (s.votazioneAttiva && adesso + s.votazioneOre * ORE >= esito.scadenza) {
        e.dataRegalo = "Con questa data la votazione finirebbe dopo la scadenza della raccolta: accorcia la votazione o sposta la data.";
      }
    }
  }
  if (passo === 3) {
    if (s.previsti < 2) e.previsti = "Servono almeno due persone.";
    if (!s.votazioneAttiva && s.modoQuota === "fissa" && !leggiEuro(s.quotaEuro)) e.quotaEuro = "Scrivi l'importo della quota, per esempio 10 o 12,50.";
  }
  if (passo === 4) {
    const attivi = [s.paypalAttivo, s.satispayAttivo, s.bonificoAttivo, s.contantiAttivo].some(Boolean);
    if (!attivi) e.metodi = "Attiva almeno un modo per farti pagare.";
    if (s.paypalAttivo && !estraiHandlePaypal(s.paypal)) e.paypal = "Scrivi il tuo nome utente PayPal o il link paypal.me.";
    if (s.satispayAttivo && !validaTelefono(s.satispay)) e.satispay = "Scrivi il numero di telefono collegato a Satispay.";
    if (s.bonificoAttivo) {
      const iban = validaIban(s.iban);
      if (!iban.valido) e.iban = iban.motivo;
      if (!s.intestatario.trim()) e.intestatario = "Scrivi l'intestatario del conto.";
    }
  }
  if (passo === 5) {
    if (!s.listaAperta && nomiDaLista(s.nomiLista).length === 0) e.nomiLista = "Scrivi almeno un nome, uno per riga.";
  }
  return e;
}

export function categoriaPerRegalo(c: string): Categoria {
  return (["audio", "casa", "cucina", "benessere", "esperienze", "viaggio", "gioco", "ufficio"] as const).find((x) => x === c) ?? "esperienze";
}
