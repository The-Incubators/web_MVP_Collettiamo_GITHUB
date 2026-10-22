import type { Metadata } from "next";

// Area di chi organizza il biglietto: ogni pagina ha la sua intestazione del wizard (spec 3.1), nessun menu del sito.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function LayoutBiglietto({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-dvh flex-col bg-field">{children}</div>;
}
