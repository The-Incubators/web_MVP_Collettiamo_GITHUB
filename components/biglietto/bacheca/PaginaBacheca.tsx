"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icona } from "@/components/ui";
import { cambiaFirmatario, leggiSessione, scriviSessione, useApi } from "@/lib/biglietti/client";
import { coloreDellaNota, htmlDaTestoSemplice, testoSu } from "@/lib/dominio/bacheca";
import { firmeOrdinate } from "@/lib/dominio/biglietto";
import { STILE_PREDEFINITO, testoDaHtml } from "@/lib/dominio/biglietti";
import type { BigliettoPubblico, Firma } from "@/lib/tipi";
import { baseUrlClient } from "@/lib/url";
import { Finestra } from "../comuni";
import { immaginePerServer } from "../firma/bozza";
import { aspettoDaBiglietto, CLASSI_NOTA, ROTAZIONI, stileSfondo, TestaBacheca, testoSopra } from "./AnteprimaBacheca";
import { Coriandoli } from "./Coriandoli";
import { EditorNota, NOTA_VUOTA, type NotaInCorso } from "./EditorNota";

const chiaveBozza = (slug: string) => `colletta.nota.${slug}`;

function notaDaFirma(f: Firma, colore: string): NotaInCorso {
  return {
    testo: testoDaHtml(f.messaggioHtml),
    nome: f.daParteDi,
    colore,
    foto: f.immagine ? { tipo: "mantieni", url: f.immagine.url, larghezza: f.immagine.larghezza, altezza: f.immagine.altezza, attribuzione: f.immagine.attribuzione } : null,
  };
}

function NotaFirma({ f, colore, i, propria, accento, onModifica, onElimina }: { f: Firma; colore: string; i: number; propria: boolean; accento: string; onModifica?: () => void; onElimina?: () => void }) {
  return (
    <article
      id={`nota-${f.id}`}
      aria-label={`Messaggio di ${f.daParteDi}`}
      className={`mb-4 flex break-inside-avoid flex-col gap-2 p-4 text-[15px] ${CLASSI_NOTA} ${ROTAZIONI[i % ROTAZIONI.length]}`}
      style={{ backgroundColor: colore, ...(propria ? { boxShadow: `0 0 0 3px ${accento}, 0 6px 16px -6px rgba(0,0,0,0.25)` } : {}) }}
    >
      {f.immagine ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={f.immagine.url}
          alt=""
          loading="lazy"
          width={f.immagine.larghezza || undefined}
          height={f.immagine.altezza || undefined}
          className="h-auto w-full rounded-xl object-cover"
        />
      ) : null}
      {/* HTML già ripulito dal server: solo <b> <i> <u> <br> */}
      <div className="whitespace-normal break-words" dangerouslySetInnerHTML={{ __html: f.messaggioHtml }} />
      <p className="font-semibold opacity-75">
        — {f.daParteDi}
        {f.ruolo ? <span className="block text-xs font-normal">{f.ruolo}</span> : null}
      </p>
      {f.immagine?.attribuzione ? <p className="text-[10px] opacity-60">{f.immagine.attribuzione}</p> : null}
      {onModifica && onElimina ? (
        <div className="-mb-2 -mr-2 flex items-center justify-end gap-1">
          <span className="mr-auto whitespace-nowrap rounded-full bg-black/5 px-2 py-0.5 text-xs font-semibold opacity-80">Tuo</span>
          <button type="button" onClick={onModifica} aria-label="Modifica il tuo messaggio" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-black/5">
            <Icona nome="edit" dimensione={20} />
          </button>
          <button type="button" onClick={onElimina} aria-label="Elimina il tuo messaggio" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-black/5">
            <Icona nome="delete" dimensione={20} />
          </button>
        </div>
      ) : null}
    </article>
  );
}

/**
 * La bacheca di chi firma (/b/[slug]): titolo, benvenuto e i messaggi come bigliettini.
 * «Lascia il tuo messaggio» apre un bigliettino in cima che è anche l'editor; pubblicato, piovono i coriandoli.
 * Chi ha già firmato da questo dispositivo ritrova il suo bigliettino, e può modificarlo o eliminarlo.
 */
