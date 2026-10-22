"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { formattaEuro } from "@/lib/dominio/importi";
import { quotaProposta } from "@/lib/dominio/quota";
import { PERSONE_PREDEFINITE } from "./SchedaProdotto";
import { classiBottone } from "./ui/Bottone";
import { Icona } from "./ui/Icona";

/**
 * «Calcola la quota con gli amici» e il pulsante «Organizza la colletta», che porta al wizard con lo stesso
 * numero di persone. `children` sta fra i due (nella scheda prodotto: i dettagli), perché il numero scelto
 * qui deve arrivare al pulsante sotto.
 */
export function CalcoloAGruppo({ slug, prezzoCent, children }: { slug: string; prezzoCent: number; children?: ReactNode }) {
  const [persone, setPersone] = useState(PERSONE_PREDEFINITE);
  const quota = quotaProposta(prezzoCent, persone);
  const cambia = (n: number) => setPersone(Math.max(2, Math.min(50, n)));
  const tondo = "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface shadow-carta disabled:opacity-40";
  return (
    <>
      <section aria-labelledby="calcola-quota" className="flex flex-col gap-3 rounded-3xl bg-surface-2 p-4">
        <h2 id="calcola-quota" className="flex items-center gap-2 text-xl font-semibold text-accent-2">
          <Icona nome="group" />
          Calcola la quota con gli amici
        </h2>
        <div className="flex flex-col items-center gap-0.5 rounded-2xl bg-surface p-4 text-center shadow-carta" aria-live="polite">
          <p>
            <span className="cifre text-4xl font-extrabold text-cta-2">{formattaEuro(quota)}</span>
            <span className="text-sm font-semibold text-ink-soft"> / persona</span>
          </p>
          <p className="text-xs font-semibold text-ink-soft">
            Se partecipate in <span className="cifre">{persone}</span>
          </p>
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Numero di persone">
          <button type="button" onClick={() => cambia(persone - 1)} disabled={persone <= 2} aria-label="Una persona in meno" className={tondo}>
            <Icona nome="remove" />
          </button>
          <p className="flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-surface font-bold shadow-carta">
            <Icona nome="groups" dimensione={20} />
            <span className="cifre">{persone}</span> persone
          </p>
          <button type="button" onClick={() => cambia(persone + 1)} disabled={persone >= 50} aria-label="Una persona in più" className={tondo}>
            <Icona nome="add" />
          </button>
        </div>
      </section>
      {children}
      <Link href={`/crea?prodotto=${encodeURIComponent(slug)}&persone=${persone}`} className={classiBottone("azione", "normale", "w-full")}>
        <Icona nome="volunteer_activism" dimensione={22} />
        Organizza la colletta
      </Link>
    </>
  );
}
