import type { Metadata } from "next";
import { PaginaHome } from "@/components/home/Home";

export const dynamic = "force-dynamic";

/**
 * La home di prima, tutta sul regalo di gruppo: ci porta «Organizza un regalo di gruppo» della home nuova.
 * Non indicizzata: se `HOME_ATTIVA` torna "classica", la stessa pagina è anche su «/».
 */
export const metadata: Metadata = { title: "Regalo di gruppo", robots: { index: false, follow: false } };

export default function PaginaRegaloDiGruppo() {
  return <PaginaHome versione="classica" />;
}
