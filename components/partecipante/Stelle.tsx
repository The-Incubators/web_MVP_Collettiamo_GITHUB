"use client";

import { useRef } from "react";

/** Voto da 1 a 5 stelle: un gruppo di radio con le frecce della tastiera. */
export function Stelle({ valore, onVota, etichetta, disabilitato = false }: { valore: number; onVota: (n: number) => void; etichetta: string; disabilitato?: boolean }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function tasto(e: React.KeyboardEvent, n: number) {
    let prossimo = 0;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") prossimo = Math.min(5, n + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") prossimo = Math.max(1, n - 1);
    else if (e.key === "Home") prossimo = 1;
    else if (e.key === "End") prossimo = 5;
    if (!prossimo) return;
    e.preventDefault();
    refs.current[prossimo - 1]?.focus();
    onVota(prossimo);
  }

  const tabbable = valore || 1;
  return (
    <div role="radiogroup" aria-label={`Il tuo voto per ${etichetta}`} className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          ref={(el) => {
            refs.current[n - 1] = el;
          }}
          type="button"
          role="radio"
          aria-checked={valore === n}
          aria-label={`${n} ${n === 1 ? "stella" : "stelle"}`}
          tabIndex={n === tabbable ? 0 : -1}
          disabled={disabilitato}
          onClick={() => onVota(n)}
          onKeyDown={(e) => tasto(e, n)}
          className="flex h-11 w-11 items-center justify-center rounded-controllo disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" width={32} height={32} aria-hidden="true" className={n <= valore ? "text-cta" : "text-line-forte"}>
            <path
              d="M12 2.8l2.8 5.9 6.4.9-4.6 4.5 1.1 6.4L12 17.5l-5.7 3 1.1-6.4L2.8 9.6l6.4-.9z"
              fill={n <= valore ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={n <= valore ? 1.5 : 1.8}
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}
