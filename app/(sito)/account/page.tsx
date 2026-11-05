import type { Metadata } from "next";
import { MioAccount } from "@/components/account/MioAccount";
import { SoloOrganizzatore } from "@/components/SoloOrganizzatore";
import { datiServer } from "@/lib/dati";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Il mio account", robots: { index: false } };

/** Il mio account (design.md §10.2): il catalogo si legge sul server, quali prodotti sono preferiti lo sa l'account. */
export default async function Account() {
  const prodotti = await datiServer()
    .elencaProdotti()
    .catch(() => []);
  return (
    <SoloOrganizzatore>
      <MioAccount prodotti={prodotti} />
    </SoloOrganizzatore>
  );
}
