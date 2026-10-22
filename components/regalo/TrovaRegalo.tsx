"use client";

// Il percorso «Trova il regalo»: quattro tappe (destinatario, occasione, interessi, risultati).
// Testi, markup, classi, ruoli e tempi sono quelli del percorso di partenza (js/gift-finder/gift-finder.js);
// i risultati però sono i prodotti del nostro catalogo, con la nostra scheda (SchedaProdotto).
//
// Differenze volute rispetto all'originale:
// - i prodotti arrivano già con la pagina, quindi non c'è nessuna richiesta che possa fallire: niente «Riprova».
// - l'originale rimetteva a fuoco il pulsante appena premuto perché riscriveva tutto l'HTML; qui i nodi
//   restano gli stessi e il fuoco non si perde da sé.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SchedaProdotto } from "@/components/SchedaProdotto";
import { Avanzamento, Chip, Icona, RiepilogoScelte, SceltaCerchio, SchedaOccasione } from "@/components/regalo/parti";
import {
  CATEGORIE_INTERESSI,
  GENERI,
  INTERESSI,
  MAX_INTERESSI,
  MIN_INTERESSI,
  OCCASIONI_REGALO,
} from "@/lib/regalo/dati";
import {
  FASCIA_TUTTE,
  ORDINI,
  filtriIniziali,
  ordinaProdotti,
  type FiltriRisultati,
  type IdOrdine,
} from "@/lib/regalo/punteggio";
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

const TESTI: Record<number, { titolo: string; nota?: string; testo: React.ReactNode; aiuto?: string }> = {
  1: {
    titolo: "Qualche domanda",
    nota: "(30 sec)",
    testo: "Per trovare il regalo giusto, abbiamo bisogno di qualche informazione",
    aiuto: "Seleziona un’opzione per continuare",
  },
  2: {
    titolo: "Occasione",
    testo: (
      <>
        Stai cercando idee regalo speciali per qualcuno? Raccontaci qual è l’<strong>occasione</strong> da festeggiare.
      </>
    ),
    aiuto: "Scegli un’occasione per continuare",
  },
  3: {
    titolo: "Interessi",
    testo: (
      <>
        Troviamo i regali giusti per ogni persona. Aiutaci selezionando dai {MIN_INTERESSI} ai {MAX_INTERESSI} dei suoi{" "}
        <strong>interessi principali</strong>.
      </>
    ),
    aiuto: `Scegli almeno ${MIN_INTERESSI} interessi per continuare`,
  },
  4: {
    titolo: "Ecco il risultato",
    testo: "Ti presentiamo i regali che più rispecchiano i gusti della persona a cui stai pensando.",
  },
};

const motoRidotto = () => globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

