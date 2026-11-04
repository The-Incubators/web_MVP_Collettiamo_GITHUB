import Link from "next/link";
import { BottoneCuore } from "@/components/BottoneCuore";
import { BottoneLink, Icona, ImmagineProdotto, type NomeIcona } from "@/components/ui";
import { datiServer } from "@/lib/dati";
import { SLUG_DEMO } from "@/lib/dati/demo";
import { REL_LINK_PRODOTTO, urlPerAcquisto } from "@/lib/dominio/amazon";
import { formattaEuro } from "@/lib/dominio/importi";
import { quotaProposta } from "@/lib/dominio/quota";
import type { Prodotto } from "@/lib/tipi";

/**
 * Le due home del sito. Cambia solo la parte in alto: la «classica» (il titolo sul regalo di gruppo, fino al
 * 4 novembre 2026) e la «nuova», in prova, con tre strade (trova un regalo, biglietto, regalo di gruppo).
 * Sotto, la classica ha «Come funziona», il biglietto, le garanzie e «Idee più amate»; la nuova va dritta ai regali
 * più amati (`RegaliPiuAmati`: gli stessi due prodotti, con «Guarda su Amazon»).
 * Su «/» va `HOME_ATTIVA`; la classica è anche su /regalo-di-gruppo, dove porta «Organizza un regalo di gruppo» della
 * nuova, e la nuova su /home-nuova (tutte e due non indicizzate).
 * Per tornare alla classica basta cambiare questa riga.
 */
export const HOME_ATTIVA: VersioneHome = "nuova";

export type VersioneHome = "classica" | "nuova";

/** Le stesse 12 persone che il calcolatore della scheda prodotto propone come punto di partenza. */
const PERSONE_ESEMPIO = 12;

/** I passi di «Come funziona». Senza `testo` il titolo va su più righe; `icona: null` mostra la scatola del logo. */
const PASSI: { titolo: string; testo?: string; icona: NomeIcona | null; tinta: string }[] = [
  { titolo: "Usa il nostro motore di ricerca per filtrare il catalogo", icona: "auto_awesome", tinta: "bg-cta-field text-cta-2" },
  { titolo: "Scegli il regalo", testo: "Dal nostro catalogo, o da un link", icona: "redeem", tinta: "bg-ok-field text-accent" },
  { titolo: "Manda un link", testo: "Nella chat WhatsApp del gruppo", icona: "share", tinta: "bg-cta-field text-cta-2" },
  { titolo: "Noi teniamo il conto", testo: "Vedi chi ha pagato, senza chiedere", icona: "checklist_rtl", tinta: "bg-gold-field text-gold" },
  { titolo: "Crea un biglietto di auguri che tutti possano firmare facilmente", icona: null, tinta: "bg-surface ring-2 ring-accent" },
];

/** Il pulsante grigio sotto quelli arancioni. */
const CLASSI_SECONDARIO =
  "flex min-h-12 w-full items-center justify-center gap-1.5 rounded-full bg-line px-4 text-sm font-bold text-accent transition-colors hover:bg-line-forte";

function AperturaClassica() {
  return (
    <section className="flex flex-col items-center gap-4 text-center">
      <h1 className="text-[32px] font-bold leading-[38px] tracking-tight text-ink">Il regalo di gruppo, senza dover rincorrere tutti.</h1>
      <p className="font-semibold italic text-ink-soft">
        Un solo link, tutti dentro,
        <br />e tu sai sempre chi manca…
      </p>
      <div className="flex w-full flex-col gap-2 pt-1">
        <BottoneLink href="/catalogo" variante="azione" pieno className="px-4">
          Organizza un regalo di gruppo <Icona nome="arrow_forward" dimensione={22} />
        </BottoneLink>
        <Link
          href={`/c/${SLUG_DEMO}`}
          className="flex min-h-12 w-full items-center justify-center gap-1.5 rounded-full bg-line px-4 text-sm font-bold text-accent transition-colors hover:bg-line-forte"
        >
          <Icona nome="visibility" dimensione={18} />
          Guarda cosa vedranno i partecipanti
        </Link>
      </div>
    </section>
  );
}

/** Un separatore fra le tre strade della home nuova. */
function Separatore() {
  return <hr className="mx-6 border-t-2 border-line-forte" />;
}

