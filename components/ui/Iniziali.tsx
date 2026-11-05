import { hashSeme } from "@/lib/hash";

/** Le otto tinte pastello delle iniziali (`--c1`…`--c8`): il colore distingue soltanto, l'identità la dà il testo. */
export type TintaIniziali = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** La tinta di una persona, sempre la stessa per lo stesso nome. */
export function tintaDi(nome: string): TintaIniziali {
  return ((hashSeme(nome.trim().toLowerCase()) % 8) + 1) as TintaIniziali;
}

/**
 * Le iniziali di una persona in un tondo pastello (design.md §4). `testo` è quello che si legge nel tondo (di solito le
 * prime due lettere del nome); senza testo è un posto vuoto, tratteggiato. `grande` è il tondo da 44 px.
 */
export function Iniziali({
  testo,
  tinta,
  grande = false,
  className = "",
}: {
  testo?: string;
  tinta?: TintaIniziali;
  grande?: boolean;
  className?: string;
}) {
  const vuoto = !testo;
  const colore = vuoto ? "vuoto" : `c${tinta ?? tintaDi(testo)}`;
  return (
    <span aria-hidden={vuoto || undefined} className={`iniziali ${colore} ${grande ? "g" : ""} ${className}`.trim()}>
      {testo}
    </span>
  );
}
