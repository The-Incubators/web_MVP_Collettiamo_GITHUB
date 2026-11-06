"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { useApp } from "@/components/AppProvider";
import { BottoneGoogle } from "@/components/BottoneGoogle";
import { IconaTratto, SceltaGrande } from "@/components/ui";
import { ErroreApi, leggiSessione, salvaChiaveBozza, scriviSessione, useApi } from "@/lib/biglietti/client";
import {
  COLORE_HEX,
  COLORI_SFONDO,
  EFFETTI_APERTURA,
  EFFETTO_PREDEFINITO,
  effettoDi,
  effettoValido,
  fontTitoloValido,
  FONT_TITOLO_PREDEFINITO,
  MODELLO_LIBERO,
  MODI_RIVELAZIONE,
  nomeOccasione,
  nomeRivelazione,
  OCCASIONI_EDITOR,
  RIVELAZIONE_EDITOR,
  SCURISCI_PREDEFINITO,
  testoSu,
  titoloAnteprima,
  titoloEffettivo,
  titoloPredefinito,
} from "@/lib/dominio/bacheca";
import { fontPerId, MAX_MESSAGGIO_GRUPPO } from "@/lib/dominio/biglietti";
import type { Biglietto, EffettoApertura, ModoRivelazione } from "@/lib/tipi";
import { Finestra } from "../comuni";
import { CartaBiglietto, type AspettoBacheca } from "../bacheca/AnteprimaBacheca";
import { Coriandoli } from "../bacheca/Coriandoli";
import { SceltaMusica } from "../bacheca/SceltaMusica";
import { NomeColore, SceltaAspetto, type ValoreAspetto } from "./SceltaAspetto";
import { TelefonoModo } from "./TelefonoModo";

const CHIAVE_SESSIONE = "colletta.biglietto.nuovo";

interface Stato extends ValoreAspetto {
  passo: number;
  occasione: string;
  festeggiato: string;
  /** il titolo scritto al passo 2; conta solo con `titoloScritto` (altrimenti vale quello proposto) */
  titolo: string;
  titoloScritto: boolean;
  benvenuto: string;
  /** il colore del titolo l'ha scelto chi crea: cambiando sfondo non lo si adatta più da soli */
  coloreTitoloScelto: boolean;
  rivelazione: ModoRivelazione;
  effetto: EffettoApertura;
  /** la bozza creata sul server al primo tentativo: un nuovo tentativo non ne crea un'altra */
  bozzaId: string | null;
}

const COLORE_TITOLO_SCURO = "#033922";

/** Il colore del titolo che si legge meglio sullo sfondo dato (finché chi crea non ne sceglie uno). */
function titoloPerSfondo(sfondo: ValoreAspetto["sfondo"], colore: string): string {
  return sfondo === "foto" || testoSu(colore) === "#FFFFFF" ? "#FFFFFF" : COLORE_TITOLO_SCURO;
}

function statoIniziale(): Stato {
  return {
    passo: 0,
    occasione: OCCASIONI_EDITOR[0].id,
    festeggiato: "",
    titolo: "",
    titoloScritto: false,
    benvenuto: "",
    sfondo: "colore",
    coloreSfondo: COLORI_SFONDO[0],
    fontTitolo: FONT_TITOLO_PREDEFINITO,
    coloreTitolo: COLORE_TITOLO_SCURO,
    coloreTitoloScelto: false,
    rivelazione: RIVELAZIONE_EDITOR,
    effetto: EFFETTO_PREDEFINITO,
    bozzaId: null,
  };
}