function AperturaNuova() {
  return (
    <section className="flex flex-col gap-4 text-center">
      <h1 className="font-sans text-xl font-medium italic leading-snug text-ink">
        Regalare qualcosa di originale,
        <br />
        non è mai stato così facile…
      </h1>
      <div className="flex flex-col gap-2">
        <BottoneLink href="/regalo" variante="azione" pieno className="px-4">
          Trova un regalo originale
        </BottoneLink>
        {/* la riga sotto dice quanto ci vuole; si può toccare anche lei, ma per tastiera e lettori di schermo il link è uno solo */}
        <Link href="/regalo" tabIndex={-1} aria-hidden="true" className={`${CLASSI_SECONDARIO} py-2 leading-tight`}>
          fatti aiutare dal nostro motore di ricerca (15 sec)
        </Link>
      </div>
      <Separatore />
      <div className="flex flex-col gap-2">
        <BottoneLink href="/biglietto/nuovo" variante="azione" pieno className="px-4">
          Invia un biglietto di Auguri
        </BottoneLink>
        <Link href="/biglietto/esempio" className={CLASSI_SECONDARIO}>
          <Icona nome="visibility" dimensione={18} />
          Guarda un esempio
        </Link>
      </div>
      <Separatore />
      <div className="flex flex-col gap-2">
        <BottoneLink href="/regalo-di-gruppo" variante="azione" pieno className="px-4">
          Organizza un regalo di gruppo <Icona nome="arrow_forward" dimensione={22} />
        </BottoneLink>
        <Link href={`/c/${SLUG_DEMO}`} className={CLASSI_SECONDARIO}>
          <Icona nome="visibility" dimensione={18} />
          Guarda cosa vedranno i partecipanti
        </Link>
      </div>
    </section>
  );
}

