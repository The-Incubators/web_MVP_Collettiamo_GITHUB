// I pezzi del percorso «Trova il regalo»: solo aspetto, nessuno stato. Disegno di UX_V4.
// Le icone restano quelle SVG del percorso di partenza (Material Symbols, lib/regalo/icone-material.ts):
// sono 53 disegni e non passano dal font delle icone del sito.

import { Icona as IconaSito } from "@/components/ui/Icona";
import { ICONE } from "@/lib/regalo/icone-material";
import { TAPPE } from "@/lib/regalo/dati";
import { puoAndareA, type StatoRicerca } from "@/lib/regalo/stato";

export function Icona({ nome, className = "h-6 w-6" }: { nome: string; className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true" focusable="false">
      <path d={ICONE[nome] ?? ""} />
    </svg>
  );
}

/** Dove l'intestazione del sito (app/(sito)/layout.tsx) lascia il posto ai passi del percorso. */
export const ID_POSTO_PASSI = "intestazione-passi";

/**
 * I passi, piccoli, nell'intestazione accanto al logo: tre tondi numerati uniti da una linea, poi il regalo (i risultati).
 * Fatti: verdi con la spunta, e con un tocco si torna lì a cambiare la risposta. Quello in corso: arancio, con un alone.
 * Sotto, il nome del passo in corso (non sui risultati).
 */
export function Avanzamento({ stato, vaiA }: { stato: StatoRicerca; vaiA: (tappa: number) => void }) {
  const corrente = TAPPE.find((t) => t.id === stato.tappa);
  return (
    <nav aria-label="Avanzamento della ricerca" className="flex flex-col items-center">
      <ol className="flex items-center">
        {TAPPE.map((tappa, i) => {
          const attiva = tappa.id === stato.tappa;
          const completata = tappa.id < stato.tappa;
          const tondo = (
            <span
              aria-hidden="true"
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors duration-300 ${
                completata ? "bg-accent text-on-accent" : attiva ? "bg-cta text-on-cta ring-4 ring-cta-field" : "bg-surface text-ink-soft ring-1 ring-line"
              }`}
            >
              {completata ? <Icona nome="check" className="h-4 w-4" /> : tappa.id === TAPPE.length ? <Icona nome="gift" className="h-3.5 w-3.5" /> : tappa.id}
            </span>
          );
          return (
            <li key={tappa.id} className="flex items-center">
              {i > 0 ? (
                <span
                  aria-hidden="true"
                  className={`h-0.5 w-2.5 rounded-full sm:w-6 ${attiva ? "bg-gradient-to-r from-accent to-cta" : completata ? "bg-accent" : "bg-line"}`}
                />
              ) : null}
              {completata && puoAndareA(stato, tappa.id) ? (
                <button type="button" title={`Cambia: ${tappa.etichetta}`} className="group flex h-8 w-8 items-center justify-center rounded-full" onClick={() => vaiA(tappa.id)}>
                  <span className="transition-transform group-hover:scale-110">{tondo}</span>
                  <span className="sr-only">{tappa.etichetta} (completato): cambia</span>
                </button>
              ) : (
                <span className="flex h-8 w-8 items-center justify-center" aria-current={attiva ? "step" : undefined}>
                  {tondo}
                  <span className="sr-only">
                    {tappa.etichetta}
                    {completata ? " (completato)" : ""}
                  </span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {/* sui risultati basta il regalo arancio */}
      {stato.tappa < TAPPE.length ? (
        <p aria-hidden="true" className="-mt-0.5 text-[10px] font-bold uppercase leading-none tracking-wider text-cta-2">
          {stato.tappa} di {TAPPE.length} · {corrente?.etichetta}
        </p>
      ) : null}
    </nav>
  );
}

/** Una pillola da scegliere (fascia di prezzo, ordinamento). */
export function Chip({ etichetta, scelto, onClick }: { etichetta: string; scelto: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={scelto}
      onClick={onClick}
      className={`inline-flex min-h-tocco shrink-0 items-center gap-1 rounded-full px-4 text-sm font-semibold transition-colors ${
        scelto ? "bg-accent text-on-accent" : "bg-surface-2 hover:bg-line"
      }`}
    >
      {scelto ? <Icona nome="check" className="h-4 w-4" /> : null}
      {etichetta}
    </button>
  );
}

/**
 * Una scelta a scheda: icona in un tondo, nome, spunta arancio se scelta (altrimenti un «+»).
 * `grande` per le due schede del destinatario.
 */
export function SceltaScheda({
  etichetta,
  icona,
  scelto,
  grande = false,
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
      aria-pressed={scelto}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl text-left transition-colors ${grande ? "min-h-24 flex-col justify-center p-5" : "min-h-14 gap-2.5 p-2.5"} ${
        scelto ? "bg-surface shadow-carta ring-2 ring-cta" : "bg-surface-2 hover:bg-line"
      }`}
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-full ${grande ? "h-16 w-16" : "h-9 w-9"} ${
          scelto ? "bg-cta text-on-cta" : "bg-surface text-ink"
        }`}
      >
        <Icona nome={icona} className={grande ? "h-8 w-8" : "h-5 w-5"} />
      </span>
      <span className={`min-w-0 flex-1 font-bold leading-tight ${grande ? "flex-none text-lg" : "text-sm"}`}>{etichetta}</span>
      {/* solo la spunta sulle scelte: un «+» su ogni scheda ruberebbe lo spazio alle parole lunghe */}
      {!grande && scelto ? (
        <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cta text-on-cta">
          <IconaSito nome="check" dimensione={16} />
        </span>
      ) : null}
    </button>
  );
}
