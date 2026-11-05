"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { sezioneDi, type Sezione } from "@/lib/navigazione";
import { usePreferiti } from "./PreferitiProvider";
import { IconaTratto, type NomeIconaTratto } from "./ui/IconaTratto";

/**
 * La cornice del sito di Gifty UX v2 (design.md §4, prototipi/comuni.js; Gifty-architettura-e-flussi.md §2).
 * Intestazione: logo · Idee regalo · Regalo di gruppo · Biglietto · cuore con il numero dei preferiti · tondo
 * dell'account; sul telefono logo e cuore. Barra in basso, solo sul telefono: Home · Idee regalo · Gruppo · Biglietto ·
 * Account. In home l'intestazione è trasparente sulla parete della scena.
 */
const MENU: { href: string; testo: string; sezione: Sezione }[] = [
  { href: "/idee", testo: "Idee regalo", sezione: "idee" },
  { href: "/regalo-di-gruppo", testo: "Regalo di gruppo", sezione: "gruppo" },
  { href: "/biglietto", testo: "Biglietto", sezione: "biglietto" },
];

const BARRA: { href: string; testo: string; icona: NomeIconaTratto; sezione: Sezione; nomeIntero?: string }[] = [
  { href: "/", testo: "Home", icona: "casa", sezione: "home" },
  { href: "/idee", testo: "Idee regalo", icona: "idee", sezione: "idee" },
  { href: "/regalo-di-gruppo", testo: "Gruppo", icona: "gruppo", sezione: "gruppo", nomeIntero: "Regalo di gruppo" },
  { href: "/biglietto", testo: "Biglietto", icona: "biglietto", sezione: "biglietto" },
  { href: "/account", testo: "Account", icona: "account", sezione: "account" },
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

/**
 * L'intestazione. `logo` e `account` arrivano dal layout, così
 * restano componenti del server dove possono. `data-cornice`: le viste a tutto schermo la rendono inerte.
 */
export function Intestazione({ logo, account }: { logo: ReactNode; account: ReactNode }) {
  const percorso = usePathname();
  const suScena = percorso === "/";
  return (
    <header data-cornice className={`testa no-stampa ${suScena ? "su-scena" : ""}`}>
      <div className="testa-in">
        <Link href="/" className="marchio" aria-label="Gifty, vai alla home">
          {logo}
        </Link>
        <nav className="menu" aria-label="Servizi">
          {MENU.map((v) => (
            <Link key={v.href} href={v.href} aria-current={attiva(percorso, v.sezione) ? "page" : undefined}>
              {v.testo}
            </Link>
          ))}
        </nav>
        <div className="testa-azioni">
          <CuorePreferiti />
          <div className="account-testa">{account}</div>
        </div>
      </div>
    </header>
  );
}

/** Il cuore dei preferiti con il loro numero, su ogni schermo. */
function CuorePreferiti() {
  const percorso = usePathname();
  const { preferiti } = usePreferiti();
  const n = preferiti.size;
  return (
    <Link
      href="/preferiti"
      className="cuore-testa"
      aria-label={n ? `Preferiti, ${n === 1 ? "1 regalo" : `${n} regali`}` : "Preferiti"}
      aria-current={attiva(percorso, "preferiti") ? "page" : undefined}
    >
      <IconaTratto nome="cuore-pieno" />
      {n ? <span aria-hidden="true">{n}</span> : null}
    </Link>
  );
}

/** Barra fissa in basso, solo sul telefono. Il segnaposto prima della barra evita che copra il fondo della pagina. */
export function BarraNavigazione() {
  const percorso = usePathname();
  if (!barraNavigazioneVisibile(percorso)) return null;
  return (
    <>
      <div aria-hidden="true" className="barra-spazio" />
      <nav aria-label="Menu" className="barra-basso no-stampa">
        <ul>
          {BARRA.map((v) => (
            <li key={v.href}>
              <Link
                href={v.href}
                aria-current={attiva(percorso, v.sezione) ? "page" : undefined}
                aria-label={v.nomeIntero}
              >
                <IconaTratto nome={v.icona} />
                <span>{v.testo}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
