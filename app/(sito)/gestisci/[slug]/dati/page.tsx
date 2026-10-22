import type { Metadata } from "next";
import { SoloOrganizzatore } from "@/components/SoloOrganizzatore";
import { PaginaDati } from "@/components/gestione/PaginaDati";

export const metadata: Metadata = { title: "Dati", robots: { index: false, follow: false } };

export default async function Dati({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div className="gutter pb-16 pt-8">
      <SoloOrganizzatore>
        <PaginaDati slug={slug} />
      </SoloOrganizzatore>
    </div>
  );
}
