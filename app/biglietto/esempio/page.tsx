import type { Metadata } from "next";
import { EsempioBiglietto } from "@/components/biglietto/EsempioBiglietto";
import { IntestazioneWizard } from "@/components/biglietto/comuni";

// Un biglietto di esempio, già firmato, per chi vuole vederne uno prima di crearlo (dalla home, «Guarda un esempio»).
export const metadata: Metadata = { title: "Esempio di biglietto", robots: { index: false, follow: false } };

export default function PaginaEsempio() {
  return (
    <>
      <IntestazioneWizard indietro="/" accedi={false} />
      <main className="gutter pb-10 pt-4">
        <EsempioBiglietto />
      </main>
    </>
  );
}
