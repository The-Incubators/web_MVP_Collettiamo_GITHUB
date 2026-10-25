import Link from "next/link";
import { Saluto } from "@/components/Saluto";
import { Icona, ImmagineProdotto, type NomeIcona } from "@/components/ui";
import { datiServer } from "@/lib/dati";
import { SLUG_DEMO } from "@/lib/dati/demo";
import { formattaEuro } from "@/lib/dominio/importi";
import { quotaProposta } from "@/lib/dominio/quota";

// Le idee in evidenza vengono dal catalogo vero, nell'ordine deciso nell'area riservata.
export const dynamic = "force-dynamic";

/** Le stesse 12 persone che il calcolatore della scheda prodotto propone come punto di partenza. */
const PERSONE_ESEMPIO = 12;

/** Quante idee scorrono nel carosello della home. */
const IDEE_IN_EVIDENZA = 8;

/** I passi di «Come funziona». Senza `testo` il titolo va su più righe; `icona: null` mostra la scatola del logo. */
const PASSI: { titolo: string; testo?: string; icona: NomeIcona | null }[] = [
  { titolo: "Usa il nostro motore di ricerca per filtrare il catalogo", icona: "auto_awesome" },
  { titolo: "Scegli il regalo", testo: "Dal nostro catalogo, o da un link", icona: "redeem" },
  { titolo: "Manda un link", testo: "Nella chat WhatsApp del gruppo", icona: "share" },
  { titolo: "Noi teniamo il conto", testo: "Vedi chi ha pagato, senza chiedere", icona: "checklist_rtl" },
  { titolo: "Crea un biglietto di auguri che tutti possano firmare facilmente", icona: null },
];

/** Riquadro dell'icona negli elenchi: angoli morbidi, verde chiaro. */
const RIQUADRO_ICONA = "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent-field text-accent";

