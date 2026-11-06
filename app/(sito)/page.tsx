import type { Metadata } from "next";
import { metaPubblica } from "@/lib/seo";
import { PaginaHome } from "@/components/home/Home";

// Le idee in evidenza vengono dal catalogo vero, nell'ordine deciso nell'area riservata.
export const dynamic = "force-dynamic";

// audit H-03
const meta = metaPubblica({
  titolo: "Gifty: idee regalo, regali di gruppo e biglietti",
  descrizione:
    "Trova un’idea regalo, organizza un regalo di gruppo con un solo link e crea un biglietto di auguri da firmare insieme.",
  percorso: "/",
});
export const metadata: Metadata = { ...meta, title: { absolute: "Gifty: idee regalo, regali di gruppo e biglietti" } };

/** L'unica home del sito (Gifty-spec-prodotto.md S-01). */
export default function Home() {
  return <PaginaHome />;
}
