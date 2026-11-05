"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { sezioneDi, type Sezione } from "@/lib/navigazione";
import { usePreferiti } from "./PreferitiProvider";
import { Icona, type NomeIcona } from "./ui/Icona";

/**
 * Le voci principali (Gifty-architettura-e-flussi.md §2): barra in basso sul telefono (al massimo cinque),
 * collegamenti nell'intestazione da tablet in su. «Account» è solo nella barra: nell'intestazione l'account è il tondo
 * del profilo. «Preferiti» è solo nell'intestazione: sul telefono c'è il cuore accanto al profilo (`CuorePreferiti`).
 */
const VOCI: {
  href: string;
  testo: string;
  icona: NomeIcona;
  sezione: Sezione;
  soloBarra?: true;
  soloIntestazione?: true;
  testoBarra?: string;
}[] = [
  { href: "/", testo: "Home", icona: "home", sezione: "home" },
  { href: "/idee", testo: "Idee regalo", icona: "auto_awesome", sezione: "idee" },
  { href: "/regalo-di-gruppo", testo: "Regalo di gruppo", icona: "groups", sezione: "gruppo", testoBarra: "Gruppo" },
  { href: "/biglietto", testo: "Biglietto", icona: "draw", sezione: "biglietto" },
  { href: "/preferiti", testo: "Preferiti", icona: "favorite", sezione: "preferiti", soloIntestazione: true },
  { href: "/account", testo: "Account", icona: "account_circle", sezione: "account", soloBarra: true },
];

/**
 * Nei percorsi a passi (creazione, gestione, accesso) la barra in basso non c'è: lì in fondo allo schermo
 * stanno i pulsanti del passo, e una seconda barra li coprirebbe.
 */
export function barraNavigazioneVisibile(percorso: string): boolean {
  if (["/crea", "/gestisci", "/accedi", "/biglietto/nuovo"].some((p) => percorso.startsWith(p))) return false;
  // i passi del biglietto (/biglietto/<id>/dettagli, design, anteprima); la gestione invece ha la barra
  return !/^\/biglietto\/[^/]+\/(dettagli|design|anteprima)/.test(percorso);
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
          {VOCI.filter((v) => !v.soloIntestazione).map((v) => {
            const corrente = attiva(percorso, v.sezione);
            return (
              <li key={v.href} className="flex-1">
                <Link
                  href={v.href}
                  aria-current={corrente ? "page" : undefined}
                  aria-label={v.testoBarra ? v.testo : undefined}
                  className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-bold leading-none ${corrente ? "text-accent" : "text-ink-soft"}`}
                >
                  {/* flex, non in riga: un'icona in riga si porta sotto lo spazio della linea di base (8 px in più) */}
                  <span className="relative flex">
                    <Icona nome={v.icona} piena={corrente} />
                    {v.href === "/preferiti" ? <ContatorePreferiti n={preferiti.size} /> : null}
                  </span>
                  {v.testoBarra ?? v.testo}
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
        {VOCI.filter((v) => !v.soloBarra).map((v) => {
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

/** Il cuore dei Preferiti nell'intestazione, solo sul telefono: nella barra in basso i Preferiti non ci sono. */
export function CuorePreferiti() {
  const percorso = usePathname();
  const { preferiti } = usePreferiti();
  const corrente = attiva(percorso, "preferiti");
  return (
    <Link
      href="/preferiti"
      aria-label={preferiti.size ? `Preferiti: ${preferiti.size}` : "Preferiti"}
      aria-current={corrente ? "page" : undefined}
      className={`relative flex h-11 w-11 items-center justify-center rounded-full md:hidden ${corrente ? "bg-accent-field text-accent" : "text-ink-soft"}`}
    >
      <Icona nome="favorite" piena={corrente} />
      <ContatorePreferiti n={preferiti.size} />
    </Link>
  );
}
