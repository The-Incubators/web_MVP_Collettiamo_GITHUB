import { archivioBiglietti } from "@/lib/biglietti";
import { senzaSegreti, utenteDa } from "@/lib/biglietti/accesso";
import { bigliettoDelProprietario, corpoJson, errore, risposta, testo } from "@/lib/biglietti/rotte";
import { modelloPerId } from "@/lib/dati/modelli-biglietto";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * «Pubblica e condividi»: serve un account. La bozza (di chi ha la chiave) passa all'account che pubblica:
 * da quel momento la gestione si apre anche da un altro dispositivo, dopo l'accesso.
 */
export async function POST(richiesta: Request, { params }: Ctx) {
  const { id } = await params;
  const { b, esito } = await bigliettoDelProprietario(id, richiesta);
  if (!b) return esito;
  const utente = await utenteDa(richiesta);
  if (!utente) return errore("Accedi per pubblicare.", 401, { motivo: "accesso" });
  if (b.organizzatoreUid && b.organizzatoreUid !== utente.uid) return errore("Questo biglietto appartiene a un altro account.", 403);
  if (b.stato === "bozza") {
    if (!b.slug || !b.nome || !b.festeggiato) return errore("Completa le basi del biglietto.", 409, { motivo: "dettagli" });
    if (!(b.consegna.quando > Date.now())) return errore("La data di consegna è già passata: scegline un'altra.", 409, { motivo: "data" });
    if (!modelloPerId(b.copertina.modelloId)) return errore("Scegli la copertina.", 409, { motivo: "copertina" });
  }
  const c = await corpoJson(richiesta);
  const nome = testo(c?.nome, 80) || utente.nome || null;
  const archivio = archivioBiglietti();
  await archivio.aggiorna(id, {
    organizzatoreUid: utente.uid,
    organizzatoreNome: nome,
    stato: b.stato === "bozza" ? "aperto" : b.stato,
    aggiornatoIl: Date.now(),
  });
  const dopo = await archivio.leggi(id);
  return risposta({ ok: true, biglietto: dopo ? senzaSegreti(dopo) : null });
}
