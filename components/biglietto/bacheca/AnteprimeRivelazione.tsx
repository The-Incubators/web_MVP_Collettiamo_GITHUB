"use client";

import type { ModoRivelazione } from "@/lib/tipi";
import { NOTE_ESEMPIO, stileSfondo, type AspettoBacheca } from "./AnteprimaBacheca";

function Mini({ testo, autore, colore, className = "" }: { testo: string; autore: string; colore: string; className?: string }) {
  return (
    <div className={`rounded-xl px-3 py-2 text-left text-xs leading-snug text-[#16241F] shadow ${className}`} style={{ backgroundColor: colore }}>
      <p>{testo}</p>
      <p className="mt-1 font-semibold opacity-70">— {autore}</p>
    </div>
  );
}

/** Un piccolo assaggio animato di ogni modalità, con i colori del tema scelto. */
export function AnteprimaRivelazione({ modo, aspetto, festeggiato }: { modo: ModoRivelazione; aspetto: AspettoBacheca; festeggiato: string }) {
  const note = NOTE_ESEMPIO;
  if (modo === "griglia") {
    return (
      <div className="grid h-40 grid-cols-2 content-center gap-2 rounded-2xl p-3" style={stileSfondo(aspetto)} aria-hidden="true">
        {note.map((n, i) => (
          <Mini key={i} {...n} className={i % 2 ? "rotate-1" : "-rotate-1"} />
        ))}
      </div>
    );
  }
  if (modo === "storie") {
    return (
      <div className="relative flex h-40 items-center justify-center rounded-2xl p-3" style={stileSfondo(aspetto)} aria-hidden="true">
        <div className="absolute inset-x-3 top-3 flex gap-1">
          <span className="h-1 flex-1 rounded-full bg-white" />
          <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/40">
            <span className="riv-barra block h-full w-full bg-white" />
          </span>
          <span className="h-1 flex-1 rounded-full bg-white/40" />
        </div>
        <Mini {...note[1]} className="w-3/4 text-sm" />
      </div>
    );
  }
  if (modo === "film") {
    return (
      <div className="relative flex h-40 flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl bg-[#101512] p-3 text-center text-white" aria-hidden="true">
        <p className="riv-dissolvi font-display text-lg font-bold">{festeggiato.trim() || "Per te"}</p>
        <p className="riv-dissolvi text-xs uppercase tracking-[0.2em] opacity-70">con affetto da</p>
        <p className="riv-dissolvi text-sm opacity-90">{note.map((n) => n.autore).join(" · ")}</p>
      </div>
    );
  }
  return (
    <div className="h-40 overflow-hidden rounded-2xl p-3" style={stileSfondo(aspetto)} aria-hidden="true">
      {/* la colonna è ripetuta due volte: scorre di metà altezza e ricomincia senza salti */}
      <div className="riv-sali flex flex-col gap-2">
        {[...note, ...note].map((n, i) => (
          <Mini key={i} {...n} className={i % 2 ? "ml-8" : "mr-8"} />
        ))}
      </div>
    </div>
  );
}
