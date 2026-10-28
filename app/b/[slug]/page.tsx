import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaginaBacheca } from "@/components/biglietto/bacheca/PaginaBacheca";
import { PaginaRivelazione } from "@/components/biglietto/bacheca/PaginaRivelazione";
import { bigliettoPubblico } from "@/lib/biglietti/server";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ anteprima?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const dati = await bigliettoPubblico(slug);
  if (!dati) return { title: "Biglietto non trovato", robots: { index: false } };
  const descrizione =
    dati.b.stato === "consegnato" ? `Un biglietto di gruppo per ${dati.b.festeggiato}: aprilo, è una sorpresa.` : `Aggiungi il tuo messaggio al biglietto di gruppo per ${dati.b.festeggiato}.`;
  return {
    title: dati.b.nome,
    description: descrizione,
    robots: { index: false, follow: false },
    openGraph: { title: dati.b.nome, description: descrizione, type: "website" },
    twitter: { card: "summary_large_image", title: dati.b.nome, description: descrizione },
  };
}

/**
 * Un solo link per tutto: la bacheca per firmare finché il biglietto è aperto, la rivelazione dopo la consegna.
 * `?anteprima=1`: la rivelazione in anteprima, per guardarla prima di consegnare.
 * Resa lato server, così l'anteprima del link nelle chat mostra nome e copertina.
 */
export default async function PaginaBiglietto({ params, searchParams }: Props) {
  const [{ slug }, { anteprima }] = await Promise.all([params, searchParams]);
  const dati = await bigliettoPubblico(slug);
  if (!dati) notFound();
  const consegnato = dati.b.stato === "consegnato";
  return (
    <main className="flex flex-1 flex-col">
      {consegnato || anteprima ? (
        <PaginaRivelazione b={dati.b} firme={dati.firme} anteprima={!consegnato} />
      ) : (
        <PaginaBacheca b={dati.b} firme={dati.firme} />
      )}
    </main>
  );
}
