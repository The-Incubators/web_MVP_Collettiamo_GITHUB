import type { Metadata } from "next";
import { metaPubblica } from "@/lib/seo";
import { PaginaRegaloDiGruppo } from "@/components/regalo-di-gruppo/PaginaRegaloDiGruppo";

/** Il regalo di gruppo (Gifty-spec-prodotto.md S-06; Gifty UX v2, prototipi/regalo-di-gruppo.html). */
export const metadata: Metadata = metaPubblica({
  titolo: "Regalo di gruppo",
  descrizione: "Organizza un regalo di gruppo con un link nella chat: chi vuole aderisce e tu tieni il conto delle quote.",
  percorso: "/regalo-di-gruppo",
});

export default function Pagina() {
  return <PaginaRegaloDiGruppo />;
}
