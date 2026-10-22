// Librerie di immagini esterne (S7): attive solo se le chiavi ci sono, e chiamate solo dal server.

export interface RisultatoLibreria {
  id: string;
  anteprima: string;
  url: string;
  larghezza: number;
  altezza: number;
  attribuzione: string;
}

export function librerieAttive(): { gif: boolean; foto: boolean } {
  return { gif: !!process.env.GIPHY_API_KEY?.trim(), foto: !!process.env.UNSPLASH_ACCESS_KEY?.trim() };
}

export async function cercaGif(q: string): Promise<RisultatoLibreria[]> {
  const chiave = process.env.GIPHY_API_KEY?.trim();
  if (!chiave) return [];
  const u = new URL(q ? "https://api.giphy.com/v1/gifs/search" : "https://api.giphy.com/v1/gifs/trending");
  u.searchParams.set("api_key", chiave);
  if (q) u.searchParams.set("q", q);
  u.searchParams.set("limit", "24");
  u.searchParams.set("rating", "g");
  u.searchParams.set("lang", "it");
  const r = await fetch(u, { cache: "no-store" });
  if (!r.ok) return [];
  const j = (await r.json()) as { data?: { id: string; images: Record<string, { url: string; width: string; height: string }> }[] };
  return (j.data ?? []).flatMap((g) => {
    const p = g.images.fixed_width ?? g.images.downsized;
    const m = g.images.downsized_medium ?? g.images.downsized ?? p;
    return p && m ? [{ id: g.id, anteprima: p.url, url: m.url, larghezza: Number(m.width), altezza: Number(m.height), attribuzione: "via GIPHY" }] : [];
  });
}

export async function cercaFoto(q: string): Promise<RisultatoLibreria[]> {
  const chiave = process.env.UNSPLASH_ACCESS_KEY?.trim();
  if (!chiave) return [];
  const u = new URL("https://api.unsplash.com/search/photos");
  u.searchParams.set("query", q || "festa");
  u.searchParams.set("per_page", "24");
  u.searchParams.set("content_filter", "high");
  const r = await fetch(u, { headers: { authorization: `Client-ID ${chiave}`, "accept-version": "v1" }, cache: "no-store" });
  if (!r.ok) return [];
  const j = (await r.json()) as { results?: { id: string; width: number; height: number; urls: { small: string; regular: string }; user: { name: string } }[] };
  return (j.results ?? []).map((f) => ({
    id: f.id,
    anteprima: f.urls.small,
    url: f.urls.regular,
    larghezza: 1080,
    altezza: Math.round((1080 * f.height) / f.width),
    attribuzione: `Foto di ${f.user.name} su Unsplash`,
  }));
}
