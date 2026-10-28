"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Icona, type NomeIcona } from "@/components/ui";
import { coloreDellaNota, durataLettura, MODI_RIVELAZIONE, rivelazioneValida, testoSu } from "@/lib/dominio/bacheca";
import { firmeOrdinate } from "@/lib/dominio/biglietto";
import { fontPerId, testoDaHtml } from "@/lib/dominio/biglietti";
import type { BigliettoPubblico, Firma, ModoRivelazione } from "@/lib/tipi";
import { useFontBiglietto } from "../useFontBiglietto";
import { aspettoDaBiglietto, stileSfondo, TestaBacheca, testoSopra, type AspettoBacheca } from "./AnteprimaBacheca";
import { Coriandoli } from "./Coriandoli";
import { NotaFirma, NotaGrande } from "./NotaFirma";

const PASSO_MS = 100;
const SFONDO_SCURO = "#101512";

type Fase = "apertura" | ModoRivelazione;

interface Nota {
  f: Firma;
  colore: string;
}

/**
 * Avanza da 0 a 1 in `durata` ms, si ferma in pausa e ricomincia da 0 a ogni nuova `chiave`; a 1 chiama `onFine`.
 * Con un timer e non con la fine di un'animazione CSS: con il movimento ridotto le animazioni durano 0 ms.
 */
function useProgresso(chiave: string, durata: number, inPausa: boolean, onFine: () => void): number {
  const [stato, setStato] = useState({ chiave, p: 0 });
  const p = stato.chiave === chiave ? stato.p : 0;
  const fine = useRef(onFine);
  fine.current = onFine;
  useEffect(() => {
    if (inPausa) return;
    const t = setInterval(() => setStato((s) => ({ chiave, p: Math.min(1, (s.chiave === chiave ? s.p : 0) + PASSO_MS / durata) })), PASSO_MS);
    return () => clearInterval(t);
  }, [chiave, durata, inPausa]);
  useEffect(() => {
    if (p >= 1) fine.current();
  }, [p]);
  return p;
}

/** Frecce per andare avanti e indietro, spazio per la pausa. */
function useTasti(avanti: () => void, indietro: () => void, pausa: () => void) {
  const rif = useRef({ avanti, indietro, pausa });
  rif.current = { avanti, indietro, pausa };
  useEffect(() => {
    const t = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("button, a, input, textarea")) return;
      if (e.key === "ArrowRight") rif.current.avanti();
      else if (e.key === "ArrowLeft") rif.current.indietro();
      else if (e.key === " ") {
        e.preventDefault();
        rif.current.pausa();
      } else return;
    };
    document.addEventListener("keydown", t);
    return () => document.removeEventListener("keydown", t);
  }, []);
}

