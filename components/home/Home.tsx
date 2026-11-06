import Link from "next/link";
import { ChipTutorial } from "@/components/ChipTutorial";
import { ComeFunziona } from "@/components/regalo-di-gruppo/ComeFunziona";
import { TesseraProdotto } from "@/components/TesseraProdotto";
import { Carta } from "@/components/ui";
import { datiServer } from "@/lib/dati";
import { SLUG_DEMO } from "@/lib/dati/demo";
import { ScenaHero } from "./ScenaHero";

/**
 * L'unica home del sito (Gifty-spec-prodotto.md S-01; Gifty UX v2, docs/specs/gifty-ux-v2/prototipi/home.html):
 * la scena con il biglietto scritto e le tre porte sul bordo del tavolo, «Le nostre scelte» dal catalogo vero, poi
 * «Come funziona il regalo di gruppo» con i cinque passi e un'azione sotto.
 */

/** Quante idee mostra la home: una fila da quattro su desktop, a scorrimento sul telefono. */
const IDEE_IN_HOME = 4;


function Porte() {
  return (
    <div className="pagina">
      <div className="porte">
        <article className="porta">
          <div className="segno" aria-hidden="true">
            <div className="mini-ini">
              <span style={{ background: "var(--c1)" }} />
              <span style={{ background: "var(--c3)" }} />
              <span style={{ background: "var(--c4)" }} />
              <span style={{ background: "var(--c2)" }} />
            </div>
          </div>
          <h2>Regalo di gruppo</h2>
          <p>Raccogli le adesioni dalla chat, scegli il regalo e segna chi ti ha rimborsato.</p>
          <Link className="btn btn-primario" href="/crea">
            Organizza un regalo di gruppo
          </Link>
        </article>
        <article className="porta">
          <div className="segno" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/foto-prodotti/PRD-058.webp" alt="" />
          </div>
          <h2>Idee regalo</h2>
          <p>Rispondi a quattro domande o sfoglia il catalogo che curiamo noi.</p>
          <Link className="btn btn-primario" href="/idee">
            Trova un&apos;idea regalo
          </Link>
        </article>
        <article className="porta">
          <div className="segno" aria-hidden="true">
            <Carta className="mini-carta">
              <span className="mano">Auguri!</span>
            </Carta>
          </div>
          <h2>Biglietto</h2>
          <p>Lo firmano tutti dal link e il festeggiato lo apre sul telefono.</p>
          <Link className="btn btn-primario" href="/biglietto/nuovo">
            Crea un biglietto
          </Link>
        </article>
      </div>
    </div>
  );
}

/** La home; le idee vengono dal catalogo vero, nell'ordine deciso nell'area riservata. */
export async function PaginaHome() {
  const idee = (await datiServer().elencaProdotti()).slice(0, IDEE_IN_HOME);

  return (
    <>
      <section className="hero" aria-labelledby="titolo-hero">
        <div className="pagina hero-testo">
          <h1 id="titolo-hero" className="t-hero">
            Scegli il regalo di gruppo e tieni il conto delle quote
          </h1>
        </div>
        <ScenaHero />
        <Porte />
      </section>

      {idee.length ? (
        <section className="sezione" aria-labelledby="titolo-idee">
          <div className="pagina">
            <div className="testa-sezione">
              <h2 id="titolo-idee" className="t-sezione">
                Le nostre scelte
              </h2>
              <Link className="btn btn-contorno" href="/catalogo">
                Vedi il catalogo
              </Link>
            </div>
            <div className="striscia">
              {idee.map((p) => (
                <TesseraProdotto key={p.slug} prodotto={p} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="sezione" aria-labelledby="titolo-come">
        <div className="pagina racconto">
          <div className="testa-sezione titolo-con-pillola">
            <h2 id="titolo-come" className="t-sezione">
              Come funziona il regalo di gruppo
            </h2>
            <ChipTutorial href={`/c/${SLUG_DEMO}`} />
          </div>
          <ComeFunziona />
          <Link className="btn btn-primario percorso-cta" href="/crea">
            Organizza un regalo di gruppo
          </Link>
        </div>
      </section>
    </>
  );
}
