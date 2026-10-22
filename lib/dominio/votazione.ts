// Il voto del regalo: proposte con 1-5 stelle, una chiusura a tempo e un vincitore deterministico.

import { aggiungiGiorni, giornoRoma, istanteRoma } from "./date";
import { quotaProposta } from "./quota";
import { calcolaScadenza, ORA_SCADENZA } from "./scadenza";
import type { Colletta, Proposta, ProdottoColletta, Votazione, Voto } from "../tipi";

export const ORE = 3_600_000;
export const MIN_ORE = 1;
export const MAX_ORE = 336; // due settimane
export const MAX_PROPOSTE_PER_PERSONA = 3;
export const MIN_PROPOSTE_INIZIALI = 2;
export const NOME_SEGNAPOSTO = "Regalo da scegliere con il voto";

export function votazioneInCorso(c: Pick<Colletta, "votazione">): boolean {
  return !!c.votazione && !c.votazione.chiusa;
}

export function votazioneScaduta(c: Pick<Colletta, "votazione">, ora: number): boolean {
  const v = c.votazione;
  return !!v && !v.chiusa && v.scade !== null && ora >= v.scade;
}

/** Il segnaposto che sta al posto del regalo finché si vota: prezzo medio e consegna massima fra i candidati. */
export function prodottoSegnaposto(candidati: ProdottoColletta[]): ProdottoColletta {
  const n = Math.max(1, candidati.length);
  return {
    prodottoId: null,
    nome: NOME_SEGNAPOSTO,
    prezzoCent: Math.round(candidati.reduce((t, p) => t + p.prezzoCent, 0) / n),
    consegnaGiorni: candidati.reduce((m, p) => Math.max(m, p.consegnaGiorni), 1),
    urlEsterno: "",
    immagine: { seme: "voto", icona: "esperienze" },
  };
}

export function votazioneIniziale(durataOre: number, consentiProposte: boolean): Votazione {
  return { durataOre, consentiProposte, apertaIl: null, scade: null, chiusa: false, chiusaIl: null, propostaVincenteId: null };
}

export interface Classifica {
  proposta: Proposta;
  /** media delle stelle, 0 se nessuno ha votato */
  media: number;
  nVoti: number;
}

/** Ordina per media, poi per numero di voti, poi per ordine di inserimento (così il risultato è sempre lo stesso). */
export function classifica(proposte: Proposta[], voti: Voto[]): Classifica[] {
  const ids = new Set(proposte.map((p) => p.id));
  const somme = new Map<string, { tot: number; n: number }>();
  for (const v of voti) {
    if (!ids.has(v.propostaId) || v.stelle < 1 || v.stelle > 5) continue;
    const s = somme.get(v.propostaId) ?? { tot: 0, n: 0 };
    s.tot += v.stelle;
    s.n += 1;
    somme.set(v.propostaId, s);
  }
  return proposte
    .map((proposta) => {
      const s = somme.get(proposta.id);
      return { proposta, media: s ? s.tot / s.n : 0, nVoti: s?.n ?? 0 };
    })
    .sort(
      (a, b) =>
        b.media - a.media ||
        b.nVoti - a.nVoti ||
        a.proposta.creatoIl - b.proposta.creatoIl ||
        a.proposta.id.localeCompare(b.proposta.id),
    );
}

export function mediaInTesto(media: number): string {
  return media.toFixed(1).replace(".", ",");
}

/**
 * Chiude la votazione: il regalo più votato diventa l'oggetto della colletta. Ricalcola quota e scadenza
 * sul prezzo e sui tempi di consegna del vincitore. Senza nessun voto vince la prima proposta inserita.
 * Ritorna null se non c'è nulla da chiudere.
 */
export function chiusuraVotazione(c: Colletta, proposte: Proposta[], voti: Voto[], ora: number): Partial<Colletta> | null {
  if (!c.votazione || c.votazione.chiusa || proposte.length === 0) return null;
  const vincitrice = classifica(proposte, voti)[0].proposta;
  const prodotto = vincitrice.prodotto;

  const quotaCent = c.modoQuota === "divisa" ? Math.ceil(prodotto.prezzoCent / Math.max(1, c.previsti)) : quotaProposta(prodotto.prezzoCent, c.previsti);

  // La raccolta si chiude `consegna + 1` giorni prima della data del regalo; se per il vincitore non resta tempo, si dà un giorno.
  const giornoRegalo = giornoRoma(c.dataRegalo);
  const esito = calcolaScadenza(giornoRegalo, prodotto.consegnaGiorni, ora);
  const scadenza = esito.compatibile ? esito.scadenza : istanteRoma(aggiungiGiorni(giornoRoma(ora), 1), ORA_SCADENZA);

  return {
    prodotto,
    quotaCent,
    scadenza,
    votazione: { ...c.votazione, chiusa: true, chiusaIl: ora, propostaVincenteId: vincitrice.id },
    aggiornatoIl: ora,
  };
}

export function testoTempoRimasto(scade: number, ora: number): string {
  const ms = scade - ora;
  if (ms <= 0) return "La votazione è chiusa";
  const min = Math.ceil(ms / 60_000);
  if (min < 60) return `Si chiude fra ${min} ${min === 1 ? "minuto" : "minuti"}`;
  const ore = Math.floor(min / 60);
  if (ore < 48) return `Si chiude fra ${ore} ${ore === 1 ? "ora" : "ore"}${min % 60 ? ` e ${min % 60} min` : ""}`;
  return `Si chiude fra ${Math.floor(ore / 24)} giorni`;
}

export function idVoto(uid: string, propostaId: string): string {
  return `${uid}__${propostaId}`;
}

/** Quante proposte ha già inserito questa persona. */
export function proposteDi(proposte: Proposta[], uid: string): number {
  return proposte.filter((p) => p.autoreUid === uid && !p.daOrganizzatore).length;
}
