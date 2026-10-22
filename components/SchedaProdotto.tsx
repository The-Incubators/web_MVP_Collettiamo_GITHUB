import Link from "next/link";
import { BottoneCuore } from "@/components/BottoneCuore";
import { BottoneListaRegali } from "@/components/BottoneListaRegali";
import { BottoneLink, ImmagineProdotto, IconaOrologio } from "@/components/ui";
import { daProdotto } from "@/lib/dominio/regali";
import { formattaEuro } from "@/lib/dominio/importi";
import type { Prodotto } from "@/lib/tipi";

export function testoConsegna(giorni: number): string {
  return giorni === 1 ? "Consegna stimata: 1 giorno" : `Consegna stimata: ${giorni} giorni`;
}

/**
 * La scheda di un prodotto nelle griglie.
 *
 * `compatta` serve al catalogo, che da telefono ne mette due per riga: testi e spazi si stringono e la
 * consegna passa sotto al prezzo, che affiancati in 170 px non ci stanno. Le altre griglie (Preferiti,
 * risultati di «Trova il regalo») restano com'erano, perché su schermo stretto hanno una scheda per riga.
 * Nessuna funzione sparisce: cuore, «Regalalo in gruppo» e lista dei regali ci sono in entrambe le forme.
 */
export function SchedaProdotto({ prodotto, compatta = false }: { prodotto: Prodotto; compatta?: boolean }) {
  return (
    <article className="contenitore flex flex-col">
      <div className="relative">
        <Link href={`/prodotto/${prodotto.slug}`} className="block" aria-label={`${prodotto.nome}, scheda del prodotto`} tabIndex={-1}>
          <ImmagineProdotto prodotto={prodotto} className="rounded-t-contenitore" />
        </Link>
        <BottoneCuore slug={prodotto.slug} nome={prodotto.nome} className="absolute right-2 top-2" />
      </div>
      <div className={`flex flex-1 flex-col ${compatta ? "gap-2 p-3 sm:gap-3 sm:p-4" : "gap-3 p-4"}`}>
        <div className="flex flex-col gap-1">
          {prodotto.marca !== "Generico" ? (
            <p className={`text-ink-soft ${compatta ? "text-xs sm:text-sm" : "text-sm"}`}>{prodotto.marca}</p>
          ) : null}
          <h3 className={`leading-snug ${compatta ? "line-clamp-3 text-base sm:text-lg" : "text-lg"}`}>
            <Link href={`/prodotto/${prodotto.slug}`} className="hover:underline">
              {prodotto.nome}
            </Link>
          </h3>
        </div>
        <div className={`mt-auto flex flex-col ${compatta ? "gap-2 sm:gap-3" : "gap-3"}`}>
          {compatta ? (
            <div className="flex flex-col gap-0.5">
              <span className="cifre text-xl font-bold sm:text-2xl">{formattaEuro(prodotto.prezzoCent)}</span>
              <span className="flex items-center gap-1 text-xs text-ink-soft">
                <IconaOrologio width={14} height={14} />
                {testoConsegna(prodotto.consegnaGiorni)}
              </span>
            </div>
          ) : (
            <div className="flex items-baseline justify-between gap-2">
              <span className="cifre text-2xl font-bold">{formattaEuro(prodotto.prezzoCent)}</span>
              <span className="flex items-center gap-1 text-sm text-ink-soft">
                <IconaOrologio width={16} height={16} />
                {testoConsegna(prodotto.consegnaGiorni)}
              </span>
            </div>
          )}
          <BottoneLink
            href={`/crea?prodotto=${prodotto.slug}`}
            pieno
            dimensione={compatta ? "piccolo" : "normale"}
            className={compatta ? "text-center leading-tight sm:text-base" : ""}
          >
            Regalalo in gruppo
          </BottoneLink>
          <BottoneListaRegali prodotto={daProdotto(prodotto)} variante="testo" />
        </div>
      </div>
    </article>
  );
}
