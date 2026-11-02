"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BloccoInvito } from "@/components/BloccoInvito";
import { BottoneCopia, Icona } from "@/components/ui";
import { classiBottone } from "@/components/ui/Bottone";
import { coloreDellaNota, MODI_RIVELAZIONE, rivelazioneValida } from "@/lib/dominio/bacheca";
import { messaggioInvitoBiglietto, messaggioPromemoriaBiglietto, testoDaHtml } from "@/lib/dominio/biglietti";
import { firmeOrdinate } from "@/lib/dominio/biglietto";
import { baseUrlClient } from "@/lib/url";
import type { Biglietto, Firma, ModoRivelazione } from "@/lib/tipi";
import { AnteprimaBacheca, aspettoDaBiglietto } from "../bacheca/AnteprimaBacheca";
import { AnteprimaRivelazione } from "../bacheca/AnteprimeRivelazione";
import { Avviso, condividiLink, useAvviso } from "../bacheca/Avviso";
import { BottoneNota, NotaFirma } from "../bacheca/NotaFirma";
import { SceltaMusica } from "../bacheca/SceltaMusica";
import { Finestra, IntestazioneWizard } from "../comuni";
import { StatoBozza } from "../StatoBozza";
import { useBozza } from "../useBozza";

const STATI: Record<Biglietto["stato"], string> = { bozza: "Bozza", aperto: "In raccolta", chiuso: "Chiuso", consegnato: "Consegnato" };

const CLASSI_SEZIONE = "flex flex-col gap-4 rounded-3xl bg-surface p-5 shadow-carta";

function Contatore({ etichetta, valore }: { etichetta: string; valore: number }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-0.5 rounded-2xl bg-surface p-3 shadow-carta">
      <span className="font-display text-3xl font-bold">{valore}</span>
      <span className="text-xs font-bold uppercase tracking-widest text-ink-soft">{etichetta}</span>
    </div>
  );
}

/**
 * La gestione del biglietto (dopo il wizard si arriva qui): com'è, quanti hanno scritto, il link da mandare,
 * la moderazione dei messaggi (nascondi / elimina), la modalità della rivelazione e la consegna 🎁.
 */
