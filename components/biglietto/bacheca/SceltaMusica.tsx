"use client";

import { useRef, useState } from "react";
import { MAX_BYTE_AUDIO } from "@/lib/biglietti/tipi";

/** Il controllo nel browser, prima di caricare (il server ricontrolla il contenuto). */
export function controllaMp3(f: File): string | null {
  if (!/\.mp3$/i.test(f.name) && f.type !== "audio/mpeg" && f.type !== "audio/mp3") return "Serve un file MP3.";
  if (f.size > MAX_BYTE_AUDIO) return "Il file è troppo grande: al massimo 3 MB (circa due o tre minuti).";
  return null;
}

/**
 * La musica della sorpresa: si carica un MP3 (si può anche trascinare), si ascolta, si cambia o si toglie.
 * Nel wizard il file resta nel browser fino a «Crea il biglietto»; nella gestione si carica subito.
 */
export function SceltaMusica({
  nome,
  url,
  onFile,
  onTogli,
  attesa = false,
  errore = null,
}: {
  /** il file scelto (nome) e dove ascoltarlo; null = nessuna musica */
  nome: string | null;
  url: string | null;
  onFile: (f: File) => void;
  onTogli: () => void;
  attesa?: boolean;
  errore?: string | null;
}) {
  const file = useRef<HTMLInputElement>(null);
  const [trascina, setTrascina] = useState(false);
  const [erroreFile, setErroreFile] = useState<string | null>(null);

  function scegli(f: File | undefined) {
    if (!f) return;
    const e = controllaMp3(f);
    setErroreFile(e);
    if (!e) onFile(f);
  }

  const messaggio = erroreFile ?? errore;
  return (
    <div className="musica-b">
      {nome && url ? (
        <div className="file">
          <p className="m-0 break-all font-bold">{nome}</p>
          <audio controls src={url} preload="metadata" className="w-full" aria-label={`Ascolta ${nome}`} />
          <div className="azioni">
            <button type="button" className="btn btn-quieto" disabled={attesa} onClick={() => file.current?.click()}>
              Cambia musica
            </button>
            <button type="button" className="btn btn-quieto pericolo" disabled={attesa} onClick={onTogli}>
              Togli la musica
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={attesa}
          aria-busy={attesa || undefined}
          onClick={() => file.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setTrascina(true);
          }}
          onDragLeave={() => setTrascina(false)}
          onDrop={(e) => {
            e.preventDefault();
            setTrascina(false);
            scegli(e.dataTransfer.files?.[0]);
          }}
          className={`scelta-file ${trascina ? "sopra" : ""}`}
        >
          <b>{attesa ? "Carico la musica…" : "Carica un MP3"}</b>
          <span className="t-piccolo muted">Tocca per sceglierlo o trascinalo qui. Al massimo 3 MB: meglio un pezzo di circa un minuto.</span>
        </button>
      )}
      <input ref={file} type="file" accept="audio/mpeg,.mp3" className="sr-only" tabIndex={-1} onChange={(e) => (scegli(e.target.files?.[0]), (e.target.value = ""))} />
      {attesa && nome ? (
        <p role="status" className="t-piccolo muted m-0">
          Carico la musica…
        </p>
      ) : null}
      {messaggio ? (
        <p role="alert" className="errore-testo m-0">
          {messaggio}
        </p>
      ) : null}
      <p className="t-piccolo muted m-0">Parte quando si apre la sorpresa e ricomincia da capo finché la si guarda. Usa solo musica che puoi condividere.</p>
    </div>
  );
}
