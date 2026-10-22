import type { ReactNode } from "react";
import { IconaSpunta } from "./icone";

/** Una scelta a scheda (come un radio, ma grande). Mettere più schede dentro un role="radiogroup". */
export function SchedaScelta({
  titolo,
  descrizione,
  selezionata,
  onSeleziona,
  extra,
}: {
  titolo: string;
  descrizione?: ReactNode;
  selezionata: boolean;
  onSeleziona: () => void;
  extra?: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selezionata}
      onClick={onSeleziona}
      className={`flex min-h-tocco w-full items-start gap-3 rounded-contenitore p-4 text-left shadow-carta transition-colors ${
        selezionata ? "border-2 border-accent bg-accent-field" : "border-2 border-line bg-surface hover:border-line-forte"
      }`}
    >
      <span
        aria-hidden="true"
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
          selezionata ? "border-accent bg-accent text-on-accent" : "border-line-forte bg-surface"
        }`}
      >
        {selezionata ? <IconaSpunta width={16} height={16} /> : null}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-display text-lg font-bold leading-tight">{titolo}</span>
        {descrizione ? <span className="text-sm text-ink-soft">{descrizione}</span> : null}
        {extra}
      </span>
    </button>
  );
}
