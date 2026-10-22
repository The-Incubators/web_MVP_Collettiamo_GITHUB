// Il catalogo: 180 prodotti reali di Amazon.it importati dalle cartelle catalogo_amazon_*/
// (vedi scripts/importa_catalogo.py, che genera catalogo-amazon.json e copia le foto in public/foto-prodotti/).
// Prezzi rilevati il 14, il 15 e il 16 ottobre 2026: cambiano nel tempo.

import type { Categoria, Prodotto } from "../tipi";
import { affiliaLink } from "../dominio/amazon";
import voci from "./catalogo-amazon.json";

interface Voce {
  id: string;
  slug: string;
  nome: string;
  marca: string;
  prezzoCent: number;
  descrizione: string;
  perche: string;
  destinatari: string[];
  temi: string[];
  asin: string;
  urlEsterno: string;
  foto: string;
  rilevatoIl: string;
  sottocategoria?: string;
}

/** Il file non dà i tempi di consegna: serve una stima per calcolare la scadenza della raccolta. */
export const CONSEGNA_STIMATA_GIORNI = 3;

/** Solo per l'illustrazione di ripiego (se manca la foto): un'icona vicina al tema. */
function iconaPerTemi(temi: string[]): Categoria {
  if (temi.includes("tecnologia")) return "audio";
  if (temi.includes("viaggio")) return "viaggio";
  return "casa";
}

/**
 * Il link del prodotto è sempre quello affiliato (tag di Stefano). Il file sorgente conserva il link pulito di Amazon;
 * qualunque prodotto aggiunto in futuro passa da qui. Un link che non si riesce a convertire non entra nel catalogo.
 */
function linkAffiliato(v: Voce): string {
  const esito = affiliaLink(v.urlEsterno, v.asin);
  if (esito.stato === "convertito" || esito.stato === "invariato" || esito.stato === "creato") return esito.url;
  throw new Error(`${v.id}: link non convertibile (${esito.stato}): ${v.urlEsterno}`);
}

export const CATALOGO: Prodotto[] = (voci as Voce[]).map((v) => ({
  slug: v.slug,
  id: v.id,
  nome: v.nome,
  marca: v.marca,
  prezzoCent: v.prezzoCent,
  categoria: iconaPerTemi(v.temi),
  occasioni: [],
  descrizione: v.descrizione,
  perche: v.perche,
  destinatari: v.destinatari,
  temi: v.temi,
  asin: v.asin,
  rilevatoIl: v.rilevatoIl,
  ...(v.sottocategoria ? { sottocategoria: v.sottocategoria } : {}),
  consegnaGiorni: CONSEGNA_STIMATA_GIORNI,
  urlEsterno: linkAffiliato(v),
  immagine: { seme: v.id, icona: iconaPerTemi(v.temi), foto: v.foto },
  attivo: true,
}));
