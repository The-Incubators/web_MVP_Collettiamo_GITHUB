"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Icona, type NomeIcona } from "@/components/ui";
import { coloreDellaNota, durataLettura, elencoNomi, rivelazioneValida } from "@/lib/dominio/bacheca";
import { firmeOrdinate } from "@/lib/dominio/biglietto";
import { fontPerId, testoDaHtml } from "@/lib/dominio/biglietti";
import type { BigliettoPubblico, Firma, ModoRivelazione } from "@/lib/tipi";
import { useFontBiglietto } from "../useFontBiglietto";
import { aspettoDaBiglietto, type AspettoBacheca } from "./AnteprimaBacheca";
import { Coriandoli } from "./Coriandoli";
import { NotaFirma, NotaGrande } from "./NotaFirma";

const PASSO_MS = 100;
/** Storia e film scorrono al doppio della velocità di partenza (4 novembre 2026): le durate di `durataLettura` si dimezzano. */
const VELOCITA = 2;
/** L'altezza dei comandi in alto (X, modalità), misurata in `Rivelazione`: le barre di avanzamento stanno subito sotto. */
const SOTTO_I_COMANDI = "var(--riv-alto, 4.25rem)";

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
    const t = setInterval(() => setStato((s) => ({ chiave, p: Math.min(1, (s.chiave === chiave ? s.p : 0) + (PASSO_MS * VELOCITA) / durata) })), PASSO_MS);
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
    <button type="button" onClick={onClick} aria-label={etichetta} title={etichetta} className="tondo-r">
      <Icona nome={icona} dimensione={24} />
    </button>
  );
}

/** Indietro, pausa, avanti: in fondo a storia e film. */
function Comandi({ pausa, onPausa, onIndietro, onAvanti, extra }: { pausa: boolean; onPausa: () => void; onIndietro: () => void; onAvanti: () => void; extra?: ReactNode }) {
  return (
    <div className="comandi-r">
      <BottoneTondo icona="chevron_left" etichetta="Indietro" onClick={onIndietro} />
      <BottoneTondo icona={pausa ? "play_arrow" : "pause"} etichetta={pausa ? "Riprendi" : "Pausa"} onClick={onPausa} />
      <BottoneTondo icona="chevron_right" etichetta="Avanti" onClick={onAvanti} />
      {extra}
    </div>
  );
}

/** «Fatto con Gifty», in fondo (design.md §7: marchio discreto, non un link). */
function FirmaGifty() {
  return (
    <p className="firma-g">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo/gifty-nastro.svg" alt="" />
      Fatto con Gifty
    </p>
  );
}

const NASTRO = (
  <svg className="nastro-a" viewBox="0 0 1000 200" preserveAspectRatio="none" aria-hidden="true">
    <path d="M0 150 C 200 40, 320 190, 520 100 S 820 10, 1000 80" fill="none" stroke="currentColor" strokeWidth="14" strokeLinecap="round" />
  </svg>
);

// ---------- Apertura: la busta ----------

function Apertura({ festeggiato, onInizia, onApri }: { festeggiato: string; onInizia: () => void; onApri: () => void }) {
  const [aprendo, setAprendo] = useState(false);

  function apri() {
    if (aprendo) return;
    onInizia();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) onApri();
    else setAprendo(true);
  }

  return (
    <div className="apertura-b">
      {NASTRO}
      <div className="busta-scena">
        <div className={aprendo ? "busta aprendo" : "busta"}>
          {aprendo ? <span className="busta-patta" aria-hidden="true" onAnimationEnd={onApri} /> : null}
          <span className="mano">Per {festeggiato}</span>
        </div>
        <button type="button" className="btn btn-primario" onClick={apri} aria-disabled={aprendo || undefined} autoFocus>
          Apri il biglietto
        </button>
      </div>
      <FirmaGifty />
    </div>
  );
}

// ---------- Storia: un messaggio alla volta ----------

