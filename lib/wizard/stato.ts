// Lo stato del wizard «Organizza un regalo di gruppo» (Gifty UX v2, prototipi/crea.html; spec prodotto §7.1–7.2) e le
// sue conversioni da e verso la colletta. Logica pura: nessun DOM, nessun accesso ai dati.
//
// I passi: 1 per chi è, 2 da dove vuoi iniziare, 3 quota proposta (prima le adesioni) o regali (uno, o da 2 a 5 da
// votare), 4 persone nella chat e data limite, 5 come ti rimborsano, 6 accesso. Il passo 7 (condividi) non è un passo
// dello stato: arriva dopo che il gruppo è creato, con il suo indirizzo (`/crea?creato=…`).

import { aggiungiGiorni, confrontaGiorni, giornoDaIso, giornoInIso, giornoRoma, istanteRoma } from "@/lib/dominio/date";
import { formattaEuro, leggiEuro } from "@/lib/dominio/importi";
import { validaIban } from "@/lib/dominio/iban";
import { estraiHandlePaypal } from "@/lib/dominio/paypal";
import { conRegalo, REGALO_DA_SCEGLIERE } from "@/lib/dominio/regali";
import { calcolaScadenza } from "@/lib/dominio/scadenza";
import { MIN_ORE, ORE, prodottoSegnaposto, votazioneIniziale } from "@/lib/dominio/votazione";
import { OCCASIONI_REGALO } from "@/lib/regalo/dati";
import type { Colletta, Metodi, ProdottoColletta } from "@/lib/tipi";

export type Passo = 1 | 2 | 3 | 4 | 5 | 6;
/** «adesioni»: prima raccolgo le adesioni (F-01). «regalo»: ho scelto il regalo, uno o più da votare (F-02, F-03). */
export type Partenza = "adesioni" | "regalo";

export const TOTALE_PASSI = 6;
export const MAX_REGALI = 5;
export const MIN_PERSONE = 2;
export const MAX_PERSONE = 200;
export const PERSONE_PREDEFINITE = 10;
export const ORA_LIMITE_PREDEFINITA = "20:00";
/** La votazione dura un giorno, o meno se la data limite delle adesioni arriva prima. */
export const ORE_VOTAZIONE = 24;

/** Dove il wizard tiene il lavoro fino alla creazione: localStorage, perché il link di accesso può aprire un'altra scheda. */
export const CHIAVE_WIZARD = "gifty.wizard";

export interface StatoWizard {
  versione: 2;
  /** chi ha iniziato, se aveva già un account; null finché non accede (passo 6) */
  uid: string | null;
  passo: Passo;
  /** una bozza già salvata (vecchio wizard): alla fine si aggiorna invece di crearne un'altra */
  slug: string | null;
  festeggiato: string;
  occasione: string;
  /** AAAA-MM-GG */
  dataRegalo: string;
  partenza: Partenza | null;
  /** la quota proposta, come la scrive chi organizza (solo «adesioni») */
  quotaEuro: string;
  /** un regalo, o da 2 a 5 da votare (solo «regalo») */
  regali: ProdottoColletta[];
  /** quante persone ci sono nella chat */
  chat: number;
  /** «Partecipi anche tu alla divisione?» (D-16) */
  partecipo: boolean;
  /** la data e l'ora limite per aderire (D-15) */
  limiteData: string;
  limiteOra: string;
  /** false finché chi organizza non tocca la data limite: fino ad allora segue la data del regalo */
  limiteToccato: boolean;
  paypalAttivo: boolean;
  paypal: string;
  satispayAttivo: boolean;
  satispay: string;
  bonificoAttivo: boolean;
  iban: string;
  intestatario: string;
  contantiAttivo: boolean;
  sorpresa: boolean;
}

export type Errori = Partial<Record<string, string>>;

export function statoIniziale(uid: string | null = null): StatoWizard {
  return {
    versione: 2,
    uid,
    passo: 1,
    slug: null,
    festeggiato: "",
    occasione: "compleanno",
    dataRegalo: "",
    partenza: null,
    quotaEuro: "",
    regali: [],
    chat: PERSONE_PREDEFINITE,
    partecipo: true,
    limiteData: "",
    limiteOra: ORA_LIMITE_PREDEFINITA,
    limiteToccato: false,
    paypalAttivo: false,
    paypal: "",
    satispayAttivo: false,
    satispay: "",
    bonificoAttivo: false,
    iban: "",
    intestatario: "",
    contantiAttivo: false,
    sorpresa: false,
  };
}

