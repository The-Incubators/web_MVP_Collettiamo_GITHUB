// Lo stato della procedura «Organizza un regalo di gruppo» (Gifty UX v2, design.md §10.1, prototipi/crea.html; spec
// prodotto §7.1–7.2) e le sue conversioni da e verso la colletta. Logica pura: nessun DOM, nessun accesso ai dati.
//
// I passi: 1 per chi è, 2 quante persone ci sono nella chat, 3 da dove vuoi iniziare (prima le adesioni, ho scelto il
// regalo, votiamo il regalo), 4 la quota, il regalo o i regali da votare con la fine della votazione, 5 come ti
// rimborsano, 6 riepilogo e accesso. Dal prodotto («Aggiungi a un regalo di gruppo») si saltano 3 e 4. Il passo
// «Condividi» non è un passo dello stato: arriva dopo che il gruppo è creato, con il suo indirizzo (`/crea?creato=…`).

import { aggiungiGiorni, confrontaGiorni, giornoDaIso, giornoInIso, giornoRoma, istanteRoma, type Giorno } from "@/lib/dominio/date";
import { formattaEuro, leggiEuro } from "@/lib/dominio/importi";
import { validaIban } from "@/lib/dominio/iban";
import { estraiHandlePaypal } from "@/lib/dominio/paypal";
import { conRegalo, REGALO_DA_SCEGLIERE } from "@/lib/dominio/regali";
import { MIN_ORE, ORE, prodottoSegnaposto, votazioneIniziale } from "@/lib/dominio/votazione";
import { OCCASIONI_REGALO } from "@/lib/regalo/dati";
import type { Colletta, Metodi, ProdottoColletta } from "@/lib/tipi";

export type Passo = 1 | 2 | 3 | 4 | 5 | 6;
/** «adesioni»: prima le adesioni (F-01). «regalo»: ho scelto il regalo (F-02). «voto»: votiamo il regalo (F-03). */
export type Partenza = "adesioni" | "regalo" | "voto";

export const MIN_REGALI_VOTO = 2;
export const MAX_REGALI = 5;
export const MIN_PERSONE = 2;
export const MAX_PERSONE = 200;
export const PERSONE_PREDEFINITE = 10;
export const QUOTA_PREDEFINITA = "10";
export const ORA_PREDEFINITA = "20:00";
/** La votazione finisce, se non si cambia, quattro giorni dopo oggi alle 20:00 (design.md §10.1, decisione 6). */
export const GIORNI_VOTO = 4;

/** Dove la procedura tiene il lavoro fino alla creazione: localStorage, perché il link di accesso può aprire un'altra scheda. */
export const CHIAVE_WIZARD = "gifty.wizard";

export interface StatoWizard {
  versione: 3;
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
  /** arrivato da una tessera con il regalo già scelto: si saltano i passi 3 e 4 */
  daProdotto: boolean;
  /** la quota proposta, come la scrive chi organizza (solo «adesioni») */
  quotaEuro: string;
  /** il regalo scelto (uno), o da 2 a 5 da votare */
  regali: ProdottoColletta[];
  /** quante persone ci sono nella chat */
  chat: number;
  /** «Partecipo anch'io alla divisione» (D-16) */
  partecipo: boolean;
  /** la fine della votazione; vuota finché chi organizza non la cambia (vale quella proposta) */
  fineVotoData: string;
  fineVotoOra: string;
  /** la data e l'ora limite per aderire (D-15); vuota finché non si cambia nel riepilogo (vale quella proposta) */
  limiteData: string;
  limiteOra: string;
  paypalAttivo: boolean;
  paypal: string;
  satispayAttivo: boolean;
  satispay: string;
  bonificoAttivo: boolean;
  iban: string;
  intestatario: string;
  contantiAttivo: boolean;
  sorpresa: boolean;
  /** arrivato da «Cambia» nel riepilogo: «Continua» torna al riepilogo */
  daRiepilogo: boolean;
  /** ha toccato «Accedi con Google» o «Mandami il link»: appena c'è l'account il gruppo si crea */
  creaDopoAccesso: boolean;
}

export type Errori = Partial<Record<string, string>>;

