"use client";

// Pattern visivi comuni del biglietto (spec 3.1–3.3): intestazione con barra segmentata, pulsante a pillola,
// aiuto «?», fumetto «i» con «Ho capito», coachmark.

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { useApp } from "@/components/AppProvider";
import { Logo } from "@/components/ui";
import { giaVisto, segnaVisto } from "@/lib/biglietti/client";

/** Barra a segmenti con un pallino sorridente sulla posizione corrente (percento 0–100). */
export function BarraSegmentata({ segmenti, percento }: { segmenti: number; percento: number }) {
  const p = Math.max(0, Math.min(100, percento));
  return (
    <div className="relative h-[10px] w-full" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p)} aria-label="Avanzamento">
      <div className="absolute inset-0 flex gap-[3px] overflow-hidden rounded-full">
        {Array.from({ length: segmenti }, (_, i) => {
          const da = (i / segmenti) * 100;
          const a = ((i + 1) / segmenti) * 100;
          const pieno = Math.max(0, Math.min(1, (p - da) / (a - da)));
          return (
            <div key={i} className="relative h-full flex-1 bg-accent-field">
              <div className="absolute inset-y-0 left-0 bg-accent transition-[width] duration-500" style={{ width: `${pieno * 100}%` }} />
            </div>
          );
        })}
      </div>
      <svg
        viewBox="0 0 22 22"
        width={22}
        height={22}
        aria-hidden="true"
        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-[left] duration-500"
        style={{ left: `clamp(11px, ${p}%, calc(100% - 11px))` }}
      >
        <circle cx="11" cy="11" r="10" fill="var(--accent)" stroke="var(--surface)" strokeWidth="2" />
        <circle cx="8" cy="9.5" r="1.2" fill="var(--on-accent)" />
        <circle cx="14" cy="9.5" r="1.2" fill="var(--on-accent)" />
        <path d="M7.5 13c1 1.6 2.2 2.3 3.5 2.3s2.5-.7 3.5-2.3" stroke="var(--on-accent)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/**
 * Intestazione fissa del wizard: «indietro» a sinistra, marchio al centro, «Accedi» a destra se non si è entrati.
 * Sotto, la barra segmentata, oppure un titolo (es. «Anteprima»).
 */
export function IntestazioneWizard({
  indietro,
  segmenti,
  percento,
  titolo,
  larghezza = "max-w-[600px]",
  accedi = true,
}: {
  /** dove porta la freccia; null = nessuna freccia; "storia" = indietro del browser */
  indietro: string | "storia" | null;
  segmenti?: number;
  percento?: number;
  titolo?: string;
  larghezza?: string;
  accedi?: boolean;
}) {
  const router = useRouter();
  const percorso = usePathname();
  const { utente, pronto } = useApp();
  const freccia = (
    <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 5 8 12l7 7" />
    </svg>
  );
  return (
    <header className="no-stampa sticky top-0 z-30 border-b border-line bg-surface">
      <div className={`gutter mx-auto ${larghezza} pb-3`}>
        <div className="grid grid-cols-[44px_1fr_auto] items-center py-1">
          {indietro === null ? (
            <span />
          ) : indietro === "storia" ? (
            <button type="button" onClick={() => router.back()} aria-label="Indietro" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface-2">
              {freccia}
            </button>
          ) : (
            <Link href={indietro} aria-label="Indietro" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface-2">
              {freccia}
            </Link>
          )}
          {titolo ? (
            <h1 className="text-center font-display text-xl font-bold">{titolo}</h1>
          ) : (
            <Link href="/" className="mx-auto inline-flex min-h-tocco items-center" aria-label="Regaloop, vai alla home">
              <Logo />
            </Link>
          )}
          <span className="flex min-w-11 justify-end">
            {accedi && pronto && !utente ? (
              <Link href={`/accedi?next=${encodeURIComponent(percorso)}`} className="inline-flex min-h-tocco items-center text-sm font-semibold underline underline-offset-4">
                Accedi
              </Link>
            ) : null}
          </span>
        </div>
        {segmenti && percento !== undefined ? <BarraSegmentata segmenti={segmenti} percento={percento} /> : null}
      </div>
    </header>
  );
}

