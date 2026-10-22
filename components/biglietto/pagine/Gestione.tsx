"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BloccoInvito } from "@/components/BloccoInvito";
import { BottoneCopia } from "@/components/ui";
import { classiBottone } from "@/components/ui/Bottone";
import { modelloPerId, MODELLI_BIGLIETTO } from "@/lib/dati/modelli-biglietto";
import { messaggioInvitoBiglietto, messaggioPromemoriaBiglietto, testoDaHtml } from "@/lib/dominio/biglietti";
import { firmeOrdinate } from "@/lib/dominio/biglietto";
import { baseUrlClient } from "@/lib/url";
import type { Biglietto, Firma } from "@/lib/tipi";
import { Finestra, IntestazioneWizard } from "../comuni";
import { nomeFuso } from "../campi";
import { StatoBozza } from "../StatoBozza";
import { useBozza } from "../useBozza";
import { useLarghezza } from "../useLarghezza";
import { Visualizzatore } from "../Visualizzatore";
import { ModuloDettagli } from "./Passo2";

const STATI: Record<Biglietto["stato"], string> = { bozza: "Bozza (non ancora pubblicato)", aperto: "Aperto: si può firmare", chiuso: "Chiuso", consegnato: "Consegnato" };

/**
 * Gestione (spec 4.5, non osservata nel dettaglio): prima versione con contatore ed elenco delle firme, condivisione,
 * promemoria, data di consegna, colonne e anteprima. Riordino, modifica ed eliminazione dei messaggi e PDF arrivano
 * con la fase successiva.
 */
