import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IntestazioneWizard } from "@/components/biglietto/comuni";
import { PaginaGrazie } from "@/components/biglietto/firma/PaginaGrazie";
import { bigliettoPubblico } from "@/lib/biglietti/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Grazie!", robots: { index: false, follow: false } };

export default async function PaginaGrazieBiglietto({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ f?: string }> }) {
  const { slug } = await params;
  const { f } = await searchParams;
  const dati = await bigliettoPubblico(slug);
  if (!dati) notFound();
  const firmaId = typeof f === "string" && /^[a-f0-9]{24}$/.test(f) ? f : null;
  return (
    <>
      <IntestazioneWizard indietro={null} segmenti={2} percento={100} larghezza="max-w-partecipante" accedi={false} />
      <main className="gutter mx-auto w-full max-w-partecipante pb-16 pt-4">
        <PaginaGrazie b={dati.b} firme={dati.firme} firmaId={firmaId} />
      </main>
    </>
  );
}
