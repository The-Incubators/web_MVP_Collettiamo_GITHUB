import {
  aggiungiGiorni,
  confrontaGiorni,
  giornoRoma,
  istanteRoma,
  type Giorno,
} from "./date";

export const ORA_SCADENZA = 20;

export interface EsitoScadenza {
  /** momento della scadenza (20:00 italiane del giorno calcolato) */
  scadenza: number;
  giornoScadenza: Giorno;
  /** false se la scadenza cade oggi o nel passato */
  compatibile: boolean;
  /** prima data del regalo che lascia tempo alla consegna: oggi + consegna + 2 */
  primaDataPossibile: Giorno;
}

/** scadenza = dataRegalo − (consegnaGiorni + 1 giorno di margine), alle 20:00 italiane. */
export function calcolaScadenza(
  dataRegalo: Giorno,
  consegnaGiorni: number,
  adesso: number = Date.now(),
): EsitoScadenza {
  const giornoScadenza = aggiungiGiorni(dataRegalo, -(consegnaGiorni + 1));
  const oggi = giornoRoma(adesso);
  return {
    scadenza: istanteRoma(giornoScadenza, 20),
    giornoScadenza,
    compatibile: confrontaGiorni(giornoScadenza, oggi) > 0,
    primaDataPossibile: aggiungiGiorni(oggi, consegnaGiorni + 2),
  };
}

/** Sposta la scadenza di un numero di giorni, sempre alle 20:00 italiane. */
export function spostaScadenza(scadenza: number, giorni: number): number {
  return istanteRoma(aggiungiGiorni(giornoRoma(scadenza), giorni), ORA_SCADENZA);
}
