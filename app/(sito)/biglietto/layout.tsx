import type { Metadata } from "next";

// Le pagine del biglietto stanno dentro il sito, con la sua intestazione e il suo menu (Gifty-architettura-e-flussi.md §1.4).
// Non indicizzate tranne la pagina del servizio, che lo dichiara da sé.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function LayoutBiglietto({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
