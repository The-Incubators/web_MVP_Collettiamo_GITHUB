import type { Metadata } from "next";
import Link from "next/link";
import { DICHIARAZIONE_AFFILIATO_AMAZON, NOTA_PREZZI } from "@/lib/dominio/amazon";

export const metadata: Metadata = { title: "Termini e condizioni" };

/**
 * Termini e condizioni (revisione di Cri, 5 novembre 2026): qui sta la dichiarazione di affiliazione Amazon, tolta dal
 * piè di pagina. Dice solo quello che il sito fa davvero (DECISIONI.md, sezioni 6 e 15; pagina Privacy). Il titolare
 * non è ancora deciso (P-07, Gifty-spec-prodotto.md): finché non lo è, la pagina non lo nomina.
 */
const BLOCCHI: { titolo: string; testi: string[] }[] = [
  {
    titolo: "Che cosa fa Gifty",
    testi: ["Gifty ti aiuta a trovare un regalo, a organizzare un regalo di gruppo e a creare un biglietto di auguri da firmare insieme."],
  },
  {
    titolo: "I soldi",
    testi: ["Non passano mai da Gifty: ognuno paga la sua quota direttamente a chi organizza, con i metodi che ha indicato. Non conserviamo dati di pagamento."],
  },
  {
    titolo: "Acquisti su Amazon",
    testi: ["I prodotti del catalogo si comprano su Amazon.it, non su Gifty.", NOTA_PREZZI],
  },
  {
    titolo: "Affiliazione Amazon",
    testi: [DICHIARAZIONE_AFFILIATO_AMAZON],
  },
];

export default function Termini() {
  return (
    <div className="pagina fondo">
      <article className="testo-legale">
        <h1 className="t-pagina">Termini e condizioni</h1>
        {BLOCCHI.map((b) => (
          <section key={b.titolo}>
            <h2 className="t-titolo">{b.titolo}</h2>
            {b.testi.map((t) => (
              <p key={t}>{t}</p>
            ))}
          </section>
        ))}
        <section>
          <h2 className="t-titolo">I tuoi dati</h2>
          <p>Che cosa conserviamo e perché lo trovi nella pagina sulla privacy.</p>
          <Link className="btn btn-quieto" href="/privacy">
            Privacy e dati
          </Link>
        </section>
      </article>
    </div>
  );
}
