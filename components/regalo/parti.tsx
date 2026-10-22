// I pezzi del percorso «Trova il regalo»: solo aspetto, nessuno stato.
// Markup, classi e ruoli di accessibilità sono quelli del percorso di partenza (js/gift-finder/components.js).

import { ICONE } from "@/lib/regalo/icone-material";
import { INTERESSI, MAX_INTERESSI, MIN_INTERESSI, TAPPE, type Interesse } from "@/lib/regalo/dati";
import { puoAndareA, type StatoRicerca } from "@/lib/regalo/stato";

export function Icona({ nome }: { nome: string }) {
  return (
    <svg className="gf-icon" viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true" focusable="false">
      <path d={ICONE[nome] ?? ""} />
    </svg>
  );
}

/** La tappa corrente porta aria-current="step"; da quelle già completate si torna indietro con un clic. */
export function Avanzamento({ stato, vaiA }: { stato: StatoRicerca; vaiA: (tappa: number) => void }) {
  return (
    <nav className="gf-stepper-wrap" aria-label="Avanzamento della ricerca">
      <ol className="gf-stepper">
        {TAPPE.map((tappa) => {
          const attiva = tappa.id === stato.tappa;
          const completata = tappa.id < stato.tappa;
          const corpo = (
            <>
              <span className="gf-step-circle">
                <Icona nome={completata ? "check" : tappa.icona} />
              </span>
              <span className="gf-step-label">
                {tappa.etichetta}
                {completata ? <span className="gf-sr"> (completato)</span> : null}
              </span>
            </>
          );
          return (
            <li key={tappa.id} className="gf-step" data-status={attiva ? "active" : completata ? "completed" : "inactive"}>
              {completata && puoAndareA(stato, tappa.id) ? (
                <button type="button" className="gf-step-body" onClick={() => vaiA(tappa.id)}>
                  {corpo}
                </button>
              ) : (
                <span className="gf-step-body" aria-current={attiva ? "step" : undefined}>
                  {corpo}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** tono="verde" per i tab delle categorie; `conteggio` è quanti elementi sono già scelti dentro. */
export function Chip({
  etichetta,
  scelto,
  tono,
  conteggio = 0,
  onClick,
}: {
  etichetta: string;
  scelto: boolean;
  tono?: "verde";
  conteggio?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`gf-chip${tono === "verde" ? " gf-chip-green" : ""}`}
      aria-pressed={scelto}
      onClick={onClick}
    >
      {scelto ? <Icona nome="check" /> : null}
      <span>{etichetta}</span>
      {conteggio ? (
        <span className="gf-badge">
          {conteggio}
          <span className="gf-sr"> selezionati</span>
        </span>
      ) : null}
    </button>
  );
}

/** Cerchio con icona ed etichetta sotto (genere, interessi). */
export function SceltaCerchio({
  etichetta,
  icona,
  scelto,
  grande,
  onClick,
}: {
  etichetta: string;
  icona: string;
  scelto: boolean;
  grande?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`gf-choice${grande ? " gf-choice-large" : ""}`}
      aria-pressed={scelto}
      data-selected={scelto}
      onClick={onClick}
    >
      <span className="gf-choice-circle">
        <Icona nome={icona} />
        {scelto ? (
          <span className="gf-choice-check">
            <Icona nome="check" />
          </span>
        ) : null}
      </span>
      <span className="gf-choice-label">{etichetta}</span>
    </button>
  );
}

export function SchedaOccasione({
  etichetta,
  icona,
  scelta,
  onClick,
}: {
  etichetta: string;
  icona: string;
  scelta: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className="gf-occasion" aria-pressed={scelta} onClick={onClick}>
      <Icona nome={icona} />
      <span>{etichetta}</span>
      {scelta ? (
        <span className="gf-occasion-check">
          <Icona nome="check" />
        </span>
      ) : null}
    </button>
  );
}

/** Capsula con cinque caselle: quelle piene mostrano l'icona e un pulsante per togliere l'interesse. */
export function RiepilogoScelte({ stato, togli }: { stato: StatoRicerca; togli: (id: string) => void }) {
  const caselle = Array.from({ length: MAX_INTERESSI }, (_, indice) => {
    const id = stato.interessi[indice];
    return { indice, interesse: id ? INTERESSI.find((x: Interesse) => x.id === id) : undefined };
  });
  return (
    <div className="gf-summary">
      <ul className="gf-slots" aria-label="Interessi selezionati">
        {caselle.map(({ indice, interesse }) =>
          interesse ? (
            <li key={interesse.id} className="gf-slot filled">
              <span className="gf-slot-icon" title={interesse.etichetta}>
                <Icona nome={interesse.icona} />
                <span className="gf-sr">{interesse.etichetta}</span>
              </span>
              <button
                type="button"
                className="gf-slot-remove"
                aria-label={`Rimuovi ${interesse.etichetta}`}
                onClick={() => togli(interesse.id)}
              >
                <Icona nome="x" />
              </button>
            </li>
          ) : (
            <li key={`vuota-${indice}`} className="gf-slot" aria-hidden="true" />
          ),
        )}
      </ul>
      <p className="gf-count">
        {stato.interessi.length} di {MAX_INTERESSI} · minimo {MIN_INTERESSI}
      </p>
    </div>
  );
}
