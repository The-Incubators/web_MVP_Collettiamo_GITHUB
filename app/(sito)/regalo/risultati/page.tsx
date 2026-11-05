import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TesseraProdotto } from "@/components/TesseraProdotto";
import { ChipLink } from "@/components/ui";
import { datiServer } from "@/lib/dati";
import { NOTA_PREZZI } from "@/lib/dominio/amazon";
import { OCCASIONI_REGALO } from "@/lib/regalo/dati";
import { etichettaEta, etichettaPer, hrefDomande, hrefRisultati, risposteComplete, statoDaParametri, testiInteressi, titoloRisultati } from "@/lib/regalo/indirizzo";
import { ordinaProdotti } from "@/lib/regalo/punteggio";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return { title: titoloRisultati(statoDaParametri(await searchParams).genere) };
}

/** Quante idee si vedono all'inizio e a ogni «Mostra altre idee»: i risultati sono tutto il catalogo, ordinato. */
const PER_PAGINA = 24;

/**
 * I risultati di «Trova il regalo» (Gifty UX v2, prototipi/risultati.html): le risposte come chip modificabili, la
 * griglia per affinità (lib/regalo/punteggio.ts), la nota sui prezzi una volta. Le risposte arrivano nell'indirizzo.
 */
export default async function Risultati({ searchParams }: Props) {
  const sp = await searchParams;
  const stato = statoDaParametri(sp);
  if (!stato.genere) redirect("/idee");
  if (!risposteComplete(stato)) redirect(hrefDomande(stato, stato.tappa === 2 ? 2 : stato.tappa === 3 ? 3 : 4));
  const mostra = Math.max(PER_PAGINA, Math.floor(Number(typeof sp.mostra === "string" ? sp.mostra : "")) || PER_PAGINA);
  const risultati = ordinaProdotti(await datiServer().elencaProdotti(), stato);
  const occasione = OCCASIONI_REGALO.find((o) => o.id === stato.occasione)?.etichetta ?? "";
  const per = etichettaPer(stato.genere);
  const eta = etichettaEta(stato.eta);
  const resto = risultati.length - mostra;

  return (
    <div className="pagina fondo">
      <div className="testa-elenco">
        <h1 className="t-pagina">{titoloRisultati(stato.genere)}</h1>
        <div className="chips" role="group" aria-label="Le tue risposte">
          <ChipLink href="/idee" etichetta={`Cambia: ${per}`}>
            {per}
          </ChipLink>
          <ChipLink href={hrefDomande(stato, 2)} etichetta={`Cambia: ${eta}`}>
            {eta}
          </ChipLink>
          <ChipLink href={hrefDomande(stato, 3)} etichetta={`Cambia: ${occasione}`}>
            {occasione}
          </ChipLink>
          {testiInteressi(stato).map((t) => (
            <ChipLink key={t} href={hrefDomande(stato, 4)} etichetta={`Cambia: ${t}`}>
              {t}
            </ChipLink>
          ))}
        </div>
      </div>
      <div className="griglia-prodotti">
        {risultati.slice(0, mostra).map((p) => (
          <TesseraProdotto key={p.slug} prodotto={p} />
        ))}
      </div>
      {resto > 0 ? (
        <div className="altre-idee">
          <Link className="btn btn-quieto" href={`${hrefRisultati(stato)}&mostra=${mostra + PER_PAGINA}`} scroll={false}>
            Mostra altre {Math.min(PER_PAGINA, resto)} idee
          </Link>
        </div>
      ) : null}
      <p className="nota-prezzi">{NOTA_PREZZI}</p>
    </div>
  );
}
