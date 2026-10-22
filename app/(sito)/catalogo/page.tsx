import type { Metadata } from "next";
import Link from "next/link";
import { FiltriCatalogo } from "@/components/FiltriCatalogo";
import { SchedaProdotto } from "@/components/SchedaProdotto";
import { datiServer } from "@/lib/dati";
import { chiaveSottocategoria, testoRilevazioneCatalogo } from "@/lib/dominio/regali";
import { DESTINATARI, FASCE_PREZZO, TEMI } from "@/lib/tipi";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catalogo",
  description: "Idee regalo da dividere in gruppo: scegli, imposta la quota e manda il link.",
};

type Filtri = { per?: string; tema?: string; tipo?: string; fascia?: string };

const maiuscola = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

function href(attuali: Filtri, cambia: Partial<Filtri>): string {
  const unito = { ...attuali, ...cambia };
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(unito)) if (v) q.set(k, v);
  const s = q.toString();
  return s ? `/catalogo?${s}` : "/catalogo";
}

function GruppoFiltro({
  titolo,
  chiave,
  opzioni,
  attuali,
}: {
  titolo: string;
  chiave: keyof Filtri;
  opzioni: { valore: string; etichetta: string }[];
  attuali: Filtri;
}) {
  return (
    <div role="group" aria-label={titolo} className="flex flex-col gap-2">
      <h2 className="font-sans text-sm font-semibold text-ink-soft">{titolo}</h2>
      <ul className="flex flex-wrap gap-2">
        {opzioni.map((o) => {
          const attivo = attuali[chiave] === o.valore;
          return (
            <li key={o.valore}>
              <Link
                href={href(attuali, { [chiave]: attivo ? undefined : o.valore })}
                aria-current={attivo ? "true" : undefined}
                className={`inline-flex min-h-tocco items-center rounded-full border px-4 text-sm font-medium transition-colors ${
                  attivo ? "border-accent bg-accent text-on-accent" : "border-line bg-surface hover:bg-surface-2"
                }`}
              >
                {o.etichetta}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default async function Catalogo({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const prendi = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const filtri: Filtri = {
    per: DESTINATARI.find((o) => o === prendi("per")),
    tema: TEMI.find((c) => c === prendi("tema")),
    fascia: FASCE_PREZZO.find((f) => f.id === prendi("fascia"))?.id,
  };
  const dati = datiServer();
  const tutti = await dati.elencaProdotti();
  // Le sottocategorie (lampade, vasi, specchi…) si offrono se esistono; il filtro vale solo se la chiave è una di queste.
  const tipi = [...new Map(tutti.filter((p) => p.sottocategoria).map((p) => [chiaveSottocategoria(p.sottocategoria as string), p.sottocategoria as string])).entries()]
    .map(([valore, etichetta]) => ({ valore, etichetta }))
    .sort((a, b) => a.etichetta.localeCompare(b.etichetta, "it"));
  filtri.tipo = tipi.find((t) => t.valore === prendi("tipo"))?.valore;
  const prodotti = await dati.elencaProdotti(filtri);
  // Si offrono solo le fasce di prezzo in cui c'è qualcosa.
  const fasce = FASCE_PREZZO.filter((f) => tutti.some((p) => p.prezzoCent > f.minCent && p.prezzoCent <= f.maxCent));
  const nFiltri = Object.values(filtri).filter(Boolean).length;

  return (
    <div className="gutter pb-32 pt-6">
      <div className="mx-auto flex max-w-catalogo flex-col gap-5">
        <h1 className="text-center text-2xl sm:text-3xl">Guarda il nostro catalogo prodotti</h1>

        <FiltriCatalogo attivi={nFiltri} conteggio={prodotti.length === 1 ? "1 idea" : `${prodotti.length} idee`}>
          <GruppoFiltro titolo="Per chi" chiave="per" attuali={filtri} opzioni={DESTINATARI.map((o) => ({ valore: o, etichetta: maiuscola(o) }))} />
          <GruppoFiltro titolo="Tema" chiave="tema" attuali={filtri} opzioni={TEMI.map((c) => ({ valore: c, etichetta: maiuscola(c) }))} />
          {tipi.length > 0 ? <GruppoFiltro titolo="Tipo (arredamento e design)" chiave="tipo" attuali={filtri} opzioni={tipi} /> : null}
          <GruppoFiltro titolo="Prezzo" chiave="fascia" attuali={filtri} opzioni={fasce.map((f) => ({ valore: f.id, etichetta: f.etichetta }))} />
          {nFiltri > 0 ? (
            <Link href="/catalogo" className="inline-flex min-h-tocco items-center text-sm font-semibold text-accent-2 underline underline-offset-4">
              Azzera i filtri
            </Link>
          ) : null}
        </FiltriCatalogo>

        <section aria-label="Prodotti" className="flex flex-col gap-4">
          {prodotti.length === 0 ? (
            <p className="contenitore p-6 text-ink-soft">Nessun regalo con questi filtri. Prova ad allargare la ricerca.</p>
          ) : (
            // Due prodotti per riga già da telefono: miniature più piccole, meno scorrimento.
            <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {prodotti.map((p) => (
                <li key={p.slug} className="flex">
                  <div className="flex w-full flex-col [&>article]:flex-1">
                    <SchedaProdotto prodotto={p} compatta />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-center text-sm text-ink-soft">
          Nessun acquisto qui: scegli, imposta la quota e manda il link al gruppo; compri tu, su Amazon.it. Prezzi rilevati su Amazon.it il {testoRilevazioneCatalogo(tutti) || "14 ottobre 2026"}: possono essere cambiati.
        </p>
      </div>
    </div>
  );
}
