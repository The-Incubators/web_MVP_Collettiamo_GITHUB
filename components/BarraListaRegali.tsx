"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { svuotaRegali, useListaRegali } from "@/lib/listaRegali";
import { barraNavigazioneVisibile } from "./Navigazione";
import { Icona } from "./ui/Icona";
import { ImmagineProdotto } from "./ui/ImmagineProdotto";

/** Compare in basso quando nella lista dei regali c'è qualcosa: da qui si fa votare il gruppo. */
export function BarraListaRegali() {
  const lista = useListaRegali();
  const percorso = usePathname();
  if (lista.length === 0 || percorso.startsWith("/crea") || percorso.startsWith("/accedi")) return null;
  const pronta = lista.length >= 2;
  return (
    // sul telefono sta sopra la barra di navigazione, quando c'è
    <div
      className={`no-stampa fixed inset-x-0 z-40 px-3 ${
        barraNavigazioneVisibile(percorso)
          ? "bottom-[calc(4rem+env(safe-area-inset-bottom))] pb-2 md:bottom-0 md:pb-4"
          : "bottom-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      }`}
    >
      <div className="mx-auto flex max-w-md items-center gap-2 rounded-full bg-accent p-1.5 pl-2 text-on-accent shadow-sollevata">
        <div aria-hidden="true" className="flex shrink-0 -space-x-3">
          {lista.slice(0, 2).map((p) => (
            <span key={p.nome} className="block h-10 w-10 overflow-hidden rounded-full bg-white ring-2 ring-accent">
              <ImmagineProdotto prodotto={p} className="aspect-square h-full" alt="" />
            </span>
          ))}
        </div>
        <p className="min-w-0 flex-1 text-sm leading-tight" aria-live="polite">
          <strong className="block">{lista.length === 1 ? "1 regalo scelto" : `${lista.length} regali scelti`}</strong>
          <span className="block truncate text-xs opacity-80">{pronta ? "Pronti per la votazione" : "Aggiungine un altro"}</span>
        </p>
        <button
          type="button"
          onClick={svuotaRegali}
          aria-label="Svuota la lista dei regali"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full opacity-80 hover:bg-white/10 hover:opacity-100"
        >
          <Icona nome="close" dimensione={20} />
        </button>
        {pronta ? (
          <Link
            href="/crea?lista=1"
            className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full bg-cta px-4 text-[19px] font-bold text-on-cta hover:bg-cta-2"
          >
            Fai votare
            <Icona nome="arrow_forward" dimensione={18} />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
