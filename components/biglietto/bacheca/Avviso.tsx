"use client";

import { useEffect, useState } from "react";

/** Un avviso breve in alto che sparisce da solo. */
export function useAvviso(): [string, (testo: string) => void] {
  const [avviso, setAvviso] = useState("");
  useEffect(() => {
    if (!avviso) return;
    const t = setTimeout(() => setAvviso(""), 3500);
    return () => clearTimeout(t);
  }, [avviso]);
  return [avviso, setAvviso];
}

export function Avviso({ testo }: { testo: string }) {
  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      {testo ? <p className="animate-[apri_150ms_ease-out] animate-apri rounded-full bg-[#16241F] px-5 py-3 text-sm font-semibold text-white shadow-sollevata">{testo}</p> : null}
    </div>
  );
}

/** Condivide il link (menu del telefono) o, se non si può, lo copia. Restituisce l'avviso da mostrare, se serve. */
export async function condividiLink(url: string, titolo: string, testo: string): Promise<string> {
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title: titolo, text: testo, url });
    } catch {
      /* condivisione annullata */
    }
    return "";
  }
  try {
    await navigator.clipboard.writeText(url);
    return "Link copiato: incollalo dove vuoi.";
  } catch {
    return url;
  }
}
