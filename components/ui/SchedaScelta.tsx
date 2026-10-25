import type { ReactNode } from "react";
import { Icona, type NomeIcona } from "./Icona";

/**
 * Una scelta a scheda (come un radio, ma grande): icona facoltativa a sinistra, titolo e una riga, il segno
 * di selezione a destra. Mettere più schede dentro un role="radiogroup".
 */
export function SchedaScelta({
  titolo,
  descrizione,
  selezionata,
  onSeleziona,
  extra,
  icona,
}: {
  titolo: string;
  descrizione?: ReactNode;
  selezionata: boolean;
  onSeleziona: () => void;
  extra?: ReactNode;
  icona?: NomeIcona;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selezionata}
      onClick={onSeleziona}
      className={`flex min-h-tocco w-full items-center gap-3 rounded-3xl p-4 text-left transition-colors ${
        selezionata ? "bg-surface shadow-carta ring-2 ring-accent" : "bg-surface shadow-carta ring-1 ring-line hover:ring-line-forte"
      }`}
    >
      {icona ? (
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${selezionata ? "bg-accent text-on-accent" : "bg-accent-field text-accent"}`}>
          <Icona nome={icona} />
        </span>
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-display text-lg font-semibold leading-tight">{titolo}</span>
        {descrizione ? <span className="text-sm text-ink-soft">{descrizione}</span> : null}
        {extra}
      </span>
      <span
        aria-hidden="true"
        className={`flex h-7 w-7 shrink-0 items-center justify-center self-start rounded-full ${selezionata ? "bg-accent text-on-accent" : "ring-2 ring-inset ring-line-forte"}`}
      >
        {selezionata ? <Icona nome="check" dimensione={18} /> : null}
      </span>
    </button>
  );
}
