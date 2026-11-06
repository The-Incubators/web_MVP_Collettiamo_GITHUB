"use client";

import { useEffect, useState } from "react";
import { COLORI_NOTA } from "@/lib/dominio/bacheca";
import { fontPerId } from "@/lib/dominio/biglietti";
import type { ModoRivelazione } from "@/lib/tipi";
import type { AspettoBacheca } from "../bacheca/AnteprimaBacheca";
import { useFontBiglietto } from "../useFontBiglietto";

/** I messaggi d'esempio del telefono: neutri, adatti a quasi ogni occasione. */
const NOTE: [string, string][] = [
  ["Ti pensiamo tutti, oggi più che mai.", "Chiara"],
  ["Un abbraccio grande da tutto l’ufficio!", "Paolo"],
  ["Sei una persona speciale. Grazie di esserci.", "Elena"],
  ["La torta la porto io.", "Marco"],
  ["Cento di questi giorni!", "Luca"],
  ["Stasera si festeggia!", "Sara"],
];

const PASSO_MS = 1400;

/** Un contatore che avanza da solo (fermo con il movimento ridotto): muove le quattro scene. */
function useGiro(chiave: string): { n: number; fermo: boolean } {
  const [n, setN] = useState(0);
  const [fermo, setFermo] = useState(false);
  useEffect(() => {
    setN(0);
    const ridotto = !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    setFermo(ridotto);
    if (ridotto) return;
    const t = setInterval(() => setN((x) => x + 1), PASSO_MS);
    return () => clearInterval(t);
  }, [chiave]);
  return { n, fermo };
}

function Nota({ i, grande = false, className = "" }: { i: number; grande?: boolean; className?: string }) {
  const [testo, chi] = NOTE[i % NOTE.length];
  return (
    <div className={`foglietto-firma ${grande ? "grande" : ""} ${className}`} style={{ backgroundColor: COLORI_NOTA[i % COLORI_NOTA.length] }}>
      {testo}
      <span className="chi">{chi}</span>
    </div>
  );
}

/**
 * Il telefono dell'editor al passo «Come lo scoprirà»: mostra, in movimento, come appare il biglietto con il modo scelto
 * (prende titolo e font del titolo dalle scelte fatte). È un'illustrazione: niente si clicca.
 */
export function TelefonoModo({ modo, aspetto, festeggiato }: { modo: ModoRivelazione; aspetto: AspettoBacheca; festeggiato: string }) {
  const { n, fermo } = useGiro(modo);
  useFontBiglietto([aspetto.fontTitolo]);
  const font = { fontFamily: fontPerId(aspetto.fontTitolo).css };
  const nome = festeggiato.trim() || "Marta";

  let schermo;
  if (modo === "storie") {
    const i = n % NOTE.length;
    schermo = (
      <div className="storia-s">
        <span className="tacche-s">
          {NOTE.map((_, k) => (
            <i key={k} className={k < i ? "ok" : k === i ? "ora" : ""} />
          ))}
        </span>
        <Nota key={i} i={i} grande className="entra-s" />
        <span className="chi-s">
          {i + 1} di {NOTE.length}
        </span>
      </div>
    );
  } else if (modo === "film") {
    // il titolo, poi un messaggio alla volta, poi i nomi di tutti
    const scene = NOTE.length + 2;
    const k = n % scene;
    schermo = (
      <div className="film-s">
        <div key={k} className="entra-s grid justify-items-center gap-3">
          {k === 0 ? (
            <>
              <span className="mano" style={font}>
                {nome}
              </span>
              <p>{aspetto.titolo}</p>
            </>
          ) : k <= NOTE.length ? (
            <Nota i={k - 1} grande />
          ) : (
            <>
              <span className="mano" style={font}>
                {nome}
              </span>
              <p>{NOTE.map(([, c]) => c).join(", ")}</p>
            </>
          )}
        </div>
        <span className="barra-f">
          <i style={{ width: `${((k + 1) / scene) * 100}%` }} />
        </span>
      </div>
    );
  } else if (modo === "scorrimento") {
    schermo = (
      <>
        <p className="titolo-s" style={font}>
          {aspetto.titolo}
        </p>
        <div className="scorre-s">
          <div className="nastro-s">
            {[...NOTE, ...NOTE].map((_, i) => (
              <Nota key={i} i={i} />
            ))}
          </div>
        </div>
      </>
    );
  } else {
    // griglia: i bigliettini arrivano uno dopo l'altro, poi restano tutti insieme
    const visibili = fermo ? NOTE.length : Math.min(NOTE.length, (n % (NOTE.length + 3)) + 1);
    schermo = (
      <>
        <p className="titolo-s" style={font}>
          {aspetto.titolo}
        </p>
        <div className="fg">
          {NOTE.map((_, i) => (
            <Nota key={i} i={i} className={i < visibili ? "entra-s" : "nascosta-s"} />
          ))}
        </div>
      </>
    );
  }

  return (
    <div className="telefono telefono-ed" aria-hidden="true">
      <div className="schermo">{schermo}</div>
    </div>
  );
}
