// La pagina del partecipante ha un solo compito: niente intestazione del sito, niente menu, niente catalogo.
export default function LayoutPartecipante({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto w-full max-w-partecipante gutter py-6">{children}</main>;
}
