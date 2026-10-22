"use client";

import { useEffect } from "react";
import { Campo, SchedaScelta } from "@/components/ui";
import { euroPerCampo, formattaEuro } from "@/lib/dominio/importi";
import { prospetto, quotaProposta } from "@/lib/dominio/quota";
import type { ModoQuota } from "@/lib/tipi";
import { Avviso } from "@/components/ui";
import { prodottoDaStato, quotaDaStato } from "./stato";
import type { PropsPasso } from "./tipi";

const MODI: { id: ModoQuota; titolo: string; testo: string }[] = [
  { id: "fissa", titolo: "Quota fissa", testo: "Una cifra uguale per tutti, che non cambia mai: quello che avanza resta come avanzo." },
  { id: "divisa", titolo: "Quota divisa", testo: "Il prezzo diviso tra chi partecipa. Si ricalcola a ogni adesione, finché non arriva il primo pagamento confermato." },
  { id: "libera", titolo: "Quota libera", testo: "Ognuno mette quello che vuole; la quota è solo un suggerimento. Gli importi li vedi solo tu." },
];

export function Passo3Quota({ s, cambia, errori }: PropsPasso) {
  const prezzo = prodottoDaStato(s)?.prezzoCent ?? 0;
  const votazione = s.votazioneAttiva;

  // La quota fissa parte dalla proposta, finché chi organizza non scrive la sua.
  useEffect(() => {
    if (!votazione && s.modoQuota === "fissa" && !s.quotaManuale) {
      const proposta = euroPerCampo(quotaProposta(prezzo, s.previsti));
      if (s.quotaEuro !== proposta) cambia({ quotaEuro: proposta });
    }
  }, [votazione, s.modoQuota, s.quotaManuale, s.previsti, prezzo, s.quotaEuro, cambia]);

  const p = prospetto({ modoQuota: s.modoQuota, prezzoCent: prezzo, previsti: s.previsti, quotaFissaCent: quotaDaStato(s) });
  const avanzo = p.differenzaCent;

  const prezzi = s.candidati.map((c) => c.prezzoCent);
  const minimo = prezzi.length ? Math.min(...prezzi) : 0;
  const massimo = prezzi.length ? Math.max(...prezzi) : 0;

  return (
    <div className="flex flex-col gap-5">
      {votazione ? (
        <Avviso titolo="Il prezzo si saprà a fine votazione">
          <p>
            I regali in lista costano da {formattaEuro(minimo)} a {formattaEuro(massimo)}. Alla chiusura del voto la quota si calcola sul prezzo del regalo vincente. Qui sotto vedi una
            stima sul prezzo medio.
          </p>
        </Avviso>
      ) : null}
      <div role="radiogroup" aria-label="Come si divide il costo" className="flex flex-col gap-3">
        {MODI.map((m) => (
          <SchedaScelta key={m.id} titolo={m.titolo} descrizione={m.testo} selezionata={s.modoQuota === m.id} onSeleziona={() => cambia({ modoQuota: m.id })} />
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <span id="etichetta-previsti" className="text-sm font-medium">
          Quante persone prevedi?
        </span>
        <div className="flex items-center gap-3" role="group" aria-labelledby="etichetta-previsti">
          <button
            type="button"
            aria-label="Una persona in meno"
            onClick={() => cambia({ previsti: Math.max(2, s.previsti - 1) })}
            className="flex h-11 w-11 items-center justify-center rounded-controllo border border-line bg-surface text-xl font-bold"
          >
            −
          </button>
          <input
            aria-label="Numero di persone"
            type="number"
            inputMode="numeric"
            min={2}
            max={200}
            value={s.previsti}
            onChange={(e) => cambia({ previsti: Math.max(1, Math.min(200, Math.round(Number(e.target.value)) || 1)) })}
            data-errore={errori.previsti ? "true" : undefined}
            className={`cifre h-11 w-20 rounded-controllo border bg-surface text-center text-xl font-bold ${errori.previsti ? "border-2 border-error bg-error-field" : "border-line"}`}
          />
          <button
            type="button"
            aria-label="Una persona in più"
            onClick={() => cambia({ previsti: Math.min(200, s.previsti + 1) })}
            className="flex h-11 w-11 items-center justify-center rounded-controllo border border-line bg-surface text-xl font-bold"
          >
            +
          </button>
        </div>
        {errori.previsti ? (
          <p role="alert" className="text-sm font-semibold text-error before:mr-1 before:content-['⚠']">
            {errori.previsti}
          </p>
        ) : null}
      </div>

      {!votazione && s.modoQuota === "fissa" ? (
        <Campo
          etichetta="Quota a testa (€)"
          inputMode="decimal"
          value={s.quotaEuro}
          onChange={(e) => cambia({ quotaEuro: e.target.value, quotaManuale: true })}
          errore={errori.quotaEuro}
          suggerimento="Proposta: il prezzo diviso le persone, arrotondato all’euro."
        />
      ) : null}

      <div className="rounded-contenitore border border-accent bg-accent-field p-4" aria-live="polite">
        <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2">
          <dt>{s.modoQuota === "libera" ? "Quota suggerita" : "Quota a testa"}</dt>
          <dd className="cifre text-2xl font-bold">{formattaEuro(p.quotaCent)}</dd>
          <dt>Totale previsto</dt>
          <dd className="cifre text-right font-bold">{formattaEuro(p.totalePrevistoCent)}</dd>
          <dt>{votazione ? "Prezzo medio dei candidati" : "Prezzo del regalo"}</dt>
          <dd className="cifre text-right">{formattaEuro(prezzo)}</dd>
          <dt>{avanzo >= 0 ? "Avanzo previsto" : "Mancherebbe"}</dt>
          <dd className="cifre text-right font-bold">{formattaEuro(Math.abs(avanzo))}</dd>
        </dl>
        {avanzo < 0 ? <p className="mt-2 text-sm">Con questa quota, se partecipano tutti, il prezzo non è coperto.</p> : null}
        {avanzo > 0 ? <p className="mt-2 text-sm">L’avanzo lo decidi alla chiusura: biglietto e confezione, restituzione o un extra al regalo.</p> : null}
      </div>
    </div>
  );
}
