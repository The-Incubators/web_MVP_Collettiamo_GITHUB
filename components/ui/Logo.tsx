/**
 * Il marchio Regaloop. UX_V4 non ha un tema scuro, quindi basta la versione chiara: `/logo/regaloop-scuro.png`
 * non si usa più (resta nella cartella, nel caso il tema scuro torni). Il file è già piccolo (26 KB) e di misura
 * giusta, quindi l'ottimizzatore di Next non servirebbe.
 */
export function Logo({ className = "", priorita = false }: { className?: string; priorita?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo/regaloop.png"
      alt="Regaloop"
      width={400}
      height={105}
      decoding="async"
      loading={priorita ? "eager" : "lazy"}
      fetchPriority={priorita ? "high" : "auto"}
      className={`h-8 w-auto ${className}`}
    />
  );
}
