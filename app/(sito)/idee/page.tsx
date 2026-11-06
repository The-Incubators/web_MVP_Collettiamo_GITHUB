import type { Metadata } from "next";
import { metaPubblica } from "@/lib/seo";
import Link from "next/link";
import { TesseraProdotto } from "@/components/TesseraProdotto";
import { VistiDiRecente } from "@/components/home/VistiDiRecente";
import { datiServer } from "@/lib/dati";
import { GENERI } from "@/lib/regalo/dati";
import { etichettaPer } from "@/lib/regalo/indirizzo";

/**
 * Idee regalo (Gifty UX v2, prototipi/idee.html; spec S-02): la prima domanda di «Trova il regalo» è già qui
 * (decisione 4, I-01), accanto «Sfoglia il catalogo»: due riquadri uguali, titolo, una riga, la scelta in fondo (audit
 * di Cri, 6 nov; il «1 di 4» è diventato la riga delle quattro domande), sotto «Le nostre scelte» dal catalogo vero, nell'ordine curato,
 * e poi «Visti di recente» se ce ne sono.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = metaPubblica({
  titolo: "Idee regalo",
  descrizione: "Trova un'idea regalo per qualcuno: rispondi a quattro domande o sfoglia il catalogo.",
  percorso: "/idee",
});

/** Due file da quattro su desktop. */
const IDEE = 8;
/** Le tre foto del riquadro del catalogo (prototipo). */
const COLLAGE = ["/foto-prodotti/PRD-094.webp", "/foto-prodotti/PRD-054.webp", "/foto-prodotti/PRD-004.webp"];

export default async function PaginaIdee() {
  const idee = (await datiServer().elencaProdotti()).slice(0, IDEE);
  return (
    <div className="fondo">
      <section className="apertura-idee">
        <div className="pagina">
          <h1 className="t-pagina">Idee regalo</h1>
          <div className="due">
            <div className="blocco-domanda">
              <h2 className="t-sezione" id="domanda-per-chi">
                Per chi cerchi un regalo?
              </h2>
              <p className="muted">Rispondi a quattro domande e ti mostriamo le idee adatte.</p>
              <div className="genere" role="group" aria-labelledby="domanda-per-chi">
                {GENERI.map((g) => (
                  <Link key={g.id} href={`/regalo?per=${g.id}`}>
                    {etichettaPer(g.id)}
                  </Link>
                ))}
              </div>
            </div>
            <div className="blocco-catalogo">
              <h2 className="t-sezione">Sfoglia il catalogo</h2>
              <p className="muted">Tutti i regali, da filtrare per tema e prezzo.</p>
              <div className="collage" aria-hidden="true">
                {COLLAGE.map((src) => (
                  <span key={src}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" />
                  </span>
                ))}
              </div>
              <Link className="btn btn-contorno" href="/catalogo">
                Apri il catalogo
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className="sezione">
        <div className="pagina">
          <div className="testa-sezione">
            <h2 className="t-sezione">Le nostre scelte</h2>
          </div>
          <div className="griglia-prodotti">
            {idee.map((p) => (
              <TesseraProdotto key={p.slug} prodotto={p} />
            ))}
          </div>
        </div>
      </section>
      {/* sotto «Le nostre scelte», come in home ma dopo: solo se se ne sono visti (Cri, 6 nov) */}
      <VistiDiRecente />
    </div>
  );
}
