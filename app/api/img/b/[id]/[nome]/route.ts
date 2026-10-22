import { archivioBiglietti } from "@/lib/biglietti";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; nome: string }> };

/** Le immagini caricate per un biglietto. Nomi casuali e mai riscritti: si possono tenere in cache per sempre. */
export async function GET(_r: Request, { params }: Ctx) {
  const { id, nome } = await params;
  if (!/^[A-Za-z0-9]{10,40}$/.test(id) || !/^[cf]-[A-Za-z0-9]{8,20}$/.test(nome)) return new Response("Non trovata", { status: 404 });
  const img = await archivioBiglietti().leggiImmagine(id, nome);
  if (!img) return new Response("Non trovata", { status: 404 });
  return new Response(Buffer.from(img.dati), {
    headers: {
      "content-type": img.mime,
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'; sandbox",
    },
  });
}
