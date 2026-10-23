import type { Metadata } from "next";
import Link from "next/link";
import { FiltriCatalogo } from "@/components/FiltriCatalogo";
import { PERSONE_PREDEFINITE, SchedaProdotto } from "@/components/SchedaProdotto";
import { Icona } from "@/components/ui";
import { datiServer } from "@/lib/dati";
import { testoRilevazioneCatalogo } from "@/lib/dominio/regali";
import { DESTINATARI, FASCE_PREZZO, TEMI, type Prodotto } from "@/lib/tipi";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catalogo",
  description: "Idee regalo da dividere in gruppo: scegli, imposta la quota e manda il link.",
};

/** Quanti prodotti si mostrano all'inizio e a ogni «Mostra altre idee»: 180 schede in una volta pesano troppo. */
const PER_PAGINA = 24;

/**
 * Tutto lo stato della pagina vive nell'indirizzo, così la pagina filtrata si può condividere:
 * filtri, ricerca (`q`), persone della simulazione e quanti prodotti si vedono (`mostra`).
 */
type Stato = { per?: string; tema?: string; fascia?: string; q?: string; persone?: string; mostra?: string };

/**
 * Le categorie del filtro: i tre temi del catalogo più «Design», che non è un tema nei dati ma sono i pezzi
 * del pacchetto «arredamento e design», cioè i prodotti con un tipo (lampade, vasi, specchi…). Il vecchio
 * filtro per tipo (`tipo=` nell'indirizzo) non c'è più: un link che lo porta ancora si apre e lo ignora.
 */
const DESIGN = "design";
const CATEGORIE: { valore: string; etichetta: string }[] = [
  { valore: "tecnologia", etichetta: "Tecnologia" },
  { valore: "arredamento", etichetta: "Arredamento" },
  { valore: DESIGN, etichetta: "Design" },
  { valore: "viaggio", etichetta: "Viaggio" },
];

const maiuscola = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const normalizza = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function href(attuale: Stato, cambia: Partial<Stato>): string {
  // cambiando filtri o ricerca si riparte dalla prima pagina di risultati
  const unito: Stato = { ...attuale, ...("mostra" in cambia ? {} : { mostra: undefined }), ...cambia };
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(unito)) if (v) q.set(k, v);
  const s = q.toString();
  return s ? `/catalogo?${s}` : "/catalogo";
}

