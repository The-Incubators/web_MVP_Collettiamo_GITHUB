"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { fontPerId, lunghezzaTesto, MAX_TESTO_MESSAGGIO } from "@/lib/dominio/biglietti";
import { OCCASIONI_BIGLIETTO, type DimensioneTesto } from "@/lib/tipi";
import { BottonePillola } from "../comuni";
import { FinestraImmagine, type Librerie } from "../FinestraImmagine";
import { useFontBiglietto } from "../useFontBiglietto";
import { PannelloStile } from "./PannelloStile";
import { urlAnteprima, type BozzaFirma } from "./bozza";

/** Dimensioni nell'editor (a schermo): più contenute di quelle sulla carta, ma nello stesso ordine. */
const PX_EDITOR: Record<DimensioneTesto, number> = { xs: 13, s: 15, m: 18, l: 22, xl: 28, xxl: 34 };
const EMOJI = "😀 😂 🥰 😍 😘 🤗 🥳 😎 🤩 😇 🙌 👏 💪 🙏 👍 ❤️ 🧡 💛 💚 💙 💜 🤍 ✨ 🌟 🎉 🎊 🎈 🎂 🍰 🥂 🍾 🎁 🌷 🌸 🌻 🌈 ☀️ 🍀 🐶 🐱".split(" ");

export function ricercaPerOccasione(occasione: string): string {
  if (occasione === "altro" || occasione === "ricorrenze") return "auguri";
  return (OCCASIONI_BIGLIETTO.find((o) => o.valore === occasione)?.voce ?? "auguri").toLowerCase().split(" ")[0];
}

/**
 * L'editor del messaggio (spec 5.2): zona immagine, barra strumenti (stile del testo, G/C/U, emoji),
 * area del messaggio e «Da parte di». «Continua» si abilita con messaggio e firma; l'immagine è facoltativa.
 */
