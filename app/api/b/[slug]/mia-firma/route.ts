import { archivioBiglietti } from "@/lib/biglietti";
import { idFirma } from "@/lib/biglietti/accesso";
import { chiaveFirmatario } from "@/lib/biglietti/firmatario";
import { errore, risposta } from "@/lib/biglietti/rotte";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

/** La firma di chi chiama (stesso dispositivo), per modificarla; null se non ha ancora firmato. */
export async function GET(richiesta: Request, { params }: Ctx) {
  const { slug } = await params;
  const chiave = chiaveFirmatario(richiesta);
  if (!chiave) return risposta({ ok: true, firma: null });
  const archivio = archivioBiglietti();
  const b = await archivio.perSlug(slug);
  if (!b || b.stato === "bozza") return errore("Biglietto non trovato.", 404);
  const f = await archivio.firma(b.id, idFirma(chiave, b.id));
  if (!f) return risposta({ ok: true, firma: null });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { tokenModifica, ...firma } = f;
  return risposta({ ok: true, firma });
}
