"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Avviso, Bottone, BottoneTondo, Dialogo, Icona, IntestazionePasso, LinkTondo, type NomeIcona } from "@/components/ui";
import { ErroreDominio } from "@/lib/dominio/operazioni";
import { generaSlugLibero } from "@/lib/dominio/slug";
import { ORE, votazioneIniziale } from "@/lib/dominio/votazione";
import { leggiLista, svuotaRegali } from "@/lib/listaRegali";
import { OCCASIONI } from "@/lib/tipi";
import { Passo1Regalo } from "./Passo1Regalo";
import { Passo2PerChi } from "./Passo2PerChi";
import { Passo3Quota } from "./Passo3Quota";
import { Passo4Pagamenti } from "./Passo4Pagamenti";
import { Passo5Partecipanti } from "./Passo5Partecipanti";
import { Passo6Invita } from "./Passo6Invita";
import {
  CHIAVE_WIZARD,
  campiDaStato,
  candidatiChiave,
  dataSuggerita,
  erroriPasso,
  nomiDaLista,
  nuovaColletta,
  prodottoDaStato,
  statoDaColletta,
  statoIniziale,
  type Errori,
  type Passo,
  type StatoWizard,
} from "./stato";

/**
 * I passi che si vedono sono cinque: «La quota» e «Come ti pagano» (passi 3 e 4 dello stato, che restano
 * distinti per la bozza e per la ripresa dalla sessione) stanno in una schermata sola, come nel disegno di UX_V4.
 */
const VISIBILI: readonly { passi: readonly number[]; nome: string; icona: NomeIcona; domanda: string; sotto: string }[] = [
  { passi: [1], nome: "Il regalo", icona: "redeem", domanda: "Chi sceglie il regalo?", sotto: "Puoi sceglierlo tu o far votare il gruppo." },
  { passi: [2], nome: "Per chi e quando", icona: "celebration", domanda: "Per chi e quando?", sotto: "Chi festeggiate e quando date il regalo." },
  { passi: [3, 4], nome: "Quota e pagamenti", icona: "payments", domanda: "Come si divide il costo?", sotto: "La quota e dove ricevere i soldi." },
  { passi: [5], nome: "Chi partecipa", icona: "groups", domanda: "Chi partecipa?", sotto: "Lascia aggiungere tutti, o scrivi tu i nomi." },
  { passi: [6], nome: "Invita", icona: "share", domanda: "Pronto! Invita il gruppo", sotto: "Manda il link nella chat per iniziare la raccolta." },
];

const indiceVisibile = (p: Passo) => VISIBILI.findIndex((v) => v.passi.includes(p));
/** Il passo successivo e quello precedente saltano il 4, che sta nella stessa schermata del 3. */
const dopo = (p: Passo): Passo => (p === 3 || p === 4 ? 5 : ((p + 1) as Passo));
const prima = (p: Passo): Passo => (p === 5 ? 3 : p === 4 ? 2 : ((p - 1) as Passo));

function leggiSalvato(uid: string): StatoWizard | null {
  try {
    const grezzo = window.sessionStorage.getItem(CHIAVE_WIZARD);
    if (!grezzo) return null;
    const s = JSON.parse(grezzo) as StatoWizard;
    // I campi aggiunti dopo il salvataggio prendono il valore di partenza.
    return s.uid === uid ? { ...statoIniziale(uid, s.organizzatoreNome ?? ""), ...s } : null;
  } catch {
    return null;
  }
}

function scriviSalvato(s: StatoWizard | null) {
  try {
    if (s) window.sessionStorage.setItem(CHIAVE_WIZARD, JSON.stringify(s));
    else window.sessionStorage.removeItem(CHIAVE_WIZARD);
  } catch {
    /* il lavoro resta in pagina: nessun errore visibile */
  }
}

