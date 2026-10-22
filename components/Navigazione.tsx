"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePreferiti } from "./PreferitiProvider";
import { Icona, type NomeIcona } from "./ui/Icona";

/** Le cinque voci principali: barra in basso sul telefono, collegamenti nell'intestazione da tablet in su. */
const VOCI: { href: string; testo: string; icona: NomeIcona }[] = [
  { href: "/", testo: "Home", icona: "home" },
  { href: "/catalogo", testo: "Catalogo", icona: "grid_view" },
  { href: "/regalo", testo: "Trova regalo", icona: "auto_awesome" },
  { href: "/preferiti", testo: "Preferiti", icona: "favorite" },
  { href: "/le-mie-collette", testo: "Collette", icona: "redeem" },
];

/**
 * Nei percorsi a passi (creazione, gestione, accesso) la barra in basso non c'è: lì in fondo allo schermo
 * stanno i pulsanti del passo, e una seconda barra li coprirebbe.
 */
export function barraNavigazioneVisibile(percorso: string): boolean {
  return !["/crea", "/gestisci", "/accedi"].some((p) => percorso.startsWith(p));
}

function attiva(percorso: string, href: string): boolean {
  return href === "/" ? percorso === "/" : percorso.startsWith(href);
}

function ContatorePreferiti({ n }: { n: number }) {
  if (n === 0) return null;
  return (
    <span className="cifre absolute -right-2 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-cta px-1 text-[11px] font-bold text-on-cta">
      <span className="sr-only">: </span>
      {n}
    </span>
  );
}

/** Barra fissa in basso, solo sul telefono. Il segnaposto prima della barra evita che copra il fondo della pagina. */
export function BarraNavigazione() {
  const percorso = usePathname();
  const { preferiti } = usePreferiti();
  if (!barraNavigazioneVisibile(percorso)) return null;
  return (
    <>
      <div aria-hidden="true" className="h-20 md:hidden" />
      <nav
        aria-label="Principale"
        className="no-stampa fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-safe backdrop-blur-xl md:hidden"
      >
        <ul className="mx-auto flex max-w-lg">
          {VOCI.map((v) => {
            const corrente = attiva(percorso, v.href);
            return (
              <li key={v.href} className="flex-1">
                <Link
                  href={v.href}
                  aria-current={corrente ? "page" : undefined}
                  className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-bold ${corrente ? "text-cta-2" : "text-ink-soft"}`}
                >
                  <span className="relative">
                    <Icona nome={v.icona} piena={corrente} />
                    {v.href === "/preferiti" ? <ContatorePreferiti n={preferiti.size} /> : null}
                  </span>
                  {v.testo}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

/** Le stesse voci, in riga nell'intestazione, da tablet in su. */
export function NavigazioneOrizzontale() {
  const percorso = usePathname();
  const { preferiti } = usePreferiti();
  return (
    <nav aria-label="Principale" className="hidden md:block">
      <ul className="flex items-center gap-1">
        {VOCI.map((v) => {
          const corrente = attiva(percorso, v.href);
          return (
            <li key={v.href}>
              <Link
                href={v.href}
                aria-current={corrente ? "page" : undefined}
                className={`relative inline-flex min-h-tocco items-center rounded-full px-4 text-sm font-bold ${
                  corrente ? "bg-accent-field text-accent" : "text-ink-soft hover:bg-surface-2 hover:text-ink"
                }`}
              >
                {v.testo}
                {v.href === "/preferiti" && preferiti.size > 0 ? (
                  <span className="cifre ml-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-cta px-1 text-xs font-bold text-on-cta">
                    <span className="sr-only">: </span>
                    {preferiti.size}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
