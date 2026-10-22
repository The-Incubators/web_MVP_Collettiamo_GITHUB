"use client";

import { useState } from "react";
import { Avviso, Bottone, CampoTesto } from "@/components/ui";
import { MAX_MESSAGGIO } from "@/lib/dominio/operazioni";

export function PassoBiglietto({
  festeggiato,
  iniziale,
  onSalva,
  onSalta,
}: {
  festeggiato: string;
  iniziale: string | null;
  onSalva: (testo: string) => Promise<void>;
  onSalta: () => void;
}) {
  const [testo, setTesto] = useState(iniziale ?? "");
  const [occupato, setOccupato] = useState(false);
  const [errore, setErrore] = useState(false);

  async function salva() {
    setOccupato(true);
    setErrore(false);
    try {
      await onSalva(testo);
    } catch {
      setErrore(true);
      setOccupato(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-2xl leading-tight">Due righe per {festeggiato}</h2>
      <p className="text-ink-soft">Finiranno sul biglietto firmato da tutto il gruppo. Se non ti va, salta.</p>
      <CampoTesto
        etichetta={`Il tuo messaggio per ${festeggiato}`}
        etichettaNascosta
        maxLength={MAX_MESSAGGIO}
        rows={5}
        value={testo}
        onChange={(e) => setTesto(e.target.value)}
        suggerimento={`${testo.length} / ${MAX_MESSAGGIO} caratteri`}
      />
      {errore ? (
        <Avviso tono="attenzione" live>
          <p>Non sono riuscito a salvare il messaggio. Riprova.</p>
        </Avviso>
      ) : null}
      <div className="flex flex-col gap-3">
        <Bottone pieno onClick={() => void salva()} disabled={occupato || !testo.trim()}>
          {occupato ? "Salvo…" : "Salva il messaggio"}
        </Bottone>
        <Bottone pieno variante="testuale" onClick={onSalta} disabled={occupato}>
          Salta
        </Bottone>
      </div>
    </div>
  );
}
