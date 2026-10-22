import { BottoneLink, IconaCategoria, IconaFreccia } from "@/components/ui";
import type { Categoria } from "@/lib/tipi";

const PASSI: { titolo: string; testo: string; icona: Categoria }[] = [
  { titolo: "Scegli il regalo", testo: "Dal catalogo, oppure incolla il link di un negozio. Imposti la quota e come vuoi essere pagato.", icona: "esperienze" },
  { titolo: "Manda un link", testo: "Lo incolli nella chat del gruppo. Chi lo apre vede il regalo e la sua quota, senza registrarsi.", icona: "ufficio" },
  { titolo: "Noi teniamo il conto", testo: "Vedi chi ha pagato e chi manca, confermi gli accrediti e ricordiamo noi, con garbo, a chi manca.", icona: "casa" },
];

export default function Home() {
  return (
    <div className="gutter pb-16 pt-10 sm:pt-16">
      <div className="mx-auto flex max-w-catalogo flex-col gap-14">
        <section className="flex max-w-2xl flex-col gap-5">
          <div className="flex flex-col gap-2">
            <p className="font-display text-sm font-bold uppercase tracking-[0.18em] text-accent-2">Regaloop</p>
            <h1 className="text-4xl leading-tight sm:text-5xl">Il regalo di gruppo, senza dover rincorrere tutti.</h1>
          </div>
          <p className="text-lg text-ink-soft">
            Un unico link per coinvolgere tutti e seguire i contributi: sai chi ha partecipato, chi manca e a che punto siete.
          </p>
          <p className="font-display text-xl font-bold">Più tempo per scegliere il regalo, meno per organizzarlo.</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <BottoneLink href="/catalogo">
              Organizza un regalo <IconaFreccia width={18} height={18} />
            </BottoneLink>
            <BottoneLink href="/c/demo" variante="secondario">
              Guarda come appare a chi partecipa
            </BottoneLink>
          </div>
        </section>

        <section aria-labelledby="come-funziona" className="flex flex-col gap-5">
          <h2 id="come-funziona" className="text-2xl">
            Come funziona, in tre passi
          </h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {PASSI.map((p, i) => (
              <li key={p.titolo} className="contenitore flex flex-col gap-3 p-5">
                <div className="flex items-center justify-between">
                  <span className="cifre flex h-9 w-9 items-center justify-center rounded-full bg-accent-field text-lg font-bold text-accent-2">
                    {i + 1}
                  </span>
                  <IconaCategoria categoria={p.icona} width={44} height={44} className="text-accent" />
                </div>
                <h3 className="text-xl">{p.titolo}</h3>
                <p className="text-ink-soft">{p.testo}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="contenitore flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl">Un biglietto firmato da tutto il gruppo</h2>
            <p className="text-ink-soft">Ognuno scrive il suo messaggio con una foto o una GIF; alla data scelta il biglietto arriva al festeggiato. Gratis.</p>
          </div>
          <BottoneLink href="/biglietto/nuovo" variante="secondario" className="shrink-0">
            Crea un biglietto di gruppo
          </BottoneLink>
        </section>

        <section className="contenitore flex flex-col gap-2 border-gold-line bg-gold-field p-5">
          <h2 className="text-xl">Perché chi partecipa non deve fare nulla di più</h2>
          <p>
            Niente account, niente email, niente app da installare: per partecipare serve solo un nome. Chi paga lo dichiara con un tocco, e
            chi organizza lo conferma quando vede arrivare i soldi.
          </p>
        </section>
      </div>
    </div>
  );
}