export default async function Home() {
  const prodotti = await datiServer().elencaProdotti();
  const inEvidenza = prodotti.slice(0, IDEE_IN_EVIDENZA);

  return (
    <div className="pb-10 pt-4 sm:pt-10">
      <div className="mx-auto flex max-w-lg flex-col gap-6">
        <section className="gutter flex flex-col gap-5">
          <Saluto />
          {/* l'azione principale è arancio; tutto il resto in sfumature di verde */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/catalogo"
              className="flex min-h-40 flex-col justify-between gap-2 rounded-contenitore bg-gradient-to-br from-cta to-cta-3 p-4 text-on-cta shadow-arancio transition-transform active:scale-[0.98]"
            >
              <span className="flex flex-col items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-cta-2">
                  <Icona nome="add_circle" dimensione={22} />
                </span>
                <span className="text-[19px] font-bold leading-tight">Organizza una colletta</span>
              </span>
              <span className="text-[13px] font-semibold leading-snug">Scegli il regalo e invita il gruppo.</span>
            </Link>
            <Link href="/biglietto/nuovo" className="eroe flex min-h-40 flex-col justify-between gap-2 p-4 transition-transform active:scale-[0.98]">
              <span className="flex flex-col items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-accent">
                  <Icona nome="draw" dimensione={22} />
                </span>
                <span className="text-[17px] font-bold leading-tight">Biglietto di auguri collettivo</span>
              </span>
              <span className="text-[13px] leading-snug text-accent-field">Firme e dediche di tutti.</span>
            </Link>
          </div>
          <Link
            href={`/c/${SLUG_DEMO}`}
            className="flex items-center gap-4 rounded-contenitore bg-verde-medio p-4 text-on-accent shadow-carta transition-transform active:scale-[0.98]"
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface text-verde-medio">
              <Icona nome="visibility" dimensione={28} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-lg font-bold leading-tight">Cosa vedono i partecipanti?</span>
              <span className="text-sm text-on-accent">Apri una colletta di prova, come la riceverebbero loro.</span>
            </span>
            <Icona nome="chevron_right" />
          </Link>
        </section>

        <section className="gutter">
          <div className="flex overflow-hidden rounded-contenitore bg-surface shadow-carta">
            <div className="flex flex-1 flex-col justify-between gap-4 p-5">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-accent">Biglietto collettivo</span>
                <h2 className="text-xl font-extrabold leading-tight text-ink">Guarda un biglietto già firmato.</h2>
              </div>
              <Link href="/biglietto/esempio" className="inline-flex min-h-tocco items-center gap-1 self-start text-sm font-bold text-accent">
                Apri l’esempio <Icona nome="arrow_forward" dimensione={18} />
              </Link>
            </div>
            {/* un assaggio di come appare un biglietto: è un esempio, non un conteggio */}
            <div aria-hidden="true" className="flex w-[40%] shrink-0 flex-col items-center justify-center gap-3 bg-accent-field p-4">
              <div className="flex -space-x-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ok-field text-xs font-bold text-accent-2 ring-2 ring-accent-field">LC</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cta-field text-xs font-bold text-cta-2 ring-2 ring-accent-field">MG</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-field text-xs font-bold text-gold ring-2 ring-accent-field">AP</span>
              </div>
              <span className="rotate-[-3deg] rounded-xl bg-surface px-3 py-2 text-center text-xs font-semibold text-ink shadow-carta">
                «Buon compleanno Marco! 🎉»
              </span>
            </div>
          </div>
        </section>

        {inEvidenza.length > 0 ? (
          <section aria-labelledby="idee" className="flex flex-col gap-3">
            <div className="gutter flex items-end justify-between gap-3">
              <div>
                <h2 id="idee" className="text-xl font-bold text-ink">
                  Idee più amate
                </h2>
                <p className="text-sm text-ink-soft">Pronte da regalare in gruppo</p>
              </div>
              <Link href="/catalogo" className="flex min-h-tocco items-center text-sm font-bold text-accent">
                Tutte <Icona nome="chevron_right" dimensione={18} />
              </Link>
            </div>
            <ul className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 [scrollbar-width:none]">
              {inEvidenza.map((p) => (
                <li key={p.slug} className="w-[42%] max-w-[190px] shrink-0 snap-start">
                  <Link href={`/prodotto/${p.slug}`} className="flex h-full flex-col overflow-hidden rounded-contenitore bg-surface shadow-carta">
                    <ImmagineProdotto prodotto={p} className="aspect-square" />
                    <span className="flex flex-col gap-1 p-3">
                      <span className="line-clamp-2 text-sm font-bold leading-tight text-ink">{p.nome}</span>
                      <span className="text-xs text-ink-soft">
                        In {PERSONE_ESEMPIO}: <span className="cifre font-bold text-accent">{formattaEuro(quotaProposta(p.prezzoCent, PERSONE_ESEMPIO))}</span> a testa
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section aria-labelledby="come-funziona" className="gutter flex flex-col gap-3">
          <div className="flex items-end justify-between">
            <h2 id="come-funziona" className="text-xl font-bold text-ink">
              Come funziona
            </h2>
            <span className="text-sm text-ink-soft">{PASSI.length} semplici passi</span>
          </div>
          <ol className="contenitore divide-y divide-line overflow-hidden">
            {PASSI.map((p, i) => (
              <li key={p.titolo} className="flex items-center gap-4 p-4">
                <span className={RIQUADRO_ICONA}>
                  {p.icona ? (
                    <Icona nome={p.icona} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src="/logo/gifty-icona.png" alt="" width={24} height={24} className="h-6 w-6" />
                  )}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="font-semibold leading-snug text-ink">
                    {i + 1}. {p.titolo}
                  </span>
                  {p.testo ? <span className="text-sm text-ink-soft">{p.testo}</span> : null}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="gutter">
          <ul className="contenitore divide-y divide-line overflow-hidden">
            <li className="flex items-start gap-4 p-4">
              <span className={RIQUADRO_ICONA}>
                <Icona nome="verified_user" piena />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="font-semibold text-ink">Nessuna registrazione</span>
                <span className="text-sm text-ink-soft">Chi partecipa scrive solo il suo nome: niente account né password.</span>
              </span>
            </li>
            <li className="flex items-start gap-4 p-4">
              <span className={RIQUADRO_ICONA}>
                <Icona nome="payments" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="font-semibold text-ink">I soldi vanno a te</span>
                <span className="text-sm text-ink-soft">Con PayPal, Satispay, bonifico o contanti. Noi non li tocchiamo.</span>
              </span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
