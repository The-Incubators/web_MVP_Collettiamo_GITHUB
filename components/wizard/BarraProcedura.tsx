"use client";

import Link from "next/link";
import { IconaTratto } from "@/components/ui";

/**
 * La sola barra della procedura a tutta pagina (design.md §10.1, decisione 1; prototipi/crea.html `.barra-proc`):
 * indietro, «Passo n di N» con la barra di avanzamento, X per uscire. Dopo la creazione dice «Regalo di gruppo creato»
 * e la X porta alla pagina del gruppo.
 */
export function BarraProcedura(
  props:
    | { passo: { n: number; totale: number }; onIndietro: (() => void) | null; onEsci: () => void }
    | { creato: true; hrefChiudi: string },
) {
  return (
    <header className="barra-proc">
      <div className="barra-proc-in">
        {"creato" in props ? (
          <>
            <span />
            <div className="dove">
              <span>Regalo di gruppo creato</span>
            </div>
            <Link className="icona-btn" href={props.hrefChiudi} aria-label="Chiudi e vai al regalo di gruppo">
              <IconaTratto nome="chiudi" />
            </Link>
          </>
        ) : (
          <>
            <button type="button" className="icona-btn" onClick={props.onIndietro ?? undefined} aria-label="Torna al passo precedente" hidden={!props.onIndietro}>
              <IconaTratto nome="sx" />
            </button>
            <div className="dove">
              <span>
                Passo {props.passo.n} di {props.passo.totale}
              </span>
              <span
                className="avanzamento"
                role="progressbar"
                aria-label="Avanzamento"
                aria-valuemin={0}
                aria-valuemax={props.passo.totale}
                aria-valuenow={props.passo.n}
              >
                <i style={{ width: `${(props.passo.n / props.passo.totale) * 100}%` }} />
              </span>
            </div>
            <button type="button" className="icona-btn" onClick={props.onEsci} aria-label="Esci, la bozza resta">
              <IconaTratto nome="chiudi" />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
