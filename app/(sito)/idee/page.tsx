import type { Metadata } from "next";
import Link from "next/link";
import { Icona, type NomeIcona } from "@/components/ui";

/**
 * Idee regalo (Gifty-spec-prodotto.md S-02, D-02): trovare idee per qualcuno, con le domande di «Trova il regalo»
 * o sfogliando il catalogo. Il biglietto ha la sua voce di menu (Gifty-architettura-e-flussi.md §2).
 */
export const metadata: Metadata = {
  title: "Idee regalo",
  description: "Trova un'idea regalo per qualcuno: rispondi a poche domande o sfoglia il catalogo.",
};

const STRADE: { href: string; titolo: string; testo: string; icona: NomeIcona; tinta: string }[] = [
  {
    href: "/regalo",
    titolo: "Trova un regalo originale",
    testo: "Rispondi a poche domande su chi lo riceve: ti mostriamo le idee più adatte",
    icona: "auto_awesome",
    tinta: "bg-cta-field text-cta-2",
  },
  {
    href: "/catalogo",
    titolo: "Sfoglia il catalogo",
    testo: "Tutte le idee, con i filtri per età, tema e prezzo",
    icona: "grid_view",
    tinta: "bg-ok-field text-accent",
  },
];

export default function PaginaIdee() {
  return (
    <div className="gutter pb-10 pt-4 sm:pt-10">
      <div className="mx-auto flex max-w-lg flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-[32px] font-bold leading-[38px] tracking-tight text-accent">Idee regalo</h1>
          <p className="text-ink-soft">Per trovare il regalo giusto per qualcuno.</p>
        </header>
        <ul className="flex flex-col gap-3">
          {STRADE.map((s) => (
            <li key={s.href}>
              <Link href={s.href} className="flex items-center gap-4 rounded-2xl bg-surface p-4 shadow-carta transition-colors hover:bg-surface-2">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${s.tinta}`}>
                  <Icona nome={s.icona} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-bold text-accent-2">{s.titolo}</span>
                  <span className="text-sm text-ink-soft">{s.testo}</span>
                </span>
                <Icona nome="chevron_right" className="text-ink-soft" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
