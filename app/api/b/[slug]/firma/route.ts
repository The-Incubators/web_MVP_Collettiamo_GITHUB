import { archivioBiglietti } from "@/lib/biglietti";
import { idFirma } from "@/lib/biglietti/accesso";
import { nomeDaUrl } from "@/lib/biglietti/immagini";
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

/** Elimina la firma di chi chiama (stesso dispositivo), con la sua foto. */
export async function DELETE(richiesta: Request, { params }: Ctx) {
  const { slug } = await params;
  const chiave = chiaveFirmatario(richiesta);
  if (!chiave) return errore("Richiesta non valida.");
  const archivio = archivioBiglietti();
  const b = await archivio.perSlug(slug);
  if (!b || b.stato === "bozza") return errore("Biglietto non trovato.", 404);
  const id = idFirma(chiave, b.id);
  const prima = await archivio.firma(b.id, id);
  const esito = await archivio.eliminaFirma(b.id, id);
  if ("errore" in esito) return errore("Questo biglietto è già stato consegnato.", 409);
  const foto = nomeDaUrl(b.id, prima?.immagine?.url);
  if (esito.eliminata && foto) await archivio.eliminaImmagine(b.id, foto);
  return risposta({ ok: true, eliminata: esito.eliminata });
}
