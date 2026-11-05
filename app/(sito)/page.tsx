import type { Metadata } from "next";
import { PaginaHome } from "@/components/home/Home";

// Le idee in evidenza vengono dal catalogo vero, nell'ordine deciso nell'area riservata.
export const dynamic = "force-dynamic";

// audit H-03
export const metadata: Metadata = { title: { absolute: "Gifty: idee regalo, regali di gruppo e biglietti" } };

/** L'unica home del sito (Gifty-spec-prodotto.md S-01). */
export default function Home() {
  return <PaginaHome />;
}
