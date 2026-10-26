import type { Metadata } from "next";
import { Revisione } from "@/components/backoffice/Revisione";
import { SoloOrganizzatore } from "@/components/SoloOrganizzatore";

export const metadata: Metadata = { title: "Revisione dei prodotti", robots: { index: false, follow: false } };

export default function PaginaRevisione() {
  return (
    <SoloOrganizzatore>
      <Revisione />
    </SoloOrganizzatore>
  );
}
