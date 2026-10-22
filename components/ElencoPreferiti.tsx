"use client";

import Link from "next/link";
import { SchedaProdotto } from "@/components/SchedaProdotto";
import { useApp } from "./AppProvider";
import { usePreferiti } from "./PreferitiProvider";
import { BottoneLink } from "./ui";
import type { Prodotto } from "@/lib/tipi";

/** La pagina «Preferiti»: i prodotti che hai segnato con il cuore nel catalogo. */
export function ElencoPreferiti({ prodotti }: { prodotti: Prodotto[] }) {
  const { preferiti, pronto, conAccount } = usePreferiti();
  const { utente, pronto: autenticazionePronta } = useApp();
  const miei = prodotti.filter((p) => preferiti.has(p.slug));

  return (
    <div className="mx-auto flex max-w-catalogo flex-col gap-5">
      <h1 className="text-center text-2xl sm:text-3xl">I tuoi preferiti</h1>

      {autenticazionePronta && !utente ? (
        <p className="text-center text-sm text-ink-soft">
          Sono salvati su questo dispositivo.{" "}
          <Link href="/accedi?next=/preferiti" className="font-semibold text-accent-2 underline underline-offset-4">
            Accedi
          </Link>{" "}
          per ritrovarli ovunque.
        </p>
      ) : conAccount ? (
        <p className="text-center text-sm text-ink-soft">Sono salvati nel tuo account: li ritrovi su ogni dispositivo.</p>
      ) : null}

      {!pronto ? <p className="text-center text-ink-soft">Carico i preferiti…</p> : null}
      {pronto && miei.length === 0 ? (
        <div className="contenitore mx-auto flex max-w-md flex-col items-center gap-3 p-6 text-center">
          <p className="text-lg font-semibold">Nessun preferito, per ora</p>
          <p className="text-ink-soft">Nel catalogo tocca il cuore su un prodotto per tenerlo qui.</p>
          <BottoneLink href="/catalogo">Guarda il catalogo</BottoneLink>
        </div>
      ) : null}
      {miei.length > 0 ? (
        <>
          <p className="text-sm text-ink-soft" aria-live="polite">
            {miei.length === 1 ? "1 prodotto" : `${miei.length} prodotti`}
          </p>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {miei.map((p) => (
              <li key={p.slug} className="flex">
                <div className="flex w-full flex-col [&>article]:flex-1">
                  <SchedaProdotto prodotto={p} />
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
