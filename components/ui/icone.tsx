import type { ReactNode, SVGProps } from "react";
import type { Categoria } from "@/lib/tipi";

/** Le otto icone di categoria, disegnate a tratto su una griglia 48 × 48. */
export const PERCORSI_CATEGORIA: Record<Categoria, ReactNode> = {
  audio: (
    <>
      <path d="M10 28v-4a14 14 0 0 1 28 0v4" />
      <rect x="8" y="27" width="7" height="12" rx="3" />
      <rect x="33" y="27" width="7" height="12" rx="3" />
    </>
  ),
  casa: (
    <>
      <path d="M7 23 24 9l17 14" />
      <path d="M13 20v19h22V20" />
      <path d="M20 39V28h8v11" />
    </>
  ),
  cucina: (
    <>
      <path d="M10 22h28v10a8 8 0 0 1-8 8H18a8 8 0 0 1-8-8z" />
      <path d="M5 22h5M38 22h5" />
      <path d="M19 16c0-3 3-3 3-7M27 16c0-3 3-3 3-7" />
    </>
  ),
  benessere: (
    <>
      <path d="M24 39C14 37 8 29 8 19c10 0 16 6 16 14" />
      <path d="M24 39c10-2 16-10 16-20-10 0-16 6-16 14" />
      <path d="M24 39V13" />
    </>
  ),
  esperienze: (
    <>
      <path d="M24 6c-8 0-13 6-13 13 0 7 8 12 13 14 5-2 13-7 13-14 0-7-5-13-13-13z" />
      <path d="M24 6c-4 5-5 11-1 27M24 6c4 5 5 11 1 27" />
      <path d="M20 33l1.5 6h5l1.5-6" />
    </>
  ),
  viaggio: (
    <>
      <rect x="8" y="15" width="32" height="24" rx="4" />
      <path d="M18 15v-4h12v4" />
      <path d="M8 26h32" />
      <path d="M20 26v4h8v-4" />
    </>
  ),
  gioco: (
    <>
      <rect x="9" y="9" width="30" height="30" rx="7" />
      <circle cx="17" cy="17" r="1.8" fill="currentColor" />
      <circle cx="31" cy="17" r="1.8" fill="currentColor" />
      <circle cx="24" cy="24" r="1.8" fill="currentColor" />
      <circle cx="17" cy="31" r="1.8" fill="currentColor" />
      <circle cx="31" cy="31" r="1.8" fill="currentColor" />
    </>
  ),
  ufficio: (
    <>
      <path d="M9 39l3-11L33 7l8 8L20 36z" />
      <path d="M28 12l8 8" />
      <path d="M9 39l11-3" />
    </>
  ),
};

export function IconaCategoria({ categoria, ...props }: { categoria: Categoria } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {PERCORSI_CATEGORIA[categoria]}
    </svg>
  );
}

type PropsIcona = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: PropsIcona & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconaSpunta = (p: PropsIcona) => (
  <Base {...p}>
    <path d="M5 12.5 10 17.5 19 7" />
  </Base>
);
export const IconaCopia = (p: PropsIcona) => (
  <Base {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2.5" />
    <path d="M5 15V6.5A1.5 1.5 0 0 1 6.5 5H15" />
  </Base>
);
export const IconaFreccia = (p: PropsIcona) => (
  <Base {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Base>
);
export const IconaIndietro = (p: PropsIcona) => (
  <Base {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Base>
);
export const IconaEsterno = (p: PropsIcona) => (
  <Base {...p}>
    <path d="M14 5h5v5M19 5l-8 8M18 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4" />
  </Base>
);
export const IconaMessaggio = (p: PropsIcona) => (
  <Base {...p}>
    <path d="M5 6.5A1.5 1.5 0 0 1 6.5 5h11A1.5 1.5 0 0 1 19 6.5v8a1.5 1.5 0 0 1-1.5 1.5H10l-4 3v-3H6.5A1.5 1.5 0 0 1 5 14.5z" />
  </Base>
);
export const IconaOrologio = (p: PropsIcona) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4.5l3 1.5" />
  </Base>
);
export const IconaPersone = (p: PropsIcona) => (
  <Base {...p}>
    <circle cx="9" cy="9" r="3" />
    <path d="M3.5 19c.5-3 2.7-4.5 5.5-4.5s5 1.5 5.5 4.5" />
    <path d="M15.5 6.5a3 3 0 0 1 0 5.8M17 14.8c2 .5 3.2 1.9 3.5 4.2" />
  </Base>
);
export const IconaPiu = (p: PropsIcona) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);
export const IconaAvviso = (p: PropsIcona) => (
  <Base {...p}>
    <path d="M12 4 3 19.5h18z" />
    <path d="M12 10v4.5M12 17.3v.2" />
  </Base>
);
export const IconaInfo = (p: PropsIcona) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5M12 7.8v.2" />
  </Base>
);

/* Il vecchio marchio disegnato (biglietto con tre punti) è stato sostituito dal logo Regaloop:
   vedi components/ui/Logo.tsx. */
