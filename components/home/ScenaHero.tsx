"use client";

import { useEffect, useRef, useState } from "react";
import { Iniziali, type TintaIniziali } from "@/components/ui";
import { matriceOmografia, type Punto } from "@/lib/omografia";

/**
 * La foto della hero con il testo vero del gruppo posato sul biglietto (design.md §4, «Hero»): un blocco HTML trasformato
 * con l'omografia calcolata dai quattro vertici della faccia del biglietto, così resta nitido e si può tradurre.
 * Il testo sulla foto è nascosto ai lettori di schermo; l'`alt` della foto lo riporta. Finché la posa non è calcolata il
 * blocco resta invisibile, per non vederlo un istante nell'angolo.
 */

// vertici della faccia anteriore della carta sinistra, in % della foto (prototipi/home.html)
const QUAD_DESKTOP: Punto[] = [
  [15.1, 27.3],
  [51.0, 22.2],
  [55.0, 77.9],
  [18.0, 86.0],
];
const QUAD_TELEFONO: Punto[] = [
  [12.9, 32.6],
  [52.8, 29.1],
  [57.1, 70.8],
  [17.0, 76.4],
];

const FIRME: [string, TintaIniziali][] = [
  ["AL", 1],
  ["BE", 2],
  ["GI", 3],
  ["FE", 4],
  ["DA", 5],
  ["LU", 6],
  ["MA", 7],
  ["SO", 8],
];

export function ScenaHero() {
  const foto = useRef<HTMLImageElement>(null);
  const carta = useRef<HTMLDivElement>(null);
  const [posata, setPosata] = useState(false);

  useEffect(() => {
    const img = foto.current;
    const el = carta.current;
    if (!img || !el) return;
    const largo = window.matchMedia("(min-width: 768px)");
    const posa = () => {
      const box = img.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const quad = largo.matches ? QUAD_DESKTOP : QUAD_TELEFONO;
      const dst = quad.map(([x, y]) => [(x / 100) * box.width, (y / 100) * box.height] as const);
      el.style.transformOrigin = "0 0";
      el.style.transform = matriceOmografia(el.offsetWidth, el.offsetHeight, dst);
      setPosata(true);
    };
    posa();
    img.addEventListener("load", posa);
    window.addEventListener("resize", posa);
    largo.addEventListener("change", posa);
    document.fonts?.ready.then(posa).catch(() => {});
    return () => {
      img.removeEventListener("load", posa);
      window.removeEventListener("resize", posa);
      largo.removeEventListener("change", posa);
    };
  }, []);

  return (
    <div className="hero-foto">
      <picture>
        <source media="(min-width: 768px)" srcSet="/home/scena-desktop.jpg" width={1774} height={887} />
        <img
          ref={foto}
          src="/home/scena-mobile.jpg"
          width={1374}
          height={1145}
          fetchPriority="high"
          decoding="async"
          alt="Due biglietti su un tavolo uniti da un nastro arancio: su uno è scritto «Il regalo di gruppo per Mauro, 8 persone hanno aderito, 10 € a testa», esempio"
        />
      </picture>
      <div ref={carta} className="carta-foto" aria-hidden="true" style={posata ? undefined : { visibility: "hidden" }}>
        <p className="mano">Il regalo di gruppo per Mauro</p>
        <p className="righe">
          8 persone hanno aderito
          <br />
          10 € a testa
        </p>
        <div className="fila-iniziali">
          {FIRME.map(([testo, tinta]) => (
            <Iniziali key={testo} testo={testo} tinta={tinta} />
          ))}
        </div>
        <span className="esempio-etichetta">Esempio</span>
      </div>
    </div>
  );
}
