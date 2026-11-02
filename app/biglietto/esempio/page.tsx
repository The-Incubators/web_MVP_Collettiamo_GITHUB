import type { Metadata } from "next";
import { EsempioBiglietto } from "@/components/biglietto/EsempioBiglietto";

// Un biglietto di esempio, già firmato e consegnato, per chi vuole vederne uno prima di crearlo (dalla home, «Guarda un esempio»).
export const metadata: Metadata = { title: "Esempio di biglietto", robots: { index: false, follow: false } };

export default function PaginaEsempio() {
  return (
    <main className="flex flex-1 flex-col">
      <EsempioBiglietto />
    </main>
  );
}
