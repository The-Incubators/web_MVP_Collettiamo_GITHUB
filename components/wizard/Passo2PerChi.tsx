"use client";

import { Avviso, Campo, CampoSelezione, Interruttore } from "@/components/ui";
import { dataConGiorno, giornoDaIso, giornoInIso } from "@/lib/dominio/date";
import { calcolaScadenza } from "@/lib/dominio/scadenza";
import { OCCASIONI } from "@/lib/tipi";
import { domaniIso, prodottoDaStato } from "./stato";
import type { PropsPasso } from "./tipi";

const maiuscola = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export function Passo2PerChi({ s, cambia, errori, adesso }: PropsPasso) {
  const consegna = prodottoDaStato(s)?.consegnaGiorni ?? 3;
  const giorno = giornoDaIso(s.dataRegalo);
  const esito = giorno ? calcolaScadenza(giorno, consegna, adesso) : null;

  return (
    <div className="flex flex-col gap-5">
      <Campo etichetta="Per chi è il regalo?" value={s.festeggiato} onChange={(e) => cambia({ festeggiato: e.target.value })} errore={errori.festeggiato} placeholder="Giulia" autoComplete="off" />
      <CampoSelezione etichetta="Occasione" value={s.occasione} onChange={(e) => cambia({ occasione: e.target.value })}>
        {OCCASIONI.map((o) => (
          <option key={o} value={o}>
            {maiuscola(o)}
          </option>
        ))}
      </CampoSelezione>
      <Campo
        etichetta="Quando glielo date?"
        type="date"
        min={domaniIso(adesso)}
        value={s.dataRegalo}
        onChange={(e) => cambia({ dataRegalo: e.target.value })}
        errore={errori.dataRegalo}
      />

      {esito && esito.compatibile ? (
        <div className="rounded-contenitore border border-gold-line bg-gold-field p-4" aria-live="polite">
          <p className="text-sm font-semibold">La raccolta si chiude</p>
          <p className="font-display text-xl font-bold">{dataConGiorno(esito.scadenza)}, alle 20:00</p>
          <p className="mt-1 text-sm">
            Il regalo arriva in {consegna} {consegna === 1 ? "giorno" : "giorni"} e teniamo un giorno di margine: la raccolta si chiude {consegna + 1} giorni prima della data
            che hai scelto.
          </p>
        </div>
      ) : null}
      {esito && !esito.compatibile ? (
        <Avviso tono="attenzione" titolo="Con questa data non c’è il tempo per la consegna" live>
          <p>
            Il regalo arriva in {consegna} {consegna === 1 ? "giorno" : "giorni"}, più un giorno di margine: la raccolta dovrebbe chiudersi oggi o prima.
          </p>
          <button
            type="button"
            className="mt-1 min-h-tocco self-start rounded-controllo border border-gold-line bg-surface px-3 text-sm font-semibold"
            onClick={() => cambia({ dataRegalo: giornoInIso(esito.primaDataPossibile) })}
          >
            Usa la prima data possibile: {dataConGiorno(Date.UTC(esito.primaDataPossibile.a, esito.primaDataPossibile.m - 1, esito.primaDataPossibile.g, 12))}
          </button>
        </Avviso>
      ) : null}

      <Campo
        etichetta="Il tuo nome"
        suggerimento="Lo vedranno i partecipanti: «Marco sta organizzando…»"
        value={s.organizzatoreNome}
        onChange={(e) => cambia({ organizzatoreNome: e.target.value })}
        errore={errori.organizzatoreNome}
        autoComplete="given-name"
      />

      <div className="contenitore p-4">
        <Interruttore
          etichetta="Modalità sorpresa"
          descrizione="L’anteprima del link non mostra regalo né nome, e la pagina non finisce nei motori di ricerca."
          attivo={s.sorpresa}
          onCambia={(sorpresa) => cambia({ sorpresa })}
        />
      </div>
    </div>
  );
}
