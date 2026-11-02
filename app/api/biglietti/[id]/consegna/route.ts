import { archivioBiglietti } from "@/lib/biglietti";
import { senzaSegreti } from "@/lib/biglietti/accesso";
import { bigliettoDelProprietario, corpoJson, errore, risposta } from "@/lib/biglietti/rotte";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * 🎁 «Consegna»: da quel momento nessuno scrive più e lo stesso link mostra la rivelazione a tutti.
 * «Riapri» torna alla bacheca, per raccogliere altri messaggi. Corpo: { azione: "consegna" | "riapri" }.
 */
export async function POST(richiesta: Request, { params }: Ctx) {
  const { id } = await params;
  const { b, esito } = await bigliettoDelProprietario(id, richiesta);
  if (!b) return esito;
  if (b.stato === "bozza") return errore("Pubblica il biglietto prima di consegnarlo.", 409);
  const c = await corpoJson(richiesta);
  const archivio = archivioBiglietti();
  if (c?.azione === "consegna") {
    if (b.stato !== "consegnato") await archivio.aggiorna(id, { stato: "consegnato", consegnatoIl: Date.now(), aggiornatoIl: Date.now() });
  } else if (c?.azione === "riapri") {
    if (b.stato !== "aperto") await archivio.aggiorna(id, { stato: "aperto", consegnatoIl: null, aggiornatoIl: Date.now() });
  } else {
    return errore("Richiesta non valida.");
  }
  const dopo = await archivio.leggi(id);
  return risposta({ ok: true, biglietto: dopo ? senzaSegreti(dopo) : null });
}
