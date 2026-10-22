"use client";

import { CampoTesto, SchedaScelta } from "@/components/ui";
import { nomiDaLista } from "./stato";
import type { PropsPasso } from "./tipi";

export function Passo5Partecipanti({ s, cambia, errori }: PropsPasso) {
  const n = nomiDaLista(s.nomiLista).length;
  return (
    <div className="flex flex-col gap-5">
      <div role="radiogroup" aria-label="Chi può partecipare" className="flex flex-col gap-3">
        <SchedaScelta
          titolo="Lista aperta"
          descrizione="Chi apre il link si aggiunge da solo, scrivendo il proprio nome. Il modo più veloce."
          selezionata={s.listaAperta}
          onSeleziona={() => cambia({ listaAperta: true })}
        />
        <SchedaScelta
          titolo="Lista chiusa"
          descrizione="Scrivi tu i nomi. Chi apre il link sceglie il proprio dall’elenco: così sai chi manca e puoi ricordarlo."
          selezionata={!s.listaAperta}
          onSeleziona={() => cambia({ listaAperta: false })}
        />
      </div>
      {!s.listaAperta ? (
        <CampoTesto
          etichetta="Chi partecipa (un nome per riga)"
          rows={8}
          value={s.nomiLista}
          onChange={(e) => cambia({ nomiLista: e.target.value })}
          errore={errori.nomiLista}
          suggerimento={n === 0 ? "Per esempio: Anna, Luca, Sara…" : n === 1 ? "1 persona" : `${n} persone`}
        />
      ) : (
        <p className="text-sm text-ink-soft">Non serve altro: i nomi li vedrai comparire nella raccolta man mano che qualcuno partecipa.</p>
      )}
      <p className="text-sm text-ink-soft">Non chiediamo recapiti. I promemoria te li prepariamo noi e li mandi tu, dal tuo telefono.</p>
    </div>
  );
}
