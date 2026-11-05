/**
 * Le procedure a tutta pagina (Gifty UX v2, design.md §10.1, revisione di Cri del 5 novembre, riga 13): niente
 * intestazione del sito, piè di pagina né barra in basso. Ogni pagina mette la sua barra (indietro, passo, chiudi).
 */
export default function LayoutProcedura({ children }: { children: React.ReactNode }) {
  return <div className="procedura">{children}</div>;
}
