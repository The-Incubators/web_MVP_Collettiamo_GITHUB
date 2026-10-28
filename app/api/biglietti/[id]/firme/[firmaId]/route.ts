import { archivioBiglietti } from "@/lib/biglietti";
import { nomeDaUrl } from "@/lib/biglietti/immagini";
import { bigliettoDelProprietario, corpoJson, errore, risposta } from "@/lib/biglietti/rotte";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; firmaId: string }> };

/** Moderazione di chi organizza: nasconde o rimostra un messaggio. Nascosto, non compare né in bacheca né nella rivelazione. */
export async function PATCH(richiesta: Request, { params }: Ctx) {
  const { id, firmaId } = await params;
  const { b, esito } = await bigliettoDelProprietario(id, richiesta);
  if (!b) return esito;
  const c = await corpoJson(richiesta);
  if (typeof c?.nascosta !== "boolean") return errore("Richiesta non valida.");
  if (!(await archivioBiglietti().nascondiFirma(id, firmaId, c.nascosta))) return errore("Messaggio non trovato.", 404);
  return risposta({ ok: true, nascosta: c.nascosta });
}

/** Moderazione di chi organizza: elimina un messaggio (con la sua foto), anche dopo la consegna. */
export async function DELETE(richiesta: Request, { params }: Ctx) {
  const { id, firmaId } = await params;
  const { b, esito } = await bigliettoDelProprietario(id, richiesta);
  if (!b) return esito;
  const archivio = archivioBiglietti();
  const prima = await archivio.firma(id, firmaId);
  const e = await archivio.eliminaFirma(id, firmaId, { qualsiasiStato: true });
  if ("errore" in e) return errore("Biglietto non trovato.", 404);
  const foto = nomeDaUrl(id, prima?.immagine?.url);
  if (e.eliminata && foto) await archivio.eliminaImmagine(id, foto);
  return risposta({ ok: true, eliminata: e.eliminata });
}
