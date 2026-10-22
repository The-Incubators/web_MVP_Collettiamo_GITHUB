import Link from "next/link";
import { Icona } from "@/components/v2/Icona";
import { ImmagineProdotto } from "@/components/ui";
import { datiServer } from "@/lib/dati";
import { SLUG_DEMO } from "@/lib/dati/demo";
import { DICHIARAZIONE_AFFILIATO_AMAZON } from "@/lib/dominio/amazon";
import { formattaEuro } from "@/lib/dominio/importi";
import { avanzamento, inizialiDi } from "@/lib/dominio/partecipanti";
import { quotaProposta } from "@/lib/dominio/quota";

export const dynamic = "force-dynamic";

/** Le stesse 12 persone che il calcolatore della scheda prodotto propone come punto di partenza. */
const PERSONE_ESEMPIO = 12;

const CARD = "rounded-2xl bg-surface-cream-card p-space-md shadow-sm";

export default async function HomeV2() {
  const dati = datiServer();
  const [prodotti, colletta] = await Promise.all([dati.elencaProdotti(), dati.colletta(SLUG_DEMO)]);
  const inEvidenza = prodotti.slice(0, 2);
  // La «raccolta attiva» mostra la colletta dimostrativa vera, non numeri inventati: se non c'è, non si mostra.
  const righe = colletta ? await dati.partecipanti(SLUG_DEMO) : [];
  const stato = colletta ? avanzamento(colletta) : null;
  const confermati = righe.filter((r) => r.stato === "confermato");

  return (
    <div className="flex w-full flex-col gap-space-xl">
      {/* Hero */}
      <section className="flex flex-col gap-space-lg">
        <div className="inline-flex items-center gap-space-xs self-start rounded-full bg-tangerine-tint px-3.5 py-1.5 font-label-sm text-label-sm text-secondary shadow-sm">
          <Icona nome="redeem" dimensione={16} className="text-secondary" />
          <span>Regali di gruppo facili e senza stress</span>
        </div>

        <div className="flex flex-col gap-space-sm">
          <h1 className="font-display-mobile text-display-mobile leading-tight tracking-tight text-primary-container">
            Il regalo di gruppo, senza dover rincorrere tutti.
          </h1>
          <p className="font-body-md text-body-md text-text-muted">
            Un unico link per coinvolgere tutti e seguire i contributi: sai chi ha partecipato, chi manca e a che punto siete.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <span className="flex h-2 w-2 rounded-full bg-secondary-container" />
            <p className="font-label-md text-label-md italic text-primary-container">
              «Più tempo per scegliere il regalo, meno per organizzarlo.»
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-space-sm pt-1">
          <Link
            href="/v2/crea"
            className="flex h-[52px] w-full items-center justify-center gap-space-xs rounded-xl bg-secondary-container px-6 font-label-lg text-label-lg text-on-secondary shadow-md transition-all hover:bg-secondary active:scale-[0.98]"
          >
            <Icona nome="add_circle" dimensione={20} />
            <span>Organizza un regalo</span>
          </Link>
          <Link
            href={`/c/${SLUG_DEMO}`}
            className="flex h-[50px] w-full items-center justify-center gap-space-xs rounded-xl bg-surface-cream-card px-6 font-label-lg text-label-lg text-primary-container shadow-sm transition-all hover:bg-forest-tint"
          >
            <Icona nome="visibility" dimensione={20} />
            <span>Guarda come appare a chi partecipa</span>
          </Link>
        </div>

        {colletta && stato ? (
          <Link
            href={`/c/${SLUG_DEMO}`}
            className="relative flex flex-col gap-space-sm overflow-hidden rounded-2xl bg-surface-cream-card p-space-md shadow-md transition-shadow hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-tint text-primary-container">
                  <Icona nome="celebration" dimensione={18} />
                </div>
                <div>
                  <span className="block font-label-sm text-label-sm uppercase tracking-wider text-text-muted">Raccolta attiva</span>
                  <span className="font-headline-sm text-label-lg text-primary-container">{colletta.festeggiato} 🎉</span>
                </div>
              </div>
              <span className="cifre rounded-full bg-forest-tint px-2.5 py-1 font-label-sm text-label-sm font-semibold text-primary-container">
                {stato.percento}%
              </span>
            </div>

            <div className="flex flex-col gap-1.5 pt-1">
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-container">
                <div className="h-full rounded-full bg-secondary-container transition-all duration-700 ease-out" style={{ width: `${stato.percento}%` }} />
              </div>
              <div className="flex items-center justify-between font-label-sm text-label-sm text-text-muted">
                <span>
                  <strong className="cifre text-[14px] font-bold text-primary-container">{formattaEuro(stato.confermatoCent)}</strong> raccolti
                </span>
                <span className="cifre">Obiettivo {formattaEuro(stato.obiettivoCent)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center -space-x-2">
                {confermati.slice(0, 3).map((r) => (
                  <span
                    key={r.id}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-fixed text-[11px] font-bold text-on-primary-fixed shadow-sm"
                  >
                    {inizialiDi(r.nome)}
                  </span>
                ))}
                {confermati.length > 3 ? (
                  <span className="cifre flex h-7 w-7 items-center justify-center rounded-full bg-gold-tint text-[11px] font-bold text-gift-gold shadow-sm">
                    +{confermati.length - 3}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-1 font-label-sm text-label-sm text-primary-container">
                <Icona nome="check_circle" dimensione={16} piena />
                <span className="cifre">{confermati.length}</span>
                <span>{confermati.length === 1 ? "quota confermata" : "quote confermate"}</span>
              </div>
            </div>
          </Link>
        ) : null}
      </section>

      {/* Come funziona */}
      <section id="come-funziona" className="flex scroll-mt-20 flex-col gap-space-md">
        <div className="flex flex-col gap-1">
          <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-secondary-container">Semplicissimo</span>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-primary-container">Come funziona, in tre passi</h2>
        </div>
        <div className="flex flex-col gap-space-sm">
          <div className={`${CARD} relative flex flex-col gap-space-sm overflow-hidden`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-tint font-display text-[18px] font-bold text-primary-container">1</div>
                <h3 className="font-headline-sm text-headline-sm text-primary-container">Scegli il regalo</h3>
              </div>
              <span className="rounded-full bg-forest-tint px-2.5 py-0.5 font-label-sm text-[11px] font-medium text-primary-container">Step 1</span>
            </div>
            <p className="pl-12 font-body-md text-body-md text-text-muted">
              Dal catalogo oppure incolla il link da qualsiasi negozio online. Imposti la quota suggerita e come preferisci essere rimborsato.
            </p>
            <div className="flex flex-wrap gap-1.5 pl-12 pt-1">
              <span className="flex items-center gap-1 rounded-lg bg-surface-container px-2.5 py-1 font-label-sm text-[12px] text-text-muted">
                <Icona nome="link" dimensione={14} /> Incolla URL
              </span>
              {["Amazon", "Decathlon", "Negozio locale"].map((t) => (
                <span key={t} className="rounded-lg bg-surface-container px-2.5 py-1 font-label-sm text-[12px] text-text-muted">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className={`${CARD} relative flex flex-col gap-space-sm overflow-hidden`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-tangerine-tint font-display text-[18px] font-bold text-secondary-container">2</div>
                <h3 className="font-headline-sm text-headline-sm text-primary-container">Manda un link</h3>
              </div>
              <span className="rounded-full bg-tangerine-tint px-2.5 py-0.5 font-label-sm text-[11px] font-medium text-secondary-container">Step 2</span>
            </div>
            <p className="pl-12 font-body-md text-body-md text-text-muted">
              Lo incolli nella chat di gruppo WhatsApp o Telegram. Chi lo apre vede il regalo e la sua quota istantaneamente, senza doversi
              registrare.
            </p>
            <div className="pl-12 pt-1">
              <div className="inline-flex items-center gap-2 rounded-xl bg-forest-tint px-3 py-1.5 font-label-sm text-[12px] text-primary-container">
                <Icona nome="send" dimensione={16} className="text-secondary-container" />
                <span>Pronto per chat di gruppo</span>
              </div>
            </div>
          </div>

          <div className={`${CARD} relative flex flex-col gap-space-sm overflow-hidden`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-tint font-display text-[18px] font-bold text-gift-gold">3</div>
                <h3 className="font-headline-sm text-headline-sm text-primary-container">Noi teniamo il conto</h3>
              </div>
              <span className="rounded-full bg-gold-tint px-2.5 py-0.5 font-label-sm text-[11px] font-medium text-gift-gold">Step 3</span>
            </div>
            <p className="pl-12 font-body-md text-body-md text-text-muted">
              Vedi chi ha pagato e chi manca. Confermi gli accrediti con un tap e ricordiamo noi, con garbo ed eleganza, a chi è rimasto
              indietro.
            </p>
            <div className="flex items-center gap-2 pl-12 pt-1">
              <span className="flex items-center gap-1 rounded-lg bg-surface-container px-2.5 py-1 font-label-sm text-[12px] text-text-muted">
                <Icona nome="notifications_active" dimensione={14} className="text-primary-container" /> Solleciti gentili
              </span>
              <span className="flex items-center gap-1 rounded-lg bg-surface-container px-2.5 py-1 font-label-sm text-[12px] text-text-muted">
                <Icona nome="done_all" dimensione={14} className="text-secondary-container" /> Zero imbarazzo
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Biglietto di gruppo */}
      <section className="relative flex flex-col gap-space-md overflow-hidden rounded-3xl bg-surface-cream-card p-space-lg shadow-md">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-gold-tint px-3 py-1 font-label-sm text-label-sm text-gift-gold">
            <Icona nome="draw" dimensione={16} />
            <span>Novità inclusa</span>
          </div>
          <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-secondary-container">Gratis</span>
        </div>
        <div className="flex flex-col gap-space-xs">
          <h2 className="font-headline-md text-headline-md leading-tight text-primary-container">Un biglietto firmato da tutto il gruppo</h2>
          <p className="font-body-md text-body-md text-text-muted">
            Ognuno scrive il suo messaggio con una foto o una GIF; alla data scelta il biglietto virtuale animato arriva al festeggiato.
          </p>
        </div>
        <div className="relative flex h-44 w-full items-center justify-center overflow-hidden rounded-2xl bg-surface-container-low p-3" aria-hidden="true">
          <div className="absolute -left-2 top-3 w-44 -rotate-6 rounded-xl bg-surface-cream-card p-2.5 shadow-md">
            <div className="mb-1 flex items-center gap-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-fixed text-[10px] font-bold text-on-primary-fixed">S</div>
              <span className="font-label-sm text-[11px] text-primary-container">Sara</span>
            </div>
            <p className="font-body-sm text-[12px] leading-tight text-on-surface">Auguroni compare! Sei sempre il n°1! 🎂🥂</p>
          </div>
          <div className="absolute right-0 top-6 w-48 rotate-3 rounded-xl bg-gold-tint p-2.5 shadow-md">
            <div className="mb-1 flex items-center gap-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary-fixed text-[10px] font-bold text-on-secondary-fixed">M</div>
              <span className="font-label-sm text-[11px] text-secondary">Matteo</span>
            </div>
            <p className="font-body-sm text-[12px] leading-tight text-tertiary">Un brindisi a te e alle prossime avventure! ✨🎈</p>
          </div>
          <div className="absolute bottom-2 left-1/3 flex rotate-1 items-center gap-1 rounded-full bg-primary-container px-3 py-1 font-label-sm text-[11px] text-on-primary shadow-lg">
            <Icona nome="auto_awesome" dimensione={14} className="text-secondary-fixed" />
            <span>Consegnato alla mezzanotte!</span>
          </div>
        </div>
        <Link
          href="/biglietto/nuovo"
          className="flex h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-forest-tint font-label-lg text-label-lg text-primary-container transition-colors hover:bg-surface-variant"
        >
          <span>Crea un biglietto di gruppo</span>
          <Icona nome="arrow_forward" dimensione={18} />
        </Link>
      </section>

      {/* Perché chi partecipa non deve fare nulla */}
      <section className="flex flex-col gap-space-md">
        <div className="flex flex-col gap-1">
          <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-primary-container">Frictionless UX</span>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-primary-container">Perché chi partecipa non deve fare nulla di più</h2>
        </div>
        <div className="flex flex-col gap-space-sm">
          {[
            {
              icona: "person_off" as const,
              sfondo: "bg-forest-tint text-primary-container",
              titolo: "Niente account, niente app",
              testo: "Nessuna email e nessuna app da installare. Per confermare la propria presenza basta inserire il proprio nome.",
            },
            {
              icona: "touch_app" as const,
              sfondo: "bg-tangerine-tint text-secondary-container",
              titolo: "Conferma con un tocco",
              testo: "Chi ha versato la quota lo dichiara con un tap, e chi organizza lo convalida non appena riceve l'accredito.",
            },
            {
              icona: "security" as const,
              sfondo: "bg-gold-tint text-gift-gold",
              titolo: "I soldi non passano mai da qui",
              testo: "Si pagano direttamente all'organizzatore tramite Satispay, PayPal, bonifico o a mano. Zero commissioni trattenute.",
            },
          ].map((v) => (
            <div key={v.titolo} className={`${CARD} flex items-start gap-3`}>
              <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${v.sfondo}`}>
                <Icona nome={v.icona} />
              </div>
              <div className="flex flex-col gap-0.5">
                <h3 className="font-headline-sm text-label-lg text-primary-container">{v.titolo}</h3>
                <p className="font-body-sm text-body-sm text-text-muted">{v.testo}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Idee regalo dal catalogo vero */}
      {inEvidenza.length > 0 ? (
        <section className="flex flex-col gap-space-md">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-text-muted">Ispirazioni</span>
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-primary-container">Idee regalo in evidenza</h2>
            </div>
            <Link href="/catalogo" className="flex items-center gap-0.5 font-label-sm text-label-sm font-semibold text-secondary-container">
              <span>Tutto</span>
              <Icona nome="chevron_right" dimensione={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {inEvidenza.map((p) => (
              <Link key={p.slug} href={`/prodotto/${p.slug}`} className="flex flex-col gap-2 rounded-2xl bg-surface-cream-card p-3 shadow-sm">
                <div className="relative h-28 w-full overflow-hidden rounded-xl bg-surface-container">
                  <ImmagineProdotto prodotto={p} className="h-full w-full" />
                  <span className="cifre absolute right-2 top-2 rounded-full bg-surface-cream-card/90 px-2 py-0.5 font-label-sm text-[10px] font-bold text-primary-container backdrop-blur-sm">
                    {formattaEuro(p.prezzoCent)}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <h3 className="truncate font-headline-sm text-[14px] text-primary-container">{p.nome}</h3>
                  <span className="font-body-sm text-[12px] text-text-muted">
                    Quota {formattaEuro(quotaProposta(p.prezzoCent, PERSONE_ESEMPIO))} a testa in {PERSONE_ESEMPIO}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <footer className="flex flex-col items-center gap-space-sm pb-6 pt-2 text-center">
        <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-forest-tint text-primary-container">
          <Icona nome="volunteer_activism" dimensione={20} />
        </div>
        <p className="max-w-xs font-headline-sm text-headline-sm text-primary-container">Meno fogli Excel, niente IBAN persi in chat.</p>
        <p className="max-w-xs font-body-sm text-[12px] text-text-muted">
          Regaloop è un prototipo del progetto <strong className="font-semibold text-primary-container">Cosa Gli Regaliamo</strong>. I soldi
          non passano mai da qui: si pagano direttamente a chi organizza.
        </p>
        <span className="mt-2 font-body-sm text-[11px] text-outline">{DICHIARAZIONE_AFFILIATO_AMAZON}</span>
      </footer>
    </div>
  );
}