function Storia({ note, onFine }: { note: Nota[]; onFine: () => void }) {
  const [i, setI] = useState(0);
  const [pausa, setPausa] = useState(false);
  const { f, colore } = note[i];
  const avanti = useCallback(() => (i + 1 < note.length ? setI(i + 1) : onFine()), [i, note.length, onFine]);
  const indietro = useCallback(() => setI((x) => Math.max(0, x - 1)), []);
  const p = useProgresso(f.id, durataLettura(testoDaHtml(f.messaggioHtml), !!f.immagine), pausa, avanti);
  useTasti(avanti, indietro, () => setPausa((x) => !x));

  return (
    <div className="scena-riv">
      <div className="tacche-r" style={{ paddingTop: SOTTO_I_COMANDI }} aria-hidden="true">
        {note.map((n, k) => (
          <span key={n.f.id}>
            <i style={{ width: k < i ? "100%" : k === i ? `${p * 100}%` : "0%" }} />
          </span>
        ))}
      </div>
      {/* un tocco sul foglietto va avanti (per tastiera e lettori di schermo ci sono i pulsanti sotto) */}
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6" onClick={avanti}>
        <NotaGrande key={f.id} f={f} colore={colore} className="riv-entra mx-auto my-auto" />
      </div>
      <p className="conta m-0" aria-live="polite">
        {i + 1} di {note.length}
      </p>
      <Comandi pausa={pausa} onPausa={() => setPausa((x) => !x)} onIndietro={indietro} onAvanti={avanti} />
    </div>
  );
}

// ---------- Film: parte da solo e finisce con i nomi ----------

interface Scena {
  chiave: string;
  durata: number;
  contenuto: ReactNode;
}

