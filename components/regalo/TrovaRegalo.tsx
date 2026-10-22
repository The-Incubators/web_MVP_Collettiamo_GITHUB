"use client";

// Il percorso «Trova il regalo»: quattro tappe (destinatario, occasione, interessi, risultati), nel disegno di
// UX_V4. Le domande, le 36 scelte d'interesse, il punteggio e la ripresa dalla sessione sono quelli di sempre
// (lib/regalo); i risultati sono i prodotti del nostro catalogo, con la nostra scheda (SchedaProdotto).
//
// - I prodotti arrivano già con la pagina, quindi non c'è nessuna richiesta che possa fallire: niente «Riprova».
// - La pausa con l'animazione prima dei risultati è voluta, non un'attesa di rete.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SchedaProdotto } from "@/components/SchedaProdotto";
import { Avanzamento, Chip, Icona, SceltaScheda } from "@/components/regalo/parti";
import { Bottone, Icona as IconaSito } from "@/components/ui";
import { CATEGORIE_INTERESSI, GENERI, INTERESSI, MAX_INTERESSI, MIN_INTERESSI, OCCASIONI_REGALO } from "@/lib/regalo/dati";
import { FASCIA_TUTTE, ORDINI, filtriIniziali, ordinaProdotti, type FiltriRisultati, type IdOrdine } from "@/lib/regalo/punteggio";
import {
  avanza,
  cambiaInteresse,
  leggiDallaSessione,
  limiteInteressiRaggiunto,
  puoAvanzare,
  scegliGenere,
  scegliOccasione,
  scriviNellaSessione,
  statoIniziale,
  vaiAllaTappa,
  type StatoRicerca,
} from "@/lib/regalo/stato";
import { FASCE_PREZZO, type Prodotto } from "@/lib/tipi";

const ATTESA_MS = 1100;
/** I risultati sono tutto il catalogo ordinato per affinità: se ne mostrano 24 alla volta. */
const PER_PAGINA = 24;

const TESTI: Record<1 | 2 | 3, { titolo: string; testo: string; aiuto: string }> = {
  1: { titolo: "Per chi è il regalo?", testo: "Un uomo o una donna?", aiuto: "Seleziona un’opzione per continuare" },
  2: { titolo: "Qual è l’occasione?", testo: "Scegli cosa si festeggia.", aiuto: "Scegli un’occasione per continuare" },
  3: {
    titolo: "Cosa le appassiona?",
    testo: `Scegli da ${MIN_INTERESSI} a ${MAX_INTERESSI} interessi.`,
    aiuto: `Scegli almeno ${MIN_INTERESSI} interessi per continuare`,
  },
};

const motoRidotto = () => globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

