"use client";

import { CampoTesto, Icona, SchedaScelta } from "@/components/ui";
import { nomiDaLista } from "./stato";
import type { PropsPasso } from "./tipi";

export function Passo5Partecipanti({ s, cambia, errori }: PropsPasso) {
  const n = nomiDaLista(s.nomiLista).length;
  return (
    <div className="flex flex-col gap-5">
      <div role="radiogroup" aria-label="Chi può partecipare" className="flex flex-col gap-3">
        <SchedaScelta
          icona="groups"
          titolo="Lista aperta"
          descrizione="Chi apre il link si aggiunge da solo. Il modo più veloce."
          selezionata={s.listaAperta}
          onSeleziona={() => cambia({ listaAperta: true })}
        />
        <SchedaScelta
          icona="checklist_rtl"
          titolo="Lista chiusa"
          descrizione="Scrivi tu i nomi: sai chi manca e puoi ricordarglielo."
          selezionata={!s.listaAperta}
          onSeleziona={() => cambia({ listaAperta: false })}
        />
      </div>
      {!s.listaAperta ? (
        <div className="rounded-3xl bg-surface p-4 shadow-carta">
        <CampoTesto
          etichetta="Chi partecipa (un nome per riga)"
          rows={8}
          value={s.nomiLista}
          onChange={(e) => cambia({ nomiLista: e.target.value })}
          errore={errori.nomiLista}
          suggerimento={n === 0 ? "Per esempio: Anna, Luca, Sara…" : n === 1 ? "1 persona" : `${n} persone`}
        />
        </div>
      ) : null}
      <p className="flex items-start gap-2 rounded-2xl bg-surface-2 p-3 text-sm text-ink-soft">
        <Icona nome="info" dimensione={20} />
        Non chiediamo recapiti: i promemoria te li prepariamo noi e li mandi tu.
      </p>
    </div>
  );
}
