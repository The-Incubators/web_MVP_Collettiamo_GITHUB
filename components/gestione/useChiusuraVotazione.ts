"use client";

import { useEffect } from "react";

/**
 * Quando il tempo della votazione scade con la pagina aperta, chiede al server di chiuderla (non c'è un processo
 * pianificato). Se non è ancora chiusa, riprova ogni 15 secondi.
 */
export function useChiusuraVotazione(slug: string, scade: number | null, quandoChiusa: () => void) {
  useEffect(() => {
    if (scade === null) return;
    let attivo = true;
    let timer: ReturnType<typeof setTimeout>;
    const giro = async () => {
      try {
        await fetch("/api/votazione/chiudi", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug }) });
        if (attivo) quandoChiusa();
      } catch {
        /* si riprova */
      }
      if (attivo) timer = setTimeout(giro, 15_000);
    };
    timer = setTimeout(giro, Math.min(Math.max(0, scade - Date.now()) + 800, 2_000_000_000));
    return () => {
      attivo = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, scade]);
}
