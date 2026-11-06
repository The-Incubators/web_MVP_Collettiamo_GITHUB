"use client";

import type { CSSProperties, ReactNode } from "react";
import { modelloPerId, MODELLI_BIGLIETTO } from "@/lib/dati/modelli-biglietto";
import { coloriDelModello, COLORI_NOTA, MODELLO_LIBERO, SCURISCI_PREDEFINITO, stileCartaDi, testoSu } from "@/lib/dominio/bacheca";
import { fontPerId, testoDaHtml } from "@/lib/dominio/biglietti";
import { emojiOccasione, type BigliettoPubblico, type ColoriBacheca } from "@/lib/tipi";
import { useFontBiglietto } from "../useFontBiglietto";

export interface NotaBacheca {
  testo: string;
  autore: string;
  colore: string;
  /** l'indirizzo della foto del messaggio, se c'è */
  foto?: string | null;
}

/** I bigliettini d'esempio delle anteprime: messaggi neutri, adatti a quasi ogni occasione. */
export const NOTE_ESEMPIO: NotaBacheca[] = [
  { testo: "Ti pensiamo tutti, oggi più che mai.", autore: "Chiara", colore: COLORI_NOTA[0] },
  { testo: "Un abbraccio grande da tutto l’ufficio!", autore: "Paolo", colore: COLORI_NOTA[2] },
  { testo: "Sei una persona speciale. Grazie di esserci.", autore: "Elena", colore: COLORI_NOTA[1] },
];

/** La carta del bigliettino che si sta scrivendo (EditorNota): angoli, ombra e testo scuro (i colori sono tutti chiari). */
export const CLASSI_NOTA = "rounded text-left leading-snug text-ink shadow-[0_1px_2px_rgba(20,43,32,0.1)]";

export interface AspettoBacheca {
  titolo: string;
  benvenuto: string;
  /** il motivo dei temi di prima; vuoto per i quattro stili della carta */
  emoji: string;
  fontTitolo: string;
  colori: ColoriBacheca;
  /** dataUrl o url dell'immagine di sfondo; null = colori del tema */
  immagine: string | null;
  scurisci: number;
  /** la classe dello stile della carta (`tema-menta`…); null per i temi di prima e per «Colori e font», che usano i loro colori */
  classeCarta: string | null;
  /** il colore del titolo scelto in «Colori e font»; null = quello che si legge meglio sullo sfondo */
  coloreTitolo?: string | null;
}

/** L'aspetto di un biglietto pubblicato. Quelli creati prima della bacheca prendono i colori del loro modello. */
export function aspettoDaBiglietto(b: Pick<BigliettoPubblico, "occasione" | "nome" | "messaggioGruppo" | "copertina">): AspettoBacheca {
  const modello = modelloPerId(b.copertina.modelloId) ?? MODELLI_BIGLIETTO[0];
  const stile = stileCartaDi(modello.id);
  return {
    titolo: b.copertina.titolo || b.nome,
    benvenuto: testoDaHtml(b.messaggioGruppo),
    emoji: stile || modello.id === MODELLO_LIBERO ? "" : modello.sfondo.motivo || emojiOccasione(b.occasione),
    fontTitolo: b.copertina.fontTitolo ?? modello.fontBacheca ?? "predefinito",
    colori: b.copertina.colori ?? coloriDelModello(modello),
    immagine: b.copertina.immagineUrl,
    scurisci: b.copertina.scurisci ?? SCURISCI_PREDEFINITO,
    classeCarta: stile ? stile.classe : null,
    coloreTitolo: b.copertina.coloreTitolo ?? null,
  };
}