export function Gestione({ id }: { id: string }) {
  const { b, setB, stato, api } = useBozza(id);
  const [firme, setFirme] = useState<Firma[] | null>(null);
  const [dettagli, setDettagli] = useState(false);
  const [url, setUrl] = useState("");
  const promemoria = useRef<HTMLParagraphElement>(null);
  const [rif, larghezza] = useLarghezza(420);

  const caricaFirme = useCallback(() => {
    api<{ firme: Firma[] }>(`/api/biglietti/${id}/firme`, { bigliettoId: id })
      .then((r) => setFirme(r.firme))
      .catch(() => setFirme([]));
  }, [api, id]);
  useEffect(() => {
    if (b) caricaFirme();
  }, [b?.id, caricaFirme]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (b?.slug) setUrl(`${baseUrlClient()}/b/${b.slug}`);
  }, [b?.slug]);

  async function colonne(n: 1 | 2 | 3) {
    if (!b) return;
    setB({ ...b, colonne: n });
    try {
      const r = await api<{ biglietto: Biglietto }>(`/api/biglietti/${id}`, { metodo: "PATCH", bigliettoId: id, corpo: { colonne: n } });
      setB(r.biglietto);
    } catch {
      /* resta la scelta locale; al prossimo caricamento si rilegge */
    }
  }

  if (!b) {
    return (
      <>
        <IntestazioneWizard indietro="/" larghezza="max-w-dashboard" />
        <main className="gutter">
          <StatoBozza stato={stato === "ok" ? "carica" : stato} />
        </main>
      </>
    );
  }

  const modello = modelloPerId(b.copertina.modelloId) ?? MODELLI_BIGLIETTO[0];
  const visibili = firme ? firmeOrdinate(firme, b.ordineFirme) : [];
  const quando = b.consegna.quando
    ? new Intl.DateTimeFormat("it-IT", { timeZone: b.consegna.fuso, weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(b.consegna.quando))
    : "—";

  return (
    <>
      <IntestazioneWizard indietro="/" larghezza="max-w-dashboard" />
      <main className="gutter mx-auto flex w-full max-w-dashboard flex-col gap-8 pb-16 pt-6">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-ink-soft">{STATI[b.stato]}</p>
          <h1 className="font-display text-[32px] font-bold leading-[38px] tracking-tight text-accent-2">{b.nome}</h1>
          <p className="text-ink-soft">
            Per <strong className="text-ink">{b.festeggiato}</strong> · da {b.daParteDi}
          </p>
          {b.stato === "bozza" ? (
            <Link href={`/biglietto/${id}/anteprima`} className={classiBottone("primario", "normale", "self-start")}>
              Vai all’anteprima per pubblicarlo
            </Link>
          ) : null}
        </header>

        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="flex min-w-0 flex-col gap-8">
            <section className="flex flex-col gap-3 rounded-3xl bg-surface shadow-carta p-5">
              <h2 className="text-xl font-semibold text-accent-2">Firme</h2>
              <p className="font-display text-4xl font-bold">{b.nFirme}</p>
              {firme === null ? (
                <p className="text-ink-soft">Un momento…</p>
              ) : firme.length === 0 ? (
                <p className="text-ink-soft">Ancora nessuno ha firmato. Manda il link al gruppo!</p>
              ) : (
                <ul className="flex flex-col divide-y divide-line">
                  {firme.map((f) => (
                    <li key={f.id} className="flex flex-col gap-0.5 py-3">
                      <span className="font-semibold">
                        {[f.nome, f.cognome].filter(Boolean).join(" ")}
                        {f.ruolo ? <span className="font-normal text-ink-soft"> · {f.ruolo}</span> : null}
                        {f.daParteDi && f.daParteDi !== f.nome ? <span className="font-normal text-ink-soft"> · firma «{f.daParteDi}»</span> : null}
                      </span>
                      <span className="text-sm text-ink-soft">
                        {new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" }).format(new Date(f.creatoIl))}
                        {f.email ? ` · ${f.email}` : ""}
                      </span>
                      <span className="line-clamp-2 text-sm">{testoDaHtml(f.messaggioHtml)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {b.stato !== "bozza" && url ? (
              <section className="flex flex-col gap-4 rounded-3xl bg-surface shadow-carta p-5">
                <h2 className="text-xl font-semibold text-accent-2">Condividi</h2>
                <BloccoInvito url={url} messaggio={messaggioInvitoBiglietto(b, url)} />
              </section>
            ) : null}

            {b.stato === "aperto" && url ? (
              <section className="flex flex-col gap-3 rounded-3xl bg-surface shadow-carta p-5">
                <h2 className="text-xl font-semibold text-accent-2">Promemoria</h2>
                <p className="text-sm text-ink-soft">Un messaggio già scritto per chi non ha ancora firmato.</p>
                <p ref={promemoria} className="whitespace-pre-wrap rounded-controllo border border-line bg-surface-2 p-3">
                  {messaggioPromemoriaBiglietto(b, url)}
                </p>
                <BottoneCopia testo={messaggioPromemoriaBiglietto(b, url)} etichetta="Copia il promemoria" sorgente={promemoria} piccolo={false} />
              </section>
            ) : null}

            <section className="flex flex-col gap-3 rounded-3xl bg-surface shadow-carta p-5">
              <h2 className="text-xl font-semibold text-accent-2">Consegna</h2>
              <p>
                <span className="capitalize">{quando}</span> <span className="text-ink-soft">({nomeFuso(b.consegna.fuso)})</span>
              </p>
              <p className="text-sm text-ink-soft">{b.destinatario === "festeggiato" ? "Lo mandiamo all’email del festeggiato." : "Lo mandiamo a te, così lo inoltri tu."}</p>
              <button type="button" onClick={() => setDettagli(true)} className={classiBottone("secondario", "normale", "self-start")}>
                Modifica i dettagli
              </button>
            </section>
          </div>

          <aside className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-accent-2">Il biglietto</h2>
            <div role="group" aria-label="Colonne delle pagine interne" className="flex items-center gap-2">
              <span className="text-sm font-semibold">Colonne:</span>
              {([1, 2, 3] as const).map((n) => (
                <button key={n} type="button" aria-pressed={b.colonne === n} onClick={() => void colonne(n)} className={classiBottone(b.colonne === n ? "primario" : "secondario", "piccolo")}>
                  {n}
                </button>
              ))}
            </div>
            <div ref={rif} className="h-0 w-full" />
            <Visualizzatore modello={modello} titolo={b.copertina.titolo} sottotitolo={b.copertina.sottotitolo} immagineUrl={b.copertina.immagineUrl} firme={visibili} colonne={b.colonne} larghezza={Math.min(larghezza, 420)} />
            <Link href={`/biglietto/${id}/design?modello=${b.copertina.modelloId}&variante=${b.copertina.variante}`} className="text-sm font-semibold text-accent-2 underline underline-offset-4">
              Cambia la copertina
            </Link>
          </aside>
        </div>
      </main>

      <Finestra aperta={dettagli} onChiudi={() => setDettagli(false)} titolo="Modifica i dettagli" larga>
        <ModuloDettagli
          b={b}
          testoBottone="Salva"
          chiaveSessione={`colletta.biglietto.${id}.dettagli`}
          onSalvato={(x) => {
            setB(x);
            setDettagli(false);
          }}
        />
      </Finestra>
    </>
  );
}
