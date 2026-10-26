import type { Metadata } from "next";
import { Importa } from "@/components/backoffice/Importa";
import { SoloOrganizzatore } from "@/components/SoloOrganizzatore";

export const metadata: Metadata = { title: "Importa prodotti", robots: { index: false, follow: false } };

export default function PaginaImporta() {
  return (
    <SoloOrganizzatore>
      <Importa />
    </SoloOrganizzatore>
  );
}
