import type { Metadata } from "next";
import { CreaBiglietto, type GruppoBiglietto } from "@/components/biglietto/crea/CreaBiglietto";
import { datiServer } from "@/lib/dati";
import { slugValido } from "@/lib/dominio/slug";

// L'editor a schermo intero, senza intestazione del sito (Gifty UX v2, design.md §8 decisione 2).
export const metadata: Metadata = { title: "Crea un biglietto", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ gruppo?: string }> };

/** Con `?gruppo=<slug>` il biglietto nasce dal regalo di gruppo («Prepara il biglietto», spec §7.7). */
export default async function PaginaNuovoBiglietto({ searchParams }: Props) {
  const { gruppo: slug } = await searchParams;
  let gruppo: GruppoBiglietto | null = null;
  if (slug && slugValido(slug)) {
    const c = await datiServer().colletta(slug).catch(() => null);
    if (c && c.stato !== "bozza") gruppo = { slug, festeggiato: c.festeggiato, occasione: c.occasione };
  }
  return <CreaBiglietto key={gruppo?.slug ?? "solo"} gruppo={gruppo} />;
}