export function PaginaBacheca({ b, firme: iniziali }: { b: BigliettoPubblico; firme: Firma[] }) {
  const api = useApi();
  const aspetto = useMemo(() => aspettoDaBiglietto(b), [b]);
  const accento = aspetto.colori.accento;
  const aperto = b.stato === "aperto";

  const [firme, setFirme] = useState(iniziali);
  const [mia, setMia] = useState<Firma | null>(null);
  const [nota, setNota] = useState<NotaInCorso | null>(null);
  const [invio, setInvio] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [scatto, setScatto] = useState(0);
  const [daMostrare, setDaMostrare] = useState<string | null>(null);
  const [avviso, setAvviso] = useState("");
  const [elimina, setElimina] = useState(false);
  const rifEditor = useRef<HTMLDivElement>(null);

  // ho già firmato da questo dispositivo? Il mio bigliettino si riconosce e si modifica, non si duplica.
  useEffect(() => {
    if (!aperto) return;
    api<{ firma: Firma | null }>(`/api/b/${b.slug}/mia-firma`, { firmatario: b.slug })
      .then(({ firma }) => setMia(firma))
      .catch(() => {});
  }, [aperto, api, b.slug]);

  const ordinate = useMemo(() => firmeOrdinate(firme, b.ordineFirme), [firme, b.ordineFirme]);
  const colori = useMemo(() => new Map(ordinate.map((f, i) => [f.id, coloreDellaNota(f.coloreNota, i)])), [ordinate]);

  // l'avviso in alto sparisce da solo
  useEffect(() => {
    if (!avviso) return;
    const t = setTimeout(() => setAvviso(""), 3500);
    return () => clearTimeout(t);
  }, [avviso]);

  // dopo la pubblicazione si scorre fino al proprio bigliettino
  useEffect(() => {
    if (!daMostrare) return;
    document.getElementById(`nota-${daMostrare}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    setDaMostrare(null);
  }, [daMostrare, firme]);

  const cambia = useCallback(
    (n: NotaInCorso | null) => {
      setNota(n);
      scriviSessione(chiaveBozza(b.slug), n);
    },
    [b.slug],
  );

  function apri() {
    setErrore(null);
    const salvata = leggiSessione<NotaInCorso>(chiaveBozza(b.slug));
    setNota(salvata ?? (mia ? notaDaFirma(mia, colori.get(mia.id) ?? coloreDellaNota(mia.coloreNota, 0)) : NOTA_VUOTA));
    requestAnimationFrame(() => rifEditor.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function annulla() {
    setErrore(null);
    cambia(null);
  }

  /** Su un dispositivo condiviso: da qui in poi firma un'altra persona, senza toccare il messaggio di prima. */
  function altraPersona() {
    cambiaFirmatario(b.slug);
    setMia(null);
    setErrore(null);
    cambia(NOTA_VUOTA);
  }

  async function pubblica() {
    if (!nota) return;
    setInvio(true);
    setErrore(null);
    const firma = nota.nome.trim();
    try {
      const r = await api<{ firmaId: string; nuova: boolean }>(`/api/b/${b.slug}/firma`, {
        metodo: "POST",
        firmatario: b.slug,
        corpo: {
          messaggioHtml: htmlDaTestoSemplice(nota.testo.trim()),
          // chi aveva firmato dalla pagina di prima tiene stile, ruolo e dati che aveva lasciato
          stile: mia?.stile ?? STILE_PREDEFINITO,
          immagine: immaginePerServer(nota.foto),
          daParteDi: firma,
          nome: mia?.nome || firma,
          cognome: mia?.cognome ?? "",
          ruolo: mia?.ruolo ?? "",
          email: mia?.email ?? "",
          coloreNota: nota.colore,
        },
      });
      // si ricarica tutto: così compaiono anche i messaggi arrivati nel frattempo
      const [{ firma: salvata }, { firme: nuove }] = await Promise.all([
        api<{ firma: Firma | null }>(`/api/b/${b.slug}/mia-firma`, { firmatario: b.slug }),
        api<{ firme: Firma[] }>(`/api/b/${b.slug}`),
      ]);
      setMia(salvata);
      setFirme(nuove);
      cambia(null);
      setDaMostrare(r.firmaId);
      setScatto(Date.now());
      setAvviso(r.nuova ? "Fatto! Il tuo messaggio è sul biglietto." : "Modifiche salvate.");
    } catch (e) {
      setErrore(e instanceof Error ? e.message : "Non sono riuscito a pubblicare il messaggio. Riprova.");
    } finally {
      setInvio(false);
    }
  }

  async function confermaElimina() {
    setElimina(false);
    try {
      await api(`/api/b/${b.slug}/firma`, { metodo: "DELETE", firmatario: b.slug });
      setFirme((x) => x.filter((f) => f.id !== mia?.id));
      setMia(null);
      scriviSessione(chiaveBozza(b.slug), null);
      setAvviso("Messaggio eliminato.");
    } catch (e) {
      setAvviso(e instanceof Error ? e.message : "Non sono riuscito a eliminare il messaggio. Riprova.");
    }
  }

  async function condividi() {
    const url = `${baseUrlClient()}/b/${b.slug}`;
    const testo = `Stiamo preparando un biglietto per ${b.festeggiato}: lascia anche tu un messaggio, ci vuole un minuto.`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: aspetto.titolo, text: testo, url });
      } catch {
        /* condivisione annullata */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setAvviso("Link copiato: incollalo nel gruppo.");
    } catch {
      setAvviso(url);
    }
  }

  const coloreTesto = testoSopra(aspetto);
  const visibili = nota && mia ? ordinate.filter((f) => f.id !== mia.id) : ordinate;

  return (
    <div className="relative flex min-h-dvh flex-col">
      <div aria-hidden="true" className="fixed inset-0 z-0" style={stileSfondo(aspetto)} />

      <div className="relative z-10 mx-auto flex w-full max-w-[760px] flex-1 flex-col px-4 pb-36 pt-4">
        <div className="flex justify-end">
          <Link
            href="/biglietto/nuovo"
            aria-label="Crea anche tu un biglietto di gruppo"
            title="Crea anche tu un biglietto di gruppo"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur hover:bg-black/40"
          >
            <Icona nome="auto_awesome" dimensione={22} />
          </Link>
        </div>

        <div className="mb-6">
          <TestaBacheca aspetto={aspetto} nMessaggi={ordinate.length} vera />
        </div>

        {nota ? (
          <div ref={rifEditor} className="mx-auto mb-6 w-full max-w-md scroll-mt-4">
            <EditorNota
              nota={nota}
              onNota={cambia}
              onPubblica={() => void pubblica()}
              onAnnulla={annulla}
              onAltraPersona={mia ? altraPersona : undefined}
              accento={accento}
              modifica={!!mia}
              invio={invio}
              errore={errore}
            />
          </div>
        ) : null}

        {visibili.length > 0 ? (
          <div className="columns-2 gap-4 sm:columns-3">
            {visibili.map((f, i) => {
              const propria = !!mia && f.id === mia.id;
              return (
                <NotaFirma
                  key={f.id}
                  f={f}
                  i={i}
                  colore={colori.get(f.id) ?? coloreDellaNota(f.coloreNota, i)}
                  propria={propria}
                  accento={accento}
                  onModifica={propria && aperto ? apri : undefined}
                  onElimina={propria && aperto ? () => setElimina(true) : undefined}
                />
              );
            })}
          </div>
        ) : !nota ? (
          <div className="mx-auto mt-6 flex max-w-xs flex-col items-center gap-2 rounded-3xl bg-white/85 p-6 text-center text-[#16241F] shadow-carta">
            <span aria-hidden="true" className="text-4xl">
              💬
            </span>
            <p className="font-semibold">{aperto ? "Sii la prima persona a firmare" : "Nessun messaggio"}</p>
            {aperto ? <p className="text-sm opacity-70">Il tuo messaggio sarà il primo sul biglietto.</p> : null}
          </div>
        ) : null}

        <p className="mt-10 text-center text-sm" style={{ color: coloreTesto }}>
          <Link href="/biglietto/nuovo" className="opacity-75 underline-offset-4 hover:underline hover:opacity-100">
            Fatto con Gifty · crea il tuo biglietto gratis
          </Link>
        </p>
      </div>

      {/* in basso: scrivere e condividere (sparisce mentre si scrive: il bigliettino ha il suo pulsante) */}
      {!nota ? (
        <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/30 to-transparent pb-[max(1rem,env(safe-area-inset-bottom))] pt-6">
          <div className="mx-auto flex w-full max-w-[520px] items-center gap-3 px-4">
            {aperto ? (
              <>
                <button
                  type="button"
                  onClick={apri}
                  className="inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full px-6 text-[18px] font-bold shadow-sollevata"
                  style={{ backgroundColor: accento, color: testoSu(accento) }}
                >
                  <Icona nome={mia ? "edit" : "draw"} dimensione={22} />
                  {mia ? "Modifica il tuo messaggio" : "Lascia il tuo messaggio"}
                </button>
                <button
                  type="button"
                  onClick={() => void condividi()}
                  aria-label="Condividi il link del biglietto"
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-[#16241F] shadow-sollevata hover:bg-white/90"
                >
                  <Icona nome="share" dimensione={22} />
                </button>
              </>
            ) : (
              <p className="flex-1 rounded-full bg-white/90 px-5 py-4 text-center font-semibold text-[#16241F] shadow-sollevata">
                <span aria-hidden="true">🎁 </span>Questo biglietto è già stato consegnato.
              </p>
            )}
          </div>
        </div>
      ) : null}

      <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
        {avviso ? <p className="animate-[apri_150ms_ease-out] animate-apri rounded-full bg-[#16241F] px-5 py-3 text-sm font-semibold text-white shadow-sollevata">{avviso}</p> : null}
      </div>

      <Coriandoli scatto={scatto} emoji={aspetto.emoji} />

      <Finestra aperta={elimina} onChiudi={() => setElimina(false)} titolo="Eliminare il tuo messaggio?">
        <div className="flex flex-col gap-4">
          <p>Sparisce dal biglietto, con la sua foto. Se cambi idea potrai scriverne uno nuovo.</p>
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <button type="button" onClick={() => void confermaElimina()} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-error px-5 font-bold text-white">
              Elimina
            </button>
            <button type="button" onClick={() => setElimina(false)} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full border border-line px-5 font-semibold hover:bg-surface-2">
              Annulla
            </button>
          </div>
        </div>
      </Finestra>
    </div>
  );
}
