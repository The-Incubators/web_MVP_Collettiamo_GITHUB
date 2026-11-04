// Le stelle e i «likes» sulle schede dei regali (home nuova, prodotti Gifty).

/** Il voto di Gifty, da 1 a 5: per i prodotti Amazon le stelle del backoffice del catalogo (senza voto 3, come lì). */
export function Stelle({ n }: { n: number }) {
  return (
    <span className="flex items-center gap-1" title="Il voto di Gifty">
      <span className="flex text-[#F5B301]" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((k) => (
          <svg key={k} viewBox="0 0 24 24" width={16} height={16} fill={k <= n ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round">
            <path d="M12 3.2l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 17l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z" />
          </svg>
        ))}
      </span>
      <span className="text-[11px] font-semibold text-ink-soft">
        <span className="sr-only">{n} stelle su 5, </span>voto Gifty
      </span>
    </span>
  );
}

/**
 * «Likes» dimostrativi: un numero inventato ma fisso per ogni prodotto (non cambia a ogni visita).
 * Si vedono solo dove c'è LIKES_DIMOSTRATIVI=1 (in locale, sul sito di test); in produzione no, perché
 * sarebbero un apprezzamento falso per chi visita davvero il sito. Vanno sostituiti con un conteggio vero.
 */
export function likesDimostrativi(slug: string): string {
  let h = 0;
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const n = 300 + (h % 2200);
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(".", ",")}k likes` : `${n} likes`;
}

/** I «likes» dimostrativi si vedono solo dove c'è LIKES_DIMOSTRATIVI=1 (vedi sopra). Solo sul server. */
export const conLikesDimostrativi = () => process.env.LIKES_DIMOSTRATIVI === "1";
