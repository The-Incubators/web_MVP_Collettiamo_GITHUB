import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaginaInvito } from "@/components/partecipante/PaginaInvito";
import { datiServer } from "@/lib/dati";
import { SLUG_DEMO } from "@/lib/dati/demo";
import { righePubbliche } from "@/lib/dati/pubblico";
import { descrizionePubblica, titoloPubblico } from "@/lib/dominio/messaggi";
import { quotaEffettiva } from "@/lib/dominio/quota";
import { nomeRegalo } from "@/lib/dominio/regali";
import { slugValido } from "@/lib/dominio/slug";
import { bigliettoDelGruppo, catalogoFoglio } from "@/lib/gruppo/server";
import type { Colletta } from "@/lib/tipi";

// La prima schermata deve comparire subito: la pagina si rende sul server e il client prosegue da lì.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

async function carica(slug: string): Promise<Colletta | null> {
  if (!slugValido(slug)) return null;
  const dati = datiServer();
  let c = await dati.colletta(slug);
  // La votazione si chiude a tempo: non c'è un processo pianificato, la fa scattare chi apre la pagina.
  if (c && c.votazione && !c.votazione.chiusa && c.votazione.scade !== null && Date.now() >= c.votazione.scade) {
    c = (await dati.chiudiVotazioneScaduta(slug).catch(() => null)) ?? (await dati.colletta(slug));
  }
  return c && c.stato !== "bozza" ? c : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await carica(slug);
  if (!c) return { title: "Regalo di gruppo non trovato", robots: { index: false, follow: false } };

  const votazione = !!c.votazione && !c.votazione.chiusa;
  const titolo = titoloPubblico({ festeggiato: c.festeggiato, quotaCent: quotaEffettiva(c), sorpresa: c.sorpresa, votazione });
  const descrizione = descrizionePubblica({ prodottoNome: nomeRegalo(c.prodotto), organizzatoreNome: c.organizzatoreNome, sorpresa: c.sorpresa, votazione });
  const immagine = { url: `/c/${slug}/opengraph-image`, width: 1200, height: 630, alt: titolo };

  return {
    title: { absolute: titolo },
    description: descrizione,
    robots: c.sorpresa || slug === SLUG_DEMO ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "website",
      locale: "it_IT",
      siteName: "Gifty",
      url: `/c/${slug}`,
      title: titolo,
      description: descrizione,
      images: [immagine],
    },
    twitter: { card: "summary_large_image", title: titolo, description: descrizione, images: [immagine.url] },
  };
}

export default async function PaginaColletta({ params }: Props) {
  const { slug } = await params;
  const c = await carica(slug);
  if (!c) notFound();

  const righe = slug === SLUG_DEMO || c.stato === "chiusa" ? righePubbliche(await datiServer().partecipanti(slug)) : null;
  const [biglietto, catalogo] = await Promise.all([
    bigliettoDelGruppo(slug),
    c.votazione && !c.votazione.chiusa && c.votazione.consentiProposte ? catalogoFoglio() : Promise.resolve([]),
  ]);
  // si firma solo un biglietto aperto: in bozza non c'è ancora il link, consegnato non si firma più
  const daFirmare = biglietto && biglietto.stato === "aperto" && biglietto.slug ? { slug: biglietto.slug } : null;
  return <PaginaInvito iniziale={c} righeIniziali={righe} biglietto={daFirmare} catalogo={catalogo} simulato={slug === SLUG_DEMO} />;
}
