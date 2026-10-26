import { NextResponse } from "next/server";
import { amministratoreDa } from "@/lib/admin/verifica";
import { archivioImportazione } from "@/lib/importazione";
import { csvDecisioni, jsonDecisioni } from "@/lib/importazione/prodotto";

export const dynamic = "force-dynamic";

/** Le decisioni prese (importati = «ottimo», scartati = «sbagliato»), da dare all'agente. ?formato=csv|json */
export async function GET(richiesta: Request) {
  if (!(await amministratoreDa(richiesta))) return NextResponse.json({ ok: false, errore: "Non autorizzato." }, { status: 403 });
  const formato = new URL(richiesta.url).searchParams.get("formato") === "csv" ? "csv" : "json";
  const candidati = (await archivioImportazione().candidati()).sort((a, b) => (a.decisione?.il ?? 0) - (b.decisione?.il ?? 0));
  const giorno = new Date().toISOString().slice(0, 10);
  return new Response(formato === "csv" ? csvDecisioni(candidati) : jsonDecisioni(candidati), {
    headers: {
      "content-type": formato === "csv" ? "text/csv; charset=utf-8" : "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="decisioni-prodotti-${giorno}.${formato}"`,
      "cache-control": "no-store",
    },
  });
}