/** Il lavoro salvato, se è di questa versione e di questa persona (o di nessuno: si accede solo al passo 6). */
export function leggiStato(grezzo: string | null, uid: string | null): StatoWizard | null {
  if (!grezzo) return null;
  try {
    const s = JSON.parse(grezzo) as Partial<StatoWizard>;
    if (s.versione !== 2) return null;
    if (s.uid && uid && s.uid !== uid) return null;
    const base = statoIniziale(uid);
    // I campi aggiunti dopo il salvataggio prendono il valore di partenza.
    return { ...base, ...s, uid: uid ?? s.uid ?? null, regali: Array.isArray(s.regali) ? s.regali.slice(0, MAX_REGALI) : [] };
  } catch {
    return null;
  }
}

/** L'occasione, se è una delle dieci dell'elenco unico (T-06); le altre si ignorano. */
export function occasioneValida(v: string | null | undefined): string | null {
  return OCCASIONI_REGALO.find((o) => o.id === v)?.id ?? null;
}

// ---------- regali ----------

export const inVotazione = (s: Pick<StatoWizard, "partenza" | "regali">): boolean => s.partenza === "regalo" && s.regali.length >= 2;

/** «Scegli questo regalo»: diventa il regalo del gruppo, al posto di quelli scelti prima. */
export function conRegaloScelto(s: StatoWizard, p: ProdottoColletta): StatoWizard {
  return { ...s, partenza: "regalo", regali: [p] };
}

/** «Aggiungi al voto»: si aggiunge a quelli già scelti, senza doppioni e fino a cinque. */
export function conRegaloAlVoto(s: StatoWizard, p: ProdottoColletta): StatoWizard {
  const base = s.partenza === "regalo" ? s.regali : [];
  const regali = base.length >= MAX_REGALI ? base : conRegalo(base, p);
  return { ...s, partenza: "regalo", regali };
}

export function senzaRegalo(s: StatoWizard, indice: number): StatoWizard {
  return { ...s, regali: s.regali.filter((_, i) => i !== indice) };
}

// ---------- quote e persone ----------

/** Fra quante persone si divide: quelle della chat, meno chi organizza se non partecipa. */
export function personeDivisione(s: Pick<StatoWizard, "chat" | "partecipo">): number {
  return Math.max(1, Math.floor(s.chat) - (s.partecipo ? 0 : 1));
}

/** Il regalo che va nella colletta: quello scelto, il segnaposto del voto o il regalo ancora da scegliere. */
export function prodottoPerColletta(s: Pick<StatoWizard, "partenza" | "regali">): ProdottoColletta {
  if (s.partenza !== "regalo" || s.regali.length === 0) return REGALO_DA_SCEGLIERE;
  return s.regali.length === 1 ? s.regali[0] : prodottoSegnaposto(s.regali);
}

/** Il prezzo diviso fra le persone, al centesimo per eccesso (come `quotaEffettiva` della quota divisa). */
export const divisa = (prezzoCent: number, persone: number) => Math.ceil(prezzoCent / Math.max(1, persone));

/** La quota a testa: quella proposta, oppure il prezzo del regalo diviso. null se non si sa ancora (voto, o campo vuoto). */
export function quotaDaStato(s: StatoWizard): number | null {
  if (s.partenza === "adesioni") return leggiEuro(s.quotaEuro);
  if (s.partenza === "regalo" && s.regali.length === 1) return divisa(s.regali[0].prezzoCent, personeDivisione(s));
  return null;
}

/** Durante il voto: la quota più bassa e la più alta, secondo il regalo che vince. */
export function intervalloQuote(s: StatoWizard): [number, number] | null {
  if (!inVotazione(s)) return null;
  const q = s.regali.map((r) => divisa(r.prezzoCent, personeDivisione(s)));
  return [Math.min(...q), Math.max(...q)];
}

// ---------- data limite ----------

/** La data limite proposta: quella della raccolta di sempre (data del regalo meno consegna e un giorno), mai prima di oggi. */
export function limitePredefinito(s: Pick<StatoWizard, "dataRegalo" | "partenza" | "regali">, adesso: number): string {
  const giorno = giornoDaIso(s.dataRegalo);
  if (!giorno) return "";
  const consegna = s.partenza === "regalo" && s.regali.length ? s.regali.reduce((m, r) => Math.max(m, r.consegnaGiorni), 1) : 1;
  const proposto = calcolaScadenza(giorno, consegna, adesso).giornoScadenza;
  const oggi = giornoRoma(adesso);
  return giornoInIso(confrontaGiorni(proposto, oggi) < 0 ? oggi : proposto);
}

/** "20:00" → [20, 0]; null se non è un'ora valida. */
export function leggiOra(testo: string): [number, number] | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(testo.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h <= 23 && min <= 59 ? [h, min] : null;
}

