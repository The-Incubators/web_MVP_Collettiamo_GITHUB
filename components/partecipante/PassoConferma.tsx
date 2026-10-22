"use client";

import { useState } from "react";
import { Avviso, Bottone, Campo, Icona } from "@/components/ui";
import { formattaEuro } from "@/lib/dominio/importi";
import { ErroreDominio } from "@/lib/dominio/operazioni";
import type { Partecipazione } from "./usePartecipazione";

/** La schermata più importante del prototipo: «Hai pagato?». Sta sotto i metodi, o da sola per chi torna sul link. */
export function PassoConferma({
  p,
  importo,
  importoLibero,
  onImportoLibero,
  chiediImporto,
  onSi,
  onNo,
}: {
  p: Partecipazione;
  importo: number | null;
  importoLibero: string;
  onImportoLibero: (t: string) => void;
  /** con la quota libera, quando l'importo non è già stato scritto più su */
  chiediImporto: boolean;
  onSi: () => Promise<void>;
  onNo: () => void;
}) {
  const c = p.colletta;
  const [occupato, setOccupato] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const cifra = importo ? formattaEuro(importo) : null;

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
    <section aria-labelledby="hai-pagato" className="flex flex-col gap-4 rounded-3xl bg-accent-field p-5 shadow-carta">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-on-accent">
          <Icona nome="verified" dimensione={26} />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id="hai-pagato" className="text-2xl font-bold leading-tight text-accent-2">
            {cifra && !chiediImporto ? `Hai inviato ${cifra}?` : "Hai pagato?"}
          </h2>
          <p className="text-sm">Confermalo qui con un tocco, così {c.organizzatoreNome} non deve chiedertelo.</p>
        </div>
      </div>
      {chiediImporto ? (
        <Campo etichetta="Quanto hai dato? (€)" inputMode="decimal" value={importoLibero} onChange={(e) => onImportoLibero(e.target.value)} />
      ) : null}
      {errore ? (
        <Avviso tono="attenzione" live>
          <p>{errore}</p>
        </Avviso>
      ) : null}
      <div className="flex flex-col gap-2">
        <Bottone pieno onClick={() => void si()} disabled={occupato}>
          <Icona nome="check_circle" dimensione={20} />
          {occupato ? "Un attimo…" : "Sì, ho pagato"}
        </Bottone>
        <Bottone pieno variante="secondario" onClick={onNo} disabled={occupato}>
          Non ancora, pago dopo
        </Bottone>
      </div>
    </section>
  );
}
