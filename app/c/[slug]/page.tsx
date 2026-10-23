import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaginaPartecipante } from "@/components/partecipante/PaginaPartecipante";
import { datiServer } from "@/lib/dati";
import { SLUG_DEMO } from "@/lib/dati/demo";
import { righePubbliche } from "@/lib/dati/pubblico";
import { descrizionePubblica, titoloPubblico } from "@/lib/dominio/messaggi";
import { quotaEffettiva } from "@/lib/dominio/quota";
import { slugValido } from "@/lib/dominio/slug";
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
  if (!c) return { title: "Colletta non trovata", robots: { index: false, follow: false } };

  const votazione = !!c.votazione && !c.votazione.chiusa;
  const titolo = titoloPubblico({ festeggiato: c.festeggiato, quotaCent: quotaEffettiva(c), sorpresa: c.sorpresa, votazione });
  const descrizione = descrizionePubblica({ prodottoNome: c.prodotto.nome, organizzatoreNome: c.organizzatoreNome, sorpresa: c.sorpresa, votazione });
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

  const demo = slug === SLUG_DEMO;
  const righe = demo || c.stato === "chiusa" ? righePubbliche(await datiServer().partecipanti(slug)) : null;
  return <PaginaPartecipante iniziale={c} righeIniziali={righe} simulato={demo} />;
}
