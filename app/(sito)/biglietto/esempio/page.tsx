import type { Metadata } from "next";
import { EsempioBiglietto } from "@/components/biglietto/EsempioBiglietto";

// Un biglietto di esempio, già firmato e consegnato, per chi vuole vederne uno prima di crearlo (dalla home, «Guarda un esempio»).
export const metadata: Metadata = { title: "Esempio di biglietto", robots: { index: false, follow: false } };

export default function PaginaEsempio() {
  return (
    // è la vista del festeggiato: a tutto schermo sopra intestazione e barra del sito (Gifty-architettura-e-flussi.md §1.4)
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-field">
      <EsempioBiglietto />
    </div>
  );
}