function BottoneTondo({ icona, etichetta, onClick }: { icona: NomeIcona; etichetta: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={etichetta} title={etichetta} className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-[#16241F] shadow-sollevata hover:bg-white">
      <Icona nome={icona} dimensione={24} />
    </button>
  );
}

/** Indietro, pausa, avanti: in fondo a storie e film. */
function Comandi({ pausa, onPausa, onIndietro, onAvanti, conteggio, extra }: { pausa: boolean; onPausa: () => void; onIndietro: () => void; onAvanti: () => void; conteggio?: string; extra?: ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-3 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
      <BottoneTondo icona="chevron_left" etichetta="Indietro" onClick={onIndietro} />
      <BottoneTondo icona={pausa ? "play_arrow" : "pause"} etichetta={pausa ? "Riprendi" : "Pausa"} onClick={onPausa} />
      <BottoneTondo icona="chevron_right" etichetta="Avanti" onClick={onAvanti} />
      {conteggio ? <span className="min-w-12 rounded-full bg-black/35 px-3 py-1 text-center text-sm font-semibold text-white">{conteggio}</span> : null}
      {extra}
    </div>
  );
}

// ---------- Apertura ----------

function Apertura({ aspetto, festeggiato, n, onApri }: { aspetto: AspettoBacheca; festeggiato: string; n: number; onApri: () => void }) {
  useFontBiglietto([aspetto.fontTitolo]);
  const accento = aspetto.colori.accento;
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 pb-32 pt-20 text-center text-white"
      style={{ background: `radial-gradient(circle at 50% 38%, ${accento}66, transparent 62%), ${SFONDO_SCURO}` }}
    >
      <span aria-hidden="true" className="flex h-28 w-28 items-center justify-center rounded-full bg-white/10 text-6xl ring-1 ring-white/20">
        {aspetto.emoji}
      </span>
      <p className="text-xs font-semibold uppercase tracking-[0.25em] opacity-75">Una sorpresa per te</p>
      <h1 className="break-words text-[40px] font-bold leading-tight" style={{ fontFamily: fontPerId(aspetto.fontTitolo).css }}>
        {festeggiato}
      </h1>
      {n ? <p className="opacity-85">{n === 1 ? "C’è un messaggio scritto per te" : `${n} messaggi scritti per te`}</p> : null}
      <button
        type="button"
        onClick={onApri}
        autoFocus
        className="mt-2 inline-flex min-h-14 items-center gap-2 rounded-full px-8 text-lg font-bold shadow-sollevata"
        style={{ backgroundColor: accento, color: testoSu(accento) }}
      >
        <Icona nome="redeem" dimensione={24} />
        Scopri la sorpresa
      </button>
    </div>
  );
}

// ---------- Storie: un messaggio alla volta ----------