/** Una bozza salvata da una versione precedente dell'editor torna valida: i valori fuori elenco si azzerano. */
function ripristina(salvato: Partial<Stato>): Stato {
  const iniziale = statoIniziale();
  const s = { ...iniziale, ...salvato };
  if (!OCCASIONI_EDITOR.some((o) => o.id === s.occasione)) s.occasione = iniziale.occasione;
  if (!MODI_RIVELAZIONE.some((m) => m.id === s.rivelazione)) s.rivelazione = RIVELAZIONE_EDITOR;
  if (typeof s.coloreSfondo !== "string" || !COLORE_HEX.test(s.coloreSfondo)) s.coloreSfondo = iniziale.coloreSfondo;
  if (typeof s.coloreTitolo !== "string" || !COLORE_HEX.test(s.coloreTitolo)) s.coloreTitolo = iniziale.coloreTitolo;
  s.fontTitolo = fontTitoloValido(s.fontTitolo) ?? iniziale.fontTitolo;
  s.effetto = effettoValido(s.effetto);
  // la foto resta solo in memoria: dopo un ricaricamento si torna al colore
  s.sfondo = "colore";
  s.passo = Math.min(PASSI.length - 1, Math.max(0, Math.floor(Number(s.passo) || 0)));
  return s;
}

const PASSI = ["A chi è dedicato?", "Titolo e messaggio", "Colori e font", "Come lo scoprirà", "Ritocchi finali", "Rivedi tutto"] as const;

/**
 * Crea un biglietto (/biglietto/nuovo; Gifty UX v2, design.md §5 «Editor», prototipi/biglietto-editor.html): schermo
 * intero con la sola barra (chiudi, passo, tacche), l'anteprima viva e il pannello già aperto sul campo del passo (foglio
 * in basso sul telefono, colonna a destra su desktop), Indietro e Avanti nel pannello, riepilogo con la matita al passo 6.
 * Tutto resta nel browser fino a «Crea il biglietto»: solo allora nasce la bozza sul server, che si pubblica subito
 * dopo l'accesso.
 */
/** Il regalo di gruppo da cui nasce il biglietto («Prepara il biglietto», spec §7.7): festeggiato e occasione già scritti. */
export interface GruppoBiglietto {
  slug: string;
  festeggiato: string;
  occasione: string;
}

