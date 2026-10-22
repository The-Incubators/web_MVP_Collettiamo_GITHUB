import type { ReactNode } from "react";
import { IconaSpunta } from "./icone";

export type StatoEtichetta = "confermato" | "daConfermare" | "contanti" | "aderito" | "invitato" | "rinunciato";

const STILI: Record<StatoEtichetta, string> = {
  confermato: "border-transparent bg-ok-field text-ok",
  daConfermare: "border-transparent bg-gold-field text-gold",
  contanti: "border-transparent bg-gold-field text-gold",
  aderito: "border-transparent bg-surface-2 text-ink",
  invitato: "border-line bg-surface text-ink-soft",
  rinunciato: "border-line bg-surface text-ink-soft line-through",
};

const TESTI: Record<StatoEtichetta, string> = {
  confermato: "Confermato",
  daConfermare: "Da confermare",
  contanti: "Contanti",
  aderito: "Ha aderito",
  invitato: "Invitato",
  rinunciato: "Non partecipa",
};

export function Etichetta({ stato, children }: { stato: StatoEtichetta; children?: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-bold ${STILI[stato]}`}>
      {stato === "confermato" ? <IconaSpunta width={14} height={14} className="text-ok" /> : null}
      {children ?? TESTI[stato]}
    </span>
  );
}
