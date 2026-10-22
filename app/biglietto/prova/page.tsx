import type { Metadata } from "next";
import { ProvaBiglietto } from "@/components/biglietto/ProvaBiglietto";
import { IntestazioneWizard } from "@/components/biglietto/comuni";

// Pagina di prova interna (fase 1): mostra copertina e impaginazione con messaggi finti. Non in produzione.
export const metadata: Metadata = { title: "Prova biglietto", robots: { index: false, follow: false } };

export default function PaginaProva() {
  return (
    <>
      <IntestazioneWizard indietro="/" accedi={false} larghezza="max-w-dashboard" />
      <div className="gutter py-8">
        <ProvaBiglietto />
      </div>
    </>
  );
}
