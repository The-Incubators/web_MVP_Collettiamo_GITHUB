"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { IconaAvviso } from "./icone";

/** Finestra al centro della pagina, con una «×» per chiuderla. Il focus va sulla «×» e torna dove era; Esc chiude. */
export function Dialogo({ aperto, onChiudi, children }: { aperto: boolean; onChiudi: () => void; children: ReactNode }) {
  const idTesto = useId();
  const chiudi = useRef<HTMLButtonElement>(null);
  const onChiudiRef = useRef(onChiudi);
  onChiudiRef.current = onChiudi;

  useEffect(() => {
    if (!aperto) return;
    const precedente = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    chiudi.current?.focus();
    const tasto = (e: KeyboardEvent) => {
      if (e.key === "Escape") onChiudiRef.current();
      // l'unico controllo è la «×»: il focus non esce dalla finestra
      if (e.key === "Tab") {
        e.preventDefault();
        chiudi.current?.focus();
      }
    };
    document.addEventListener("keydown", tasto);
    return () => {
      document.removeEventListener("keydown", tasto);
      document.body.style.overflow = overflow;
      precedente?.focus?.();
    };
  }, [aperto]);

  if (!aperto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onChiudi}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-describedby={idTesto}
        onClick={(e) => e.stopPropagation()}
        className="relative flex w-full max-w-sm flex-col items-center gap-3 rounded-contenitore border border-line bg-surface p-6 pt-8 text-center shadow-sollevata"
      >
        <button
          ref={chiudi}
          type="button"
          onClick={onChiudi}
          aria-label="Chiudi"
          className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full text-2xl leading-none text-ink hover:bg-surface-2"
        >
          <span aria-hidden="true">×</span>
        </button>
        <IconaAvviso width={32} height={32} className="text-error" />
        <div id={idTesto} className="text-lg font-semibold">
          {children}
        </div>
      </div>
    </div>
  );
}
