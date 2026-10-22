import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BottoneStampa } from "@/components/BottoneStampa";
import { datiServer } from "@/lib/dati";
import { dataLunga } from "@/lib/dominio/date";
import { slugValido } from "@/lib/dominio/slug";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Il biglietto", robots: { index: false, follow: false } };

type Props = { params: Promise<{ slug: string }> };

export default async function Biglietto({ params }: Props) {
  const { slug } = await params;
  if (!slugValido(slug)) notFound();
  const dati = datiServer();
  const c = await dati.colletta(slug);
  if (!c || c.stato === "bozza") notFound();

  const firmatari = (await dati.partecipanti(slug))
    .filter((r) => r.stato === "dichiarato" || r.stato === "confermato")
    .sort((a, b) => a.creatoIl - b.creatoIl);
  const messaggi = firmatari.filter((r) => r.messaggio);

  return (
    <>
      {/* Il biglietto si stampa in A5, senza nessun elemento dell'interfaccia. */}
      <style>{"@page { size: A5; margin: 12mm; } @media print { body { background: #fff !important; color: #000 !important; } main { max-width: none !important; padding: 0 !important; } }"}</style>
      <div className="no-stampa mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/c/${slug}`} className="inline-flex min-h-tocco items-center text-sm font-bold text-accent underline underline-offset-4">
          Torna alla colletta
        </Link>
        <BottoneStampa />
      </div>

      <article className="flex flex-col gap-6 rounded-3xl bg-surface p-6 shadow-carta print:rounded-none print:p-0 print:shadow-none">
        <header className="flex flex-col gap-1 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-cta-2">{c.occasione}</p>
          <h1 className="text-[32px] font-bold leading-tight text-accent-2">Per {c.festeggiato}</h1>
          <p className="text-sm text-ink-soft">{dataLunga(c.dataRegalo)}</p>
        </header>

        {messaggi.length === 0 ? (
          <p className="text-center text-ink-soft">Nessun messaggio ancora: lo spazio resta libero per scrivere a mano.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {messaggi.map((r) => (
              <li key={r.id} className="break-inside-avoid rounded-2xl bg-surface-2 p-4 print:rounded-none print:border-l-4 print:border-black print:bg-transparent print:p-0 print:pl-4">
                <p className="whitespace-pre-wrap">{r.messaggio}</p>
                <p className="text-sm font-semibold">— {r.nome}</p>
              </li>
            ))}
          </ul>
        )}

        <footer className="flex flex-col gap-1 border-t border-line pt-4 text-center">
          <p className="font-display text-lg font-bold">Con affetto, da tutti noi</p>
          <p className="text-sm text-ink-soft">{firmatari.map((r) => r.nome).join(", ")}</p>
        </footer>
      </article>
    </>
  );
}