function Film({ note, aspetto, b, onFine }: { note: Nota[]; aspetto: AspettoBacheca; b: BigliettoPubblico; onFine: () => void }) {
  const scene = useMemo<Scena[]>(() => {
    const nomi = elencoNomi(note.map((n) => n.f.daParteDi));
    const s: Scena[] = [
      {
        chiave: "titolo",
        durata: 4500,
        contenuto: (
          <div className="flex flex-col items-center gap-4">
            <h1 className="mano m-0 break-words text-[56px] leading-none sm:text-[72px]">{b.festeggiato}</h1>
            <p className="m-0 text-[20px] text-card-paper">{aspetto.titolo}</p>
          </div>
        ),
      },
    ];
    if (aspetto.benvenuto.trim()) {
      s.push({
        chiave: "benvenuto",
        durata: durataLettura(aspetto.benvenuto),
        contenuto: (
          <figure className="m-0 flex max-w-lg flex-col gap-4">
            <blockquote className="mano m-0 whitespace-pre-line text-[32px] leading-tight">{aspetto.benvenuto.trim()}</blockquote>
            {b.organizzatoreNome ? <figcaption className="text-card-paper">{b.organizzatoreNome}</figcaption> : null}
          </figure>
        ),
      });
    }
    for (const { f, colore } of note) {
      s.push({ chiave: f.id, durata: durataLettura(testoDaHtml(f.messaggioHtml), !!f.immagine), contenuto: <NotaGrande f={f} colore={colore} className="text-left" /> });
    }
    s.push({
      chiave: "nomi",
      durata: Math.min(15000, 5000 + note.length * 400),
      contenuto: (
        <div className="flex max-w-lg flex-col items-center gap-5">
          <span className="mano text-[56px] leading-none">{b.festeggiato}</span>
          <p className="m-0 text-[20px] leading-relaxed text-card-paper">{nomi}</p>
        </div>
      ),
    });
    return s;
  }, [note, aspetto, b.festeggiato, b.organizzatoreNome]);

  const [i, setI] = useState(0);
  const [pausa, setPausa] = useState(false);
  const scena = scene[i];
  const avanti = useCallback(() => (i + 1 < scene.length ? setI(i + 1) : onFine()), [i, scene.length, onFine]);
  const indietro = useCallback(() => setI((x) => Math.max(0, x - 1)), []);
  const p = useProgresso(scena.chiave, scena.durata, pausa, avanti);
  useTasti(avanti, indietro, () => setPausa((x) => !x));

  return (
    <div className="scena-riv film">
      <div className="flex flex-1 flex-col overflow-y-auto px-6 py-6 text-center" style={{ paddingTop: SOTTO_I_COMANDI }}>
        <div key={scena.chiave} className="riv-entra mx-auto my-auto flex w-full justify-center">
          {scena.contenuto}
        </div>
      </div>
      <div className="barra-r" aria-hidden="true">
        <i style={{ width: `${((i + p) / scene.length) * 100}%` }} />
      </div>
      <Comandi
        pausa={pausa}
        onPausa={() => setPausa((x) => !x)}
        onIndietro={indietro}
        onAvanti={avanti}
        extra={
          <button type="button" onClick={onFine} className="btn btn-quieto">
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

/** In fondo allo schermo, finché sotto c'è ancora qualcosa da leggere: una freccia che invita a scorrere. */
function InvitoAScorrere() {
  const [visibile, setVisibile] = useState(false);
  useEffect(() => {
    const controlla = () => setVisibile(window.innerHeight + window.scrollY < document.documentElement.scrollHeight - 160);
    controlla();
    window.addEventListener("scroll", controlla, { passive: true });
    window.addEventListener("resize", controlla);
    return () => {
      window.removeEventListener("scroll", controlla);
      window.removeEventListener("resize", controlla);
    };
  }, []);
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center pb-[max(1rem,env(safe-area-inset-bottom))] transition-opacity duration-300 ${visibile ? "opacity-100" : "opacity-0"}`}
    >
      <span className="flex flex-col items-center rounded-full bg-surface px-4 pb-1 pt-2 text-[14px] font-bold text-green shadow-carta">
        Scorri
        <Icona nome="expand_more" dimensione={28} className="motion-safe:animate-bounce" />
      </span>
    </div>
  );
}

/** La testa del muro: il titolo a mano, le righe di chi organizza, chi ha firmato. */
function TestaMuro({ aspetto, note }: { aspetto: AspettoBacheca; note: Nota[] }) {
  useFontBiglietto([aspetto.fontTitolo]);
  const nomi = elencoNomi(note.map((n) => n.f.daParteDi));
  return (
    <>
      <h1 style={aspetto.fontTitolo === "mano" ? undefined : { fontFamily: fontPerId(aspetto.fontTitolo).css }}>{aspetto.titolo}</h1>
      {aspetto.benvenuto.trim() ? <p className="righe-m">{aspetto.benvenuto}</p> : null}
      {nomi ? <p className="da">Da {nomi}</p> : null}
    </>
  );
}

function Scorrimento({ note, aspetto, onFine }: { note: Nota[]; aspetto: AspettoBacheca; onFine: () => void }) {
  return (
    <div className="apertura-b">
      <div className="muro max-w-[640px]" style={{ paddingTop: SOTTO_I_COMANDI }}>
        <TestaMuro aspetto={aspetto} note={note} />
        <div className="scorre-r">
          {note.map(({ f, colore }, i) => (
            <Appare key={f.id} className={i % 2 ? "sm:ml-16" : "sm:mr-16"}>
              <NotaFirma f={f} colore={colore} className="mb-4" />
            </Appare>
          ))}
        </div>
        <Appare className="azioni-m">
          <button type="button" onClick={onFine} className="btn btn-quieto">
            Vedili tutti insieme
          </button>
        </Appare>
      </div>
      <FirmaGifty />
      <InvitoAScorrere />
    </div>
  );
}

// ---------- Griglia: tutti insieme (è anche il finale delle altre) ----------

/** Il regalo deciso da chi organizza, quando il biglietto è di un regalo di gruppo (prototipi/biglietto-apertura.html). */
export interface RegaloRivelato {
  nome: string;
  immagine: string | null;
}

function Griglia({ note, aspetto, regalo, onRivedi, spazioSotto }: { note: Nota[]; aspetto: AspettoBacheca; regalo?: RegaloRivelato | null; onRivedi: () => void; spazioSotto: boolean }) {
  return (
    <div className="apertura-b">
      <div className="muro" style={{ paddingTop: SOTTO_I_COMANDI, paddingBottom: spazioSotto ? "9rem" : undefined }}>
        <TestaMuro aspetto={aspetto} note={note} />
        {regalo ? (
          <div className="dono">
            <span className="lastra">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {regalo.immagine ? <img src={regalo.immagine} alt="" /> : null}
            </span>
            <div>
              <p className="t-piccolo muted m-0">Il vostro regalo</p>
              <p className="m-0 font-bold">{regalo.nome}</p>
            </div>
          </div>
        ) : null}
        {note.length ? (
          <div className="foglietti">
            {note.map(({ f, colore }) => (
              <NotaFirma key={f.id} f={f} colore={colore} />
            ))}
          </div>
        ) : (
          <p className="da">Ancora nessun messaggio.</p>
        )}
        {note.length ? (
          <div className="azioni-m">
            <button type="button" onClick={onRivedi} className="btn btn-quieto">
              Rivedi dall’inizio
            </button>
          </div>
        ) : null}
      </div>
      <FirmaGifty />
    </div>
  );
}

// ---------- Il tutto ----------

/**
 * L'apertura per il festeggiato (Gifty UX v2, design.md §5, prototipi/biglietto-apertura.html): la busta «Per Marta»
 * con «Apri il biglietto» → il modo scelto da chi organizza → alla fine tutti i messaggi insieme, con il titolo a mano,
 * chi ha firmato ed eventualmente il regalo. Niente intestazione del sito, niente quote.
 * La musica (se c'è) parte con il tocco su «Apri il biglietto», perché i browser non fanno partire l'audio da soli, e
 * in alto si spegne e si riaccende.
 * `alto`: a sinistra in alto (es. l'avviso dell'anteprima); `chiudi`: in alto a destra, sempre in vista;
 * `basso`: una barra in fondo, nell'apertura e nella griglia.
 */
export function Rivelazione({
  b,
  firme,
  alto,
  chiudi,
  basso,
  regalo = null,
}: {
  b: BigliettoPubblico;
  firme: Firma[];
  alto?: ReactNode;
  chiudi?: ReactNode;
  basso?: ReactNode;
  regalo?: RegaloRivelato | null;
}) {
  const aspetto = useMemo(() => aspettoDaBiglietto(b), [b]);
  const note = useMemo<Nota[]>(() => firmeOrdinate(firme, b.ordineFirme).map((f, i) => ({ f, colore: coloreDellaNota(f.coloreNota, i) })), [firme, b.ordineFirme]);
  const modo = rivelazioneValida(b.rivelazione);
  const [fase, setFase] = useState<Fase>("apertura");
  const [scatto, setScatto] = useState(0);
  const audio = useRef<HTMLAudioElement>(null);
  const [suona, setSuona] = useState(false);
  const musica = b.musica?.url ?? null;
  const comandi = useRef<HTMLDivElement>(null);
  const [altoComandi, setAltoComandi] = useState(0);

  useEffect(() => {
    const el = comandi.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const o = new ResizeObserver(() => setAltoComandi(el.offsetHeight));
    o.observe(el);
    return () => o.disconnect();
  }, []);

  function suonaMusica() {
    // se il browser rifiuta (o il file non si carica) la sorpresa va avanti lo stesso, in silenzio
    audio.current?.play().catch(() => setSuona(false));
  }

  const vai = useCallback(
    (f: Fase) => {
      // senza messaggi non c'è niente da far scorrere: si va dritti a tutti insieme
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
    <div className="relative flex min-h-dvh flex-col bg-peach" style={altoComandi ? ({ "--riv-alto": `${altoComandi}px` } as CSSProperties) : undefined}>
      {fase === "apertura" ? (
        <Apertura
          festeggiato={b.festeggiato}
          onInizia={suonaMusica}
          onApri={() => {
            vai(modo);
            setScatto(Date.now());
          }}
        />
      ) : fase === "storie" ? (
        <Storia note={note} onFine={finale} />
      ) : fase === "film" ? (
        <Film note={note} aspetto={aspetto} b={b} onFine={finale} />
      ) : fase === "scorrimento" ? (
        <Scorrimento note={note} aspetto={aspetto} onFine={finale} />
      ) : (
        <Griglia note={note} aspetto={aspetto} regalo={regalo} onRivedi={() => vai("apertura")} spazioSotto={!!basso} />
      )}

      <div ref={comandi} className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-start justify-between gap-2 p-3">
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          {alto}
          {musica && fase !== "apertura" ? (
            <button
              type="button"
              onClick={() => (suona ? audio.current?.pause() : suonaMusica())}
              aria-label={suona ? "Spegni la musica" : "Accendi la musica"}
              title={suona ? "Spegni la musica" : "Accendi la musica"}
              className="tondo-r"
            >
              <Icona nome={suona ? "volume_up" : "volume_off"} dimensione={22} />
            </button>
          ) : null}
        </div>
        {chiudi ? <div className="pointer-events-auto">{chiudi}</div> : null}
      </div>

      {basso && (fase === "apertura" || fase === "griglia") ? (
        <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-peach via-peach/90 to-transparent pb-[max(1rem,env(safe-area-inset-bottom))] pt-8">
          <div className="mx-auto w-full max-w-[520px] px-4">{basso}</div>
        </div>
      ) : null}

      <Coriandoli scatto={scatto} emoji={aspetto.emoji || "🎉"} />
      {musica ? <audio ref={audio} src={musica} loop preload="auto" onPlay={() => setSuona(true)} onPause={() => setSuona(false)} /> : null}
    </div>
  );
}
