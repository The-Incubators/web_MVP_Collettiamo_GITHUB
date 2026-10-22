import type { ReactNode } from "react";
import { Icona, type NomeIcona } from "./Icona";

/** Interruttore on/off accessibile (role="switch"): testo a sinistra, interruttore a destra, icona facoltativa. */
export function Interruttore({
  etichetta,
  descrizione,
  attivo,
  onCambia,
  icona,
  tintaIcona = "bg-surface-2 text-ink",
}: {
  etichetta: string;
  descrizione?: ReactNode;
  attivo: boolean;
  onCambia: (attivo: boolean) => void;
  icona?: NomeIcona;
  tintaIcona?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={attivo}
      onClick={() => onCambia(!attivo)}
      className="flex min-h-tocco w-full items-center gap-3 text-left"
    >
      {icona ? (
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tintaIcona}`}>
          <Icona nome={icona} />
        </span>
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-bold">{etichetta}</span>
        {descrizione ? <span className="text-sm text-ink-soft">{descrizione}</span> : null}
      </span>
      <span aria-hidden="true" className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${attivo ? "bg-accent" : "bg-line-forte"}`}>
        <span className={`absolute top-1 h-6 w-6 rounded-full bg-surface shadow-carta transition-all ${attivo ? "left-7" : "left-1"}`} />
      </span>
    </button>
  );
}