export function statoIniziale(uid: string | null = null): StatoWizard {
  return {
    versione: 3,
    uid,
    passo: 1,
    slug: null,
    festeggiato: "",
    occasione: "compleanno",
    dataRegalo: "",
    partenza: null,
    daProdotto: false,
    quotaEuro: QUOTA_PREDEFINITA,
    regali: [],
    chat: PERSONE_PREDEFINITE,
    partecipo: true,
    fineVotoData: "",
    fineVotoOra: "",
    limiteData: "",
    limiteOra: "",
    paypalAttivo: false,
    paypal: "",
    satispayAttivo: false,
    satispay: "",
    bonificoAttivo: false,
    iban: "",
    intestatario: "",
    contantiAttivo: false,
    sorpresa: false,
    daRiepilogo: false,
    creaDopoAccesso: false,
  };
}

/** Il lavoro salvato, se è di questa versione e di questa persona (o di nessuno: si accede solo al passo 6). */
export function leggiStato(grezzo: string | null, uid: string | null): StatoWizard | null {
  if (!grezzo) return null;
  try {
    const s = JSON.parse(grezzo) as Partial<StatoWizard>;
    if (s.versione !== 3) return null;
    if (s.uid && uid && s.uid !== uid) return null;
    const base = statoIniziale(uid);
    const passo = [1, 2, 3, 4, 5, 6].includes(Number(s.passo)) ? (s.passo as Passo) : 1;
    // I campi aggiunti dopo il salvataggio prendono il valore di partenza.
    return { ...base, ...s, passo, uid: uid ?? s.uid ?? null, regali: Array.isArray(s.regali) ? s.regali.slice(0, MAX_REGALI) : [] };
  } catch {
    return null;
  }
}

/** C'è qualcosa da riprendere: il nome di chi si festeggia (design.md §10.1, decisione 2). */
export const bozzaDaRiprendere = (s: StatoWizard | null): s is StatoWizard => !!s && s.festeggiato.trim().length > 0;

/** L'occasione, se è una delle dieci dell'elenco unico (T-06); le altre si ignorano. */
export function occasioneValida(v: string | null | undefined): string | null {
  return OCCASIONI_REGALO.find((o) => o.id === v)?.id ?? null;
}

// ---------- passi ----------

/** I passi del percorso: dal prodotto si saltano «da dove vuoi iniziare» e la scelta del regalo (§10.1, decisione 9). */
export function sequenza(s: Pick<StatoWizard, "daProdotto">): Passo[] {
  return s.daProdotto ? [1, 2, 5, 6] : [1, 2, 3, 4, 5, 6];
}

/** «Passo 2 di 4»: la posizione nel percorso e il totale. */
export function posizione(s: Pick<StatoWizard, "daProdotto" | "passo">): { n: number; totale: number } {
  const seq = sequenza(s);
  return { n: Math.max(1, seq.indexOf(s.passo) + 1), totale: seq.length };
}

export function passoDopo(s: Pick<StatoWizard, "daProdotto" | "passo">): Passo {
  const seq = sequenza(s);
  return seq[Math.min(seq.length - 1, seq.indexOf(s.passo) + 1)];
}

export function passoPrima(s: Pick<StatoWizard, "daProdotto" | "passo">): Passo | null {
  const seq = sequenza(s);
  const i = seq.indexOf(s.passo);
  return i > 0 ? seq[i - 1] : null;
}

// ---------- regali ----------

export const inVotazione = (s: Pick<StatoWizard, "partenza" | "regali">): boolean => s.partenza === "voto" && s.regali.length >= MIN_REGALI_VOTO;

/** «Scegli questo regalo»: diventa il regalo del gruppo, al posto di quelli scelti prima. */
export function conRegaloScelto(s: StatoWizard, p: ProdottoColletta): StatoWizard {
  return { ...s, partenza: "regalo", regali: [p] };
}

/** «Aggiungi al regalo» (votazione): si aggiunge a quelli già scelti, senza doppioni e fino a cinque. */
export function conRegaloAlVoto(s: StatoWizard, p: ProdottoColletta): StatoWizard {
  const base = s.partenza === "voto" ? s.regali : [];
  const regali = base.length >= MAX_REGALI ? base : conRegalo(base, p);
  return { ...s, partenza: "voto", regali };
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
  if (s.partenza === "regalo" && s.regali.length) return s.regali[0];
  if (s.partenza === "voto" && s.regali.length) return prodottoSegnaposto(s.regali);
  return REGALO_DA_SCEGLIERE;
}

