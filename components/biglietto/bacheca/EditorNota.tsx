"use client";

import { useId, useRef, useState } from "react";
import { Icona } from "@/components/ui";
import { preparaImmagine } from "@/lib/biglietti/immaginiClient";
import { COLORI_NOTA, testoSu } from "@/lib/dominio/bacheca";
import { MAX_TESTO_MESSAGGIO } from "@/lib/dominio/biglietti";
import { urlAnteprima, type ImmagineBozza } from "../firma/bozza";
import { CLASSI_NOTA } from "./AnteprimaBacheca";

const NOMI_COLORI = ["Giallo", "Pesca", "Menta", "Rosa", "Lavanda", "Albicocca"];

/** Il bigliettino mentre lo si scrive. */
export interface NotaInCorso {
  testo: string;
  nome: string;
  colore: string;
  foto: ImmagineBozza | null;
}

export const NOTA_VUOTA: NotaInCorso = { testo: "", nome: "", colore: COLORI_NOTA[0], foto: null };

export function notaCompleta(n: NotaInCorso): boolean {
  return !!n.testo.trim() && !!n.nome.trim() && [...n.testo].length <= MAX_TESTO_MESSAGGIO;
}

/**
 * Il bigliettino diventa l'editor: messaggio, firma, colore della carta e foto, poi «Pubblica».
 * Niente formattazione: è un bigliettino, si scrive come in chat.
 */
export function EditorNota({
  nota,
  onNota,
  onPubblica,
  onAnnulla,
  onAltraPersona,
  accento,
  modifica,
  invio,
  errore,
}: {
  nota: NotaInCorso;
  onNota: (n: NotaInCorso) => void;
  onPubblica: () => void;
  onAnnulla: () => void;
  /** su un dispositivo condiviso: lascia stare il messaggio di prima e ne scrive uno nuovo un'altra persona */
  onAltraPersona?: () => void;
  accento: string;
  modifica: boolean;
  invio: boolean;
  errore: string | null;
}) {
  const id = useId();
  const file = useRef<HTMLInputElement>(null);
  const [erroreFoto, setErroreFoto] = useState<string | null>(null);
  const imposta = <K extends keyof NotaInCorso>(k: K, v: NotaInCorso[K]) => onNota({ ...nota, [k]: v });
  const caratteri = [...nota.testo].length;

  async function caricaFoto(f: File | undefined) {
    if (!f) return;
    setErroreFoto(null);
    try {
      const img = await preparaImmagine(f);
      imposta("foto", { tipo: "caricata", ...img });
    } catch (e) {
      setErroreFoto(e instanceof Error ? e.message : "Non sono riuscito a leggere l’immagine.");
    }
  }

  return (
    <form
      aria-label={modifica ? "Modifica il tuo bigliettino" : "Il tuo bigliettino"}
      onSubmit={(e) => {
        e.preventDefault();
        if (notaCompleta(nota) && !invio) onPubblica();
      }}
      className={`relative flex flex-col gap-3 p-4 ${CLASSI_NOTA}`}
      style={{ backgroundColor: nota.colore, boxShadow: `0 0 0 3px ${accento}, 0 12px 28px -10px rgba(0,0,0,0.35)` }}
    >
      <button type="button" onClick={onAnnulla} aria-label="Chiudi senza pubblicare" className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-white/70 hover:bg-white">
        <Icona nome="close" dimensione={20} />
      </button>

      <label htmlFor={`${id}-t`} className="sr-only">
        Il tuo messaggio
      </label>
      <textarea
        id={`${id}-t`}
        autoFocus
        value={nota.testo}
        onChange={(e) => imposta("testo", e.target.value)}
        placeholder="Scrivi il tuo messaggio…"
        rows={4}
        className="min-h-28 w-full resize-none pr-10 bg-transparent text-[17px] leading-snug placeholder:text-[#16241F]/50 focus:outline-none"
      />
      {caratteri > MAX_TESTO_MESSAGGIO * 0.8 ? (
        <p className={`-mt-2 text-right text-xs ${caratteri > MAX_TESTO_MESSAGGIO ? "font-semibold text-error" : "opacity-60"}`}>
          {caratteri}/{MAX_TESTO_MESSAGGIO}
        </p>
      ) : null}

      {nota.foto ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={urlAnteprima(nota.foto)} alt="La foto del tuo messaggio" className="max-h-56 w-full rounded-xl object-cover" />
          <button type="button" onClick={() => imposta("foto", null)} aria-label="Togli la foto" className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/85 hover:bg-white">
            <Icona nome="delete" dimensione={20} />
          </button>
        </div>
      ) : null}

      <div className="flex items-center gap-1 text-[17px] font-semibold">
        <span aria-hidden="true">—</span>
        <label htmlFor={`${id}-n`} className="sr-only">
          Il tuo nome
        </label>
        <input
          id={`${id}-n`}
          value={nota.nome}
          onChange={(e) => imposta("nome", e.target.value)}
          placeholder="Il tuo nome"
          maxLength={60}
          autoComplete="name"
          className="min-h-11 min-w-0 flex-1 rounded-lg bg-white/50 px-2 placeholder:font-normal placeholder:text-[#16241F]/50 focus:bg-white/80 focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div role="radiogroup" aria-label="Colore del bigliettino" className="flex flex-wrap gap-2">
          {COLORI_NOTA.map((c, i) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={nota.colore === c}
              aria-label={NOMI_COLORI[i]}
              onClick={() => imposta("colore", c)}
              className={`h-9 w-9 rounded-full ring-1 ring-black/15 ${nota.colore === c ? "outline outline-[3px] outline-offset-2 outline-[#16241F]" : ""}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <button type="button" onClick={() => file.current?.click()} className="ml-auto inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white/70 px-3 text-sm font-semibold hover:bg-white">
          <Icona nome="add_photo_alternate" dimensione={20} />
          {nota.foto ? "Cambia foto" : "Foto"}
        </button>
        <input ref={file} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="sr-only" tabIndex={-1} onChange={(e) => void caricaFoto(e.target.files?.[0]).finally(() => (e.target.value = ""))} />
      </div>

      {erroreFoto || errore ? (
        <p role="alert" className="rounded-lg bg-white/80 p-2 text-sm font-semibold text-error">
          {erroreFoto ?? errore}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!notaCompleta(nota) || invio}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-[17px] font-bold shadow-sollevata disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        style={{ backgroundColor: accento, color: testoSu(accento) }}
      >
        {invio ? "Un momento…" : modifica ? "Salva le modifiche" : "Pubblica sul biglietto"}
      </button>
      {onAltraPersona ? (
        <button type="button" onClick={onAltraPersona} className="min-h-tocco text-sm font-semibold underline underline-offset-4 opacity-80">
          Non sei tu? Scrivi un nuovo messaggio
        </button>
      ) : null}
    </form>
  );
}