function Storie({ note, aspetto, onFine }: { note: Nota[]; aspetto: AspettoBacheca; onFine: () => void }) {
  const [i, setI] = useState(0);
  const [pausa, setPausa] = useState(false);
  const { f, colore } = note[i];
  const avanti = useCallback(() => (i + 1 < note.length ? setI(i + 1) : onFine()), [i, note.length, onFine]);
  const indietro = useCallback(() => setI((x) => Math.max(0, x - 1)), []);
  const p = useProgresso(f.id, durataLettura(testoDaHtml(f.messaggioHtml), !!f.immagine), pausa, avanti);
  useTasti(avanti, indietro, () => setPausa((x) => !x));

  return (
    <div className="fixed inset-0 flex flex-col" style={stileSfondo(aspetto)}>
      <div className="flex gap-1 px-4 pt-[4.25rem]" aria-hidden="true">
        {note.map((n, k) => (
          <span key={n.f.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/40">
            <span className="block h-full bg-white" style={{ width: k < i ? "100%" : k === i ? `${p * 100}%` : "0%" }} />
          </span>
        ))}
      </div>
      {/* un tocco sul bigliettino va avanti (per tastiera e lettori di schermo ci sono i pulsanti sotto) */}
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6" onClick={avanti}>
        <NotaGrande key={f.id} f={f} colore={colore} className="riv-entra mx-auto my-auto" />
      </div>
      <Comandi pausa={pausa} onPausa={() => setPausa((x) => !x)} onIndietro={indietro} onAvanti={avanti} conteggio={`${i + 1}/${note.length}`} />
    </div>
  );
}

// ---------- Film: parte da solo, su sfondo scuro, e finisce con i nomi ----------

interface Scena {
  chiave: string;
  durata: number;
  contenuto: ReactNode;
}

function Film({ note, aspetto, b, onFine }: { note: Nota[]; aspetto: AspettoBacheca; b: BigliettoPubblico; onFine: () => void }) {
  useFontBiglietto([aspetto.fontTitolo]);
  const font = fontPerId(aspetto.fontTitolo).css;
  const scene = useMemo<Scena[]>(() => {
    const nomi = [...new Set(note.map((n) => n.f.daParteDi.trim()).filter(Boolean))];
    const s: Scena[] = [
      {
        chiave: "titolo",
        durata: 4500,
        contenuto: (
          <div className="flex flex-col items-center gap-3">
            <span aria-hidden="true" className="text-6xl">
              {aspetto.emoji}
            </span>
            <p className="text-sm uppercase tracking-[0.3em] opacity-70">per</p>
            <h1 className="break-words text-5xl font-bold leading-tight" style={{ fontFamily: font }}>
              {b.festeggiato}
            </h1>
            <p className="opacity-80">{aspetto.titolo}</p>
          </div>
        ),
      },
    ];
    if (aspetto.benvenuto.trim()) {
      s.push({
        chiave: "benvenuto",
        durata: durataLettura(aspetto.benvenuto),
        contenuto: (
          <figure className="flex max-w-lg flex-col gap-4">
            <blockquote className="whitespace-pre-line text-2xl leading-snug" style={{ fontFamily: font }}>
              «{aspetto.benvenuto.trim()}»
            </blockquote>
            {b.organizzatoreNome ? <figcaption className="opacity-75">— {b.organizzatoreNome}</figcaption> : null}
          </figure>
        ),
      });
    }
    for (const { f, colore } of note) {
      s.push({ chiave: f.id, durata: durataLettura(testoDaHtml(f.messaggioHtml), !!f.immagine), contenuto: <NotaGrande f={f} colore={colore} /> });
    }
    s.push({
      chiave: "nomi",
      durata: Math.min(15000, 5000 + nomi.length * 400),
      contenuto: (
        <div className="flex max-w-lg flex-col items-center gap-5">
          <p className="text-sm uppercase tracking-[0.3em] opacity-70">Hanno firmato</p>
          <p className="text-2xl leading-relaxed" style={{ fontFamily: font }}>
            {nomi.join(" · ")}
          </p>
          <p aria-hidden="true" className="text-4xl">
            {aspetto.emoji} 💛
          </p>
        </div>
      ),
    });
    return s;
  }, [note, aspetto, b.festeggiato, b.organizzatoreNome, font]);

  const [i, setI] = useState(0);
  const [pausa, setPausa] = useState(false);
  const scena = scene[i];
  const avanti = useCallback(() => (i + 1 < scene.length ? setI(i + 1) : onFine()), [i, scene.length, onFine]);
  const indietro = useCallback(() => setI((x) => Math.max(0, x - 1)), []);
  const p = useProgresso(scena.chiave, scena.durata, pausa, avanti);
  useTasti(avanti, indietro, () => setPausa((x) => !x));

  return (
    <div className="fixed inset-0 flex flex-col text-white" style={{ background: `radial-gradient(circle at 50% 30%, ${aspetto.colori.accento}33, transparent 65%), ${SFONDO_SCURO}` }}>
      <div className="mx-4 mt-[4.25rem] h-1 overflow-hidden rounded-full bg-white/20" aria-hidden="true">
        <span className="block h-full bg-white/80" style={{ width: `${((i + p) / scene.length) * 100}%` }} />
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto px-6 py-6 text-center">
        <div key={scena.chiave} className="riv-entra mx-auto my-auto flex w-full justify-center">
          {scena.contenuto}
        </div>
      </div>
      <Comandi
        pausa={pausa}
        onPausa={() => setPausa((x) => !x)}
        onIndietro={indietro}
        onAvanti={avanti}
        extra={
          <button type="button" onClick={onFine} className="min-h-12 rounded-full px-4 text-sm font-semibold text-white/80 underline-offset-4 hover:text-white hover:underline">
            Salta
          </button>
        }
      />
    </div>
  );
}

// ---------- Scorrimento: i messaggi compaiono mentre si scorre ----------

function Appare({ children, className = "" }: { children: ReactNode; className?: string }) {
  const rif = useRef<HTMLDivElement>(null);
  const [visibile, setVisibile] = useState(false);
  useEffect(() => {
    const el = rif.current;
    if (!el || typeof IntersectionObserver === "undefined") return setVisibile(true);
    const o = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisibile(true);
          o.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    o.observe(el);
    return () => o.disconnect();
  }, []);
  return (
    <div ref={rif} className={`transition duration-700 ease-out ${visibile ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"} ${className}`}>
      {children}
    </div>
  );
}

function Scorrimento({ note, aspetto, onFine }: { note: Nota[]; aspetto: AspettoBacheca; onFine: () => void }) {
  return (
    <>
      <div aria-hidden="true" className="fixed inset-0" style={stileSfondo(aspetto)} />
      <div className="relative mx-auto flex w-full max-w-[560px] flex-col px-4 pb-24 pt-20">
        <div className="mb-10">
          <TestaBacheca aspetto={aspetto} nMessaggi={note.length} vera />
        </div>
        {note.map(({ f, colore }, i) => (
          <Appare key={f.id} className={i % 2 ? "sm:ml-16" : "sm:mr-16"}>
            <NotaFirma f={f} colore={colore} i={i} />
          </Appare>
        ))}
        <Appare className="mt-8 flex justify-center">
          <button type="button" onClick={onFine} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 font-bold text-[#16241F] shadow-sollevata">
            <Icona nome="grid_view" dimensione={20} />
            Vedili tutti insieme
          </button>
        </Appare>
      </div>
    </>
  );
}

// ---------- Griglia: tutti insieme (è anche il finale delle altre) ----------

function Griglia({ note, aspetto, onRivedi, spazioSotto }: { note: Nota[]; aspetto: AspettoBacheca; onRivedi: () => void; spazioSotto: boolean }) {
  return (
    <>
      <div aria-hidden="true" className="fixed inset-0" style={stileSfondo(aspetto)} />
      <div className={`relative mx-auto flex w-full max-w-[760px] flex-col px-4 pt-20 ${spazioSotto ? "pb-36" : "pb-12"}`}>
        <div className="mb-6">
          <TestaBacheca aspetto={aspetto} nMessaggi={note.length} vera />
        </div>
        {note.length ? (
          <div className="columns-2 gap-4 sm:columns-3">
            {note.map(({ f, colore }, i) => (
              <NotaFirma key={f.id} f={f} colore={colore} i={i} />
            ))}
          </div>
        ) : (
          <p className="mx-auto mt-6 max-w-xs rounded-3xl bg-white/85 p-6 text-center font-semibold text-[#16241F] shadow-carta">Ancora nessun messaggio.</p>
        )}
        <div className="mt-8 flex flex-col items-center gap-4 text-sm" style={{ color: testoSopra(aspetto) }}>
          {note.length ? (
            <button type="button" onClick={onRivedi} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-black/25 px-5 font-semibold text-white backdrop-blur hover:bg-black/40">
              <Icona nome="replay" dimensione={20} />
              Rivedi dall’inizio
            </button>
          ) : null}
          <Link href="/biglietto/nuovo" className="opacity-75 underline-offset-4 hover:underline hover:opacity-100">
            Fatto con Gifty · crea il tuo biglietto gratis
          </Link>
        </div>
      </div>
    </>
  );
}

// ---------- Il tutto ----------

/** Per cambiare modalità quando si vuole. */
function SceltaModo({ fase, onScegli }: { fase: Fase; onScegli: (m: ModoRivelazione) => void }) {
  return (
    <nav aria-label="Come vedere i messaggi" className="flex flex-wrap justify-end gap-1 rounded-full bg-black/40 p-1 backdrop-blur">
      {MODI_RIVELAZIONE.map((m) => (
        <button
          key={m.id}
          type="button"
          aria-pressed={fase === m.id}
          onClick={() => onScegli(m.id)}
          className={`min-h-10 rounded-full px-3 text-sm font-semibold ${fase === m.id ? "bg-white text-[#16241F]" : "text-white hover:bg-white/15"}`}
        >
          {m.nome}
        </button>
      ))}
    </nav>
  );
}

/**
 * La rivelazione: cosa vede il festeggiato quando il biglietto è consegnato.
 * Apertura («Scopri la sorpresa») → la modalità scelta da chi organizza → alla fine tutti i messaggi insieme.
 * In alto si può passare a un'altra modalità quando si vuole, e spegnere o riaccendere la musica (se c'è):
 * parte con il tocco su «Scopri la sorpresa», perché i browser non fanno partire l'audio da soli.
 * `alto`: a sinistra in alto (es. l'avviso dell'anteprima); `basso`: una barra in fondo, nell'apertura e nella griglia.
 */
export function Rivelazione({ b, firme, alto, basso }: { b: BigliettoPubblico; firme: Firma[]; alto?: ReactNode; basso?: ReactNode }) {
  const aspetto = useMemo(() => aspettoDaBiglietto(b), [b]);
  const note = useMemo<Nota[]>(() => firmeOrdinate(firme, b.ordineFirme).map((f, i) => ({ f, colore: coloreDellaNota(f.coloreNota, i) })), [firme, b.ordineFirme]);
  const modo = rivelazioneValida(b.rivelazione);
  const [fase, setFase] = useState<Fase>("apertura");
  const [scatto, setScatto] = useState(0);
  const audio = useRef<HTMLAudioElement>(null);
  const [suona, setSuona] = useState(false);
  const musica = b.musica?.url ?? null;

  function suonaMusica() {
    // se il browser rifiuta (o il file non si carica) la sorpresa va avanti lo stesso, in silenzio
    audio.current?.play().catch(() => setSuona(false));
  }

  const vai = useCallback(
    (f: Fase) => {
      // senza messaggi non c'è niente da far scorrere: si va dritti alla bacheca
      setFase(f !== "apertura" && !note.length ? "griglia" : f);
      window.scrollTo(0, 0);
    },
    [note.length],
  );
  const finale = useCallback(() => {
    vai("griglia");
    setScatto(Date.now());
  }, [vai]);

  return (
    <div className="relative flex min-h-dvh flex-col">
      {fase === "apertura" ? (
        <Apertura
          aspetto={aspetto}
          festeggiato={b.festeggiato}
          n={note.length}
          onApri={() => {
            suonaMusica();
            vai(modo);
            setScatto(Date.now());
          }}
        />
      ) : fase === "storie" ? (
        <Storie note={note} aspetto={aspetto} onFine={finale} />
      ) : fase === "film" ? (
        <Film note={note} aspetto={aspetto} b={b} onFine={finale} />
      ) : fase === "scorrimento" ? (
        <Scorrimento note={note} aspetto={aspetto} onFine={finale} />
      ) : (
        <Griglia note={note} aspetto={aspetto} onRivedi={() => vai("apertura")} spazioSotto={!!basso} />
      )}

      <div className="pointer-events-none fixed inset-x-0 top-0 z-30 flex flex-wrap items-start justify-between gap-2 p-3">
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          {alto}
          {musica && fase !== "apertura" ? (
            <button
              type="button"
              onClick={() => (suona ? audio.current?.pause() : suonaMusica())}
              aria-label={suona ? "Spegni la musica" : "Accendi la musica"}
              title={suona ? "Spegni la musica" : "Accendi la musica"}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/55"
            >
              <Icona nome={suona ? "volume_up" : "volume_off"} dimensione={22} />
            </button>
          ) : null}
        </div>
        {fase !== "apertura" && note.length ? (
          <div className="pointer-events-auto">
            <SceltaModo fase={fase} onScegli={vai} />
          </div>
        ) : null}
      </div>

      {basso && (fase === "apertura" || fase === "griglia") ? (
        <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/40 to-transparent pb-[max(1rem,env(safe-area-inset-bottom))] pt-6">
          <div className="mx-auto w-full max-w-[520px] px-4">{basso}</div>
        </div>
      ) : null}

      <Coriandoli scatto={scatto} emoji={aspetto.emoji} />
      {musica ? <audio ref={audio} src={musica} loop preload="auto" onPlay={() => setSuona(true)} onPause={() => setSuona(false)} /> : null}
    </div>
  );
}
