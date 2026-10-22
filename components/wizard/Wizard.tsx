"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Avviso, Barra, Bottone, Dialogo, IconaFreccia, IconaIndietro } from "@/components/ui";
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

const TITOLI: Record<Passo, string> = {
  1: "Il regalo",
  2: "Per chi e quando",
  3: "La quota",
  4: "Come ti pagano",
  5: "Chi partecipa",
  6: "Invita il gruppo",
};

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
      // Dati già raccolti dalle altre varianti (UX_V2 `/v2/crea`, UX_V3 `/v3/crea`): si riparte da lì
      // invece di rifare le stesse domande. Tutto quello che non si riconosce viene ignorato.
      const nome = params.get("nome")?.trim();
      const festeggiato = params.get("festeggiato")?.trim();
      const occasione = OCCASIONI.find((o) => o === params.get("occasione"));
      const metodi = new Set((params.get("metodi") ?? "").split(",").filter(Boolean));
      const base = statoIniziale(uid, utente.nome);
      setS(
        salvato ?? {
          ...base,
          ...(nome ? { organizzatoreNome: nome.slice(0, 60) } : {}),
          ...(festeggiato ? { festeggiato: festeggiato.slice(0, 60) } : {}),
          ...(occasione ? { occasione } : {}),
          ...(Number.isFinite(persone) && persone >= 2 ? { previsti: Math.min(200, Math.round(persone)) } : {}),
          // Si accende solo la casella: il valore (nome Satispay, IBAN…) si scrive nel passo dei pagamenti.
          satispayAttivo: base.satispayAttivo || metodi.has("satispay"),
          paypalAttivo: base.paypalAttivo || metodi.has("paypal"),
          bonificoAttivo: base.bonificoAttivo || metodi.has("bonifico"),
          contantiAttivo: base.contantiAttivo || metodi.has("contanti"),
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
    const e = erroriPasso(s, s.passo, adesso);
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
      setS({ ...corrente, passo: (s.passo + 1) as Passo });
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
    setS({ ...s, passo: (s.passo - 1) as Passo });
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
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          {s.passo > 1 ? (
            <Bottone variante="testuale" dimensione="piccolo" onClick={indietro} disabled={occupato}>
              <IconaIndietro width={16} height={16} /> Indietro
            </Bottone>
          ) : (
            <Link href="/catalogo" className="inline-flex min-h-tocco items-center gap-1 px-3 text-sm font-semibold text-accent-2">
              <IconaIndietro width={16} height={16} /> Catalogo
            </Link>
          )}
          <span className="text-sm text-ink-soft">Passo {s.passo} di 6</span>
        </div>
        <Barra percento={(s.passo / 6) * 100} etichetta={`Passo ${s.passo} di 6`} />
        <h1 ref={titolo} tabIndex={-1} className="text-3xl outline-none">
          {TITOLI[s.passo]}
        </h1>
        {s.passo >= 2 && s.passo <= 5 && prodottoDaStato(s) ? (
          <p className="flex items-center justify-between gap-2 text-sm text-ink-soft">
            <span className="min-w-0 truncate">
              {s.votazioneAttiva ? `Regalo: lo sceglie il gruppo (${s.candidati.length} candidati)` : `Regalo: ${s.prodotto?.nome}`}
            </span>
            {s.passo === 2 ? (
              <button type="button" className="min-h-tocco shrink-0 font-semibold text-accent-2 underline underline-offset-4" onClick={() => cambia({ passo: 1 })}>
                Cambia
              </button>
            ) : null}
          </p>
        ) : null}
      </div>

      {s.passo === 1 ? <Passo1Regalo {...propsPasso} /> : null}
      {s.passo === 2 ? <Passo2PerChi {...propsPasso} /> : null}
      {s.passo === 3 ? <Passo3Quota {...propsPasso} /> : null}
      {s.passo === 4 ? <Passo4Pagamenti {...propsPasso} /> : null}
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

      {s.passo < 6 ? (
        <Bottone pieno onClick={avanti} disabled={occupato}>
          {occupato ? "Salvo…" : "Avanti"} {!occupato ? <IconaFreccia width={18} height={18} /> : null}
        </Bottone>
      ) : null}
    </div>
  );
}
