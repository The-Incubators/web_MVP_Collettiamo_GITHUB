"use client";

import { useEffect, useMemo, useState } from "react";

const QUANTI = 36;
const DURATA_MS = 3600;

/**
 * Una pioggia di emoji (quella del tema, più qualche festa) che cade e sparisce da sola.
 * Ogni nuovo valore di `scatto` la fa ripartire; 0 = niente. Con il movimento ridotto non compare.
 */
export function Coriandoli({ scatto, emoji }: { scatto: number; emoji: string }) {
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
    const scelta = [emoji, emoji, "🎉", "💖", "⭐", "✨"];
    return Array.from({ length: QUANTI }, (_, i) => ({
      e: scelta[i % scelta.length],
      x: Math.random() * 100,
      ritardo: Math.random() * 0.8,
      durata: 2 + Math.random() * 1.2,
      giro: (Math.random() < 0.5 ? -1 : 1) * (180 + Math.random() * 360),
      dim: 18 + Math.random() * 16,
    }));
  }, [attivo, emoji]);

  if (!attivo) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {pezzi.map((p, i) => (
        <span
          key={`${attivo}-${i}`}
          className="coriandolo absolute top-0"
          style={{ left: `${p.x}%`, fontSize: p.dim, ["--ritardo" as string]: `${p.ritardo}s`, ["--durata" as string]: `${p.durata}s`, ["--giro" as string]: `${p.giro}deg` }}
        >
          {p.e}
        </span>
      ))}
    </div>
  );
}
