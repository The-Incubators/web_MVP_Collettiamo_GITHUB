"use client";

// La firma in corso, tra la pagina del messaggio e «I tuoi dati»: vive in sessionStorage (in try/catch).

import { leggiSessione, scriviSessione } from "@/lib/biglietti/client";
import { STILE_PREDEFINITO } from "@/lib/dominio/biglietti";
import type { ImmagineFirma, StileFirma } from "@/lib/tipi";
import type { ImmagineScelta } from "../FinestraImmagine";

/** L'immagine: appena scelta (da caricare o da libreria) o quella già salvata con la firma precedente. */
export type ImmagineBozza = ImmagineScelta | ({ tipo: "mantieni" } & Pick<ImmagineFirma, "url" | "larghezza" | "altezza" | "attribuzione">);

export interface BozzaFirma {
  messaggioHtml: string;
  stile: StileFirma;
  immagine: ImmagineBozza | null;
  daParteDi: string;
  nome: string;
  cognome: string;
  email: string;
  /** già firmato da questo dispositivo: si sta modificando */
  modifica: boolean;
}

export const BOZZA_VUOTA: BozzaFirma = { messaggioHtml: "", stile: STILE_PREDEFINITO, immagine: null, daParteDi: "", nome: "", cognome: "", email: "", modifica: false };

const chiave = (slug: string) => `colletta.firma.${slug}`;
export const leggiBozzaFirma = (slug: string) => leggiSessione<BozzaFirma>(chiave(slug));
export const scriviBozzaFirma = (slug: string, b: BozzaFirma | null) => scriviSessione(chiave(slug), b);

export function urlAnteprima(i: ImmagineBozza): string {
  return i.tipo === "caricata" ? i.dataUrl : i.url;
}

/** Ciò che parte verso il server. */
export function immaginePerServer(i: ImmagineBozza | null) {
  if (!i) return null;
  if (i.tipo === "mantieni") return { tipo: "mantieni" };
  return i;
}
