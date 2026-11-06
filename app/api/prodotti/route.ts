import { risposta } from "@/lib/biglietti/rotte";
import { datiServer } from "@/lib/dati";
import { MAX_VISTI, slugValido } from "@/lib/dominio/visti";
import type { Prodotto } from "@/lib/tipi";

export const dynamic = "force-dynamic";

/**
 * Le schede del catalogo pubblico per gli slug chiesti (?slug=a&slug=b), nell'ordine chiesto: le usa la striscia
 * «Visti di recente» della home. Solo prodotti visibili a chi visita; al massimo MAX_VISTI; nessun dato personale.
 */
export async function GET(richiesta: Request) {
  const slug = [...new Set(new URL(richiesta.url).searchParams.getAll("slug").filter(slugValido))].slice(0, MAX_VISTI);
  if (!slug.length) return risposta({ ok: true, prodotti: [] });
  const dati = datiServer();
  const trovati = await Promise.all(slug.map((s) => dati.prodotto(s).catch(() => null)));
  const prodotti = trovati.filter((p): p is Prodotto => !!p && p.attivo && !p.eliminato);
  return risposta({ ok: true, prodotti });
}