function ComeFunziona() {
  return (
    <section aria-labelledby="come-funziona" className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 id="come-funziona" className="text-xl font-semibold text-accent-2">
          Come funziona
        </h2>
        <span className="text-xs font-semibold text-ink-soft">{PASSI.length} semplici passi</span>
      </div>
      <ol className="flex flex-col gap-1.5">
        {PASSI.map((p, i) => (
          <li key={p.titolo} className="flex items-center gap-4 rounded-2xl bg-surface p-4 shadow-carta">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${p.tinta}`}>
              {p.icona ? (
                <Icona nome={p.icona} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/logo/gifty-icona.png" alt="" width={26} height={26} className="h-[26px] w-[26px]" />
              )}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-sm font-bold text-accent-2">
                {i + 1}. {p.titolo}
              </span>
              {p.testo ? <span className="truncate text-sm text-ink-soft">{p.testo}</span> : null}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function SchedaBiglietto() {
  return (
    <section className="flex flex-col gap-4 rounded-3xl border-2 border-line-forte bg-surface-2 p-6 shadow-carta">
      <div className="flex items-start justify-between">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-field text-gold shadow-carta">
          <Icona nome="favorite" dimensione={28} piena />
        </span>
        <span className="rounded-full bg-gold-line/40 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-ink">Gratuito</span>
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-accent-2">Biglietto firmato da tutti</h2>
        <p className="text-sm text-ink-soft">Raccogli firme, dediche e foto ricordo.</p>
      </div>
      {/* un assaggio di come appare un biglietto: è un esempio, non un conteggio */}
      <div aria-hidden="true" className="flex items-center gap-1">
        <div className="flex -space-x-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ok-field text-[11px] font-bold text-accent-2">LC</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cta-field text-[11px] font-bold text-cta-2">MG</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-field text-[11px] font-bold text-gold">AP</span>
        </div>
        <span className="pl-1 text-xs font-semibold text-ink-soft">«Buon compleanno Marco! 🎉»</span>
      </div>
      <div className="flex flex-col gap-2">
        <BottoneLink href="/biglietto/nuovo" variante="azione" pieno>
          <Icona nome="draw" dimensione={20} />
          Crea un biglietto
        </BottoneLink>
        <Link
          href="/biglietto/esempio"
          className="flex min-h-12 w-full items-center justify-center gap-1.5 rounded-full bg-line px-4 text-sm font-bold text-accent transition-colors hover:bg-line-forte"
        >
          <Icona nome="visibility" dimensione={18} />
          Guarda un esempio
        </Link>
      </div>
    </section>
  );
}

function Garanzie() {
  return (
    <section className="flex items-start gap-4 rounded-2xl bg-surface p-4 shadow-carta">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ok-field text-accent">
        <Icona nome="verified_user" dimensione={22} piena />
      </span>
      <div className="flex min-w-0 flex-col gap-1.5">
        <h2 className="flex items-center gap-1.5 font-sans text-xs font-bold text-accent-2">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />
          Nessuna registrazione
        </h2>
        <p className="text-sm leading-snug text-ink-soft">Chi partecipa scrive solo il suo nome: niente account né password.</p>
        <h2 className="flex items-center gap-1.5 pt-1 font-sans text-xs font-bold text-accent-2">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-cta" />I soldi vanno a te
        </h2>
        <p className="text-sm leading-snug text-ink-soft">Con PayPal, Satispay, bonifico o contanti. Noi non li tocchiamo.</p>
      </div>
    </section>
  );
}

function IdeeInEvidenza({ inEvidenza }: { inEvidenza: Prodotto[] }) {
  if (!inEvidenza.length) return null;
  return (
    <section aria-labelledby="idee" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 id="idee" className="text-xl font-semibold text-accent-2">
            Idee più amate
          </h2>
          <p className="text-sm text-ink-soft">Pronte da regalare in gruppo</p>
        </div>
        <Link href="/catalogo" className="flex min-h-tocco items-center text-xs font-bold text-accent">
          Tutte <Icona nome="chevron_right" dimensione={16} />
        </Link>
      </div>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {inEvidenza.map((p) => (
          <li key={p.slug} className="flex flex-col gap-2 rounded-3xl bg-surface p-4 shadow-carta">
            <Link href={`/prodotto/${p.slug}`} className="relative block overflow-hidden rounded-2xl">
              <ImmagineProdotto prodotto={p} className="h-44" />
              <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-gold-field px-2 py-1 text-[11px] font-bold text-ink shadow-carta">
                <Icona nome="group" dimensione={14} />
                In {PERSONE_ESEMPIO}: {formattaEuro(quotaProposta(p.prezzoCent, PERSONE_ESEMPIO))} a testa
              </span>
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
            <Link
              href={`/crea?prodotto=${encodeURIComponent(p.slug)}`}
              className="flex min-h-tocco w-full items-center justify-center gap-1.5 rounded-full bg-surface-2 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-on-accent"
            >
              <Icona nome="featured_seasonal_and_gifts" dimensione={18} />
              Regala in gruppo
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * I regali in evidenza della home nuova: titolo in corsivo al centro, il cuore dei preferiti sulla foto e
 * «Guarda su Amazon» al posto di «Regala in gruppo» e della quota a testa (per il gruppo c'è /regalo-di-gruppo).
 */
function RegaliPiuAmati({ inEvidenza }: { inEvidenza: Prodotto[] }) {
  if (!inEvidenza.length) return null;
  return (
    <section aria-labelledby="regali-amati" className="flex flex-col gap-6">
      <Separatore />
      <h2 id="regali-amati" className="text-center font-sans text-xl font-bold italic leading-snug text-ink">
        I Regali più amati dai nostri clienti…
      </h2>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {inEvidenza.map((p) => (
          <li key={p.slug} className="flex flex-col gap-2 rounded-3xl bg-surface p-4 shadow-carta">
            <div className="relative">
              <Link href={`/prodotto/${p.slug}`} className="block overflow-hidden rounded-2xl" tabIndex={-1} aria-hidden="true">
                <ImmagineProdotto prodotto={p} className="h-44" />
              </Link>
              <BottoneCuore slug={p.slug} nome={p.nome} className="absolute right-2 top-2" />
            </div>
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
          </li>
        ))}
      </ul>
    </section>
  );
}

/** La home intera; le idee in evidenza vengono dal catalogo vero, nell'ordine deciso nell'area riservata. */
export async function PaginaHome({ versione }: { versione: VersioneHome }) {
  const prodotti = await datiServer().elencaProdotti();
  const inEvidenza = prodotti.slice(0, 2);

  return (
    <div className="gutter pb-10 pt-4 sm:pt-10">
      <div className="mx-auto flex max-w-lg flex-col gap-8">
        {versione === "nuova" ? (
          // la nuova va dai pulsanti dritta ai regali
          <>
            <AperturaNuova />
            <RegaliPiuAmati inEvidenza={inEvidenza} />
          </>
        ) : (
          <>
            <AperturaClassica />
            <ComeFunziona />
            <SchedaBiglietto />
            <Garanzie />
            <IdeeInEvidenza inEvidenza={inEvidenza} />
          </>
        )}
      </div>
    </div>
  );
}
