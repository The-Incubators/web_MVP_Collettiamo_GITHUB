import type { Metadata } from "next";
import { metaPubblica } from "@/lib/seo";
import { notFound } from "next/navigation";
import { DettaglioProdotto } from "@/components/DettaglioProdotto";
import { SegnaVisto } from "@/components/SegnaVisto";
import { TesseraProdotto } from "@/components/TesseraProdotto";
import { datiServer } from "@/lib/dati";
import { altreIdee } from "@/lib/dominio/catalogoIdee";
import { modoCatalogo } from "@/lib/ux";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await datiServer().prodotto(slug);
  if (!p || !p.attivo) return { title: "Prodotto non trovato", robots: { index: false } };
  // ?modo=gruppo è la stessa scheda: l'indirizzo canonico non ha parametri.
  return metaPubblica({ titolo: p.nome, descrizione: p.descrizione, percorso: `/prodotto/${p.slug}` });
}

/**
 * La scheda prodotto (Gifty UX v2, prototipi/prodotto.html), sempre a pagina intera: la scheda, poi «Altre idee».
 * La nota sul prezzo sta nella scheda, una volta: sotto le altre idee non si ripete.
 */
export default async function PaginaProdotto({ params, searchParams }: Props) {
  const { slug } = await params;
  const v = (await searchParams).modo;
  const gruppo = modoCatalogo(typeof v === "string" ? v : undefined) === "gruppo";
  const dati = datiServer();
  const p = await dati.prodotto(slug);
  if (!p || !p.attivo) notFound();
  const altre = altreIdee(p, await dati.elencaProdotti());

  return (
    <div className="fondo">
      <div className="pagina">
        <DettaglioProdotto p={p} gruppo={gruppo} />
        <SegnaVisto slug={p.slug} />
      </div>
      {altre.length ? (
        <section className="sezione">
          <div className="pagina">
            <div className="testa-sezione">
              <h2 className="t-sezione">Altre idee</h2>
            </div>
            <div className="griglia-prodotti">
              {altre.map((x) => (
                <TesseraProdotto key={x.slug} prodotto={x} gruppo={gruppo} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
