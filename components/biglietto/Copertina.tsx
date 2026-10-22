"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import type { ModelloBiglietto, SfondoModello, ZonaTitolo } from "@/lib/tipi";
import { Tela } from "./Tela";

export function sfondoCss(s: SfondoModello): CSSProperties {
  return s.tipo === "gradiente" ? { background: `linear-gradient(140deg, ${s.da}, ${s.a})` } : { background: s.colore };
}

function stileZona(z: ZonaTitolo, grassetto: boolean): CSSProperties {
  return {
    position: "absolute",
    left: `${z.x}%`,
    top: `${z.y}%`,
    width: `${z.w}%`,
    textAlign: z.allineamento,
    fontFamily: z.font,
    fontWeight: grassetto ? 700 : 400,
    fontSize: z.dimensione,
    color: z.colore,
    textTransform: z.maiuscolo ? "uppercase" : "none",
    lineHeight: 1.1,
    wordBreak: "break-word",
  };
}

/**
 * Testo modificabile sul posto (titolo o sottotitolo). Solo testo semplice, una riga logica; il segnaposto è
 * disegnato dal CSS (`.editabile:empty::before`) e sparisce al primo tasto.
 */
function TestoModificabile({ valore, onCambia, segnaposto, stile, etichetta, max }: { valore: string; onCambia: (v: string) => void; segnaposto: string; stile: CSSProperties; etichetta: string; max: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el && el.textContent !== valore) el.textContent = valore;
  }, [valore]);
  return (
    <div
      ref={ref}
      role="textbox"
      aria-label={etichetta}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      data-segnaposto={segnaposto}
      className="editabile"
      style={{ ...stile, outline: "none", minHeight: "1.1em", cursor: "text" }}
      onInput={(e) => {
        const el = e.currentTarget;
        let t = (el.textContent ?? "").replace(/\s+/g, " ");
        if (t.length > max) {
          t = t.slice(0, max);
          el.textContent = t;
        }
        if (!t.trim() && el.innerHTML !== "") el.innerHTML = "";
        onCambia(t);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }
      }}
      onPaste={(e) => {
        e.preventDefault();
        document.execCommand("insertText", false, e.clipboardData.getData("text/plain").replace(/\s+/g, " "));
      }}
    />
  );
}

/**
 * La copertina: sfondo del modello, motivo, testo fisso, immagine (per i modelli che la prevedono) e il titolo.
 * Con `onTitolo` il titolo si scrive sul posto; `segnapostoImmagine` riempie la zona dell'immagine finché manca.
 */
export function Copertina({
  modello,
  titolo,
  sottotitolo,
  immagineUrl,
  larghezza,
  className,
  ombra,
  onTitolo,
  onSottotitolo,
  segnapostoImmagine,
}: {
  modello: ModelloBiglietto;
  titolo: string;
  sottotitolo?: string | null;
  immagineUrl?: string | null;
  larghezza: number;
  className?: string;
  ombra?: boolean;
  onTitolo?: (t: string) => void;
  onSottotitolo?: (t: string) => void;
  segnapostoImmagine?: ReactNode;
}) {
  const z = modello.titolo;
  const conImmagine = modello.tipo === "carica-immagine" || modello.tipo === "foto-intera";
  const tutta = modello.tipo === "foto-intera";
  return (
    <Tela larghezza={larghezza} className={className} ombra={ombra}>
      <div style={{ position: "absolute", inset: 0, ...sfondoCss(modello.sfondo) }} />
      {modello.sfondo.motivo ? (
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 380, lineHeight: 1, opacity: 0.16 }}>
          {modello.sfondo.motivo}
        </div>
      ) : null}
      {conImmagine ? (
        <div style={tutta ? { position: "absolute", inset: 0 } : { position: "absolute", left: 40, right: 40, top: 40, height: 640, borderRadius: 6, overflow: "hidden", background: "#EDF1EE" }}>
          {immagineUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={immagineUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: tutta ? "linear-gradient(160deg,#5B6D66,#2B3833)" : "#EDF1EE" }}>
              {segnapostoImmagine ?? (
                <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: 2, color: tutta ? "#FFFFFF" : "#5B6D66", textAlign: "center", padding: 40 }}>
                  {tutta ? "📷 CARICA LA TUA FOTO" : "🖼️ CARICA UN'IMMAGINE"}
                </span>
              )}
            </div>
          )}
          {tutta ? <div aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "40%", background: "linear-gradient(transparent, rgba(0,0,0,.55))", pointerEvents: "none" }} /> : null}
        </div>
      ) : null}
      {modello.testoFisso ? (
        <div style={{ position: "absolute", top: "10%", left: "8%", width: "84%", textAlign: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 38, color: z.colore }}>
          {modello.testoFisso}
        </div>
      ) : null}
      {onTitolo ? (
        <TestoModificabile valore={titolo} onCambia={onTitolo} segnaposto={z.segnaposto} stile={stileZona(z, true)} etichetta="Titolo della copertina" max={80} />
      ) : (
        <div style={stileZona(z, true)}>{titolo.trim() ? titolo : <span style={{ opacity: 0.5 }}>{z.segnaposto}</span>}</div>
      )}
      {modello.sottotitolo ? (
        onSottotitolo ? (
          <TestoModificabile valore={sottotitolo ?? ""} onCambia={onSottotitolo} segnaposto={modello.sottotitolo.segnaposto} stile={stileZona(modello.sottotitolo, false)} etichetta="Sottotitolo della copertina" max={160} />
        ) : sottotitolo ? (
          <div style={stileZona(modello.sottotitolo, false)}>{sottotitolo}</div>
        ) : null
      ) : null}
    </Tela>
  );
}
