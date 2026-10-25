"use client";

import { useState } from "react";
import { Avviso, Bottone, Icona } from "@/components/ui";
import { formattaEuro } from "@/lib/dominio/importi";
import { MAX_MESSAGGIO } from "@/lib/dominio/operazioni";
import { inizialiDi } from "@/lib/dominio/partecipanti";

/** Frasi pronte da aggiungere con un tocco: neutre, perché del festeggiato sappiamo solo il nome. */
const frasiRapide = (festeggiato: string) => [`Tanti auguri, ${festeggiato}! 🎉`, "Festeggiamo presto! 🥂", "Ti vogliamo bene ❤️"];

export function PassoBiglietto({
  festeggiato,
  nome,
  dichiarato,
  importo,
  iniziale,
  onSalva,
  onSalta,
}: {
  festeggiato: string;
  nome: string;
  /** appena dichiarato il pagamento: in cima compare la conferma */
  dichiarato: boolean;
  importo: number | null;
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

  function aggiungi(frase: string) {
    setTesto((t) => (t.trim() ? `${t.trimEnd()} ${frase}` : frase).slice(0, MAX_MESSAGGIO));
  }

  return (
    <div className="flex flex-col gap-5">
      {dichiarato && !iniziale ? (
        <p role="status" className="flex items-center gap-3 rounded-2xl bg-ok-field p-4 text-sm font-bold text-ok">
          <Icona nome="check_circle" />
          {nome ? `Fatto, ${nome.split(" ")[0]}!` : "Fatto!"} Pagamento{importo ? ` di ${formattaEuro(importo)}` : ""} dichiarato 🎉
        </p>
      ) : null}

      <div className="flex flex-col gap-1">
        <p className="text-xs font-bold uppercase tracking-widest text-accent">Ultimo tocco · Biglietto di gruppo</p>
        <h2 className="text-[32px] font-bold leading-[38px] tracking-tight text-accent-2">Due righe per {festeggiato}</h2>
        <p className="text-ink-soft">Finiranno sul biglietto firmato da tutto il gruppo.</p>
      </div>

      <div className="flex flex-col gap-4 rounded-3xl bg-surface p-5 shadow-carta">
        {nome ? (
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-field font-display font-bold text-accent">
              {inizialiDi(nome).slice(0, 1)}
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-bold">{nome}</span>
              <span className="text-xs text-ink-soft">Il tuo messaggio</span>
            </div>
          </div>
        ) : null}
        <label htmlFor="messaggio-biglietto" className="sr-only">
          Il tuo messaggio per {festeggiato}
        </label>
        <textarea
          id="messaggio-biglietto"
          maxLength={MAX_MESSAGGIO}
          rows={4}
          value={testo}
          onChange={(e) => setTesto(e.target.value)}
          placeholder="Scrivi un pensiero, un ricordo o una battuta…"
          aria-describedby="conta-caratteri"
          className="w-full resize-y rounded-2xl border-0 bg-surface-2 p-4 text-base placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <p id="conta-caratteri" className="-mt-2 text-right text-xs text-ink-soft">
          {testo.length} / {MAX_MESSAGGIO}
        </p>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold text-ink-soft">Idee veloci da aggiungere:</p>
          <div className="flex flex-wrap gap-2">
            {frasiRapide(festeggiato).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => aggiungi(f)}
                className="min-h-tocco rounded-full bg-surface-2 px-4 text-sm font-semibold hover:bg-line"
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {errore ? (
        <Avviso tono="attenzione" live>
          <p>Non sono riuscito a salvare il messaggio. Riprova.</p>
        </Avviso>
      ) : null}
      <div className="flex flex-col items-center gap-1">
        <Bottone variante="azione" pieno onClick={() => void salva()} disabled={occupato || !testo.trim()}>
          {occupato ? "Salvo…" : "Salva la dedica"} <Icona nome="arrow_forward" dimensione={22} />
        </Bottone>
        <Bottone variante="testuale" onClick={onSalta} disabled={occupato} className="text-ink-soft">
          Salta per ora
        </Bottone>
      </div>
      <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-ink-soft">
        <Icona nome="verified" dimensione={16} />
        Il biglietto è gratis.
      </p>
    </div>
  );
}
