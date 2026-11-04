"use client";

import { usePreferiti } from "./PreferitiProvider";

/** L'icona dei preferiti sul riquadro di un prodotto: un cuore, vuoto o pieno. */
export function BottoneCuore({ slug, nome, className = "" }: { slug: string; nome: string; className?: string }) {
  const { preferiti, toggle } = usePreferiti();
  const dentro = preferiti.has(slug);
  return (
    <button
      type="button"
      aria-pressed={dentro}
      aria-label={dentro ? `Togli dai preferiti: ${nome}` : `Aggiungi ai preferiti: ${nome}`}
      title={dentro ? "Togli dai preferiti" : "Aggiungi ai preferiti"}
      onClick={() => toggle(slug)}
      className={`flex h-10 w-10 items-center justify-center rounded-full bg-surface shadow-carta transition-colors ${
        dentro ? "text-cta" : "text-ink hover:text-cta-2"
      } ${className}`}
    >
      <svg viewBox="0 0 24 24" width={22} height={22} aria-hidden="true" fill={dentro ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinejoin="round">
        <path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.7a4.3 4.3 0 0 1 7.5 2.6c0 5.6-7.5 10.2-7.5 10.2z" />
      </svg>
    </button>
  );
}

/** Lo stesso preferito, come pillola con la scritta (catalogo del regalo singolo, sopra «Guarda su Amazon»). */
export function BottonePreferitiTesto({ slug, nome }: { slug: string; nome: string }) {
  const { preferiti, toggle } = usePreferiti();
  const dentro = preferiti.has(slug);
  return (
    <button
      type="button"
      aria-pressed={dentro}
      aria-label={dentro ? `Nei preferiti: ${nome}, tocca per toglierlo` : `Aggiungi ai preferiti: ${nome}`}
      onClick={() => toggle(slug)}
      className={`flex min-h-tocco w-full items-center justify-center gap-1.5 rounded-full px-3 text-xs font-bold transition-colors ${
        dentro ? "bg-cta-field text-cta-2" : "bg-surface-2 text-ink hover:bg-line"
      }`}
    >
      {dentro ? "Nei preferiti" : "Aggiungi ai preferiti"}
    </button>
  );
}
