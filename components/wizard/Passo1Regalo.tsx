"use client";

import { useState } from "react";
import { ScegliRegalo } from "@/components/ScegliRegalo";
import { Avviso, Bottone, Campo, IconaPiu, Interruttore, SchedaScelta } from "@/components/ui";
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
          titolo="Lo scelgo io"
          descrizione="Scegli un regalo e parti subito con la colletta. Col «+» su un prodotto puoi comunque mettere più regali in lista e far votare il gruppo."
          selezionata={!s.votazioneAttiva}
          onSeleziona={() => cambia({ votazioneAttiva: false })}
        />
        <SchedaScelta
          titolo="Lo sceglie il gruppo"
          descrizione="Proponi alcune idee: ognuno vota da 1 a 5 stelle e, a tempo scaduto, vince la più votata."
          selezionata={s.votazioneAttiva}
          onSeleziona={attivaVotazione}
        />
      </div>

      {!s.votazioneAttiva ? (
        <div
          className={`flex flex-col gap-5 ${errori.prodotto ? "rounded-contenitore border-2 border-error bg-error-field p-3" : ""}`}
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
            className={`flex flex-col gap-3 ${errori.prodotto ? "rounded-contenitore border-2 border-error bg-error-field p-3" : ""}`}
            data-errore={errori.prodotto ? "true" : undefined}
          >
            <h2 id="candidati" className="text-xl">
              I regali da votare ({s.candidati.length})
            </h2>
            {s.candidati.length === 0 ? <p className="text-sm text-ink-soft">Ancora nessuno. Aggiungine almeno due: scegli qui sotto e tocca «Aggiungi alla lista».</p> : null}
            <ul className="flex flex-col gap-2">
              {s.candidati.map((p, i) => (
                <li key={`${p.nome}-${i}`} className="flex items-center gap-3 rounded-controllo border border-line bg-surface p-3">
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

          <section aria-labelledby="aggiungi" className="flex flex-col gap-4">
            <h2 id="aggiungi" className="text-xl">
              Aggiungi un regalo
            </h2>
            <ScegliRegalo key={chiave} valore={bozza} onScelta={setBozza} avvisoLink={false} onAggiungi={aggiungiDaCatalogo} giaInLista={s.candidati} />
            <Bottone onClick={aggiungi} disabled={!bozza} className="self-start">
              <IconaPiu width={18} height={18} /> Aggiungi alla lista
            </Bottone>
          </section>

          <section aria-labelledby="durata" className="contenitore flex flex-col gap-4 p-4">
            <h2 id="durata" className="text-xl">
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
              suggerimento="Parte quando apri la raccolta. A tempo scaduto vince il regalo con la media di stelle più alta e la colletta riparte da lì. Puoi chiuderla prima, o prolungarla."
            />
            <Interruttore
              etichetta="Chi partecipa può proporre altri regali"
              descrizione="Ognuno può aggiungere fino a 3 idee alla lista, che tutti possono votare."
              attivo={s.consentiProposte}
              onCambia={(consentiProposte) => cambia({ consentiProposte })}
            />
          </section>

          <Avviso>
            <p>Finché si vota nessuno paga. Quando la votazione si chiude il regalo vincente diventa quello della colletta e la quota si calcola sul suo prezzo.</p>
          </Avviso>
        </div>
      )}
    </div>
  );
}
