import type { ReactNode } from "react";
import { IconaAvviso, IconaInfo, IconaSpunta } from "./icone";

const STILI = {
  neutro: "border-transparent bg-surface-2",
  attenzione: "border-gold-line bg-gold-field",
  positivo: "border-transparent bg-ok-field",
} as const;

export function Avviso({
  tono = "neutro",
  titolo,
  children,
  live = false,
}: {
  tono?: keyof typeof STILI;
  titolo?: string;
  children?: ReactNode;
  /** true per gli avvisi che compaiono dopo un'azione: vengono letti subito */
  live?: boolean;
}) {
  const Icona = tono === "attenzione" ? IconaAvviso : tono === "positivo" ? IconaSpunta : IconaInfo;
  return (
    <div
      role={live ? (tono === "attenzione" ? "alert" : "status") : undefined}
      className={`flex gap-3 rounded-contenitore border p-4 text-sm text-ink ${STILI[tono]}`}
    >
      <Icona className={`mt-0.5 shrink-0 ${tono === "attenzione" ? "text-gold" : tono === "positivo" ? "text-ok" : "text-ink-soft"}`} />
      <div className="flex min-w-0 flex-col gap-1">
        {titolo ? <p className="font-semibold">{titolo}</p> : null}
        {children ? <div className="flex flex-col gap-1">{children}</div> : null}
      </div>
    </div>
  );
}
