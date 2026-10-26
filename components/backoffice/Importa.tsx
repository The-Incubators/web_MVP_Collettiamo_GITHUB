"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useIntestazioniAdmin } from "@/lib/admin/client";
import { fotoPerInvio, leggiCartella, leggiZipCartella, type LetturaCartella } from "@/lib/importazione/cartella";
import type { Candidato } from "@/lib/importazione/tipi";
import { Avviso, Barra, Bottone, BottoneLink } from "@/components/ui";
import { formattaEuro } from "@/lib/dominio/importi";

interface Esito {
  id: string;
  nome: string;
  stato: "aggiunto" | "duplicato" | "errore";
  dettaglio?: string;
}

/**
 * Fase 1: si sceglie la cartella dell'agente (o il suo zip), si vede cosa entra e cosa no, e i prodotti buoni
 * vanno in revisione, uno per richiesta. Sotto, i conteggi e l'esportazione delle decisioni per l'agente.
 */
export function Importa() {
  const intestazioni = useIntestazioniAdmin();
  const [lettura, setLettura] = useState<LetturaCartella | null>(null);
  const [problema, setProblema] = useState<string | null>(null);
  const [leggo, setLeggo] = useState(false);
  const [invio, setInvio] = useState<{ fatti: number; totale: number } | null>(null);
  const [esiti, setEsiti] = useState<Esito[] | null>(null);
  const [conteggi, setConteggi] = useState<{ revisione: number; importati: number; scartati: number } | null>(null);
  const [vietato, setVietato] = useState(false);
  const cartella = useRef<HTMLInputElement>(null);
  const zip = useRef<HTMLInputElement>(null);

  const aggiornaConteggi = useCallback(async () => {
    const r = await fetch("/api/admin/importazione", { headers: await intestazioni(), cache: "no-store" });
    if (r.status === 403) return setVietato(true);
    const dati = (await r.json()) as { ok: boolean; candidati: Candidato[] };
    if (!dati.ok) return;
    const conta = (s: Candidato["stato"]) => dati.candidati.filter((c) => c.stato === s).length;
    setConteggi({ revisione: conta("in_revisione"), importati: conta("importato"), scartati: conta("scartato") });
  }, [intestazioni]);

  useEffect(() => {
    void aggiornaConteggi().catch(() => {});
  }, [aggiornaConteggi]);

  // La cartella si sceglie per intero: React non conosce l'attributo, si mette a mano.
  useEffect(() => {
    cartella.current?.setAttribute("webkitdirectory", "");
  }, []);

  async function leggi(come: () => Promise<LetturaCartella>) {
    setProblema(null);
    setEsiti(null);
    setLettura(null);
    setLeggo(true);
    try {
      setLettura(await come());
    } catch (e) {
      setProblema(e instanceof Error ? e.message : "Non riesco a leggere la cartella.");
    } finally {
      setLeggo(false);
      if (cartella.current) cartella.current.value = "";
      if (zip.current) zip.current.value = "";
    }
  }

  async function invia() {
    if (!lettura) return;
    const risultati: Esito[] = [];
    setInvio({ fatti: 0, totale: lettura.pronti.length });
    for (const [i, p] of lettura.pronti.entries()) {
      try {
        const foto = await fotoPerInvio(p.foto);
        const r = await fetch("/api/admin/importazione", {
          method: "POST",
          headers: { "content-type": "application/json", ...(await intestazioni()) },
          body: JSON.stringify({ dati: p.dati, foto, lotto: lettura.lotto }),
        });
        const d = (await r.json()) as { ok: boolean; duplicato?: boolean; errore?: string };
        risultati.push({ id: p.dati.idOrigine, nome: p.dati.nome, stato: d.ok ? "aggiunto" : d.duplicato ? "duplicato" : "errore", dettaglio: d.errore });
      } catch (e) {
        risultati.push({ id: p.dati.idOrigine, nome: p.dati.nome, stato: "errore", dettaglio: e instanceof Error ? e.message : "invio non riuscito" });
      }
      setInvio({ fatti: i + 1, totale: lettura.pronti.length });
    }
    setEsiti(risultati);
    setInvio(null);
    setLettura(null);
    void aggiornaConteggi().catch(() => {});
  }

  async function scarica(formato: "csv" | "json") {
    const r = await fetch(`/api/admin/importazione/esporta?formato=${formato}`, { headers: await intestazioni(), cache: "no-store" });
    if (!r.ok) return setProblema("Non sono riuscito a preparare il file. Riprova.");
    const nome = /filename="([^"]+)"/.exec(r.headers.get("content-disposition") ?? "")?.[1] ?? `decisioni.${formato}`;
    const url = URL.createObjectURL(await r.blob());
    const a = document.createElement("a");
    a.href = url;
    a.download = nome;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (vietato) {
    return <Avviso tono="attenzione">Questo account non è autorizzato a gestire il catalogo.</Avviso>;
  }

  const aggiunti = esiti?.filter((e) => e.stato === "aggiunto").length ?? 0;
  const decise = (conteggi?.importati ?? 0) + (conteggi?.scartati ?? 0);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-[32px] font-bold leading-[38px] tracking-tight text-accent-2">Importa prodotti nuovi</h1>
        <p className="text-ink-soft">
          Carica la cartella preparata dal tuo agente: un file Excel e la cartella <strong>immagini/</strong>. I prodotti non vanno subito nel sito: finiscono{" "}
          <strong>in revisione</strong>, e lì decidi tu, uno per uno, se importarli o scartarli.
        </p>
      </header>

      <section aria-labelledby="carica" className="contenitore flex flex-col gap-4 p-5">
        <h2 id="carica" className="text-xl font-semibold text-accent-2">
          1. Scegli la cartella
        </h2>
        <div className="flex flex-wrap gap-3">
          <label className="inline-flex min-h-azione cursor-pointer items-center justify-center rounded-full bg-accent px-6 font-bold text-on-accent hover:bg-accent-2">
            Scegli la cartella
            <input
              ref={cartella}
              type="file"
              multiple
              className="sr-only"
              disabled={leggo || !!invio}
              onChange={(e) => e.target.files?.length && void leggi(() => leggiCartella(e.target.files!))}
            />
          </label>
          <label className="inline-flex min-h-azione cursor-pointer items-center justify-center rounded-full border-[1.5px] border-line bg-surface px-6 font-bold text-accent hover:border-accent">
            …oppure il file .zip
            <input
              ref={zip}
              type="file"
              accept=".zip,application/zip"
              className="sr-only"
              disabled={leggo || !!invio}
              onChange={(e) => e.target.files?.[0] && void leggi(() => leggiZipCartella(e.target.files![0]))}
            />
          </label>
        </div>
        <p className="text-sm text-ink-soft">
          Le colonne sono quelle di sempre (ID prodotto, Nome prodotto, Marca, Descrizione breve, Perché è interessante, Uomo, Donna, Viaggio, Tecnologia,
          Arredamento, Prezzo rilevato (EUR), ASIN, Link Amazon, Immagine locale, Data rilevazione; Sottocategoria è facoltativa).
        </p>
        {leggo ? <p role="status" className="text-sm text-ink-soft">Leggo la cartella…</p> : null}
        {problema ? (
          <Avviso tono="attenzione" live>
            <p>{problema}</p>
          </Avviso>
        ) : null}
      </section>

      {lettura ? (
        <section aria-labelledby="controllo" className="contenitore flex flex-col gap-4 p-5">
          <h2 id="controllo" className="text-xl font-semibold text-accent-2">
            2. Controlla e metti in revisione
          </h2>
          <p>
            Cartella <strong>«{lettura.lotto}»</strong>: <strong>{lettura.pronti.length}</strong> {lettura.pronti.length === 1 ? "prodotto pronto" : "prodotti pronti"}
            {lettura.errori.length ? (
              <>
                , <strong className="text-error">{lettura.errori.length}</strong> con problemi (non verranno caricati)
              </>
            ) : null}
            .
          </p>
          {lettura.errori.length ? (
            <details className="rounded-2xl bg-error-field px-4 py-2 text-sm">
              <summary className="min-h-tocco cursor-pointer py-2 font-bold">Vedi i problemi</summary>
              <ul className="flex flex-col gap-1 pb-2">
                {lettura.errori.map((e, i) => (
                  <li key={`${e.id}-${i}`}>
                    <strong>{e.id}</strong>: {e.errori.join("; ")}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
          {lettura.pronti.length ? (
            <ul className="grid max-h-80 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
              {lettura.pronti.map((p) => (
                <li key={p.dati.asin} className="flex items-center gap-2 rounded-2xl bg-surface-2 p-2 text-sm">
                  <span className="w-16 shrink-0 font-semibold text-ink-soft">{p.dati.idOrigine}</span>
                  <span className="min-w-0 flex-1 truncate">{p.dati.nome}</span>
                  <span className="cifre shrink-0 font-bold">{formattaEuro(p.dati.prezzoCent)}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {invio ? (
            <div className="flex flex-col gap-2" role="status">
              <Barra percento={(invio.fatti / invio.totale) * 100} etichetta="Prodotti caricati" />
              <p className="text-sm text-ink-soft">
                Carico {invio.fatti} di {invio.totale}… non chiudere la pagina.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <Bottone variante="azione" onClick={() => void invia()} disabled={lettura.pronti.length === 0}>
                Metti in revisione {lettura.pronti.length} {lettura.pronti.length === 1 ? "prodotto" : "prodotti"}
              </Bottone>
              <Bottone variante="testuale" onClick={() => setLettura(null)}>
                Annulla
              </Bottone>
            </div>
          )}
        </section>
      ) : null}

      {esiti ? (
        <section aria-labelledby="fatto" className="contenitore flex flex-col gap-3 p-5" aria-live="polite">
          <h2 id="fatto" className="text-xl font-semibold text-accent-2">
            Fatto: {aggiunti} {aggiunti === 1 ? "prodotto in revisione" : "prodotti in revisione"}
          </h2>
          {esiti.some((e) => e.stato !== "aggiunto") ? (
            <ul className="flex flex-col gap-1 text-sm">
              {esiti
                .filter((e) => e.stato !== "aggiunto")
                .map((e) => (
                  <li key={e.id}>
                    <strong>{e.id}</strong> {e.nome}: {e.stato === "duplicato" ? "non caricato, " : "errore, "}
                    {e.dettaglio}
                  </li>
                ))}
            </ul>
          ) : null}
          {aggiunti > 0 ? (
            <BottoneLink href="/backoffice/revisione" variante="azione" className="self-start">
              Vai alla revisione
            </BottoneLink>
          ) : null}
        </section>
      ) : null}

      <section aria-labelledby="decisioni" className="contenitore flex flex-col gap-4 p-5">
        <h2 id="decisioni" className="text-xl font-semibold text-accent-2">
          Le tue decisioni, per l’agente
        </h2>
        {conteggi ? (
          <dl className="grid grid-cols-3 gap-2 text-center">
            {[
              { n: conteggi.revisione, t: "in revisione" },
              { n: conteggi.importati, t: "importati (ottimi)" },
              { n: conteggi.scartati, t: "scartati (sbagliati)" },
            ].map((x) => (
              <div key={x.t} className="rounded-2xl bg-surface-2 p-3">
                <dt className="text-xs text-ink-soft">{x.t}</dt>
                <dd className="cifre text-2xl font-extrabold">{x.n}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        <p className="text-sm text-ink-soft">
          Ogni decisione resta salvata con i motivi e la tua nota. Scarica il file e dallo al tuo agente come esempi di prodotti «ottimi» e «sbagliati».
        </p>
        <div className="flex flex-wrap gap-3">
          <Bottone variante="secondario" onClick={() => void scarica("json")} disabled={decise === 0}>
            Scarica JSON
          </Bottone>
          <Bottone variante="secondario" onClick={() => void scarica("csv")} disabled={decise === 0}>
            Scarica CSV (Excel)
          </Bottone>
          {conteggi?.revisione ? (
            <Link href="/backoffice/revisione" className="inline-flex min-h-tocco items-center text-sm font-bold text-accent underline underline-offset-4">
              {conteggi.revisione} da rivedere →
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  );
}