export function EditorFirma({
  bozza,
  onBozza,
  librerie,
  occasione,
  onContinua,
  testoContinua = "Continua",
  occupato,
  intestazione,
  onAnteprima,
  testoAnteprima = "Guarda anteprima del biglietto",
}: {
  /** riga in cima al riquadro (es. «hai già firmato») */
  intestazione?: ReactNode;
  bozza: BozzaFirma;
  onBozza: (b: BozzaFirma) => void;
  librerie: Librerie;
  occasione: string;
  onContinua: () => void;
  testoContinua?: string;
  occupato?: boolean;
  /** se c'è, sopra «Conferma» compare un pulsante che porta all'anteprima del biglietto */
  onAnteprima?: () => void;
  testoAnteprima?: string;
}) {
  const area = useRef<HTMLDivElement>(null);
  const [finestra, setFinestra] = useState<null | "libreria" | "carica">(null);
  const [stileAperto, setStileAperto] = useState(false);
  const [emoji, setEmoji] = useState(false);
  const [formati, setFormati] = useState({ b: false, i: false, u: false });
  const id = useId();
  const bozzaRef = useRef(bozza);
  bozzaRef.current = bozza;
  useFontBiglietto([bozza.stile.font]);

  // contenuto iniziale (dalla sessione o dalla firma già fatta); poi l'area è libera
  useEffect(() => {
    if (area.current && area.current.innerHTML !== bozza.messaggioHtml && document.activeElement !== area.current) area.current.innerHTML = bozza.messaggioHtml;
  }, [bozza.messaggioHtml]);

  const lunghezza = lunghezzaTesto(bozza.messaggioHtml);
  const vuoto = !bozza.messaggioHtml.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  const valido = !vuoto && lunghezza <= MAX_TESTO_MESSAGGIO && !!bozza.daParteDi.trim();

  const aggiornaFormati = () => {
    try {
      setFormati({ b: document.queryCommandState("bold"), i: document.queryCommandState("italic"), u: document.queryCommandState("underline") });
    } catch {
      /* ignorato */
    }
  };
  useEffect(() => {
    document.addEventListener("selectionchange", aggiornaFormati);
    return () => document.removeEventListener("selectionchange", aggiornaFormati);
  }, []);

  const leggi = () => {
    const el = area.current;
    if (!el) return;
    if (!el.textContent?.trim() && el.innerHTML !== "") el.innerHTML = "";
    onBozza({ ...bozzaRef.current, messaggioHtml: el.innerHTML });
  };
  const comando = (c: "bold" | "italic" | "underline") => {
    area.current?.focus();
    document.execCommand(c);
    aggiornaFormati();
    leggi();
  };
  const inserisci = (t: string) => {
    const el = area.current;
    if (!el) return;
    el.focus();
    // se il cursore non è nell'area, va in fondo
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || !el.contains(sel.anchorNode)) {
      const r = document.createRange();
      r.selectNodeContents(el);
      r.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(r);
    }
    document.execCommand("insertText", false, t);
    leggi();
  };

  const font = fontPerId(bozza.stile.font);
  const strumento = "flex h-11 w-11 items-center justify-center rounded-controllo text-lg hover:bg-surface-2 aria-pressed:bg-accent-field aria-pressed:text-accent-2";

  return (
    <div className="flex flex-col gap-5">
      <div className="overflow-hidden rounded-3xl bg-surface shadow-carta">
        {intestazione}
        {/* zona immagine */}
        <div className="relative flex min-h-[270px] flex-col items-center justify-center gap-4 bg-accent-field p-4">
          {bozza.immagine ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={urlAnteprima(bozza.immagine)} alt="L’immagine del tuo messaggio" className="max-h-[240px] max-w-full rounded-controllo object-contain" />
              <button
                type="button"
                onClick={() => onBozza({ ...bozza, immagine: null })}
                aria-label="Togli l’immagine"
                className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-ink/80 text-2xl leading-none text-surface hover:bg-ink"
              >
                <span aria-hidden="true">×</span>
              </button>
              {bozza.immagine.tipo !== "caricata" && bozza.immagine.attribuzione ? <p className="text-xs text-ink-soft">{bozza.immagine.attribuzione}</p> : null}
            </>
          ) : (
            <>
              <p className="text-center font-medium">Aggiungi un’immagine al tuo messaggio</p>
              <div className="flex gap-3">
                {librerie.gif || librerie.foto ? (
                  <button type="button" onClick={() => setFinestra("libreria")} className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-contenitore bg-surface text-xs font-semibold shadow-sm hover:ring-accent">
                    <span aria-hidden="true" className="text-2xl font-bold text-accent-2">
                      🎞️
                    </span>
                    Libreria GIF
                  </button>
                ) : null}
                <button type="button" onClick={() => setFinestra("carica")} className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-contenitore bg-surface text-xs font-semibold shadow-sm hover:ring-accent">
                  <span aria-hidden="true" className="text-2xl font-bold text-accent-2">
                    ⬆️
                  </span>
                  Carica immagine
                </button>
              </div>
            </>
          )}
        </div>

        {/* barra strumenti */}
        <div className="flex items-center justify-between gap-2 border-y border-line px-2 py-1">
          <button type="button" onClick={() => setStileAperto(true)} className="inline-flex min-h-tocco items-center gap-1.5 rounded-full bg-accent-field px-4 text-sm font-semibold text-accent-2">
            <span aria-hidden="true" className="font-serif">
              Tт
            </span>{" "}
            Stile del testo
          </button>
          <div className="relative flex items-center" role="toolbar" aria-label="Formato del testo">
            <button type="button" aria-label="Grassetto" aria-pressed={formati.b} onMouseDown={(e) => e.preventDefault()} onClick={() => comando("bold")} className={`${strumento} font-bold`}>
              G
            </button>
            <button type="button" aria-label="Corsivo" aria-pressed={formati.i} onMouseDown={(e) => e.preventDefault()} onClick={() => comando("italic")} className={`${strumento} font-serif italic`}>
              C
            </button>
            <button type="button" aria-label="Sottolineato" aria-pressed={formati.u} onMouseDown={(e) => e.preventDefault()} onClick={() => comando("underline")} className={`${strumento} underline`}>
              U
            </button>
            <button type="button" aria-label="Emoji" aria-expanded={emoji} onMouseDown={(e) => e.preventDefault()} onClick={() => setEmoji((x) => !x)} className={strumento}>
              🙂
            </button>
            {emoji ? (
              <div role="dialog" aria-label="Emoji" className="absolute right-0 top-full z-40 mt-1 grid w-[264px] grid-cols-6 gap-1 rounded-controllo border border-line bg-surface p-2 shadow-xl">
                {EMOJI.map((e) => (
                  <button key={e} type="button" onMouseDown={(ev) => ev.preventDefault()} onClick={() => inserisci(e)} className="flex h-10 w-10 items-center justify-center rounded-controllo text-xl hover:bg-surface-2" aria-label={`Inserisci ${e}`}>
                    {e}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* messaggio */}
        <div
          ref={area}
          id={`${id}-m`}
          role="textbox"
          aria-multiline="true"
          aria-label="Il tuo messaggio"
          contentEditable
          suppressContentEditableWarning
          data-segnaposto="Scrivi qui il tuo messaggio…"
          onInput={leggi}
          onBlur={() => setTimeout(() => setEmoji(false), 150)}
          onPaste={(e) => {
            e.preventDefault();
            document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
          }}
          className="editabile min-h-40 px-4 py-3 outline-none [&:focus]:!outline-none"
          style={{ fontFamily: font.css, color: bozza.stile.colore, fontSize: PX_EDITOR[bozza.stile.dimensione], lineHeight: 1.4, wordBreak: "break-word" }}
        />
        {lunghezza > MAX_TESTO_MESSAGGIO - 100 ? (
          <p aria-live="polite" className={`px-4 pb-2 text-right text-sm ${lunghezza > MAX_TESTO_MESSAGGIO ? "font-semibold text-error" : "text-ink-soft"}`}>
            {lunghezza} / {MAX_TESTO_MESSAGGIO}
            {lunghezza > MAX_TESTO_MESSAGGIO ? " · accorcia un po’ il messaggio" : ""}
          </p>
        ) : null}
        <div className="border-t border-line px-4 py-2">
          <label htmlFor={`${id}-da`} className="text-sm font-medium text-ink-soft">
            Da parte di
          </label>
          <input
            id={`${id}-da`}
            value={bozza.daParteDi}
            maxLength={80}
            onChange={(e) => onBozza({ ...bozza, daParteDi: e.target.value })}
            placeholder="Scrivi chi firma il messaggio."
            autoComplete="name"
            className="h-12 w-full bg-transparent text-base font-semibold outline-none placeholder:font-normal placeholder:text-ink-soft"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {onAnteprima ? (
          <BottonePillola
            onClick={onAnteprima}
            className="!bg-surface !text-accent-2 ring-1 ring-accent hover:!bg-accent-field"
          >
            {testoAnteprima}
          </BottonePillola>
        ) : null}
        <BottonePillola disabled={!valido || occupato} onClick={onContinua}>
          {occupato ? "Un momento…" : testoContinua}
        </BottonePillola>
      </div>

      <FinestraImmagine
        aperta={finestra !== null}
        onChiudi={() => setFinestra(null)}
        onScegli={(img) => {
          setFinestra(null);
          onBozza({ ...bozzaRef.current, immagine: img });
        }}
        librerie={librerie}
        ricercaIniziale={ricercaPerOccasione(occasione)}
        schedaIniziale={finestra === "libreria" ? "libreria" : "carica"}
      />
      <PannelloStile aperto={stileAperto} stile={bozza.stile} onStile={(s) => onBozza({ ...bozzaRef.current, stile: s })} onChiudi={() => setStileAperto(false)} />
    </div>
  );
}
