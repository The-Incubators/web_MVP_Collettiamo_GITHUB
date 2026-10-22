// Pezzi comuni alle rotte del biglietto.

import { NextResponse } from "next/server";
import { archivioBiglietti } from ".";
import { eProprietario } from "./accesso";
import type { BigliettoServer } from "./tipi";

const NO_CACHE = { "cache-control": "no-store" };

export function risposta(corpo: unknown, status = 200) {
  return NextResponse.json(corpo, { status, headers: NO_CACHE });
}

export function errore(messaggio: string, status = 400, extra: Record<string, unknown> = {}) {
  return risposta({ ok: false, errore: messaggio, ...extra }, status);
}

export async function corpoJson(richiesta: Request): Promise<Record<string, unknown> | null> {
  try {
    const c = (await richiesta.json()) as unknown;
    return c && typeof c === "object" && !Array.isArray(c) ? (c as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Il biglietto, se chi chiama ne è il proprietario; altrimenti la risposta d'errore da restituire. */
export async function bigliettoDelProprietario(
  id: string,
  richiesta: Request,
): Promise<{ b: BigliettoServer; esito?: undefined } | { b?: undefined; esito: NextResponse }> {
  const b = await archivioBiglietti().leggi(id);
  // stessa risposta per «non esiste» e «non è tuo»: non si scopre quali id esistono
  if (!b || !(await eProprietario(b, richiesta))) return { esito: errore("Biglietto non trovato.", 404) };
  return { b };
}

export function testo(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}
