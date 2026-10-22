import type { Metadata } from "next";
import { SoloOrganizzatore } from "@/components/SoloOrganizzatore";
import { Dashboard } from "@/components/gestione/Dashboard";

export const metadata: Metadata = { title: "La tua raccolta", robots: { index: false, follow: false } };

export default async function Gestisci({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div className="gutter pb-16 pt-8">
      <SoloOrganizzatore>
        <Dashboard slug={slug} />
      </SoloOrganizzatore>
    </div>
  );
}
