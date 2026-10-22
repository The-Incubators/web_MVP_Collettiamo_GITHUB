import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IntestazioneWizard } from "@/components/biglietto/comuni";
import { PaginaFirma } from "@/components/biglietto/firma/PaginaFirma";
import { librerieAttive } from "@/lib/biglietti/librerie";
import { bigliettoPubblico } from "@/lib/biglietti/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Firma il biglietto", robots: { index: false, follow: false } };

export default async function PaginaFirmaBiglietto({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dati = await bigliettoPubblico(slug);
  if (!dati) notFound();
  return (
    <>
      <IntestazioneWizard indietro={`/b/${slug}`} segmenti={2} percento={50} larghezza="max-w-partecipante" accedi={false} />
      <main className="gutter mx-auto w-full max-w-partecipante pb-16 pt-4">
        <PaginaFirma b={dati.b} firme={dati.firme} librerie={librerieAttive()} />
      </main>
    </>
  );
}