/** L'istante in cui si chiudono le adesioni, a Roma; null se data o ora mancano. */
export function scadenzaDaStato(s: Pick<StatoWizard, "limiteData" | "limiteOra">): number | null {
  const giorno = giornoDaIso(s.limiteData);
  const ora = leggiOra(s.limiteOra);
  return giorno && ora ? istanteRoma(giorno, ora[0], ora[1]) : null;
}

/** Le ore del voto: un giorno, o fino alla data limite se arriva prima (mai sotto un'ora). */
export function oreVotazione(s: StatoWizard, adesso: number): number {
  const scadenza = scadenzaDaStato(s);
  if (scadenza === null) return ORE_VOTAZIONE;
  return Math.max(MIN_ORE, Math.min(ORE_VOTAZIONE, Math.floor((scadenza - adesso) / ORE)));
}

// ---------- rimborsi ----------

export function validaTelefono(testo: string): boolean {
  const cifre = testo.replace(/[\s.-]/g, "").replace(/^\+/, "");
  return /^\d{8,15}$/.test(cifre);
}

export function metodiDaStato(s: StatoWizard): Metodi {
  return {
    paypal: { attivo: s.paypalAttivo, valore: s.paypal.trim() },
    satispay: { attivo: s.satispayAttivo, valore: s.satispay.trim() },
    bonifico: {
      attivo: s.bonificoAttivo,
      valore: s.bonificoAttivo && validaIban(s.iban).valido ? s.iban.replace(/\s+/g, "").toUpperCase() : s.iban.trim(),
      intestatario: s.intestatario.trim(),
    },
    contanti: { attivo: s.contantiAttivo },
  };
}

/** "PayPal, Satispay, contanti": i metodi scelti, per il biglietto dell'anteprima. */
export function testoMetodi(s: StatoWizard): string {
  return [
    s.paypalAttivo ? "PayPal" : null,
    s.satispayAttivo ? "Satispay" : null,
    s.bonificoAttivo ? "bonifico" : null,
    s.contantiAttivo ? "contanti" : null,
  ]
    .filter(Boolean)
    .join(", ");
}

// ---------- controlli ----------

export function erroriPasso(s: StatoWizard, passo: Passo, adesso: number): Errori {
  const e: Errori = {};
  if (passo === 1) {
    if (!s.festeggiato.trim()) e.festeggiato = "Scrivi il nome di chi festeggiamo";
    const giorno = giornoDaIso(s.dataRegalo);
    if (!giorno) e.dataRegalo = "Scegli la data del regalo";
    else if (confrontaGiorni(giorno, giornoRoma(adesso)) <= 0) e.dataRegalo = "Scegli una data da domani in poi";
  }
  if (passo === 2 && !s.partenza) e.partenza = "Scegli da dove vuoi iniziare";
  if (passo === 3) {
    if (s.partenza === "adesioni" && !leggiEuro(s.quotaEuro)) e.quotaEuro = "Scrivi l'importo della quota, per esempio 10 o 12,50";
    if (s.partenza === "regalo" && s.regali.length === 0) e.regali = "Scegli il regalo";
  }
  if (passo === 4) {
    if (!Number.isInteger(s.chat) || s.chat < MIN_PERSONE || s.chat > MAX_PERSONE) e.chat = "Servono almeno due persone";
    const scadenza = scadenzaDaStato(s);
    if (scadenza === null) e.limite = "Scegli la data e l'ora";
    else if (scadenza - adesso < (inVotazione(s) ? MIN_ORE * ORE : 0)) e.limite = "La data limite è già passata";
  }
  if (passo === 5) {
    if (![s.paypalAttivo, s.satispayAttivo, s.bonificoAttivo, s.contantiAttivo].some(Boolean)) e.metodi = "Scegli almeno un modo per farti rimborsare";
    if (s.paypalAttivo && !estraiHandlePaypal(s.paypal)) e.paypal = "Scrivi il tuo nome utente PayPal o il link paypal.me";
    if (s.satispayAttivo && !validaTelefono(s.satispay)) e.satispay = "Scrivi il numero di telefono collegato a Satispay";
    if (s.bonificoAttivo) {
      const iban = validaIban(s.iban);
      if (!iban.valido) e.iban = iban.motivo;
      if (!s.intestatario.trim()) e.intestatario = "Scrivi l'intestatario del conto";
    }
  }
  return e;
}

/** Il primo passo con un errore, fino a `finoA` compreso: serve prima di creare il gruppo. */
export function primoPassoConErrori(s: StatoWizard, finoA: Passo, adesso: number): Passo | null {
  for (let p = 1 as Passo; p <= finoA; p = (p + 1) as Passo) if (Object.keys(erroriPasso(s, p, adesso)).length) return p;
  return null;
}

