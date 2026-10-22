// L'area riservata: nessuna intestazione del sito e nessun link qui dentro o verso qui.
export default function LayoutBackoffice({ children }: { children: React.ReactNode }) {
  return <main className="gutter min-h-dvh pb-24 pt-6">{children}</main>;
}
