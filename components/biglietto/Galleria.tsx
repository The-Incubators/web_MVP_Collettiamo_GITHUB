"use client";

import { useEffect, useRef, useState } from "react";
import { MODELLI_BIGLIETTO, MODELLI_SPECIALI, modelliPerOccasione } from "@/lib/dati/modelli-biglietto";
import { OCCASIONI_BIGLIETTO, type ModelloBiglietto } from "@/lib/tipi";
import { Copertina } from "./Copertina";
import { useLarghezza } from "./useLarghezza";

const GAP = 16;

/** Filtri a pillola scorrevoli con frecce ai lati: prima l'occasione scelta, poi «Tutti», poi le altre. */
function Filtri({ occasione, filtro, onFiltro }: { occasione: string; filtro: string; onFiltro: (f: string) => void }) {
  const fila = useRef<HTMLDivElement>(null);
  const [bordi, setBordi] = useState({ inizio: true, fine: false });
  const voci = [
    ...OCCASIONI_BIGLIETTO.filter((o) => o.valore === occasione).map((o) => ({ id: o.valore, nome: o.voce })),
    { id: "tutti", nome: "Tutti" },
    ...OCCASIONI_BIGLIETTO.filter((o) => o.valore !== occasione).map((o) => ({ id: o.valore, nome: o.voce })),
  ];
  const aggiorna = () => {
    const el = fila.current;
    if (el) setBordi({ inizio: el.scrollLeft <= 2, fine: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 });
  };
  useEffect(aggiorna, []);
  const scorri = (d: number) => fila.current?.scrollBy({ left: d * (fila.current.clientWidth * 0.7), behavior: "smooth" });
  const freccia = "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-xl disabled:opacity-30";
  return (
    <div className="flex items-center gap-2">
      <button type="button" className={freccia} onClick={() => scorri(-1)} disabled={bordi.inizio} aria-label="Filtri precedenti">
        ‹
      </button>
      <div ref={fila} onScroll={aggiorna} className="flex min-w-0 flex-1 gap-2 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Filtra per occasione">
        {voci.map((v) => (
          <button
            key={v.id}
            type="button"
            aria-pressed={filtro === v.id}
            onClick={() => onFiltro(v.id)}
            className={`min-h-tocco shrink-0 whitespace-nowrap rounded-full px-4 text-sm font-semibold ${filtro === v.id ? "bg-accent text-on-accent" : "bg-accent-field text-accent-2"}`}
          >
            {v.nome}
          </button>
        ))}
      </div>
      <button type="button" className={freccia} onClick={() => scorri(1)} disabled={bordi.fine} aria-label="Filtri successivi">
        ›
      </button>
    </div>
  );
}

/** Il segnaposto della casella «Carica immagine o GIF»: due pulsanti scuri (finti, nella miniatura). */
export function SegnapostoCarica({ conGif, onCarica, onGif }: { conGif: boolean; onCarica?: () => void; onGif?: () => void }) {
  const stile: React.CSSProperties = { background: "#16241F", color: "#FFFFFF", borderRadius: 999, padding: "22px 40px", fontSize: 30, fontWeight: 700, border: 0, cursor: onCarica ? "pointer" : "default", fontFamily: "var(--font-testo)" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, alignItems: "center" }}>
      {onCarica ? (
        <button type="button" style={stile} onClick={onCarica}>
          Carica un’immagine
        </button>
      ) : (
        <span style={stile}>Carica un’immagine</span>
      )}
      {conGif ? (
        onGif ? (
          <button type="button" style={stile} onClick={onGif}>
            Scegli una GIF
          </button>
        ) : (
          <span style={stile}>Scegli una GIF</span>
        )
      ) : null}
    </div>
  );
}

/** Griglia a 3 colonne di miniature (1 : 1,414), con le caselle speciali sempre in testa. */
export function Galleria({
  occasione,
  scelto,
  titolo,
  immagineUrl,
  conGif,
  onScegli,
}: {
  occasione: string;
  scelto: string | null;
  titolo: string;
  immagineUrl: string | null;
  conGif: boolean;
  onScegli: (m: ModelloBiglietto) => void;
}) {
  const [filtro, setFiltro] = useState(occasione);
  const [rif, larghezza] = useLarghezza(600);
  const lato = Math.max(60, Math.floor((larghezza - GAP * 2) / 3));
  const modelli = filtro === "tutti" ? MODELLI_BIGLIETTO.filter((m) => m.attivo) : modelliPerOccasione(filtro);
  const tutte = [...MODELLI_SPECIALI, ...modelli];

  return (
    <div className="flex flex-col gap-4">
      <Filtri occasione={occasione} filtro={filtro} onFiltro={setFiltro} />
      <div ref={rif} className="h-0 w-full" />
      <div role="listbox" aria-label="Modelli di copertina" className="grid max-h-[62dvh] grid-cols-3 overflow-y-auto overscroll-contain p-1" style={{ gap: GAP }}>
        {tutte.map((m) => {
          const attivo = m.id === scelto;
          return (
            <button
              key={m.id}
              type="button"
              role="option"
              aria-selected={attivo}
              aria-label={m.nome}
              onClick={() => onScegli(m)}
              className={`relative rounded-[4px] text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${attivo ? "ring-2 ring-accent ring-offset-2 ring-offset-field" : ""}`}
            >
              <Copertina
                modello={m}
                titolo={titolo}
                immagineUrl={attivo || m.tipo !== "illustrato" ? immagineUrl : null}
                larghezza={lato}
                ombra={false}
                className="pointer-events-none border border-line"
                segnapostoImmagine={m.tipo === "carica-immagine" ? <SegnapostoCarica conGif={conGif} /> : undefined}
              />
              <span className="mt-1 block truncate text-xs text-ink-soft">{m.nome}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
