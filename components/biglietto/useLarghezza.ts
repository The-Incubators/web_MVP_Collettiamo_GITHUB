"use client";

import { useCallback, useLayoutEffect, useState } from "react";

/**
 * Misura la larghezza del contenitore, per rendere il biglietto alla larghezza disponibile (max `massimo`).
 * Il riferimento è una funzione: la misura parte anche se l'elemento compare più tardi (es. dopo un caricamento).
 */
export function useLarghezza(massimo: number): [(el: HTMLDivElement | null) => void, number] {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const [larghezza, setLarghezza] = useState(Math.min(massimo, 320));
  const rif = useCallback((x: HTMLDivElement | null) => setEl(x), []);
  useLayoutEffect(() => {
    if (!el) return;
    const aggiorna = () => setLarghezza(Math.min(massimo, Math.floor(el.getBoundingClientRect().width)));
    aggiorna();
    const ro = new ResizeObserver(aggiorna);
    ro.observe(el);
    return () => ro.disconnect();
  }, [el, massimo]);
  return [rif, larghezza];
}
