"use client";

import Link from "next/link";
import { useState } from "react";
import { classiBottone } from "@/components/ui/Bottone";
import { IconaPersone } from "@/components/ui";
import { formattaEuro } from "@/lib/dominio/importi";
import { quotaProposta } from "@/lib/dominio/quota";

export function CalcoloAGruppo({ slug, prezzoCent }: { slug: string; prezzoCent: number }) {
  const [persone, setPersone] = useState(12);
  const quota = quotaProposta(prezzoCent, persone);
  const cambia = (n: number) => setPersone(Math.max(2, Math.min(50, n)));
  return (
    <section aria-labelledby="regalo-di-gruppo" className="flex flex-col gap-4 rounded-contenitore border border-accent bg-accent-field p-5">
      <h2 id="regalo-di-gruppo" className="text-xl">
        Regalo di gruppo
      </h2>
      <p className="text-lg" aria-live="polite">
        Con <strong className="cifre">{persone}</strong> persone sono <strong className="cifre text-2xl">{formattaEuro(quota)}</strong> a testa
      </p>
      <div className="flex items-center gap-3" role="group" aria-label="Numero di persone">
        <IconaPersone className="text-accent-2" />
        <button
          type="button"
          onClick={() => cambia(persone - 1)}
          aria-label="Una persona in meno"
          className="flex h-11 w-11 items-center justify-center rounded-controllo border border-line bg-surface text-xl font-bold"
        >
          −
        </button>
        <input
          type="range"
          min={2}
          max={50}
          value={persone}
          onChange={(e) => cambia(Number(e.target.value))}
          aria-label="Numero di persone"
          className="h-11 min-w-0 flex-1 accent-[var(--accent)]"
        />
        <button
          type="button"
          onClick={() => cambia(persone + 1)}
          aria-label="Una persona in più"
          className="flex h-11 w-11 items-center justify-center rounded-controllo border border-line bg-surface text-xl font-bold"
        >
          +
        </button>
      </div>
      <Link href={`/crea?prodotto=${slug}&persone=${persone}`} className={classiBottone("primario", "normale", "w-full")}>
        Organizza la colletta
      </Link>
    </section>
  );
}
