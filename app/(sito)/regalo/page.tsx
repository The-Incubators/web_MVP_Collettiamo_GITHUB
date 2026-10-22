// Secondo punto d'ingresso al catalogo: il percorso a domande «Trova il regalo», dentro il layout del sito.
// Il percorso viene da globe-tube-dev.web.app/regalo.html; aspetto di UX_V4, prodotti nostri.

import type { Metadata } from "next";
import { TrovaRegalo } from "@/components/regalo/TrovaRegalo";
import { datiServer } from "@/lib/dati";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Trova il regalo perfetto",
  description:
    "Rispondi a poche domande su chi riceve il regalo, l’occasione e gli interessi: ti mostriamo le idee più adatte, da regalare in gruppo.",
};

export default async function PaginaRegalo() {
  const prodotti = await datiServer().elencaProdotti();

  return (
    <div className="gutter pb-6 pt-4">
      <div className="mx-auto max-w-lg lg:max-w-catalogo">
        <TrovaRegalo prodotti={prodotti} />
        <noscript>
          <p className="mt-4 text-center text-sm">
            Per usare il percorso serve JavaScript. Puoi sempre sfogliare <a href="/catalogo" className="font-bold underline">il catalogo</a>.
          </p>
        </noscript>
      </div>
    </div>
  );
}
