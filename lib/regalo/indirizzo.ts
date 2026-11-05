// Le risposte di «Trova il regalo» nell'indirizzo: /regalo?per=donna&eta=adulto&occasione=compleanno&passo=4 e
// /regalo/risultati?per=donna&eta=adulto&occasione=compleanno&macro=casa&interessi=casa-luci. Così i risultati si aprono dal
// server, si condividono, e i chip «Cambia» riportano alla domanda con le risposte già date. Funzioni pure.

import { CATEGORIE_INTERESSI, FASCE_ETA_DOMANDA, INTERESSI } from "./dati";
import { primaTappaIncompleta, ripulisci, TAPPA_RISULTATI, type StatoRicerca } from "./stato";

type Parametri = URLSearchParams | Record<string, string | string[] | undefined>;

function leggi(p: Parametri, k: string): string | undefined {
  if (p instanceof URLSearchParams) return p.get(k) ?? undefined;
  const v = p[k];
  return typeof v === "string" ? v : undefined;
}

const lista = (v: string | undefined) => (v ? v.split(",").filter(Boolean) : []);

/**
 * Lo stato letto dall'indirizzo e ripulito (valori sconosciuti ignorati). `passo` diventa la tappa se è raggiungibile,
 * altrimenti si va alla prima domanda senza risposta.
 */
export function statoDaParametri(p: Parametri): StatoRicerca {
  const passo = Number(leggi(p, "passo"));
  return ripulisci({
    genere: leggi(p, "per"),
    eta: leggi(p, "eta"),
    occasione: leggi(p, "occasione"),
    macro: lista(leggi(p, "macro")),
    interessi: lista(leggi(p, "interessi")),
    tappa: Number.isInteger(passo) && passo > 0 ? passo : 99,
  });
}

/** Le risposte complete? Solo allora si mostrano i risultati. */
export const risposteComplete = (s: StatoRicerca): boolean => primaTappaIncompleta(s) === TAPPA_RISULTATI;

/** La query delle risposte date, nell'ordine per, età, occasione, macro, interessi (più `passo` se serve). */
export function parametriDaStato(s: StatoRicerca, passo?: number): string {
  const q = new URLSearchParams();
  if (s.genere) q.set("per", s.genere);
  if (s.eta) q.set("eta", s.eta);
  if (s.occasione) q.set("occasione", s.occasione);
  if (s.macro.length) q.set("macro", s.macro.join(","));
  if (s.interessi.length) q.set("interessi", s.interessi.join(","));
  if (passo) q.set("passo", String(passo));
  return q.toString().replace(/%2C/g, ",");
}

export const hrefDomande = (s: StatoRicerca, passo: 2 | 3 | 4): string => `/regalo?${parametriDaStato(s, passo)}`;
export const hrefRisultati = (s: StatoRicerca): string => `/regalo/risultati?${parametriDaStato(s)}`;

const lui = (genere: string | null) => genere === "uomo";

/** «Da 18 a 29 anni»: l'etichetta della fascia d'età scelta (vuota se non c'è). */
export const etichettaEta = (eta: string | null): string => FASCE_ETA_DOMANDA.find((f) => f.id === eta)?.etichetta ?? "";

/** «Per lei» / «Per lui». */
export const etichettaPer = (genere: string | null): string => (lui(genere) ? "Per lui" : "Per lei");
/** «Idee per lei» / «Idee per lui». */
export const titoloRisultati = (genere: string | null): string => (lui(genere) ? "Idee per lui" : "Idee per lei");
/** «Che cosa le piace?» / «Che cosa gli piace?». */
export const domandaInteressi = (genere: string | null): string => (lui(genere) ? "Che cosa gli piace?" : "Che cosa le piace?");

const minuscola = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

/** Un chip per ogni passione scelta: «Casa e design» oppure «Casa e design: lampade e luci d’atmosfera». */
export function testiInteressi(s: StatoRicerca): string[] {
  return s.macro.map((id) => {
    const nome = CATEGORIE_INTERESSI.find((c) => c.id === id)?.etichetta ?? id;
    const micro = INTERESSI.filter((x) => x.categoria === id && s.interessi.includes(x.id)).map((x) => minuscola(x.etichetta));
    return micro.length ? `${nome}: ${micro.join(", ")}` : nome;
  });
}
