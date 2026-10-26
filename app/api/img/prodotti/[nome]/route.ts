import { archivioImportazione } from "@/lib/importazione";
import { FORMA_NOME_FOTO } from "@/lib/importazione/foto";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ nome: string }> };

/** Le foto dei prodotti importati dal backoffice. Nomi casuali e mai riscritti: si tengono in cache per sempre. */
export async function GET(_r: Request, { params }: Ctx) {
  const { nome } = await params;
  if (!FORMA_NOME_FOTO.test(nome)) return new Response("Non trovata", { status: 404 });
  const foto = await archivioImportazione().leggiFoto(nome);
  if (!foto) return new Response("Non trovata", { status: 404 });
  return new Response(Buffer.from(foto.dati), {
    headers: {
      "content-type": foto.mime,
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'; sandbox",
    },
  });
}
