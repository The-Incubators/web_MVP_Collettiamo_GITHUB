"use client";

import { useCopia } from "./ui/PannelloCopia";
import { Icona } from "./ui/Icona";

/** Condivide la pagina con il foglio di sistema del telefono; dove non c'è, copia il link. */
export function BottoneCondividi({ titolo }: { titolo: string }) {
  const { copiato, copia } = useCopia();
  async function condividi() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: titolo, url });
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return; // chiuso da chi condivide: non è un errore
      }
    }
    await copia(url);
  }
  return (
    <button
      type="button"
      onClick={() => void condividi()}
      aria-label={copiato ? "Link copiato" : `Condividi: ${titolo}`}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-ink shadow-carta"
    >
      <Icona nome={copiato ? "check" : "share"} dimensione={20} />
    </button>
  );
}
