"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useApp } from "@/components/AppProvider";
import { BottoneGoogle } from "@/components/BottoneGoogle";
import { ErroreApi, leggiSessione, salvaChiaveBozza, scriviSessione, useApi } from "@/lib/biglietti/client";
import { preparaImmagine } from "@/lib/biglietti/immaginiClient";
import { MODELLI_BIGLIETTO } from "@/lib/dati/modelli-biglietto";
import {
  COLORE_HEX,
  coloriDelModello,
  MODI_RIVELAZIONE,
  RIVELAZIONE_PREDEFINITA,
  SCURISCI_PREDEFINITO,
  titoloEffettivo,
  titoloPredefinito,
} from "@/lib/dominio/bacheca";
import { MAX_MESSAGGIO_GRUPPO } from "@/lib/dominio/biglietti";
import { emojiOccasione, OCCASIONI_BIGLIETTO, type Biglietto, type ColoriBacheca, type ModelloBiglietto, type ModoRivelazione } from "@/lib/tipi";
import { CLASSI_INPUT, Finestra } from "../comuni";
import { AnteprimaBacheca, type AspettoBacheca } from "../bacheca/AnteprimaBacheca";
import { AnteprimaRivelazione } from "../bacheca/AnteprimeRivelazione";

const CHIAVE_SESSIONE = "colletta.biglietto.nuovo";

interface Stato {
  passo: number;
  occasione: string;
  festeggiato: string;
  titolo: string;
  benvenuto: string;
  dataEvento: string;
  modelloId: string;
  colori: ColoriBacheca;
  rivelazione: ModoRivelazione;
  /** dataUrl già rimpicciolito (vedi preparaImmagine) */
  sfondo: string | null;
  scurisci: number;
  /** la bozza creata sul server al primo tentativo: un nuovo tentativo non ne crea un'altra */
  bozzaId: string | null;
}

function temiPer(occasione: string): ModelloBiglietto[] {
  return MODELLI_BIGLIETTO.filter((m) => m.occasioni.includes(occasione));
}

function temaIniziale(occasione: string): ModelloBiglietto {
  return temiPer(occasione)[0] ?? MODELLI_BIGLIETTO[MODELLI_BIGLIETTO.length - 1];
}

function statoIniziale(): Stato {
  const m = temaIniziale("compleanno");
  return {
    passo: 0,
    occasione: "compleanno",
    festeggiato: "",
    titolo: "",
    benvenuto: "",
    dataEvento: "",
    modelloId: m.id,
    colori: coloriDelModello(m),
    rivelazione: RIVELAZIONE_PREDEFINITA,
    sfondo: null,
    scurisci: SCURISCI_PREDEFINITO,
    bozzaId: null,
  };
}

const PASSI = ["Che cosa si festeggia?", "A chi è dedicato?", "Stile", "Come lo scoprirà", "Ritocchi finali", "Ci siamo!"] as const;
/** Il pulsante che apre le scelte di ogni passo (il pannello parte chiuso: prima si vede il biglietto). */
const APRI = ["Scegli l’occasione", "Scrivi per chi è", "Scegli tema e colori", "Scegli come lo scoprirà", "Aggiungi una foto", "Controlla e crea"] as const;

function Freccia({ su }: { su: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`h-5 w-5 transition-transform ${su ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function oggiIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function Chip({ scelto, onClick, children }: { scelto: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={scelto}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[15px] transition-colors ${scelto ? "border-accent bg-accent-field font-semibold text-accent-2" : "border-line bg-surface hover:border-line-forte"}`}
    >
      {children}
    </button>
  );
}

function Campo({ id, etichetta, aiuto, children }: { id: string; etichetta: string; aiuto?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-semibold">
        {etichetta}
      </label>
      {children}
      {aiuto ? <p className="text-sm text-ink-soft">{aiuto}</p> : null}
    </div>
  );
}

/**
 * Crea un biglietto (wizard V2, /biglietto/nuovo): sei passi con l'anteprima della bacheca sempre in vista
 * e le scelte in un pannello che sale dal basso. Tutto resta nel browser fino a «Crea il biglietto»:
 * solo allora nasce la bozza sul server, che si pubblica subito dopo l'accesso.
 */
