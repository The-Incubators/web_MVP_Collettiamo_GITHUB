import type { Metadata } from "next";
import { CreaBiglietto } from "@/components/biglietto/crea/CreaBiglietto";

// L'editor a schermo intero, senza intestazione del sito (Gifty UX v2, design.md §8 decisione 2).
export const metadata: Metadata = { title: "Crea un biglietto", robots: { index: false, follow: false } };

export default function PaginaNuovoBiglietto() {
  return <CreaBiglietto />;
}