export function Wizard() {
  const { dati, utente } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const [adesso] = useState(() => Date.now());
  const [s, setS] = useState<StatoWizard | null>(null);
  const [errori, setErrori] = useState<Errori>({});
  const [occupato, setOccupato] = useState(false);
  const [problema, setProblema] = useState<string | null>(null);
  const [dialogo, setDialogo] = useState(false);
  const titolo = useRef<HTMLHeadingElement>(null);
  const avviato = useRef(false);

  // Avvio: ripresa del lavoro salvato, di una bozza o di un prodotto scelto dal catalogo.
  useEffect(() => {
    if (!utente || avviato.current) return;
    avviato.current = true;
    const uid = utente.uid;
    const salvato = leggiSalvato(uid);
    const bozza = params.get("bozza");
    const prodotto = params.get("prodotto");
    const persone = Number(params.get("persone"));
    const daLista = params.get("lista") === "1";

    (async () => {
      try {
        if (bozza) {
          const c = await dati.colletta(bozza);
          if (c && c.organizzatoreUid === uid && c.stato === "bozza") {
            const candidati = c.votazione
              ? (await dati.proposte(bozza)).filter((p) => p.daOrganizzatore).sort((x, y) => x.creatoIl - y.creatoIl).map((p) => p.prodotto)
              : [];
            setS(statoDaColletta(c, uid, candidati));
            return;
          }
        }
        if (daLista) {
          // La lista dei regali messa insieme col «+» nel catalogo: diventa la lista da far votare.
          const lista = leggiLista();
          if (lista.length) {
            const base = statoIniziale(uid, utente.nome);
            const consegna = lista.reduce((m, x) => Math.max(m, x.consegnaGiorni), 1);
            setS({ ...base, votazioneAttiva: true, candidati: lista, dataRegalo: dataSuggerita(consegna, adesso) });
            svuotaRegali();
            return;
          }
        }
        if (prodotto) {
          const p = await dati.prodotto(prodotto);
          if (p && salvato?.prodotto?.prodottoId === p.slug) {
            setS(salvato);
            return;
          }
          if (p) {
            const base = statoIniziale(uid, utente.nome);
            setS({
              ...base,
              prodotto: {
                prodottoId: p.slug,
                nome: p.nome,
                prezzoCent: p.prezzoCent,
                consegnaGiorni: p.consegnaGiorni,
                urlEsterno: p.urlEsterno,
                immagine: p.immagine,
              },
              dataRegalo: dataSuggerita(p.consegnaGiorni, adesso),
              previsti: Number.isFinite(persone) && persone >= 2 ? Math.min(200, Math.round(persone)) : base.previsti,
            });
            return;
          }
        }
      } catch {
        /* si riparte dal lavoro salvato o da zero */
      }
      // L'occasione arriva dal biglietto («Fare un regalo insieme e firmare il biglietto»), le persone dal
      // catalogo. Un valore che non si riconosce viene ignorato.
      const occasione = OCCASIONI.find((o) => o === params.get("occasione"));
      const base = statoIniziale(uid, utente.nome);
      setS(
        salvato ?? {
          ...base,
          ...(occasione ? { occasione } : {}),
          ...(Number.isFinite(persone) && persone >= 2 ? { previsti: Math.min(200, Math.round(persone)) } : {}),
        },
      );
    })();
  }, [utente, params, dati, adesso]);

  useEffect(() => {
    if (s) scriviSalvato(s);
  }, [s]);

  // A ogni cambio di passo la nuova intestazione prende il focus: tastiera e screen reader sanno dove sono.
  const passo = s?.passo;
  useEffect(() => {
    if (passo) titolo.current?.focus();
  }, [passo]);

  const cambia = useCallback((patch: Partial<StatoWizard>) => {
    setS((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  if (!s) {
    return <p className="py-10 text-center text-ink-soft">Preparo il wizard…</p>;
  }

  async function salvaBozza(corrente: StatoWizard): Promise<string> {
    if (!corrente.slug) {
      const slug = await generaSlugLibero(async (x) => !(await dati.slugLibero(x)));
      await dati.creaColletta(nuovaColletta(corrente, slug, adesso));
      return slug;
    }
    await dati.aggiornaColletta(corrente.slug, campiDaStato(corrente, adesso));
    return corrente.slug;
  }

  async function sincronizzaInvitati(slug: string, corrente: StatoWizard): Promise<string[]> {
    const nomi = corrente.listaAperta ? [] : nomiDaLista(corrente.nomiLista);
    if (JSON.stringify(nomi) === JSON.stringify(corrente.nomiCreati)) return corrente.nomiCreati;
    // Siamo ancora in bozza: nessuno ha aderito, si possono rifare le righe degli invitati.
    const esistenti = await dati.partecipanti(slug);
    for (const r of esistenti.filter((x) => x.stato === "invitato")) await dati.esegui(slug, r.id, { tipo: "rimuovi" });
    if (nomi.length) await dati.aggiungiInvitati(slug, nomi);
    return nomi;
  }

  /** I regali candidati diventano proposte della bozza; si rifanno solo se la lista cambia. */
  async function sincronizzaProposte(slug: string, corrente: StatoWizard): Promise<string> {
    const chiave = corrente.votazioneAttiva ? candidatiChiave(corrente.candidati) : "";
    if (chiave === corrente.candidatiSalvati) return chiave;
    await dati.impostaProposteIniziali(slug, corrente.votazioneAttiva ? corrente.candidati : []);
    return chiave;
  }

  async function avanti() {
    if (!s) return;
    const e = s.passo === 3 || s.passo === 4 ? { ...erroriPasso(s, 3, adesso), ...erroriPasso(s, 4, adesso) } : erroriPasso(s, s.passo, adesso);
    setErrori(e);
    if (Object.keys(e).length) {
      setDialogo(true);
      return;
    }
    setOccupato(true);
    setProblema(null);
    try {
      let corrente = s;
      if (s.passo >= 2) {
        const slug = await salvaBozza(s);
        corrente = { ...corrente, slug };
      }
      if (s.passo >= 2 && corrente.slug) {
        corrente = { ...corrente, candidatiSalvati: await sincronizzaProposte(corrente.slug, corrente) };
      }
      if (s.passo === 5 && corrente.slug) {
        const nomiCreati = await sincronizzaInvitati(corrente.slug, corrente);
        corrente = { ...corrente, nomiCreati };
      }
      setS({ ...corrente, passo: dopo(s.passo) });
    } catch (err) {
      setProblema(err instanceof ErroreDominio ? err.message : "Non sono riuscito a salvare. Controlla la connessione e riprova.");
    } finally {
      setOccupato(false);
    }
  }

  /** Chiusa la finestra, si porta in vista il primo campo da correggere (già evidenziato in rosso). */
  function chiudiDialogo() {
    setDialogo(false);
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>('[aria-invalid="true"], [data-errore="true"]');
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) el.focus({ preventScroll: true });
    });
  }

  function indietro() {
    if (!s || s.passo === 1) return;
    setErrori({});
    setProblema(null);
    setS({ ...s, passo: prima(s.passo) });
  }

  async function apri() {
    if (!s?.slug) return;
    setOccupato(true);
    setProblema(null);
    try {
      const ora = Date.now();
      await dati.aggiornaColletta(s.slug, {
        ...campiDaStato(s, adesso),
        stato: "aperta",
        // la votazione parte quando si apre la raccolta
        ...(s.votazioneAttiva
          ? { votazione: { ...votazioneIniziale(s.votazioneOre, s.consentiProposte), apertaIl: ora, scade: ora + s.votazioneOre * ORE } }
          : {}),
      });
      scriviSalvato(null);
      router.push(`/gestisci/${s.slug}`);
    } catch {
      setProblema("Non sono riuscito ad aprire la raccolta. Riprova.");
      setOccupato(false);
    }
  }

  const propsPasso = { s, cambia, errori, adesso };
  const i = indiceVisibile(s.passo);
  const visibile = VISIBILI[i];
  const prossimo = VISIBILI[i + 1];
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <div className="flex flex-col gap-5">
        {/* barra in alto: pulsante tondo e linea di avanzamento */}
        <div className="flex items-center gap-3">
          {s.passo === 1 ? (
            <LinkTondo href="/catalogo" icona="close" etichetta="Torna al catalogo" />
          ) : (
            <BottoneTondo icona="arrow_back" etichetta="Indietro" onClick={indietro} disabled={occupato} />
          )}
          <div aria-hidden="true" className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${((i + 1) / VISIBILI.length) * 100}%` }} />
          </div>
          <span className="cifre shrink-0 text-sm font-semibold text-ink-soft">
            {i + 1}/{VISIBILI.length}
          </span>
        </div>
        <IntestazionePasso
          icona={visibile.icona}
          etichetta={`Passo ${i + 1} di ${VISIBILI.length} · ${visibile.nome}`}
          titolo={visibile.domanda}
          sotto={visibile.sotto}
          titoloRef={titolo}
        />
        {s.passo >= 2 && s.passo <= 5 && prodottoDaStato(s) ? (
          <p className="flex items-center justify-between gap-2 rounded-2xl bg-surface px-4 py-2 text-sm shadow-carta">
            <span className="flex min-w-0 items-center gap-2">
              <Icona nome="redeem" dimensione={20} className="text-accent" />
              <span className="truncate">{s.votazioneAttiva ? `Lo sceglie il gruppo (${s.candidati.length} idee)` : s.prodotto?.nome}</span>
            </span>
            <button type="button" className="min-h-tocco shrink-0 font-bold text-accent" onClick={() => cambia({ passo: 1 })}>
              Cambia
            </button>
          </p>
        ) : null}
      </div>

      {s.passo === 1 ? <Passo1Regalo {...propsPasso} /> : null}
      {s.passo === 2 ? <Passo2PerChi {...propsPasso} /> : null}
      {s.passo === 3 || s.passo === 4 ? (
        <>
          <Passo3Quota {...propsPasso} />
          <Passo4Pagamenti {...propsPasso} />
        </>
      ) : null}
      {s.passo === 5 ? <Passo5Partecipanti {...propsPasso} /> : null}
      {s.passo === 6 ? <Passo6Invita {...propsPasso} onApri={apri} apro={occupato} /> : null}

      <Dialogo aperto={dialogo} onChiudi={chiudiDialogo}>
        <p>Compila tutti i dati prima di proseguire.</p>
      </Dialogo>

      {problema ? (
        <Avviso tono="attenzione" live>
          <p>{problema}</p>
        </Avviso>
      ) : null}

      {/* Una sola azione in fondo allo schermo, sempre a portata di pollice. */}
      {prossimo ? (
        <div className="sticky bottom-0 z-30 -mx-4 flex items-center gap-2 bg-field px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          {s.passo > 1 ? (
            <button
              type="button"
              onClick={indietro}
              disabled={occupato}
              aria-label="Indietro"
              className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border border-line bg-surface shadow-carta"
            >
              <Icona nome="arrow_back" />
            </button>
          ) : null}
          <Bottone pieno onClick={avanti} disabled={occupato}>
            {occupato ? "Salvo…" : `Avanti: ${prossimo.nome}`}
            {!occupato ? <Icona nome="arrow_forward" dimensione={20} /> : null}
          </Bottone>
        </div>
      ) : null}
    </div>
  );
}
