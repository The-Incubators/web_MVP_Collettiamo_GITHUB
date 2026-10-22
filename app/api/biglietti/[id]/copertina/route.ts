import { archivioBiglietti } from "@/lib/biglietti";
import { nuovoId, senzaSegreti } from "@/lib/biglietti/accesso";
import { immagineDaDataUrl, nomeDaUrl, urlEsternoAmmesso, urlImmagine } from "@/lib/biglietti/immagini";
import { bigliettoDelProprietario, corpoJson, errore, risposta } from "@/lib/biglietti/rotte";
import { modelloPerId } from "@/lib/dati/modelli-biglietto";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Carica (dataUrl), sceglie dalla libreria (url) o toglie (dataUrl null) l'immagine della copertina e sceglie il modello che la usa. */
export async function POST(richiesta: Request, { params }: Ctx) {
  const { id } = await params;
  const { b, esito } = await bigliettoDelProprietario(id, richiesta);
  if (!b) return esito;
  if (b.stato === "consegnato") return errore("Il biglietto è già stato consegnato.", 409);
  const c = await corpoJson(richiesta);
  if (!c) return errore("Richiesta non valida.");
  const modello = typeof c.modelloId === "string" ? modelloPerId(c.modelloId) : null;
  if (!modello || (modello.tipo !== "carica-immagine" && modello.tipo !== "foto-intera")) return errore("Modello non valido.");

  const archivio = archivioBiglietti();
  let url: string | null = null;
  if (c.url !== undefined) {
    // una GIF scelta dalla libreria (S7): solo dagli host ammessi
    if (!urlEsternoAmmesso(c.url)) return errore("Immagine non valida.");
    url = c.url;
  } else if (c.dataUrl !== null) {
    const img = immagineDaDataUrl(c.dataUrl);
    if (!img.ok) return errore(img.errore);
    const nome = `c-${nuovoId(9)}`;
    await archivio.salvaImmagine(id, nome, img.img);
    url = urlImmagine(id, nome);
  }
  const vecchia = nomeDaUrl(id, b.copertina.immagineUrl);
  if (vecchia) await archivio.eliminaImmagine(id, vecchia);
  await archivio.aggiorna(id, {
    copertina: { ...b.copertina, modelloId: modello.id, immagineUrl: url },
    aggiornatoIl: Date.now(),
  });
  const dopo = await archivio.leggi(id);
  return risposta({ ok: true, biglietto: dopo ? senzaSegreti(dopo) : null });
}
