"use client";

import { useCallback, useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { useApi } from "@/lib/biglietti/client";
import type { Biglietto } from "@/lib/tipi";

export type BigliettoOrganizzatore = Omit<Biglietto, never>;

/** La bozza (o il biglietto) di chi organizza: con la chiave di questo browser o con l'account. */
export function useBozza(id: string) {
  const api = useApi();
  const { pronto } = useApp();
  const [b, setB] = useState<BigliettoOrganizzatore | null>(null);
  const [stato, setStato] = useState<"carica" | "ok" | "assente" | "errore">("carica");

  const carica = useCallback(async () => {
    try {
      const r = await api<{ biglietto: BigliettoOrganizzatore }>(`/api/biglietti/${encodeURIComponent(id)}`, { bigliettoId: id });
      setB(r.biglietto);
      setStato("ok");
    } catch (e) {
      setStato((e as { status?: number }).status === 404 ? "assente" : "errore");
    }
  }, [api, id]);

  useEffect(() => {
    if (pronto) void carica();
  }, [pronto, carica]);

  return { b, setB, stato, ricarica: carica, api };
}
