"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { leggiLocale, nomeDaEmail, scriviLocale, type Utente } from "@/lib/auth/tipi";
import { dataBreve, giornoDaIso, istanteRoma } from "@/lib/dominio/date";
import { ErroreDominio } from "@/lib/dominio/operazioni";
import { contiene, daProdotto, stessoRegalo } from "@/lib/dominio/regali";
import { generaSlugLibero } from "@/lib/dominio/slug";
import { leggiLista, svuotaRegali } from "@/lib/listaRegali";
import { etichettaOccasione } from "@/lib/regalo/dati";
import type { ProdottoColletta } from "@/lib/tipi";
import {
  aperturaDaStato,
  bozzaDaRiprendere,
  campiDaStato,
  CHIAVE_WIZARD,
  conMetodi,
  conRegaloAlVoto,
  conRegaloScelto,
  erroriPasso,
  inVotazione,
  leggiStato,
  nuovaColletta,
  occasioneValida,
  passoDopo,
  passoPrima,
  personeDivisione,
  posizione,
  primoPassoConErrori,
  senzaMetodi,
  sequenza,
  statoDaColletta,
  statoIniziale,
  testoMetodi,
  testoQuota,
  type Errori,
  type Partenza,
  type Passo,
  type StatoWizard,
} from "@/lib/wizard/stato";
import { Anteprima, type RigheAnteprima } from "./Anteprima";
import { BarraProcedura } from "./BarraProcedura";
import { FoglioCatalogo, FoglioEsci } from "./Fogli";
import { PassoAccesso } from "./PassoAccesso";
import { CHIAVE_CHAT_CREATO, PassoCondividi } from "./PassoCondividi";
import { PassoPartenza, PassoPerChi, PassoPersone, PassoQuota, PassoRegalo, PassoRimborsi, PassoVoto } from "./PassiDati";
import { PassoRiepilogo } from "./PassoRiepilogo";
import { daVoce, type VoceCatalogo } from "./tipi";

/** Questa scheda sta lavorando alla bozza: ricaricando si resta al passo, invece di vedere «Riprendi». */
const CHIAVE_ATTIVO = "gifty.wizard.attivo";

function sessione(chiave: string, valore: string | null) {
  try {
    if (valore === null) window.sessionStorage.removeItem(chiave);
    else window.sessionStorage.setItem(chiave, valore);
  } catch {
    /* senza sessionStorage si vede «Riprendi» anche dopo un ricaricamento */
  }
}

function inSessione(chiave: string): boolean {
  try {
    return window.sessionStorage.getItem(chiave) === "1";
  } catch {
    return false;
  }
}

/** Il nome di chi organizza, per la colletta e per la riga fra chi partecipa. */
const nomeDi = (u: Utente) => u.nome.trim() || (u.email ? nomeDaEmail(u.email) : "");

function titolo(s: StatoWizard): React.ReactNode {
  switch (s.passo) {
    case 1:
      return "Per chi è il regalo?";
    case 2:
      return "Quante persone inviti a partecipare?";
    case 3:
      return "Da dove vuoi iniziare?";
    case 4:
      return s.partenza === "adesioni" ? <label htmlFor="quota">Quanto chiedi a testa?</label> : s.partenza === "voto" ? "I regali da votare" : "Quale regalo?";
    case 5:
      return "Metodo di rimborso";
    default:
      return "Controlla e crea il regalo di gruppo";
  }
}

/** Le righe del biglietto dell'anteprima: si scrivono passo dopo passo, come nel prototipo. */
function righe(s: StatoWizard, organizzatore: string | null): RigheAnteprima {
  const seq = sequenza(s);
  const fatto = (p: Passo) => seq.indexOf(s.passo) > seq.indexOf(p);
  const giorno = giornoDaIso(s.dataRegalo);
  const occasione = etichettaOccasione(s.occasione);
  const quota = testoQuota(s);
  return {
    festeggiato: s.festeggiato,
    quando: giorno ? `${occasione}, ${dataBreve(istanteRoma(giorno, 12))}` : occasione,
    persone: fatto(2) ? { testo: `${s.chat} persone invitate a partecipare` } : { testo: "Persone invitate a partecipare", vuota: true },
    cosa:
      s.partenza === "adesioni"
        ? s.passo >= 4 && quota
          ? { testo: quota }
          : { testo: "Quota a testa", vuota: true }
        : s.partenza === "voto"
          ? s.regali.length
            ? s.regali
            : { testo: "Regali da votare", vuota: true }
          : s.partenza === "regalo" && s.regali.length
            ? s.regali
            : { testo: "Regalo o quota", vuota: true },
    rimborsi: fatto(5) && testoMetodi(s) ? { testo: `Rimborsi con ${testoMetodi(s)}` } : { testo: "Metodo di rimborso", vuota: true },
    organizzatore,
  };
}

