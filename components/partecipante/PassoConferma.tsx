"use client";

import { useState } from "react";
import { Avviso, Bottone, Campo } from "@/components/ui";
import { formattaEuro } from "@/lib/dominio/importi";
import { ErroreDominio } from "@/lib/dominio/operazioni";
import type { Partecipazione } from "./usePartecipazione";

/** La schermata più importante del prototipo. */
export function PassoConferma({
  p,
  importo,
  importoLibero,
  onImportoLibero,
  onSi,
  onNo,
}: {
  p: Partecipazione;
  importo: number | null;
  importoLibero: string;
  onImportoLibero: (t: string) => void;
  onSi: () => Promise<void>;
  onNo: () => void;
}) {
  const c = p.colletta;
  const [occupato, setOccupato] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  async function si() {
    if (c.modoQuota === "libera" && !importo) {
      setErrore("Scrivi quanto hai dato, per esempio 10 o 12,50.");
      return;
    }
    setErrore(null);
    setOccupato(true);
    try {
      await onSi();
    } catch (e) {
      setErrore(e instanceof ErroreDominio ? e.message : "Non sono riuscito a salvare. Controlla la connessione e riprova.");
      setOccupato(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-3xl leading-tight">Hai pagato?</h2>
      <p className="text-lg">Confermalo qui, così {c.organizzatoreNome} non deve chiedertelo.</p>
      {c.modoQuota === "libera" ? (
        <Campo etichetta="Quanto hai dato? (€)" inputMode="decimal" value={importoLibero} onChange={(e) => onImportoLibero(e.target.value)} />
      ) : importo ? (
        <p className="cifre text-2xl font-bold">{formattaEuro(importo)}</p>
      ) : null}
      {errore ? (
        <Avviso tono="attenzione" live>
          <p>{errore}</p>
        </Avviso>
      ) : null}
      <div className="flex flex-col gap-3">
        <Bottone pieno onClick={() => void si()} disabled={occupato}>
          {occupato ? "Un attimo…" : "Sì, ho pagato"}
        </Bottone>
        <Bottone pieno variante="secondario" onClick={onNo} disabled={occupato}>
          Non ancora, lo faccio dopo
        </Bottone>
      </div>
    </div>
  );
}
