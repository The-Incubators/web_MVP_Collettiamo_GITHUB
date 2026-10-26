import { NextResponse } from "next/server";
import { amministratoreDa } from "@/lib/admin/verifica";
import { datiServer } from "@/lib/dati";
import { ordineManuale, posizioni } from "@/lib/dominio/ordineCatalogo";
import { archivioImportazione } from "@/lib/importazione";
import { decisioneDaRichiesta, prodottoDaCandidato, prossimoId, slugUnico } from "@/lib/importazione/prodotto";
import type { Candidato } from "@/lib/importazione/tipi";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ asin: string }> };

const SENZA_CACHE = { "cache-control": "no-store" };
const risposta = (corpo: object, status = 200) => NextResponse.json(corpo, { status, headers: SENZA_CACHE });

/**
 * La decisione su un candidato: «importato» (entra subito nel catalogo, in fondo all'ordine), «scartato»,
 * oppure «riapri» per rimettere in revisione uno scartato. Un importato non si riapre da qui: per toglierlo
 * dal sito c'è «Elimina» nella pagina dell'ordine.
 */
export async function PUT(richiesta: Request, { params }: Ctx) {
  const email = await amministratoreDa(richiesta);
  if (!email) return risposta({ ok: false, errore: "Non autorizzato." }, 403);
  const { asin } = await params;
  if (!/^[A-Z0-9]{10}$/.test(asin)) return risposta({ ok: false, errore: "ASIN non valido." }, 400);

  let corpo: unknown;
  try {
    corpo = await richiesta.json();
  } catch {
    return risposta({ ok: false, errore: "Richiesta non valida." }, 400);
  }
  const esito = decisioneDaRichiesta(corpo);
  if (!esito.ok) return risposta({ ok: false, errore: esito.errore }, 400);
  const decisione = esito.valore;

  const archivio = archivioImportazione();
  const c = await archivio.candidato(asin);
  if (!c) return risposta({ ok: false, errore: "Prodotto non trovato." }, 404);

  if (decisione.esito === "riapri") {
    if (c.stato !== "scartato") return risposta({ ok: false, errore: "Si possono rimettere in revisione solo i prodotti scartati." }, 409);
    await archivio.salvaCandidato({ ...c, stato: "in_revisione", decisione: null });
    return risposta({ ok: true });
  }
  if (c.stato !== "in_revisione") return risposta({ ok: false, errore: "Su questo prodotto hai già deciso." }, 409);

  const base = { motivi: decisione.motivi, nota: decisione.nota, il: Date.now(), da: email };
  if (decisione.esito === "scartato") {
    await archivio.salvaCandidato({ ...c, stato: "scartato", decisione: { esito: "scartato", ...base } });
    return risposta({ ok: true });
  }

  const dati = datiServer();
  const catalogo = await dati.elencaProdottiPerGestione();
  if (catalogo.some((p) => p.asin === c.asin)) return risposta({ ok: false, errore: "Questo ASIN è già nel catalogo." }, 409);
  const id = prossimoId(catalogo.map((p) => p.id));
  const slug = slugUnico(c.nome, id, new Set(catalogo.map((p) => p.slug)));
  await dati.aggiungiProdotto(prodottoDaCandidato(c, decisione.dati, id, slug));

  // In fondo all'ordine attuale, con le stelle scelte. Senza un ordine salvato si parte da quello che il sito
  // mostra adesso (catalogo già ordinato), così gli altri prodotti non si spostano.
  const imp = await dati.impostazioniCatalogo();
  const slugs = [...catalogo.map((p) => p.slug), slug];
  const nuovo = {
    modo: imp?.modo ?? ("trascinamento" as const),
    ordine: [...ordineManuale(catalogo.map((p) => p.slug), imp?.ordine ?? catalogo.map((p) => p.slug)), slug],
    stelle: { ...(imp?.stelle ?? {}), [slug]: decisione.dati.stelle },
  };
  await dati.salvaOrdineCatalogo({ ...nuovo, aggiornatoIl: Date.now(), aggiornatoDa: email }, posizioni(slugs, nuovo));

  const aggiornato: Candidato = {
    ...c,
    stato: "importato",
    decisione: { esito: "importato", ...base, slug, id, ...decisione.dati },
  };
  await archivio.salvaCandidato(aggiornato);
  return risposta({ ok: true, slug, id });
}
