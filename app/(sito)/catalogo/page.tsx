import type { Metadata } from "next";
import { metaPubblica } from "@/lib/seo";
import Link from "next/link";
import { FiltriCatalogo } from "@/components/FiltriCatalogo";
import { TesseraProdotto } from "@/components/TesseraProdotto";
import { datiServer } from "@/lib/dati";
import { filtraCatalogo, hrefCatalogo, leggiFiltriCatalogo } from "@/lib/dominio/catalogoIdee";
import { modoCatalogo } from "@/lib/ux";

export const dynamic = "force-dynamic";

export const metadata: Metadata = metaPubblica({
  titolo: "Catalogo di idee regalo",
  descrizione: "Le nostre idee regalo, per tema e per prezzo.",
  percorso: "/catalogo",
});

/** Quante idee si mostrano all'inizio e a ogni «Mostra altre idee». */
const PER_PAGINA = 24;

/**
 * Il catalogo di Idee regalo (Gifty UX v2, prototipi/catalogo.html): temi a chip, fasce di prezzo a segmenti, ordine
 * curato come predefinito (I-06), tessere, nota sui prezzi una volta (I-09). Filtri e pagina nell'indirizzo.
 *
 * `?modo=gruppo` è il catalogo aperto dal wizard del regalo di gruppo (lib/ux.ts): la stessa tessera, con «Scegli questo
 * regalo» e «Aggiungi al voto» al posto delle azioni di Idee regalo (G-04).
 */
export default async function Catalogo({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const prendi = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const filtri = leggiFiltriCatalogo(prendi("tema"), prendi("fascia"));
  const gruppo = modoCatalogo(prendi("modo")) === "gruppo";
  const modo = gruppo ? "gruppo" : undefined;
  const mostra = Math.max(PER_PAGINA, Math.floor(Number(prendi("mostra"))) || PER_PAGINA);
  const prodotti = filtraCatalogo(await datiServer().elencaProdotti(), filtri);
  const visibili = prodotti.slice(0, mostra);
  const resto = prodotti.length - visibili.length;

  return (
    <div className="pagina fondo">
      <div className="testa-elenco">
        <h1 className="t-pagina">Catalogo</h1>
        <FiltriCatalogo attivi={filtri} modo={modo} />
      </div>
      {prodotti.length === 0 ? (
        <div className="vuoto-griglia">
          <p>Nessun regalo con questi filtri.</p>
          <Link className="btn btn-quieto" href={hrefCatalogo({ modo })} scroll={false}>
            Azzera i filtri
          </Link>
        </div>
      ) : (
        <div className="griglia-prodotti">
          {visibili.map((p) => (
            <TesseraProdotto key={p.slug} prodotto={p} gruppo={gruppo} />
          ))}
        </div>
      )}
      {resto > 0 ? (
        <div className="altre-idee">
          <Link className="btn btn-quieto" href={hrefCatalogo({ ...filtri, modo, mostra: mostra + PER_PAGINA })} scroll={false}>
            Mostra altre {Math.min(PER_PAGINA, resto)} idee
          </Link>
        </div>
      ) : null}
    </div>
  );
}
