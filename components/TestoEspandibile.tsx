"use client";

import { useId, useState, type ReactNode } from "react";
import { Icona } from "./ui/Icona";

/** Un testo lungo mostrato in tre righe, con «Leggi tutto» per il resto. `extra` compare solo aperto. */
export function TestoEspandibile({ testo, extra }: { testo: string; extra?: ReactNode }) {
  const [aperto, setAperto] = useState(false);
  const id = useId();
  // sotto le tre righe circa non serve nascondere niente
  const corto = testo.length <= 160 && !extra;
  return (
    <div className="flex flex-col gap-1">
      <div id={id} className="flex flex-col gap-3">
        <p className={aperto || corto ? "" : "line-clamp-3"}>{testo}</p>
        {aperto ? extra : null}
      </div>
      {corto ? null : (
        <button
          type="button"
          aria-expanded={aperto}
          aria-controls={id}
          onClick={() => setAperto((a) => !a)}
          className="inline-flex min-h-tocco items-center gap-0.5 self-start text-sm font-bold text-accent"
        >
          {aperto ? "Riduci" : "Leggi tutto"}
          <Icona nome="expand_more" dimensione={18} className={aperto ? "rotate-180" : ""} />
        </button>
      )}
    </div>
  );
}
