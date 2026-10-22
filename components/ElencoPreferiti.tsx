"use client";

import Link from "next/link";
import { SchedaProdotto } from "@/components/SchedaProdotto";
import { useApp } from "./AppProvider";
import { usePreferiti } from "./PreferitiProvider";
import { BottoneLink, Icona } from "./ui";
import type { Prodotto } from "@/lib/tipi";

/** La pagina «Preferiti»: i prodotti che hai segnato con il cuore nel catalogo. */
export function ElencoPreferiti({ prodotti }: { prodotti: Prodotto[] }) {
  const { preferiti, pronto, conAccount } = usePreferiti();
  const { utente, pronto: autenticazionePronta } = useApp();
  const miei = prodotti.filter((p) => preferiti.has(p.slug));

  return (
    <div className="mx-auto flex max-w-catalogo flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[32px] font-bold leading-[38px] tracking-tight text-accent-2">I tuoi preferiti</h1>
        {miei.length > 0 ? (
          <span className="cifre rounded-full bg-cta-field px-3 py-1 text-xs font-bold" aria-live="polite">
            {miei.length === 1 ? "1 idea" : `${miei.length} idee`}
          </span>
        ) : null}
      </div>

      {autenticazionePronta && !utente ? (
        <p className="text-sm text-ink-soft">
          Sono salvati su questo dispositivo.{" "}
          <Link href="/accedi?next=/preferiti" className="font-bold text-accent underline underline-offset-4">
            Accedi
          </Link>{" "}
          per ritrovarli ovunque.
        </p>
      ) : conAccount ? (
        <p className="text-sm text-ink-soft">Sono salvati nel tuo account: li ritrovi su ogni dispositivo.</p>
      ) : null}

      {!pronto ? <p className="text-center text-ink-soft">Carico i preferiti…</p> : null}
      {pronto && miei.length === 0 ? (
        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 rounded-3xl bg-surface p-8 text-center shadow-carta">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-cta-field text-cta-2">
            <Icona nome="favorite" dimensione={32} />
          </span>
          <p className="font-display text-xl font-semibold text-accent-2">Nessun preferito, per ora</p>
          <p className="text-sm text-ink-soft">Tocca il cuore su un regalo del catalogo per tenerlo qui.</p>
          <BottoneLink href="/catalogo" pieno className="mt-2">
            Vai al catalogo
          </BottoneLink>
        </div>
      ) : null}
      {miei.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {miei.map((p) => (
            <li key={p.slug}>
              <SchedaProdotto prodotto={p} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
