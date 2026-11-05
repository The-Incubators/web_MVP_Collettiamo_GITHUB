"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Il velo con il foglio: dal basso sul telefono, al centro su desktop. Il focus va nel foglio e torna dove era; Esc e
 * un tocco sul velo chiudono; la pagina sotto non scorre.
 */
export function Velo({ alto = false, onChiudi, etichetta, children }: { alto?: boolean; onChiudi: () => void; etichetta: string; children: ReactNode }) {
  const foglio = useRef<HTMLDivElement>(null);
  const chiudi = useRef(onChiudi);
  chiudi.current = onChiudi;
  useEffect(() => {
    const prima = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    foglio.current?.querySelector<HTMLElement>("h2")?.focus();
    const tasto = (e: KeyboardEvent) => {
      if (e.key === "Escape") chiudi.current();
    };
    document.addEventListener("keydown", tasto);
    return () => {
      document.removeEventListener("keydown", tasto);
      document.body.style.overflow = overflow;
      prima?.focus?.();
    };
  }, []);
  return (
    <div className={`velo${alto ? " alto" : ""}`} onClick={(e) => e.target === e.currentTarget && onChiudi()}>
      <div ref={foglio} className={alto ? "foglio-grande" : "foglio"} role="dialog" aria-modal="true" aria-labelledby={etichetta}>
        {children}
      </div>
    </div>
  );
}

