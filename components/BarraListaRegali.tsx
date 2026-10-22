"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { svuotaRegali, useListaRegali } from "@/lib/listaRegali";
import { classiBottone } from "./ui/Bottone";

/** Compare in basso quando nella lista dei regali c'è qualcosa: da qui si fa votare il gruppo. */
export function BarraListaRegali() {
  const lista = useListaRegali();
  const percorso = usePathname();
  if (lista.length === 0 || percorso.startsWith("/crea") || percorso.startsWith("/accedi")) return null;
  const pronta = lista.length >= 2;
  return (
    <div className="no-stampa fixed inset-x-0 bottom-0 z-40 px-4 pb-4">
      <div className="mx-auto flex max-w-md flex-wrap items-center gap-3 rounded-contenitore border border-line bg-surface p-3 shadow-lg">
        <p className="min-w-0 flex-1 text-sm" aria-live="polite">
          <strong>Lista dei regali: {lista.length}</strong>
          <span className="block text-ink-soft">{pronta ? "Il gruppo può votare quello che preferisce." : "Aggiungine un altro per far votare il gruppo."}</span>
        </p>
        <button type="button" onClick={svuotaRegali} className="min-h-tocco px-2 text-sm font-semibold text-accent-2 underline underline-offset-4">
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
