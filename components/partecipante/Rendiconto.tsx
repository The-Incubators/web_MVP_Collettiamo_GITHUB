import { BottoneLink, Icona, ImmagineProdotto } from "@/components/ui";
import { dataBreve } from "@/lib/dominio/date";
import { formattaEuro } from "@/lib/dominio/importi";
import { calcolaChiusura } from "@/lib/dominio/quota";
import type { Colletta, Partecipante } from "@/lib/tipi";

const maiuscola = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Lo stato finale della colletta: pagina pubblica in sola lettura. Mostra solo chi ha pagato, mai chi manca. */
export function Rendiconto({ colletta: c, righe }: { colletta: Colletta; righe: Partecipante[] }) {
  const confermati = righe.filter((r) => r.stato === "confermato");
  const a = c.acquisto;
  const spese = a?.speseCent ?? null;
  const chiusura = spese !== null ? calcolaChiusura(c.totaleConfermatoCent, spese, c.nConfermati) : null;
  const avanzo = chiusura?.avanzoCent ?? 0;
  const acquistato = !!a?.fatto;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="min-w-0 truncate text-xs font-semibold text-ink-soft">
          {c.organizzatoreNome} per {c.festeggiato} · {maiuscola(c.occasione)} {dataBreve(c.dataRegalo)}
        </p>
        <p className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-bold text-on-accent">
          <Icona nome="check_circle" dimensione={16} />
          {acquistato ? "Regalo acquistato" : "Colletta chiusa"}
        </p>
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-field text-gold">
          <Icona nome="task_alt" dimensione={30} />
        </span>
        <h1 className="text-[32px] font-bold leading-[38px] tracking-tight text-accent-2">
          {acquistato ? `Missione compiuta per ${c.festeggiato}! 🎉` : `Il regalo per ${c.festeggiato}`}
        </h1>
        <p className="text-ink-soft">{acquistato ? "Il regalo è stato comprato. Ecco com’è andata." : "La raccolta è chiusa."}</p>
      </div>

      <section className="flex flex-col gap-4 rounded-3xl bg-surface p-4 shadow-carta">
        <div className="relative overflow-hidden rounded-2xl">
          <ImmagineProdotto prodotto={c.prodotto} className="h-48" />
          <span className="cifre absolute bottom-3 right-3 rounded-full bg-accent px-3 py-1.5 font-bold text-on-accent">{formattaEuro(c.prodotto.prezzoCent)}</span>
        </div>
        <p className="px-1 font-display text-2xl font-semibold leading-tight">{c.prodotto.nome}</p>
        {a?.ricevutaUrl ? (
          <a
            href={a.ricevutaUrl}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="flex min-h-tocco items-center gap-3 rounded-2xl bg-surface-2 p-3 font-bold"
          >
            <Icona nome="receipt_long" className="text-ink-soft" />
            <span className="flex-1">Ricevuta d’acquisto</span>
            <span className="inline-flex items-center gap-1 text-sm text-accent">
              Vedi <Icona nome="open_in_new" dimensione={18} />
            </span>
          </a>
        ) : null}
      </section>

      <section aria-labelledby="rendiconto" className="flex flex-col gap-4 rounded-3xl bg-surface p-5 shadow-carta">
        <h2 id="rendiconto" className="flex items-center gap-2 text-xl font-semibold text-accent-2">
          <Icona nome="account_balance_wallet" />
          Rendiconto del gruppo
        </h2>
        <dl className="grid grid-cols-3 gap-2 text-center">
          <div className="flex flex-col gap-1 rounded-2xl bg-surface-2 p-3">
            <dt className="text-xs font-semibold text-ink-soft">Raccolto</dt>
            <dd className="cifre text-lg font-bold">{formattaEuro(c.totaleConfermatoCent)}</dd>
            <dd className="text-[11px] text-ink-soft">{c.nConfermati === 1 ? "1 quota" : `${c.nConfermati} quote`}</dd>
          </div>
          {spese !== null ? (
            <div className="flex flex-col gap-1 rounded-2xl bg-surface-2 p-3">
              <dt className="text-xs font-semibold text-ink-soft">Speso</dt>
              <dd className="cifre text-lg font-bold">{formattaEuro(spese)}</dd>
              <dd className="text-[11px] text-ink-soft">per il regalo</dd>
            </div>
          ) : null}
          {chiusura ? (
            <div className={`flex flex-col gap-1 rounded-2xl p-3 ${avanzo > 0 ? "bg-accent-field" : "bg-surface-2"}`}>
              <dt className="text-xs font-semibold text-ink-soft">{avanzo < 0 ? "Differenza" : "Avanzo"}</dt>
              <dd className="cifre text-lg font-bold">{formattaEuro(Math.abs(avanzo))}</dd>
              <dd className="text-[11px] text-ink-soft">{avanzo < 0 ? `messa da ${c.organizzatoreNome}` : avanzo === 0 ? "nessuno" : a?.destinazioneAvanzo ? "già destinato" : "da destinare"}</dd>
            </div>
          ) : null}
        </dl>
        {chiusura && avanzo > 0 && a?.destinazioneAvanzo ? (
          <p className="rounded-2xl bg-surface-2 p-4 text-sm">
            {a.destinazioneAvanzo === "biglietto" && "L’avanzo serve per il biglietto e la confezione."}
            {a.destinazioneAvanzo === "restituito" && `L’avanzo viene restituito: ${formattaEuro(chiusura.restituzioneACapoCent)} a testa.`}
            {a.destinazioneAvanzo === "extra" && "L’avanzo è andato in un extra al regalo."}
          </p>
        ) : null}
        {confermati.length > 0 ? (
          <div className="flex flex-col gap-2">
            <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-ink-soft">Hanno partecipato</h3>
            <ul className="flex flex-wrap gap-2">
              {confermati.map((r) => (
                <li key={r.id} className="rounded-full bg-surface-2 px-3 py-1 text-sm font-semibold">
                  {r.nome}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section aria-labelledby="biglietto" className="flex flex-col gap-3 rounded-3xl bg-surface p-5 shadow-carta">
        <h2 id="biglietto" className="flex items-center gap-2 text-xl font-semibold text-accent-2">
          <Icona nome="mail" className="text-accent" />
          Il biglietto di gruppo 💌
        </h2>
        <p className="text-sm text-ink-soft">I messaggi del gruppo per {c.festeggiato}, pronti da sfogliare o stampare.</p>
        <BottoneLink href={`/c/${c.slug}/biglietto`} variante="secondario" pieno>
          Sfoglia il biglietto di {c.festeggiato} <Icona nome="open_in_new" dimensione={20} />
        </BottoneLink>
      </section>

      <section className="flex flex-col gap-3 rounded-3xl bg-accent p-6 text-on-accent">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
          <Icona nome="auto_awesome" dimensione={18} />
          Prossimo evento in arrivo?
        </p>
        <h2 className="text-2xl font-bold">Organizzi anche tu un regalo di gruppo?</h2>
        <p className="text-sm">Scegli il regalo, manda il link nella chat e firmate il biglietto insieme.</p>
        <BottoneLink href="/catalogo" variante="azione" pieno className="mt-1">
          Guarda il catalogo <Icona nome="arrow_forward" dimensione={22} />
        </BottoneLink>
      </section>

      <p className="inline-flex items-center justify-center gap-1 text-xs font-bold text-accent">
        <Icona nome="verified_user" dimensione={16} />I soldi non passano mai da Gifty.
      </p>
    </div>
  );
}
