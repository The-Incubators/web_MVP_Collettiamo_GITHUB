import { archivioBiglietti } from "@/lib/biglietti";
import { risposta } from "@/lib/biglietti/rotte";
import { slugBigliettoValido, suggerisciSlug } from "@/lib/dominio/biglietti";

export const dynamic = "force-dynamic";

/** Il link è libero? (verifica del passo 2, mentre si scrive il nome). Se è occupato, propone un'alternativa (S5). */
export async function GET(richiesta: Request) {
  const u = new URL(richiesta.url);
  const slug = u.searchParams.get("s") ?? "";
  const id = u.searchParams.get("id") ?? undefined;
  if (!slugBigliettoValido(slug)) return risposta({ ok: true, valido: false, disponibile: false });
  const archivio = archivioBiglietti();
  const occupato = await archivio.slugOccupato(slug, id);
  const suggerito = occupato ? await suggerisciSlug(slug, (s) => archivio.slugOccupato(s, id)) : null;
  return risposta({ ok: true, valido: true, disponibile: !occupato, suggerito });
}
