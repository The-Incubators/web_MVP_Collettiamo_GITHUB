// L'imbuto della sezione 13: aperture → adesioni → metodo scelto → dichiarazioni → messaggi.

import type { Evento, TipoEvento } from "../tipi";

export const PASSI_IMBUTO: { tipo: TipoEvento; etichetta: string }[] = [
  { tipo: "apertura", etichetta: "Aperture" },
  { tipo: "adesione", etichetta: "Adesioni" },
  { tipo: "metodo_scelto", etichetta: "Metodo scelto" },
  { tipo: "dichiarazione", etichetta: "Dichiarazioni" },
  { tipo: "messaggio", etichetta: "Messaggi lasciati" },
];

export interface PassoImbuto {
  tipo: TipoEvento;
  etichetta: string;
  /** persone distinte che hanno compiuto il passo */
  numero: number;
  /** percentuale sul passaggio precedente, null per il primo */
  percentuale: number | null;
  /** tempo mediano (ms) dal passo precedente, per le persone che hanno fatto entrambi */
  medianaMs: number | null;
}

export interface Imbuto {
  passi: PassoImbuto[];
  metodi: { metodo: string; numero: number }[];
  /** tempo mediano fra metodo_scelto e dichiarazione */
  medianaScelteDichiarazioneMs: number | null;
  dichiarazioniTotali: number;
  /** dichiarazioni arrivate prima di qualunque sollecito preparato: la metrica che conta */
  dichiarazioniSpontanee: number;
  solleciti: number;
}

export function mediana(valori: number[]): number | null {
  if (valori.length === 0) return null;
  const v = [...valori].sort((a, b) => a - b);
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : Math.round((v[m - 1] + v[m]) / 2);
}

/** La persona è identificata dall'uid anonimo; in mancanza, dall'id del partecipante. */
function chi(e: Evento): string | null {
  return e.uidAnonimo ?? e.partecipanteId;
}

/** Primo istante in cui ciascuna persona ha compiuto un tipo di evento. */
function primiPerPersona(eventi: Evento[], tipo: TipoEvento): Map<string, number> {
  const out = new Map<string, number>();
  for (const e of eventi) {
    const id = chi(e);
    if (e.tipo !== tipo || !id) continue;
    const prima = out.get(id);
    if (prima === undefined || e.ts < prima) out.set(id, e.ts);
  }
  return out;
}

export function calcolaImbuto(eventi: Evento[]): Imbuto {
  const perPasso = PASSI_IMBUTO.map((p) => primiPerPersona(eventi, p.tipo));

  const passi: PassoImbuto[] = PASSI_IMBUTO.map((p, i) => {
    const attuale = perPasso[i];
    if (i === 0) return { ...p, numero: attuale.size, percentuale: null, medianaMs: null };
    const precedente = perPasso[i - 1];
    const tempi: number[] = [];
    for (const [persona, ts] of attuale) {
      const t0 = precedente.get(persona);
      if (t0 !== undefined && ts >= t0) tempi.push(ts - t0);
    }
    return {
      ...p,
      numero: attuale.size,
      percentuale: precedente.size > 0 ? Math.round((attuale.size / precedente.size) * 100) : null,
      medianaMs: mediana(tempi),
    };
  });

  const conteggio = new Map<string, number>();
  const scelti = primiPerPersona(eventi, "metodo_scelto");
  for (const e of eventi) {
    const id = chi(e);
    if (e.tipo === "metodo_scelto" && id && scelti.get(id) === e.ts) {
      const metodo = String(e.meta.metodo ?? "?");
      conteggio.set(metodo, (conteggio.get(metodo) ?? 0) + 1);
    }
  }

  const dichiarazioni = primiPerPersona(eventi, "dichiarazione");
  const tempiScelta: number[] = [];
  for (const [persona, ts] of dichiarazioni) {
    const t0 = scelti.get(persona);
    if (t0 !== undefined && ts >= t0) tempiScelta.push(ts - t0);
  }

  const solleciti = eventi.filter((e) => e.tipo === "sollecito_preparato");
  const primoSollecito = solleciti.length ? Math.min(...solleciti.map((e) => e.ts)) : Infinity;
  let spontanee = 0;
  for (const ts of dichiarazioni.values()) if (ts < primoSollecito) spontanee++;

  return {
    passi,
    metodi: [...conteggio.entries()].map(([metodo, numero]) => ({ metodo, numero })).sort((a, b) => b.numero - a.numero),
    medianaScelteDichiarazioneMs: mediana(tempiScelta),
    dichiarazioniTotali: dichiarazioni.size,
    dichiarazioniSpontanee: spontanee,
    solleciti: solleciti.length,
  };
}

/** "45 s", "3 min", "2 h 10 min", "1 g 4 h" */
export function formattaDurata(ms: number | null): string {
  if (ms === null) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} s`;
  const min = Math.round(s / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return min % 60 ? `${h} h ${min % 60} min` : `${h} h`;
  const g = Math.floor(h / 24);
  return h % 24 ? `${g} g ${h % 24} h` : `${g} g`;
}
