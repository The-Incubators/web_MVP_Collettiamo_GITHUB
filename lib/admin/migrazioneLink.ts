// Migrazione dei link ai prodotti Amazon.it verso il link affiliato. Logica pura: legge e scrive da un `Archivio`
// (Firestore con l'Admin SDK in lib/admin/archivioLinkAdmin.ts), così si prova senza toccare i dati veri.
//
// Che cosa si tocca: il campo `urlEsterno` dei prodotti del catalogo (/prodotti) e le sue copie dentro le collette e
// le proposte che nascono da un prodotto del catalogo (`prodottoId` non nullo). I link incollati a mano da chi
// organizza (`prodottoId` nullo) e ogni altro dato non si toccano: si contano soltanto.

import { affiliaLink, TAG_AFFILIATO_AMAZON, type EsitoLink } from "../dominio/amazon";

export type Ambito = "catalogo" | "colletta" | "proposta";

export interface VoceLink {
  /** percorso del documento, es. "prodotti/lampada-da-tavolo" */
  percorso: string;
  /** campo da modificare: "urlEsterno" oppure "prodotto.urlEsterno" */
  campo: string;
  attuale: string | null;
  asin: string | null;
  ambito: Ambito;
  /** false per i regali scelti da un link incollato a mano: non si modificano */
  daCatalogo: boolean;
}

export interface Archivio {
  leggi(): Promise<VoceLink[]>;
  /** scrive solo quel campo di quel documento */
  scrivi(percorso: string, campo: string, valore: string): Promise<void>;
}

export type StatoDecisione = EsitoLink["stato"] | "non-pertinente";

export interface Decisione {
  percorso: string;
  campo: string;
  ambito: Ambito;
  prima: string | null;
  dopo: string | null;
  stato: StatoDecisione;
  motivo?: string;
}

export interface Piano {
  decisioni: Decisione[];
  riepilogo: Record<StatoDecisione, number>;
}

const STATI: StatoDecisione[] = ["convertito", "creato", "invariato", "ignorato", "malformato", "mancante", "non-pertinente"];

export function pianifica(voci: VoceLink[], tag = TAG_AFFILIATO_AMAZON): Piano {
  const decisioni: Decisione[] = voci.map((v) => {
    if (!v.daCatalogo) {
      return { percorso: v.percorso, campo: v.campo, ambito: v.ambito, prima: v.attuale, dopo: null, stato: "non-pertinente", motivo: "link scelto a mano, non del catalogo" };
    }
    const e = affiliaLink(v.attuale, v.asin, tag);
    const dopo = "url" in e && (e.stato === "convertito" || e.stato === "creato") ? e.url : null;
    return {
      percorso: v.percorso,
      campo: v.campo,
      ambito: v.ambito,
      prima: v.attuale,
      dopo,
      stato: e.stato,
      ...("motivo" in e ? { motivo: e.motivo } : {}),
    };
  });
  const riepilogo = Object.fromEntries(STATI.map((s) => [s, 0])) as Record<StatoDecisione, number>;
  for (const d of decisioni) riepilogo[d.stato]++;
  return { decisioni, riepilogo };
}

/** Le decisioni che portano davvero una modifica. */
export function daScrivere(piano: Piano): Decisione[] {
  return piano.decisioni.filter((d) => (d.stato === "convertito" || d.stato === "creato") && d.dopo !== null);
}

export interface Backup {
  creatoIl: string;
  tag: string;
  /** i valori prima e dopo, di ogni campo che si sta per modificare */
  voci: { percorso: string; campo: string; prima: string | null; dopo: string }[];
}

export function creaBackup(piano: Piano, adesso = new Date(), tag = TAG_AFFILIATO_AMAZON): Backup {
  return {
    creatoIl: adesso.toISOString(),
    tag,
    voci: daScrivere(piano).map((d) => ({ percorso: d.percorso, campo: d.campo, prima: d.prima, dopo: d.dopo as string })),
  };
}

export async function eseguiPiano(archivio: Archivio, piano: Piano): Promise<{ scritti: number }> {
  let scritti = 0;
  for (const d of daScrivere(piano)) {
    await archivio.scrivi(d.percorso, d.campo, d.dopo as string);
    scritti++;
  }
  return { scritti };
}

/**
 * Rimette i valori originali. Un campo si ripristina solo se vale ancora ciò che la migrazione ci aveva scritto:
 * se nel frattempo è stato cambiato da altri, non si tocca.
 */
export async function ripristina(archivio: Archivio, backup: Backup): Promise<{ ripristinati: number; saltati: number }> {
  const attuali = new Map((await archivio.leggi()).map((v) => [`${v.percorso}#${v.campo}`, v.attuale]));
  let ripristinati = 0;
  let saltati = 0;
  for (const v of backup.voci) {
    if (attuali.get(`${v.percorso}#${v.campo}`) !== v.dopo) {
      saltati++;
      continue;
    }
    await archivio.scrivi(v.percorso, v.campo, v.prima ?? "");
    ripristinati++;
  }
  return { ripristinati, saltati };
}