/** Il prezzo diviso fra le persone, al centesimo per eccesso (come `quotaEffettiva` della quota divisa). */
export const divisa = (prezzoCent: number, persone: number) => Math.ceil(prezzoCent / Math.max(1, persone));

/** La quota a testa: quella proposta, oppure il prezzo del regalo diviso. null se non si sa ancora (voto, o campo vuoto). */
export function quotaDaStato(s: StatoWizard): number | null {
  if (s.partenza === "adesioni") return leggiEuro(s.quotaEuro);
  if (s.partenza === "regalo" && s.regali.length === 1) return divisa(s.regali[0].prezzoCent, personeDivisione(s));
  return null;
}

/** «Budget previsto, se aderite in 10»: la quota proposta per le persone della divisione. */
export function budgetPrevisto(s: StatoWizard): number | null {
  const q = s.partenza === "adesioni" ? leggiEuro(s.quotaEuro) : null;
  return q ? q * personeDivisione(s) : null;
}

// ---------- date e ore ----------

/** "20:00" → [20, 0]; null se non è un'ora valida. */
export function leggiOra(testo: string): [number, number] | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(testo.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h <= 23 && min <= 59 ? [h, min] : null;
}

function istanteDa(data: string, ora: string): number | null {
  const giorno = giornoDaIso(data);
  const o = leggiOra(ora);
  return giorno && o ? istanteRoma(giorno, o[0], o[1]) : null;
}

const formatoOra = new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
/** "20:00", a Roma. */
export const oraDi = (ms: number) => formatoOra.format(new Date(ms));

/** Data e ora (campi del modulo) di un istante, a Roma. */
export function campiDi(ms: number): { data: string; ora: string } {
  return { data: giornoInIso(giornoRoma(ms)), ora: oraDi(ms) };
}

const piuTardi = (a: Giorno, b: Giorno) => (confrontaGiorni(a, b) >= 0 ? a : b);

/** La data limite proposta: il giorno prima della festa alle 20:00, mai prima di oggi (§10.1, decisione 7). */
export function limitePredefinito(s: Pick<StatoWizard, "dataRegalo">, adesso: number): { data: string; ora: string } {
  const festa = giornoDaIso(s.dataRegalo);
  if (!festa) return { data: "", ora: ORA_PREDEFINITA };
  return { data: giornoInIso(piuTardi(aggiungiGiorni(festa, -1), giornoRoma(adesso))), ora: ORA_PREDEFINITA };
}

/** La data limite che vale: quella scelta nel riepilogo o quella proposta. */
export function limite(s: Pick<StatoWizard, "dataRegalo" | "limiteData" | "limiteOra">, adesso: number): { data: string; ora: string } {
  return s.limiteData ? { data: s.limiteData, ora: s.limiteOra || ORA_PREDEFINITA } : limitePredefinito(s, adesso);
}

/** L'istante in cui si chiudono le adesioni, a Roma; null se data o ora mancano. */
export function scadenzaDaStato(s: Pick<StatoWizard, "dataRegalo" | "limiteData" | "limiteOra">, adesso: number): number | null {
  const l = limite(s, adesso);
  return istanteDa(l.data, l.ora);
}

/** La fine della votazione proposta: fra quattro giorni alle 20:00, ma non dopo la data limite delle adesioni. */
export function fineVotoPredefinita(s: Pick<StatoWizard, "dataRegalo" | "limiteData" | "limiteOra">, adesso: number): { data: string; ora: string } {
  const proposta = istanteRoma(aggiungiGiorni(giornoRoma(adesso), GIORNI_VOTO), 20);
  const scadenza = scadenzaDaStato(s, adesso);
  return campiDi(scadenza !== null && scadenza < proposta ? scadenza : proposta);
}

/** La fine della votazione che vale: quella scelta o quella proposta. */
export function fineVoto(s: Pick<StatoWizard, "dataRegalo" | "limiteData" | "limiteOra" | "fineVotoData" | "fineVotoOra">, adesso: number): { data: string; ora: string } {
  return s.fineVotoData ? { data: s.fineVotoData, ora: s.fineVotoOra || ORA_PREDEFINITA } : fineVotoPredefinita(s, adesso);
}