/** Lo sfondo della bacheca: immagine scurita, oppure i due colori (uguali nei quattro stili della carta). */
export function stileSfondo(a: Pick<AspettoBacheca, "colori" | "immagine" | "scurisci">): CSSProperties {
  if (a.immagine) {
    return {
      backgroundImage: `linear-gradient(rgba(0,0,0,${a.scurisci}), rgba(0,0,0,${a.scurisci})), url("${a.immagine}")`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  return { backgroundImage: `linear-gradient(165deg, ${a.colori.sfondo1}, ${a.colori.sfondo2})` };
}

/**
 * Il font scelto da chi organizza vale per tutto il biglietto, titolo e messaggi (Cri, 6 nov): chi firma non sceglie un
 * suo font. Il campo resta `fontTitolo` nei dati; qui diventa la variabile `--font-b` che i foglietti leggono (globals.css).
 */
export function varFontBiglietto(id: string): CSSProperties {
  return { "--font-b": fontPerId(id).css } as CSSProperties;
}

/** Il colore dei testi sopra lo sfondo. */
export function testoSopra(a: Pick<AspettoBacheca, "colori" | "immagine" | "scurisci">): string {
  return a.immagine ? "#FFFFFF" : testoSu(a.colori.sfondo1);
}

export function testoMessaggi(n: number): string {
  return `${n} ${n === 1 ? "messaggio" : "messaggi"}`;
}

/**
 * Titolo e benvenuto della bacheca di chi firma, con il numero dei messaggi.
 * `vera`: la bacheca pubblicata, con il titolo come h1 e il benvenuto intero (altrove si taglia a tre righe).
 */
export function TestaBacheca({ aspetto, nMessaggi, compatta = false, vera = false }: { aspetto: AspettoBacheca; nMessaggi: number; compatta?: boolean; vera?: boolean }) {
  useFontBiglietto([aspetto.fontTitolo]);
  const Titolo = vera ? "h1" : "p";
  const mano = aspetto.fontTitolo === "mano";
  return (
    <div className="flex flex-col items-center gap-2 text-center" style={{ ...varFontBiglietto(aspetto.fontTitolo), color: testoSopra(aspetto), textShadow: aspetto.immagine ? "0 1px 8px rgba(0,0,0,0.45)" : undefined }}>
      {aspetto.emoji ? (
        <span aria-hidden="true" className={compatta ? "text-3xl" : "text-[44px] leading-none"}>
          {aspetto.emoji}
        </span>
      ) : null}
      <Titolo
        className={`break-words font-bold leading-tight ${mano ? (compatta ? "text-[32px] leading-none" : "text-[44px] leading-none sm:text-[56px]") : compatta ? "text-2xl" : "text-[30px]"}`}
        style={{ fontFamily: fontPerId(aspetto.fontTitolo).css, color: aspetto.coloreTitolo ?? undefined }}
      >
        {aspetto.titolo}
      </Titolo>
      {aspetto.benvenuto.trim() ? <p className={`testo-biglietto whitespace-pre-line opacity-90 ${vera ? "" : "line-clamp-3 text-sm"}`}>{aspetto.benvenuto}</p> : null}
      <span className="stato mt-1" style={{ textShadow: "none" }}>
        {testoMessaggi(nMessaggi)}
      </span>
    </div>
  );
}

/** Classe e stile della carta di un biglietto: lo stile scelto, o i colori dei temi di prima. */
export function cartaDi(aspetto: AspettoBacheca): { className: string; style?: CSSProperties; coloreTitolo?: string; coloreRighe?: string } {
  if (aspetto.classeCarta !== null) return { className: aspetto.classeCarta };
  const s = stileSfondo(aspetto);
  const chiaro = testoSopra(aspetto) === "#FFFFFF";
  const righe = chiaro ? "#FFFFFF" : aspetto.coloreTitolo ? testoSopra(aspetto) : aspetto.colori.accento;
  return { className: chiaro ? "scura" : "", style: s, coloreTitolo: aspetto.coloreTitolo ?? righe, coloreRighe: righe };
}

/** Un foglietto firmato dell'anteprima (niente si clicca). */
export function FogliettoAnteprima({ n }: { n: NotaBacheca }) {
  return (
    <div className="foglietto-firma" style={{ backgroundColor: n.colore }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {n.foto ? <img src={n.foto} alt="" loading="lazy" /> : null}
      {n.testo}
      <span className="chi">{n.autore}</span>
    </div>
  );
}

/**
 * La carta del biglietto (design.md §4, «Biglietto (oggetto)»): titolo a mano, le righe sotto, i foglietti firmati.
 * Nell'editor e nella gestione è un'anteprima: niente si clicca. `children` sostituisce i foglietti.
 */
export function CartaBiglietto({ aspetto, note = NOTE_ESEMPIO, children, className = "" }: { aspetto: AspettoBacheca; note?: NotaBacheca[]; children?: ReactNode; className?: string }) {
  useFontBiglietto([aspetto.fontTitolo]);
  const c = cartaDi(aspetto);
  return (
    <div className={`carta biglietto ${c.className} ${className}`.replace(/\s+/g, " ").trim()} style={{ ...c.style, ...varFontBiglietto(aspetto.fontTitolo) }} aria-label="Anteprima del biglietto">
      <p className="titolo-b" style={{ fontFamily: fontPerId(aspetto.fontTitolo).css, color: c.coloreTitolo }}>
        {aspetto.titolo}
      </p>
      {aspetto.benvenuto.trim() ? (
        <p className="righe-b" style={c.coloreRighe ? { color: c.coloreRighe } : undefined}>
          {aspetto.benvenuto}
        </p>
      ) : null}
      <div className="foglietti">{children ?? note.map((n, i) => <FogliettoAnteprima key={i} n={n} />)}</div>
    </div>
  );
}