// ---------- colletta ----------

/** I campi della colletta che il wizard decide. */
export function campiDaStato(s: StatoWizard, organizzatoreNome: string, adesso: number): Omit<Colletta, "slug" | "organizzatoreUid" | "stato" | "totaleConfermatoCent" | "nConfermati" | "nAttesi" | "nAderenti" | "acquisto" | "quotaCongelata" | "creatoIl" | "aggiornatoIl"> {
  const giorno = giornoDaIso(s.dataRegalo) ?? aggiungiGiorni(giornoRoma(adesso), 1);
  const prodotto = prodottoPerColletta(s);
  const persone = personeDivisione(s);
  const adesioni = s.partenza !== "regalo";
  return {
    organizzatoreNome: organizzatoreNome.trim(),
    festeggiato: s.festeggiato.trim(),
    occasione: s.occasione,
    dataRegalo: istanteRoma(giorno, 12),
    scadenza: scadenzaDaStato(s) ?? istanteRoma(giorno, 12),
    sorpresa: s.sorpresa,
    prodotto,
    // Prima le adesioni: una quota fissa proposta. Con il regalo: il prezzo diviso fra le persone (D-07, §7.5).
    modoQuota: adesioni ? "fissa" : "divisa",
    quotaCent: adesioni ? (leggiEuro(s.quotaEuro) ?? 0) : divisa(prodotto.prezzoCent, persone),
    previsti: persone,
    metodi: metodiDaStato(s),
    listaAperta: true,
    votazione: inVotazione(s) ? votazioneIniziale(oreVotazione(s, adesso), true) : null,
  };
}

export function nuovaColletta(s: StatoWizard, k: { slug: string; uid: string; organizzatoreNome: string; adesso: number }): Colletta {
  return {
    slug: k.slug,
    organizzatoreUid: k.uid,
    ...campiDaStato(s, k.organizzatoreNome, k.adesso),
    quotaCongelata: false,
    stato: "bozza",
    totaleConfermatoCent: 0,
    nConfermati: 0,
    nAttesi: 0,
    nAderenti: 0,
    acquisto: null,
    creatoIl: k.adesso,
    aggiornatoIl: k.adesso,
  };
}

/** Il patch che apre la raccolta (e il voto, se c'è): il gruppo è creato prima del passo «condividi» (G-09). */
export function aperturaDaStato(s: StatoWizard, ora: number): Partial<Colletta> {
  if (!inVotazione(s)) return { stato: "aperta" };
  const durataOre = oreVotazione(s, ora);
  return { stato: "aperta", votazione: { ...votazioneIniziale(durataOre, true), apertaIl: ora, scade: ora + durataOre * ORE } };
}

/** Una bozza del vecchio wizard, riaperta con `/crea?bozza=…`. */
export function statoDaColletta(c: Colletta, uid: string, candidati: ProdottoColletta[] = []): StatoWizard {
  const b = c.metodi.bonifico;
  const adesioni = !c.votazione && c.prodotto.prezzoCent === 0;
  const scadenza = giornoRoma(c.scadenza);
  const ora = new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(c.scadenza));
  return {
    ...statoIniziale(uid),
    slug: c.slug,
    festeggiato: c.festeggiato,
    occasione: occasioneValida(c.occasione) ?? "altro",
    dataRegalo: giornoInIso(giornoRoma(c.dataRegalo)),
    partenza: adesioni ? "adesioni" : "regalo",
    quotaEuro: adesioni && c.quotaCent ? String(c.quotaCent / 100).replace(".", ",") : "",
    regali: adesioni ? [] : c.votazione ? candidati.slice(0, MAX_REGALI) : [c.prodotto],
    chat: Math.min(MAX_PERSONE, Math.max(MIN_PERSONE, c.previsti)),
    limiteData: giornoInIso(scadenza),
    limiteOra: ora,
    limiteToccato: true,
    paypalAttivo: c.metodi.paypal.attivo,
    paypal: c.metodi.paypal.valore,
    satispayAttivo: c.metodi.satispay.attivo,
    satispay: c.metodi.satispay.valore,
    bonificoAttivo: b.attivo,
    iban: b.valore,
    intestatario: b.intestatario,
    contantiAttivo: c.metodi.contanti.attivo,
    sorpresa: c.sorpresa,
  };
}

/** La quota per il biglietto dell'anteprima e per il messaggio: "10 € a testa", o null se non si sa ancora. */
export function testoQuota(s: StatoWizard): string | null {
  const q = quotaDaStato(s);
  return q ? `${formattaEuro(q)} a testa` : null;
}
