import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { REL_LINK_PRODOTTO } from "@/lib/dominio/amazon";

export type VarianteBottone = "primario" | "secondario" | "testuale";
export type DimensioneBottone = "normale" | "piccolo";

export function classiBottone(variante: VarianteBottone = "primario", dimensione: DimensioneBottone = "normale", extra = ""): string {
  const base =
    "inline-flex min-h-tocco select-none items-center justify-center gap-2 rounded-controllo font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
  const misura = dimensione === "piccolo" ? "px-3 text-sm" : "px-5 text-base";
  const colori = {
    primario: "bg-accent text-on-accent hover:bg-accent-2",
    secondario: "border border-line bg-surface text-ink hover:bg-surface-2",
    testuale: "text-accent-2 underline-offset-4 hover:underline",
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
