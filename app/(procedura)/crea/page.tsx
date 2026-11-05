import type { Metadata } from "next";
import { Suspense } from "react";
import { Crea } from "@/components/wizard/Wizard";
import type { VoceCatalogo } from "@/components/wizard/tipi";
import { datiServer } from "@/lib/dati";
import { temiDelProdotto } from "@/lib/dominio/catalogoIdee";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Organizza un regalo di gruppo", robots: { index: false } };

/**
 * La procedura del regalo di gruppo (Gifty UX v2, design.md §10.1, prototipi/crea.html; spec prodotto §7.2), a tutta
 * pagina. L'accesso si chiede solo al passo 6: la pagina non è protetta all'ingresso. Il catalogo del foglio arriva dal
 * server, nell'ordine curato: chi non ha ancora un account non può leggere i prodotti dal browser.
 */
export default async function PaginaCrea() {
  const prodotti = await datiServer()
    .elencaProdotti()
    .catch(() => []);
  const catalogo: VoceCatalogo[] = prodotti.map((p) => ({
    slug: p.slug,
    prodottoId: p.slug,
    nome: p.nome,
    prezzoCent: p.prezzoCent,
    consegnaGiorni: p.consegnaGiorni,
    urlEsterno: p.urlEsterno,
    immagine: p.immagine,
    temi: temiDelProdotto(p),
  }));
  return (
    <Suspense
      fallback={
        <main className="pagina wizard">
          <p role="status" className="muted attesa">
            Un momento…
          </p>
        </main>
      }
    >
      <Crea catalogo={catalogo} />
    </Suspense>
  );
}