/** /crea: la procedura, oppure (con `?creato=`) il passo per mandare il link nella chat. */
export function Crea({ catalogo }: { catalogo: VoceCatalogo[] }) {
  const creato = useSearchParams().get("creato");
  return creato ? <PassoCondividi slug={creato} /> : <Wizard catalogo={catalogo} />;
}

function Wizard({ catalogo }: { catalogo: VoceCatalogo[] }) {
  const { dati, utente: chi, pronto } = useApp();
  // chi partecipa a una colletta ha un'identità anonima: per creare un gruppo serve un account
  const utente = chi && !chi.anonimo ? chi : null;
  const router = useRouter();
  const params = useSearchParams();
  const [adesso] = useState(() => Date.now());
  const [s, setS] = useState<StatoWizard | null>(null);
  const [ripresa, setRipresa] = useState(false);
  const [catalogoAperto, setCatalogoAperto] = useState(false);
  const [esci, setEsci] = useState(false);
  const [errori, setErrori] = useState<Errori>({});
  const [occupato, setOccupato] = useState(false);
  const [problema, setProblema] = useState<string | null>(null);
  const refTitolo = useRef<HTMLHeadingElement>(null);
  const avviato = useRef(false);
  const creando = useRef(false);
  /** dopo l'uscita o la creazione la bozza non si riscrive più */
  const fermo = useRef(false);

  // Avvio: il lavoro salvato nel browser, più quello che arriva dall'indirizzo (un regalo da una tessera o dal catalogo
  // del gruppo, la lista del vecchio catalogo, una bozza del vecchio wizard, l'occasione, le persone). Poi l'indirizzo
  // torna /crea.
  useEffect(() => {
    if (!pronto || avviato.current) return;
    avviato.current = true;
    const uid = utente?.uid ?? null;
    const salvato = leggiStato(leggiLocale(CHIAVE_WIZARD), uid);
    const bozza = params.get("bozza");
    const prodotto = params.get("prodotto") ?? params.get("scegli");
    const vota = params.get("vota");
    const lista = params.get("lista") === "1";
    const conParametri = [...params.keys()].length > 0;

    const trova = async (slug: string): Promise<ProdottoColletta | null> => {
      const v = catalogo.find((x) => x.slug === slug);
      if (v) return daVoce(v);
      try {
        const p = await dati.prodotto(slug);
        return p ? daProdotto(p) : null;
      } catch {
        return null;
      }
    };
    /** Il primo passo da completare fra quelli prima di `finoA`, o `finoA`. */
    const primoDa = (st: StatoWizard, finoA: Passo): Passo => {
      for (const p of sequenza(st)) {
        if (p >= finoA) break;
        if (Object.keys(erroriPasso(st, p, adesso)).length) return p;
      }
      return finoA;
    };

    (async () => {
      let st = salvato ?? statoIniziale(uid);
      try {
        if (bozza) {
          // Le bozze del wizard di prima: si riaprono solo con l'account di chi le ha create.
          if (!utente) {
            router.replace(`/accedi?next=${encodeURIComponent(`/crea?bozza=${bozza}`)}`);
            return;
          }
          const c = await dati.colletta(bozza);
          if (c && c.organizzatoreUid === utente.uid && c.stato === "bozza") {
            const candidati = c.votazione
              ? (await dati.proposte(bozza))
                  .filter((p) => p.daOrganizzatore)
                  .sort((x, y) => x.creatoIl - y.creatoIl)
                  .map((p) => p.prodotto)
              : [];
            st = { ...statoDaColletta(c, utente.uid, candidati), passo: 6 };
          }
        } else if (lista) {
          const l = leggiLista();
          if (l.length) {
            st = l.reduce(conRegaloAlVoto, { ...st, partenza: "voto" as Partenza, regali: [], daProdotto: false });
            svuotaRegali();
            st = { ...st, passo: primoDa(st, 4) };
          }
        } else if (prodotto || vota) {
          const regalo = await trova((prodotto ?? vota) as string);
          if (regalo && prodotto) {
            // Dal prodotto si saltano «da dove vuoi iniziare» e la scelta del regalo (design.md §10.1, decisione 9).
            st = { ...conRegaloScelto(st, regalo), daProdotto: true, daRiepilogo: false };
            st = { ...st, passo: primoDa(st, 2) };
          } else if (regalo) {
            st = { ...conRegaloAlVoto({ ...st, daProdotto: false }, regalo), daRiepilogo: false };
            st = { ...st, passo: primoDa(st, 4) };
          }
        }
        // Chi ha già fatto l'accesso ritrova i metodi di rimborso dell'ultima volta (decisione 11).
        if (utente && senzaMetodi(st)) {
          const ultima = (await dati.elencaCollette(utente.uid)).filter((c) => c.stato !== "bozza").sort((a, b) => b.creatoIl - a.creatoIl)[0];
          if (ultima) st = conMetodi(st, ultima.metodi);
        }
      } catch {
        /* si riparte dal lavoro salvato o da zero */
      }
      if (!salvato) {
        const occasione = occasioneValida(params.get("occasione"));
        const persone = Math.round(Number(params.get("persone")));
        if (occasione) st = { ...st, occasione };
        if (Number.isFinite(persone) && persone >= 2) st = { ...st, chat: Math.min(200, persone) };
      }
      // Rientrando con una bozza si sceglie se riprenderla; chi ricarica la pagina o torna dall'accesso resta al passo.
      setRipresa(!conParametri && bozzaDaRiprendere(salvato) && !inSessione(CHIAVE_ATTIVO) && !salvato.creaDopoAccesso);
      setS(st);
      if (conParametri) router.replace("/crea", { scroll: false });
    })();
  }, [pronto, utente, params, dati, adesso, router, catalogo]);

  useEffect(() => {
    if (s && !fermo.current) scriviLocale(CHIAVE_WIZARD, JSON.stringify(s));
  }, [s]);

  useEffect(() => {
    if (s && !ripresa && !fermo.current) sessione(CHIAVE_ATTIVO, "1");
  }, [s, ripresa]);

  // Chi accede a metà strada diventa il proprietario del lavoro salvato.
  useEffect(() => {
    if (utente && s && s.uid !== utente.uid) setS({ ...s, uid: utente.uid });
  }, [utente, s]);

  // A ogni cambio di passo il titolo prende il focus: tastiera e lettori di schermo sanno dove sono.
  const passo = s?.passo;
  const primo = useRef(true);
  useEffect(() => {
    if (!passo) return;
    if (primo.current) {
      primo.current = false;
      return;
    }
    refTitolo.current?.focus();
    window.scrollTo({ top: 0 });
  }, [passo, ripresa]);

  const crea = useCallback(
    async (corrente: StatoWizard) => {
      if (!utente) return;
      const istante = Date.now();
      const daCorreggere = primoPassoConErrori(corrente, istante);
      if (daCorreggere) {
        setErrori(erroriPasso(corrente, daCorreggere, istante));
        setS({ ...corrente, passo: daCorreggere, daRiepilogo: daCorreggere !== 6, creaDopoAccesso: false });
        creando.current = false;
        return;
      }
      setOccupato(true);
      setProblema(null);
      try {
        const nome = nomeDi(utente);
        let slug = corrente.slug;
        if (slug) {
          await dati.aggiornaColletta(slug, campiDaStato(corrente, nome, istante));
        } else {
          slug = await generaSlugLibero(async (x) => !(await dati.slugLibero(x)));
          await dati.creaColletta(nuovaColletta(corrente, { slug, uid: utente.uid, organizzatoreNome: nome, adesso: istante }));
        }
        if (inVotazione(corrente) || corrente.slug) await dati.impostaProposteIniziali(slug, inVotazione(corrente) ? corrente.regali : []);
        await dati.aggiornaColletta(slug, aperturaDaStato(corrente, istante));
        // Chi organizza fa parte della divisione, se non si è tolto (D-16): entra fra chi partecipa.
        if (corrente.partecipo) {
          try {
            await dati.esegui(slug, utente.uid, { tipo: "aderisci", nome });
          } catch {
            /* il gruppo è creato: la riga di chi organizza si può aggiungere dalla pagina del gruppo */
          }
        }
        fermo.current = true;
        scriviLocale(CHIAVE_WIZARD, null);
        sessione(CHIAVE_ATTIVO, null);
        try {
          window.sessionStorage.setItem(CHIAVE_CHAT_CREATO, JSON.stringify({ slug, chat: corrente.chat }));
        } catch {
          /* il numero della chat è solo per il biglietto dell'anteprima */
        }
        router.replace(`/crea?creato=${slug}`);
      } catch (err) {
        setProblema(err instanceof ErroreDominio ? err.message : "Le modifiche non sono state salvate");
        setOccupato(false);
        creando.current = false;
      }
    },
    [utente, dati, router],
  );

  // Dopo «Accedi con Google» o il collegamento via email, appena c'è l'account il gruppo si crea da solo.
  useEffect(() => {
    if (s?.passo === 6 && s.creaDopoAccesso && utente && !ripresa && !creando.current && !problema) {
      creando.current = true;
      void crea(s);
    }
  }, [s, utente, crea, problema, ripresa]);

  if (!s) {
    return (
      <main className="pagina wizard">
        <p role="status" className="muted attesa">
          Un momento…
        </p>
      </main>
    );
  }

  const stato = s;
  const pos = posizione(stato);

  function cambia(patch: Partial<StatoWizard>) {
    setS((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  function vaiA(p: Passo, patch: Partial<StatoWizard> = {}) {
    setErrori({});
    setProblema(null);
    setS((prev) => (prev ? { ...prev, ...patch, passo: p } : prev));
  }

  function avanti() {
    const e = erroriPasso(stato, stato.passo, adesso);
    setErrori(e);
    setProblema(null);
    if (Object.keys(e).length) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>('.modulo [aria-invalid="true"]')?.focus());
      return;
    }
    // Dopo «Cambia» si torna al riepilogo (GOV.UK, «Check answers»).
    if (stato.daRiepilogo) vaiA(6, { daRiepilogo: false });
    else vaiA(passoDopo(stato));
  }

  function indietro() {
    const p = passoPrima(stato);
    creando.current = false;
    if (p) vaiA(p, { daRiepilogo: false });
  }

  function scegliPartenza(p: Partenza) {
    const stessa = p === stato.partenza;
    vaiA(4, stessa ? { partenza: p } : { partenza: p, regali: [] });
    // Con «Ho scelto il regalo» il catalogo si apre da solo (decisione 5).
    if (p === "regalo" && (!stessa || stato.regali.length === 0)) setCatalogoAperto(true);
  }

  function scegliRegalo(p: ProdottoColletta) {
    setCatalogoAperto(false);
    if (stato.passo === 2) {
      cambia({ regali: [p] });
      return;
    }
    // «Scegli questo regalo» sceglie e passa ai rimborsi, o torna al riepilogo.
    vaiA(stato.daRiepilogo ? 6 : passoDopo(stato), { partenza: "regalo", regali: [p], daRiepilogo: false });
  }

  function alternaVoto(p: ProdottoColletta) {
    setS((prev) => {
      if (!prev) return prev;
      if (contiene(prev.regali, p)) return { ...prev, regali: prev.regali.filter((x) => !stessoRegalo(x, p)) };
      return conRegaloAlVoto(prev, p);
    });
  }

  function lascia(cancella: boolean) {
    fermo.current = true;
    if (cancella) scriviLocale(CHIAVE_WIZARD, null);
    sessione(CHIAVE_ATTIVO, null);
    router.push("/regalo-di-gruppo");
  }

  function chiudi() {
    // Al passo 1 senza un nome non c'è niente da salvare: si esce senza chiedere.
    if (ripresa || (stato.passo === 1 && !stato.festeggiato.trim())) lascia(false);
    else setEsci(true);
  }

  const props = { s: stato, cambia, errori, adesso };
  const idTitolo = "t-passo";
  const continua = (
    <div className="avanti">
      <button type="submit" className="btn btn-primario">
        Continua
      </button>
    </div>
  );
  const conForm = (contenuto: React.ReactNode, conContinua = true) => (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        avanti();
      }}
    >
      {contenuto}
      {conContinua ? continua : null}
    </form>
  );

  let corpo: React.ReactNode;
  if (ripresa) {
    corpo = (
      <form onSubmit={(e) => e.preventDefault()}>
        <p>
          La bozza è ferma al passo {pos.n} di {pos.totale}.
        </p>
        <div className="avanti">
          <button
            type="button"
            className="btn btn-primario"
            onClick={() => {
              sessione(CHIAVE_ATTIVO, "1");
              setRipresa(false);
            }}
          >
            Riprendi
          </button>
          <button
            type="button"
            className="btn btn-quieto"
            onClick={() => {
              setErrori({});
              setS(statoIniziale(utente?.uid ?? null));
              setRipresa(false);
            }}
          >
            Ricomincia da capo
          </button>
        </div>
      </form>
    );
  } else if (stato.passo === 1) corpo = conForm(<PassoPerChi {...props} />);
  else if (stato.passo === 2) corpo = conForm(<PassoPersone {...props} idTitolo={idTitolo} onCambiaRegalo={() => setCatalogoAperto(true)} />);
  else if (stato.passo === 3) corpo = conForm(<PassoPartenza s={stato} idTitolo={idTitolo} onPartenza={scegliPartenza} />, false);
  else if (stato.passo === 4 && stato.partenza === "adesioni") corpo = conForm(<PassoQuota {...props} />);
  else if (stato.passo === 4 && stato.partenza === "voto")
    corpo = conForm(
      <PassoVoto {...props} onApriCatalogo={() => setCatalogoAperto(true)} onDaLink={(p) => setS((prev) => (prev ? conRegaloAlVoto(prev, p) : prev))} />,
      stato.regali.length > 0,
    );
  else if (stato.passo === 4)
    corpo = conForm(<PassoRegalo {...props} onApriCatalogo={() => setCatalogoAperto(true)} onDaLink={(p) => cambia({ partenza: "regalo", regali: [p] })} />, stato.regali.length > 0);
  else if (stato.passo === 5) corpo = conForm(<PassoRimborsi {...props} />);
  else
    corpo = (
      <div className="riepilogo">
        <PassoRiepilogo {...props} onCambia={(p) => vaiA(p, { daRiepilogo: true })} />
        {utente ? (
          <div className="avanti">
            <button
              type="button"
              className="btn btn-primario"
              disabled={occupato}
              aria-busy={occupato || undefined}
              onClick={() => {
                creando.current = true;
                void crea(stato);
              }}
            >
              Crea il regalo di gruppo
            </button>
          </div>
        ) : (
          <PassoAccesso prima={() => cambia({ creaDopoAccesso: true })} />
        )}
        {problema ? (
          <p className="errore-testo" role="alert">
            {problema}
          </p>
        ) : null}
      </div>
    );

  return (
    <>
      <BarraProcedura passo={ripresa ? { n: 1, totale: pos.totale } : pos} onIndietro={!ripresa && passoPrima(stato) ? indietro : null} onEsci={chiudi} />
      <main className="pagina wizard">
        <div className="modulo">
          <h1 ref={refTitolo} id={idTitolo} tabIndex={-1} className="t-pagina">
            {ripresa ? `Riprendi il regalo per ${stato.festeggiato.trim()}` : titolo(stato)}
          </h1>
          {corpo}
        </div>
        <Anteprima r={righe(stato, utente ? nomeDi(utente) || null : null)} />
      </main>
      {catalogoAperto ? (
        <FoglioCatalogo
          modo={stato.partenza === "voto" ? "voto" : "scelta"}
          catalogo={catalogo}
          persone={personeDivisione(stato)}
          scelti={stato.regali}
          onScegli={scegliRegalo}
          onAlterna={alternaVoto}
          onChiudi={() => setCatalogoAperto(false)}
        />
      ) : null}
      {esci ? <FoglioEsci festeggiato={stato.festeggiato} onResta={() => setEsci(false)} onEsci={() => lascia(false)} onCancella={() => lascia(true)} /> : null}
    </>
  );
}
