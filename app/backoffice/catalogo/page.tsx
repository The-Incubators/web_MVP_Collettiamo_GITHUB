import type { Metadata } from "next";
import { OrdinaCatalogo } from "@/components/backoffice/OrdinaCatalogo";
import { SoloOrganizzatore } from "@/components/SoloOrganizzatore";

export const metadata: Metadata = { title: "Ordine del catalogo", robots: { index: false, follow: false } };

export default function PaginaOrdinaCatalogo() {
  return (
    <SoloOrganizzatore>
      <OrdinaCatalogo />
    </SoloOrganizzatore>
  );
}
