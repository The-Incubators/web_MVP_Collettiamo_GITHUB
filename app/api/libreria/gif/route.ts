import { cercaGif } from "@/lib/biglietti/librerie";
import { risposta } from "@/lib/biglietti/rotte";

export const dynamic = "force-dynamic";

export async function GET(richiesta: Request) {
  const q = (new URL(richiesta.url).searchParams.get("q") ?? "").slice(0, 60);
  return risposta({ ok: true, risultati: await cercaGif(q).catch(() => []) });
}
