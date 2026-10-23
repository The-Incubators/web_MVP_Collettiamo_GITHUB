/**
 * Il marchio Gifty: il logo completo, scatola regalo e scritta. Il sito non ha un tema scuro, quindi basta
 * una versione. Il file si rigenera con scripts/genera_marchio.py dall'originale in marchio/; è già piccolo
 * (24 KB) e della misura giusta, quindi l'ottimizzatore di Next non servirebbe.
 */
export function Logo({ className = "", priorita = false }: { className?: string; priorita?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo/gifty.png"
      alt="Gifty"
      width={350}
      height={120}
      decoding="async"
      loading={priorita ? "eager" : "lazy"}
      fetchPriority={priorita ? "high" : "auto"}
      className={`h-8 w-auto ${className}`}
    />
  );
}
