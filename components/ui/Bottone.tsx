import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { REL_LINK_PRODOTTO } from "@/lib/dominio/amazon";

/**
 * - `primario`: pillola verde del marchio, l'azione principale di una schermata.
 * - `azione`: pillola arancio, solo per le conversioni (Partecipo, Firma, Apri la raccolta…). Il testo resta
 *   grande anche nella misura piccola: il bianco sull'arancio (3,1:1) regge il contrasto solo come testo grande, cioè da 14 pt (18,7 px) in grassetto.
 * - `secondario`: pillola chiara con bordo. `testuale`: solo testo.
 */
export type VarianteBottone = "primario" | "azione" | "secondario" | "testuale";
export type DimensioneBottone = "normale" | "piccolo";

export function classiBottone(variante: VarianteBottone = "primario", dimensione: DimensioneBottone = "normale", extra = ""): string {
  const base =
    "inline-flex select-none items-center justify-center gap-2 rounded-full font-bold transition-[background-color,border-color,transform] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0";
  const misura =
    variante === "testuale"
      ? "min-h-tocco px-2 text-base"
      : dimensione === "piccolo"
        ? `min-h-tocco px-4 ${variante === "azione" ? "text-[19px]" : "text-sm"}`
        : `min-h-azione px-6 ${variante === "azione" ? "text-[19px]" : "text-base"}`;
  const colori = {
    primario: "bg-accent text-on-accent shadow-accento hover:bg-accent-2",
    azione: "bg-cta text-on-cta shadow-sollevata hover:bg-cta-2",
    secondario: "border-[1.5px] border-line-forte bg-surface text-accent hover:border-accent",
    testuale: "text-accent underline-offset-4 hover:underline",
  }[variante];
  return `${base} ${misura} ${colori} ${extra}`.trim();
}

interface ProprietaComuni {
  variante?: VarianteBottone;
  dimensione?: DimensioneBottone;
  pieno?: boolean;
  children: ReactNode;
}

export function Bottone({
  variante,
  dimensione,
  pieno,
  className = "",
  type = "button",
  children,
  ...resto
}: ProprietaComuni & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={classiBottone(variante, dimensione, `${pieno ? "w-full" : ""} ${className}`)} {...resto}>
      {children}
    </button>
  );
}

/** Un collegamento con l'aspetto di un bottone. Apre in una scheda nuova se `esterno`. */
export function BottoneLink({
  variante,
  dimensione,
  pieno,
  className = "",
  esterno,
  href,
  children,
  ...resto
}: ProprietaComuni & { href: string; esterno?: boolean } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const classi = classiBottone(variante, dimensione, `${pieno ? "w-full" : ""} ${className}`);
  if (esterno) {
    return (
      <a href={href} className={classi} target="_blank" rel={REL_LINK_PRODOTTO} {...resto}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classi} {...resto}>
      {children}
    </Link>
  );
}
