"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { IconaAvviso } from "./icone";

/**
 * Pannello che sale dal basso sul telefono, finestra al centro da tablet in su, con una «×» per chiuderla.
 * Il focus va sulla «×» e torna dove era; Esc chiude.
 */
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-velo sm:items-center sm:p-4" onClick={onChiudi}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-describedby={idTesto}
        onClick={(e) => e.stopPropagation()}
        className="relative flex w-full flex-col items-center gap-3 rounded-t-[28px] bg-surface p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-10 text-center shadow-sollevata sm:max-w-sm sm:rounded-contenitore sm:pb-6"
      >
        <button
          ref={chiudi}
          type="button"
          onClick={onChiudi}
          aria-label="Chiudi"
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-2xl leading-none text-ink hover:bg-line"
        >
          <span aria-hidden="true">×</span>
        </button>
        {/* la maniglia del pannello, solo sul telefono */}
        <span aria-hidden="true" className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-line-forte sm:hidden" />
        <IconaAvviso width={32} height={32} className="text-error" />
        <div id={idTesto} className="text-lg font-semibold">
          {children}
        </div>
      </div>
    </div>
  );
}
