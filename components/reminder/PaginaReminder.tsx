"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Avviso, Bottone, Icona, type NomeIcona } from "@/components/ui";
import {
  caselleDelMese,
  etichettaTipo,
  meseDopo,
  NOMI_MESI,
  oggiLocale,
  prossimaData,
  prossimeRicorrenze,
  ricorrenzeDelMese,
  testoAnni,
  testoData,
  testoMancano,
  TIPI_RICORRENZA,
  type Giorno,
  type Reminder,
} from "@/lib/dominio/reminder";
import { FormReminder } from "./FormReminder";
import { useReminder } from "./useReminder";

const GIORNI_SETTIMANA = [
  ["L", "lunedì"],
  ["M", "martedì"],
  ["M", "mercoledì"],
  ["G", "giovedì"],
  ["V", "venerdì"],
  ["S", "sabato"],
  ["D", "domenica"],
] as const;

/** Quante ricorrenze mostrare in «In arrivo». */
const IN_ARRIVO = 3;

const maiuscola = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const iconaTipo = (r: Reminder): NomeIcona => TIPI_RICORRENZA.find((t) => t.id === r.tipo)?.icona ?? "event";

/**
 * La pagina «Reminder»: i compleanni e le ricorrenze da non dimenticare. In cima le prossime, poi il
 * calendario del mese (si scorre avanti e indietro) con l'elenco delle sue ricorrenze. Le notifiche, qualche
 * settimana prima, arriveranno in un secondo momento: il preavviso scelto è già salvato con ogni ricorrenza.
 */
