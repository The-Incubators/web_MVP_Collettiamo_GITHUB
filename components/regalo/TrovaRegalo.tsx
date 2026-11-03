"use client";

// Il percorso «Trova il regalo»: quattro tappe (destinatario, occasione, interessi, risultati), nel disegno di
// UX_V4. Le domande, le passioni (8 macro-categorie con le loro micro), il punteggio e la ripresa dalla sessione
// stanno in lib/regalo; i risultati sono i prodotti del nostro catalogo, con la nostra scheda (SchedaProdotto).
//
// - I prodotti arrivano già con la pagina, quindi non c'è nessuna richiesta che possa fallire: niente «Riprova».
// - La pausa con l'animazione prima dei risultati è voluta, non un'attesa di rete.

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SchedaProdotto } from "@/components/SchedaProdotto";
import { Avanzamento, Chip, ID_POSTO_PASSI, Icona, SceltaScheda } from "@/components/regalo/parti";
import { Bottone, Icona as IconaSito } from "@/components/ui";
import { CATEGORIE_INTERESSI, GENERI, INTERESSI, MAX_MACRO, MAX_MICRO, OCCASIONI_REGALO, SOGLIA_PRODOTTI } from "@/lib/regalo/dati";
import { FASCIA_TUTTE, filtriIniziali, microDelProdotto, ordinaProdotti, type FiltriRisultati } from "@/lib/regalo/punteggio";
import {
  avanza,
  cambiaInteresse,
  cambiaMacro,
  leggiDallaSessione,
  limiteInteressiRaggiunto,
  limiteMacroRaggiunto,
  puoAvanzare,
  scegliGenere,
  scegliOccasione,
  scriviNellaSessione,
  statoIniziale,
  tuttaLaMacro,
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
    testo: "Scegli una o due passioni, poi restringi se vuoi.",
    aiuto: "Scegli almeno una passione per continuare",
  },
};

