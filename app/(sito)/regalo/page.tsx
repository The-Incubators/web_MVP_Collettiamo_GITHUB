import type { Metadata } from "next";
import { NON_INDICIZZARE } from "@/lib/seo";
import { redirect } from "next/navigation";
import { TrovaRegalo } from "@/components/regalo/TrovaRegalo";
import { datiServer } from "@/lib/dati";
import { statoDaParametri } from "@/lib/regalo/indirizzo";
import { FASCE_ETA_DOMANDA } from "@/lib/regalo/dati";
import { contaPassioni, perEta } from "@/lib/regalo/punteggio";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Trova il regalo",
  description: "Rispondi a quattro domande su chi riceve il regalo, quanti anni ha, l'occasione e che cosa gli piace: ti mostriamo le idee più adatte.",
  robots: NON_INDICIZZARE,
};

/**
 * Le domande di «Trova il regalo» dopo la prima (Gifty UX v2, prototipi/domande.html): età, occasione e interessi. La prima
 * domanda, per chi, sta su /idee (decisione 4): senza risposta lì si torna.
 */
export default async function PaginaRegalo({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const iniziale = statoDaParametri(await searchParams);
  if (!iniziale.genere) redirect("/idee");
  const prodotti = await datiServer().elencaProdotti();
  const conteggiPerEta = Object.fromEntries(
    [["", contaPassioni(prodotti)], ...FASCE_ETA_DOMANDA.map((f) => [f.id, contaPassioni(perEta(prodotti, f.id))])],
  );
  return (
    <div className="pagina percorso-domande fondo">
      <TrovaRegalo conteggiPerEta={conteggiPerEta} iniziale={{ ...iniziale, tappa: Math.min(iniziale.tappa, 4) }} />
    </div>
  );
}
