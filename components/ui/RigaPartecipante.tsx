import type { ReactNode } from "react";
import { inizialiDi } from "@/lib/dominio/partecipanti";

export function RigaPartecipante({
  nome,
  dettaglio,
  etichetta,
  azioni,
}: {
  nome: string;
  dettaglio?: ReactNode;
  etichetta?: ReactNode;
  azioni?: ReactNode;
}) {
  return (
    <li className="flex flex-col gap-3 rounded-controllo border border-line bg-surface p-3">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-field font-display text-sm font-bold text-accent-2"
        >
          {inizialiDi(nome)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-semibold">{nome}</span>
          {dettaglio ? <span className="text-sm text-ink-soft">{dettaglio}</span> : null}
        </div>
        {etichetta}
      </div>
      {azioni ? <div className="flex flex-wrap gap-2">{azioni}</div> : null}
    </li>
  );
}
