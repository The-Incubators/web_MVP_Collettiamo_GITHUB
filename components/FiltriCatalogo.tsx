"use client";

import { useEffect, useId, useState, type ReactNode } from "react";

/** I filtri del catalogo: all'inizio si vede solo il pulsante «Filtra»; toccandolo si apre il menu. */
export function FiltriCatalogo({ attivi, conteggio, children }: { attivi: number; conteggio: string; children: ReactNode }) {
  const [aperto, setAperto] = useState(false);
  const id = useId();

  useEffect(() => {
    if (!aperto) return;
    const tasto = (e: KeyboardEvent) => e.key === "Escape" && setAperto(false);
    document.addEventListener("keydown", tasto);
    return () => document.removeEventListener("keydown", tasto);
  }, [aperto]);

  return (
    <section aria-label="Filtri" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          aria-expanded={aperto}
          aria-controls={id}
          onClick={() => setAperto((v) => !v)}
          className={`inline-flex min-h-tocco items-center gap-2 rounded-controllo border px-4 font-semibold transition-colors ${
            aperto ? "border-accent bg-accent-field" : "border-line bg-surface hover:bg-surface-2"
          }`}
        >
          <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          Filtra
          {attivi > 0 ? (
            <span className="cifre flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-on-accent">
              <span className="sr-only">filtri attivi: </span>
              {attivi}
            </span>
          ) : null}
        </button>
        <p className="text-sm text-ink-soft" aria-live="polite">
          {conteggio}
        </p>
      </div>
      <div id={id} hidden={!aperto} className={aperto ? "contenitore flex flex-col gap-4 p-4" : "hidden"}>
        {children}
      </div>
    </section>
  );
}
