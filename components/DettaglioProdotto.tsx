import Link from "next/link";
import { BottoneCuore } from "@/components/BottoneCuore";
import { BottoneListaRegali } from "@/components/BottoneListaRegali";
import { TestoEspandibile } from "@/components/TestoEspandibile";
import { IconaTratto, ImmagineProdotto } from "@/components/ui";
import { REL_LINK_PRODOTTO, urlPerAcquisto } from "@/lib/dominio/amazon";
import { formattaEuro } from "@/lib/dominio/importi";
import { daProdotto, testoIlGiorno } from "@/lib/dominio/regali";
import type { Prodotto } from "@/lib/tipi";

/**
 * La scheda prodotto di Gifty UX v2 (prototipi/prodotto.html): lastra grande con il cuore; marca, nome, prezzo,
 * descrizione e il «perché» del catalogo; «Guarda su Amazon» pieno e «Aggiungi a un regalo di gruppo» contorno, che
 * apre il wizard con il regalo già scelto (I-08); la nota sul prezzo una volta. Niente biglietto (I-10).
 *
 * `gruppo`: aperta dal catalogo del regalo di gruppo (`?modo=gruppo`); aggiunge la lista per la votazione, che il
 * wizard usa ancora finché la PR 3 non la sostituisce.
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
        <div className="azioni">
          <a className="btn btn-primario btn-largo btn-largo-tel" href={urlPerAcquisto(p.urlEsterno)} target="_blank" rel={REL_LINK_PRODOTTO}>
            Guarda su Amazon
            <IconaTratto nome="esterno" />
            <span className="sr-only"> (si apre in una nuova scheda)</span>
          </a>
          <Link className="btn btn-contorno btn-largo btn-largo-tel" href={`/crea?prodotto=${encodeURIComponent(p.slug)}`}>
            <IconaTratto nome="gruppo" />
            Aggiungi a un regalo di gruppo
          </Link>
          {gruppo ? <BottoneListaRegali prodotto={daProdotto(p)} variante="largo" /> : null}
        </div>
        <p className="t-piccolo muted">Prezzo rilevato su Amazon {testoIlGiorno(p.rilevatoIl ?? "2026-10-14")}: quello finale lo vedi su Amazon.</p>
      </div>
    </div>
  );
}
