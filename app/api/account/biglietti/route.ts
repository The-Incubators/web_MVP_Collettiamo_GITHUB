import { archivioBiglietti } from "@/lib/biglietti";
import { utenteDa } from "@/lib/biglietti/accesso";
import { errore, risposta } from "@/lib/biglietti/rotte";
import { voceBiglietto } from "@/lib/dominio/account";

export const dynamic = "force-dynamic";

/** «I miei biglietti» (design.md §10.2): creati da te e firmati da te, solo quello che serve all'elenco. */
export async function GET(richiesta: Request) {
  const u = await utenteDa(richiesta);
  if (!u) return errore("Accedi per vedere i tuoi biglietti.", 401, { motivo: "accesso" });
  const archivio = archivioBiglietti();
  const [creati, firme] = await Promise.all([archivio.perOrganizzatore(u.uid), archivio.firmeDiAccount(u.uid)]);
  const visti = new Set<string>();
  const firmati = firme
    .filter((f) => f.biglietto.organizzatoreUid !== u.uid && f.biglietto.stato !== "bozza")
    .filter((f) => !visti.has(f.biglietto.id) && !!visti.add(f.biglietto.id))
    .map((f) => voceBiglietto(f.biglietto, false));
  return risposta({ ok: true, creati: creati.map((b) => voceBiglietto(b, true)), firmati });
}
