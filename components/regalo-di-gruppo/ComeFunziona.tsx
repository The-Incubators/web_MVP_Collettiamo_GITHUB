import type { ReactNode } from "react";
import { Carta, Iniziali } from "@/components/ui";

/**
 * «Come funziona il regalo di gruppo» (design.md §5, G-16; prototipi/comuni.js `montaRacconto`): i cinque passi tutti
 * visibili, uniti dal nastro arancio (orizzontale da 900 px, verticale sul telefono), ognuno con chi lo fa, una scena e
 * una frase. Uguale in home e nella pagina del regalo di gruppo. Le scene sono un esempio e sono nascoste ai lettori di
 * schermo, tranne la foto della consegna, che ha la sua descrizione.
 */
const PASSI: { titolo: string; testo: string; scena: ReactNode; descrizione?: string }[] = [
  {
    titolo: "Giulia apre il regalo per Mauro",
    testo: "Decide se raccogliere prima le adesioni, scegliere lei il regalo o farne votare qualcuno.",
    scena: (
      <Carta className="foglietto partenze-p">
        <p className="mano">Il regalo per Mauro</p>
        <span className="opz on">
          <i />
          Prima le adesioni
        </span>
        <span className="opz">
          <i />
          Ho già il regalo
        </span>
        <span className="opz">
          <i />
          Ne votiamo tre
        </span>
      </Carta>
    ),
  },
  {
    titolo: "Manda il link nella chat",
    testo: "Lo incolla nel gruppo WhatsApp che avete già. Chi partecipa aderisce, vede la sua quota e, se serve, vota.",
    scena: (
      <div className="chat">
        <div className="fumetto">
          Facciamo il regalo a Mauro? <b>gifty.it/c/mauro</b>
        </div>
        <div className="posti">
          {([1, 2, 3, 4] as const).map((t) => (
            <span key={t} className={`iniziali c${t}`} />
          ))}
          {Array.from({ length: 6 }, (_, i) => (
            <Iniziali key={i} />
          ))}
        </div>
        <p className="t-piccolo muted">4 su 10 hanno aderito</p>
      </div>
    ),
  },
  {
    titolo: "Tutti firmano il biglietto",
    testo: "Ognuno scrive il suo messaggio dal link, anche con una foto.",
    scena: (
      <Carta className="foglietto">
        <p className="mano">Buon compleanno, Mauro!</p>
        <p className="t-piccolo">
          Ti aspettiamo al campetto. <span className="muted">Luca</span>
        </p>
        <p className="t-piccolo">
          Cento di questi giri in bici. <span className="muted">Sara</span>
        </p>
      </Carta>
    ),
  },
  {
    titolo: "Giulia compra e consegna il regalo",
    testo: "Lo compra lei, su Amazon o dove preferisce, e lo dà a Mauro con il biglietto.",
    descrizione: "Il biglietto con il pacco regalo",
    scena: <div className="foto-consegna" />,
  },
  {
    titolo: "Gli altri le rimborsano la quota",
    testo: "Con PayPal, Satispay o bonifico. Giulia segna chi ha pagato e con un tocco ricorda la quota a chi manca.",
    scena: (
      <div className="mini-registro">
        <div>
          <Iniziali testo="LU" tinta={2} />
          Luca<span className="stato-r ok">ricevuto</span>
        </div>
        <div>
          <Iniziali testo="SA" tinta={3} />
          Sara<span className="stato-r ok">ricevuto</span>
        </div>
        <div>
          <Iniziali testo="DA" tinta={4} />
          Davide<span className="stato-r">da ricevere</span>
        </div>
      </div>
    ),
  },
];

export function ComeFunziona() {
  return (
    <ol className="percorso" aria-label="Come funziona il regalo di gruppo">
      {PASSI.map((p, i) => (
        <li key={p.titolo} className="passo-p">
          <span className="n" aria-hidden="true">
            {i + 1}
          </span>
          {p.descrizione ? (
            <div className="scena-p" role="img" aria-label={p.descrizione}>
              {p.scena}
            </div>
          ) : (
            <div className="scena-p" aria-hidden="true">
              {p.scena}
            </div>
          )}
          <h3 className="t-titolo">{p.titolo}</h3>
          <p>{p.testo}</p>
        </li>
      ))}
    </ol>
  );
}
