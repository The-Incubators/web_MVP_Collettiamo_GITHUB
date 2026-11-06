"use client";

import { useEffect, useMemo, useState } from "react";

const QUANTI = 36;
const DURATA_MS = 3600;

/**
 * Una pioggia di emoji (quella del tema, più qualche festa) che cade e sparisce da sola.
 * Ogni nuovo valore di `scatto` la fa ripartire; 0 = niente. Con il movimento ridotto non compare.
 * `serie`: le emoji dell'effetto scelto (ritocchi finali), al posto di quelle di festa; vuota = niente.
 * `sale`: i pezzi salgono dal basso (i palloncini) invece di cadere.
 */
export function Coriandoli({ scatto, emoji, serie, sale = false, contenuto = false }: { scatto: number; emoji: string; serie?: readonly string[]; sale?: boolean; contenuto?: boolean }) {
  const [attivo, setAttivo] = useState(0);

  useEffect(() => {
    if (!scatto) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    setAttivo(scatto);
    const t = setTimeout(() => setAttivo(0), DURATA_MS);
    return () => clearTimeout(t);
  }, [scatto]);

  const pezzi = useMemo(() => {
    if (!attivo) return [];
    const scelta = serie ?? [emoji, emoji, "🎉", "💖", "⭐", "✨"];
    if (!scelta.length) return [];
    return Array.from({ length: QUANTI }, (_, i) => ({
      e: scelta[i % scelta.length],
      x: Math.random() * 100,
      ritardo: Math.random() * 0.8,
      durata: 2 + Math.random() * 1.2,
      giro: (Math.random() < 0.5 ? -1 : 1) * (180 + Math.random() * 360),
      dim: 18 + Math.random() * 16,
    }));
  }, [attivo, emoji, serie]);

  if (!attivo || !pezzi.length) return null;
  return (
    <div aria-hidden="true" className={`pointer-events-none ${contenuto ? "absolute" : "fixed"} inset-0 z-40 overflow-hidden`}>
      {pezzi.map((p, i) => (
        <span
          key={`${attivo}-${i}`}
          className={sale ? "coriandolo sale absolute bottom-0" : "coriandolo absolute top-0"}
          style={{ left: `${p.x}%`, fontSize: p.dim, ["--ritardo" as string]: `${p.ritardo}s`, ["--durata" as string]: `${p.durata}s`, ["--giro" as string]: `${p.giro}deg` }}
        >
          {p.e}
        </span>
      ))}
    </div>
  );
}