export function Gestione({ id }: { id: string }) {
  const { b, setB, stato, api } = useBozza(id);
  const [firme, setFirme] = useState<Firma[] | null>(null);
  const [filtro, setFiltro] = useState<"tutti" | "nascosti">("tutti");
  const [url, setUrl] = useState("");
  const [avviso, setAvviso] = useAvviso();
  const [daEliminare, setDaEliminare] = useState<Firma | null>(null);
  const [conferma, setConferma] = useState<"consegna" | "riapri" | null>(null);
  const [attesa, setAttesa] = useState(false);
  const [caricaMusica, setCaricaMusica] = useState(false);
  const [erroreMusica, setErroreMusica] = useState<string | null>(null);
  const promemoria = useRef<HTMLParagraphElement>(null);

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

  const ordinate = useMemo(() => (b && firme ? firmeOrdinate(firme, b.ordineFirme, true) : []), [b, firme]);
  const colori = useMemo(() => new Map(ordinate.map((f, i) => [f.id, coloreDellaNota(f.coloreNota, i)])), [ordinate]);

  async function nascondi(f: Firma) {
    try {
      await api(`/api/biglietti/${id}/firme/${f.id}`, { metodo: "PATCH", bigliettoId: id, corpo: { nascosta: !f.nascosta } });
      setFirme((x) => x && x.map((y) => (y.id === f.id ? { ...y, nascosta: !f.nascosta } : y)));
      setAvviso(f.nascosta ? "Il messaggio è di nuovo visibile." : "Messaggio nascosto: lo vedi solo tu.");
    } catch (e) {
      setAvviso(e instanceof Error ? e.message : "Non ci sono riuscito. Riprova.");
    }
  }

  async function elimina() {
    const f = daEliminare;
    if (!f) return;
    setAttesa(true);
    try {
      await api(`/api/biglietti/${id}/firme/${f.id}`, { metodo: "DELETE", bigliettoId: id });
      setFirme((x) => x && x.filter((y) => y.id !== f.id));
      if (b) setB({ ...b, nFirme: Math.max(0, b.nFirme - 1) });
      setAvviso("Messaggio eliminato.");
    } catch (e) {
      setAvviso(e instanceof Error ? e.message : "Non sono riuscito a eliminare il messaggio. Riprova.");
    } finally {
      setAttesa(false);
      setDaEliminare(null);
    }
  }

  async function rivelazione(m: ModoRivelazione) {
    if (!b) return;
    const prima = b;
    setB({ ...b, rivelazione: m });
    try {
      const r = await api<{ biglietto: Biglietto }>(`/api/biglietti/${id}`, { metodo: "PATCH", bigliettoId: id, corpo: { rivelazione: m } });
      setB(r.biglietto);
    } catch (e) {
      setB(prima);
      setAvviso(e instanceof Error ? e.message : "Non sono riuscito a salvare. Riprova.");
    }
  }

  /** Carica (file) o toglie (null) la musica della sorpresa. */
  async function musica(f: File | null) {
    setCaricaMusica(true);
    setErroreMusica(null);
    try {
      const r = f
        ? await api<{ biglietto: Biglietto }>(`/api/biglietti/${id}/musica?nome=${encodeURIComponent(f.name)}`, { metodo: "POST", bigliettoId: id, file: f })
        : await api<{ biglietto: Biglietto }>(`/api/biglietti/${id}/musica`, { metodo: "DELETE", bigliettoId: id });
      setB(r.biglietto);
      setAvviso(f ? "Musica caricata." : "Musica tolta.");
    } catch (e) {
      setErroreMusica(e instanceof Error ? e.message : "Non sono riuscito a caricare la musica. Riprova.");
    } finally {
      setCaricaMusica(false);
    }
  }

  async function consegna(azione: "consegna" | "riapri") {
    setAttesa(true);
    try {
      const r = await api<{ biglietto: Biglietto }>(`/api/biglietti/${id}/consegna`, { metodo: "POST", bigliettoId: id, corpo: { azione } });
      setB(r.biglietto);
      setConferma(null);
      setAvviso(azione === "consegna" ? `Consegnato! Ora manda il link a ${r.biglietto.festeggiato}.` : "Biglietto riaperto: si può di nuovo scrivere.");
    } catch (e) {
      setAvviso(e instanceof Error ? e.message : "Non ci sono riuscito. Riprova.");
    } finally {
      setAttesa(false);
    }
  }

  if (!b) {
    return (
      <>
        <IntestazioneWizard indietro="/" larghezza="max-w-[720px]" />
        <main className="gutter">
          <StatoBozza stato={stato === "ok" ? "carica" : stato} />
        </main>
      </>
    );
  }

  const aspetto = aspettoDaBiglietto(b);
  const modo = rivelazioneValida(b.rivelazione);
  const nascosti = ordinate.filter((f) => f.nascosta);
  const elenco = filtro === "nascosti" ? nascosti : ordinate;
  const visibili = ordinate.filter((f) => !f.nascosta);
  const consegnato = b.stato === "consegnato";
  const quando = b.consegnatoIl
    ? new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" }).format(new Date(b.consegnatoIl))
    : "";

  return (
    <>
      <IntestazioneWizard indietro="/" larghezza="max-w-[720px]" />
      <main className="gutter mx-auto flex w-full max-w-[720px] flex-col gap-6 pb-16 pt-6">
        <header className="flex flex-col gap-2">
          <p className="inline-flex items-center gap-1.5 self-start rounded-full bg-surface-2 px-3 py-1 text-sm font-semibold">
            <span aria-hidden="true">{consegnato ? "🎁" : b.stato === "aperto" ? "🟢" : "📝"}</span>
            {STATI[b.stato]}
          </p>
          <h1 className="font-display text-[32px] font-bold leading-[38px] tracking-tight text-accent-2">{b.nome}</h1>
          <p className="text-ink-soft">
            Per <strong className="text-ink">{b.festeggiato}</strong>
          </p>
          {b.stato === "bozza" ? (
            <Link href={`/biglietto/${id}/anteprima`} className={classiBottone("primario", "normale", "self-start")}>
              Vai all’anteprima per pubblicarlo
            </Link>
          ) : null}
        </header>

        {b.stato !== "bozza" ? (
          <section className={CLASSI_SEZIONE} aria-label="Il biglietto">
            <AnteprimaBacheca
              aspetto={aspetto}
              compatta
              note={visibili.slice(0, 4).map((f) => ({ testo: testoDaHtml(f.messaggioHtml), autore: f.daParteDi, colore: colori.get(f.id) ?? coloreDellaNota(f.coloreNota, 0) }))}
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link href={`/b/${b.slug}`} className={classiBottone("primario", "normale")}>
                {consegnato ? "Apri la sorpresa" : "Apri la bacheca"}
              </Link>
              {!consegnato ? (
                <Link href={`/b/${b.slug}?anteprima=1`} className={classiBottone("secondario", "normale")}>
                  Guarda come lo vedrà {b.festeggiato}
                </Link>
              ) : null}
            </div>
          </section>
        ) : null}

        <div className="flex gap-3" role="group" aria-label="In numeri">
          <Contatore etichetta="Messaggi" valore={visibili.length} />
          <Contatore etichetta="Foto" valore={visibili.filter((f) => f.immagine).length} />
          <Contatore etichetta="Nascosti" valore={nascosti.length} />
        </div>

        {b.stato === "aperto" && url ? (
          <section className={CLASSI_SEZIONE}>
            <h2 className="text-xl font-semibold text-accent-2">Raccogli i messaggi</h2>
            <BloccoInvito url={url} messaggio={messaggioInvitoBiglietto(b, url)} />
            <details className="group">
              <summary className="min-h-tocco cursor-pointer py-2 font-semibold text-accent-2">Un promemoria per chi non ha ancora scritto</summary>
              <div className="flex flex-col gap-3 pt-2">
                <p ref={promemoria} className="whitespace-pre-wrap rounded-controllo border border-line bg-surface-2 p-3">
                  {messaggioPromemoriaBiglietto(b, url)}
                </p>
                <BottoneCopia testo={messaggioPromemoriaBiglietto(b, url)} etichetta="Copia il promemoria" sorgente={promemoria} piccolo={false} />
              </div>
            </details>
          </section>
        ) : null}

        {b.stato === "aperto" || consegnato ? (
          <section className={CLASSI_SEZIONE}>
            <h2 className="text-xl font-semibold text-accent-2">Consegna</h2>
            {consegnato ? (
              <>
                <p>
                  Consegnato{quando ? ` il ${quando}` : ""}. Il link ora mostra la sorpresa: mandalo a <strong>{b.festeggiato}</strong>.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => void condividiLink(url, b.nome, `${b.festeggiato}, c’è una sorpresa per te 🎁`).then((a) => a && setAvviso(a))}
                    className={classiBottone("primario", "normale")}
                  >
                    <Icona nome="share" dimensione={20} />
                    Manda a {b.festeggiato}
                  </button>
                  <button type="button" onClick={() => setConferma("riapri")} className={classiBottone("secondario", "normale")}>
                    <Icona nome="lock_open" dimensione={20} />
                    Riapri per altri messaggi
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-ink-soft">
                  Quando i messaggi ci sono tutti, consegnalo: nessuno potrà più scrivere e lo stesso link diventerà la sorpresa per {b.festeggiato}. Se serve, potrai riaprirlo.
                </p>
                <button type="button" onClick={() => setConferma("consegna")} className={classiBottone("primario", "normale", "self-start")}>
                  <span aria-hidden="true">🎁</span>
                  Consegna ora
                </button>
              </>
            )}
          </section>
        ) : null}

        <section className={CLASSI_SEZIONE}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-accent-2">Messaggi ({ordinate.length})</h2>
            <div role="group" aria-label="Quali messaggi mostrare" className="flex rounded-full bg-surface-2 p-1">
              {(
                [
                  ["tutti", `Tutti ${ordinate.length}`],
                  ["nascosti", `Nascosti ${nascosti.length}`],
                ] as const
              ).map(([v, etichetta]) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={filtro === v}
                  onClick={() => setFiltro(v)}
                  className={`min-h-10 rounded-full px-4 text-sm font-semibold ${filtro === v ? "bg-surface shadow-carta" : "text-ink-soft hover:text-ink"}`}
                >
                  {etichetta}
                </button>
              ))}
            </div>
          </div>
          <p className="text-sm text-ink-soft">Un messaggio nascosto resta qui, ma non compare né sulla bacheca né nella sorpresa.</p>
          {firme === null ? (
            <p className="text-ink-soft">Un momento…</p>
          ) : elenco.length === 0 ? (
            <p className="rounded-2xl bg-surface-2 p-4 text-center text-ink-soft">
              {filtro === "nascosti" ? "Nessun messaggio nascosto." : "Ancora nessun messaggio. Manda il link al gruppo!"}
            </p>
          ) : (
            <div className="columns-1 gap-4 rounded-2xl bg-surface-2 p-4 sm:columns-2">
              {elenco.map((f, i) => (
                <NotaFirma key={f.id} f={f} i={i} colore={colori.get(f.id) ?? coloreDellaNota(f.coloreNota, i)} attenuata={f.nascosta} etichette={f.nascosta ? ["Nascosto"] : []}>
                  <BottoneNota
                    icona={f.nascosta ? "visibility" : "visibility_off"}
                    etichetta={f.nascosta ? `Mostra il messaggio di ${f.daParteDi}` : `Nascondi il messaggio di ${f.daParteDi}`}
                    onClick={() => void nascondi(f)}
                  />
                  <BottoneNota icona="delete" etichetta={`Elimina il messaggio di ${f.daParteDi}`} onClick={() => setDaEliminare(f)} />
                </NotaFirma>
              ))}
            </div>
          )}
        </section>

        {b.stato !== "bozza" ? (
          <section className={CLASSI_SEZIONE}>
            <h2 className="text-xl font-semibold text-accent-2">Come lo scopre {b.festeggiato}</h2>
            <p className="text-sm text-ink-soft">Puoi cambiarlo quando vuoi, anche dopo la consegna.</p>
            <div role="radiogroup" aria-label="Come si rivela il biglietto" className="grid gap-3 sm:grid-cols-2">
              {MODI_RIVELAZIONE.map((m) => {
                const scelto = modo === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="radio"
                    aria-checked={scelto}
                    onClick={() => void rivelazione(m.id)}
                    className={`flex flex-col gap-3 rounded-3xl border-2 p-4 text-left transition-colors ${scelto ? "border-accent bg-accent-field" : "border-line bg-surface hover:border-line-forte"}`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-lg font-bold">{m.nome}</span>
                      {scelto ? (
                        <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-sm text-on-accent">
                          ✓
                        </span>
                      ) : null}
                    </span>
                    <AnteprimaRivelazione modo={m.id} aspetto={aspetto} festeggiato={b.festeggiato} />
                    <span className="text-sm text-ink-soft">{m.descrizione}</span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {b.stato !== "bozza" ? (
          <section className={CLASSI_SEZIONE}>
            <h2 className="text-xl font-semibold text-accent-2">Musica</h2>
            <SceltaMusica
              nome={b.musica?.nome ?? null}
              url={b.musica?.url ?? null}
              onFile={(f) => void musica(f)}
              onTogli={() => void musica(null)}
              attesa={caricaMusica}
              errore={erroreMusica}
            />
          </section>
        ) : null}
      </main>

      <Avviso testo={avviso} />

      <Finestra aperta={!!daEliminare} onChiudi={() => setDaEliminare(null)} titolo={`Eliminare il messaggio di ${daEliminare?.daParteDi ?? ""}?`}>
        <div className="flex flex-col gap-4">
          <p>Sparisce per sempre, con la sua foto. Se vuoi solo toglierlo dalla vista, nascondilo: potrai rimostrarlo quando vuoi.</p>
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <button type="button" disabled={attesa} onClick={() => void elimina()} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-error px-5 font-bold text-white disabled:opacity-60">
              {attesa ? "Un momento…" : "Elimina"}
            </button>
            <button type="button" onClick={() => setDaEliminare(null)} className={classiBottone("secondario", "normale", "flex-1")}>
              Annulla
            </button>
          </div>
        </div>
      </Finestra>

      <Finestra
        aperta={!!conferma}
        onChiudi={() => setConferma(null)}
        titolo={conferma === "riapri" ? "Riaprire il biglietto?" : `Consegnare il biglietto a ${b.festeggiato}?`}
      >
        <div className="flex flex-col gap-4">
          <p>
            {conferma === "riapri"
              ? "Il link torna a essere la bacheca e si potranno aggiungere altri messaggi. La sorpresa si rivede quando lo consegni di nuovo."
              : `Da quel momento nessuno potrà più scrivere e il link mostrerà la sorpresa. Poi mandalo a ${b.festeggiato}.`}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <button type="button" disabled={attesa} onClick={() => conferma && void consegna(conferma)} className={classiBottone("primario", "normale", "flex-1")}>
              {attesa ? "Un momento…" : conferma === "riapri" ? "Riapri" : "Consegna 🎁"}
            </button>
            <button type="button" onClick={() => setConferma(null)} className={classiBottone("secondario", "normale", "flex-1")}>
              Annulla
            </button>
          </div>
        </div>
      </Finestra>
    </>
  );
}
