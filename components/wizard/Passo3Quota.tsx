"use client";

import { useEffect } from "react";
import { Avviso, Campo, Icona, type NomeIcona } from "@/components/ui";
import { euroPerCampo, formattaEuro } from "@/lib/dominio/importi";
import { prospetto, quotaProposta } from "@/lib/dominio/quota";
import type { ModoQuota } from "@/lib/tipi";
import { prodottoDaStato, quotaDaStato } from "./stato";
import type { PropsPasso } from "./tipi";

const MODI: { id: ModoQuota; titolo: string; testo: string; icona: NomeIcona; spiegazione: string }[] = [
  {
    id: "fissa",
    titolo: "Quota fissa",
    testo: "Uguale per tutti",
    icona: "lock",
    spiegazione: "Una cifra uguale per tutti, che non cambia mai: quello che avanza resta come avanzo.",
  },
  {
    id: "divisa",
    titolo: "Quota divisa",
    testo: "Prezzo ÷ chi c’è",
    icona: "pie_chart",
    spiegazione: "Il prezzo diviso tra chi partecipa. Si ricalcola a ogni adesione, finché non arriva il primo pagamento confermato.",
  },
  {
    id: "libera",
    titolo: "Quota libera",
    testo: "Ognuno quanto vuole",
    icona: "volunteer_activism",
    spiegazione: "Ognuno mette quello che vuole; la quota è solo un suggerimento. Gli importi li vedi solo tu.",
  },
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
  const modo = MODI.find((m) => m.id === s.modoQuota) ?? MODI[0];

  const prezzi = s.candidati.map((c) => c.prezzoCent);
  const minimo = prezzi.length ? Math.min(...prezzi) : 0;
  const massimo = prezzi.length ? Math.max(...prezzi) : 0;
  const tondo = "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface shadow-carta";

  return (
    <div className="flex flex-col gap-4">
      {votazione ? (
        <Avviso titolo="Il prezzo si saprà a fine votazione">
          <p>
            Le idee costano da {formattaEuro(minimo)} a {formattaEuro(massimo)}: qui vedi una stima sul prezzo medio.
          </p>
        </Avviso>
      ) : null}

      <div className="flex flex-col gap-2">
        <div role="radiogroup" aria-label="Come si divide il costo" className="grid grid-cols-3 gap-2">
          {MODI.map((m) => {
            const scelto = s.modoQuota === m.id;
            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={scelto}
                onClick={() => cambia({ modoQuota: m.id })}
                className={`flex min-h-28 flex-col items-center justify-center gap-1 rounded-2xl p-2 text-center transition-colors ${
                  scelto ? "bg-accent text-on-accent shadow-accento" : "bg-surface shadow-carta ring-1 ring-line hover:ring-line-forte"
                }`}
              >
                <Icona nome={m.icona} />
                <span className="text-sm font-bold leading-tight">{m.titolo}</span>
                <span className={`text-[11px] leading-tight ${scelto ? "text-accent-field" : "text-ink-soft"}`}>{m.testo}</span>
              </button>
            );
          })}
        </div>
        <p className="px-1 text-xs text-ink-soft" aria-live="polite">
          {modo.spiegazione}
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-3xl bg-surface p-4 shadow-carta">
        <div className="flex flex-col gap-2">
          <span id="etichetta-previsti" className="flex items-center gap-2 text-sm font-bold">
            <Icona nome="group" dimensione={20} />
            Persone previste
          </span>
          <div className="flex items-center gap-2 rounded-full bg-surface-2 p-1.5" role="group" aria-labelledby="etichetta-previsti">
            <button type="button" aria-label="Una persona in meno" onClick={() => cambia({ previsti: Math.max(2, s.previsti - 1) })} className={tondo}>
              <Icona nome="remove" />
            </button>
            <label className="flex min-w-0 flex-1 items-baseline justify-center gap-1.5">
              <span className="sr-only">Numero di persone</span>
              <input
                type="number"
                inputMode="numeric"
                min={2}
                max={200}
                value={s.previsti}
                onChange={(e) => cambia({ previsti: Math.max(1, Math.min(200, Math.round(Number(e.target.value)) || 1)) })}
                data-errore={errori.previsti ? "true" : undefined}
                className={`cifre w-16 rounded-xl bg-transparent text-center text-4xl font-extrabold focus:outline-none focus:ring-2 focus:ring-accent ${errori.previsti ? "bg-error-field ring-2 ring-error" : ""}`}
              />
              <span className="text-sm text-ink-soft">persone</span>
            </label>
            <button type="button" aria-label="Una persona in più" onClick={() => cambia({ previsti: Math.min(200, s.previsti + 1) })} className={tondo}>
              <Icona nome="add" />
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
            etichetta={`Quota a testa (€) · suggerita ${formattaEuro(quotaProposta(prezzo, s.previsti))}`}
            inputMode="decimal"
            value={s.quotaEuro}
            onChange={(e) => cambia({ quotaEuro: e.target.value, quotaManuale: true })}
            errore={errori.quotaEuro}
            className="cifre text-2xl font-extrabold"
          />
        ) : null}
      </div>

      <div className="flex flex-col gap-3 rounded-3xl bg-surface p-4 shadow-carta" aria-live="polite">
        <dl className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-2">
          <dt className="flex items-center gap-2 text-sm text-ink-soft">
            <Icona nome="redeem" dimensione={18} />
            {votazione ? "Prezzo medio delle idee" : "Prezzo del regalo"}
          </dt>
          <dd className="cifre text-right font-bold">{formattaEuro(prezzo)}</dd>
          <dt className="flex items-center gap-2 text-sm text-ink-soft">
            <Icona nome="payments" dimensione={18} />
            {s.modoQuota === "libera" ? "Quota suggerita" : "Quota a testa"}
          </dt>
          <dd className="cifre text-right font-bold">{formattaEuro(p.quotaCent)}</dd>
          <dt className="flex items-center gap-2 text-sm text-ink-soft">
            <Icona nome="functions" dimensione={18} />
            Totale previsto
          </dt>
          <dd className="cifre text-right text-2xl font-extrabold">{formattaEuro(p.totalePrevistoCent)}</dd>
        </dl>
        {avanzo > 0 ? (
          <p className="flex items-center gap-3 rounded-2xl bg-accent p-3 text-on-accent">
            <Icona nome="celebration" className="text-gold-vivo" />
            <span className="flex flex-col">
              <strong className="cifre">+{formattaEuro(avanzo)} di avanzo previsto</strong>
              <span className="text-xs text-accent-field">Lo decidi alla chiusura: biglietto, restituzione o un extra.</span>
            </span>
          </p>
        ) : null}
        {avanzo < 0 ? (
          <p className="flex items-center gap-3 rounded-2xl bg-gold-field p-3">
            <Icona nome="error" className="text-gold" />
            <span className="flex flex-col">
              <strong className="cifre">Mancherebbero {formattaEuro(-avanzo)}</strong>
              <span className="text-xs">Con questa quota, se partecipano tutti, il prezzo non è coperto.</span>
            </span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
