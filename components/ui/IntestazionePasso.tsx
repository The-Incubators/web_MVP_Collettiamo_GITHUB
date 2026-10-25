import type { Ref } from "react";
import { Icona, type NomeIcona } from "./Icona";

/**
 * L'intestazione dei percorsi a passi: riquadro verde chiaro con l'icona, sopra un'etichetta piccola grigia
 * («Passo 2 di 5 · Per chi e quando») e sotto la domanda in grassetto. `titoloRef` riceve il focus a ogni passo.
 */
export function IntestazionePasso({
  icona,
  etichetta,
  titolo,
  sotto,
  titoloRef,
}: {
  icona: NomeIcona;
  etichetta: string;
  titolo: string;
  sotto?: string;
  titoloRef?: Ref<HTMLHeadingElement>;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent-field text-accent">
          <Icona nome={icona} dimensione={28} />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="text-sm text-ink-soft">{etichetta}</span>
          <h1 ref={titoloRef} tabIndex={-1} className="text-[22px] font-bold leading-tight text-ink outline-none">
            {titolo}
          </h1>
        </div>
      </div>
      {sotto ? <p className="text-ink-soft">{sotto}</p> : null}
    </div>
  );
}
