import type { Metadata } from "next";
import { metaPubblica } from "@/lib/seo";
import { PaginaPsicologiaDelDono } from "@/components/psicologia-del-dono/PaginaPsicologiaDelDono";

/** «Cosa rende un regalo davvero gradito?»: cosa dicono gli studi su chi regala e chi riceve (testo di Stefano, 6 nov). */
export const metadata: Metadata = metaPubblica({
  titolo: "La psicologia del dono",
  descrizione:
    "Perché un regalo è davvero gradito? Cosa dicono gli studi su chi regala e chi riceve: il prezzo conta meno del motivo, purché si veda.",
  percorso: "/psicologia-del-dono",
});

export default function Pagina() {
  return <PaginaPsicologiaDelDono />;
}
