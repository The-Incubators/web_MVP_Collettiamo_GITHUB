import { BottoneCuore } from "@/components/BottoneCuore";
import { likesDimostrativi, Stelle } from "@/components/Stelle";
import { Icona } from "@/components/ui";
import { formattaEuro } from "@/lib/dominio/importi";
import type { ProdottoGifty } from "@/lib/dati/prodotti-gifty";

/**
 * La scheda di un prodotto fatto da Gifty (lib/dati/prodotti-gifty.ts): al posto della foto i tre passi
 * (le tue foto → il tuo fumetto → il prodotto), poi nome, prezzo e «Provalo con le tue foto (gratis)», che porta
 * alla pagina esterna del prodotto. `compatta` è per la griglia a due colonne del catalogo: niente stelle, il cuore
 * accanto al prezzo e i passi uno sotto l'altro (in fila non ci stanno). Non c'è una scheda /prodotto/… per questi prodotti.
 */
export function SchedaProdottoGifty({ prodotto, compatta, conLikes }: { prodotto: ProdottoGifty; compatta?: boolean; conLikes?: boolean }) {
  const alto = 84;
  const prova = "flex min-h-12 w-full items-center justify-center gap-1.5 rounded-full border-2 border-accent-2 bg-line px-3 text-center font-semibold leading-tight text-accent-2";
  return (
    <article className={`flex h-full flex-col rounded-3xl bg-surface shadow-carta ${compatta ? "gap-2 p-2.5 sm:p-3" : "gap-3 p-4"}`}>
      {compatta ? null : (
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-h-10 flex-col justify-center gap-0.5">
            <Stelle n={prodotto.stelle} />
            {conLikes ? <span className="text-xs font-semibold text-ink">{likesDimostrativi(prodotto.slug)}</span> : null}
          </div>
          <BottoneCuore slug={prodotto.slug} nome={prodotto.nome} />
        </div>
      )}

      {compatta ? (
        <ol aria-label="Come nasce" className="flex flex-col gap-1.5 rounded-2xl bg-surface-2 p-2">
          {prodotto.passi.map((passo, i) => (
            <li key={passo.titolo} className="flex h-14 items-center gap-1.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-on-accent">{i + 1}</span>
              <span className="min-w-0 flex-1 text-[11px] font-bold leading-tight text-ink">{passo.titolo}</span>
              <span className="flex h-full shrink-0 items-center">
                {passo.immagini.map((src, k) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={src} src={src} alt="" className={`h-full w-auto rounded-md object-cover shadow-carta ${k > 0 ? "-ml-2" : ""}`} />
                ))}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <ol aria-label="Come nasce" className="flex items-start justify-between">
          {prodotto.passi.map((passo, i) => (
            <li key={passo.titolo} className="contents">
              {i > 0 ? (
                <span aria-hidden="true" className="mt-9 flex shrink-0 self-center text-ink-soft">
                  <Icona nome="arrow_forward" dimensione={22} />
                </span>
              ) : null}
              <span className="flex min-w-0 flex-1 flex-col items-center gap-1 text-center">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-sm font-bold text-on-accent">{i + 1}</span>
                <span className="text-[11px] font-bold leading-tight text-ink">{passo.titolo}</span>
                {/* le foto del primo passo un po' sovrapposte, come un mucchietto */}
                <span className="flex items-end justify-center" style={{ height: alto }}>
                  {passo.immagini.map((src, k) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={src}
                      src={src}
                      alt=""
                      className={`w-auto max-w-none rounded-md object-cover shadow-carta ${k > 0 ? "-ml-3 translate-y-1" : ""}`}
                      style={{ height: passo.immagini.length > 1 ? alto * 0.8 : alto }}
                    />
                  ))}
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}

      <div className={`flex flex-1 flex-col gap-0.5 ${compatta ? "px-1" : ""}`}>
        <h3 className={`font-display font-semibold leading-snug text-accent-2 ${compatta ? "line-clamp-2 text-base sm:text-lg" : "text-xl"}`}>{prodotto.nome}</h3>
        <div className="mt-auto flex items-center justify-between gap-2">
          <p className={`cifre font-extrabold text-accent ${compatta ? "pt-1 text-2xl" : "text-xl"}`}>{formattaEuro(prodotto.prezzoCent)}</p>
          {compatta ? <BottoneCuore slug={prodotto.slug} nome={prodotto.nome} /> : null}
        </div>
      </div>

      {prodotto.urlProva ? (
        <a href={prodotto.urlProva} target="_blank" rel="noopener" className={`${prova} ${compatta ? "text-sm" : "text-base"}`}>
          Provalo con le tue foto (gratis)
          <span className="sr-only"> (si apre in una nuova scheda)</span>
        </a>
      ) : (
        // finché non c'è l'indirizzo il pulsante si vede ma non porta da nessuna parte
        <span role="link" aria-disabled="true" title="Presto disponibile" className={`${prova} cursor-default opacity-80 ${compatta ? "text-sm" : "text-base"}`}>
          Provalo con le tue foto (gratis)
        </span>
      )}
    </article>
  );
}
