import type { ReactNode } from "react";

/** Interruttore on/off accessibile (role="switch"). */
export function Interruttore({
  etichetta,
  descrizione,
  attivo,
  onCambia,
}: {
  etichetta: string;
  descrizione?: ReactNode;
  attivo: boolean;
  onCambia: (attivo: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={attivo}
      onClick={() => onCambia(!attivo)}
      className="flex min-h-tocco w-full items-center gap-3 text-left"
    >
      <span
        aria-hidden="true"
        className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors ${attivo ? "border-accent bg-accent" : "border-line bg-surface-2"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full transition-all ${attivo ? "left-[1.375rem] bg-on-accent" : "left-0.5 bg-ink-soft"}`}
        />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-semibold">{etichetta}</span>
        {descrizione ? <span className="text-sm text-ink-soft">{descrizione}</span> : null}
      </span>
    </button>
  );
}
