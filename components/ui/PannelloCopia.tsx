"use client";

import { useEffect, useRef, useState } from "react";
import { IconaCopia, IconaSpunta } from "./icone";

/**
 * navigator.clipboard.writeText dentro il gestore del click; se viene rifiutato si ripiega
 * sulla selezione del testo. Conferma visibile per circa un secondo e mezzo.
 */
export function useCopia(): { copiato: boolean; copia: (testo: string, sorgente?: HTMLElement | null) => Promise<boolean> } {
  const [copiato, setCopiato] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  async function copia(testo: string, sorgente?: HTMLElement | null): Promise<boolean> {
    let riuscito = false;
    try {
      await navigator.clipboard.writeText(testo);
      riuscito = true;
    } catch {
      if (sorgente) {
        const intervallo = document.createRange();
        intervallo.selectNodeContents(sorgente);
        const selezione = window.getSelection();
        selezione?.removeAllRanges();
        selezione?.addRange(intervallo);
        try {
          riuscito = document.execCommand("copy");
        } catch {
          riuscito = false;
        }
      }
    }
    if (riuscito) {
      setCopiato(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopiato(false), 1500);
    }
    return riuscito;
  }
  return { copiato, copia };
}

export function BottoneCopia({
  testo,
  etichetta = "Copia",
  sorgente,
  piccolo = true,
  pieno = false,
  onCopia,
}: {
  testo: string;
  etichetta?: string;
  sorgente?: React.RefObject<HTMLElement | null>;
  piccolo?: boolean;
  pieno?: boolean;
  /** chiamata dopo una copia riuscita */
  onCopia?: () => void;
}) {
  const { copiato, copia } = useCopia();
  return (
    <button
      type="button"
      onClick={() => void copia(testo, sorgente?.current).then((ok) => ok && onCopia?.())}
      className={`inline-flex min-h-tocco items-center justify-center gap-2 rounded-controllo border border-line bg-surface font-semibold text-ink transition-colors hover:bg-surface-2 ${
        piccolo ? "px-3 text-sm" : "px-5 text-base"
      } ${pieno ? "w-full" : ""}`}
    >
      {copiato ? <IconaSpunta width={18} height={18} className="text-ok" /> : <IconaCopia width={18} height={18} />}
      <span aria-live="polite">{copiato ? "Copiato" : etichetta}</span>
    </button>
  );
}

/** Un valore da copiare: etichetta, testo ben leggibile e pulsante di copia accanto. */
export function PannelloCopia({
  etichetta,
  valore,
  copiabile,
  grande = false,
}: {
  etichetta: string;
  valore: string;
  /** cosa finisce negli appunti, se diverso da ciò che si vede (es. l'IBAN senza spazi) */
  copiabile?: string;
  grande?: boolean;
}) {
  const ref = useRef<HTMLElement | null>(null);
  return (
    <div className="flex items-center gap-3 rounded-controllo border border-line bg-surface-2 p-3">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-soft">{etichetta}</span>
        <span
          ref={ref}
          className={`break-words ${grande ? "cifre text-xl font-bold" : "font-medium"}`}
        >
          {valore.includes(" ") && valore.length > 12
            ? valore.split(" ").map((gruppo, i) => (
                <span key={i} className="whitespace-nowrap">
                  {i > 0 ? " " : ""}
                  {gruppo}
                </span>
              ))
            : valore}
        </span>
      </div>
      <BottoneCopia testo={copiabile ?? valore} etichetta="Copia" sorgente={ref} />
    </div>
  );
}
