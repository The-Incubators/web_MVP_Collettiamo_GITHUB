"use client";

import { useEffect, useState } from "react";
import { TesseraProdotto } from "@/components/TesseraProdotto";
import { useVistiDiRecente } from "@/lib/vistiDiRecente";
import type { Prodotto } from "@/lib/tipi";

/**
 * «Visti di recente» in home, sopra «Le nostre scelte», e in Idee regalo, sotto (Cri, 6 nov; prototipi/memoria.html): gli ultimi quattro
 * prodotti aperti su questo dispositivo, il più recente per primo. Senza visti la sezione non c'è.
 */
export function VistiDiRecente() {
  const visti = useVistiDiRecente();
  const chiave = visti.join(",");
  const [prodotti, setProdotti] = useState<Prodotto[]>([]);

  useEffect(() => {
    if (!chiave) return void setProdotti([]);
    const ctrl = new AbortController();
    const q = new URLSearchParams(chiave.split(",").map((s) => ["slug", s]));
    fetch(`/api/prodotti?${q}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((r: { prodotti?: Prodotto[] } | null) => setProdotti(r?.prodotti ?? []))
      .catch(() => {});
    return () => ctrl.abort();
  }, [chiave]);

  if (!prodotti.length) return null;
  return (
    <section className="sezione" aria-labelledby="titolo-visti">
      <div className="pagina">
        <div className="testa-sezione">
          <h2 id="titolo-visti" className="t-sezione">
            Visti di recente
          </h2>
        </div>
        <div className="striscia">
          {prodotti.map((p) => (
            <TesseraProdotto key={p.slug} prodotto={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
