import type { Metadata } from "next";
import Link from "next/link";
import { ChipTutorial } from "@/components/ChipTutorial";
import { ComeLoApre } from "@/components/biglietto/pagina/ComeLoApre";
import { Carta } from "@/components/ui";

/**
 * Biglietto di auguri (Gifty UX v2, design.md §10.4, prototipi/biglietto.html): la scena con parete e tavolo e il
 * biglietto aperto come oggetto principale, poi «Come lo apre Marta» con il telefono che mostra il modo scelto.
 * Da solo o collegato a un regalo di gruppo (D-03, D-19).
 */
export const metadata: Metadata = {
  title: "Biglietto di auguri",
  description: "Un biglietto di auguri che firmano tutti, con dediche e foto, da mandare con un link.",
  robots: { index: true, follow: true },
};

const FOTO = "/biglietto-esempio/";

export default function PaginaBiglietto() {
  return (
    <>
      <section className="scena-b" aria-labelledby="t-big">
        <div className="pagina scena-in">
          <div className="testo-b">
            <div className="titolo-con-pillola">
              <h1 id="t-big" className="t-pagina">
                Biglietto
              </h1>
              <ChipTutorial href="/biglietto/esempio" video />
            </div>
            <p className="riga-b">Lo firmano tutti dal link e lo mandi tu, su WhatsApp.</p>
            <Link className="btn btn-primario" href="/biglietto/nuovo">
              Crea un biglietto
            </Link>
          </div>
          <div className="oggetti" role="img" aria-label="Esempio: un biglietto aperto per Marta, firmato da Chiara, Paolo, Elena e Marco">
            <svg className="nastro-b" viewBox="0 0 1000 200" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 120 C 180 40, 360 190, 560 110 S 860 30, 1000 90" fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
            </svg>
            <Carta className="busta-b" aria-hidden="true">
              <span className="mano">Per Marta</span>
            </Carta>
            <Carta className="aperto" aria-hidden="true">
              <div className="anta anta-sx">
                <p className="titolo-b">Buon compleanno, Marta!</p>
                <p className="dedica">Dall&apos;ufficio, con affetto</p>
                <div className="polaroid">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`${FOTO}sara.jpg`} alt="" />
                  <span className="mano">Sara</span>
                </div>
              </div>
              <div className="anta anta-dx">
                <p className="titolo-b">Buon compleanno, Marta!</p>
                <div className="foglietti">
                  <div className="foglietto-firma c3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`${FOTO}chiara.jpg`} alt="" />
                    Ti pensiamo tutti, oggi più che mai.<span className="chi">Chiara</span>
                  </div>
                  <div className="foglietto-firma c8">
                    Un abbraccio grande da tutto l&apos;ufficio!<span className="chi">Paolo</span>
                  </div>
                  <div className="foglietto-firma c4">
                    Sei una persona speciale. Grazie di esserci.<span className="chi">Elena</span>
                  </div>
                  <div className="foglietto-firma c2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`${FOTO}marco.jpg`} alt="" />
                    La torta la porto io.<span className="chi">Marco</span>
                  </div>
                </div>
              </div>
            </Carta>
            <span className="esempio-b" aria-hidden="true">
              Esempio
            </span>
          </div>
        </div>
      </section>

      <section className="sezione" aria-labelledby="t-apre">
        <ComeLoApre />
      </section>
    </>
  );
}
