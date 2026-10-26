// Adattatore in memoria: gira nel processo del server, è condiviso da tutte le richieste ed è perso
// al riavvio. Serve a provare e dimostrare il prototipo prima che Firebase esista.
// Il browser lo raggiunge tramite /api/memoria (vedi memoria-client.ts).

import {
  creaInvitati,
  eseguiOperazione,
  eOperazioneOrganizzatore,
  ErroreDominio,
  type Operazione,
  type Risultato,
} from "../dominio/operazioni";
import type { ImpostazioniCatalogo } from "../dominio/ordineCatalogo";
import { chiusuraVotazione, idVoto, MAX_PROPOSTE_PER_PERSONA, proposteDi, votazioneScaduta } from "../dominio/votazione";
import type { Colletta, Evento, FiltriProdotti, NuovaProposta, NuovoEvento, Partecipante, Prodotto, ProdottoColletta, Proposta, Voto } from "../tipi";
import { CATALOGO } from "./catalogo-dati";
import { costruisciDemo, SLUG_DEMO } from "./demo";
import { confrontaProdotti, filtraProdotti, type Annulla, type Dati, type DatiServer } from "./tipi";

interface Archivio {
  prodotti: Map<string, Prodotto>;
  collette: Map<string, Colletta>;
  partecipanti: Map<string, Map<string, Partecipante>>;
  eventi: Map<string, Evento[]>;
  proposte: Map<string, Map<string, Proposta>>;
  voti: Map<string, Map<string, Voto>>;
  preferiti: Map<string, Set<string>>;
  impostazioniCatalogo: ImpostazioniCatalogo | null;
  ascoltatori: Set<() => void>;
}

const globale = globalThis as typeof globalThis & { __colletta_archivio?: Archivio };

function archivio(): Archivio {
  if (!globale.__colletta_archivio) {
    const a: Archivio = {
      prodotti: new Map(CATALOGO.map((p) => [p.slug, p])),
      collette: new Map(),
      partecipanti: new Map(),
      eventi: new Map(),
      proposte: new Map(),
      voti: new Map(),
      preferiti: new Map(),
      impostazioniCatalogo: null,
      ascoltatori: new Set(),
    };
    const demo = costruisciDemo();
    a.collette.set(SLUG_DEMO, demo.colletta);
    a.partecipanti.set(SLUG_DEMO, new Map(demo.partecipanti.map((p) => [p.id, p])));
    a.eventi.set(SLUG_DEMO, demo.eventi);
    globale.__colletta_archivio = a;
  }
  return globale.__colletta_archivio;
}

const copia = <T>(v: T): T => structuredClone(v);
const nuovoId = () => globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 20);

function notifica(a: Archivio) {
  for (const l of [...a.ascoltatori]) l();
}

function sololeggibile(slug: string) {
  if (slug === SLUG_DEMO) throw new ErroreDominio("Questa è la colletta dimostrativa: si può guardare, non modificare.");
}

function colletta(a: Archivio, slug: string): Colletta {
  const c = a.collette.get(slug);
  if (!c) throw new ErroreDominio("Questa colletta non esiste.");
  return c;
}

function soloOrganizzatore(c: Colletta, uid: string) {
  if (c.organizzatoreUid !== uid) throw new ErroreDominio("Solo chi organizza può farlo.");
}

function applica(a: Archivio, slug: string, r: Risultato, uid: string) {
  const c = colletta(a, slug);
  const righe = a.partecipanti.get(slug) ?? new Map<string, Partecipante>();
  for (const { id, valore } of r.righe) {
    if (valore === null) righe.delete(id);
    else righe.set(id, valore);
  }
  a.partecipanti.set(slug, righe);
  a.collette.set(slug, { ...c, ...r.colletta });
  const eventi = a.eventi.get(slug) ?? [];
  const ts = Date.now();
  for (const e of r.eventi) eventi.push({ ...e, id: nuovoId(), ts, uidAnonimo: e.uidAnonimo ?? uid });
  a.eventi.set(slug, eventi);
  notifica(a);
}

