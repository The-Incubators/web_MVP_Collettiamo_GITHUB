// Le righe delle pagine dell'account (Gifty UX v2, design.md §10.2; prototipi/regali.html, biglietti.html).

import type { Biglietto, Colletta, Partecipante } from "../tipi";
import { etichettaOccasione } from "../regalo/dati";
import { nomeOccasione, stileCartaDi } from "./bacheca";
import { dataBreve, giornoDaIso, giornoRoma, istanteRoma } from "./date";
import { gruppoConcluso, statoRegalo, type StatoRegalo } from "./gruppo";

const MESI = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];

export interface VoceRegalo {
  slug: string;
  href: string;
  giorno: number;
  mese: string;
  titolo: string;
  supporto: string;
  stato: StatoRegalo;
  concluso: boolean;
}

/** «Il regalo per Mauro», «Compleanno, organizzato da Cri» (il nome anche per chi legge è Cri: decisione 5). */
export function voceRegalo(c: Colletta, righe: Partecipante[], uid: string): VoceRegalo {
  const g = giornoRoma(c.dataRegalo);
  const occasione = c.occasione === "altro" ? "" : etichettaOccasione(c.occasione);
  const chi = c.organizzatoreNome.trim() ? `organizzato da ${c.organizzatoreNome.trim()}` : "";
  const supporto = [occasione, chi].filter(Boolean).join(", ");
  return {
    slug: c.slug,
    href: c.organizzatoreUid === uid ? `/gestisci/${c.slug}` : `/c/${c.slug}`,
    giorno: g.g,
    mese: MESI[g.m - 1] ?? "",
    titolo: `Il regalo per ${c.festeggiato}`,
    supporto: supporto.charAt(0).toUpperCase() + supporto.slice(1),
    stato: statoRegalo(c, righe, uid),
    concluso: gruppoConcluso(c),
  };
}

export interface VoceBiglietto {
  id: string;
  href: string;
  iniziale: string;
  /** la classe della carta (tema-menta, tema-pesca…), vuota per l'avorio */
  tema: string;
  titolo: string;
  supporto: string;
  stato: StatoRegalo;
}

const firme = (n: number) => `${n} ${n === 1 ? "firma" : "firme"}`;

/**
 * Una riga di «I miei biglietti». Creati: «Compleanno il 28 novembre, 4 firme» o «Del regalo di gruppo, 7 firme», stato
 * «Da mandare» o «Mandato a Giulia». Firmati: «Laurea, creato da Marco», stato «Non ancora mandato» o «Mandato a Paolo».
 */
export function voceBiglietto(b: Pick<Biglietto, "id" | "slug" | "festeggiato" | "occasione" | "stato" | "nFirme" | "dataEvento" | "collettaSlug" | "organizzatoreNome" | "copertina">, creato: boolean): VoceBiglietto {
  const consegnato = b.stato === "consegnato";
  const occasione = nomeOccasione(b.occasione);
  let supporto: string;
  if (creato) {
    const giorno = b.dataEvento ? giornoDaIso(b.dataEvento) : null;
    const quando = giorno ? ` il ${dataBreve(istanteRoma(giorno, 12))}` : "";
    supporto = b.collettaSlug ? `Del regalo di gruppo, ${firme(b.nFirme)}` : `${occasione}${quando}, ${firme(b.nFirme)}`;
  } else {
    supporto = [occasione, b.organizzatoreNome?.trim() ? `creato da ${b.organizzatoreNome.trim()}` : ""].filter(Boolean).join(", ");
  }
  const stato: StatoRegalo = consegnato
    ? { testo: `Mandato a ${b.festeggiato}`, tono: "neutro" }
    : creato
      ? { testo: "Da mandare", tono: "aperto" }
      : { testo: "Non ancora mandato", tono: "neutro" };
  return {
    id: b.id,
    href: creato ? `/biglietto/${b.id}/gestisci` : `/b/${b.slug}`,
    iniziale: (b.festeggiato.trim()[0] ?? "?").toUpperCase(),
    tema: stileCartaDi(b.copertina?.modelloId)?.classe ?? "",
    titolo: `Il biglietto per ${b.festeggiato || "…"}`,
    supporto,
    stato,
  };
}
