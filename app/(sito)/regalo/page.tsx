import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TrovaRegalo } from "@/components/regalo/TrovaRegalo";
import { datiServer } from "@/lib/dati";
import { statoDaParametri } from "@/lib/regalo/indirizzo";
import { contaPassioni } from "@/lib/regalo/punteggio";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Trova il regalo",
  description: "Rispondi a tre domande su chi riceve il regalo, l'occasione e che cosa gli piace: ti mostriamo le idee più adatte.",
};

/**
 * Le domande di «Trova il regalo» dopo la prima (Gifty UX v2, prototipi/domande.html): occasione e interessi. La prima
 * domanda, per chi, sta su /idee (decisione 4): senza risposta lì si torna.
 */
export default async function PaginaRegalo({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const iniziale = statoDaParametri(await searchParams);
  if (!iniziale.genere) redirect("/idee");
  const prodotti = await datiServer().elencaProdotti();
  return (
    <div className="pagina percorso-domande fondo">
      <TrovaRegalo conteggi={contaPassioni(prodotti)} iniziale={{ ...iniziale, tappa: Math.min(iniziale.tappa, 3) }} />
    </div>
  );
}
