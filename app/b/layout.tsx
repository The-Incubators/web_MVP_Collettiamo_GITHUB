// Le pagine di chi firma: nessun menu del sito, ogni pagina ha la sua intestazione con la barra a 2 segmenti.
export default function LayoutFirmatario({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-dvh flex-col bg-field">{children}</div>;
}
