import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DettaglioProdotto } from "@/components/DettaglioProdotto";
import { IconaIndietro } from "@/components/ui";
import { datiServer } from "@/lib/dati";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await datiServer().prodotto(slug);
  return p ? { title: p.nome, description: p.descrizione } : { title: "Prodotto non trovato" };
}

/**
 * La pagina intera del prodotto: si vede aprendo il link diretto, ricaricando, o arrivando da fuori.
 * Dal catalogo invece lo stesso contenuto compare in un popup, senza lasciare la pagina
 * (vedi app/(sito)/@modale/(.)prodotto/[slug]/page.tsx).
 */
export default async function SchedaProdottoPagina({ params }: Props) {
  const { slug } = await params;
  const p = await datiServer().prodotto(slug);
  if (!p || !p.attivo) notFound();

  return (
    <div className="gutter pb-16 pt-6">
      <div className="mx-auto flex max-w-catalogo flex-col gap-6">
        <Link href="/catalogo" className="inline-flex min-h-tocco items-center gap-1 self-start text-sm font-medium text-accent-2">
          <IconaIndietro width={16} height={16} /> Torna al catalogo
        </Link>
        <DettaglioProdotto p={p} />
      </div>
    </div>
  );
}
