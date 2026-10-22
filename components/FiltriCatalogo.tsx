"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Icona } from "./ui/Icona";

/**
 * Il pulsante «Filtri» e il foglio che sale dal basso con i gruppi di filtri. I filtri sono collegamenti
 * (vivono nell'indirizzo, così la pagina filtrata si può condividere): il foglio resta aperto mentre si
 * sceglie, e «Mostra N idee» lo chiude.
 */
export function FiltriCatalogo({ attivi, conteggio, children }: { attivi: number; conteggio: string; children: ReactNode }) {
  const [aperto, setAperto] = useState(false);
  const id = useId();
  const chiudi = useRef<HTMLButtonElement>(null);
  const bottone = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!aperto) return;
    const daRifocalizzare = bottone.current;
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    chiudi.current?.focus();
    const tasto = (e: KeyboardEvent) => e.key === "Escape" && setAperto(false);
    document.addEventListener("keydown", tasto);
    return () => {
      document.removeEventListener("keydown", tasto);
      document.documentElement.style.overflow = overflow;
      daRifocalizzare?.focus();
    };
  }, [aperto]);

  return (
    <>
      <button
        ref={bottone}
        type="button"
        aria-expanded={aperto}
        aria-controls={id}
        onClick={() => setAperto(true)}
        className="inline-flex h-12 shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 text-sm font-bold text-on-accent"
      >
        <Icona nome="tune" dimensione={20} />
        Filtri
        {attivi > 0 ? (
          <span className="cifre flex h-5 min-w-5 items-center justify-center rounded-full bg-cta px-1 text-[11px] font-bold text-accent-2">
            <span className="sr-only">attivi: </span>
            {attivi}
          </span>
        ) : null}
      </button>
      {aperto ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setAperto(false)}>
          <div
            id={id}
            role="dialog"
            aria-modal="true"
            aria-label="Filtri del catalogo"
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85dvh] w-full max-w-lg flex-col rounded-t-3xl bg-surface shadow-sollevata sm:rounded-3xl"
          >
            <div className="flex items-center justify-between px-5 pb-2 pt-4">
              <h2 className="text-xl font-semibold text-accent-2">Filtri</h2>
              <button
                ref={chiudi}
                type="button"
                onClick={() => setAperto(false)}
                aria-label="Chiudi i filtri"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-2"
              >
                <Icona nome="close" dimensione={22} />
              </button>
            </div>
            <div className="flex flex-col gap-5 overflow-y-auto px-5 py-3">{children}</div>
            <div className="border-t border-line p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => setAperto(false)}
                className="flex min-h-azione w-full items-center justify-center rounded-full bg-accent px-6 font-bold text-on-accent"
                aria-live="polite"
              >
                Mostra {conteggio}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