export function fineVotoDaStato(s: Pick<StatoWizard, "dataRegalo" | "limiteData" | "limiteOra" | "fineVotoData" | "fineVotoOra">, adesso: number): number | null {
  const f = fineVoto(s, adesso);
  return istanteDa(f.data, f.ora);
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

/** Nessun metodo scelto: si possono proporre quelli dell'ultima volta (§10.1, decisione 11). */
export const senzaMetodi = (s: StatoWizard) => ![s.paypalAttivo, s.satispayAttivo, s.bonificoAttivo, s.contantiAttivo].some(Boolean);

/** I metodi di una colletta di prima, come campi del modulo. */
export function conMetodi(s: StatoWizard, m: Metodi): StatoWizard {
  return {
    ...s,
    paypalAttivo: m.paypal.attivo,
    paypal: m.paypal.valore,
    satispayAttivo: m.satispay.attivo,
    satispay: m.satispay.valore,
    bonificoAttivo: m.bonifico.attivo,
    iban: m.bonifico.valore,
    intestatario: m.bonifico.intestatario,
    contantiAttivo: m.contanti.attivo,
  };
}

/** "PayPal, Satispay, contanti": i metodi scelti, per il riepilogo e il biglietto dell'anteprima. */
export function testoMetodi(s: Pick<StatoWizard, "paypalAttivo" | "satispayAttivo" | "bonificoAttivo" | "contantiAttivo">): string {
  return [s.paypalAttivo ? "PayPal" : null, s.satispayAttivo ? "Satispay" : null, s.bonificoAttivo ? "bonifico" : null, s.contantiAttivo ? "contanti" : null]
    .filter(Boolean)
    .join(", ");
}

// ---------- controlli ----------

export function erroriPasso(s: StatoWizard, passo: Passo, adesso: number): Errori {
  const e: Errori = {};
  if (passo === 1) {
    if (!s.festeggiato.trim()) e.festeggiato = "Scrivi il nome di chi festeggiate";
    const giorno = giornoDaIso(s.dataRegalo);
    if (!giorno) e.dataRegalo = "Scegli la data del regalo";
    else if (confrontaGiorni(giorno, giornoRoma(adesso)) <= 0) e.dataRegalo = "Scegli una data da domani in poi";
  }
  if (passo === 2) {
    if (!Number.isInteger(s.chat) || s.chat < MIN_PERSONE || s.chat > MAX_PERSONE) e.chat = "Servono almeno due persone";
    if (s.daProdotto && s.regali.length !== 1) e.regali = "Scegli il regalo";
  }
  if (passo === 3 && !s.partenza) e.partenza = "Scegli da dove vuoi iniziare";
  if (passo === 4) {
    if (!s.partenza) e.partenza = "Scegli da dove vuoi iniziare";
    if (s.partenza === "adesioni" && !leggiEuro(s.quotaEuro)) e.quotaEuro = "Scrivi l'importo della quota, per esempio 10 o 12,50";
    if (s.partenza === "regalo" && s.regali.length !== 1) e.regali = "Scegli il regalo";
    if (s.partenza === "voto") {
      if (s.regali.length < MIN_REGALI_VOTO) e.regali = "Scegli almeno due regali da votare";
      const fine = fineVotoDaStato(s, adesso);
      const scadenza = scadenzaDaStato(s, adesso);
      if (fine === null) e.fineVoto = "Scegli la data e l'ora";
      else if (fine <= adesso) e.fineVoto = "La fine della votazione è già passata";
      else if (scadenza !== null && fine > scadenza) e.fineVoto = "La votazione deve finire entro la data limite delle adesioni";
    }
  }
  if (passo === 5) {
    if (senzaMetodi(s)) e.metodi = "Scegli almeno un modo per farti rimborsare";
    if (s.paypalAttivo && !estraiHandlePaypal(s.paypal)) e.paypal = "Scrivi il tuo nome utente PayPal o il link paypal.me";
    if (s.satispayAttivo && !validaTelefono(s.satispay)) e.satispay = "Scrivi il numero di telefono collegato a Satispay";
    if (s.bonificoAttivo) {
      const iban = validaIban(s.iban);
      if (!iban.valido) e.iban = iban.motivo;
      if (!s.intestatario.trim()) e.intestatario = "Scrivi l'intestatario del conto";
    }
  }
  if (passo === 6) {
    const scadenza = scadenzaDaStato(s, adesso);
    if (scadenza === null) e.limite = "Scegli la data e l'ora";
    else if (scadenza <= adesso) e.limite = "La data limite è già passata";
  }
  return e;
}

/** Il primo passo del percorso con un errore: serve prima di creare il gruppo. */
export function primoPassoConErrori(s: StatoWizard, adesso: number): Passo | null {
  for (const p of sequenza(s)) if (Object.keys(erroriPasso(s, p, adesso)).length) return p;
  return null;
}

// ---------- colletta ----------

const durataOre = (scade: number, da: number) => Math.max(MIN_ORE, Math.round((scade - da) / ORE));

/** I campi della colletta che la procedura decide. */
export function campiDaStato(
  s: StatoWizard,
  organizzatoreNome: string,
  adesso: number,
): Omit<Colletta, "slug" | "organizzatoreUid" | "stato" | "totaleConfermatoCent" | "nConfermati" | "nAttesi" | "nAderenti" | "acquisto" | "quotaCongelata" | "creatoIl" | "aggiornatoIl"> {
  const giorno = giornoDaIso(s.dataRegalo) ?? aggiungiGiorni(giornoRoma(adesso), 1);
  const prodotto = prodottoPerColletta(s);
  const persone = personeDivisione(s);
  const adesioni = s.partenza !== "regalo" && s.partenza !== "voto";
  const fine = fineVotoDaStato(s, adesso);
  return {
    organizzatoreNome: organizzatoreNome.trim(),
    festeggiato: s.festeggiato.trim(),
    occasione: s.occasione,
    dataRegalo: istanteRoma(giorno, 12),
    scadenza: scadenzaDaStato(s, adesso) ?? istanteRoma(giorno, 12),
    sorpresa: s.sorpresa,
    prodotto,
    // Prima le adesioni: una quota fissa proposta. Con il regalo: il prezzo diviso fra le persone (D-07, §7.5).
    modoQuota: adesioni ? "fissa" : "divisa",
    quotaCent: adesioni ? (leggiEuro(s.quotaEuro) ?? 0) : divisa(prodotto.prezzoCent, persone),
    previsti: persone,
    metodi: metodiDaStato(s),
    listaAperta: true,
    votazione: inVotazione(s) ? votazioneIniziale(fine === null ? MIN_ORE : durataOre(fine, adesso), true) : null,
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

/** Il patch che apre la raccolta e, se c'è, il voto fino alla data e all'ora scelte (G-09, §10.1 decisione 6). */
export function aperturaDaStato(s: StatoWizard, ora: number): Partial<Colletta> {
  if (!inVotazione(s)) return { stato: "aperta" };
  const scade = fineVotoDaStato(s, ora) ?? ora + MIN_ORE * ORE;
  return { stato: "aperta", votazione: { ...votazioneIniziale(durataOre(scade, ora), true), apertaIl: ora, scade } };
}

/** Una bozza del vecchio wizard, riaperta con `/crea?bozza=…`. */
export function statoDaColletta(c: Colletta, uid: string, candidati: ProdottoColletta[] = []): StatoWizard {
  const adesioni = !c.votazione && c.prodotto.prezzoCent === 0;
  const scadenza = campiDi(c.scadenza);
  const partenza: Partenza = adesioni ? "adesioni" : c.votazione ? "voto" : "regalo";
  return conMetodi(
    {
      ...statoIniziale(uid),
      slug: c.slug,
      festeggiato: c.festeggiato,
      occasione: occasioneValida(c.occasione) ?? "altro",
      dataRegalo: giornoInIso(giornoRoma(c.dataRegalo)),
      partenza,
      quotaEuro: adesioni && c.quotaCent ? String(c.quotaCent / 100).replace(".", ",") : QUOTA_PREDEFINITA,
      regali: adesioni ? [] : c.votazione ? candidati.slice(0, MAX_REGALI) : [c.prodotto],
      chat: Math.min(MAX_PERSONE, Math.max(MIN_PERSONE, c.previsti)),
      limiteData: scadenza.data,
      limiteOra: scadenza.ora,
      sorpresa: c.sorpresa,
    },
    c.metodi,
  );
}

/** La quota per il biglietto dell'anteprima: "10 € a testa", o null se non si sa ancora. */
export function testoQuota(s: StatoWizard): string | null {
  const q = quotaDaStato(s);
  return q ? `${formattaEuro(q)} a testa` : null;
}
