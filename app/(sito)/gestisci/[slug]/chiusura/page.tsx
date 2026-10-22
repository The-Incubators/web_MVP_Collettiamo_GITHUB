import type { Metadata } from "next";
import { SoloOrganizzatore } from "@/components/SoloOrganizzatore";
import { Chiusura } from "@/components/gestione/Chiusura";

export const metadata: Metadata = { title: "Chiusura", robots: { index: false, follow: false } };

export default async function PaginaChiusura({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div className="gutter pb-16 pt-8">
      <SoloOrganizzatore>
        <Chiusura slug={slug} />
      </SoloOrganizzatore>
    </div>
  );
}
