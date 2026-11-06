"use client";

import { useId, useRef, useState } from "react";
import { COLORI_SFONDO, COLORI_TITOLO, FONT_TITOLO } from "@/lib/dominio/bacheca";
import { fontPerId } from "@/lib/dominio/biglietti";
import { preparaImmagine } from "@/lib/biglietti/immaginiClient";
import { useFontBiglietto } from "../useFontBiglietto";

/** Le scelte di «Colori e font»: lo sfondo (colore o foto), il carattere e il colore del titolo. */
export interface ValoreAspetto {
  sfondo: "colore" | "foto";
  coloreSfondo: string;
  fontTitolo: string;
  coloreTitolo: string;
}

const NOMI_COLORE: Record<string, string> = {
  "#F7F0E6": "Avorio",
  "#E9F2EC": "Menta",
  "#FFE9DE": "Pesca",
  "#033922": "Verde",
  "#FCE1E8": "Rosa",
  "#E8E1FA": "Lilla",
  "#DCEBFF": "Cielo",
  "#FFF4C2": "Giallo",
  "#F4B9A8": "Corallo",
  "#1E2A52": "Blu notte",
  "#7A2E4A": "Prugna",
  "#16241F": "Nero",
  "#FFFFFF": "Bianco",
  "#E2582B": "Arancio",
  "#1E3A66": "Blu",
  "#8A5A1A": "Ocra",
  "#3E2E7A": "Viola",
};

/** Un colore nel riepilogo: il quadratino e il nome (o il codice, per un colore scelto con il selettore). */
export function NomeColore({ colore }: { colore: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <i className="campione-b" style={{ background: colore }} aria-hidden="true" />
      {NOMI_COLORE[colore.toUpperCase()] ?? colore.toUpperCase()}
    </span>
  );
}

/** Una fila di colori proposti più «Altro colore», che apre il selettore del sistema: si sceglie qualsiasi colore. */
function SceltaColore({ etichetta, colori, valore, onScegli }: { etichetta: string; colori: readonly string[]; valore: string; onScegli: (c: string) => void }) {
  const id = useId();
  const altro = !colori.includes(valore.toUpperCase());
  return (
    <div className="campo">
      <span className="etichetta" id={id}>
        {etichetta}
      </span>
      <div className="colori-b" role="radiogroup" aria-labelledby={id}>
        {colori.map((c) => (
          <button key={c} type="button" role="radio" aria-checked={valore.toUpperCase() === c} aria-label={NOMI_COLORE[c] ?? c} title={NOMI_COLORE[c] ?? c} style={{ background: c }} onClick={() => onScegli(c)} />
        ))}
        <label className={`altro ${altro ? "scelto" : ""}`} title="Altro colore" style={altro ? { background: valore } : undefined}>
          <span className="sr-only">Altro colore</span>
          <input type="color" value={valore.toLowerCase()} onChange={(e) => onScegli(e.target.value.toUpperCase())} />
        </label>
      </div>
    </div>
  );
}

/**
 * «Colori e font» (editor e gestione del biglietto): sfondo a colore o con una foto, carattere e colore del titolo.
 * La foto arriva già ridotta (preparaImmagine) e resta nel browser finché chi chiama non la salva.
 */
export function SceltaAspetto({
  valore,
  onCambia,
  foto,
  onFoto,
  onTogliFoto,
  attesa = false,
}: {
  valore: ValoreAspetto;
  onCambia: (v: Partial<ValoreAspetto>) => void;
  /** l'indirizzo della foto scelta (dataUrl o url salvato); null = nessuna */
  foto: string | null;
  onFoto: (dataUrl: string) => void;
  onTogliFoto: () => void;
  attesa?: boolean;
}) {
  const file = useRef<HTMLInputElement>(null);
  const [prepara, setPrepara] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const idSfondo = useId();
  const idFont = useId();
  useFontBiglietto(FONT_TITOLO);

  async function scegliFoto(f: File | undefined) {
    if (!f) return;
    setErrore(null);
    setPrepara(true);
    try {
      const img = await preparaImmagine(f);
      onFoto(img.dataUrl);
      onCambia({ sfondo: "foto" });
    } catch (e) {
      setErrore(e instanceof Error ? e.message : "Non riusciamo ad aprire questa immagine.");
    } finally {
      setPrepara(false);
    }
  }

  return (
    <div className="grid gap-5">
      <div className="campo">
        <span className="etichetta" id={idSfondo}>
          Sfondo
        </span>
        <div className="segmenti" role="radiogroup" aria-labelledby={idSfondo}>
          {(
            [
              ["colore", "Colore"],
              ["foto", "Foto"],
            ] as const
          ).map(([k, n]) => (
            <button key={k} type="button" role="radio" aria-checked={valore.sfondo === k} onClick={() => onCambia({ sfondo: k })}>
              {n}
            </button>
          ))}
        </div>
      </div>

      {valore.sfondo === "colore" ? (
        <SceltaColore etichetta="Colore dello sfondo" colori={COLORI_SFONDO} valore={valore.coloreSfondo} onScegli={(c) => onCambia({ coloreSfondo: c })} />
      ) : (
        <div className="campo">
          <span className="etichetta">Foto dello sfondo</span>
          {foto ? (
            <div className="foto-sfondo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={foto} alt="La foto dello sfondo" />
              <div className="azioni">
                <button type="button" className="btn btn-quieto" disabled={attesa || prepara} onClick={() => file.current?.click()}>
                  Cambia foto
                </button>
                <button type="button" className="btn btn-quieto pericolo" disabled={attesa || prepara} onClick={onTogliFoto}>
                  Togli la foto
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="scelta-file" disabled={attesa || prepara} aria-busy={prepara || undefined} onClick={() => file.current?.click()}>
              <b>{prepara ? "Preparo la foto…" : "Carica una foto"}</b>
              <span className="t-piccolo muted">Tocca per sceglierla: JPG, PNG o GIF</span>
            </button>
          )}
          <input ref={file} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="sr-only" tabIndex={-1} onChange={(e) => (void scegliFoto(e.target.files?.[0]), (e.target.value = ""))} />
          {errore ? (
            <p role="alert" className="errore-testo m-0">
              {errore}
            </p>
          ) : null}
        </div>
      )}

      <div className="campo">
        <span className="etichetta" id={idFont}>
          Font del titolo
        </span>
        <div className="font-b" role="radiogroup" aria-labelledby={idFont}>
          {FONT_TITOLO.map((f) => {
            const font = fontPerId(f);
            return (
              <button key={f} type="button" role="radio" aria-checked={valore.fontTitolo === f} onClick={() => onCambia({ fontTitolo: f })} style={{ fontFamily: font.css }}>
                {font.nome}
              </button>
            );
          })}
        </div>
      </div>

      <SceltaColore etichetta="Colore del titolo" colori={COLORI_TITOLO} valore={valore.coloreTitolo} onScegli={(c) => onCambia({ coloreTitolo: c })} />
    </div>
  );
}
