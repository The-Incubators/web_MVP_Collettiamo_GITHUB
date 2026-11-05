"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { useApp } from "@/components/AppProvider";
import { BottoneGoogle } from "@/components/BottoneGoogle";
import { IconaTratto, SceltaGrande } from "@/components/ui";
import { ErroreApi, leggiSessione, salvaChiaveBozza, scriviSessione, useApi } from "@/lib/biglietti/client";
import {
  MODI_RIVELAZIONE,
  nomeOccasione,
  nomeRivelazione,
  OCCASIONI_EDITOR,
  RIVELAZIONE_EDITOR,
  SCURISCI_PREDEFINITO,
  STILE_PREDEFINITO_CARTA,
  stileCartaDi,
  STILI_CARTA,
  titoloAnteprima,
  titoloEffettivo,
  titoloPredefinito,
} from "@/lib/dominio/bacheca";
import { MAX_MESSAGGIO_GRUPPO } from "@/lib/dominio/biglietti";
import type { Biglietto, ModoRivelazione } from "@/lib/tipi";
import { Finestra } from "../comuni";
import { CartaBiglietto, type AspettoBacheca } from "../bacheca/AnteprimaBacheca";
import { SceltaMusica } from "../bacheca/SceltaMusica";

const CHIAVE_SESSIONE = "colletta.biglietto.nuovo";

interface Stato {
  passo: number;
  occasione: string;
  festeggiato: string;
  /** il titolo scritto al passo 5; conta solo con `titoloScritto` (altrimenti vale quello proposto) */
  titolo: string;
  titoloScritto: boolean;
  benvenuto: string;
  /** l'id dello stile della carta (STILI_CARTA) */
  modelloId: string;
  rivelazione: ModoRivelazione;
  /** la bozza creata sul server al primo tentativo: un nuovo tentativo non ne crea un'altra */
  bozzaId: string | null;
}

function statoIniziale(): Stato {
  return {
    passo: 0,
    occasione: OCCASIONI_EDITOR[0].id,
    festeggiato: "",
    titolo: "",
    titoloScritto: false,
    benvenuto: "",
    modelloId: STILE_PREDEFINITO_CARTA.id,
    rivelazione: RIVELAZIONE_EDITOR,
    bozzaId: null,
  };
}

/** Una bozza salvata da una versione precedente dell'editor torna valida: occasione e stile fuori elenco si azzerano. */
function ripristina(salvato: Partial<Stato>): Stato {
  const s = { ...statoIniziale(), ...salvato };
  if (!OCCASIONI_EDITOR.some((o) => o.id === s.occasione)) s.occasione = OCCASIONI_EDITOR[0].id;
  if (!stileCartaDi(s.modelloId)) s.modelloId = STILE_PREDEFINITO_CARTA.id;
  if (!MODI_RIVELAZIONE.some((m) => m.id === s.rivelazione)) s.rivelazione = RIVELAZIONE_EDITOR;
  s.passo = Math.min(5, Math.max(0, Math.floor(Number(s.passo) || 0)));
  return s;
}

const PASSI = ["Che cosa si festeggia?", "A chi è dedicato?", "Stile", "Come lo scoprirà", "Ritocchi finali", "Ci siamo"] as const;

/** Il colore della miniatura di ogni stile (prototipi/biglietto-editor.html, passo 3). */
const TINTA_STILE: Record<string, string> = {
  "carta-avorio": "var(--card-paper)",
  "carta-menta": "var(--wall)",
  "carta-pesca": "var(--peach)",
  "carta-verde": "var(--green)",
};

/**
 * Crea un biglietto (/biglietto/nuovo; Gifty UX v2, design.md §5 «Editor», prototipi/biglietto-editor.html): schermo
 * intero con la sola barra (chiudi, passo, tacche), l'anteprima viva e il pannello già aperto sul campo del passo (foglio
 * in basso sul telefono, colonna a destra su desktop), Indietro e Avanti nel pannello, riepilogo con la matita al passo 6.
 * Tutto resta nel browser fino a «Crea il biglietto»: solo allora nasce la bozza sul server, che si pubblica subito
 * dopo l'accesso.
 */
