import { archivioBiglietti } from "@/lib/biglietti";
import { nuovoId, senzaSegreti } from "@/lib/biglietti/accesso";
import { eMp3, nomeAudioDaUrl, nomeFileMusica, urlAudio } from "@/lib/biglietti/audio";
import { bigliettoDelProprietario, errore, risposta } from "@/lib/biglietti/rotte";
import { MAX_BYTE_AUDIO } from "@/lib/biglietti/tipi";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Carica la musica della sorpresa: il corpo è l'MP3 così com'è, `?nome=` il nome del file.
 * Sostituisce (ed elimina) quella di prima. Si può cambiare anche dopo la consegna, come la modalità della rivelazione.
 */
export async function POST(richiesta: Request, { params }: Ctx) {
  const { id } = await params;
  const { b, esito } = await bigliettoDelProprietario(id, richiesta);
  if (!b) return esito;
  // prima di leggere il corpo: un file troppo grande non si scarica nemmeno
  if (Number(richiesta.headers.get("content-length") ?? 0) > MAX_BYTE_AUDIO) return errore("Il file è troppo grande: al massimo 3 MB.", 413);
  const dati = new Uint8Array(await richiesta.arrayBuffer());
  if (dati.length === 0) return errore("File mancante.");
  if (dati.length > MAX_BYTE_AUDIO) return errore("Il file è troppo grande: al massimo 3 MB.", 413);
  if (!eMp3(dati)) return errore("Serve un file MP3.");

  const archivio = archivioBiglietti();
  const nome = `m-${nuovoId(9)}`;
  await archivio.salvaAudio(id, nome, dati);
  const vecchia = nomeAudioDaUrl(id, b.musica?.url);
  if (vecchia) await archivio.eliminaAudio(id, vecchia);
  await archivio.aggiorna(id, {
    musica: { url: urlAudio(id, nome), nome: nomeFileMusica(new URL(richiesta.url).searchParams.get("nome")), byte: dati.length },
    aggiornatoIl: Date.now(),
  });
  const dopo = await archivio.leggi(id);
  return risposta({ ok: true, biglietto: dopo ? senzaSegreti(dopo) : null });
}

/** Toglie la musica. */
export async function DELETE(richiesta: Request, { params }: Ctx) {
  const { id } = await params;
  const { b, esito } = await bigliettoDelProprietario(id, richiesta);
  if (!b) return esito;
  const archivio = archivioBiglietti();
  const vecchia = nomeAudioDaUrl(id, b.musica?.url);
  if (vecchia) await archivio.eliminaAudio(id, vecchia);
  await archivio.aggiorna(id, { musica: null, aggiornatoIl: Date.now() });
  const dopo = await archivio.leggi(id);
  return risposta({ ok: true, biglietto: dopo ? senzaSegreti(dopo) : null });
}
