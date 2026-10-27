"use client";

import { fontPerId } from "@/lib/dominio/biglietti";
import { testoSu } from "@/lib/dominio/bacheca";
import type { ColoriBacheca } from "@/lib/tipi";
import { useFontBiglietto } from "../useFontBiglietto";

/** I colori dei bigliettini (carta pastello): chi firma ne sceglie uno. */
export const COLORI_NOTA = ["#FFF4C2", "#FDEBD3", "#DDF3E4", "#FCE1E8", "#E8E1FA", "#FFE8DC"] as const;

export interface NotaBacheca {
  testo: string;
  autore: string;
  colore: string;
}

/** I bigliettini d'esempio dell'anteprima: messaggi neutri, adatti a quasi ogni occasione. */
export const NOTE_ESEMPIO: NotaBacheca[] = [
  { testo: "Ti pensiamo tutti, oggi più che mai 💚", autore: "Chiara", colore: COLORI_NOTA[0] },
  { testo: "Un abbraccio grande da tutto l’ufficio!", autore: "Paolo", colore: COLORI_NOTA[2] },
  { testo: "Sei una persona speciale. Grazie di esserci.", autore: "Elena", colore: COLORI_NOTA[1] },
];

const ROTAZIONI = ["-rotate-[1.5deg]", "rotate-[1deg]", "rotate-[0.5deg]", "-rotate-[0.8deg]"];

export interface AspettoBacheca {
  titolo: string;
  benvenuto: string;
  emoji: string;
  fontTitolo: string;
  colori: ColoriBacheca;
  /** dataUrl o url dell'immagine di sfondo; null = gradiente dei colori */
  immagine: string | null;
  scurisci: number;
}

/** Lo sfondo della bacheca: immagine scurita, oppure gradiente dei due colori. */
export function stileSfondo(a: Pick<AspettoBacheca, "colori" | "immagine" | "scurisci">): React.CSSProperties {
  if (a.immagine) {
    return {
      backgroundImage: `linear-gradient(rgba(0,0,0,${a.scurisci}), rgba(0,0,0,${a.scurisci})), url("${a.immagine}")`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  return { backgroundImage: `linear-gradient(165deg, ${a.colori.sfondo1}, ${a.colori.sfondo2})` };
}

/** Il colore dei testi sopra lo sfondo. */
export function testoSopra(a: Pick<AspettoBacheca, "colori" | "immagine" | "scurisci">): string {
  return a.immagine ? "#FFFFFF" : testoSu(a.colori.sfondo1);
}

function Nota({ n, i }: { n: NotaBacheca; i: number }) {
  return (
    <div className={`flex flex-col gap-2 rounded-2xl p-3 text-left text-[13px] leading-snug text-[#16241F] shadow-[0_6px_16px_-6px_rgba(0,0,0,0.25)] ${ROTAZIONI[i % ROTAZIONI.length]}`} style={{ backgroundColor: n.colore }}>
      <p>{n.testo}</p>
      <p className="font-semibold opacity-70">— {n.autore}</p>
    </div>
  );
}

/**
 * La bacheca come la vedrà il gruppo: titolo, benvenuto e bigliettini, con il pulsante per scrivere.
 * Nel wizard è solo un'anteprima (niente si clicca).
 */
export function AnteprimaBacheca({ aspetto, note = NOTE_ESEMPIO, compatta = false }: { aspetto: AspettoBacheca; note?: NotaBacheca[]; compatta?: boolean }) {
  useFontBiglietto([aspetto.fontTitolo]);
  const colore = testoSopra(aspetto);
  const ombra = aspetto.immagine ? "0 1px 8px rgba(0,0,0,0.45)" : undefined;
  return (
    <div
      aria-label="Anteprima del biglietto"
      role="img"
      className="relative mx-auto flex w-full max-w-[380px] flex-col overflow-hidden rounded-[28px] shadow-sollevata"
      style={stileSfondo(aspetto)}
    >
      <div className={`flex flex-col items-center gap-2 px-4 text-center ${compatta ? "pt-5" : "pt-7"}`} style={{ color: colore, textShadow: ombra }}>
        <span aria-hidden="true" className={compatta ? "text-3xl" : "text-[44px] leading-none"}>
          {aspetto.emoji}
        </span>
        <p className={`break-words font-bold leading-tight ${compatta ? "text-2xl" : "text-[30px]"}`} style={{ fontFamily: fontPerId(aspetto.fontTitolo).css }}>
          {aspetto.titolo}
        </p>
        {aspetto.benvenuto.trim() ? <p className="line-clamp-3 whitespace-pre-line text-sm opacity-90">{aspetto.benvenuto}</p> : null}
        <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-[#16241F]" style={{ textShadow: "none" }}>
          ✍️ {note.length} {note.length === 1 ? "messaggio" : "messaggi"}
        </span>
      </div>
      <div className="grid grid-cols-2 items-start gap-3 px-4 pb-4 pt-5">
        {note.map((n, i) => (
          <Nota key={i} n={n} i={i} />
        ))}
      </div>
      {compatta ? null : (
        <div className="px-4 pb-4">
          <span
            className="flex min-h-11 w-full items-center justify-center rounded-full px-4 text-sm font-bold shadow"
            style={{ backgroundColor: aspetto.colori.accento, color: testoSu(aspetto.colori.accento) }}
          >
            ✍️ Scrivi il tuo messaggio
          </span>
        </div>
      )}
    </div>
  );
}
