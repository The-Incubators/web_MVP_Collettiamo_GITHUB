import { NavBackoffice } from "@/components/backoffice/NavBackoffice";

// L'area riservata: nessuna intestazione del sito e nessun link qui dentro o verso qui. In alto, le sue pagine.
export default function LayoutBackoffice({ children }: { children: React.ReactNode }) {
  return (
    <main className="gutter min-h-dvh pb-24 pt-6">
      <NavBackoffice />
      {children}
    </main>
  );
}
