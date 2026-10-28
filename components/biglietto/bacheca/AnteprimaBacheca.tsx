"use client";

import { modelloPerId, MODELLI_BIGLIETTO } from "@/lib/dati/modelli-biglietto";
import { coloriDelModello, COLORI_NOTA, SCURISCI_PREDEFINITO, testoSu } from "@/lib/dominio/bacheca";
import { fontPerId, testoDaHtml } from "@/lib/dominio/biglietti";
import { emojiOccasione, type BigliettoPubblico, type ColoriBacheca } from "@/lib/tipi";
import { useFontBiglietto } from "../useFontBiglietto";

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

/** Le piccole rotazioni dei bigliettini, a turno: sembrano attaccati a mano. */
export const ROTAZIONI = ["-rotate-[1.5deg]", "rotate-[1deg]", "rotate-[0.5deg]", "-rotate-[0.8deg]"];

/** La carta del bigliettino: angoli, ombra e testo scuro (i colori sono tutti chiari). */
export const CLASSI_NOTA = "rounded-2xl text-left leading-snug text-[#16241F] shadow-[0_6px_16px_-6px_rgba(0,0,0,0.25)]";

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

/** L'aspetto della bacheca di un biglietto pubblicato. Quelli creati prima della bacheca prendono i colori del loro modello. */
export function aspettoDaBiglietto(b: Pick<BigliettoPubblico, "occasione" | "nome" | "messaggioGruppo" | "copertina">): AspettoBacheca {
  const modello = modelloPerId(b.copertina.modelloId) ?? MODELLI_BIGLIETTO[0];
  return {
    titolo: b.copertina.titolo || b.nome,
    benvenuto: testoDaHtml(b.messaggioGruppo),
    emoji: modello.sfondo.motivo || emojiOccasione(b.occasione),
    fontTitolo: modello.fontBacheca ?? "predefinito",
    colori: b.copertina.colori ?? coloriDelModello(modello),
    immagine: b.copertina.immagineUrl,
    scurisci: b.copertina.scurisci ?? SCURISCI_PREDEFINITO,
  };
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

export function testoMessaggi(n: number): string {
  return `${n} ${n === 1 ? "messaggio" : "messaggi"}`;
}

/**
 * Titolo, benvenuto ed etichetta dei messaggi: la testa della bacheca, uguale nell'anteprima e in quella vera.
 * `vera`: la bacheca pubblicata, con il titolo come h1 e il benvenuto intero (nell'anteprima si taglia a tre righe).
 */
export function TestaBacheca({ aspetto, nMessaggi, compatta = false, vera = false }: { aspetto: AspettoBacheca; nMessaggi: number; compatta?: boolean; vera?: boolean }) {
  useFontBiglietto([aspetto.fontTitolo]);
  const Titolo = vera ? "h1" : "p";
  return (
    <div className="flex flex-col items-center gap-2 text-center" style={{ color: testoSopra(aspetto), textShadow: aspetto.immagine ? "0 1px 8px rgba(0,0,0,0.45)" : undefined }}>
      <span aria-hidden="true" className={compatta ? "text-3xl" : "text-[44px] leading-none"}>
        {aspetto.emoji}
      </span>
      <Titolo className={`break-words font-bold leading-tight ${compatta ? "text-2xl" : "text-[30px]"}`} style={{ fontFamily: fontPerId(aspetto.fontTitolo).css }}>
        {aspetto.titolo}
      </Titolo>
      {aspetto.benvenuto.trim() ? <p className={`whitespace-pre-line text-sm opacity-90 ${vera ? "" : "line-clamp-3"}`}>{aspetto.benvenuto}</p> : null}
      {/* l'accento colora l'etichetta dei messaggi (niente pulsanti finti nell'anteprima: sembrerebbero da cliccare) */}
      <span
        className="mt-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
        style={{ textShadow: "none", backgroundColor: aspetto.colori.accento, color: testoSu(aspetto.colori.accento) }}
      >
        ✍️ {testoMessaggi(nMessaggi)}
      </span>
    </div>
  );
}

function Nota({ n, i }: { n: NotaBacheca; i: number }) {
  return (
    <div className={`flex flex-col gap-2 p-3 text-[13px] ${CLASSI_NOTA} ${ROTAZIONI[i % ROTAZIONI.length]}`} style={{ backgroundColor: n.colore }}>
      <p>{n.testo}</p>
      <p className="font-semibold opacity-70">— {n.autore}</p>
    </div>
  );
}

/**
 * La bacheca come la vedrà il gruppo: titolo, benvenuto e bigliettini.
 * Nel wizard è solo un'anteprima (niente si clicca).
 */
export function AnteprimaBacheca({ aspetto, note = NOTE_ESEMPIO, compatta = false }: { aspetto: AspettoBacheca; note?: NotaBacheca[]; compatta?: boolean }) {
  return (
    <div
      aria-label="Anteprima del biglietto"
      role="img"
      className="relative mx-auto flex w-full max-w-[380px] flex-col overflow-hidden rounded-[28px] shadow-sollevata"
      style={stileSfondo(aspetto)}
    >
      <div className={`px-4 ${compatta ? "pt-5" : "pt-7"}`}>
        <TestaBacheca aspetto={aspetto} nMessaggi={note.length} compatta={compatta} />
      </div>
      <div className={`grid grid-cols-2 items-start gap-3 px-4 pt-5 ${compatta ? "pb-4" : "pb-6"}`}>
        {note.map((n, i) => (
          <Nota key={i} n={n} i={i} />
        ))}
      </div>
    </div>
  );
}
