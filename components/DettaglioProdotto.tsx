import Link from "next/link";
import { BottoneCuore } from "@/components/BottoneCuore";
import { TestoEspandibile } from "@/components/TestoEspandibile";
import { IconaTratto, ImmagineProdotto } from "@/components/ui";
import { REL_LINK_PRODOTTO, urlPerAcquisto } from "@/lib/dominio/amazon";
import { formattaEuro } from "@/lib/dominio/importi";
import type { Prodotto } from "@/lib/tipi";

/**
 * La scheda prodotto di Gifty UX v2 (prototipi/prodotto.html): lastra grande con il cuore; marca, nome, prezzo,
 * descrizione e il «perché» del catalogo; «Fai un regalo» pieno e «Guarda su Amazon» contorno (Cri, 6 nov); «Fai un regalo»
 * porta al bivio fra regalo personale e di gruppo (/fai-un-regalo); la nota sul prezzo una volta. Niente biglietto (I-10).
 *
 * `gruppo`: aperta dal catalogo del wizard (`?modo=gruppo`): le azioni sono «Scegli questo regalo» e «Aggiungi al
 * voto», come sulla tessera (G-04).
 */
export function DettaglioProdotto({ p, gruppo = false }: { p: Prodotto; gruppo?: boolean }) {
  return (
    <div className="scheda">
      <div className="foto-g">
        <div className="lastra">
          {p.immagine.foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.immagine.foto} alt={p.nome} />
          ) : (
            <ImmagineProdotto prodotto={p} alt={p.nome} />
          )}
        </div>
        <BottoneCuore slug={p.slug} nome={p.nome} tessera />
      </div>
      <div className="info">
        <p className="muted">{p.marca}</p>
        <h1 className="t-pagina">{p.nome}</h1>
        <p className="t-cifra prezzo-g">{formattaEuro(p.prezzoCent)}</p>
        <TestoEspandibile testo={p.descrizione} />
        {p.perche ? <p className="perche">{p.perche}</p> : null}
        {gruppo ? (
          <div className="azioni">
            <Link className="btn btn-primario btn-largo btn-largo-tel" href={`/crea?scegli=${encodeURIComponent(p.slug)}`}>
              Scegli questo regalo
            </Link>
            <Link className="btn btn-quieto" href={`/crea?vota=${encodeURIComponent(p.slug)}`}>
              <IconaTratto nome="piu" />
              Aggiungi al voto
            </Link>
          </div>
        ) : (
        <div className="azioni">
          <Link className="btn btn-primario btn-largo btn-largo-tel" href={`/fai-un-regalo?prodotto=${encodeURIComponent(p.slug)}`}>
            Fai un regalo
          </Link>
          <a className="btn btn-contorno btn-largo btn-largo-tel" href={urlPerAcquisto(p.urlEsterno)} target="_blank" rel={REL_LINK_PRODOTTO}>
            Guarda su Amazon
            <IconaTratto nome="esterno" />
            <span className="sr-only"> (si apre in una nuova scheda)</span>
          </a>
        </div>
        )}
      </div>
    </div>
  );
}
