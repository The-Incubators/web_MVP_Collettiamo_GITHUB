import type { ReactNode } from "react";

/**
 * La copertina dentro una busta aperta, color carta: il retro e la patta dietro, la tasca davanti;
 * il biglietto sporge dall'alto. Solo CSS/SVG, nessuna illustrazione esterna.
 */
export function Busta({ larghezza, children }: { larghezza: number; children: ReactNode }) {
  const lb = Math.round(larghezza * 1.18);
  const altezzaTasca = Math.round(lb * 0.42);
  return (
    <div className="relative mx-auto" style={{ width: lb, paddingTop: 8 }} aria-hidden="false">
      {/* retro della busta, con la patta aperta verso l'alto */}
      <svg viewBox="0 0 100 70" preserveAspectRatio="none" aria-hidden="true" className="absolute left-0 right-0" style={{ bottom: 0, width: lb, height: Math.round(lb * 0.7) }}>
        <path d="M0 22 L50 0 L100 22 L100 70 L0 70 Z" fill="#E9DCC3" />
        <path d="M0 22 L50 0 L100 22" fill="none" stroke="#D6C5A5" strokeWidth="0.6" />
      </svg>
      <div className="relative flex justify-center" style={{ paddingBottom: Math.round(altezzaTasca * 0.55) }}>
        {children}
      </div>
      {/* tasca davanti */}
      <svg viewBox="0 0 100 42" preserveAspectRatio="none" aria-hidden="true" className="absolute bottom-0 left-0 drop-shadow-md" style={{ width: lb, height: altezzaTasca }}>
        <path d="M0 0 L50 24 L100 0 L100 42 L0 42 Z" fill="#F3E9D6" />
        <path d="M0 0 L50 24 L100 0" fill="none" stroke="#DCCBAB" strokeWidth="0.5" />
      </svg>
    </div>
  );
}