export function CreaBiglietto() {
  const router = useRouter();
  const api = useApi();
  const { utente, auth } = useApp();
  const [s, setS] = useState<Stato>(statoIniziale);
  const [pronto, setPronto] = useState(false);
  const [invio, setInvio] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [accesso, setAccesso] = useState(false);
  // la musica resta un file nel browser (troppo grande per la bozza in sessione): si carica con «Crea il biglietto»
  const [musica, setMusica] = useState<File | null>(null);
  const urlMusica = useMemo(() => (musica ? URL.createObjectURL(musica) : null), [musica]);
  useEffect(() => () => void (urlMusica && URL.revokeObjectURL(urlMusica)), [urlMusica]);
  const inAttesa = useRef(false);
  const titoloPasso = useRef<HTMLHeadingElement>(null);
  const primoGiro = useRef(true);
  const id = useId();

  // la bozza dell'editor sopravvive a un ricaricamento della pagina
  useEffect(() => {
    const salvato = leggiSessione<Partial<Stato>>(CHIAVE_SESSIONE);
    if (salvato) setS(ripristina(salvato));
    setPronto(true);
  }, []);
  useEffect(() => {
    if (pronto) scriviSessione(CHIAVE_SESSIONE, s);
  }, [s, pronto]);

  // a ogni nuovo passo il fuoco va al titolo del pannello (il passo 2 lo dà al campo del nome)
  useEffect(() => {
    if (primoGiro.current) {
      primoGiro.current = false;
      return;
    }
    if (s.passo !== 1) titoloPasso.current?.focus();
  }, [s.passo]);

  const imposta = <K extends keyof Stato>(k: K, v: Stato[K]) => setS((x) => ({ ...x, [k]: v }));
  const stile = stileCartaDi(s.modelloId) ?? STILE_PREDEFINITO_CARTA;
  const titoloProposto = titoloPredefinito(s.occasione, s.festeggiato);
  const titolo = s.titoloScritto ? titoloEffettivo(s.titolo, s.occasione, s.festeggiato) : titoloAnteprima(s.occasione, s.festeggiato);
  const aspetto: AspettoBacheca = {
    titolo,
    benvenuto: s.benvenuto,
    emoji: "",
    fontTitolo: "mano",
    colori: stile.colori,
    immagine: null,
    scurisci: SCURISCI_PREDEFINITO,
    classeCarta: stile.classe,
  };

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
            titolo: s.titoloScritto ? s.titolo : "",
            benvenuto: s.benvenuto,
            dataEvento: "",
            modelloId: stile.id,
            colori: stile.colori,
            scurisci: SCURISCI_PREDEFINITO,
            rivelazione: s.rivelazione,
          },
        },
      });
      if (musica) await api(`/api/biglietti/${bid}/musica?nome=${encodeURIComponent(musica.name)}`, { metodo: "POST", bigliettoId: bid, file: musica });
      await api(`/api/biglietti/${bid}/pubblica`, { metodo: "POST", bigliettoId: bid, corpo: { nome: utente.nome } });
      scriviSessione(CHIAVE_SESSIONE, null);
      router.push(`/biglietto/${bid}/gestisci`);
    } catch (e) {
      if (e instanceof ErroreApi && e.dati.motivo === "accesso") {
        inAttesa.current = true;
        setAccesso(true);
      } else {
        setErrore(e instanceof Error ? e.message : "Non sono riuscito a creare il biglietto. Riprova.");
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
    if (!puoAvanzare || invio) return;
    if (ultimo) void crea();
    else imposta("passo", s.passo + 1);
  }

  const pannelli: ReactNode[] = [
    // 1, occasione
    <div key="occasione" className="chips" role="radiogroup" aria-labelledby="t-passo">
      {OCCASIONI_EDITOR.map((o) => (
        <button key={o.id} type="button" className="chip" role="radio" aria-checked={s.occasione === o.id} onClick={() => imposta("occasione", o.id)}>
          {o.etichetta}
        </button>
      ))}
    </div>,

    // 2, per chi
    <form
      key="perchi"
      className="campo"
      onSubmit={(e) => {
        e.preventDefault();
        avanti();
      }}
    >
      <label htmlFor={`${id}-n`}>Nome di chi festeggiamo</label>
      <input
        id={`${id}-n`}
        className="input w-nome"
        maxLength={80}
        autoComplete="off"
        autoFocus
        enterKeyHint="next"
        value={s.festeggiato}
        onChange={(e) => imposta("festeggiato", e.target.value)}
      />
    </form>,

    // 3, stile
    <div key="stile" className="temi" role="radiogroup" aria-labelledby="t-passo">
      {STILI_CARTA.map((st) => (
        <button key={st.id} type="button" role="radio" aria-checked={st.id === stile.id} onClick={() => imposta("modelloId", st.id)}>
          <i style={{ background: TINTA_STILE[st.id] }} />
          {st.nome}
        </button>
      ))}
    </div>,

    // 4, come lo scoprirà
    <div key="rivelazione" role="radiogroup" aria-labelledby="t-passo" className="grid gap-3">
      {MODI_RIVELAZIONE.map((m) => (
        <SceltaGrande key={m.id} scelto={s.rivelazione === m.id} nome={m.nome} onScegli={() => imposta("rivelazione", m.id)}>
          {m.descrizione}
        </SceltaGrande>
      ))}
    </div>,

    // 5, ritocchi
    <div key="ritocchi" className="grid gap-4">
      <div className="campo">
        <label htmlFor={`${id}-t`}>Titolo</label>
        <input
          id={`${id}-t`}
          className="input"
          maxLength={80}
          autoComplete="off"
          value={s.titoloScritto ? s.titolo : titoloProposto}
          onChange={(e) => setS((x) => ({ ...x, titolo: e.target.value, titoloScritto: true }))}
        />
      </div>
      <div className="campo">
        <label htmlFor={`${id}-r`}>Due righe sotto il titolo</label>
        <textarea id={`${id}-r`} className="input min-h-24 py-3" rows={2} maxLength={MAX_MESSAGGIO_GRUPPO} value={s.benvenuto} onChange={(e) => imposta("benvenuto", e.target.value)} />
      </div>
      <div className="campo">
        <span className="etichetta">Musica</span>
        <SceltaMusica nome={musica?.name ?? null} url={urlMusica} onFile={setMusica} onTogli={() => setMusica(null)} />
      </div>
    </div>,

    // 6, riepilogo
    <div key="riepilogo" className="grid gap-4">
      <dl className="riep-b">
        {(
          [
            ["Occasione", nomeOccasione(s.occasione), 0],
            ["Per", s.festeggiato, 1],
            ["Stile", stile.nome, 2],
            ["Come lo scopre", nomeRivelazione(s.rivelazione), 3],
            ...(musica ? ([["Musica", musica.name, 4]] as const) : []),
          ] as const
        ).map(([k, v, passo]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
            <button type="button" className="icona-btn" onClick={() => imposta("passo", passo)} aria-label={`Modifica: ${k}`}>
              <IconaTratto nome="matita" />
            </button>
          </div>
        ))}
      </dl>
      {errore ? (
        <p role="alert" className="errore-testo m-0">
          {errore}
        </p>
      ) : null}
    </div>,
  ];

  return (
    <main className="editor-b" aria-labelledby="t-passo">
      <div className="barra-ed">
        <Link className="icona-btn" href="/biglietto" aria-label="Chiudi l'editor">
          <IconaTratto nome="chiudi" />
        </Link>
        <div className="info">
          <span className="t-piccolo muted">
            {s.passo + 1} di {PASSI.length} <b>{PASSI[s.passo]}</b>
          </span>
          <span className="tacche" aria-hidden="true">
            {PASSI.map((_, i) => (
              <i key={i} className={i < s.passo ? "fatto" : i === s.passo ? "ora" : ""} />
            ))}
          </span>
        </div>
      </div>

      <div className="tela">
        {pronto ? (
          <CartaBiglietto aspetto={aspetto}>
            <div className="foglietto-firma c3">
              Il primo messaggio sarà il tuo.<span className="chi">Tu</span>
            </div>
            <div className="foglietto-firma vuoto">Qui firmano gli altri</div>
          </CartaBiglietto>
        ) : null}
      </div>

      <section className="pannello-ed" aria-labelledby="t-passo">
        <span className="maniglia" aria-hidden="true" />
        <h1 id="t-passo" ref={titoloPasso} tabIndex={-1} className="t-sezione">
          {PASSI[s.passo]}
        </h1>
        <div className="corpo-ed">{pronto ? pannelli[s.passo] : null}</div>
        <div className="comandi">
          <button
            type="button"
            className="btn btn-quieto"
            onClick={() => imposta("passo", Math.max(0, s.passo - 1))}
            disabled={invio}
            style={s.passo === 0 ? { visibility: "hidden" } : undefined}
            aria-hidden={s.passo === 0 || undefined}
            tabIndex={s.passo === 0 ? -1 : undefined}
          >
            <IconaTratto nome="sx" />
            Indietro
          </button>
          <button type="button" className="btn btn-primario" onClick={avanti} disabled={!puoAvanzare || invio} aria-busy={invio || undefined}>
            {ultimo ? "Crea il biglietto" : "Avanti"}
          </button>
        </div>
      </section>

      <Finestra aperta={accesso} onChiudi={() => ((inAttesa.current = false), setAccesso(false))} titolo="Accedi per creare il biglietto">
        <div className="grid gap-4">
          <p className="m-0">Con un account ritrovi il biglietto da qualsiasi dispositivo e vedi chi ha firmato. Quello che hai preparato resta com’è.</p>
          <BottoneGoogle onClick={() => void accedi()} />
        </div>
      </Finestra>
    </main>
  );
}