/** Un gruppo di pillole a scelta singola. `tutti` aggiunge in fondo la voce che toglie il filtro («Nessun filtro»). */
function GruppoFiltro({
  titolo,
  chiave,
  opzioni,
  stato,
  tutti,
}: {
  titolo: string;
  chiave: keyof Stato;
  opzioni: { valore: string; etichetta: string }[];
  stato: Stato;
  tutti?: string;
}) {
  return (
    <div role="group" aria-label={titolo} className="flex flex-col gap-2">
      <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-ink-soft">{titolo}</h3>
      <ul className="flex flex-wrap gap-2">
        {[...opzioni, ...(tutti ? [{ valore: "", etichetta: tutti }] : [])].map((o) => {
          const attivo = o.valore ? stato[chiave] === o.valore : !stato[chiave];
          return (
            <li key={o.valore}>
              <Link
                href={href(stato, { [chiave]: attivo || !o.valore ? undefined : o.valore })}
                scroll={false}
                aria-current={attivo ? "true" : undefined}
                className={`inline-flex min-h-tocco items-center gap-1 rounded-full px-4 text-sm font-semibold transition-colors ${
                  attivo ? "bg-accent text-on-accent" : "bg-surface-2 hover:bg-line"
                }`}
              >
                {attivo ? <Icona nome="check" dimensione={16} /> : null}
                {o.etichetta}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function cercaNelTesto(p: Prodotto, testo: string): boolean {
  return normalizza(`${p.nome} ${p.marca} ${p.descrizione} ${p.sottocategoria ?? ""}`).includes(testo);
}

export default async function Catalogo({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const prendi = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const dati = datiServer();
  const tutti = await dati.elencaProdotti();
  // Si offrono solo le fasce di prezzo in cui c'è qualcosa.
  const fasce = FASCE_PREZZO.filter((f) => tutti.some((p) => p.prezzoCent > f.minCent && p.prezzoCent <= f.maxCent));

  const design = prendi("tema") === DESIGN;
  const filtri = {
    per: DESTINATARI.find((o) => o === prendi("per")),
    tema: TEMI.find((c) => c === prendi("tema")),
    fascia: FASCE_PREZZO.find((f) => f.id === prendi("fascia"))?.id,
  };
  const cerca = (prendi("q") ?? "").trim().slice(0, 60);
  const persone = Math.max(2, Math.min(50, Math.floor(Number(prendi("persone"))) || PERSONE_PREDEFINITE));
  const mostra = Math.max(PER_PAGINA, Math.floor(Number(prendi("mostra"))) || PER_PAGINA);
  const stato: Stato = {
    ...filtri,
    tema: filtri.tema ?? (design ? DESIGN : undefined),
    q: cerca || undefined,
    persone: persone !== PERSONE_PREDEFINITE ? String(persone) : undefined,
    mostra: mostra !== PER_PAGINA ? String(mostra) : undefined,
  };

  const filtrati = (await dati.elencaProdotti(filtri)).filter((p) => !design || !!p.sottocategoria);
  const prodotti = cerca ? filtrati.filter((p) => cercaNelTesto(p, normalizza(cerca))) : filtrati;
  const visibili = prodotti.slice(0, mostra);
  const nFiltri = [stato.per, stato.tema, stato.fascia].filter(Boolean).length;
  const conteggio = prodotti.length === 1 ? "1 idea" : `${prodotti.length} idee`;

  // le etichette dei filtri attivi, ognuna con il suo collegamento per toglierla
  const etichette: { testo: string; via: string }[] = [
    ...(filtri.per ? [{ testo: `Per ${filtri.per}`, via: href(stato, { per: undefined }) }] : []),
    ...(stato.tema ? [{ testo: CATEGORIE.find((c) => c.valore === stato.tema)?.etichetta ?? maiuscola(stato.tema), via: href(stato, { tema: undefined }) }] : []),
    ...(filtri.fascia ? [{ testo: FASCE_PREZZO.find((f) => f.id === filtri.fascia)?.etichetta ?? "", via: href(stato, { fascia: undefined }) }] : []),
    ...(cerca ? [{ testo: `«${cerca}»`, via: href(stato, { q: undefined }) }] : []),
  ];

  return (
    <div className="gutter pb-10 pt-4">
      <div className="mx-auto flex max-w-catalogo flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[32px] font-bold leading-[38px] tracking-tight text-accent-2">Catalogo regali</h1>
            <span className="cifre rounded-full bg-ok-field px-3 py-1 text-xs font-bold text-ok">{tutti.length} idee</span>
          </div>
          <p className="text-sm text-ink-soft">Idee da dividere tra amici: scegli, e la quota la calcoliamo noi.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* un modulo GET: la ricerca finisce nell'indirizzo come i filtri, e funziona anche senza JavaScript */}
          <form action="/catalogo" role="search" className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-full bg-surface px-4 shadow-carta focus-within:ring-2 focus-within:ring-accent">
            {Object.entries({ per: stato.per, tema: stato.tema, fascia: stato.fascia, persone: stato.persone }).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
            <Icona nome="search" dimensione={22} className="text-ink-soft" />
            <label htmlFor="cerca-catalogo" className="sr-only">
              Cerca nel catalogo
            </label>
            <input
              id="cerca-catalogo"
              name="q"
              type="search"
              defaultValue={cerca}
              placeholder="Cerca un regalo…"
              enterKeyHint="search"
              className="min-w-0 flex-1 bg-transparent text-base placeholder:text-ink-soft focus:outline-none"
            />
          </form>
          <FiltriCatalogo attivi={nFiltri} conteggio={conteggio}>
            <GruppoFiltro titolo="Prezzo" chiave="fascia" stato={stato} opzioni={fasce.map((f) => ({ valore: f.id, etichetta: f.etichetta }))} tutti="Nessun filtro" />
            {/* «Uomo + Donna» è «nessun filtro per genere»: quasi tutto il catalogo è pensato per entrambi */}
            <GruppoFiltro titolo="Per chi" chiave="per" stato={stato} opzioni={DESTINATARI.map((o) => ({ valore: o, etichetta: maiuscola(o) }))} tutti="Uomo + Donna" />
            <GruppoFiltro titolo="Categoria" chiave="tema" stato={stato} opzioni={CATEGORIE} />
            {nFiltri > 0 ? (
              <Link href={href(stato, { per: undefined, tema: undefined, fascia: undefined })} scroll={false} className="self-start text-sm font-bold text-cta-2 underline underline-offset-4">
                Azzera i filtri
              </Link>
            ) : null}
          </FiltriCatalogo>
        </div>

        {etichette.length > 0 ? (
          <ul aria-label="Filtri attivi" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {etichette.map((e) => (
              <li key={e.testo} className="shrink-0">
                <Link href={e.via} scroll={false} className="inline-flex min-h-10 items-center gap-1 rounded-full bg-surface-2 pl-4 pr-3 text-sm font-semibold">
                  {e.testo}
                  <Icona nome="close" dimensione={16} />
                  <span className="sr-only">: togli il filtro</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface-2 py-1.5 pl-4 pr-1.5" role="group" aria-label="Simula la quota a testa">
          <p className="flex items-center gap-2 text-sm font-bold">
            <Icona nome="groups" dimensione={20} className="text-cta-2" />
            Simula per <span className="cifre">{persone}</span> invitati
          </p>
          <div className="flex items-center gap-1">
            <Link
              href={href(stato, { persone: String(Math.max(2, persone - 1)), mostra: stato.mostra })}
              scroll={false}
              aria-label="Una persona in meno"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface shadow-carta"
            >
              <Icona nome="remove" dimensione={20} />
            </Link>
            <Link
              href={href(stato, { persone: String(Math.min(50, persone + 1)), mostra: stato.mostra })}
              scroll={false}
              aria-label="Una persona in più"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface shadow-carta"
            >
              <Icona nome="add" dimensione={20} />
            </Link>
          </div>
        </div>

        <section aria-label="Prodotti" className="flex flex-col gap-4">
          {prodotti.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-3xl bg-surface p-8 text-center shadow-carta">
              <Icona nome="search" dimensione={32} className="text-ink-soft" />
              <p className="font-semibold">Nessun regalo con questi filtri.</p>
              <Link href="/catalogo" className="text-sm font-bold text-cta-2 underline underline-offset-4">
                Azzera tutto
              </Link>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {visibili.map((p) => (
                <li key={p.slug}>
                  <SchedaProdotto prodotto={p} persone={persone} />
                </li>
              ))}
            </ul>
          )}
          {prodotti.length > visibili.length ? (
            <Link
              href={href(stato, { mostra: String(mostra + PER_PAGINA) })}
              scroll={false}
              className="inline-flex min-h-12 items-center gap-1 self-center rounded-full bg-surface-2 px-6 text-sm font-bold hover:bg-line"
            >
              <Icona nome="expand_more" dimensione={20} />
              Mostra altre {Math.min(PER_PAGINA, prodotti.length - visibili.length)} idee
            </Link>
          ) : null}
        </section>

        <p className="text-center text-xs font-semibold text-ink-soft">
          Prezzi rilevati su Amazon.it il {testoRilevazioneCatalogo(tutti) || "14 ottobre 2026"}: possono essere cambiati.
        </p>
      </div>
    </div>
  );
}
