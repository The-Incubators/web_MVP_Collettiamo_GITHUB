import type { Metadata } from "next";
import { SoloOrganizzatore } from "@/components/SoloOrganizzatore";
import { PaginaGruppo } from "@/components/gestione/PaginaGruppo";
import { slugValido } from "@/lib/dominio/slug";
import { bigliettoDelGruppo, catalogoFoglio } from "@/lib/gruppo/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Il tuo regalo di gruppo", robots: { index: false, follow: false } };

/** La pagina di chi organizza (Gifty UX v2, prototipi/gestisci.html). */
export default async function Gestisci({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [catalogo, biglietto] = slugValido(slug) ? await Promise.all([catalogoFoglio(), bigliettoDelGruppo(slug)]) : [[], null];
  return (
    <SoloOrganizzatore>
      <PaginaGruppo slug={slug} catalogo={catalogo} biglietto={biglietto} />
    </SoloOrganizzatore>
  );
}
