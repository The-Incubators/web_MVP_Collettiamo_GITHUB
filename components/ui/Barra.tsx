/** Barra di avanzamento. Il valore è sempre in percentuale 0-100. */
export function Barra({
  percento,
  etichetta,
  alta = false,
}: {
  percento: number;
  etichetta: string;
  alta?: boolean;
}) {
  const valore = Math.max(0, Math.min(100, Math.round(percento)));
  return (
    <div
      role="progressbar"
      aria-label={etichetta}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={valore}
      className={`w-full overflow-hidden rounded-full bg-accent-field ${alta ? "h-4" : "h-3"}`}
    >
      {/* sfumature di verde mentre si raccoglie (l'arancio è dell'azione principale); all'obiettivo diventa oro, il colore dei traguardi */}
      <div
        className={`h-full rounded-full bg-gradient-to-r transition-[width] duration-500 ${valore >= 100 ? "from-accent to-gold-vivo" : "from-verde-medio to-accent"}`}
        style={{ width: `${valore}%` }}
      />
    </div>
  );
}
