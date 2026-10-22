import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IntestazioneWizard } from "@/components/biglietto/comuni";
import { PaginaInvito } from "@/components/biglietto/firma/PaginaInvito";
import { bigliettoPubblico } from "@/lib/biglietti/server";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const dati = await bigliettoPubblico(slug);
  if (!dati) return { title: "Biglietto non trovato", robots: { index: false } };
  const descrizione = `Aggiungi il tuo messaggio al biglietto di gruppo per ${dati.b.festeggiato}.`;
  return {
    title: dati.b.nome,
    description: descrizione,
    robots: { index: false, follow: false },
    openGraph: { title: dati.b.nome, description: descrizione, type: "website" },
    twitter: { card: "summary_large_image", title: dati.b.nome, description: descrizione },
  };
}

/** Invito (spec 5.1): resa lato server, così l'anteprima del link nelle chat mostra nome e copertina. */
export default async function PaginaBiglietto({ params }: Props) {
  const { slug } = await params;
  const dati = await bigliettoPubblico(slug);
  if (!dati) notFound();
  return (
    <>
      <IntestazioneWizard indietro={null} segmenti={2} percento={0} larghezza="max-w-partecipante" accedi={false} />
      <main className="gutter mx-auto w-full max-w-partecipante pb-16 pt-4">
        <PaginaInvito b={dati.b} hrefFirma={`/b/${slug}/firma`} />
      </main>
    </>
  );
}
