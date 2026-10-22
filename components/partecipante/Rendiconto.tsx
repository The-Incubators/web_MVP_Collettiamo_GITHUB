import Link from "next/link";
import { Avviso, BottoneLink, Etichetta, IconaEsterno, ImmagineProdotto } from "@/components/ui";
import { dataLunga } from "@/lib/dominio/date";
import { formattaEuro } from "@/lib/dominio/importi";
import { calcolaChiusura } from "@/lib/dominio/quota";
import type { Colletta, Partecipante } from "@/lib/tipi";

/** Lo stato finale della colletta: pagina pubblica in sola lettura. Mostra solo chi ha pagato, mai chi manca. */
export function Rendiconto({ colletta: c, righe }: { colletta: Colletta; righe: Partecipante[] }) {
  const confermati = righe.filter((r) => r.stato === "confermato");
  const a = c.acquisto;
  const spese = a?.speseCent ?? null;
  const chiusura = spese !== null ? calcolaChiusura(c.totaleConfermatoCent, spese, c.nConfermati) : null;
  const avanzo = chiusura?.avanzoCent ?? 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-ink-soft">{c.organizzatoreNome} ha organizzato</p>
        <h1 className="text-3xl leading-tight">Il regalo per {c.festeggiato}</h1>
        <p>
          <Etichetta stato="confermato">{a?.fatto ? "Regalo acquistato" : "Colletta chiusa"}</Etichetta>
        </p>
      </div>

      <div className="contenitore overflow-hidden">
        <ImmagineProdotto prodotto={c.prodotto} className="max-h-48 object-cover" />
        <div className="flex flex-col gap-1 p-4">
          <p className="font-medium">{c.prodotto.nome}</p>
          <p className="text-sm text-ink-soft">Per {dataLunga(c.dataRegalo)}</p>
        </div>
      </div>

      <section aria-labelledby="rendiconto" className="contenitore flex flex-col gap-3 p-4">
        <h2 id="rendiconto" className="text-xl">
          Rendiconto
        </h2>
        <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2">
          <dt>Raccolto</dt>
          <dd className="cifre text-right font-bold">{formattaEuro(c.totaleConfermatoCent)}</dd>
          {spese !== null ? (
            <>
              <dt>Speso per il regalo</dt>
              <dd className="cifre text-right font-bold">{formattaEuro(spese)}</dd>
            </>
          ) : null}
          {chiusura && avanzo > 0 ? (
            <>
              <dt>Avanzo</dt>
              <dd className="cifre text-right font-bold">{formattaEuro(avanzo)}</dd>
            </>
          ) : null}
        </dl>
        {chiusura && avanzo > 0 && a?.destinazioneAvanzo ? (
          <p className="text-sm">
            {a.destinazioneAvanzo === "biglietto" && "L’avanzo serve per il biglietto e la confezione."}
            {a.destinazioneAvanzo === "restituito" && `L’avanzo viene restituito: ${formattaEuro(chiusura.restituzioneACapoCent)} a testa.`}
            {a.destinazioneAvanzo === "extra" && "L’avanzo è andato in un extra al regalo."}
          </p>
        ) : null}
        {chiusura && avanzo < 0 ? <p className="text-sm">La differenza l’ha messa {c.organizzatoreNome}.</p> : null}
        {a?.ricevutaUrl ? (
          <a className="inline-flex min-h-tocco items-center gap-1 self-start font-semibold text-accent-2 underline underline-offset-4" href={a.ricevutaUrl} target="_blank" rel="nofollow noopener noreferrer">
            Vedi la ricevuta <IconaEsterno width={16} height={16} />
          </a>
        ) : null}
      </section>

      {confermati.length > 0 ? (
        <section aria-labelledby="hanno-partecipato" className="contenitore flex flex-col gap-2 p-4">
          <h2 id="hanno-partecipato" className="text-xl">
            Hanno partecipato
          </h2>
          <ul className="flex flex-wrap gap-2">
            {confermati.map((r) => (
              <li key={r.id} className="rounded-full border border-line bg-surface-2 px-3 py-1 text-sm">
                {r.nome}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <BottoneLink href={`/c/${c.slug}/biglietto`} variante="secondario" pieno>
        Vedi il biglietto con i messaggi
      </BottoneLink>
      <Avviso>
        <p>
          Hai organizzato un regalo anche tu? <Link href="/catalogo" className="font-semibold underline underline-offset-4">Guarda il catalogo</Link>.
        </p>
      </Avviso>
    </div>
  );
}
