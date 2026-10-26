import type { Operazione } from "../dominio/operazioni";
import type { ImpostazioniCatalogo } from "../dominio/ordineCatalogo";
import { chiaveSottocategoria } from "../dominio/regali";
import { FASCE_PREZZO, type Colletta, type Evento, type FiltriProdotti, NuovaProposta, NuovoEvento, Partecipante, Prodotto, ProdottoColletta, Proposta, Voto } from "../tipi";

export type Annulla = () => void;

/** Quello che serve per rendere una pagina lato server. */
export interface DatiLettura {
  elencaProdotti(filtri?: FiltriProdotti): Promise<Prodotto[]>;
  prodotto(slug: string): Promise<Prodotto | null>;
  colletta(slug: string): Promise<Colletta | null>;
  partecipanti(slug: string): Promise<Partecipante[]>;
  proposte(slug: string): Promise<Proposta[]>;
  voti(slug: string): Promise<Voto[]>;
}

/** Le letture del server, più la chiusura a tempo della votazione (non c'è un cron: chi apre la pagina la fa scattare). */
export interface DatiServer extends DatiLettura {
  /** Se la votazione è scaduta la chiude e ritorna la colletta aggiornata; altrimenti ritorna null. Idempotente. */
  chiudiVotazioneScaduta(slug: string): Promise<Colletta | null>;
  /** Le impostazioni dell'ordine del catalogo, se chi gestisce il sito le ha salvate. */
  impostazioniCatalogo(): Promise<ImpostazioniCatalogo | null>;
  /** Scrive le impostazioni e la posizione di ogni prodotto (slug → 1, 2, 3…). */
  salvaOrdineCatalogo(imp: ImpostazioniCatalogo, posizioni: Record<string, number>): Promise<void>;
  /** Tutti i prodotti, **compresi quelli eliminati**: solo per l'area riservata, che deve poterli ripristinare. */
  elencaProdottiPerGestione(): Promise<Prodotto[]>;
  /** Segna un prodotto come eliminato, o lo ripristina. Non tocca nient'altro del prodotto. */
  impostaProdottoEliminato(slug: string, eliminato: boolean): Promise<void>;
  /** Aggiunge un prodotto al catalogo (importazione dal backoffice). Lo slug non deve essere già usato. */
  aggiungiProdotto(p: Prodotto): Promise<void>;
}

/**
 * Tutto l'accesso ai dati del browser passa da qui. Due implementazioni intercambiabili
 * (Firestore e memoria), scelte a runtime in base alle variabili d'ambiente.
 */
export interface Dati extends DatiLettura {
  salvaUtente(u: { uid: string; nome: string; email: string | null }): Promise<void>;
  slugLibero(slug: string): Promise<boolean>;
  creaColletta(c: Colletta): Promise<void>;
  aggiornaColletta(slug: string, patch: Partial<Colletta>): Promise<void>;
  eliminaBozza(slug: string): Promise<void>;
  elencaCollette(organizzatoreUid: string): Promise<Colletta[]>;
  osservaColletta(slug: string, cb: (c: Colletta | null) => void, errore?: (e: Error) => void): Annulla;
  osservaPartecipanti(slug: string, cb: (p: Partecipante[]) => void, errore?: (e: Error) => void): Annulla;
  eventi(slug: string): Promise<Evento[]>;
  registraEvento(slug: string, e: NuovoEvento): Promise<void>;
  /** Un cambio di stato di una riga, insieme ai totali della colletta, in una transazione. */
  esegui(slug: string, pid: string, op: Operazione): Promise<void>;
  aggiungiInvitati(slug: string, nomi: string[]): Promise<void>;
  osservaProposte(slug: string, cb: (p: Proposta[]) => void, errore?: (e: Error) => void): Annulla;
  osservaVoti(slug: string, cb: (v: Voto[]) => void, errore?: (e: Error) => void): Annulla;
  /** Chi organizza imposta i regali candidati iniziali (solo in bozza): sostituisce le sue proposte. */
  impostaProposteIniziali(slug: string, prodotti: ProdottoColletta[]): Promise<void>;
  aggiungiProposta(slug: string, p: NuovaProposta): Promise<void>;
  rimuoviProposta(slug: string, propostaId: string): Promise<void>;
  /** Un voto da 1 a 5 stelle; si può cambiare finché la votazione è aperta. */
  vota(slug: string, propostaId: string, stelle: number): Promise<void>;
  /** I preferiti di chi ha un account: gli slug dei prodotti del catalogo. */
  preferiti(uid: string): Promise<string[]>;
  impostaPreferito(uid: string, prodottoSlug: string, preferito: boolean): Promise<void>;
  /** Registra che un promemoria è stato inoltrato: incrementa `solleciti` sulle righe e scrive l'evento. */
  registraSolleciti(slug: string, pid: string[], momento: string): Promise<void>;
}

/**
 * L'ordine del catalogo: quello deciso da chi gestisce il sito; i prodotti senza posizione (appena
 * importati) vengono dopo, per prezzo. Stesso ordine ovunque, area riservata compresa.
 */
export function confrontaProdotti(a: Prodotto, b: Prodotto): number {
  return (
    (a.posizione ?? Number.MAX_SAFE_INTEGER) - (b.posizione ?? Number.MAX_SAFE_INTEGER) ||
    a.prezzoCent - b.prezzoCent ||
    a.nome.localeCompare(b.nome, "it")
  );
}

/** Filtra i prodotti con le stesse regole in tutti gli adattatori. */
export function filtraProdotti(tutti: Prodotto[], filtri?: FiltriProdotti | null): Prodotto[] {
  // via JSON un argomento assente arriva come null
  const f: FiltriProdotti = filtri ?? {};
  const fascia = FASCE_PREZZO.find((x) => x.id === f.fascia);
  return tutti
    .filter((p) => p.attivo)
    // Eliminato dall'area riservata: resta nel catalogo ma non si mostra a chi visita.
    .filter((p) => !p.eliminato)
    .filter((p) => !f.per || (p.destinatari ?? []).includes(f.per))
    .filter((p) => !f.tema || (p.temi ?? []).includes(f.tema))
    .filter((p) => !f.tipo || (p.sottocategoria !== undefined && chiaveSottocategoria(p.sottocategoria) === f.tipo))
    .filter((p) => !fascia || (p.prezzoCent > fascia.minCent && p.prezzoCent <= fascia.maxCent))
    .sort(confrontaProdotti);
}