export function CreaBiglietto() {
  const router = useRouter();
  const api = useApi();
  const { utente, auth, modalita } = useApp();
  const [s, setS] = useState<Stato>(statoIniziale);
  const [pronto, setPronto] = useState(false);
  const [aperto, setAperto] = useState(false);
  const [filtro, setFiltro] = useState<string | null>(null);
  const [invio, setInvio] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [erroreFoto, setErroreFoto] = useState<string | null>(null);
  const [accesso, setAccesso] = useState(false);
  const inAttesa = useRef(false);
  const file = useRef<HTMLInputElement>(null);
  const contenuto = useRef<HTMLDivElement>(null);
  const id = useId();

  // la bozza del wizard sopravvive a un ricaricamento della pagina
  useEffect(() => {
    const salvato = leggiSessione<Stato>(CHIAVE_SESSIONE);
    if (salvato) setS({ ...statoIniziale(), ...salvato });
    setPronto(true);
  }, []);
  useEffect(() => {
    if (pronto) scriviSessione(CHIAVE_SESSIONE, s);
  }, [s, pronto]);

  // a ogni passo si riparte dal biglietto: il pannello si richiude e, riaperto, parte dall'alto
  useEffect(() => {
    setAperto(false);
    contenuto.current?.scrollTo({ top: 0 });
  }, [s.passo]);

  const imposta = <K extends keyof Stato>(k: K, v: Stato[K]) => setS((x) => ({ ...x, [k]: v }));
  const modello = MODELLI_BIGLIETTO.find((m) => m.id === s.modelloId) ?? temaIniziale(s.occasione);
  const titolo = titoloEffettivo(s.titolo, s.occasione, s.festeggiato);
  const aspetto: AspettoBacheca = {
    titolo,
    benvenuto: s.benvenuto,
    emoji: modello.sfondo.motivo || emojiOccasione(s.occasione),
    fontTitolo: modello.fontBacheca ?? "predefinito",
    colori: s.colori,
    immagine: s.sfondo,
    scurisci: s.scurisci,
  };

  function scegliOccasione(o: string) {
    // cambiare occasione cambia anche il tema (e i suoi colori), se quello scelto non le appartiene
    setS((x) => {
      const attuale = MODELLI_BIGLIETTO.find((m) => m.id === x.modelloId);
      if (attuale?.occasioni.includes(o)) return { ...x, occasione: o };
      const m = temaIniziale(o);
      return { ...x, occasione: o, modelloId: m.id, colori: coloriDelModello(m) };
    });
    setFiltro(null);
  }

  function scegliTema(m: ModelloBiglietto) {
    setS((x) => ({ ...x, modelloId: m.id, colori: coloriDelModello(m) }));
  }

  async function caricaFoto(f: File | undefined) {
    if (!f) return;
    setErroreFoto(null);
    try {
      const img = await preparaImmagine(f);
      imposta("sfondo", img.dataUrl);
    } catch (e) {
      setErroreFoto(e instanceof Error ? e.message : "Non sono riuscito a leggere l’immagine.");
    }
  }

  const ultimo = s.passo === PASSI.length - 1;
  const puoAvanzare = s.passo !== 1 || !!s.festeggiato.trim();

  async function crea() {
    setErrore(null);
    if (!utente) {
      // l'accesso serve per gestire il biglietto anche da un altro dispositivo; dopo, si riparte da qui
      inAttesa.current = true;
      setAccesso(true);
      return;
    }
    setInvio(true);
    try {
      let bid = s.bozzaId;
      if (!bid) {
        const r = await api<{ id: string; chiave: string }>("/api/biglietti", { metodo: "POST", corpo: { occasione: s.occasione } });
        salvaChiaveBozza(r.id, r.chiave);
        bid = r.id;
        imposta("bozzaId", bid);
      }
      await api<{ biglietto: Biglietto }>(`/api/biglietti/${bid}`, {
        metodo: "PATCH",
        bigliettoId: bid,
        corpo: {
          bacheca: {
            festeggiato: s.festeggiato,
            titolo: s.titolo,
            benvenuto: s.benvenuto,
            dataEvento: s.dataEvento,
            modelloId: s.modelloId,
            colori: s.colori,
            scurisci: s.scurisci,
            rivelazione: s.rivelazione,
          },
        },
      });
      // l'immagine viaggia da sola (può pesare fino a 900 KB); null la toglie se c'era da un tentativo precedente
      await api(`/api/biglietti/${bid}/copertina`, { metodo: "POST", bigliettoId: bid, corpo: { sfondo: true, dataUrl: s.sfondo } });
      await api(`/api/biglietti/${bid}/pubblica`, { metodo: "POST", bigliettoId: bid, corpo: { nome: utente.nome } });
      scriviSessione(CHIAVE_SESSIONE, null);
      router.push(`/biglietto/${bid}/gestisci`);
    } catch (e) {
      if (e instanceof ErroreApi && e.dati.motivo === "accesso") {
        inAttesa.current = true;
        setAccesso(true);
      } else {
        setErrore(e instanceof Error ? e.message : "Non sono riuscito a creare il biglietto. Riprova.");
        // l'errore è nel pannello del riepilogo: lo si apre perché si veda
        setAperto(true);
      }
      setInvio(false);
    }
  }

  // appena l'accesso riesce, la creazione riparte da sola
  useEffect(() => {
    if (utente && inAttesa.current) {
      inAttesa.current = false;
      setAccesso(false);
      void crea();
    }
  }, [utente]); // eslint-disable-line react-hooks/exhaustive-deps

  async function accedi() {
    try {
      await auth.accediConGoogle();
    } catch {
      setErrore("Accesso con Google non riuscito. Riprova.");
    }
  }

  function avanti() {
    if (!puoAvanzare) return;
    if (ultimo) void crea();
    else imposta("passo", s.passo + 1);
  }

  const temi = filtro === null ? temiPer(s.occasione) : filtro === "tutti" ? MODELLI_BIGLIETTO : temiPer(filtro);
  const filtroAttivo = filtro ?? s.occasione;
  const occasioneScelta = OCCASIONI_BIGLIETTO.find((o) => o.valore === s.occasione);

  const pannelli: ReactNode[] = [
    // 1 — occasione
    <div key="occasione" className="flex flex-col gap-5">
      <p className="text-ink-soft">L’occasione sceglie il titolo e il tema di partenza. Potrai cambiarli dopo.</p>
      <div role="group" aria-label="Occasione" className="flex flex-wrap gap-2">
        {OCCASIONI_BIGLIETTO.map((o) => (
          <Chip key={o.valore} scelto={s.occasione === o.valore} onClick={() => scegliOccasione(o.valore)}>
            <span aria-hidden="true">{o.emoji}</span>
            {o.voce}
          </Chip>
        ))}
      </div>
      <Link
        href={`/crea?biglietto=1&occasione=${encodeURIComponent(s.occasione)}`}
        className="flex items-center gap-4 rounded-3xl border border-line bg-surface-2 p-4 hover:border-accent"
      >
        <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-controllo bg-accent-field text-2xl">
          🎁
        </span>
        <span className="flex flex-col">
          <span className="font-semibold">Volete anche fare un regalo insieme?</span>
          <span className="text-sm text-ink-soft">Ognuno mette la sua quota e firma lo stesso biglietto.</span>
          <span className="text-sm font-semibold text-accent-2">Crea una colletta con biglietto ›</span>
        </span>
      </Link>
    </div>,

    // 2 — per chi
    <div key="perchi" className="flex flex-col gap-6">
      <p className="text-ink-soft">Tutto il gruppo firmerà un solo biglietto per questa persona.</p>
      <Campo id={`${id}-n`} etichetta="Nome del festeggiato">
        <input id={`${id}-n`} className={CLASSI_INPUT} placeholder="Es. Marta" maxLength={80} autoComplete="off" value={s.festeggiato} onChange={(e) => imposta("festeggiato", e.target.value)} />
      </Campo>
      <Campo id={`${id}-t`} etichetta="Titolo (facoltativo)" aiuto="Se lo lasci vuoto usiamo quello che vedi in grigio.">
        <input id={`${id}-t`} className={CLASSI_INPUT} placeholder={titoloPredefinito(s.occasione, s.festeggiato)} maxLength={80} autoComplete="off" value={s.titolo} onChange={(e) => imposta("titolo", e.target.value)} />
      </Campo>
      <Campo id={`${id}-b`} etichetta="Due righe per chi firma (facoltativo)" aiuto="Compaiono sotto il titolo: per esempio perché lo state facendo.">
        <textarea
          id={`${id}-b`}
          className={`${CLASSI_INPUT} min-h-24 py-3`}
          placeholder={`Firmiamo tutti per ${s.festeggiato.trim() || "Marta"}: lasciate un pensiero!`}
          maxLength={MAX_MESSAGGIO_GRUPPO}
          value={s.benvenuto}
          onChange={(e) => imposta("benvenuto", e.target.value)}
        />
      </Campo>
      <Campo id={`${id}-d`} etichetta="Quando è la festa? (facoltativo)" aiuto="Ce la ricordiamo per proporti il giorno della consegna.">
        <input id={`${id}-d`} type="date" min={oggiIso()} className={CLASSI_INPUT} value={s.dataEvento} onChange={(e) => imposta("dataEvento", e.target.value)} />
      </Campo>
    </div>,

    // 3 — stile
    <div key="stile" className="flex flex-col gap-6">
      <p className="text-ink-soft">Scegli un tema, poi ritocca i colori come vuoi.</p>
      <div className="flex flex-col gap-3">
        <h3 className="font-semibold">Tema</h3>
        <div role="group" aria-label="Filtra i temi" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <Chip scelto={filtroAttivo === "tutti"} onClick={() => setFiltro("tutti")}>
            Tutti
          </Chip>
          {OCCASIONI_BIGLIETTO.filter((o) => temiPer(o.valore).length > 0).map((o) => (
            <Chip key={o.valore} scelto={filtroAttivo === o.valore} onClick={() => setFiltro(o.valore)}>
              <span aria-hidden="true">{o.emoji}</span>
              <span className="whitespace-nowrap">{o.voce}</span>
            </Chip>
          ))}
        </div>
        <div role="radiogroup" aria-label="Tema" className="-mx-4 grid auto-cols-[112px] grid-flow-col grid-rows-2 gap-3 overflow-x-auto px-4 pb-2">
          {temi.map((m) => {
            const c = coloriDelModello(m);
            const scelto = m.id === s.modelloId;
            return (
              <button key={m.id} type="button" role="radio" aria-checked={scelto} onClick={() => scegliTema(m)} className="flex flex-col items-start gap-1.5 text-left">
                <span
                  className={`flex h-20 w-full items-center justify-center rounded-2xl text-3xl ${scelto ? "ring-[3px] ring-ink ring-offset-2" : "ring-1 ring-line"}`}
                  style={{ backgroundImage: `linear-gradient(165deg, ${c.sfondo1}, ${c.sfondo2})` }}
                  aria-hidden="true"
                >
                  {m.sfondo.motivo}
                </span>
                <span className={`line-clamp-1 text-sm ${scelto ? "font-bold" : "text-ink-soft"}`}>{m.nome}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <h3 className="font-semibold">Colori</h3>
        <div className="grid grid-cols-3 gap-3">
          {(
            [
              ["sfondo1", "Sfondo in alto"],
              ["sfondo2", "Sfondo in basso"],
              ["accento", "Pulsanti"],
            ] as const
          ).map(([k, nome]) => (
            <label key={k} className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-line bg-surface p-3 text-center hover:border-line-forte">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{nome}</span>
              <span className="relative h-11 w-11 overflow-hidden rounded-full ring-1 ring-line" style={{ backgroundColor: s.colori[k] }}>
                <input
                  type="color"
                  aria-label={nome}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  value={s.colori[k].toLowerCase()}
                  onChange={(e) => COLORE_HEX.test(e.target.value) && imposta("colori", { ...s.colori, [k]: e.target.value.toUpperCase() })}
                />
              </span>
              <span className="font-mono text-xs text-ink-soft">{s.colori[k]}</span>
            </label>
          ))}
        </div>
      </div>
    </div>,

    // 4 — rivelazione
    <div key="rivelazione" className="flex flex-col gap-4">
      <p className="text-ink-soft">Quando consegni il biglietto, {s.festeggiato.trim() || "il festeggiato"} vedrà i messaggi così. Puoi cambiarlo anche dopo.</p>
      <div role="radiogroup" aria-label="Come si rivela il biglietto" className="flex flex-col gap-3">
        {MODI_RIVELAZIONE.map((m) => {
          const scelto = s.rivelazione === m.id;
          return (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={scelto}
              onClick={() => imposta("rivelazione", m.id)}
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
              <AnteprimaRivelazione modo={m.id} aspetto={aspetto} festeggiato={s.festeggiato} />
              <span className="text-sm text-ink-soft">{m.descrizione}</span>
            </button>
          );
        })}
      </div>
    </div>,

    // 5 — ritocchi
    <div key="ritocchi" className="flex flex-col gap-6">
      <p className="text-ink-soft">Tutto facoltativo: se ti piace così, vai avanti.</p>
      <div className="flex flex-col gap-3">
        <h3 className="font-semibold">Foto di sfondo</h3>
        {s.sfondo ? (
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.sfondo} alt="" className="h-20 w-20 rounded-2xl object-cover ring-1 ring-line" />
            <div className="flex flex-col items-start gap-1">
              <button type="button" onClick={() => file.current?.click()} className="min-h-tocco text-sm font-semibold text-accent-2 underline underline-offset-4">
                Cambia foto
              </button>
              <button type="button" onClick={() => imposta("sfondo", null)} className="min-h-tocco text-sm font-semibold text-error underline underline-offset-4">
                Togli la foto
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => file.current?.click()}
            className="flex min-h-24 flex-col items-center justify-center gap-1 rounded-3xl border-2 border-dashed border-line-forte bg-surface-2 p-4 text-center hover:border-accent"
          >
            <span aria-hidden="true" className="text-2xl">
              🖼️
            </span>
            <span className="font-semibold">Carica una foto</span>
            <span className="text-sm text-ink-soft">JPG, PNG o GIF. Al posto dei colori del tema.</span>
          </button>
        )}
        <input ref={file} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="sr-only" tabIndex={-1} onChange={(e) => void caricaFoto(e.target.files?.[0]).finally(() => (e.target.value = ""))} />
        {erroreFoto ? (
          <p role="alert" className="text-sm font-semibold text-error">
            {erroreFoto}
          </p>
        ) : null}
      </div>
      {s.sfondo ? (
        <div className="flex flex-col gap-2">
          <label htmlFor={`${id}-s`} className="flex items-center justify-between font-semibold">
            Scurisci la foto
            <span className="text-sm font-normal text-ink-soft">{Math.round(s.scurisci * 100)}%</span>
          </label>
          <input id={`${id}-s`} type="range" min={0} max={0.8} step={0.05} value={s.scurisci} onChange={(e) => imposta("scurisci", Number(e.target.value))} className="w-full accent-[var(--accent)]" />
          <p className="text-sm text-ink-soft">Più è scura, più si leggono titolo e messaggi.</p>
        </div>
      ) : null}
    </div>,

    // 6 — riepilogo
    <div key="riepilogo" className="flex flex-col gap-5">
      <p className="text-ink-soft">Controlla che sia tutto giusto. Dopo avrai il link da mandare al gruppo.</p>
      <dl className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface">
        {(
          [
            ["Titolo", titolo, 0],
            ["Per", s.festeggiato, 1],
            ["Occasione", occasioneScelta ? `${occasioneScelta.emoji} ${occasioneScelta.voce}` : "", 0],
            ["Tema", modello.nome, 2],
            ["Rivelazione", MODI_RIVELAZIONE.find((m) => m.id === s.rivelazione)?.nome ?? "", 3],
            ...(s.dataEvento ? ([["Festa", new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${s.dataEvento}T12:00:00`)), 1]] as const) : []),
          ] as const
        ).map(([k, v, passo]) => (
          <div key={k} className="flex items-center justify-between gap-4 px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{k}</dt>
            <dd className="flex items-center gap-2 text-right font-semibold">
              <span className="break-words">{v}</span>
              <button type="button" onClick={() => imposta("passo", passo)} className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base hover:bg-surface-2" aria-label={`Modifica: ${k}`}>
                <span aria-hidden="true">✏️</span>
              </button>
            </dd>
          </div>
        ))}
      </dl>
      <p className="flex items-start gap-3 rounded-3xl bg-accent-field p-4 text-sm text-accent-2">
        <span aria-hidden="true">💚</span>
        Dopo potrai condividere il link, vedere chi ha firmato e programmare la consegna: giorno, ora e a chi mandarlo.
      </p>
      {errore ? (
        <p role="alert" className="rounded-controllo bg-error-field p-3 text-sm font-semibold text-error">
          {errore}
        </p>
      ) : null}
    </div>,
  ];

  return (
    <div className="fixed inset-0 flex flex-col bg-field">
      {/* intestazione: chiudi, passo e barra di avanzamento */}
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-[640px] items-center gap-3 px-4 py-3">
          <Link href="/" aria-label="Chiudi e torna alla home" className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl hover:bg-surface-2">
            <span aria-hidden="true">×</span>
          </Link>
          <div className="flex flex-1 flex-col gap-2">
            <p className="flex items-baseline gap-2 text-sm">
              <span className="text-ink-soft">
                {s.passo + 1}/{PASSI.length}
              </span>
              <span className="font-bold text-accent-2">{PASSI[s.passo]}</span>
            </p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={1} aria-valuemax={PASSI.length} aria-valuenow={s.passo + 1} aria-label="Avanzamento">
              <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${((s.passo + 1) / PASSI.length) * 100}%` }} />
            </div>
          </div>
        </div>
      </header>

      <div className="relative mx-auto w-full max-w-[640px] flex-1 overflow-hidden">
        {/* anteprima dal vivo: il pannello chiuso la lascia vedere tutta */}
        <div className={`absolute inset-0 overflow-y-auto px-6 pt-6 ${aperto ? "pb-[70vh]" : "pb-40"}`}>
          {pronto ? <AnteprimaBacheca aspetto={aspetto} /> : null}
        </div>

        {/* pannello delle scelte: chiuso mostra solo il passo e il pulsante per aprirlo */}
        <section aria-label={PASSI[s.passo]} className={`absolute inset-x-0 bottom-0 flex flex-col rounded-t-[28px] bg-surface shadow-[0_-12px_32px_-8px_rgba(3,57,34,0.18)] ${aperto ? "max-h-[68%]" : ""}`}>
          {aperto ? (
            <button type="button" onClick={() => setAperto(false)} aria-expanded className="flex flex-col items-stretch px-4 pb-3 pt-2 text-left">
              <span aria-hidden="true" className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-line-forte" />
              <span className="flex items-center justify-between gap-3">
                <h2 className="font-display text-2xl font-bold text-ink">{PASSI[s.passo]}</h2>
                <span className="flex h-11 shrink-0 items-center gap-1 rounded-full bg-surface-2 px-3 text-sm font-semibold text-ink-soft">
                  Vedi il biglietto <Freccia su={false} />
                </span>
              </span>
            </button>
          ) : (
            <div className="flex flex-col gap-3 px-4 pb-4 pt-2">
              <span aria-hidden="true" className="mx-auto h-1.5 w-10 rounded-full bg-line-forte" />
              <h2 className="font-display text-xl font-bold text-ink">{PASSI[s.passo]}</h2>
              <button
                type="button"
                onClick={() => setAperto(true)}
                aria-expanded={false}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-accent bg-accent-field px-5 font-bold text-accent-2 hover:bg-surface-2"
              >
                {APRI[s.passo]} <Freccia su />
              </button>
            </div>
          )}
          {aperto ? (
            <div ref={contenuto} className="overflow-y-auto px-4 pb-6">
              {pronto ? pannelli[s.passo] : null}
            </div>
          ) : null}
        </section>
      </div>

      {/* Indietro / Avanti */}
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex w-full max-w-[640px] items-center justify-between gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => imposta("passo", Math.max(0, s.passo - 1))}
            disabled={s.passo === 0 || invio}
            className="inline-flex min-h-12 items-center gap-2 rounded-full px-4 font-semibold text-ink-soft hover:bg-surface-2 disabled:opacity-40"
          >
            <span aria-hidden="true">←</span> Indietro
          </button>
          <button
            type="button"
            onClick={avanti}
            disabled={!puoAvanzare || invio}
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-cta px-6 text-[17px] font-bold text-on-cta shadow-sollevata hover:bg-cta-2 disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-soft disabled:shadow-none"
          >
            {ultimo ? (invio ? "Un momento…" : "✨ Crea il biglietto") : "Avanti"}
            {ultimo ? null : <span aria-hidden="true">→</span>}
          </button>
        </div>
      </footer>

      <Finestra aperta={accesso} onChiudi={() => ((inAttesa.current = false), setAccesso(false))} titolo="Accedi per creare il biglietto">
        <div className="flex flex-col items-center gap-4 text-center">
          <p>Con un account ritrovi il biglietto da qualsiasi dispositivo e vedi chi ha firmato. Quello che hai preparato resta com’è.</p>
          <BottoneGoogle onClick={() => void accedi()} />
          {modalita === "memoria" ? <p className="text-xs text-ink-soft">Senza Firebase l’accesso è finto e immediato.</p> : null}
        </div>
      </Finestra>
    </div>
  );
}
