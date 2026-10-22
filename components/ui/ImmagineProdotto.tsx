import { hashSeme } from "@/lib/hash";
import type { Immagine } from "@/lib/tipi";
import { PERCORSI_CATEGORIA } from "./icone";

/**
 * L'immagine di un regalo. Con una foto (`immagine.foto`) la mostra intera su fondo bianco, qualunque sia la
 * proporzione; senza, disegna un'illustrazione deterministica: gradiente a due tinte derivate dal seme e icona
 * a tratto. Stesso regalo, stessa immagine, sempre.
 */
export function ImmagineProdotto({
  prodotto,
  className = "",
  alt,
}: {
  prodotto: { nome: string; immagine: Immagine };
  className?: string;
  alt?: string;
}) {
  const { seme, icona, foto } = prodotto.immagine;

  if (foto) {
    return (
      <div className={`relative block w-full overflow-hidden bg-white ${className.includes("aspect-") ? "" : "aspect-[4/3]"} ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={foto} alt={alt ?? prodotto.nome} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-contain p-2" />
      </div>
    );
  }

  const h = hashSeme(seme);
  // Tinte nell'intorno verde-azzurro della palette, con saturazione e luminosità fisse.
  const tinta1 = 140 + (h % 70);
  const tinta2 = 140 + ((h >>> 8) % 90);
  const id = `img-${h.toString(36)}`;
  return (
    <svg
      viewBox="0 0 400 300"
      className={`block h-auto w-full ${className}`}
      role="img"
      aria-label={alt ?? `Immagine illustrativa: ${prodotto.nome}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={`hsl(${tinta1} 38% 84%)`} />
          <stop offset="1" stopColor={`hsl(${tinta2} 42% 68%)`} />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#${id})`} />
      <circle cx={60 + (h % 80)} cy={50 + ((h >>> 4) % 40)} r="70" fill="#fff" opacity="0.14" />
      <circle cx={320 - ((h >>> 12) % 60)} cy={250 - ((h >>> 16) % 40)} r="90" fill="#fff" opacity="0.1" />
      <g
        transform="translate(120 70) scale(3.3)"
        fill="none"
        stroke={`hsl(${tinta1} 45% 18%)`}
        color={`hsl(${tinta1} 45% 18%)`}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      >
        {PERCORSI_CATEGORIA[icona]}
      </g>
    </svg>
  );
}
