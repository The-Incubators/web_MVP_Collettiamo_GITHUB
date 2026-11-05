import type { HTMLAttributes, ReactNode } from "react";

/**
 * Il foglio di carta del biglietto (design.md §4, «Biglietto (oggetto)»): carta avorio con grana, raggio 4, l'unica
 * ombra degli oggetti appoggiati sulla scena. È la firma visiva del prodotto: si usa solo per gli oggetti-biglietto.
 * La scritta a mano dentro va con la classe `mano` (Caveat).
 */
export function Carta({ children, className = "", ...resto }: { children: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`carta ${className}`.trim()} {...resto}>
      {children}
    </div>
  );
}