export function CreaBiglietto({ gruppo = null }: { gruppo?: GruppoBiglietto | null }) {
  const router = useRouter();
  const chiaveSessione = gruppo ? `${CHIAVE_SESSIONE}.${gruppo.slug}` : CHIAVE_SESSIONE;
  const api = useApi();
  const { utente, auth } = useApp();
  const [s, setS] = useState<Stato>(() => {
    const iniziale = statoIniziale();
    if (!gruppo) return iniziale;
    // dal gruppo occasione e nome sono già quelli del regalo
    const occasione = OCCASIONI_EDITOR.some((o) => o.id === gruppo.occasione) ? gruppo.occasione : iniziale.occasione;
    return { ...iniziale, occasione, festeggiato: gruppo.festeggiato };
  });
  const [pronto, setPronto] = useState(false);
  const [invio, setInvio] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [accesso, setAccesso] = useState(false);
  // la musica resta un file nel browser (troppo grande per la bozza in sessione): si carica con «Crea il biglietto»
  const [musica, setMusica] = useState<File | null>(null);
  // anche la foto dello sfondo resta nel browser (già ridotta): si carica con «Crea il biglietto»
  const [foto, setFoto] = useState<string | null>(null);
  // l'anteprima dell'effetto all'apertura, sulla carta
  const [scatto, setScatto] = useState(0);
  const urlMusica = useMemo(() => (musica ? URL.createObjectURL(musica) : null), [musica]);
  useEffect(() => () => void (urlMusica && URL.revokeObjectURL(urlMusica)), [urlMusica]);
  const inAttesa = useRef(false);
  const titoloPasso = useRef<HTMLHeadingElement>(null);
  const primoGiro = useRef(true);
  const id = useId();

  // la bozza dell'editor sopravvive a un ricaricamento della pagina
  useEffect(() => {
    const salvato = leggiSessione<Partial<Stato>>(chiaveSessione);
    if (salvato) setS(ripristina(salvato));
    setPronto(true);
  }, [chiaveSessione]);
  useEffect(() => {
    if (pronto) scriviSessione(chiaveSessione, s);
  }, [s, pronto, chiaveSessione]);

  // a ogni nuovo passo il fuoco va al titolo del pannello
  useEffect(() => {
    if (primoGiro.current) {
      primoGiro.current = false;
      return;
    }
    titoloPasso.current?.focus();
  }, [s.passo]);

  const imposta = <K extends keyof Stato>(k: K, v: Stato[K]) => setS((x) => ({ ...x, [k]: v }));
  /** Le scelte di «Colori e font»: finché chi crea non sceglie il colore del titolo, segue lo sfondo. */
  const cambiaAspetto = (v: Partial<ValoreAspetto>) =>
    setS((x) => {
      const y = { ...x, ...v, coloreTitoloScelto: x.coloreTitoloScelto || v.coloreTitolo !== undefined };
      if (!y.coloreTitoloScelto) y.coloreTitolo = titoloPerSfondo(y.sfondo, y.coloreSfondo);
      return y;
    });
  const conFoto = s.sfondo === "foto" && !!foto;
  const titoloProposto = titoloPredefinito(s.occasione, s.festeggiato);
  const titolo = s.titoloScritto ? titoloEffettivo(s.titolo, s.occasione, s.festeggiato) : titoloAnteprima(s.occasione, s.festeggiato);
  const aspetto: AspettoBacheca = {
    titolo,
    benvenuto: s.benvenuto,
    emoji: "",
    fontTitolo: s.fontTitolo,
    colori: { sfondo1: s.coloreSfondo, sfondo2: s.coloreSfondo, accento: s.coloreTitolo },
    immagine: conFoto ? foto : null,
    scurisci: SCURISCI_PREDEFINITO,
    classeCarta: null,
    coloreTitolo: s.coloreTitolo,
  };
  const effetto = effettoDi(s.effetto);

  const ultimo = s.passo === PASSI.length - 1;
  const puoAvanzare = s.passo !== 0 || !!s.festeggiato.trim();

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
        const r = await api<{ id: string; chiave: string }>("/api/biglietti", {
          metodo: "POST",
          corpo: { occasione: s.occasione, ...(gruppo ? { collettaSlug: gruppo.slug } : {}) },
        });
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
            modelloId: MODELLO_LIBERO,
            colori: aspetto.colori,
            fontTitolo: s.fontTitolo,
            coloreTitolo: s.coloreTitolo,
            scurisci: SCURISCI_PREDEFINITO,
            rivelazione: s.rivelazione,
            effetto: s.effetto,
          },
        },
      });
      // la foto dello sfondo, già ridotta; senza foto si toglie quella di un tentativo precedente
      await api(`/api/biglietti/${bid}/copertina`, { metodo: "POST", bigliettoId: bid, corpo: { sfondo: true, dataUrl: conFoto ? foto : null } });
      if (musica) await api(`/api/biglietti/${bid}/musica?nome=${encodeURIComponent(musica.name)}`, { metodo: "POST", bigliettoId: bid, file: musica });
      await api(`/api/biglietti/${bid}/pubblica`, { metodo: "POST", bigliettoId: bid, corpo: { nome: utente.nome } });
      scriviSessione(chiaveSessione, null);
      router.push(`/biglietto/${bid}/gestisci`);
    } catch (e) {
      if (e instanceof ErroreApi && e.dati.motivo === "accesso") {
        inAttesa.current = true;
        setAccesso(true);
      } else {
        setErrore(e instanceof Error ? e.message : "Non siamo riusciti a creare il biglietto. Riprova.");
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
    // 1, a chi è dedicato
    <form
      key="perchi"
      className="grid gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        avanti();
      }}
    >
      <div className="campo">
        <span className="etichetta" id={`${id}-o`}>
          Che cosa festeggiamo
        </span>
        <div className="chips" role="radiogroup" aria-labelledby={`${id}-o`}>
          {OCCASIONI_EDITOR.map((o) => (
            <button key={o.id} type="button" className="chip" role="radio" aria-checked={s.occasione === o.id} onClick={() => imposta("occasione", o.id)}>
              {o.etichetta}
            </button>
          ))}
        </div>
      </div>
      <div className="campo">
        <label htmlFor={`${id}-n`}>Nome di chi festeggiamo</label>
        <input
          id={`${id}-n`}
          className="input w-nome"
          maxLength={80}
          autoComplete="off"
          enterKeyHint="next"
          value={s.festeggiato}
          onChange={(e) => imposta("festeggiato", e.target.value)}
        />
      </div>
    </form>,

    // 2, titolo e messaggio
    <div key="titolo" className="grid gap-5">
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
        <label htmlFor={`${id}-r`}>Messaggio</label>
        <textarea id={`${id}-r`} className="input min-h-24 py-3" rows={3} maxLength={MAX_MESSAGGIO_GRUPPO} value={s.benvenuto} onChange={(e) => imposta("benvenuto", e.target.value)} />
      </div>
    </div>,

    // 3, colori e font
    <SceltaAspetto key="aspetto" valore={s} onCambia={cambiaAspetto} foto={foto} onFoto={setFoto} onTogliFoto={() => (setFoto(null), cambiaAspetto({ sfondo: "colore" }))} />,

    // 4, come lo scoprirà: il telefono a sinistra mostra il modo scelto
    <div key="rivelazione" role="radiogroup" aria-labelledby="t-passo" className="grid gap-3">
      {MODI_RIVELAZIONE.map((m) => (
        <SceltaGrande key={m.id} scelto={s.rivelazione === m.id} nome={m.nome} onScegli={() => imposta("rivelazione", m.id)}>
          {m.descrizione}
        </SceltaGrande>
      ))}
    </div>,

    // 5, ritocchi finali
    <div key="ritocchi" className="grid gap-5">
      <div className="campo">
        <span className="etichetta">Musica</span>
        <SceltaMusica nome={musica?.name ?? null} url={urlMusica} onFile={setMusica} onTogli={() => setMusica(null)} />
      </div>
      <div className="campo">
        <span className="etichetta" id={`${id}-e`}>
          Effetto all’apertura
        </span>
        <div className="chips" role="radiogroup" aria-labelledby={`${id}-e`}>
          {EFFETTI_APERTURA.map((e) => (
            <button
              key={e.id}
              type="button"
              className="chip"
              role="radio"
              aria-checked={s.effetto === e.id}
              onClick={() => {
                imposta("effetto", e.id);
                setScatto(Date.now());
              }}
            >
              {e.emoji[0] ? <span aria-hidden="true">{e.emoji[0]}</span> : null}
              {e.nome}
            </button>
          ))}
        </div>
      </div>
    </div>,

    // 6, rivedi tutto
    <div key="riepilogo" className="grid gap-4">
      <dl className="riep-b">
        {(
          [
            ["Occasione", nomeOccasione(s.occasione), 0],
            ["Per", s.festeggiato, 0],
            ["Titolo", titolo, 1],
            ["Messaggio", s.benvenuto.trim() || "–", 1],
            ["Sfondo", conFoto ? "Foto" : <NomeColore key="s" colore={s.coloreSfondo} />, 2],
            ["Font del biglietto", <span key="f" style={{ fontFamily: fontPerId(s.fontTitolo).css }}>{fontPerId(s.fontTitolo).nome}</span>, 2],
            ["Colore del titolo", <NomeColore key="c" colore={s.coloreTitolo} />, 2],
            ["Come lo scopre", nomeRivelazione(s.rivelazione), 3],
            ["Musica", musica?.name ?? "Nessuna", 4],
            ["Effetto all’apertura", effetto.nome, 4],
          ] as const
        ).map(([k, v, passo]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd className={k === "Messaggio" ? "line-clamp-2 font-normal" : undefined}>{v}</dd>
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
            Passo {s.passo + 1} di {PASSI.length}
          </span>
          <span className="tacche" aria-hidden="true">
            {PASSI.map((_, i) => (
              <i key={i} className={i < s.passo ? "fatto" : i === s.passo ? "ora" : ""} />
            ))}
          </span>
        </div>
      </div>

      <div className="tela">
        {!pronto ? null : s.passo === 3 ? (
          <TelefonoModo modo={s.rivelazione} aspetto={aspetto} festeggiato={s.festeggiato} />
        ) : (
          <CartaBiglietto aspetto={aspetto}>
            <div className="foglietto-firma c3">
              Il primo messaggio sarà il tuo.<span className="chi">Tu</span>
            </div>
            <div className="foglietto-firma vuoto">Qui firmano gli altri</div>
          </CartaBiglietto>
        )}
        <Coriandoli scatto={scatto} emoji="🎉" serie={effetto.emoji} sale={effetto.sale} contenuto />
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
