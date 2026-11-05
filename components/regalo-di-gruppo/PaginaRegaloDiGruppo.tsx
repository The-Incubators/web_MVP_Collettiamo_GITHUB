import Link from "next/link";
import { ChipTutorial } from "@/components/ChipTutorial";
import { Carta, Iniziali } from "@/components/ui";
import { SLUG_DEMO } from "@/lib/dati/demo";
import { ComeFunziona } from "./ComeFunziona";

/**
 * La pagina del regalo di gruppo (Gifty-spec-prodotto.md S-06; Gifty UX v2, prototipi/regalo-di-gruppo.html): titolo
 * con la pillola del tutorial accanto, poi l'azione; le due partenze (D-05) come due biglietti; «Come funziona», lo stesso della home; in
 * fondo un regalo di gruppo di esempio.
 */
export function PaginaRegaloDiGruppo() {
  return (
    <>
      <section className="apertura">
        <div className="pagina apertura-in">
          <div className="testo">
            <div className="titolo-con-pillola">
              <h1 className="t-pagina">Regalo di gruppo</h1>
              <ChipTutorial href={`/c/${SLUG_DEMO}`} />
            </div>
            <p className="t-titolo sottotitolo">Parti dalle adesioni o dal regalo. Il gruppo resta nella vostra chat.</p>
            <div className="azioni">
              <Link className="btn btn-primario" href="/crea">
                Organizza un regalo di gruppo
              </Link>
            </div>
          </div>
          <div className="partenze" aria-label="Le due partenze">
            <Carta className="partenza">
              <p className="mano">Prima raccolgo le adesioni</p>
              <div className="fila-iniziali" aria-hidden="true">
                <Iniziali testo="AL" tinta={1} />
                <Iniziali testo="GI" tinta={3} />
                <Iniziali testo="FE" tinta={4} />
                <Iniziali />
              </div>
              <p>Proponi una quota a testa e scegliete il regalo dopo.</p>
            </Carta>
            <Carta className="partenza">
              <p className="mano">Ho scelto il regalo</p>
              <div className="ph">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/foto-prodotti/PRD-044.webp" alt="" />
              </div>
              <p>Uno solo, o fino a cinque da votare.</p>
            </Carta>
          </div>
        </div>
      </section>
      <section id="come-funziona" className="sezione scroll-mt-20" aria-labelledby="titolo-come">
        <div className="pagina racconto">
          <div className="testa-sezione">
            <h2 id="titolo-come" className="t-sezione">
              Come funziona
            </h2>
          </div>
          <ComeFunziona />
          <div className="esempio-blocco">
            <h2 className="t-titolo">Un regalo di gruppo già avviato</h2>
            <Link className="btn btn-contorno" href={`/c/${SLUG_DEMO}`}>
              Guarda un regalo di gruppo di esempio
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
