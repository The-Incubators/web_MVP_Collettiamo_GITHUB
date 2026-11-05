import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { REL_LINK_PRODOTTO } from "@/lib/dominio/amazon";

/**
 * I pulsanti di Gifty UX v2 (docs/specs/gifty-ux-v2/design.md §4, classi `.btn` in app/sistema.css): 48 px, raggio 10,
 * Source Sans 700.
 * - `primario`: verde pieno, l'azione principale di un blocco (una sola per blocco). `azione` è lo stesso pulsante,
 *   il nome resta per le conversioni già scritte così.
 * - `contorno` (anche `secondario`): bordo verde su bianco, per le azioni alternative alla principale.
 * - `quieto` (anche `testuale`): pillola verde tinta per le azioni secondarie dentro un blocco. Mai testo flottante
 *   (Cri, 5 novembre 2026): anche le vecchie azioni «testuali» prendono il fondo tinto.
 */
export type VarianteBottone = "primario" | "azione" | "contorno" | "secondario" | "quieto" | "testuale";
export type DimensioneBottone = "normale" | "piccolo";

export function classiBottone(variante: VarianteBottone = "primario", dimensione: DimensioneBottone = "normale", extra = ""): string {
  const tipo = {
    primario: "btn-primario",
    azione: "btn-primario",
    contorno: "btn-contorno",
    secondario: "btn-contorno",
    quieto: "btn-quieto",
    testuale: "btn-quieto",
  }[variante];
  // piccolo: alto 44 px (il minimo per il tocco) e testo 14 px
  const misura = dimensione === "piccolo" && tipo !== "btn-quieto" ? "min-h-tocco px-4 text-sm" : "";
  return `btn ${tipo} select-none disabled:cursor-not-allowed ${misura} ${extra}`.replace(/\s+/g, " ").trim();
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
