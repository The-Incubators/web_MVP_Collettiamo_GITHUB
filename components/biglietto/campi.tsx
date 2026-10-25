"use client";

// Controlli dei moduli del biglietto: tendina personalizzata (non <select> nativo), calendario, ora, fuso,
// campo ricco (contenteditable) e anteprima del link con la verifica di disponibilità.

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { aggiungiGiorni, confrontaGiorni, etichettaFuso, giornoDaIso, giornoInIso, giornoRoma, type Giorno } from "@/lib/dominio/date";
import { ORARI_15, slugBigliettoValido, slugDaNome } from "@/lib/dominio/biglietti";

function useClicFuori(rif: React.RefObject<HTMLElement | null>, attivo: boolean, chiudi: () => void) {
  const cb = useRef(chiudi);
  cb.current = chiudi;
  useEffect(() => {
    if (!attivo) return;
    const f = (e: PointerEvent) => {
      if (rif.current && !rif.current.contains(e.target as Node)) cb.current();
    };
    document.addEventListener("pointerdown", f);
    return () => document.removeEventListener("pointerdown", f);
  }, [attivo, rif]);
}

const FRECCIA_GIU = (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export interface Opzione {
  valore: string;
  etichetta: ReactNode;
  /** testo semplice per l'accessibilità e la ricerca per lettera */
  testo: string;
}

/** Tendina personalizzata: elenco a tutta larghezza, righe ~60 px separate da linee sottili, tastiera completa. */
export function Tendina({
  id,
  valore,
  opzioni,
  segnaposto,
  disabilitata,
  onScegli,
  etichettaId,
  altezzaRiga = 60,
  maxAltezza = 360,
}: {
  id?: string;
  valore: string | null;
  opzioni: Opzione[];
  segnaposto: string;
  disabilitata?: boolean;
  onScegli: (v: string) => void;
  etichettaId?: string;
  altezzaRiga?: number;
  maxAltezza?: number;
}) {
  const [aperta, setAperta] = useState(false);
  const [attiva, setAttiva] = useState(0);
  const contenitore = useRef<HTMLDivElement>(null);
  const elenco = useRef<HTMLUListElement>(null);
  const bottone = useRef<HTMLButtonElement>(null);
  const idElenco = useId();
  useClicFuori(contenitore, aperta, () => setAperta(false));
  const scelta = opzioni.find((o) => o.valore === valore) ?? null;

  useEffect(() => {
    if (!aperta) return;
    const i = Math.max(0, opzioni.findIndex((o) => o.valore === valore));
    setAttiva(i);
    requestAnimationFrame(() => {
      elenco.current?.focus();
      elenco.current?.querySelector<HTMLElement>(`[data-i="${i}"]`)?.scrollIntoView({ block: "center" });
    });
  }, [aperta]); // eslint-disable-line react-hooks/exhaustive-deps

  const scegli = (i: number) => {
    const o = opzioni[i];
    if (!o) return;
    onScegli(o.valore);
    setAperta(false);
    bottone.current?.focus();
  };
  const sposta = (i: number) => {
    const n = Math.max(0, Math.min(opzioni.length - 1, i));
    setAttiva(n);
    elenco.current?.querySelector<HTMLElement>(`[data-i="${n}"]`)?.scrollIntoView({ block: "nearest" });
  };

  return (
    <div ref={contenitore} className={`relative ${disabilitata ? "opacity-50" : ""}`}>
      <button
        ref={bottone}
        id={id}
        type="button"
        disabled={disabilitata}
        aria-haspopup="listbox"
        aria-expanded={aperta}
        aria-controls={aperta ? idElenco : undefined}
        aria-labelledby={etichettaId && id ? `${etichettaId} ${id}` : undefined}
        onClick={() => setAperta((a) => !a)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setAperta(true);
          }
        }}
        className={`flex h-16 w-full items-center justify-between gap-2 rounded-controllo border bg-surface px-4 text-left text-base disabled:cursor-not-allowed ${aperta ? "border-accent ring-2 ring-accent-field" : "border-line"}`}
      >
        <span className={`min-w-0 truncate ${scelta ? "" : "text-ink-soft"}`}>{scelta ? scelta.etichetta : segnaposto}</span>
        <span className={`shrink-0 transition-transform ${aperta ? "rotate-180" : ""}`}>{FRECCIA_GIU}</span>
      </button>
      {aperta ? (
        <ul
          ref={elenco}
          id={idElenco}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={etichettaId}
          aria-activedescendant={`${idElenco}-${attiva}`}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") sposta(attiva + 1);
            else if (e.key === "ArrowUp") sposta(attiva - 1);
            else if (e.key === "Home") sposta(0);
            else if (e.key === "End") sposta(opzioni.length - 1);
            else if (e.key === "Enter" || e.key === " ") scegli(attiva);
            else if (e.key === "Escape" || e.key === "Tab") {
              setAperta(false);
              if (e.key === "Escape") bottone.current?.focus();
              return;
            } else if (e.key.length === 1) {
              const i = opzioni.findIndex((o, k) => k > attiva && o.testo.toLowerCase().startsWith(e.key.toLowerCase()));
              const j = i >= 0 ? i : opzioni.findIndex((o) => o.testo.toLowerCase().startsWith(e.key.toLowerCase()));
              if (j >= 0) sposta(j);
              return;
            } else return;
            e.preventDefault();
          }}
          className="absolute left-0 right-0 top-full z-40 mt-1 overflow-y-auto rounded-controllo border border-line bg-surface shadow-xl outline-none"
          style={{ maxHeight: maxAltezza }}
        >
          {opzioni.map((o, i) => (
            <li
              key={o.valore}
              id={`${idElenco}-${i}`}
              data-i={i}
              role="option"
              aria-selected={o.valore === valore}
              onPointerEnter={() => setAttiva(i)}
              onClick={() => scegli(i)}
              className={`flex cursor-pointer items-center gap-3 border-b border-line px-4 last:border-b-0 ${i === attiva ? "bg-accent-field" : ""} ${o.valore === valore ? "font-semibold" : ""}`}
              style={{ minHeight: altezzaRiga }}
            >
              {o.etichetta}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

const MESI = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
const GIORNI = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"];

/** "17 ottobre 2026" */
export function dataScritta(iso: string): string {
  const g = giornoDaIso(iso);
  return g ? `${g.g} ${MESI[g.m - 1].toLowerCase()} ${g.a}` : "";
}

/** Calendario a tendina: giorni passati barrati e non selezionabili, oggi cerchiato. */
export function SelettoreData({ id, valore, onScegli, segnaposto = "Scegli una data" }: { id?: string; valore: string; onScegli: (iso: string) => void; segnaposto?: string }) {
  const oggi = giornoRoma(Date.now());
  const scelto = giornoDaIso(valore);
  const [aperto, setAperto] = useState(false);
  const [mese, setMese] = useState<{ a: number; m: number }>(() => (scelto ? { a: scelto.a, m: scelto.m } : { a: oggi.a, m: oggi.m }));
  const [fuoco, setFuoco] = useState<Giorno>(scelto ?? oggi);
  const contenitore = useRef<HTMLDivElement>(null);
  const griglia = useRef<HTMLDivElement>(null);
  useClicFuori(contenitore, aperto, () => setAperto(false));

  const primo: Giorno = { a: mese.a, m: mese.m, g: 1 };
  const giorniMese = new Date(Date.UTC(mese.a, mese.m, 0)).getUTCDate();
  const vuoti = (new Date(Date.UTC(mese.a, mese.m - 1, 1)).getUTCDay() + 6) % 7;
  const meseCorrente = mese.a === oggi.a && mese.m === oggi.m;
  const cambiaMese = (d: number) => setMese(({ a, m }) => ({ a: a + Math.floor((m - 1 + d) / 12), m: ((((m - 1 + d) % 12) + 12) % 12) + 1 }));

  useEffect(() => {
    if (aperto) requestAnimationFrame(() => griglia.current?.querySelector<HTMLElement>("[data-fuoco='1']")?.focus());
  }, [aperto, fuoco, mese]);

  const muoviFuoco = (n: number) => {
    const f = aggiungiGiorni(fuoco, n);
    if (confrontaGiorni(f, oggi) < 0) return;
    setFuoco(f);
    setMese({ a: f.a, m: f.m });
  };

  return (
    <div ref={contenitore} className="relative">
      <button
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={aperto}
        onClick={() => {
          setFuoco(scelto ?? oggi);
          setMese(scelto ? { a: scelto.a, m: scelto.m } : { a: oggi.a, m: oggi.m });
          setAperto((a) => !a);
        }}
        className={`flex h-16 w-full items-center justify-between rounded-controllo border bg-surface px-4 text-left text-base ${aperto ? "border-accent ring-2 ring-accent-field" : "border-line"}`}
      >
        <span className={scelto ? "" : "text-ink-soft"}>{scelto ? dataScritta(valore) : segnaposto}</span>
        <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      </button>
      {aperto ? (
        <div role="dialog" aria-label="Scegli una data" className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-controllo border border-line bg-surface shadow-xl sm:right-auto sm:w-80">
          <div className="flex items-center justify-between bg-accent px-2 py-1 text-on-accent">
            <button type="button" onClick={() => cambiaMese(-1)} disabled={meseCorrente} aria-label="Mese precedente" className="flex h-11 w-11 items-center justify-center rounded-full text-xl disabled:opacity-30">
              ‹
            </button>
            <span className="font-semibold" aria-live="polite">
              {MESI[mese.m - 1]} {mese.a}
            </span>
            <button type="button" onClick={() => cambiaMese(1)} aria-label="Mese successivo" className="flex h-11 w-11 items-center justify-center rounded-full text-xl">
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 px-2 pt-2 text-center text-xs font-semibold uppercase text-ink-soft">
            {GIORNI.map((g) => (
              <span key={g} aria-hidden="true">
                {g}
              </span>
            ))}
          </div>
          <div
            ref={griglia}
            role="grid"
            className="grid grid-cols-7 gap-y-1 p-2"
            onKeyDown={(e) => {
              const passi: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
              if (passi[e.key]) {
                e.preventDefault();
                muoviFuoco(passi[e.key]);
              } else if (e.key === "Escape") setAperto(false);
            }}
          >
            {Array.from({ length: vuoti }, (_, i) => (
              <span key={`v${i}`} />
            ))}
            {Array.from({ length: giorniMese }, (_, i) => {
              const g: Giorno = { ...primo, g: i + 1 };
              const passato = confrontaGiorni(g, oggi) < 0;
              const eOggi = confrontaGiorni(g, oggi) === 0;
              const eScelto = scelto ? confrontaGiorni(g, scelto) === 0 : false;
              const haFuoco = confrontaGiorni(g, fuoco) === 0;
              return (
                <button
                  key={i}
                  type="button"
                  role="gridcell"
                  disabled={passato}
                  tabIndex={haFuoco ? 0 : -1}
                  data-fuoco={haFuoco ? "1" : undefined}
                  aria-selected={eScelto}
                  aria-label={`${i + 1} ${MESI[mese.m - 1].toLowerCase()} ${mese.a}${eOggi ? ", oggi" : ""}`}
                  onClick={() => {
                    onScegli(giornoInIso(g));
                    setAperto(false);
                  }}
                  className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm ${passato ? "cursor-not-allowed text-ink-soft line-through opacity-60" : "hover:bg-accent-field"} ${eScelto ? "bg-accent font-bold text-on-accent hover:bg-accent" : eOggi ? "border-2 border-accent font-semibold" : ""}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SelettoreOra({ id, valore, onScegli }: { id?: string; valore: string; onScegli: (ora: string) => void }) {
  return <Tendina id={id} valore={valore || null} segnaposto="Scegli l’ora" onScegli={onScegli} altezzaRiga={44} maxAltezza={260} opzioni={ORARI_15.map((o) => ({ valore: o, etichetta: o, testo: o }))} />;
}

const FUSI = [
  "Europe/Rome",
  "Europe/London",
  "Europe/Lisbon",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Zurich",
  "Europe/Vienna",
  "Europe/Athens",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Asia/Dubai",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export function nomeFuso(fuso: string): string {
  return fuso === "Europe/Rome" ? "Ora italiana" : etichettaFuso(fuso, Date.now());
}

export function fusoDelBrowser(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Rome";
  } catch {
    return "Europe/Rome";
  }
}

/** Il fuso come testo modificabile: «Ora italiana · cambia» (S6). */
export function SelettoreFuso({ valore, onScegli }: { valore: string; onScegli: (f: string) => void }) {
  const [aperto, setAperto] = useState(false);
  const elenco = FUSI.includes(valore) ? FUSI : [valore, ...FUSI];
  if (!aperto) {
    return (
      <p className="flex flex-wrap items-center gap-x-2 text-sm text-ink-soft">
        <span>
          Fuso orario: <span className="font-medium text-ink">{nomeFuso(valore)}</span>
        </span>
        <button type="button" onClick={() => setAperto(true)} className="min-h-tocco font-semibold text-accent-2 underline underline-offset-4">
          Cambia
        </button>
      </p>
    );
  }
  return (
    <Tendina
      valore={valore}
      segnaposto="Fuso orario"
      onScegli={(f) => {
        onScegli(f);
        setAperto(false);
      }}
      altezzaRiga={48}
      opzioni={elenco.map((f) => ({ valore: f, etichetta: f === "Europe/Rome" ? `${etichettaFuso(f, Date.now())} · Ora italiana` : etichettaFuso(f, Date.now()), testo: f }))}
    />
  );
}

/** Area di testo ricca (contenteditable): grassetto/corsivo con le scorciatoie; il server ripulisce l'HTML. */
export function CampoRicco({
  id,
  valore,
  onCambia,
  segnaposto,
  altezza = 270,
  etichettaId,
  children,
  className = "",
  stile,
}: {
  id?: string;
  valore: string;
  onCambia: (html: string) => void;
  segnaposto: string;
  altezza?: number;
  etichettaId?: string;
  children?: ReactNode;
  className?: string;
  stile?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const iniziato = useRef(false);
  useEffect(() => {
    // il contenuto si imposta solo dall'esterno (all'avvio o se cambia da fuori), mai a ogni battitura
    const el = ref.current;
    if (el && el.innerHTML !== valore && (!iniziato.current || document.activeElement !== el)) el.innerHTML = valore;
    iniziato.current = true;
  }, [valore]);
  return (
    <div className={`relative rounded-controllo border border-line bg-surface focus-within:border-accent focus-within:ring-2 focus-within:ring-accent-field ${className}`}>
      <div
        ref={ref}
        id={id}
        role="textbox"
        aria-multiline="true"
        aria-labelledby={etichettaId}
        contentEditable
        suppressContentEditableWarning
        data-segnaposto={segnaposto}
        className="editabile campo-ricco overflow-y-auto px-4 py-3 text-base outline-none [&:focus]:!outline-none"
        style={{ minHeight: altezza, maxHeight: altezza * 2, ...stile }}
        onInput={(e) => {
          const el = e.currentTarget;
          if (!el.textContent?.trim() && !el.querySelector("img")) {
            if (el.innerHTML !== "") el.innerHTML = "";
          }
          onCambia(el.innerHTML);
        }}
        onPaste={(e) => {
          e.preventDefault();
          document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
        }}
      />
      {children}
    </div>
  );
}

export type StatoLink = "vuoto" | "controllo" | "libero" | "occupato" | "non-valido";

/**
 * Il link del biglietto sotto al nome: si aggiorna mentre si scrive, e dopo 600 ms senza battiture verifica se è
 * libero. Se è occupato non svuota nulla (S5): avvisa e propone un link con un numero in fondo.
 */
export function AnteprimaLink({
  bigliettoId,
  nome,
  slug,
  manuale,
  onSlug,
  onStato,
  dominio,
  ricontrolla = 0,
}: {
  /** cambia per forzare una nuova verifica (es. link preso da altri al momento del salvataggio) */
  ricontrolla?: number;
  bigliettoId: string;
  nome: string;
  slug: string;
  manuale: boolean;
  onSlug: (slug: string, manuale: boolean) => void;
  onStato: (s: StatoLink) => void;
  dominio: string;
}) {
  const [stato, setStato] = useState<StatoLink>("vuoto");
  const [suggerito, setSuggerito] = useState<string | null>(null);
  const [modifica, setModifica] = useState(false);
  const [bozzaLink, setBozzaLink] = useState(slug);
  const idCampo = useId();

  // il link segue il nome, finché non lo si modifica a mano
  useEffect(() => {
    if (!manuale) {
      const s = slugDaNome(nome);
      if (s !== slug) onSlug(s, false);
    }
  }, [nome, manuale]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const imposta = (s: StatoLink) => {
      setStato(s);
      onStato(s);
    };
    if (!slug) return imposta("vuoto");
    if (!slugBigliettoValido(slug)) return imposta("non-valido");
    imposta("controllo");
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/biglietti/slug?s=${encodeURIComponent(slug)}&id=${encodeURIComponent(bigliettoId)}`, { signal: ctrl.signal, cache: "no-store" })
        .then((r) => r.json() as Promise<{ disponibile?: boolean; suggerito?: string | null }>)
        .then((j) => {
          setSuggerito(j.suggerito ?? null);
          imposta(j.disponibile ? "libero" : "occupato");
        })
        .catch(() => {});
    }, 600);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [slug, bigliettoId, ricontrolla]); // eslint-disable-line react-hooks/exhaustive-deps

  const salvaLink = () => {
    const s = slugDaNome(bozzaLink);
    onSlug(s, true);
    setModifica(false);
  };

  return (
    <div className="flex flex-col gap-2">
      {modifica ? (
        <div className="flex flex-col gap-2">
          <label htmlFor={idCampo} className="text-sm font-medium">
            Link
          </label>
          <div className="flex items-stretch gap-2">
            <input
              id={idCampo}
              value={bozzaLink}
              onChange={(e) => setBozzaLink(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  salvaLink();
                }
              }}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="h-12 min-w-0 flex-1 rounded-controllo border border-line bg-surface px-3 text-base focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-field"
            />
          </div>
          <p className="break-all text-sm text-ink-soft">
            {dominio}/b/{slugDaNome(bozzaLink) || "…"}
          </p>
        </div>
      ) : (
        <p className="break-all text-sm text-ink-soft">
          {dominio}/b/<span className="font-semibold text-ink">{slug || "…"}</span>
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => (modifica ? salvaLink() : (setBozzaLink(slug), setModifica(true)))}
          className="inline-flex min-h-tocco items-center gap-1.5 text-sm font-semibold text-accent-2"
        >
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 20h4L19 9l-4-4L4 16z" />
          </svg>
          {modifica ? "Salva link" : "Modifica link"}
        </button>
        <span aria-live="polite" className="text-sm">
          {stato === "controllo" ? <span className="text-ink-soft">Controllo il link…</span> : null}
          {stato === "libero" && !modifica ? <span className="font-semibold text-ok">Questo link è disponibile</span> : null}
          {stato === "non-valido" ? <span className="text-ink-soft">Il link deve avere almeno 3 lettere o numeri.</span> : null}
        </span>
      </div>
      {stato === "occupato" ? (
        <div role="status" className="flex items-start gap-3 rounded-controllo border border-gold-line bg-gold-field p-3">
          <span aria-hidden="true" className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-gold font-serif text-xs font-bold italic text-gold">
            i
          </span>
          <div className="flex flex-col gap-2">
            <p className="font-semibold">Questo nome è già usato: prova a cambiare l’ordine delle parole o ad aggiungere un numero in fondo.</p>
            {suggerito ? (
              <button type="button" onClick={() => onSlug(suggerito, true)} className="self-start text-sm font-semibold text-accent-2 underline underline-offset-4">
                Usa il link /b/{suggerito}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