const categoriaDi = new Map(INTERESSI.map((x) => [x.id, x.categoria]));

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
  // Il posto nell'intestazione del sito dove vanno i passi: esiste solo nel browser, quindi si cerca dopo il primo render.
  const [postoPassi, setPostoPassi] = useState<HTMLElement | null>(null);
  useEffect(() => setPostoPassi(document.getElementById(ID_POSTO_PASSI)), []);
  // L'ultima passione scelta: le sue micro compaiono sotto i riquadri e si portano in vista.
  const [ultimaMacro, setUltimaMacro] = useState<string | null>(null);

  // Quanti prodotti ha ogni micro e ogni macro in questo catalogo: quelle sotto la soglia non si mostrano.
  const conteggi = useMemo(() => {
    const micro = new Map<string, number>();
    const macro = new Map<string, number>();
    for (const p of prodotti) {
      const sue = microDelProdotto(p);
      for (const id of sue) micro.set(id, (micro.get(id) ?? 0) + 1);
      for (const c of new Set(sue.map((id) => categoriaDi.get(id)))) if (c) macro.set(c, (macro.get(c) ?? 0) + 1);
    }
    return { micro, macro };
  }, [prodotti]);

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

  useEffect(() => {
    if (!ultimaMacro) return;
    document.getElementById(`micro-${ultimaMacro}`)?.scrollIntoView({ block: "nearest", behavior: motoRidotto() ? "auto" : "smooth" });
  }, [ultimaMacro]);

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

  function scegliMacro(id: string) {
    const togli = stato.macro.includes(id);
    if (!togli && limiteMacroRaggiunto(stato)) {
      setMessaggio(`Puoi scegliere al massimo ${MAX_MACRO} passioni. Togline una per sceglierne un’altra.`);
      return;
    }
    setMessaggio("");
    setUltimaMacro(togli ? null : id);
    aggiorna(cambiaMacro(stato, id));
  }

  function scegliInteresse(id: string) {
    if (!stato.interessi.includes(id) && limiteInteressiRaggiunto(stato)) {
      setMessaggio(`Puoi restringere al massimo con ${MAX_MICRO} scelte. Togline una per sceglierne un’altra.`);
      return;
    }
    setMessaggio("");
    aggiorna(cambiaInteresse(stato, id));
  }

  const genere = GENERI.find((g) => g.id === stato.genere);
  const occasione = OCCASIONI_REGALO.find((o) => o.id === stato.occasione);

  // I passi stanno nell'intestazione, accanto al logo: toccando un passo fatto si torna a cambiare la risposta.
  const passi = postoPassi ? createPortal(<Avanzamento stato={stato} vaiA={vaiA} />, postoPassi) : null;

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
    // «Tecnologia (Cuffie, auricolari e speaker), Viaggi»
    const interessi = stato.macro.map((id) => {
      const micro = INTERESSI.filter((x) => x.categoria === id && stato.interessi.includes(x.id)).map((x) => x.etichetta);
      const nome = CATEGORIE_INTERESSI.find((c) => c.id === id)?.etichetta ?? "";
      return micro.length ? `${nome} (${micro.join(", ")})` : nome;
    });
    return (
      <div className="flex flex-col gap-4">
        {passi}
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
        </div>
        {risultati.length ? (
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {risultati.slice(0, mostra).map((p) => (
              <li key={p.slug}>
                <SchedaProdotto prodotto={p} azione="amazon" />
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
  const nMacro = stato.macro.length;
  // La barra in fondo compare solo dopo la prima scelta della tappa: prima lo schermo resta tutto alle scelte.
  const barraVisibile = tappa === 1 ? Boolean(stato.genere) : tappa === 2 ? Boolean(stato.occasione) : nMacro > 0;
  // Le passioni con abbastanza prodotti, più quelle già scelte (anche se il catalogo nel frattempo si è svuotato).
  const macroMostrate = CATEGORIE_INTERESSI.filter((c) => stato.macro.includes(c.id) || (conteggi.macro.get(c.id) ?? 0) >= SOGLIA_PRODOTTI);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-3">
      {passi}

      {/* Titolo, spiegazione e contatore stanno stretti: sul telefono lo spazio serve alle scelte sotto. */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-3xl bg-surface px-4 py-3 shadow-carta">
        <h1 ref={titolo} tabIndex={-1} className="w-full text-[22px] font-bold leading-tight text-accent-2 outline-none">
          {tappa === 3 && genere?.id === "uomo" ? "Cosa lo appassiona?" : testi.titolo}
        </h1>
        <p className="text-sm text-ink-soft">{testi.testo}</p>
        {tappa === 3 ? (
          <p className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${nMacro > 0 ? "bg-ok-field text-ok" : "bg-surface-2"}`}>
            <IconaSito nome="check_circle" dimensione={16} />
            {nMacro} di {MAX_MACRO} {nMacro === 1 ? "scelta" : "scelte"}
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

      {tappa === 3 ? (
        <div role="group" aria-label="Passioni" className="grid grid-cols-2 gap-2">
          {macroMostrate.map((c) => (
            <SceltaScheda key={c.id} etichetta={c.etichetta} icona={c.icona} scelto={stato.macro.includes(c.id)} onClick={() => scegliMacro(c.id)} />
          ))}
        </div>
      ) : null}

      {/* Per ogni passione scelta, le sue micro per restringere: facoltative, «Va bene tutto» finché non se ne sceglie una. */}
      {tappa === 3
        ? stato.macro.map((id) => {
            const c = CATEGORIE_INTERESSI.find((x) => x.id === id);
            const micro = INTERESSI.filter((x) => x.categoria === id && (stato.interessi.includes(x.id) || (conteggi.micro.get(x.id) ?? 0) >= SOGLIA_PRODOTTI));
            if (!c || !micro.length) return null;
            const nessuna = !micro.some((x) => stato.interessi.includes(x.id));
            return (
              <section key={id} id={`micro-${id}`} aria-labelledby={`titolo-micro-${id}`} className="flex scroll-mb-56 flex-col gap-2 rounded-3xl bg-surface p-3 shadow-carta">
                <h2 id={`titolo-micro-${id}`} className="flex items-center gap-2 text-sm font-bold text-accent-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cta text-on-cta">
                    <Icona nome={c.icona} className="h-4 w-4" />
                  </span>
                  {c.etichetta}: qualcosa in particolare?
                </h2>
                <div role="group" aria-label={`${c.etichetta}: qualcosa in particolare?`} className="flex flex-wrap gap-2">
                  <Chip etichetta="Va bene tutto" scelto={nessuna} onClick={() => aggiorna(tuttaLaMacro(stato, id))} />
                  {micro.map((x) => (
                    <Chip key={x.id} etichetta={x.etichetta} scelto={stato.interessi.includes(x.id)} onClick={() => scegliInteresse(x.id)} />
                  ))}
                </div>
              </section>
            );
          })
        : null}

      {/* La barra dei pulsanti resta in fondo allo schermo, sopra la navigazione; nascosta finché non si sceglie qualcosa. */}
      <div
        aria-hidden={!barraVisibile}
        inert={!barraVisibile}
        className={`sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 -mx-4 flex flex-col gap-1 bg-field/95 px-4 pb-2 pt-3 backdrop-blur transition-[opacity,transform] duration-300 motion-reduce:transition-none md:bottom-0 ${
          barraVisibile ? "" : "pointer-events-none invisible translate-y-4 opacity-0"
        }`}
      >
        {/* il limite di scelte si avvisa qui: sotto le scelte la barra lo coprirebbe */}
        {messaggio ? (
          <p role="alert" className="mb-1 rounded-2xl bg-gold-field p-3 text-sm font-semibold">
            {messaggio}
          </p>
        ) : null}
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
