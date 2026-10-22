import { archivioBiglietti } from "@/lib/biglietti";
import { chiaveFirmatario, salvaFirmaDaCorpo } from "@/lib/biglietti/firmatario";
import { corpoJson, errore, risposta } from "@/lib/biglietti/rotte";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

/** Aggiunge (o aggiorna, dallo stesso dispositivo) la firma di chi chiama. */
export async function POST(richiesta: Request, { params }: Ctx) {
  const { slug } = await params;
  const chiave = chiaveFirmatario(richiesta);
  if (!chiave) return errore("Richiesta non valida.");
  const b = await archivioBiglietti().perSlug(slug);
  if (!b || b.stato === "bozza") return errore("Biglietto non trovato.", 404);
  const c = await corpoJson(richiesta);
  if (!c) return errore("Richiesta non valida.");
  const esito = await salvaFirmaDaCorpo(b, chiave, c);
  if (!esito.ok) return errore(esito.errore, esito.status);
  return risposta({ ok: true, firmaId: esito.firma.id, nuova: esito.nuova });
}
