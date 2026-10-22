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
      <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${valore}%` }} />
    </div>
  );
}
