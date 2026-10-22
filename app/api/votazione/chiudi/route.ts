import { NextResponse } from "next/server";
import { datiServer } from "@/lib/dati";
import { slugValido } from "@/lib/dominio/slug";

export const dynamic = "force-dynamic";

/**
 * Chiude la votazione di una colletta se il tempo è scaduto. Non serve nessun accesso: l'esito dipende
 * solo dall'orologio del server e dai voti, ed è sempre lo stesso (l'operazione è idempotente).
 * Non c'è un processo pianificato: lo fa scattare chi apre la pagina quando la votazione finisce.
 */
export async function POST(richiesta: Request) {
  let slug: unknown;
  try {
    slug = ((await richiesta.json()) as { slug?: unknown }).slug;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (typeof slug !== "string" || !slugValido(slug)) return NextResponse.json({ ok: false }, { status: 400 });
  try {
    const c = await datiServer().chiudiVotazioneScaduta(slug);
    return NextResponse.json({ ok: true, chiusa: c !== null });
  } catch (e) {
    console.error("[votazione]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
