import type { Metadata } from "next";
import { PaginaRegaloDiGruppo } from "@/components/regalo-di-gruppo/PaginaRegaloDiGruppo";

export const dynamic = "force-dynamic";

/**
 * Il regalo di gruppo (Gifty-spec-prodotto.md S-06). Fino al 5 novembre 2026 era la «home classica», una variante
 * della home; ora è la pagina del servizio. Le due partenze (D-05) arrivano con la fase 3.
 */
export const metadata: Metadata = {
  title: "Regalo di gruppo",
  description: "Organizza un regalo di gruppo: un solo link nella chat, e sai sempre chi manca.",
};

export default function Pagina() {
  return <PaginaRegaloDiGruppo />;
}
