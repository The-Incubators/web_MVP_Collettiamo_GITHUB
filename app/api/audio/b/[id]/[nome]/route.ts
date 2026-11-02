import { archivioBiglietti } from "@/lib/biglietti";
import { intervalloRichiesto } from "@/lib/biglietti/audio";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; nome: string }> };

/** La musica di un biglietto. Nomi casuali e mai riscritti: si può tenere in cache per sempre. Risponde anche a pezzi (Range). */
export async function GET(richiesta: Request, { params }: Ctx) {
  const { id, nome } = await params;
  if (!/^[A-Za-z0-9]{10,40}$/.test(id) || !/^m-[A-Za-z0-9]{8,20}$/.test(nome)) return new Response("Non trovata", { status: 404 });
  const dati = await archivioBiglietti().leggiAudio(id, nome);
  if (!dati) return new Response("Non trovata", { status: 404 });
  const comuni = {
    "content-type": "audio/mpeg",
    "accept-ranges": "bytes",
    "cache-control": "public, max-age=31536000, immutable",
    "x-content-type-options": "nosniff",
  };
  const parte = intervalloRichiesto(richiesta.headers.get("range"), dati.length);
  if (parte === "fuori") return new Response(null, { status: 416, headers: { ...comuni, "content-range": `bytes */${dati.length}` } });
  if (!parte) return new Response(Buffer.from(dati), { headers: { ...comuni, "content-length": String(dati.length) } });
  return new Response(Buffer.from(dati.subarray(parte.inizio, parte.fine + 1)), {
    status: 206,
    headers: { ...comuni, "content-range": `bytes ${parte.inizio}-${parte.fine}/${dati.length}`, "content-length": String(parte.fine - parte.inizio + 1) },
  });
}
