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

/** Il riquadro dei passi: «Passo 3 di 4», la barra, le etichette. Dai passi già fatti si torna indietro con un tocco. */
export function Avanzamento({ stato, vaiA }: { stato: StatoRicerca; vaiA: (tappa: number) => void }) {
  const secondi = Math.max(0, (4 - stato.tappa) * 10);
  return (
    <nav aria-label="Avanzamento della ricerca" className="flex flex-col gap-2 rounded-2xl bg-surface p-3 shadow-carta">
      <div className="flex items-center justify-between text-[11px] font-bold">
        <p className="uppercase tracking-widest text-cta-2">
          Passo {stato.tappa} di 4 <span aria-hidden="true">●</span>
        </p>
        {secondi > 0 ? <p className="text-ink-soft">Circa {secondi} sec rimanenti</p> : null}
      </div>
      <ol className="grid grid-cols-4 gap-1.5">
        {TAPPE.map((tappa) => {
          const attiva = tappa.id === stato.tappa;
          const completata = tappa.id < stato.tappa;
          const corpo = (
            <>
              <span aria-hidden="true" className={`h-1.5 w-full rounded-full ${completata ? "bg-accent" : attiva ? "bg-cta" : "bg-line"}`} />
              <span className={`flex items-center gap-0.5 text-[11px] font-bold ${attiva ? "text-cta-2" : completata ? "text-ink" : "text-ink-soft/60"}`}>
                {completata ? <Icona nome="check" className="h-3.5 w-3.5" /> : null}
                <span className="truncate">{tappa.etichetta}</span>
                {completata ? <span className="sr-only"> (completato)</span> : null}
              </span>
            </>
          );
          return (
            <li key={tappa.id} className="min-w-0">
              {completata && puoAndareA(stato, tappa.id) ? (
                <button type="button" className="flex min-h-tocco w-full flex-col items-start justify-center gap-1.5" onClick={() => vaiA(tappa.id)}>
                  {corpo}
                </button>
              ) : (
                <span className="flex min-h-tocco w-full flex-col items-start justify-center gap-1.5" aria-current={attiva ? "step" : undefined}>
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
