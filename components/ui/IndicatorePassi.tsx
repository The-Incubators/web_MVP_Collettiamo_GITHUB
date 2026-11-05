import Link from "next/link";
import { IconaTratto } from "./IconaTratto";

/**
 * L'indicatore dei passi di Gifty UX v2 (design.md §4): freccia indietro, «2 di 3», tacche (fatte verdi, quella
 * attuale arancio). Sta nel contenuto sotto l'intestazione, mai dentro. La freccia è un link (`indietroHref`) o un
 * pulsante (`onIndietro`); senza nessuno dei due non c'è (il primo passo).
 */
export function IndicatorePassi({
  passo,
  totale,
  indietroHref,
  onIndietro,
  etichettaIndietro = "Torna alla domanda precedente",
}: {
  passo: number;
  totale: number;
  indietroHref?: string;
  onIndietro?: () => void;
  etichettaIndietro?: string;
}) {
  const freccia = <IconaTratto nome="sx" />;
  return (
    <nav className="passi" aria-label="Avanzamento">
      {indietroHref ? (
        <Link className="indietro" href={indietroHref} aria-label={etichettaIndietro}>
          {freccia}
        </Link>
      ) : onIndietro ? (
        <button type="button" className="indietro" onClick={onIndietro} aria-label={etichettaIndietro}>
          {freccia}
        </button>
      ) : null}
      <span className="conta">
        {passo} di {totale}
      </span>
      <span className="tacche" aria-hidden="true">
        {Array.from({ length: totale }, (_, i) => (
          <i key={i} className={i + 1 < passo ? "fatto" : i + 1 === passo ? "ora" : ""} />
        ))}
      </span>
    </nav>
  );
}
