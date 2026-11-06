import type { Metadata } from "next";
import Link from "next/link";
import { TesseraProdotto } from "@/components/TesseraProdotto";
import { IndicatorePassi } from "@/components/ui";
import { datiServer } from "@/lib/dati";
import { GENERI } from "@/lib/regalo/dati";
import { etichettaPer } from "@/lib/regalo/indirizzo";

/**
 * Idee regalo (Gifty UX v2, prototipi/idee.html; spec S-02): la prima domanda di «Trova il regalo» è già qui
 * (decisione 4, I-01), accanto «Sfoglia il catalogo», sotto «Le nostre scelte» dal catalogo vero, nell'ordine curato.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Idee regalo",
  description: "Trova un'idea regalo per qualcuno: rispondi a quattro domande o sfoglia il catalogo.",
};

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
              <IndicatorePassi passo={1} totale={4} />
              <h2 className="t-sezione" id="domanda-per-chi">
                Per chi cerchi un regalo?
              </h2>
              <div className="genere" role="group" aria-labelledby="domanda-per-chi">
                {GENERI.map((g) => (
                  <Link key={g.id} href={`/regalo?per=${g.id}`}>
                    {etichettaPer(g.id)}
                  </Link>
                ))}
              </div>
            </div>
            <div className="blocco-catalogo">
              <div className="collage" aria-hidden="true">
                {COLLAGE.map((src) => (
                  <span key={src}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" />
                  </span>
                ))}
              </div>
              <h2 className="t-titolo">Sfoglia il catalogo</h2>
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
    </div>
  );
}