/** Chiude la votazione se è scaduta (stessa logica del server Firestore). */
export function chiudiScadutaMemoria(slug: string): Colletta | null {
  const a = archivio();
  const c = a.collette.get(slug);
  const ora = Date.now();
  if (!c || !votazioneScaduta(c, ora)) return null;
  const patch = chiusuraVotazione(c, [...(a.proposte.get(slug)?.values() ?? [])], [...(a.voti.get(slug)?.values() ?? [])], ora);
  if (!patch) return null;
  const nuova = { ...c, ...patch };
  a.collette.set(slug, nuova);
  notifica(a);
  return structuredClone(nuova);
}

export function creaDatiServerMemoria(): DatiServer {
  const d = creaDatiMemoria("server");
  const a = archivio();
  return {
    ...d,
    chiudiVotazioneScaduta: async (slug) => chiudiScadutaMemoria(slug),
    impostazioniCatalogo: async () => (a.impostazioniCatalogo ? copia(a.impostazioniCatalogo) : null),
    elencaProdottiPerGestione: async () => [...a.prodotti.values()].filter((p) => p.attivo).sort(confrontaProdotti).map(copia),
    impostaProdottoEliminato: async (slug, eliminato) => {
      const p = a.prodotti.get(slug);
      if (p) a.prodotti.set(slug, { ...p, eliminato });
    },
    aggiungiProdotto: async (p) => {
      if (a.prodotti.has(p.slug)) throw new Error(`Slug già usato: ${p.slug}`);
      a.prodotti.set(p.slug, copia(p));
    },
    salvaOrdineCatalogo: async (imp, posizioni) => {
      a.impostazioniCatalogo = copia(imp);
      for (const [slug, posizione] of Object.entries(posizioni)) {
        const prodotto = a.prodotti.get(slug);
        if (prodotto) a.prodotti.set(slug, { ...prodotto, posizione });
      }
    },
  };
}

