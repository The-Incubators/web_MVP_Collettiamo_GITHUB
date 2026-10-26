import { NextResponse } from "next/server";
import { amministratoreDa } from "@/lib/admin/verifica";
import { datiServer } from "@/lib/dati";
import { archivioImportazione } from "@/lib/importazione";
import { fotoDaDataUrl, nomeFoto } from "@/lib/importazione/foto";
import type { Candidato } from "@/lib/importazione/tipi";
import { datiDaRichiesta, pulisci } from "@/lib/importazione/valida";

export const dynamic = "force-dynamic";

const SENZA_CACHE = { "cache-control": "no-store" };
const risposta = (corpo: object, status = 200) => NextResponse.json(corpo, { status, headers: SENZA_CACHE });

/** Tutti i candidati, dal più recente: in revisione e già decisi. */
export async function GET(richiesta: Request) {
  if (!(await amministratoreDa(richiesta))) return risposta({ ok: false, errore: "Non autorizzato." }, 403);
  const candidati = await archivioImportazione().candidati();
  candidati.sort((a, b) => b.caricatoIl - a.caricatoIl || a.idOrigine.localeCompare(b.idOrigine));
  return risposta({ ok: true, candidati });
}

/**
 * Mette in revisione un prodotto della cartella dell'agente. Un prodotto alla volta (una foto per richiesta).
 * Un ASIN già nel catalogo, o già caricato prima, non entra: risponde «duplicato» e la pagina lo segnala.
 */
export async function POST(richiesta: Request) {
  const email = await amministratoreDa(richiesta);
  if (!email) return risposta({ ok: false, errore: "Non autorizzato." }, 403);

  let corpo: { dati?: unknown; foto?: unknown; lotto?: unknown };
  try {
    corpo = await richiesta.json();
  } catch {
    return risposta({ ok: false, errore: "Richiesta non valida." }, 400);
  }
  const esito = datiDaRichiesta(corpo.dati);
  if (!esito.ok) return risposta({ ok: false, errore: esito.errore }, 400);
  const foto = fotoDaDataUrl(corpo.foto);
  if (!foto.ok) return risposta({ ok: false, errore: foto.errore }, 400);
  const lotto = typeof corpo.lotto === "string" ? pulisci(corpo.lotto).slice(0, 80) : "";

  const d = esito.dati;
  const catalogo = await datiServer().elencaProdottiPerGestione();
  const nelCatalogo = catalogo.find((p) => p.asin === d.asin);
  if (nelCatalogo) return risposta({ ok: false, duplicato: true, errore: `già nel catalogo (${nelCatalogo.id ?? nelCatalogo.slug})` }, 409);

  const archivio = archivioImportazione();
  const esistente = await archivio.candidato(d.asin);
  if (esistente) {
    const dove = esistente.stato === "in_revisione" ? "è già in revisione" : esistente.stato === "importato" ? "è già stato importato" : "è già stato scartato";
    return risposta({ ok: false, duplicato: true, errore: `${dove} (lotto «${esistente.lotto}»)` }, 409);
  }

  const nome = nomeFoto(d.asin, foto.mime);
  await archivio.salvaFoto(nome, { mime: foto.mime, dati: foto.dati });
  const candidato: Candidato = {
    ...d,
    foto: `/api/img/prodotti/${nome}`,
    lotto,
    caricatoIl: Date.now(),
    caricatoDa: email,
    stato: "in_revisione",
    decisione: null,
  };
  await archivio.salvaCandidato(candidato);
  return risposta({ ok: true });
}
