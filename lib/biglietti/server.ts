import { archivioBiglietti } from ".";
import { firmaPubblica, vistaPubblica } from "../dominio/biglietti";
import type { BigliettoPubblico, Firma } from "../tipi";

/** Il biglietto pubblicato (vista pubblica) e le sue firme visibili, per le pagine di chi firma. */
export async function bigliettoPubblico(slug: string): Promise<{ b: BigliettoPubblico; firme: Firma[] } | null> {
  if (!/^[a-z0-9-]{3,80}$/.test(slug)) return null;
  const archivio = archivioBiglietti();
  const b = await archivio.perSlug(slug);
  if (!b || b.stato === "bozza") return null;
  const firme = (await archivio.firme(b.id))
    .filter((f) => !f.nascosta)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ tokenModifica, ...f }) => firmaPubblica(f));
  return { b: vistaPubblica(b), firme };
}
