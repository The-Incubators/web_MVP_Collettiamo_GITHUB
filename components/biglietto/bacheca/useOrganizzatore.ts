"use client";

import { useCallback, useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { chiaveBozza, useApi } from "@/lib/biglietti/client";
import type { BigliettoPubblico, Firma } from "@/lib/tipi";

/**
 * Chi guarda la bacheca è chi l'ha organizzata? Lo è se il server gli dà tutte le firme (anche le nascoste):
 * con l'account, o con la chiave della bozza di questo browser. Gli altri non fanno nemmeno la richiesta.
 */
export function useOrganizzatore(b: Pick<BigliettoPubblico, "id">) {
  const api = useApi();
  const { utente, pronto } = useApp();
  const [tutte, setTutte] = useState<Firma[] | null>(null);

  const ricarica = useCallback(async () => {
    try {
      const r = await api<{ firme: Firma[] }>(`/api/biglietti/${b.id}/firme`, { bigliettoId: b.id });
      setTutte(r.firme);
    } catch {
      setTutte(null);
    }
  }, [api, b.id]);

  useEffect(() => {
    if (!pronto || (!utente && !chiaveBozza(b.id))) return;
    void ricarica();
  }, [pronto, utente, b.id, ricarica]);

  return { organizzatore: tutte !== null, tutte, setTutte, ricarica, api };
}
