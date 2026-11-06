import type { MetadataRoute } from "next";
import { baseUrl } from "@/lib/config";
import { datiServer } from "@/lib/dati";
import { PAGINE_PUBBLICHE } from "@/lib/seo";

// Il catalogo cambia dall'area riservata: la sitemap si rifà al massimo una volta l'ora.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl();
  const fisse = PAGINE_PUBBLICHE.map(({ percorso, priorita }) => ({ url: `${base}${percorso === "/" ? "" : percorso}`, priority: priorita }));
  const prodotti = await datiServer()
    .elencaProdotti()
    .catch(() => []);
  return [
    ...fisse,
    ...prodotti
      .filter((p) => p.attivo && !p.eliminato)
      .map((p) => ({
        url: `${base}/prodotto/${p.slug}`,
        lastModified: p.rilevatoIl ? new Date(`${p.rilevatoIl}T00:00:00Z`) : undefined,
        priority: 0.6,
      })),
  ];
}