/** Pulsante primario a pillola, a tutta larghezza (~56 px). Disabilitato: grigio chiaro. */
export function BottonePillola({ className = "", pieno = true, children, ...resto }: ButtonHTMLAttributes<HTMLButtonElement> & { pieno?: boolean }) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-14 items-center justify-center gap-2 rounded-full px-8 text-base font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent enabled:bg-accent enabled:text-on-accent enabled:hover:bg-accent-2 disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-soft ${pieno ? "w-full" : ""} ${className}`}
      {...resto}
    >
      {children}
    </button>
  );
}

/** Icona «?» accanto a un'etichetta: tooltip scuro al passaggio o al tocco. */
export function Aiuto({ testo }: { testo: string }) {
  const [aperto, setAperto] = useState(false);
  const id = useId();
  return (
    <span className="relative inline-flex align-middle" onMouseEnter={() => setAperto(true)} onMouseLeave={() => setAperto(false)}>
      <button
        type="button"
        aria-label="Aiuto"
        aria-describedby={aperto ? id : undefined}
        aria-expanded={aperto}
        onClick={() => setAperto((a) => !a)}
        onBlur={() => setAperto(false)}
        className="-m-[13px] flex h-11 w-11 items-center justify-center"
      >
        <span aria-hidden="true" className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-ink-soft text-[11px] font-bold text-surface">
          ?
        </span>
      </button>
      {aperto ? (
        <span role="tooltip" id={id} className="absolute left-1/2 top-full z-40 mt-2 w-64 -translate-x-1/2 rounded-controllo bg-ink p-3 text-sm font-normal leading-snug text-surface shadow-lg max-[420px]:left-auto max-[420px]:right-[-100px] max-[420px]:translate-x-0">
          {testo}
        </span>
      ) : null}
    </span>
  );
}

/** Fumetto scuro con freccia, testo bianco centrato e «Ho capito». */
export function Fumetto({ testo, onChiudi, verso = "basso", className = "" }: { testo: ReactNode; onChiudi: () => void; verso?: "alto" | "basso"; className?: string }) {
  const rif = useRef<HTMLButtonElement>(null);
  useEffect(() => rif.current?.focus(), []);
  return (
    <div role="dialog" aria-modal="false" className={`relative z-40 w-72 max-w-[calc(100vw-32px)] rounded-contenitore bg-ink p-4 text-center text-sm leading-snug text-surface shadow-xl ${className}`}>
      <span aria-hidden="true" className={`absolute left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-ink ${verso === "basso" ? "-top-1.5" : "-bottom-1.5"}`} />
      <p>{testo}</p>
      <button ref={rif} type="button" onClick={onChiudi} className="mt-3 inline-flex min-h-tocco items-center rounded-full bg-surface px-5 font-semibold text-ink">
        Ho capito
      </button>
    </div>
  );
}

/** Icona «i» (cerchio con contorno) che apre il fumetto. */
export function Info({ testo }: { testo: string }) {
  const [aperto, setAperto] = useState(false);
  return (
    <span className="relative">
      <button
        type="button"
        aria-label="Informazioni"
        aria-expanded={aperto}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setAperto((a) => !a);
        }}
        className="flex h-11 w-11 items-center justify-center"
      >
        <span aria-hidden="true" className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-ink-soft font-serif text-xs font-bold italic text-ink-soft">
          i
        </span>
      </button>
      {aperto ? (
        <span className="absolute right-0 top-full mt-2 block" onClick={(e) => e.stopPropagation()}>
          <Fumetto testo={testo} onChiudi={() => setAperto(false)} className="[&>span:first-child]:left-auto [&>span:first-child]:right-4" />
        </span>
      ) : null}
    </span>
  );
}

/** Coachmark: si mostra una sola volta per utente (localStorage). */
export function useCoachmark(chiave: string, attivo: boolean): [boolean, () => void] {
  const [mostra, setMostra] = useState(false);
  useEffect(() => {
    if (attivo && !giaVisto(chiave)) setMostra(true);
  }, [attivo, chiave]);
  return [
    mostra,
    () => {
      segnaVisto(chiave);
      setMostra(false);
    },
  ];
}

/** Una scheda radio a tutta larghezza: pallino, etichetta, icona «i» facoltativa. */
export function SchedaRadio({ nome, valore, scelto, onScegli, etichetta, info }: { nome: string; valore: string; scelto: boolean; onScegli: () => void; etichetta: string; info?: string }) {
  return (
    <label
      className={`flex min-h-20 cursor-pointer items-center gap-3 rounded-contenitore border bg-surface pl-4 pr-1 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent ${scelto ? "border-accent ring-1 ring-accent" : "border-line hover:border-ink-soft"}`}
    >
      <input type="radio" name={nome} value={valore} checked={scelto} onChange={onScegli} className="sr-only" />
      <span aria-hidden="true" className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${scelto ? "border-accent" : "border-ink-soft"}`}>
        {scelto ? <span className="h-3 w-3 rounded-full bg-accent" /> : null}
      </span>
      <span className="flex-1 py-3 font-medium">{etichetta}</span>
      {info ? <Info testo={info} /> : null}
    </label>
  );
}

/** Etichetta di un campo, sopra il campo, peso medio; con «?» facoltativo. */
export function EtichettaCampo({ per, children, aiuto }: { per?: string; children: ReactNode; aiuto?: string }) {
  return (
    <div className="flex items-center gap-3">
      <label htmlFor={per} className="font-medium">
        {children}
      </label>
      {aiuto ? <Aiuto testo={aiuto} /> : null}
    </div>
  );
}

export const CLASSI_INPUT =
  "h-16 w-full rounded-controllo border border-line bg-surface px-4 text-base text-ink placeholder:text-ink-soft focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

/** Finestra a centro pagina con titolo e «×»: Esc chiude, il focus entra e torna dove era. */
export function Finestra({ aperta, onChiudi, titolo, children, larga }: { aperta: boolean; onChiudi: () => void; titolo: string; children: ReactNode; larga?: boolean }) {
  const chiudi = useRef<HTMLButtonElement>(null);
  const onChiudiRef = useRef(onChiudi);
  onChiudiRef.current = onChiudi;
  const idTitolo = useId();
  useEffect(() => {
    if (!aperta) return;
    const prima = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    chiudi.current?.focus();
    const t = (e: KeyboardEvent) => e.key === "Escape" && onChiudiRef.current();
    document.addEventListener("keydown", t);
    return () => {
      document.removeEventListener("keydown", t);
      document.body.style.overflow = overflow;
      prima?.focus?.();
    };
  }, [aperta]);
  if (!aperta) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={onChiudi}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitolo}
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[92dvh] w-full flex-col rounded-t-[20px] bg-surface shadow-2xl sm:rounded-contenitore ${larga ? "sm:max-w-[600px]" : "sm:max-w-md"}`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-line py-1 pl-5 pr-2">
          <h2 id={idTitolo} className="font-display text-xl font-bold">
            {titolo}
          </h2>
          <button ref={chiudi} type="button" onClick={onChiudi} aria-label="Chiudi" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl hover:bg-surface-2">
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
