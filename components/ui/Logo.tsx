/**
 * Il marchio Regaloop. Sono due file, non uno: il verde del logo (#033922) sul fondo del tema scuro
 * sparirebbe, quindi nella versione scura diventa chiaro mentre l'arancio resta.
 *
 * Si usa <picture> e non due <Image>: con due immagini il browser scarica comunque anche quella
 * nascosta da `display: none`, mentre <picture> prende solo quella che serve. Il file è già piccolo
 * (26 KB) e di misura giusta per l'uso che se ne fa, quindi l'ottimizzatore di Next non servirebbe.
 *
 * Segue `prefers-color-scheme`, come i colori del sito. L'override manuale `[data-theme]` previsto in
 * globals.css qui non arriva: oggi non lo imposta nessuno, e quando servirà andrà aggiunto anche qui.
 */
export function Logo({ className = "", priorita = false }: { className?: string; priorita?: boolean }) {
  return (
    <picture>
      <source srcSet="/logo/regaloop-scuro.png" media="(prefers-color-scheme: dark)" />
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
    </picture>
  );
}
