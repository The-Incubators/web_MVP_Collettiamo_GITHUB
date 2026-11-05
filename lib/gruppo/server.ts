// Letture del server per le pagine del regalo di gruppo: il catalogo del foglio e il biglietto collegato al gruppo.

import type { VoceCatalogo } from "@/components/wizard/tipi";
import { archivioBiglietti } from "../biglietti";
import { datiServer } from "../dati";
import { temiDelProdotto } from "../dominio/catalogoIdee";

/** Il catalogo per il foglio «Scegli il regalo» / «Metti ai voti più regali», nell'ordine curato. */
export async function catalogoFoglio(): Promise<VoceCatalogo[]> {
  const prodotti = await datiServer()
    .elencaProdotti()
    .catch(() => []);
  return prodotti.map((p) => ({
    slug: p.slug,
    prodottoId: p.slug,
    nome: p.nome,
    prezzoCent: p.prezzoCent,
    consegnaGiorni: p.consegnaGiorni,
    urlEsterno: p.urlEsterno,
    immagine: p.immagine,
    temi: temiDelProdotto(p),
  }));
}

/** Il biglietto del regalo di gruppo (spec §7.7), senza nulla di privato: id, slug, stato e firme. */
export async function bigliettoDelGruppo(slug: string): Promise<{ id: string; slug: string; stato: string; nFirme: number } | null> {
  const b = await archivioBiglietti()
    .perColletta(slug)
    .catch(() => null);
  return b ? { id: b.id, slug: b.slug, stato: b.stato, nFirme: b.nFirme } : null;
}
