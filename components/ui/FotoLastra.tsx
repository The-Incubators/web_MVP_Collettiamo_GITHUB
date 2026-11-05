import type { Immagine } from "@/lib/tipi";
import { ImmagineProdotto } from "./ImmagineProdotto";

/**
 * La foto di un regalo dentro una `.lastra` (design.md §4, tessera prodotto): la foto in `multiply` sulla parete, oppure
 * l'illustrazione quando la foto non c'è. Decorativa: il nome del regalo è sempre scritto accanto.
 */
export function FotoLastra({ prodotto, className = "" }: { prodotto: { nome: string; immagine: Immagine }; className?: string }) {
  return (
    <span className={`lastra ${className}`.trim()}>
      {prodotto.immagine.foto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={prodotto.immagine.foto} alt="" loading="lazy" decoding="async" />
      ) : (
        <ImmagineProdotto prodotto={prodotto} alt="" />
      )}
    </span>
  );
}
