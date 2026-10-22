"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { svuotaRegali, useListaRegali } from "@/lib/listaRegali";
import { barraNavigazioneVisibile } from "./Navigazione";
import { classiBottone } from "./ui/Bottone";

/** Compare in basso quando nella lista dei regali c'è qualcosa: da qui si fa votare il gruppo. */
export function BarraListaRegali() {
  const lista = useListaRegali();
  const percorso = usePathname();
  if (lista.length === 0 || percorso.startsWith("/crea") || percorso.startsWith("/accedi")) return null;
  const pronta = lista.length >= 2;
  return (
    // sul telefono sta sopra la barra di navigazione, quando c'è
    <div
      className={`no-stampa fixed inset-x-0 z-40 px-4 ${
        barraNavigazioneVisibile(percorso)
          ? "bottom-[calc(4rem+env(safe-area-inset-bottom))] pb-3 md:bottom-0 md:pb-4"
          : "bottom-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      }`}
    >
      <div className="mx-auto flex max-w-md flex-wrap items-center gap-3 rounded-contenitore border border-line bg-surface p-3 pl-5 shadow-sollevata">
        <p className="min-w-0 flex-1 text-sm" aria-live="polite">
          <strong>{lista.length === 1 ? "1 regalo in lista" : `${lista.length} regali in lista`}</strong>
          <span className="block text-ink-soft">{pronta ? "Pronti per la votazione" : "Aggiungine un altro per votare"}</span>
        </p>
        <button type="button" onClick={svuotaRegali} className="min-h-tocco px-2 text-sm font-semibold text-accent underline underline-offset-4">
          Svuota
        </button>
        {pronta ? (
          <Link href="/crea?lista=1" className={classiBottone("primario", "piccolo")}>
            Fai votare il gruppo
          </Link>
        ) : null}
      </div>
    </div>
  );
}
