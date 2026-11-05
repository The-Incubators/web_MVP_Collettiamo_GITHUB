"use client";

import { useId, useState } from "react";

/**
 * La descrizione di un prodotto: oltre tre righe circa si chiude, con «Leggi tutto» (I-11) come pillola tinta, mai un
 * link di testo.
 */
export function TestoEspandibile({ testo }: { testo: string }) {
  const [aperto, setAperto] = useState(false);
  const id = useId();
  if (!testo) return null;
  // sotto le tre righe circa non serve nascondere niente
  if (testo.length <= 160) return <p className="descrizione">{testo}</p>;
  return (
    <>
      <p id={id} className={`descrizione ${aperto ? "" : "chiusa"}`}>
        {testo}
      </p>
      <button type="button" className="btn btn-quieto leggi" aria-expanded={aperto} aria-controls={id} onClick={() => setAperto((a) => !a)}>
        {aperto ? "Riduci" : "Leggi tutto"}
      </button>
    </>
  );
}
