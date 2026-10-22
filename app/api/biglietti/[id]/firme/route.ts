import { archivioBiglietti } from "@/lib/biglietti";
import { bigliettoDelProprietario, risposta } from "@/lib/biglietti/rotte";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Tutte le firme, per chi organizza (con nome, cognome ed email lasciati da chi ha firmato). */
export async function GET(richiesta: Request, { params }: Ctx) {
  const { id } = await params;
  const { b, esito } = await bigliettoDelProprietario(id, richiesta);
  if (!b) return esito;
  const firme = (await archivioBiglietti().firme(id))
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ tokenModifica, ...f }) => f)
    .sort((x, y) => x.creatoIl - y.creatoIl);
  return risposta({ ok: true, firme });
}
