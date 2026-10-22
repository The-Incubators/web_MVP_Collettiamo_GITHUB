import { NextResponse } from "next/server";
import { datiServer } from "@/lib/dati";
import { amministratoreDa } from "@/lib/admin/verifica";
import { linkSchedaAmazon } from "@/lib/dominio/amazon";
import { posizioni, validaImpostazioni } from "@/lib/dominio/ordineCatalogo";

export const dynamic = "force-dynamic";

const NON_AUTORIZZATO = () => NextResponse.json({ ok: false, errore: "Non autorizzato." }, { status: 403, headers: { "cache-control": "no-store" } });

/** I prodotti con l'ordine attuale e le impostazioni salvate. */
export async function GET(richiesta: Request) {
  if (!(await amministratoreDa(richiesta))) return NON_AUTORIZZATO();
  const dati = datiServer();
  // Qui servono anche i prodotti eliminati: l'area riservata deve poterli ripristinare.
  const [prodotti, impostazioni] = await Promise.all([dati.elencaProdottiPerGestione(), dati.impostazioniCatalogo()]);
  return NextResponse.json(
    {
      ok: true,
      prodotti: prodotti.map((p) => ({
        slug: p.slug,
        id: p.id ?? "",
        nome: p.nome,
        marca: p.marca,
        prezzoCent: p.prezzoCent,
        foto: p.immagine.foto ?? null,
        eliminato: p.eliminato === true,
        amazon: linkSchedaAmazon(p.asin, p.urlEsterno),
      })),
      impostazioni,
    },
    { headers: { "cache-control": "no-store" } },
  );
}

/** Salva l'ordine: scrive la posizione di ogni prodotto, che il sito usa subito. */
export async function PUT(richiesta: Request) {
  const email = await amministratoreDa(richiesta);
  if (!email) return NON_AUTORIZZATO();

  let corpo: unknown;
  try {
    corpo = await richiesta.json();
  } catch {
    return NextResponse.json({ ok: false, errore: "Richiesta non valida." }, { status: 400 });
  }
  const dati = datiServer();
  // Anche gli eliminati: restano nell'ordine, così ripristinandoli tornano al loro posto.
  const slugs = (await dati.elencaProdottiPerGestione()).map((p) => p.slug);
  const esito = validaImpostazioni(corpo, slugs);
  if (!esito.ok) return NextResponse.json({ ok: false, errore: esito.errore }, { status: 400 });

  const imp = { ...esito.valore, aggiornatoIl: Date.now(), aggiornatoDa: email };
  await dati.salvaOrdineCatalogo(imp, posizioni(slugs, esito.valore));
  return NextResponse.json({ ok: true, aggiornatoIl: imp.aggiornatoIl }, { headers: { "cache-control": "no-store" } });
}

/**
 * Elimina un prodotto dal catalogo pubblico, o lo ripristina. Non cancella niente: scrive solo il campo
 * `eliminato`, quindi il prodotto resta nel catalogo e si può rimettere. Ha effetto subito sul sito.
 */
export async function PATCH(richiesta: Request) {
  if (!(await amministratoreDa(richiesta))) return NON_AUTORIZZATO();

  let corpo: unknown;
  try {
    corpo = await richiesta.json();
  } catch {
    return NextResponse.json({ ok: false, errore: "Richiesta non valida." }, { status: 400 });
  }
  const c = corpo as { slug?: unknown; eliminato?: unknown };
  if (typeof c?.slug !== "string" || typeof c?.eliminato !== "boolean") {
    return NextResponse.json({ ok: false, errore: "Servono «slug» e «eliminato»." }, { status: 400 });
  }

  const dati = datiServer();
  const esiste = (await dati.elencaProdottiPerGestione()).some((p) => p.slug === c.slug);
  if (!esiste) return NextResponse.json({ ok: false, errore: "Prodotto inesistente." }, { status: 404 });

  await dati.impostaProdottoEliminato(c.slug, c.eliminato);
  return NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
}
