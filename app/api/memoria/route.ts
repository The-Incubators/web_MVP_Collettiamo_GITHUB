import { NextResponse } from "next/server";
import { modalitaDati } from "@/lib/config";
import { creaDatiMemoria } from "@/lib/dati/memoria";
import { ErroreDominio } from "@/lib/dominio/operazioni";

export const dynamic = "force-dynamic";

const METODI_AMMESSI = new Set([
  "elencaProdotti", "prodotto", "colletta", "partecipanti", "salvaUtente", "slugLibero", "creaColletta",
  "aggiornaColletta", "eliminaBozza", "elencaCollette", "eventi", "registraEvento", "esegui",
  "aggiungiInvitati", "registraSolleciti", "proposte", "voti", "impostaProposteIniziali", "aggiungiProposta",
  "rimuoviProposta", "vota", "preferiti", "impostaPreferito",
]);

/** Ponte fra il browser e l'adattatore in memoria. Esiste solo quando Firebase non è configurato. */
export async function POST(richiesta: Request) {
  if (modalitaDati() !== "memoria") return new NextResponse(null, { status: 404 });

  let corpo: { metodo?: unknown; args?: unknown; uid?: unknown };
  try {
    corpo = await richiesta.json();
  } catch {
    return NextResponse.json({ ok: false, errore: "Richiesta non valida." }, { status: 400 });
  }
  const { metodo, args, uid } = corpo;
  if (typeof metodo !== "string" || !METODI_AMMESSI.has(metodo) || !Array.isArray(args) || typeof uid !== "string" || uid === "") {
    return NextResponse.json({ ok: false, errore: "Richiesta non valida." }, { status: 400 });
  }

  try {
    const dati = creaDatiMemoria(uid) as unknown as Record<string, (...a: unknown[]) => Promise<unknown>>;
    const valore = await dati[metodo](...args);
    return NextResponse.json({ ok: true, valore: valore ?? null });
  } catch (e) {
    if (e instanceof ErroreDominio) return NextResponse.json({ ok: false, errore: e.message, dominio: true });
    console.error("[memoria]", e);
    return NextResponse.json({ ok: false, errore: "Errore interno." }, { status: 500 });
  }
}
