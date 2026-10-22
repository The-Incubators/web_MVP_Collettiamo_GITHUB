import { archivioBiglietti } from "@/lib/biglietti";
import { errore, risposta } from "@/lib/biglietti/rotte";
import { firmaPubblica, vistaPubblica } from "@/lib/dominio/biglietti";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

/** La vista pubblica del biglietto e le firme visibili: ciò che serve alla pagina di firma. */
export async function GET(_r: Request, { params }: Ctx) {
  const { slug } = await params;
  const archivio = archivioBiglietti();
  const b = await archivio.perSlug(slug);
  if (!b || b.stato === "bozza") return errore("Biglietto non trovato.", 404);
  const firme = (await archivio.firme(b.id))
    .filter((f) => !f.nascosta)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ tokenModifica, ...f }) => firmaPubblica(f));
  return risposta({ ok: true, biglietto: vistaPubblica(b), firme });
}
