import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaginaBacheca } from "@/components/biglietto/bacheca/PaginaBacheca";
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

/** La bacheca di chi firma: resa lato server, così l'anteprima del link nelle chat mostra nome e copertina. */
export default async function PaginaBiglietto({ params }: Props) {
  const { slug } = await params;
  const dati = await bigliettoPubblico(slug);
  if (!dati) notFound();
  return (
    <main className="flex flex-1 flex-col">
      <PaginaBacheca b={dati.b} firme={dati.firme} />
    </main>
  );
}
