import type { Metadata } from "next";
import { PaginaRegaloDiGruppo } from "@/components/regalo-di-gruppo/PaginaRegaloDiGruppo";

/** Il regalo di gruppo (Gifty-spec-prodotto.md S-06; Gifty UX v2, prototipi/regalo-di-gruppo.html). */
export const metadata: Metadata = {
  title: "Regalo di gruppo",
  description: "Parti dalle adesioni o dal regalo. Il gruppo resta nella vostra chat.",
};

export default function Pagina() {
  return <PaginaRegaloDiGruppo />;
}
