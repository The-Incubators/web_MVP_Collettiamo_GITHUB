"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Bottone, Campo, CampoSelezione, CampoTesto, Icona, type NomeIcona } from "@/components/ui";
import { ErroreDominio } from "@/lib/dominio/operazioni";
import {
  giorniNelMese,
  MAX_NOME,
  MAX_NOTA,
  NOMI_MESI,
  nuovoIdReminder,
  PREAVVISI_SETTIMANE,
  PREAVVISO_PREDEFINITO,
  TIPI_RICORRENZA,
  type Reminder,
  type TipoRicorrenza,
} from "@/lib/dominio/reminder";

/** Una scelta fra poche voci, a pillole: sotto sono radio veri, quindi si sceglie anche con le frecce. */
function Pillole<T extends string | number>({
  legenda,
  voci,
  valore,
  onCambia,
}: {
  legenda: string;
  voci: readonly { id: T; etichetta: string; icona?: NomeIcona }[];
  valore: T;
  onCambia: (v: T) => void;
}) {
  const nome = useId();
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-semibold text-ink">{legenda}</legend>
      <div className="flex flex-wrap gap-2">
        {voci.map((v) => (
          <label key={v.id} className="cursor-pointer">
            <input type="radio" name={nome} className="peer sr-only" checked={valore === v.id} onChange={() => onCambia(v.id)} />
            <span className="flex min-h-tocco items-center gap-1.5 rounded-full border-[1.5px] border-line-forte bg-surface px-4 text-sm font-bold text-ink-soft transition-colors peer-checked:border-accent peer-checked:bg-accent-field peer-checked:text-accent peer-focus-visible:ring-4 peer-focus-visible:ring-accent-field">
              {v.icona ? <Icona nome={v.icona} dimensione={18} /> : null}
              {v.etichetta}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const PREAVVISI = PREAVVISI_SETTIMANE.map((n) => ({ id: n, etichetta: n === 1 ? "1 settimana" : `${n} settimane` }));

/**
 * Il modulo di una ricorrenza: nuova (`iniziale` assente) o da modificare. Giorno e mese sono obbligatori,
 * l'anno no (serve solo a dire quanti anni compie). Modificando c'è anche «Elimina», con conferma.
 */
export function FormReminder({
  iniziale,
  meseProposto,
  onSalva,
  onElimina,
  onChiudi,
}: {
  iniziale?: Reminder;
  /** il mese da proporre per una ricorrenza nuova (quello che si sta guardando nel calendario) */
  meseProposto: number;
  onSalva: (r: Reminder) => Promise<void>;
  onElimina?: () => Promise<void>;
  onChiudi: () => void;
}) {
  const [nome, setNome] = useState(iniziale?.nome ?? "");
  const [tipo, setTipo] = useState<TipoRicorrenza>(iniziale?.tipo ?? "compleanno");
  const [giorno, setGiorno] = useState(iniziale?.giorno ?? 1);
  const [mese, setMese] = useState(iniziale?.mese ?? meseProposto);
  const [anno, setAnno] = useState(iniziale?.anno ? String(iniziale.anno) : "");
  const [preavviso, setPreavviso] = useState(iniziale?.preavvisoSettimane ?? PREAVVISO_PREDEFINITO);
  const [nota, setNota] = useState(iniziale?.nota ?? "");
  const [errore, setErrore] = useState<string | null>(null);
  const [lavoro, setLavoro] = useState(false);
  const [confermaElimina, setConfermaElimina] = useState(false);
  const titolo = useId();
  const primoCampo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    primoCampo.current?.querySelector("input")?.focus();
  }, []);

  // il 29 febbraio si può sempre scegliere: negli anni non bisestili si festeggia il 28
  const giorniMax = giorniNelMese(2024, mese);

  async function esegui(azione: () => Promise<void>) {
    setErrore(null);
    setLavoro(true);
    try {
      await azione();
    } catch (e) {
      setErrore(e instanceof ErroreDominio ? e.message : "Qualcosa non ha funzionato: riprova tra poco.");
      setLavoro(false);
    }
  }

  const salva = () =>
    esegui(() =>
      onSalva({
        id: iniziale?.id ?? nuovoIdReminder(),
        nome,
        tipo,
        giorno,
        mese,
        anno: anno.trim() ? Number(anno) : null,
        preavvisoSettimane: preavviso,
        nota,
      }),
    );

  return (
    <section aria-labelledby={titolo} className="flex flex-col gap-5 rounded-3xl bg-surface p-5 shadow-carta">
      <div className="flex items-center justify-between gap-2">
        <h2 id={titolo} className="font-display text-xl font-semibold text-accent-2">
          {iniziale ? "Modifica la ricorrenza" : "Nuova ricorrenza"}
        </h2>
        <button type="button" onClick={onChiudi} aria-label="Chiudi" className="flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-surface-2">
          <Icona nome="close" />
        </button>
      </div>
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          void salva();
        }}
      >
        <div ref={primoCampo}>
          <Campo
            etichetta="Per chi è?"
            placeholder="Es. Giulia, mamma e papà…"
            value={nome}
            maxLength={MAX_NOME}
            autoComplete="off"
            onChange={(e) => setNome(e.target.value)}
          />
        </div>
        <Pillole legenda="Che ricorrenza è?" voci={TIPI_RICORRENZA} valore={tipo} onCambia={setTipo} />
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-sm font-semibold text-ink">Quando?</legend>
          <div className="grid grid-cols-[5.5rem_1fr] gap-2">
            <CampoSelezione etichetta="Giorno" etichettaNascosta value={giorno} onChange={(e) => setGiorno(Number(e.target.value))}>
              {Array.from({ length: giorniMax }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </CampoSelezione>
            <CampoSelezione
              etichetta="Mese"
              etichettaNascosta
              value={mese}
              onChange={(e) => {
                const m = Number(e.target.value);
                setMese(m);
                setGiorno((g) => Math.min(g, giorniNelMese(2024, m)));
              }}
            >
              {NOMI_MESI.map((n, i) => (
                <option key={n} value={i + 1}>
                  {n}
                </option>
              ))}
            </CampoSelezione>
          </div>
        </fieldset>
        <Campo
          etichetta="Anno (facoltativo)"
          suggerimento={tipo === "compleanno" ? "Se lo sai, ti diciamo quanti anni compie." : "Se lo sai, ti diciamo quanti anni sono."}
          inputMode="numeric"
          placeholder="Es. 1990"
          maxLength={4}
          value={anno}
          onChange={(e) => setAnno(e.target.value.replace(/\D/g, ""))}
        />
        <Pillole legenda="Avvisami prima di" voci={PREAVVISI} valore={preavviso} onCambia={setPreavviso} />
        <CampoTesto
          etichetta="Nota (facoltativa)"
          placeholder="Es. ama la cucina giapponese, ha appena cambiato casa…"
          maxLength={MAX_NOTA}
          rows={2}
          value={nota}
          onChange={(e) => setNota(e.target.value)}
        />
        {errore ? (
          <p role="alert" className="rounded-2xl bg-error-field px-4 py-3 text-sm font-semibold text-error">
            {errore}
          </p>
        ) : null}
        <div className="flex flex-col gap-2">
          <Bottone type="submit" pieno disabled={lavoro}>
            {lavoro ? "Salvo…" : iniziale ? "Salva le modifiche" : "Salva la ricorrenza"}
          </Bottone>
          <Bottone variante="testuale" pieno onClick={onChiudi}>
            Annulla
          </Bottone>
        </div>
      </form>
      {onElimina ? (
        <ZonaElimina conferma={confermaElimina} onChiedi={() => setConfermaElimina(true)} onAnnulla={() => setConfermaElimina(false)}>
          <Bottone variante="secondario" pieno disabled={lavoro} onClick={() => void esegui(onElimina)} className="!border-error !text-error">
            <Icona nome="delete" dimensione={20} />
            Sì, elimina
          </Bottone>
        </ZonaElimina>
      ) : null}
    </section>
  );
}

function ZonaElimina({ conferma, onChiedi, onAnnulla, children }: { conferma: boolean; onChiedi: () => void; onAnnulla: () => void; children: ReactNode }) {
  if (!conferma) {
    return (
      <button type="button" onClick={onChiedi} className="mx-auto flex min-h-tocco items-center gap-1.5 px-2 text-sm font-bold text-error underline-offset-4 hover:underline">
        <Icona nome="delete" dimensione={18} />
        Elimina questa ricorrenza
      </button>
    );
  }
  return (
    <div role="group" aria-label="Conferma eliminazione" className="flex flex-col gap-2 rounded-2xl bg-error-field p-4">
      <p className="text-sm font-semibold text-ink">Vuoi davvero eliminarla? Non si può annullare.</p>
      {children}
      <Bottone variante="testuale" pieno onClick={onAnnulla}>
        No, tienila
      </Bottone>
    </div>
  );
}
