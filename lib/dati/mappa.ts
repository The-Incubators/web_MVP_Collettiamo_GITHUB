// Conversione fra documenti Firestore e tipi applicativi (Timestamp ⇄ millisecondi).
// Vale per entrambi gli SDK (client e Admin): i Timestamp sono riconosciuti da `toMillis`.

import type { Colletta, Evento, Partecipante, Proposta, Prodotto, Voto, Votazione } from "../tipi";

type ConToMillis = { toMillis(): number };

export function aMs(v: unknown): number {
  if (v && typeof (v as ConToMillis).toMillis === "function") return (v as ConToMillis).toMillis();
  return typeof v === "number" ? v : 0;
}

function aMsOpz(v: unknown): number | null {
  return v == null ? null : aMs(v);
}

type Dati = Record<string, unknown>;

const CAMPI_ISTANTE_COLLETTA = ["dataRegalo", "scadenza", "creatoIl", "aggiornatoIl"] as const;
const CAMPI_ISTANTE_PARTECIPANTE = ["creatoIl", "dichiaratoIl", "confermatoIl"] as const;

export function collettaDaDoc(d: Dati): Colletta {
  const c = { ...d } as unknown as Colletta;
  for (const k of CAMPI_ISTANTE_COLLETTA) (c as unknown as Dati)[k] = aMs(d[k]);
  c.nAderenti = typeof d.nAderenti === "number" ? d.nAderenti : 0;
  c.acquisto = (d.acquisto as Colletta["acquisto"]) ?? null;
  c.votazione = votazioneDaDoc(d.votazione);
  return c;
}

function votazioneDaDoc(v: unknown): Votazione | null {
  if (!v || typeof v !== "object") return null;
  const d = v as Dati;
  return {
    durataOre: Number(d.durataOre ?? 0),
    consentiProposte: d.consentiProposte !== false,
    apertaIl: aMsOpz(d.apertaIl),
    scade: aMsOpz(d.scade),
    chiusa: d.chiusa === true,
    chiusaIl: aMsOpz(d.chiusaIl),
    propostaVincenteId: (d.propostaVincenteId as string | null) ?? null,
  };
}

function votazioneInDoc(v: Votazione, ts: (ms: number) => unknown): Dati {
  const t = (x: number | null) => (x === null ? null : ts(x));
  return { ...v, apertaIl: t(v.apertaIl), scade: t(v.scade), chiusaIl: t(v.chiusaIl) };
}

export function propostaDaDoc(id: string, d: Dati): Proposta {
  return {
    id,
    prodotto: d.prodotto as Proposta["prodotto"],
    daOrganizzatore: d.daOrganizzatore === true,
    autoreUid: String(d.autoreUid ?? ""),
    autoreNome: String(d.autoreNome ?? ""),
    creatoIl: aMs(d.creatoIl),
  };
}

export function docDaProposta(p: Omit<Proposta, "id">, ts: (ms: number) => unknown): Dati {
  return { prodotto: p.prodotto, daOrganizzatore: p.daOrganizzatore, autoreUid: p.autoreUid, autoreNome: p.autoreNome, creatoIl: ts(p.creatoIl) };
}

export function votoDaDoc(id: string, d: Dati): Voto {
  return { id, propostaId: String(d.propostaId ?? ""), uid: String(d.uid ?? ""), stelle: Number(d.stelle ?? 0), ts: aMs(d.ts) };
}

export function partecipanteDaDoc(id: string, d: Dati): Partecipante {
  const p = { ...d, id } as unknown as Partecipante;
  p.creatoIl = aMs(d.creatoIl);
  p.dichiaratoIl = aMsOpz(d.dichiaratoIl);
  p.confermatoIl = aMsOpz(d.confermatoIl);
  p.nota = (d.nota as string | null) ?? null;
  p.solleciti = typeof d.solleciti === "number" ? d.solleciti : 0;
  return p;
}

export function eventoDaDoc(id: string, d: Dati): Evento {
  return {
    id,
    tipo: d.tipo as Evento["tipo"],
    uidAnonimo: (d.uidAnonimo as string | null) ?? null,
    partecipanteId: (d.partecipanteId as string | null) ?? null,
    meta: (d.meta as Evento["meta"]) ?? {},
    ts: aMs(d.ts),
  };
}

export function prodottoDaDoc(slug: string, d: Dati): Prodotto {
  return { ...(d as unknown as Prodotto), slug };
}

function senzaUndefined(d: Dati): Dati {
  return Object.fromEntries(Object.entries(d).filter(([, v]) => v !== undefined));
}

/** Tipi applicativi → documento. `ts` costruisce un Timestamp dello SDK in uso. */
export function docDaColletta(c: Partial<Colletta>, ts: (ms: number) => unknown): Dati {
  const out: Dati = { ...c };
  for (const k of CAMPI_ISTANTE_COLLETTA) if (typeof out[k] === "number") out[k] = ts(out[k] as number);
  if (c.votazione) out.votazione = votazioneInDoc(c.votazione, ts);
  return senzaUndefined(out);
}

export function docDaPartecipante(p: Partecipante, ts: (ms: number) => unknown): Dati {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...resto } = p;
  const out: Dati = { ...resto };
  for (const k of CAMPI_ISTANTE_PARTECIPANTE) if (typeof out[k] === "number") out[k] = ts(out[k] as number);
  return senzaUndefined(out);
}
