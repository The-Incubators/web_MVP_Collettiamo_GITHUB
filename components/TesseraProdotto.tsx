import Link from "next/link";
import { BottoneCuore } from "@/components/BottoneCuore";
import { IconaTratto, ImmagineProdotto } from "@/components/ui";
import { REL_LINK_PRODOTTO, urlPerAcquisto } from "@/lib/dominio/amazon";
import { formattaEuro } from "@/lib/dominio/importi";
import type { Prodotto } from "@/lib/tipi";

/**
 * La tessera prodotto di Gifty UX v2 (design.md §4): lastra quadrata color parete con la foto in `multiply` (il fondo
 * bianco delle foto Amazon sparisce nella parete), cuore in alto a destra, nome su due righe, prezzo e marca,
 * «Guarda su Amazon» pieno e «Aggiungi a un regalo di gruppo» quieto, che apre il wizard con il regalo già scelto.
 * La nota sui prezzi non sta qui: la mette la pagina, una volta sola.
 */
export function TesseraProdotto({ prodotto: p }: { prodotto: Prodotto }) {
  const scheda = `/prodotto/${p.slug}`;
  return (
    <article className="tessera">
      <Link className="lastra" href={scheda} tabIndex={-1} aria-hidden="true">
        {p.immagine.foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.immagine.foto} alt="" loading="lazy" decoding="async" />
        ) : (
          <ImmagineProdotto prodotto={p} alt="" />
        )}
      </Link>
      <BottoneCuore slug={p.slug} nome={p.nome} tessera />
      <Link className="nome" href={scheda}>
        {p.nome}
      </Link>
      <div className="riga-prezzo">
        <span className="prezzo">{formattaEuro(p.prezzoCent)}</span>
        <span className="marca">{p.marca}</span>
      </div>
      <div className="azioni">
        <a className="btn btn-primario" href={urlPerAcquisto(p.urlEsterno)} target="_blank" rel={REL_LINK_PRODOTTO}>
          Guarda su Amazon<span className="sr-only"> (si apre in una nuova scheda)</span>
        </a>
        <Link className="btn btn-quieto" href={`/crea?prodotto=${encodeURIComponent(p.slug)}`}>
          <IconaTratto nome="gruppo" />
          Aggiungi a un regalo di gruppo
        </Link>
      </div>
    </article>
  );
}
