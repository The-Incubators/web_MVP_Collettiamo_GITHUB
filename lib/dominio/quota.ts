import type { Colletta, ModoQuota } from "../tipi";

type DatiQuota = Pick<Colletta, "modoQuota" | "quotaCent" | "quotaCongelata" | "previsti" | "nAderenti"> & {
  prodotto: Pick<Colletta["prodotto"], "prezzoCent">;
};

/** Proposta iniziale: ceil(prezzo / previsti), arrotondata all'euro (per eccesso). */
export function quotaProposta(prezzoCent: number, previsti: number): number {
  const persone = Math.max(1, Math.floor(previsti));
  return Math.ceil(prezzoCent / persone / 100) * 100;
}

/**
 * La quota che chi partecipa vede adesso.
 * - fissa: quotaCent, non cambia mai.
 * - libera: quotaCent è solo il suggerimento.
 * - divisa: prezzo / max(aderenti, previsti), al centesimo per eccesso, finché non è congelata.
 *   Il divisore non scende sotto i "previsti" perché il primo che aderisce non deve vedere il prezzo intero.
 */
export function quotaEffettiva(c: DatiQuota): number {
  if (c.modoQuota === "divisa" && !c.quotaCongelata) {
    const divisore = Math.max(c.nAderenti, c.previsti, 1);
    return Math.ceil(c.prodotto.prezzoCent / divisore);
  }
  return c.quotaCent;
}

/** Quota con cui si congela chiudendo le adesioni: in "divisa" è il prezzo diviso chi ha davvero aderito. */
export function quotaAllaChiusuraAdesioni(c: DatiQuota): number {
  if (c.modoQuota === "divisa" && !c.quotaCongelata) {
    return Math.ceil(c.prodotto.prezzoCent / Math.max(c.nAderenti, 1));
  }
  return c.quotaCent;
}

export interface Prospetto {
  quotaCent: number;
  totalePrevistoCent: number;
  /** positivo = avanzo, negativo = ammanco */
  differenzaCent: number;
}

/** Il riquadro del passo 3 del wizard. */
export function prospetto(input: {
  modoQuota: ModoQuota;
  prezzoCent: number;
  previsti: number;
  quotaFissaCent: number | null;
}): Prospetto {
  const previsti = Math.max(1, Math.floor(input.previsti));
  let quotaCent: number;
  if (input.modoQuota === "fissa") {
    quotaCent = input.quotaFissaCent ?? quotaProposta(input.prezzoCent, previsti);
  } else if (input.modoQuota === "divisa") {
    quotaCent = Math.ceil(input.prezzoCent / previsti);
  } else {
    quotaCent = quotaProposta(input.prezzoCent, previsti);
  }
  const totalePrevistoCent = quotaCent * previsti;
  return { quotaCent, totalePrevistoCent, differenzaCent: totalePrevistoCent - input.prezzoCent };
}

export interface Chiusura {
  /** positivo = avanzo, negativo = a carico di chi organizza */
  avanzoCent: number;
  restituzioneACapoCent: number;
}

/** Avanzo = totale confermato − spesa reale. La restituzione si divide in parti uguali, per difetto. */
export function calcolaChiusura(totaleConfermatoCent: number, speseCent: number, nConfermati: number): Chiusura {
  const avanzoCent = totaleConfermatoCent - speseCent;
  const restituzioneACapoCent = avanzoCent > 0 && nConfermati > 0 ? Math.floor(avanzoCent / nConfermati) : 0;
  return { avanzoCent, restituzioneACapoCent };
}

/** Quante quote mancano per arrivare al prezzo, alla quota data. */
export function quoteMancanti(prezzoCent: number, totaleConfermatoCent: number, quotaCent: number): number {
  const mancante = Math.max(0, prezzoCent - totaleConfermatoCent);
  return quotaCent > 0 ? Math.ceil(mancante / quotaCent) : 0;
}