export function TrovaRegalo({ prodotti }: { prodotti: Prodotto[] }) {
  const [stato, setStato] = useState<StatoRicerca>(statoIniziale);
  const [categoria, setCategoria] = useState<string>(CATEGORIE_INTERESSI[0].id);
  const [filtri, setFiltri] = useState<FiltriRisultati>(filtriIniziali);
  const [filtriAperti, setFiltriAperti] = useState(false);
  const [inAttesa, setInAttesa] = useState(false);
  const [avviato, setAvviato] = useState(false);
  const [messaggio, setMessaggio] = useState("");
  const titolo = useRef<HTMLHeadingElement>(null);
  const guscio = useRef<HTMLDivElement>(null);
  const vistaMostrata = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // All'arrivo non parte il questionario: si sceglie se rispondere o andare dritti al catalogo.
  // Chi riprende un percorso già cominciato salta la scelta e torna dov'era.
  const mostraAvvio = !avviato && stato.tappa === 1 && !stato.genere;

  // Il percorso lasciato a metà si riprende dalla sessione del browser. Non si può leggere durante il primo
  // render (il server non ha sessionStorage): si recupera subito dopo, come faceva l'originale all'avvio.
  useEffect(() => {
    const ripreso = leggiDallaSessione();
    if (ripreso.tappa !== 1 || ripreso.genere) setStato(ripreso);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  // Quando cambia ciò che si vede nel pannello, il titolo prende il fuoco e il pannello torna in vista,
  // come nell'originale. Vale anche fra la scelta d'avvio e la prima tappa: se no, premendo «Rispondi alle
  // 3 domande» il pulsante sparisce e il fuoco finisce sul corpo della pagina.
  const vista = inAttesa ? "attesa" : mostraAvvio ? "avvio" : `tappa-${stato.tappa}`;
  useEffect(() => {
    if (inAttesa) return;
    const cambiata = vistaMostrata.current !== null && vistaMostrata.current !== vista;
    vistaMostrata.current = vista;
    if (!cambiata) return;
    titolo.current?.focus({ preventScroll: true });
    guscio.current?.scrollIntoView({ behavior: motoRidotto() ? "auto" : "smooth", block: "start" });
  }, [vista, inAttesa]);

  function aggiorna(prossimo: StatoRicerca) {
    setStato(prossimo);
    scriviNellaSessione(prossimo);
  }

  function vaiA(tappa: number) {
    aggiorna(vaiAllaTappa(stato, tappa));
  }

  /**
   * «Ripeti la ricerca»: si riparte davvero da zero. Si buttano via le risposte (anche quelle salvate nella
   * sessione, se no tornerebbero ricaricando la pagina) e i filtri dei risultati, e si torna alla scelta
   * d'avvio: chi ricomincia può di nuovo decidere fra le 3 domande e il catalogo.
   */
  function ricominciaDaCapo() {
    setFiltriAperti(false);
    setFiltri(filtriIniziali());
    setCategoria(CATEGORIE_INTERESSI[0].id);
    setMessaggio("");
    setAvviato(false);
    aggiorna(statoIniziale());
  }

  function avanti() {
    if (!puoAvanzare(stato)) return;
    if (stato.tappa === 3) {
      // La pausa con l'animazione fa parte del percorso: i prodotti ci sono già.
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
      setMessaggio(`Puoi scegliere al massimo ${MAX_INTERESSI} interessi. Rimuovine uno per sceglierne un altro.`);
      return;
    }
    setMessaggio("");
    aggiorna(cambiaInteresse(stato, id));
  }

  function corpoTappa() {
    if (stato.tappa === 1) {
      return (
        <>
          <p className="gf-domanda" id="gf-domanda-genere">
            Il regalo è per un uomo o per una donna?
          </p>
          <div className="gf-genders" role="group" aria-labelledby="gf-domanda-genere">
            {GENERI.map((g) => (
              <SceltaCerchio
                key={g.id}
                etichetta={g.etichetta}
                icona={g.icona}
                scelto={stato.genere === g.id}
                onClick={() => aggiorna(scegliGenere(stato, g.id))}
              />
            ))}
          </div>
        </>
      );
    }
    if (stato.tappa === 2) {
      return (
        <div className="gf-occasions" role="group" aria-label="Occasione">
          {OCCASIONI_REGALO.map((o) => (
            <SchedaOccasione
              key={o.id}
              etichetta={o.etichetta}
              icona={o.icona}
              scelta={stato.occasione === o.id}
              onClick={() => aggiorna(scegliOccasione(stato, o.id))}
            />
          ))}
        </div>
      );
    }
    return (
      <>
        <RiepilogoScelte stato={stato} togli={(id) => { setMessaggio(""); aggiorna(cambiaInteresse(stato, id)); }} />
        <div className="gf-chips gf-categories" role="group" aria-label="Categorie di interessi">
          {CATEGORIE_INTERESSI.map((c) => (
            <Chip
              key={c.id}
              etichetta={c.etichetta}
              scelto={categoria === c.id}
              tono="verde"
              conteggio={stato.interessi.filter((id) => INTERESSI.find((x) => x.id === id)?.categoria === c.id).length}
              onClick={() => setCategoria(c.id)}
            />
          ))}
        </div>
        <div className="gf-interests" role="group" aria-label="Interessi">
          {INTERESSI.filter((x) => x.categoria === categoria).map((x) => (
            <SceltaCerchio
              key={x.id}
              etichetta={x.etichetta}
              icona={x.icona}
              scelto={stato.interessi.includes(x.id)}
              grande
              onClick={() => scegliInteresse(x.id)}
            />
          ))}
        </div>
      </>
    );
  }

  function rigaScelte() {
    const interessi = stato.interessi.map((id) => INTERESSI.find((x) => x.id === id)?.etichetta).filter(Boolean);
    const occasione = OCCASIONI_REGALO.find((o) => o.id === stato.occasione)?.etichetta;
    const destinatario = GENERI.find((g) => g.id === stato.genere)?.etichetta;
    return [destinatario, occasione, interessi.join(", ")].filter(Boolean).join(" · ");
  }

  if (inAttesa) {
    return (
      <div className="gf" data-phase="loading">
        <div className="gf-loading" role="status">
          <div className="gf-orb" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <p>Stiamo cercando i regali giusti…</p>
        </div>
      </div>
    );
  }

  if (stato.tappa === 4) {
    const risultati = ordinaProdotti(prodotti, stato, filtri);
    return (
      <div className="gf" data-phase="results" onKeyDown={(e) => e.key === "Escape" && setFiltriAperti(false)}>
        <div className="gf-shell" data-step={4} ref={guscio}>
          <Avanzamento stato={stato} vaiA={vaiA} />
          <section className="gf-panel gf-results" aria-labelledby="gf-heading">
            <h2 id="gf-heading" tabIndex={-1} ref={titolo}>
              {TESTI[4].titolo}
            </h2>
            <p className="gf-lead">{TESTI[4].testo}</p>
            <p className="gf-selection">{rigaScelte()}</p>
            <div className="gf-toolbar">
              <button
                type="button"
                className="gf-button"
                aria-expanded={filtriAperti}
                aria-controls="gf-filters"
                onClick={() => setFiltriAperti((a) => !a)}
              >
                <Icona nome="filter" />
                Filtri
              </button>
              <button type="button" className="gf-button gf-button-secondary" onClick={ricominciaDaCapo}>
                <Icona nome="refresh" />
                Ripeti la ricerca
              </button>
            </div>
            <div className="gf-filters" id="gf-filters" hidden={!filtriAperti}>
              <div className="gf-filter-group" role="group" aria-label="Fascia di prezzo">
                <strong>Fascia di prezzo</strong>
                <div className="gf-chips">
                  <Chip
                    etichetta="Tutti i prezzi"
                    scelto={filtri.fascia === FASCIA_TUTTE}
                    onClick={() => setFiltri((f) => ({ ...f, fascia: FASCIA_TUTTE }))}
                  />
                  {FASCE_PREZZO.map((f) => (
                    <Chip
                      key={f.id}
                      etichetta={f.etichetta}
                      scelto={filtri.fascia === f.id}
                      onClick={() => setFiltri((x) => ({ ...x, fascia: f.id }))}
                    />
                  ))}
                </div>
              </div>
              <div className="gf-filter-group" role="group" aria-label="Ordinamento">
                <strong>Ordina per</strong>
                <div className="gf-chips">
                  {ORDINI.map((o) => (
                    <Chip
                      key={o.id}
                      etichetta={o.etichetta}
                      scelto={filtri.ordine === o.id}
                      onClick={() => setFiltri((x) => ({ ...x, ordine: o.id as IdOrdine }))}
                    />
                  ))}
                </div>
              </div>
              <button
                type="button"
                className="gf-link"
                onClick={() => {
                  setFiltri(filtriIniziali());
                  setMessaggio("Filtri azzerati.");
                }}
              >
                Reset filtri
              </button>
            </div>
            {risultati.length ? (
              <ul className="gf-grid">
                {risultati.map((p) => (
                  <li key={p.slug}>
                    <div>
                      <SchedaProdotto prodotto={p} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="gf-empty">
                <h3>Nessuna idea in questa fascia</h3>
                <p>Prova a cambiare i filtri.</p>
                <button type="button" className="gf-button gf-button-secondary" onClick={() => setFiltri(filtriIniziali())}>
                  Reset filtri
                </button>
              </div>
            )}
          </section>
        </div>
        <p className="gf-message" role="status" aria-live="polite">
          {messaggio}
        </p>
      </div>
    );
  }

  if (mostraAvvio) {
    return (
      <div className="gf" data-phase="questions">
        <div className="gf-shell" data-step={1} ref={guscio}>
          <Avanzamento stato={stato} vaiA={vaiA} />
          <section className="gf-panel" aria-labelledby="gf-heading">
            {/* Il pannello non ha un titolo visibile: questo serve a chi usa uno screen reader e al fuoco. */}
            <h2 id="gf-heading" tabIndex={-1} ref={titolo} className="gf-sr">
              Come vuoi cercare il regalo?
            </h2>
            <div className="gf-avvio">
              <button type="button" className="gf-pillola" onClick={() => setAvviato(true)}>
                Rispondi alle 3 domande
              </button>
              <p>..o sfoglia direttamente il nostro catalogo</p>
              <Link href="/catalogo" className="gf-pillola">
                Vai al catalogo regali
              </Link>
            </div>
          </section>
        </div>
      </div>
    );
  }

  const testi = TESTI[stato.tappa];
  const bloccato = !puoAvanzare(stato);
  return (
    <div className="gf" data-phase="questions">
      <div className="gf-shell" data-step={stato.tappa} ref={guscio}>
        <Avanzamento stato={stato} vaiA={vaiA} />
        <section className="gf-panel" aria-labelledby="gf-heading">
          <h2 id="gf-heading" tabIndex={-1} ref={titolo}>
            {testi.titolo}
            {testi.nota ? <span className="gf-nota"> {testi.nota}</span> : null}
          </h2>
          <p className="gf-lead">{testi.testo}</p>
          <div className="gf-body">{corpoTappa()}</div>
          <div className="gf-footer">
            {stato.tappa > 1 ? (
              <button type="button" className="gf-back" onClick={() => vaiA(stato.tappa - 1)}>
                <Icona nome="arrow-left" />
                <span>Indietro</span>
              </button>
            ) : (
              <span />
            )}
            <span className="gf-hint" id="gf-hint">
              {bloccato ? testi.aiuto : ""}
            </span>
            <button
              type="button"
              className="gf-next"
              aria-label={stato.tappa === 3 ? "Vai ai risultati" : "Avanti"}
              aria-describedby="gf-hint"
              disabled={bloccato}
              onClick={avanti}
            >
              <Icona nome="arrow-right" />
            </button>
          </div>
        </section>
      </div>
      <p className="gf-message" role="status" aria-live="polite">
        {messaggio}
      </p>
    </div>
  );
}
