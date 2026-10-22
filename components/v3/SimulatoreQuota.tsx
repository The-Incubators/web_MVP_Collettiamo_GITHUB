"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icona } from "@/components/v3/Icona";
import { formattaEuro } from "@/lib/dominio/importi";
import { quotaProposta } from "@/lib/dominio/quota";

export interface IdeaSimulatore {
  slug: string;
  nome: string;
  prezzoCent: number;
}

/**
 * Il simulatore della home di UX_V3: budget e numero di amici, quota a testa calcolata mentre scrivi.
 *
 * Il conto è quello vero del sito (`quotaProposta`, la stessa funzione del wizard e della scheda
 * prodotto), non una formula riscritta qui: così la cifra promessa in home è quella che si troverà poi.
 * Le idee pronte sono prodotti veri del catalogo, non esempi inventati.
 *
 * «Lancia la colletta ora» porta al wizard con i dati già impostati: il prodotto se è stato scelto
 * dalle idee, altrimenti solo il numero di partecipanti, e il regalo si sceglie lì.
 */

const MIN_AMICI = 2;
const MAX_AMICI = 200;

export function SimulatoreQuota({ idee }: { idee: IdeaSimulatore[] }) {
  const router = useRouter();
  const [scelta, setScelta] = useState<IdeaSimulatore | null>(idee[0] ?? null);
  const [euro, setEuro] = useState<string>(idee[0] ? String(Math.round(idee[0].prezzoCent / 100)) : "150");
  const [amici, setAmici] = useState(10);

  const totaleCent = Math.max(0, Math.round((Number(euro.replace(",", ".")) || 0) * 100));
  const quota = quotaProposta(totaleCent, amici);

  function scegliIdea(i: IdeaSimulatore) {
    setScelta(i);
    setEuro(String(Math.round(i.prezzoCent / 100)));
  }

  function cambiaEuro(v: string) {
    setEuro(v.replace(/[^\d.,]/g, "").slice(0, 7));
    setScelta(null); // il budget scritto a mano non è più l'idea scelta
  }

  function lancia() {
    const q = new URLSearchParams({ persone: String(amici) });
    if (scelta) q.set("prodotto", scelta.slug);
    router.push(`/crea?${q.toString()}`);
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border-warm bg-surface-cream-card p-space-md shadow-md">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-text-muted">Simulatore rapido</span>
          <span className="font-headline-sm text-headline-sm text-primary-container">Cosa regaliamo?</span>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-gold-tint px-2.5 py-1 font-label-sm text-[11px] font-bold text-gift-gold">
          <Icona nome="bolt" dimensione={14} piena />3 sec
        </span>
      </div>

      {idee.length > 0 ? (
        <>
          <p className="mb-2 font-body-sm text-body-sm text-text-muted">Seleziona un&apos;idea o digita il budget</p>
          <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Idee pronte">
            {idee.map((i) => {
              const attiva = scelta?.slug === i.slug;
              return (
                <button
                  key={i.slug}
                  type="button"
                  aria-pressed={attiva}
                  onClick={() => scegliIdea(i)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-label-sm text-label-sm transition-colors ${
                    attiva ? "bg-secondary-container text-on-secondary shadow-sm" : "bg-surface-container-low text-on-surface hover:bg-forest-tint"
                  }`}
                >
                  <Icona nome="redeem" dimensione={14} />
                  <span className="max-w-[9rem] truncate">{i.nome}</span>
                  <span className="cifre opacity-80">({formattaEuro(i.prezzoCent)})</span>
                </button>
              );
            })}
          </div>
        </>
      ) : null}

      <div className="mb-3 grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="sim-totale" className="font-label-sm text-label-sm text-text-muted">
            Costo regalo totale
          </label>
          <div className="flex items-center rounded-xl border border-border-warm bg-surface-container-lowest px-3">
            <input
              id="sim-totale"
              inputMode="decimal"
              value={euro}
              onChange={(e) => cambiaEuro(e.target.value)}
              className="cifre h-12 w-full bg-transparent text-xl font-bold text-on-surface focus:outline-none"
            />
            <span className="cifre pl-1 text-lg text-text-muted">€</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-label-sm text-label-sm text-text-muted" id="sim-amici">
            Numero amici
          </span>
          <div className="flex h-12 items-center justify-between rounded-xl border border-border-warm bg-surface-container-lowest px-2">
            <button
              type="button"
              aria-label="Un amico in meno"
              onClick={() => setAmici((n) => Math.max(MIN_AMICI, n - 1))}
              disabled={amici <= MIN_AMICI}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-primary-container transition-colors hover:bg-forest-tint disabled:opacity-40"
            >
              −
            </button>
            <output className="cifre text-xl font-bold" aria-labelledby="sim-amici">
              {amici}
            </output>
            <button
              type="button"
              aria-label="Un amico in più"
              onClick={() => setAmici((n) => Math.min(MAX_AMICI, n + 1))}
              disabled={amici >= MAX_AMICI}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-primary-container transition-colors hover:bg-forest-tint disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2 font-label-sm text-label-sm text-secondary">
        <Icona nome="groups" dimensione={16} />
        <span className="cifre">{amici}</span>
        <span>partecipanti</span>
      </div>

      <div className="mb-3 rounded-xl bg-forest-tint px-4 py-3">
        <span className="font-label-sm text-label-sm uppercase tracking-wider text-text-muted">Quota calcolata</span>
        <div className="flex items-baseline justify-between">
          <output className="cifre text-[28px] font-bold leading-tight text-primary-container" aria-live="polite">
            {formattaEuro(quota)} <span className="text-base font-semibold text-text-muted">/ persona</span>
          </output>
          <span className="flex items-center gap-1 font-label-sm text-[11px] text-primary-container">
            <Icona nome="check_circle" dimensione={14} piena />
            0 € trattenute
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={lancia}
        className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-secondary-container font-label-lg text-label-lg font-bold text-on-secondary shadow-md transition-all hover:bg-secondary active:scale-[0.98]"
      >
        <Icona nome="rocket_launch" dimensione={20} />
        <span>Lancia la colletta ora</span>
      </button>
    </div>
  );
}
