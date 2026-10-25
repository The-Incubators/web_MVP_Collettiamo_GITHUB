import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";
import { Icona, type NomeIcona } from "./Icona";

const CLASSI =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-carta transition-transform active:scale-95 disabled:opacity-50";

/** Il pulsante tondo bianco delle barre in alto (indietro, chiudi, menu): sempre con un'etichetta per gli screen reader. */
export function BottoneTondo({
  icona,
  etichetta,
  className = "",
  ...resto
}: { icona: NomeIcona; etichetta: string } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">) {
  return (
    <button type="button" aria-label={etichetta} className={`${CLASSI} ${className}`} {...resto}>
      <Icona nome={icona} dimensione={22} />
    </button>
  );
}

export function LinkTondo({ icona, etichetta, href, className = "" }: { icona: NomeIcona; etichetta: string; href: string; className?: string }) {
  return (
    <Link href={href} aria-label={etichetta} className={`${CLASSI} ${className}`}>
      <Icona nome={icona} dimensione={22} />
    </Link>
  );
}
