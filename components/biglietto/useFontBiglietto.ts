"use client";

import { useEffect } from "react";
import { urlGoogleFonts } from "@/lib/dominio/biglietti";

/** Carica (una volta) da Google Fonts i caratteri usati nei messaggi. */
export function useFontBiglietto(ids: Iterable<string>) {
  const url = urlGoogleFonts(ids);
  useEffect(() => {
    if (!url) return;
    if (document.head.querySelector(`link[data-font-biglietto][href="${CSS.escape(url)}"]`)) return;
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = url;
    l.dataset.fontBiglietto = "1";
    document.head.appendChild(l);
  }, [url]);
}
