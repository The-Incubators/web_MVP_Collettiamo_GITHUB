import type { ReactNode } from "react";
import { inizialiDi } from "@/lib/dominio/partecipanti";

/** Una persona in un elenco: iniziali, nome, dettaglio, etichetta a destra, azioni sotto. */
export function RigaPartecipante({
  nome,
  dettaglio,
  etichetta,
  azioni,
  sfondo = "tenue",
}: {
  nome: string;
  dettaglio?: ReactNode;
  etichetta?: ReactNode;
  azioni?: ReactNode;
  /** «bianco» dentro le sezioni colorate (da confermare, contanti), «tenue» nelle card bianche */
  sfondo?: "tenue" | "bianco";
}) {
  return (
    <li className={`flex flex-col gap-3 rounded-2xl p-3 ${sfondo === "bianco" ? "bg-surface shadow-carta" : "bg-surface-2"}`}>
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ok-field font-display text-sm font-bold text-accent-2">
          {inizialiDi(nome)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-bold">{nome}</span>
          {dettaglio ? <span className="truncate text-xs text-ink-soft">{dettaglio}</span> : null}
        </div>
        {etichetta}
      </div>
      {azioni ? <div className="flex flex-wrap gap-2">{azioni}</div> : null}
    </li>
  );
}