export function TrovaRegalo({ prodotti }: { prodotti: Prodotto[] }) {
  const [stato, setStato] = useState<StatoRicerca>(statoIniziale);
  const [filtri, setFiltri] = useState<FiltriRisultati>(filtriIniziali);
  const [inAttesa, setInAttesa] = useState(false);
  const [avviato, setAvviato] = useState(false);
  const [messaggio, setMessaggio] = useState("");
  const [mostra, setMostra] = useState(PER_PAGINA);
  const titolo = useRef<HTMLHeadingElement>(null);
  const vistaMostrata = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // All'arrivo non parte il questionario: si sceglie se rispondere o andare dritti al catalogo.
  // Chi riprende un percorso già cominciato salta la scelta e torna dov'era.
  const mostraAvvio = !avviato && stato.tappa === 1 && !stato.genere;

  // Il percorso lasciato a metà si riprende dalla sessione del browser, subito dopo il primo render
  // (il server non ha sessionStorage).
  useEffect(() => {
    const ripreso = leggiDallaSessione();
    if (ripreso.tappa !== 1 || ripreso.genere) setStato(ripreso);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  // Quando cambia ciò che si vede, il titolo prende il fuoco e la pagina torna in cima.
  const vista = inAttesa ? "attesa" : mostraAvvio ? "avvio" : `tappa-${stato.tappa}`;
  useEffect(() => {
    if (inAttesa) return;
    const cambiata = vistaMostrata.current !== null && vistaMostrata.current !== vista;
    vistaMostrata.current = vista;
    if (!cambiata) return;
    titolo.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: motoRidotto() ? "auto" : "smooth" });
  }, [vista, inAttesa]);

  function aggiorna(prossimo: StatoRicerca) {
    setStato(prossimo);
    scriviNellaSessione(prossimo);
  }

  const vaiA = (tappa: number) => aggiorna(vaiAllaTappa(stato, tappa));

  /** «Ripeti la ricerca»: si riparte davvero da zero, scelta d'avvio compresa (e si svuota la sessione). */
  function ricominciaDaCapo() {
    setFiltri(filtriIniziali());
    setMostra(PER_PAGINA);
    setMessaggio("");
    setAvviato(false);
    aggiorna(statoIniziale());
  }

  function avanti() {
    if (!puoAvanzare(stato)) return;
    if (stato.tappa === 3) {
      setInAttesa(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(
        () => {
          setInAttesa(false);
          aggiorna(avanza(stato));
        },
        motoRidotto() ? 150 : ATTESA_MS,
      );
      return;
    }
    aggiorna(avanza(stato));
  }

  function scegliInteresse(id: string) {
    if (!stato.interessi.includes(id) && limiteInteressiRaggiunto(stato)) {
      setMessaggio(`Puoi scegliere al massimo ${MAX_INTERESSI} interessi. Togline uno per sceglierne un altro.`);
      return;
    }
    setMessaggio("");
    aggiorna(cambiaInteresse(stato, id));
  }

  const genere = GENERI.find((g) => g.id === stato.genere);
  const occasione = OCCASIONI_REGALO.find((o) => o.id === stato.occasione);

  /** Le risposte già date, in alto: toccandole si torna a cambiarle. */
  function risposteDate() {
    if (!genere && !occasione) return null;
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-ink-soft">Le tue risposte:</span>
        {genere ? (
          <button type="button" onClick={() => vaiA(1)} className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-surface px-3 text-sm font-bold shadow-carta">
            <Icona nome={genere.icona} className="h-4 w-4 text-cta-2" />
            Per {genere.etichetta.toLowerCase()}
            <IconaSito nome="edit" dimensione={16} className="text-ink-soft" />
            <span className="sr-only">: cambia</span>
          </button>
        ) : null}
        {occasione && stato.tappa > 2 ? (
          <button type="button" onClick={() => vaiA(2)} className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-surface px-3 text-sm font-bold shadow-carta">
            <Icona nome={occasione.icona} className="h-4 w-4 text-cta-2" />
            {occasione.etichetta}
            <IconaSito nome="edit" dimensione={16} className="text-ink-soft" />
            <span className="sr-only">: cambia</span>
          </button>
        ) : null}
      </div>
    );
  }

  const messaggioVivo = (
    <p className="sr-only" role="status" aria-live="polite">
      {messaggio}
    </p>
  );

  if (inAttesa) {
    return (
      <div role="status" className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 rounded-3xl bg-surface p-10 text-center shadow-carta">
        <span aria-hidden="true" className="h-12 w-12 animate-spin rounded-full border-4 border-line border-t-cta" />
        <p className="font-display text-xl font-semibold text-accent-2">Cerco i regali giusti…</p>
      </div>
    );
  }

  if (mostraAvvio) {
    return (
      <section aria-labelledby="titolo-regalo" className="mx-auto flex w-full max-w-lg flex-col gap-5">
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-surface p-6 text-center shadow-carta">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-cta-field text-cta-2">
            <Icona nome="gift" className="h-8 w-8" />
          </span>
          <h1 id="titolo-regalo" ref={titolo} tabIndex={-1} className="text-[32px] font-bold leading-[38px] tracking-tight text-accent-2 outline-none">
            Trova il regalo perfetto
          </h1>
          <p className="text-ink-soft">Tre domande, trenta secondi.</p>
          <Bottone variante="azione" pieno onClick={() => setAvviato(true)} className="mt-2">
            Rispondi alle 3 domande <IconaSito nome="arrow_forward" dimensione={22} />
          </Bottone>
          <Link href="/catalogo" className="inline-flex min-h-tocco items-center gap-0.5 text-sm font-bold text-accent">
            …o sfoglia tutto il catalogo <IconaSito nome="chevron_right" dimensione={18} />
          </Link>
        </div>
      </section>
    );
  }

  if (stato.tappa === 4) {
    const risultati = ordinaProdotti(prodotti, stato, filtri);
    const interessi = stato.interessi.map((id) => INTERESSI.find((x) => x.id === id)?.etichetta).filter(Boolean);
    return (
      <div className="flex flex-col gap-4">
        <Avanzamento stato={stato} vaiA={vaiA} />
        <div className="flex flex-col gap-1">
          <h1 ref={titolo} tabIndex={-1} className="text-[32px] font-bold leading-[38px] tracking-tight text-accent-2 outline-none">
            Ecco le idee giuste
          </h1>
          <p className="text-sm text-ink-soft">{[genere?.etichetta, occasione?.etichetta, interessi.join(", ")].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="flex flex-col gap-2">
          <div role="group" aria-label="Fascia di prezzo" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            <Chip etichetta="Tutti i prezzi" scelto={filtri.fascia === FASCIA_TUTTE} onClick={() => setFiltri((f) => ({ ...f, fascia: FASCIA_TUTTE }))} />
            {FASCE_PREZZO.map((f) => (
              <Chip key={f.id} etichetta={f.etichetta} scelto={filtri.fascia === f.id} onClick={() => setFiltri((x) => ({ ...x, fascia: f.id }))} />
            ))}
          </div>
          <div role="group" aria-label="Ordina per" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {ORDINI.map((o) => (
              <Chip key={o.id} etichetta={o.etichetta} scelto={filtri.ordine === o.id} onClick={() => setFiltri((x) => ({ ...x, ordine: o.id as IdOrdine }))} />
            ))}
          </div>
        </div>
        {risultati.length ? (
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {risultati.slice(0, mostra).map((p) => (
              <li key={p.slug}>
                <SchedaProdotto prodotto={p} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-3xl bg-surface p-8 text-center shadow-carta">
            <p className="font-semibold">Nessuna idea in questa fascia di prezzo.</p>
            <Bottone variante="secondario" onClick={() => setFiltri(filtriIniziali())}>
              Mostra tutti i prezzi
            </Bottone>
          </div>
        )}
        {risultati.length > mostra ? (
          <button
            type="button"
            onClick={() => setMostra((m) => m + PER_PAGINA)}
            className="inline-flex min-h-12 items-center gap-1 self-center rounded-full bg-surface-2 px-6 text-sm font-bold hover:bg-line"
          >
            <IconaSito nome="expand_more" dimensione={20} />
            Mostra altre {Math.min(PER_PAGINA, risultati.length - mostra)} idee
          </button>
        ) : null}
        <Bottone variante="secondario" onClick={ricominciaDaCapo} className="self-center">
          <Icona nome="refresh" className="h-5 w-5" />
          Ripeti la ricerca
        </Bottone>
        {messaggioVivo}
      </div>
    );
  }

  const tappa = stato.tappa as 1 | 2 | 3;
  const testi = TESTI[tappa];
  const bloccato = !puoAvanzare(stato);
  const nInteressi = stato.interessi.length;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
      <Avanzamento stato={stato} vaiA={vaiA} />
      {risposteDate()}

      <div className="flex flex-col gap-2 rounded-3xl bg-surface p-5 shadow-carta">
        <h1 ref={titolo} tabIndex={-1} className="text-[26px] font-bold leading-tight text-accent-2 outline-none">
          {tappa === 3 && genere?.id === "uomo" ? "Cosa lo appassiona?" : testi.titolo}
        </h1>
        <p className="text-sm text-ink-soft">{testi.testo}</p>
        {tappa === 3 ? (
          <p className={`inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1 text-xs font-bold ${nInteressi >= MIN_INTERESSI ? "bg-ok-field text-ok" : "bg-surface-2"}`}>
            <IconaSito nome="check_circle" dimensione={16} />
            {nInteressi} di {MAX_INTERESSI} selezionati
            {nInteressi >= MIN_INTERESSI ? " · Ottimo mix!" : ` · minimo ${MIN_INTERESSI}`}
          </p>
        ) : null}
      </div>

      {tappa === 1 ? (
        <div role="group" aria-label={testi.titolo} className="grid grid-cols-2 gap-3">
          {GENERI.map((g) => (
            <SceltaScheda key={g.id} etichetta={g.etichetta} icona={g.icona} grande scelto={stato.genere === g.id} onClick={() => aggiorna(scegliGenere(stato, g.id))} />
          ))}
        </div>
      ) : null}

      {tappa === 2 ? (
        <div role="group" aria-label={testi.titolo} className="grid grid-cols-2 gap-2">
          {OCCASIONI_REGALO.map((o) => (
            <SceltaScheda key={o.id} etichetta={o.etichetta} icona={o.icona} scelto={stato.occasione === o.id} onClick={() => aggiorna(scegliOccasione(stato, o.id))} />
          ))}
        </div>
      ) : null}

      {tappa === 3
        ? CATEGORIE_INTERESSI.map((c) => {
            const lista = INTERESSI.filter((x) => x.categoria === c.id);
            const scelti = lista.filter((x) => stato.interessi.includes(x.id)).length;
            return (
              <section key={c.id} aria-labelledby={`cat-${c.id}`} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h2 id={`cat-${c.id}`} className="text-lg font-semibold text-accent-2">
                    {c.etichetta}
                  </h2>
                  {scelti > 0 ? <span className="text-xs font-bold text-cta-2">{scelti === 1 ? "1 selezionato" : `${scelti} selezionati`}</span> : null}
                </div>
                <div role="group" aria-label={c.etichetta} className="grid grid-cols-2 gap-2">
                  {lista.map((x) => (
                    <SceltaScheda key={x.id} etichetta={x.etichetta} icona={x.icona} scelto={stato.interessi.includes(x.id)} onClick={() => scegliInteresse(x.id)} />
                  ))}
                </div>
              </section>
            );
          })
        : null}

      {messaggio ? (
        <p role="alert" className="rounded-2xl bg-gold-field p-3 text-sm font-semibold">
          {messaggio}
        </p>
      ) : null}

      {/* La barra dei pulsanti resta in fondo allo schermo, sopra la navigazione. */}
      <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 -mx-4 flex flex-col gap-1 bg-field/95 px-4 pb-2 pt-3 backdrop-blur md:bottom-0">
        <div className="flex items-center gap-2">
          {tappa > 1 ? (
            <button
              type="button"
              onClick={() => vaiA(tappa - 1)}
              aria-label="Indietro"
              className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-surface shadow-carta"
            >
              <IconaSito nome="arrow_back" />
            </button>
          ) : null}
          <Bottone pieno onClick={avanti} disabled={bloccato} aria-describedby="aiuto-regalo">
            {tappa === 3 ? "Trova i regali perfetti" : "Avanti"}
            {tappa === 3 && nInteressi > 0 ? (
              <span className="cifre flex h-6 min-w-6 items-center justify-center rounded-full bg-cta px-1.5 text-xs text-accent-2">{nInteressi}</span>
            ) : null}
            <IconaSito nome="arrow_forward" dimensione={20} />
          </Bottone>
        </div>
        <p id="aiuto-regalo" className="text-center text-xs font-semibold text-ink-soft">
          {bloccato ? testi.aiuto : ""}
        </p>
        <Link href="/catalogo" className="inline-flex min-h-tocco items-center justify-center gap-0.5 text-xs font-bold text-ink-soft">
          …oppure salta e vai a tutto il catalogo <IconaSito nome="chevron_right" dimensione={16} />
        </Link>
      </div>
      {messaggioVivo}
    </div>
  );
}