export function PaginaReminder() {
  const { elenco, pronto, conAccount, autenticazionePronta, salva, elimina } = useReminder();
  const [modulo, setModulo] = useState<Reminder | "nuova" | null>(null);
  const [vistaScelta, setVistaScelta] = useState<{ anno: number; mese: number } | null>(null);
  const [giornoScelto, setGiornoScelto] = useState<number | null>(null);
  const [annuncio, setAnnuncio] = useState("");
  const inCima = useRef<HTMLDivElement>(null);
  const ritorno = useRef<HTMLElement | null>(null);
  const aggiungi = useRef<HTMLDivElement>(null);

  // la data di oggi si legge nel browser, solo dopo il caricamento: così il server non disegna un altro giorno
  const oggi = pronto ? oggiLocale() : null;

  function apri(cosa: Reminder | "nuova") {
    ritorno.current = document.activeElement as HTMLElement | null;
    setModulo(cosa);
    requestAnimationFrame(() => inCima.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function chiudi(messaggio = "") {
    setModulo(null);
    setAnnuncio(messaggio);
    requestAnimationFrame(() => {
      const dove = ritorno.current?.isConnected ? ritorno.current : aggiungi.current?.querySelector("button");
      dove?.focus({ preventScroll: true });
    });
  }

  function vaiAlMese(v: { anno: number; mese: number }) {
    setVistaScelta(v);
    setGiornoScelto(null);
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div ref={inCima} className="flex scroll-mt-24 flex-col gap-2">
        <h1 className="text-[32px] font-bold leading-[38px] tracking-tight text-accent-2">Reminder</h1>
        <p className="text-ink-soft">I compleanni e le ricorrenze che non vuoi dimenticare. Ti avviseremo qualche settimana prima, così hai tempo per il regalo.</p>
        {autenticazionePronta && !conAccount ? (
          <p className="text-sm text-ink-soft">
            Sono salvati su questo dispositivo.{" "}
            <Link href="/accedi?next=/reminder" className="font-bold text-accent underline underline-offset-4">
              Accedi
            </Link>{" "}
            per ritrovarli ovunque.
          </p>
        ) : conAccount ? (
          <p className="text-sm text-ink-soft">Sono salvati nel tuo account: li ritrovi su ogni dispositivo.</p>
        ) : null}
      </div>

      <p className="sr-only" aria-live="polite">
        {annuncio}
      </p>

      {modulo ? (
        <FormReminder
          key={modulo === "nuova" ? "nuova" : modulo.id}
          iniziale={modulo === "nuova" ? undefined : modulo}
          meseProposto={vistaScelta?.mese ?? oggi?.mese ?? 1}
          onSalva={async (r) => {
            await salva(r);
            // il calendario va al mese in cui cade la prossima volta (un febbraio già passato sarebbe l'anno prossimo)
            const prossima = prossimaData(r, oggiLocale());
            vaiAlMese({ anno: prossima.anno, mese: prossima.mese });
            chiudi(modulo === "nuova" ? "Ricorrenza salvata" : "Modifiche salvate");
          }}
          onElimina={
            modulo === "nuova"
              ? undefined
              : async () => {
                  await elimina(modulo.id);
                  chiudi("Ricorrenza eliminata");
                }
          }
          onChiudi={() => chiudi()}
        />
      ) : (
        <div ref={aggiungi}>
          <Bottone variante="azione" pieno onClick={() => apri("nuova")} disabled={!pronto}>
            <Icona nome="add" dimensione={22} />
            Aggiungi una ricorrenza
          </Bottone>
        </div>
      )}

      {!pronto || !oggi ? (
        <p className="text-center text-ink-soft">Carico le tue ricorrenze…</p>
      ) : (
        <>
          {elenco.length ? (
            <InArrivo elenco={elenco} oggi={oggi} onApri={apri} />
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-3xl bg-surface p-6 text-center shadow-carta">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-cta-field text-cta-2">
                <Icona nome="cake" dimensione={32} />
              </span>
              <p className="font-display text-xl font-semibold text-accent-2">Nessuna ricorrenza, per ora</p>
              <p className="text-sm text-ink-soft">Aggiungi il primo compleanno: lo vedrai nel calendario e non ti sfuggirà più.</p>
            </div>
          )}
          <Calendario
            elenco={elenco}
            oggi={oggi}
            vista={vistaScelta ?? { anno: oggi.anno, mese: oggi.mese }}
            giornoScelto={giornoScelto}
            onVista={vaiAlMese}
            onGiorno={setGiornoScelto}
            onApri={apri}
          />
          <Avviso titolo="Le notifiche arriveranno presto">
            Ti avviseremo con una notifica, con l&apos;anticipo che scegli per ogni ricorrenza. Intanto le trovi tutte qui.
          </Avviso>
        </>
      )}
    </div>
  );
}

/** La data in un quadratino: il giorno grande, il mese abbreviato sotto. */
function Datario({ giorno, mese, evidenza }: { giorno: number; mese: number; evidenza?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl leading-none ${evidenza ? "bg-cta text-on-cta" : "bg-cta-field text-cta-2"}`}
    >
      <span className="cifre text-xl font-extrabold">{giorno}</span>
      <span className="text-[11px] font-bold uppercase">{NOMI_MESI[mese - 1].slice(0, 3)}</span>
    </span>
  );
}

function InArrivo({ elenco, oggi, onApri }: { elenco: Reminder[]; oggi: Giorno; onApri: (r: Reminder) => void }) {
  const prossime = prossimeRicorrenze(elenco, oggi, IN_ARRIVO);
  return (
    <section aria-labelledby="in-arrivo" className="flex flex-col gap-3">
      <h2 id="in-arrivo" className="font-display text-xl font-semibold text-accent-2">
        In arrivo
      </h2>
      <ul className="flex flex-col gap-3">
        {prossime.map(({ reminder: r, data, giorni }) => {
          const anni = testoAnni(r, data.anno);
          return (
            <li key={r.id} className="flex flex-col gap-3 rounded-3xl bg-surface p-4 shadow-carta">
              <div className="flex items-center gap-3">
                <Datario giorno={data.giorno} mese={data.mese} evidenza={giorni <= 7 * r.preavvisoSettimane} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="truncate font-display text-lg font-semibold text-ink">{r.nome}</p>
                  <p className="text-sm text-ink-soft">
                    <span className="sr-only">{testoData(data)}, </span>
                    {etichettaTipo(r.tipo)}
                    {anni ? ` · ${anni}` : ""}
                  </p>
                </div>
                <span className="cifre shrink-0 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-bold text-accent">{testoMancano(giorni)}</span>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/regalo"
                  className="flex min-h-tocco flex-1 items-center justify-center gap-1.5 rounded-full bg-line px-3 text-sm font-bold text-accent hover:bg-line-forte"
                >
                  <Icona nome="redeem" dimensione={18} />
                  Trova un regalo
                </Link>
                <button
                  type="button"
                  onClick={() => onApri(r)}
                  className="flex min-h-tocco items-center justify-center gap-1.5 rounded-full px-3 text-sm font-bold text-accent hover:bg-surface-2"
                >
                  <Icona nome="edit" dimensione={18} />
                  Modifica<span className="sr-only"> {r.nome}</span>
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Calendario({
  elenco,
  oggi,
  vista,
  giornoScelto,
  onVista,
  onGiorno,
  onApri,
}: {
  elenco: Reminder[];
  oggi: Giorno;
  vista: { anno: number; mese: number };
  giornoScelto: number | null;
  onVista: (v: { anno: number; mese: number }) => void;
  onGiorno: (g: number | null) => void;
  onApri: (r: Reminder) => void;
}) {
  const { anno, mese } = vista;
  const delMese = ricorrenzeDelMese(elenco, anno, mese);
  const perGiorno = new Map<number, Reminder[]>();
  for (const { giorno, reminder } of delMese) perGiorno.set(giorno, [...(perGiorno.get(giorno) ?? []), reminder]);
  const mostrate = giornoScelto === null ? delMese : delMese.filter((x) => x.giorno === giornoScelto);
  const nomeMese = NOMI_MESI[mese - 1];
  const meseCorrente = anno === oggi.anno && mese === oggi.mese;

  return (
    <section aria-labelledby="calendario" className="flex flex-col gap-4 rounded-3xl bg-surface p-4 shadow-carta">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onVista(meseDopo(anno, mese, -1))}
          aria-label="Mese precedente"
          className="flex h-11 w-11 items-center justify-center rounded-full text-accent hover:bg-surface-2"
        >
          <Icona nome="chevron_left" />
        </button>
        <div className="flex flex-col items-center">
          <h2 id="calendario" aria-live="polite" className="font-display text-xl font-semibold text-accent-2">
            {maiuscola(nomeMese)} {anno}
          </h2>
          {!meseCorrente ? (
            <button type="button" onClick={() => onVista({ anno: oggi.anno, mese: oggi.mese })} className="text-xs font-bold text-accent underline underline-offset-4">
              Torna a oggi
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onVista(meseDopo(anno, mese, 1))}
          aria-label="Mese successivo"
          className="flex h-11 w-11 items-center justify-center rounded-full text-accent hover:bg-surface-2"
        >
          <Icona nome="chevron_right" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {GIORNI_SETTIMANA.map(([breve, intero]) => (
          <abbr key={intero} title={intero} className="pb-1 text-xs font-bold text-ink-soft no-underline">
            {breve}
          </abbr>
        ))}
        {caselleDelMese(anno, mese).map((g, i) => {
          if (g === null) return <span key={`vuota-${i}`} aria-hidden="true" />;
          const qui = perGiorno.get(g);
          const eOggi = meseCorrente && g === oggi.giorno;
          const anello = eOggi ? "ring-2 ring-accent" : "";
          if (!qui) {
            return (
              <span key={g} className={`cifre flex aspect-square items-center justify-center rounded-full text-sm text-ink ${anello}`}>
                {g}
              </span>
            );
          }
          const scelto = giornoScelto === g;
          return (
            <button
              key={g}
              type="button"
              aria-pressed={scelto}
              aria-label={`${g} ${nomeMese}${eOggi ? ", oggi" : ""}: ${qui.map((r) => `${r.nome}, ${etichettaTipo(r.tipo).toLowerCase()}`).join("; ")}`}
              onClick={() => onGiorno(scelto ? null : g)}
              className={`cifre relative flex aspect-square flex-col items-center justify-center rounded-full text-sm font-extrabold transition-colors ${
                scelto ? "bg-cta text-on-cta" : "bg-cta-field text-cta-2 hover:bg-cta hover:text-on-cta"
              } ${anello}`}
            >
              {g}
              <span aria-hidden="true" className="absolute bottom-1 flex gap-0.5">
                {qui.slice(0, 3).map((r) => (
                  <span key={r.id} className={`h-1 w-1 rounded-full ${scelto ? "bg-on-cta" : "bg-cta-2"}`} />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 border-t border-line pt-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-semibold text-ink">{giornoScelto === null ? `A ${nomeMese}` : `Il ${giornoScelto} ${nomeMese}`}</h3>
          {giornoScelto !== null ? (
            <button type="button" onClick={() => onGiorno(null)} className="text-sm font-bold text-accent underline underline-offset-4">
              Tutto il mese
            </button>
          ) : null}
        </div>
        {mostrate.length ? (
          <ul className="flex flex-col">
            {mostrate.map(({ giorno, reminder: r }) => {
              const anni = testoAnni(r, anno);
              return (
                <li key={r.id} className="flex items-center gap-3 border-b border-line py-2 last:border-b-0">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-accent">
                    <Icona nome={iconaTipo(r)} dimensione={20} />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="truncate font-semibold text-ink">{r.nome}</p>
                    <p className="text-sm text-ink-soft">
                      {giorno} {nomeMese} · {etichettaTipo(r.tipo)}
                      {anni ? ` · ${anni}` : ""}
                    </p>
                    {r.nota ? <p className="line-clamp-2 text-sm italic text-ink-soft">{r.nota}</p> : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => onApri(r)}
                    aria-label={`Modifica ${r.nome}`}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-accent hover:bg-surface-2"
                  >
                    <Icona nome="edit" dimensione={20} />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-ink-soft">Nessuna ricorrenza a {nomeMese}.</p>
        )}
      </div>
    </section>
  );
}
