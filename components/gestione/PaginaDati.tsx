"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { NOMI_METODO } from "@/components/partecipante/PannelloPagamento";
import { Avviso, Bottone } from "@/components/ui";
import { calcolaImbuto, formattaDurata } from "@/lib/dominio/imbuto";
import type { Evento, Metodo } from "@/lib/tipi";
import { useGestione } from "./useGestione";

/** La domanda a cui risponde il prototipo: dopo aver pagato, il partecipante torna e tocca «Ho pagato» senza che nessuno glielo chieda? */
export function PaginaDati({ slug }: { slug: string }) {
  const { dati } = useApp();
  const g = useGestione(slug);
  const [eventi, setEventi] = useState<Evento[] | null>(null);
  const [errore, setErrore] = useState(false);

  const carica = useCallback(() => {
    setErrore(false);
    dati
      .eventi(slug)
      .then(setEventi)
      .catch(() => setErrore(true));
  }, [dati, slug]);

  useEffect(() => {
    if (g.carico === "ok") carica();
  }, [g.carico, carica]);

  if (g.carico === "caricamento") return <p className="py-10 text-center text-ink-soft">Carico…</p>;
  const imbuto = eventi ? calcolaImbuto(eventi) : null;
  const massimo = imbuto ? Math.max(1, ...imbuto.passi.map((p) => p.numero)) : 1;

  return (
    <div className="mx-auto flex max-w-dashboard flex-col gap-5">
      <header className="flex flex-col gap-2">
        <Link href={`/gestisci/${slug}`} className="inline-flex min-h-10 items-center gap-1 self-start rounded-full bg-surface-2 px-4 text-sm font-bold">
          Torna alla raccolta
        </Link>
        <h1 className="text-[32px] font-bold leading-[38px] tracking-tight text-accent-2">Statistiche</h1>
        <p className="text-ink-soft">Persone distinte, non clic. Nessuno strumento di terze parti, nessun cookie di tracciamento.</p>
      </header>

      {errore ? (
        <Avviso tono="attenzione">
          <p>Non riesco a leggere i dati.</p>
          <Bottone variante="secondario" dimensione="piccolo" className="self-start" onClick={carica}>
            Riprova
          </Bottone>
        </Avviso>
      ) : null}
      {!imbuto && !errore ? <p className="text-ink-soft">Carico i dati…</p> : null}

      {imbuto ? (
        <>
          <section aria-labelledby="metrica" className="rounded-3xl bg-accent p-5 text-on-accent">
            <h2 id="metrica" className="text-lg">
              La metrica che conta
            </h2>
            <p className="cifre mt-1 text-4xl font-bold">
              {imbuto.dichiarazioniSpontanee} <span className="text-xl font-medium opacity-80">su {imbuto.dichiarazioniTotali}</span>
            </p>
            <p className="text-sm">
              {imbuto.dichiarazioniTotali === 0
                ? "Nessuna dichiarazione ancora."
                : "dichiarazioni sono arrivate prima di qualunque promemoria: nessuno ha dovuto chiedere."}
              {imbuto.solleciti > 0 ? ` Promemoria inoltrati finora: ${imbuto.solleciti}.` : ""}
            </p>
          </section>

          <section aria-labelledby="imbuto" className="flex flex-col gap-3">
            <h2 id="imbuto" className="text-xl font-semibold text-accent-2">
              Dall’apertura al biglietto
            </h2>
            <div className="contenitore overflow-x-auto">
              <table className="w-full min-w-[34rem] text-left text-sm">
                <caption className="sr-only">Imbuto: persone per passaggio, percentuale sul passaggio precedente, tempo mediano</caption>
                <thead>
                  <tr className="border-b border-line text-ink-soft">
                    <th scope="col" className="p-3 font-medium">Passaggio</th>
                    <th scope="col" className="p-3 text-right font-medium">Persone</th>
                    <th scope="col" className="p-3 text-right font-medium">Sul precedente</th>
                    <th scope="col" className="p-3 text-right font-medium">Tempo mediano</th>
                  </tr>
                </thead>
                <tbody>
                  {imbuto.passi.map((p) => (
                    <tr key={p.tipo} className="border-b border-line last:border-0">
                      <th scope="row" className="p-3 font-semibold">
                        <span>{p.etichetta}</span>
                        <span aria-hidden="true" className="mt-1 block h-2 rounded-full bg-accent" style={{ width: `${Math.max(3, (p.numero / massimo) * 100)}%` }} />
                      </th>
                      <td className="cifre p-3 text-right text-lg font-bold">{p.numero}</td>
                      <td className="cifre p-3 text-right">{p.percentuale === null ? "—" : `${p.percentuale}%`}</td>
                      <td className="cifre p-3 text-right">{formattaDurata(p.medianaMs)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="metodi" className="grid gap-4 sm:grid-cols-2">
            <div className="contenitore flex flex-col gap-2 p-4">
              <h2 id="metodi" className="text-lg">
                Metodi scelti
              </h2>
              {imbuto.metodi.length === 0 ? <p className="text-sm text-ink-soft">Nessuno ancora.</p> : null}
              <ul className="flex flex-col gap-1">
                {imbuto.metodi.map((m) => (
                  <li key={m.metodo} className="flex justify-between">
                    <span>{NOMI_METODO[m.metodo as Metodo] ?? m.metodo}</span>
                    <span className="cifre font-bold">{m.numero}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="contenitore flex flex-col gap-1 p-4">
              <h2 className="text-lg">Dal metodo alla dichiarazione</h2>
              <p className="cifre text-3xl font-bold">{formattaDurata(imbuto.medianaScelteDichiarazioneMs)}</p>
              <p className="text-sm text-ink-soft">tempo mediano fra «ho scelto come pagare» e «ho pagato»</p>
            </div>
          </section>
          <Bottone variante="secondario" className="self-start" onClick={carica}>
            Aggiorna
          </Bottone>
        </>
      ) : null}
    </div>
  );
}
