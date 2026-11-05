"use client";

import { usePreferiti } from "./PreferitiProvider";

/**
 * L'icona dei preferiti sul riquadro di un prodotto: un cuore, vuoto o pieno. Il cuore è l'unico modo di salvare.
 * `tessera` è il cuore della tessera di Gifty UX v2 (classe `.cuore`, 44 px in alto a destra sulla lastra).
 */
export function BottoneCuore({ slug, nome, className = "", tessera = false }: { slug: string; nome: string; className?: string; tessera?: boolean }) {
  const { preferiti, toggle } = usePreferiti();
  const dentro = preferiti.has(slug);
  return (
    <button
      type="button"
      aria-pressed={dentro}
      aria-label={dentro ? `Togli dai preferiti: ${nome}` : `Salva nei preferiti: ${nome}`}
      title={dentro ? "Togli dai preferiti" : "Salva nei preferiti"}
      onClick={() => toggle(slug)}
      className={
        tessera
          ? `cuore ${className}`.trim()
          : `flex h-10 w-10 items-center justify-center rounded-full bg-surface shadow-carta transition-colors ${
              dentro ? "text-cta" : "text-ink hover:text-cta-2"
            } ${className}`
      }
    >
      <svg viewBox="0 0 24 24" width={22} height={22} aria-hidden="true" fill={dentro ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinejoin="round">
        <path d={tessera ? "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" : "M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.7a4.3 4.3 0 0 1 7.5 2.6c0 5.6-7.5 10.2-7.5 10.2z"} />
      </svg>
    </button>
  );
}

/**
 * Lo stesso preferito, come pillola con la scritta, sopra «Guarda su Amazon» nel regalo singolo:
 * piccola nel catalogo, `grande` nella scheda del prodotto.
 */
export function BottonePreferitiTesto({ slug, nome, grande }: { slug: string; nome: string; grande?: boolean }) {
  const { preferiti, toggle } = usePreferiti();
  const dentro = preferiti.has(slug);
  return (
    <button
      type="button"
      aria-pressed={dentro}
      aria-label={dentro ? `Nei preferiti: ${nome}, tocca per toglierlo` : `Aggiungi ai preferiti: ${nome}`}
      onClick={() => toggle(slug)}
      className={`flex w-full items-center justify-center gap-1.5 rounded-full px-3 font-bold transition-colors ${grande ? "min-h-azione text-base" : "min-h-tocco text-xs"} ${
        dentro ? "bg-cta-field text-cta-2" : "bg-surface-2 text-ink hover:bg-line"
      }`}
    >
      {dentro ? "Nei preferiti" : "Aggiungi ai preferiti"}
    </button>
  );
}
