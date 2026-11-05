"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { sezioneDi, type Sezione } from "@/lib/navigazione";
import { usePreferiti } from "./PreferitiProvider";
import { Icona, type NomeIcona } from "./ui/Icona";

/**
 * Le voci principali (Gifty-spec-prodotto.md §5): barra in basso sul telefono, collegamenti nell'intestazione da
 * tablet in su. Le ricorrenze e le collette stanno nel menu del profilo finché non arriva /account (S-11).
 */
const VOCI: { href: string; testo: string; icona: NomeIcona; sezione: Sezione }[] = [
  { href: "/", testo: "Home", icona: "home", sezione: "home" },
  { href: "/idee", testo: "Idee regalo", icona: "auto_awesome", sezione: "idee" },
  { href: "/regalo-di-gruppo", testo: "Regalo di gruppo", icona: "groups", sezione: "gruppo" },
  { href: "/preferiti", testo: "Preferiti", icona: "favorite", sezione: "preferiti" },
];

/**
 * Nei percorsi a passi (creazione, gestione, accesso) la barra in basso non c'è: lì in fondo allo schermo
 * stanno i pulsanti del passo, e una seconda barra li coprirebbe.
 */
export function barraNavigazioneVisibile(percorso: string): boolean {
  return !["/crea", "/gestisci", "/accedi"].some((p) => percorso.startsWith(p));
}

/** La voce è accesa sul segmento esatto dell'indirizzo, non sul prefisso (UX-11, lib/navigazione.ts). */
function attiva(percorso: string, sezione: Sezione): boolean {
  return sezioneDi(percorso) === sezione;
}

function ContatorePreferiti({ n }: { n: number }) {
  if (n === 0) return null;
  return (
    <span className="cifre absolute -right-2 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-cta px-1 text-[11px] font-bold text-accent-2">
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
            const corrente = attiva(percorso, v.sezione);
            return (
              <li key={v.href} className="flex-1">
                <Link
                  href={v.href}
                  aria-current={corrente ? "page" : undefined}
                  className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-bold leading-none ${corrente ? "text-accent" : "text-ink-soft"}`}
                >
                  {/* flex, non in riga: un'icona in riga si porta sotto lo spazio della linea di base (8 px in più) */}
                  <span className="relative flex">
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
          const corrente = attiva(percorso, v.sezione);
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
                  <span className="cifre ml-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-cta px-1 text-xs font-bold text-accent-2">
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
