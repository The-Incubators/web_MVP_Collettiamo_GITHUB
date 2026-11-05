import type { Metadata } from "next";
import { Suspense } from "react";
import { Crea } from "@/components/wizard/Wizard";

export const metadata: Metadata = { title: "Organizza un regalo di gruppo", robots: { index: false } };

/**
 * Il wizard del regalo di gruppo (Gifty UX v2, prototipi/crea.html; spec prodotto §7.2). Senza piè di pagina né barra
 * in basso (T-05; lib/navigazione.ts). L'accesso si chiede solo al passo 6: la pagina non è più protetta all'ingresso.
 */
export default function PaginaCrea() {
  return (
    <Suspense
      fallback={
        <div className="pagina wizard">
          <p role="status" className="muted attesa">
            Un momento…
          </p>
        </div>
      }
    >
      <Crea />
    </Suspense>
  );
}
