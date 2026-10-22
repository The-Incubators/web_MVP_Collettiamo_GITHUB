import type { Metadata } from "next";
import { ElencoPreferiti } from "@/components/ElencoPreferiti";
import { datiServer } from "@/lib/dati";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Preferiti", robots: { index: false } };

export default async function Preferiti() {
  // Il catalogo si legge sul server; quali prodotti sono preferiti lo sa il browser (o l'account).
  const prodotti = await datiServer().elencaProdotti();
  return (
    <div className="gutter pb-32 pt-6">
      <ElencoPreferiti prodotti={prodotti} />
    </div>
  );
}
