"use client";

import { useState } from "react";
import { ScegliRegalo } from "@/components/ScegliRegalo";
import { Bottone, Campo, Icona, IconaPiu, Interruttore, SchedaScelta } from "@/components/ui";
import { formattaEuro } from "@/lib/dominio/importi";
import { conRegalo } from "@/lib/dominio/regali";
import { MAX_ORE, MIN_ORE } from "@/lib/dominio/votazione";
import type { ProdottoColletta } from "@/lib/tipi";
import { dataSuggerita } from "./stato";
import type { PropsPasso } from "./tipi";

const PRESET_ORE = [12, 24, 48, 72];

export function Passo1Regalo({ s, cambia, errori, adesso }: PropsPasso) {
  // Il regalo che si sta componendo, prima di aggiungerlo alla lista dei candidati.
  const [bozza, setBozza] = useState<ProdottoColletta | null>(null);
  const [chiave, setChiave] = useState(0);

  function scegliSingolo(p: ProdottoColletta | null) {
    cambia({ prodotto: p, ...(p ? { dataRegalo: s.dataRegalo || dataSuggerita(p.consegnaGiorni, adesso) } : {}) });
  }

  /** Il «+» su un prodotto: passa alla votazione (se serve) e lo mette in lista. Il regalo già scelto diventa il primo candidato. */
  function aggiungiDaCatalogo(p: ProdottoColletta) {
    const base = s.votazioneAttiva ? s.candidati : s.prodotto ? conRegalo([], s.prodotto) : [];
    const candidati = conRegalo(base, p);
    const consegna = candidati.reduce((m, x) => Math.max(m, x.consegnaGiorni), 1);
    cambia({ votazioneAttiva: true, candidati, dataRegalo: s.dataRegalo || dataSuggerita(consegna, adesso) });
  }

  /** Scegliere «Lo sceglie il gruppo» con un regalo già scelto: quel regalo è il primo della lista. */
  function attivaVotazione() {
    const candidati = s.prodotto ? conRegalo(s.candidati, s.prodotto) : s.candidati;
    cambia({ votazioneAttiva: true, candidati });
  }

  function aggiungi() {
    if (!bozza) return;
    const candidati = conRegalo(s.candidati, bozza);
    const consegna = candidati.reduce((m, p) => Math.max(m, p.consegnaGiorni), 1);
    cambia({ candidati, dataRegalo: s.dataRegalo || dataSuggerita(consegna, adesso) });
    setBozza(null);
    setChiave((k) => k + 1);
  }

  function rimuovi(i: number) {
    cambia({ candidati: s.candidati.filter((_, j) => j !== i) });
  }

  return (
    <div className="flex flex-col gap-5">
      <div role="radiogroup" aria-label="Chi sceglie il regalo" className="grid gap-3 sm:grid-cols-2">
        <SchedaScelta
          icona="redeem"
          titolo="Lo scelgo io"
          descrizione="Scegli un regalo e parti subito."
          selezionata={!s.votazioneAttiva}
          onSeleziona={() => cambia({ votazioneAttiva: false })}
        />
        <SchedaScelta
          icona="how_to_vote"
          titolo="Lo sceglie il gruppo"
          descrizione="Proponi alcune idee: vince la più votata."
          selezionata={s.votazioneAttiva}
          onSeleziona={attivaVotazione}
        />
      </div>
      <p className="flex items-start gap-2 rounded-2xl bg-surface-2 p-3 text-sm text-ink-soft">
        <Icona nome="info" dimensione={20} />
        Se scegli la votazione, nessuno paga finché non vince un regalo.
      </p>

      {!s.votazioneAttiva ? (
        <div
          className={`flex flex-col gap-5 rounded-3xl bg-surface p-4 shadow-carta ${errori.prodotto ? "ring-2 ring-error" : ""}`}
          data-errore={errori.prodotto ? "true" : undefined}
        >
          <ScegliRegalo valore={s.prodotto} onScelta={scegliSingolo} onAggiungi={aggiungiDaCatalogo} giaInLista={s.candidati} />
          {errori.prodotto ? (
            <p role="alert" className="text-sm font-semibold text-error before:mr-1 before:content-['⚠']">
              {errori.prodotto}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <section
            aria-labelledby="candidati"
            className={`flex flex-col gap-3 rounded-3xl bg-surface p-4 shadow-carta ${errori.prodotto ? "ring-2 ring-error" : ""}`}
            data-errore={errori.prodotto ? "true" : undefined}
          >
            <h2 id="candidati" className="text-xl font-semibold text-accent-2">
              Le idee da votare ({s.candidati.length})
            </h2>
            {s.candidati.length === 0 ? <p className="text-sm text-ink-soft">Ancora nessuno. Aggiungine almeno due: scegli qui sotto e tocca «Aggiungi alla lista».</p> : null}
            <ul className="flex flex-col gap-2">
              {s.candidati.map((p, i) => (
                <li key={`${p.nome}-${i}`} className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-semibold">{p.nome}</span>
                    <span className="cifre text-sm text-ink-soft">{formattaEuro(p.prezzoCent)}</span>
                  </span>
                  <Bottone dimensione="piccolo" variante="testuale" onClick={() => rimuovi(i)} aria-label={`Togli ${p.nome} dalla lista`}>
                    Togli
                  </Bottone>
                </li>
              ))}
            </ul>
            {errori.prodotto ? (
              <p role="alert" className="text-sm font-semibold text-error before:mr-1 before:content-['⚠']">
                {errori.prodotto}
              </p>
            ) : null}
          </section>

          <section aria-labelledby="aggiungi" className="flex flex-col gap-4 rounded-3xl bg-surface p-4 shadow-carta">
            <h2 id="aggiungi" className="text-xl font-semibold text-accent-2">
              Aggiungi un regalo
            </h2>
            <ScegliRegalo key={chiave} valore={bozza} onScelta={setBozza} avvisoLink={false} onAggiungi={aggiungiDaCatalogo} giaInLista={s.candidati} />
            <Bottone onClick={aggiungi} disabled={!bozza} className="self-start">
              <IconaPiu width={18} height={18} /> Aggiungi alla lista
            </Bottone>
          </section>

          <section aria-labelledby="durata" className="flex flex-col gap-4 rounded-3xl bg-surface p-4 shadow-carta">
            <h2 id="durata" className="text-xl font-semibold text-accent-2">
              Quanto dura la votazione
            </h2>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Durate suggerite">
              {PRESET_ORE.map((o) => (
                <Bottone
                  key={o}
                  dimensione="piccolo"
                  variante={s.votazioneOre === o ? "primario" : "secondario"}
                  aria-pressed={s.votazioneOre === o}
                  onClick={() => cambia({ votazioneOre: o })}
                >
                  {o} ore
                </Bottone>
              ))}
            </div>
            <Campo
              etichetta="Ore"
              type="number"
              inputMode="numeric"
              min={MIN_ORE}
              max={MAX_ORE}
              value={Number.isFinite(s.votazioneOre) ? s.votazioneOre : ""}
              onChange={(e) => cambia({ votazioneOre: e.target.value === "" ? NaN : Math.round(Number(e.target.value)) })}
              errore={errori.ore}
              suggerimento="Parte quando apri la raccolta. Puoi chiuderla prima, o prolungarla."
            />
            <Interruttore
              etichetta="Chi partecipa può proporre altri regali"
              descrizione="Ognuno può aggiungere fino a 3 idee alla lista, che tutti possono votare."
              attivo={s.consentiProposte}
              onCambia={(consentiProposte) => cambia({ consentiProposte })}
            />
          </section>

        </div>
      )}
    </div>
  );
}
