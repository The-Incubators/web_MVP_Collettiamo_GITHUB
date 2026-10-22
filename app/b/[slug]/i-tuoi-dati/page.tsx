import type { Metadata } from "next";
import { IntestazioneWizard } from "@/components/biglietto/comuni";
import { PaginaDati } from "@/components/biglietto/firma/PaginaDati";

export const metadata: Metadata = { title: "I tuoi dati", robots: { index: false, follow: false } };

export default async function PaginaTuoiDati({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <>
      <IntestazioneWizard indietro={`/b/${slug}/firma`} segmenti={2} percento={100} larghezza="max-w-partecipante" accedi={false} />
      <main className="gutter mx-auto w-full max-w-partecipante pb-16 pt-4">
        <PaginaDati slug={slug} />
      </main>
    </>
  );
}
