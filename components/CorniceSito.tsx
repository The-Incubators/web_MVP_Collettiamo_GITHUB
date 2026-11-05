"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { piePaginaVisibile } from "@/lib/navigazione";

/** Il piè di pagina, tolto nei percorsi a passi (lib/navigazione.ts). */
export function PiePaginaSeVisibile({ children }: { children: ReactNode }) {
  const percorso = usePathname();
  return piePaginaVisibile(percorso) ? <>{children}</> : null;
}

/**
 * Per le viste a tutto schermo dentro il sito (editor del biglietto, esempio): intestazione, piè di pagina e barre,
 * segnati `data-cornice` nel layout, diventano inerti finché la vista è aperta. Così tastiera e lettori di schermo non
 * finiscono su link nascosti sotto (audit T-03).
 */
export function useCorniceInerte() {
  useEffect(() => {
    const elementi = [...document.querySelectorAll<HTMLElement>("[data-cornice]")];
    for (const e of elementi) e.setAttribute("inert", "");
    return () => {
      for (const e of elementi) e.removeAttribute("inert");
    };
  }, []);
}
