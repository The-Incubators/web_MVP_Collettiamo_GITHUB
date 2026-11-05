import type { Metadata } from "next";
import { EsempioBiglietto } from "@/components/biglietto/EsempioBiglietto";

// Il biglietto di esempio, come lo apre il festeggiato: senza intestazione del sito (design.md §5, «Apertura»).
export const metadata: Metadata = { title: "Esempio di biglietto", robots: { index: false, follow: false } };

export default function PaginaEsempio() {
  return <EsempioBiglietto />;
}
