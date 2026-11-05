import Link from "next/link";
import { BottoneCuore } from "@/components/BottoneCuore";
import { likesDimostrativi, Stelle } from "@/components/Stelle";
import { Icona, ImmagineProdotto } from "@/components/ui";
import { REL_LINK_PRODOTTO, urlPerAcquisto } from "@/lib/dominio/amazon";
import { formattaEuro } from "@/lib/dominio/importi";
import type { Prodotto } from "@/lib/tipi";

/** Quanti prodotti mostra la home all'inizio e quanti ne aggiunge ogni «Carica altri prodotti». */
export const PRIMI_REGALI = 2;
export const ALTRI_REGALI_PER_VOLTA = 3;

/** Il pulsante grigio della home nuova (lo stesso dei «Guarda un esempio» sotto i tre pulsanti). */
export const CLASSI_SECONDARIO =
  "flex min-h-12 w-full items-center justify-center gap-1.5 rounded-controllo bg-line px-4 text-sm font-bold text-accent transition-colors hover:bg-line-forte";

/**
 * Un prodotto Amazon tra «I Regali più amati»: le stelle del backoffice, il cuore dei preferiti, la foto e
 * «Guarda su Amazon». Sta qui da sola perché la usano sia la home (server) sia «Carica altri prodotti» (browser).
 */
export function SchedaRegaloAmato({ prodotto: p, stelle, conLikes }: { prodotto: Prodotto; stelle: number; conLikes: boolean }) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-h-10 flex-col justify-center gap-0.5">
          <Stelle n={stelle} />
          {conLikes ? <span className="text-xs font-semibold text-ink">{likesDimostrativi(p.slug)}</span> : null}
        </div>
        <BottoneCuore slug={p.slug} nome={p.nome} />
      </div>
      <Link href={`/prodotto/${p.slug}`} className="block overflow-hidden rounded-2xl" tabIndex={-1} aria-hidden="true">
        <ImmagineProdotto prodotto={p} className="h-44" />
      </Link>
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="min-w-0 truncate text-xl font-semibold text-accent-2">
            <Link href={`/prodotto/${p.slug}`}>{p.nome}</Link>
          </h3>
          <span className="cifre shrink-0 text-xl font-extrabold text-accent">{formattaEuro(p.prezzoCent)}</span>
        </div>
        {p.perche || p.descrizione ? <p className="line-clamp-1 text-sm text-ink-soft">{p.perche || p.descrizione}</p> : null}
      </div>
      <a href={urlPerAcquisto(p.urlEsterno)} target="_blank" rel={REL_LINK_PRODOTTO} className={`${CLASSI_SECONDARIO} text-base`}>
        Guarda su Amazon
        <Icona nome="open_in_new" dimensione={20} />
        <span className="sr-only"> (si apre in una nuova scheda)</span>
      </a>
    </>
  );
}

/** Le classi del riquadro `<li>` che contiene la scheda. */
export const CLASSI_RIQUADRO_REGALO = "flex flex-col gap-2 rounded-3xl bg-surface p-4 shadow-carta";