/** `uid` è l'identità di chi chiama (nel prototipo è dichiarata dal client: i controlli sono dimostrativi). */
export function creaDatiMemoria(uid: string): Dati {
  const a = archivio();

  const osserva = <T>(leggi: () => T, cb: (v: T) => void): Annulla => {
    let ultimo = "";
    const emetti = () => {
      const v = leggi();
      const s = JSON.stringify(v);
      if (s !== ultimo) {
        ultimo = s;
        cb(copia(v));
      }
    };
    a.ascoltatori.add(emetti);
    emetti();
    return () => a.ascoltatori.delete(emetti);
  };

  const elenco = (slug: string): Partecipante[] => [...(a.partecipanti.get(slug)?.values() ?? [])].map(copia);

  return {
    async elencaProdotti(filtri?: FiltriProdotti) {
      return filtraProdotti([...a.prodotti.values()], filtri).map(copia);
    },
    async prodotto(slug) {
      const p = a.prodotti.get(slug);
      return p && !p.eliminato ? copia(p) : null;
    },
    async colletta(slug) {
      const c = a.collette.get(slug);
      return c ? copia(c) : null;
    },
    async partecipanti(slug) {
      return elenco(slug);
    },
    async proposte(slug) {
      return [...(a.proposte.get(slug)?.values() ?? [])].map(copia);
    },
    async voti(slug) {
      return [...(a.voti.get(slug)?.values() ?? [])].map(copia);
    },

    async preferiti(utente) {
      if (utente !== uid) throw new ErroreDominio("Non puoi leggere i preferiti di altri.");
      return [...(a.preferiti.get(uid) ?? [])];
    },
    async impostaPreferito(utente, prodottoSlug, preferito) {
      if (utente !== uid) throw new ErroreDominio("Non puoi modificare i preferiti di altri.");
      if (!a.prodotti.has(prodottoSlug)) throw new ErroreDominio("Prodotto non trovato.");
      const insieme = a.preferiti.get(uid) ?? new Set<string>();
      if (preferito) insieme.add(prodottoSlug);
      else insieme.delete(prodottoSlug);
      a.preferiti.set(uid, insieme);
    },

    async salvaUtente() {
      /* nel prototipo in memoria non serve conservare gli utenti */
    },
    async slugLibero(slug) {
      return !a.collette.has(slug);
    },
    async creaColletta(c) {
      if (c.organizzatoreUid !== uid) throw new ErroreDominio("Non puoi creare una colletta per un altro.");
      if (a.collette.has(c.slug)) throw new ErroreDominio("Questo link esiste già.");
      if (c.totaleConfermatoCent !== 0 || c.nConfermati !== 0) throw new ErroreDominio("Una colletta nuova parte da zero.");
      a.collette.set(c.slug, copia(c));
      notifica(a);
    },
    async aggiornaColletta(slug, patch) {
      sololeggibile(slug);
      const c = colletta(a, slug);
      soloOrganizzatore(c, uid);
      a.collette.set(slug, { ...c, ...copia(patch), organizzatoreUid: c.organizzatoreUid, aggiornatoIl: Date.now() });
      notifica(a);
    },
    async eliminaBozza(slug) {
      sololeggibile(slug);
      const c = colletta(a, slug);
      soloOrganizzatore(c, uid);
      if (c.stato !== "bozza") throw new ErroreDominio("Si possono eliminare solo le bozze.");
      a.collette.delete(slug);
      a.partecipanti.delete(slug);
      a.eventi.delete(slug);
      notifica(a);
    },
    async elencaCollette(organizzatoreUid) {
      if (organizzatoreUid !== uid) throw new ErroreDominio("Non puoi elencare le collette di altri.");
      return [...a.collette.values()]
        .filter((c) => c.organizzatoreUid === organizzatoreUid)
        .sort((x, y) => y.creatoIl - x.creatoIl)
        .slice(0, 50)
        .map(copia);
    },
    osservaColletta(slug, cb) {
      return osserva(() => a.collette.get(slug) ?? null, cb);
    },
    osservaPartecipanti(slug, cb) {
      return osserva(() => elenco(slug), cb);
    },
    osservaProposte(slug, cb) {
      return osserva(() => [...(a.proposte.get(slug)?.values() ?? [])], cb);
    },
    osservaVoti(slug, cb) {
      return osserva(() => [...(a.voti.get(slug)?.values() ?? [])], cb);
    },
    async impostaProposteIniziali(slug, prodotti: ProdottoColletta[]) {
      const c = colletta(a, slug);
      soloOrganizzatore(c, uid);
      if (c.stato !== "bozza") throw new ErroreDominio("Le proposte iniziali si impostano in bozza.");
      const mappa = a.proposte.get(slug) ?? new Map<string, Proposta>();
      for (const [id, p] of mappa) if (p.daOrganizzatore) mappa.delete(id);
      const base = Date.now();
      prodotti.forEach((prodotto, i) => {
        const id = nuovoId();
        mappa.set(id, { id, prodotto: copia(prodotto), daOrganizzatore: true, autoreUid: uid, autoreNome: c.organizzatoreNome, creatoIl: base + i });
      });
      a.proposte.set(slug, mappa);
      notifica(a);
    },
    async aggiungiProposta(slug, p: NuovaProposta) {
      sololeggibile(slug);
      const c = colletta(a, slug);
      const v = c.votazione;
      const ora = Date.now();
      if (c.stato !== "aperta" || !v || v.chiusa || votazioneScaduta(c, ora)) throw new ErroreDominio("La votazione è chiusa.");
      const organizzatore = c.organizzatoreUid === uid;
      if (!organizzatore && !v.consentiProposte) throw new ErroreDominio("Chi organizza ha chiuso le proposte.");
      const mappa = a.proposte.get(slug) ?? new Map<string, Proposta>();
      if (!organizzatore && proposteDi([...mappa.values()], uid) >= MAX_PROPOSTE_PER_PERSONA) {
        throw new ErroreDominio(`Puoi proporre al massimo ${MAX_PROPOSTE_PER_PERSONA} regali.`);
      }
      const nome = p.autoreNome.replace(/\s+/g, " ").trim().slice(0, 40);
      if (!nome) throw new ErroreDominio("Scrivi il tuo nome.");
      if (!p.prodotto.nome.trim() || !(p.prodotto.prezzoCent > 0)) throw new ErroreDominio("Mancano il nome o il prezzo del regalo.");
      const id = nuovoId();
      mappa.set(id, { id, prodotto: copia(p.prodotto), daOrganizzatore: organizzatore, autoreUid: uid, autoreNome: nome, creatoIl: ora });
      a.proposte.set(slug, mappa);
      notifica(a);
    },
    async rimuoviProposta(slug, propostaId) {
      sololeggibile(slug);
      const c = colletta(a, slug);
      const mappa = a.proposte.get(slug);
      const p = mappa?.get(propostaId);
      if (!mappa || !p) return;
      const aperta = !!c.votazione && !c.votazione.chiusa;
      if (c.organizzatoreUid !== uid && !(p.autoreUid === uid && aperta)) throw new ErroreDominio("Non puoi rimuovere questa proposta.");
      if (c.votazione?.chiusa) throw new ErroreDominio("La votazione è chiusa.");
      mappa.delete(propostaId);
      const voti = a.voti.get(slug);
      for (const [k, v] of voti ?? []) if (v.propostaId === propostaId) voti?.delete(k);
      notifica(a);
    },
    async vota(slug, propostaId, stelle) {
      sololeggibile(slug);
      const c = colletta(a, slug);
      const v = c.votazione;
      if (c.stato !== "aperta" || !v || v.chiusa || votazioneScaduta(c, Date.now())) throw new ErroreDominio("La votazione è chiusa.");
      if (!Number.isInteger(stelle) || stelle < 1 || stelle > 5) throw new ErroreDominio("Il voto va da 1 a 5 stelle.");
      if (!a.proposte.get(slug)?.has(propostaId)) throw new ErroreDominio("Questa proposta non c'è più.");
      const mappa = a.voti.get(slug) ?? new Map<string, Voto>();
      const id = idVoto(uid, propostaId);
      mappa.set(id, { id, propostaId, uid, stelle, ts: Date.now() });
      a.voti.set(slug, mappa);
      notifica(a);
    },
    async eventi(slug) {
      soloOrganizzatore(colletta(a, slug), uid);
      return (a.eventi.get(slug) ?? []).map(copia);
    },
    async registraEvento(slug, e: NuovoEvento) {
      if (slug === SLUG_DEMO) return;
      colletta(a, slug);
      const lista = a.eventi.get(slug) ?? [];
      lista.push({ ...e, id: nuovoId(), ts: Date.now() });
      a.eventi.set(slug, lista);
    },

    async esegui(slug, pid, op: Operazione) {
      sololeggibile(slug);
      const c = colletta(a, slug);
      // Come le regole di sicurezza: le operazioni dell'organizzatore le fa solo lui.
      if (eOperazioneOrganizzatore(op)) soloOrganizzatore(c, uid);
      const righe = a.partecipanti.get(slug);
      const riga = righe?.get(pid) ?? null;
      const causaliAltre = [...(righe?.values() ?? [])].filter((r) => r.id !== pid).map((r) => r.causale);
      const r = eseguiOperazione(op, { colletta: copia(c), pid, riga: riga ? copia(riga) : null, causaliAltre, uid, ora: Date.now() });
      applica(a, slug, r, uid);
    },
    async aggiungiInvitati(slug, nomi) {
      sololeggibile(slug);
      const c = colletta(a, slug);
      soloOrganizzatore(c, uid);
      const causali = elenco(slug).map((r) => r.causale);
      applica(a, slug, creaInvitati(copia(c), nomi, causali, Date.now(), nuovoId), uid);
    },
    async registraSolleciti(slug, pid, momento) {
      sololeggibile(slug);
      const c = colletta(a, slug);
      soloOrganizzatore(c, uid);
      const righe = a.partecipanti.get(slug);
      for (const id of pid) {
        const r = righe?.get(id);
        if (r) righe?.set(id, { ...r, solleciti: r.solleciti + 1 });
      }
      const lista = a.eventi.get(slug) ?? [];
      lista.push({ id: nuovoId(), tipo: "sollecito_preparato", uidAnonimo: null, partecipanteId: null, meta: { momento, destinatari: pid.length }, ts: Date.now() });
      a.eventi.set(slug, lista);
      notifica(a);
    },
  };
}
