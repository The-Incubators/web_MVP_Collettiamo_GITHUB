import { notFound } from "next/navigation";
import { DettaglioProdotto } from "@/components/DettaglioProdotto";
import { PopupProdotto } from "@/components/PopupProdotto";
import { datiServer } from "@/lib/dati";
import { modoCatalogo } from "@/lib/ux";

export const dynamic = "force-dynamic";

/**
 * Rotta intercettata: cliccando un prodotto dentro il sito, l'indirizzo diventa /prodotto/<slug> ma al
 * posto di cambiare pagina si apre un popup sopra quella dov'eri. Lo stesso indirizzo aperto da fuori,
 * o ricaricato, mostra la pagina intera (app/(sito)/prodotto/[slug]/page.tsx): il link resta condivisibile.
 */
export default async function PopupSchedaProdotto({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const v = (await searchParams).modo;
  const modo = modoCatalogo(typeof v === "string" ? v : undefined);
  const p = await datiServer().prodotto(slug);
  if (!p || !p.attivo) notFound();

  return (
    <PopupProdotto titolo={p.nome}>
      <DettaglioProdotto p={p} modo={modo} comeTitolo="h2" />
    </PopupProdotto>
  );
}
