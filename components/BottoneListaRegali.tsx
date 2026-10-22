"use client";

import { aggiungiARegali, togliDaRegali, useListaRegali } from "@/lib/listaRegali";
import { contiene } from "@/lib/dominio/regali";
import type { ProdottoColletta } from "@/lib/tipi";
import { IconaPiu, IconaSpunta } from "./ui";

/**
 * Il «+» sul riquadro di un prodotto: lo mette nella lista dei regali (e lo toglie se già c'è).
 * Con il mouse sopra compare «Aggiungi alla lista dei regali».
 */
export function BottoneListaRegali({ prodotto, className = "", variante = "piu" }: { prodotto: ProdottoColletta; className?: string; variante?: "piu" | "testo" | "largo" }) {
  const lista = useListaRegali();
  const dentro = contiene(lista, prodotto);
  const testo = dentro ? "Nella lista dei regali: tocca per toglierlo" : "Aggiungi alla lista dei regali";
  if (variante === "largo") {
    // Nella scheda prodotto: pillola chiara a tutta larghezza, sotto «Organizza la colletta».
    return (
      <button
        type="button"
        aria-pressed={dentro}
        onClick={() => (dentro ? togliDaRegali(prodotto) : aggiungiARegali(prodotto))}
        className={`flex min-h-azione w-full items-center justify-center gap-2 rounded-full border-[1.5px] px-5 font-bold transition-colors ${
          dentro ? "border-accent bg-accent-field text-accent" : "border-line bg-surface text-accent hover:border-accent"
        } ${className}`}
      >
        {dentro ? <IconaSpunta width={20} height={20} /> : <IconaPiu width={20} height={20} />}
        {dentro ? "Nella lista per la votazione" : "Aggiungi alla lista per votazione"}
      </button>
    );
  }
  if (variante === "testo") {
    // In fondo al riquadro del prodotto: «+» con la scritta, a tutta larghezza.
    return (
      <button
        type="button"
        aria-pressed={dentro}
        onClick={() => (dentro ? togliDaRegali(prodotto) : aggiungiARegali(prodotto))}
        className={`flex min-h-tocco w-full items-center justify-center gap-1.5 rounded-full px-3 text-xs font-bold transition-colors ${
          dentro ? "bg-accent-field text-accent" : "bg-surface-2 text-ink hover:bg-line"
        } ${className}`}
      >
        {dentro ? <IconaSpunta width={16} height={16} /> : <IconaPiu width={16} height={16} />}
        <span>
          {dentro ? "In lista votazione" : "Lista regali"}
          <span className="sr-only">: {prodotto.nome}</span>
        </span>
      </button>
    );
  }

  return (
    // il contenitore porta la posizione (absolute sulle schede, relative altrove) e fa da riferimento al suggerimento
    <span className={`group/piu inline-flex ${className || "relative"}`}>
      <button
        type="button"
        aria-pressed={dentro}
        aria-label={`${testo}: ${prodotto.nome}`}
        onClick={() => (dentro ? togliDaRegali(prodotto) : aggiungiARegali(prodotto))}
        className={`flex h-11 w-11 items-center justify-center rounded-full border shadow-sm transition-colors ${
          dentro ? "border-accent bg-accent text-on-accent" : "border-line bg-surface text-ink hover:bg-accent-field"
        }`}
      >
        {dentro ? <IconaSpunta width={22} height={22} /> : <IconaPiu width={22} height={22} />}
      </button>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-full z-20 mt-1 hidden whitespace-nowrap rounded-controllo bg-ink px-2.5 py-1.5 text-xs font-medium text-field group-hover/piu:block group-focus-within/piu:block"
      >
        {dentro ? "Nella lista dei regali" : "Aggiungi alla lista dei regali"}
      </span>
    </span>
  );
}
