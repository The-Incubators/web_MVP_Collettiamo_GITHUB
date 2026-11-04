// I Reminder: i compleanni e le ricorrenze da non dimenticare. Funzioni pure, nessun DOM.
// Una ricorrenza torna ogni anno nello stesso giorno; l'anno, se c'è, serve solo a dire quanti anni compie.
// Le date sono giorno/mese/anno di calendario, senza ore: niente fusi orari di mezzo.

import { ErroreDominio } from "./operazioni";

export const TIPI_RICORRENZA = [
  { id: "compleanno", etichetta: "Compleanno", icona: "cake" },
  { id: "anniversario", etichetta: "Anniversario", icona: "favorite" },
  { id: "onomastico", etichetta: "Onomastico", icona: "celebration" },
  { id: "altro", etichetta: "Altra ricorrenza", icona: "event" },
] as const;

export type TipoRicorrenza = (typeof TIPI_RICORRENZA)[number]["id"];

/** Con quante settimane di anticipo avvisare (la notifica arriverà in un secondo momento). */
export const PREAVVISI_SETTIMANE = [1, 2, 3, 4] as const;
export const PREAVVISO_PREDEFINITO = 2;

export const MAX_NOME = 60;
export const MAX_NOTA = 200;
/** Quante ricorrenze può avere una persona: abbastanza per tutti, non abbastanza per abusarne. */
export const MAX_REMINDER = 300;

export const NOMI_MESI = [
  "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
  "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre",
] as const;

export interface Reminder {
  id: string;
  /** di chi è il compleanno, o il nome della ricorrenza */
  nome: string;
  tipo: TipoRicorrenza;
  giorno: number;
  /** da 1 a 12 */
  mese: number;
  /** l'anno di nascita o di inizio, se lo si sa */
  anno: number | null;
  preavvisoSettimane: number;
  nota: string;
}

/** Una data di calendario. */
export interface Giorno {
  anno: number;
  mese: number;
  giorno: number;
}

export const bisestile = (anno: number): boolean => (anno % 4 === 0 && anno % 100 !== 0) || anno % 400 === 0;

export function giorniNelMese(anno: number, mese: number): number {
  return [31, bisestile(anno) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mese - 1];
}

/** Il giorno di oggi nel fuso del browser. */
export function oggiLocale(adesso = new Date()): Giorno {
  return { anno: adesso.getFullYear(), mese: adesso.getMonth() + 1, giorno: adesso.getDate() };
}

const numeroGiorno = (g: Giorno): number => Date.UTC(g.anno, g.mese - 1, g.giorno) / 86_400_000;

export const giorniTra = (da: Giorno, a: Giorno): number => numeroGiorno(a) - numeroGiorno(da);

function piuGiorni(g: Giorno, n: number): Giorno {
  const d = new Date((numeroGiorno(g) + n) * 86_400_000);
  return { anno: d.getUTCFullYear(), mese: d.getUTCMonth() + 1, giorno: d.getUTCDate() };
}

/** In che giorno cade la ricorrenza in quell'anno: chi è nato il 29 febbraio, negli anni non bisestili festeggia il 28. */
export function dataNellAnno(r: Pick<Reminder, "giorno" | "mese">, anno: number): Giorno {
  return { anno, mese: r.mese, giorno: Math.min(r.giorno, giorniNelMese(anno, r.mese)) };
}

/** La prossima volta che cade, oggi compreso. */
export function prossimaData(r: Pick<Reminder, "giorno" | "mese">, oggi: Giorno): Giorno {
  const quest = dataNellAnno(r, oggi.anno);
  return giorniTra(oggi, quest) >= 0 ? quest : dataNellAnno(r, oggi.anno + 1);
}

export const giorniMancanti = (r: Pick<Reminder, "giorno" | "mese">, oggi: Giorno): number => giorniTra(oggi, prossimaData(r, oggi));

/** Il giorno in cui avvisare: le settimane di preavviso prima della prossima ricorrenza. */
export function dataAvviso(r: Pick<Reminder, "giorno" | "mese" | "preavvisoSettimane">, oggi: Giorno): Giorno {
  return piuGiorni(prossimaData(r, oggi), -7 * r.preavvisoSettimane);
}

/** Quanti anni compie (o quanti ne festeggia) in quell'anno; null se l'anno non si sa o non torna. */
export function anniCompiuti(r: Pick<Reminder, "anno">, anno: number): number | null {
  if (r.anno === null) return null;
  const n = anno - r.anno;
  return n > 0 ? n : null;
}

/** «Compie 40 anni», «40° anniversario»…; null quando l'anno non si sa. */
export function testoAnni(r: Pick<Reminder, "anno" | "tipo">, anno: number): string | null {
  const n = anniCompiuti(r, anno);
  if (n === null) return null;
  if (r.tipo === "compleanno") return n === 1 ? "Compie 1 anno" : `Compie ${n} anni`;
  if (r.tipo === "anniversario") return `${n}° anniversario`;
  return n === 1 ? "Da 1 anno" : `Da ${n} anni`;
}

export function testoMancano(giorni: number): string {
  if (giorni === 0) return "Oggi!";
  if (giorni === 1) return "Domani";
  if (giorni < 14) return `Tra ${giorni} giorni`;
  if (giorni < 60) return `Tra ${Math.floor(giorni / 7)} settimane`;
  const mesi = Math.round(giorni / 30.4);
  return mesi >= 12 ? "Tra un anno" : `Tra ${mesi} mesi`;
}

export const etichettaTipo = (tipo: TipoRicorrenza): string => TIPI_RICORRENZA.find((t) => t.id === tipo)?.etichetta ?? "Ricorrenza";

export const testoData = (r: Pick<Reminder, "giorno" | "mese">): string => `${r.giorno} ${NOMI_MESI[r.mese - 1]}`;

/** Le ricorrenze del mese, in ordine di giorno (e di nome a parità). */
export function ricorrenzeDelMese<R extends Reminder>(elenco: R[], anno: number, mese: number): { giorno: number; reminder: R }[] {
  return elenco
    .filter((r) => r.mese === mese)
    .map((r) => ({ giorno: dataNellAnno(r, anno).giorno, reminder: r }))
    .sort((a, b) => a.giorno - b.giorno || a.reminder.nome.localeCompare(b.reminder.nome, "it"));
}

/** Le prossime `n` ricorrenze da oggi, la più vicina per prima. */
export function prossimeRicorrenze<R extends Reminder>(elenco: R[], oggi: Giorno, n: number): { reminder: R; data: Giorno; giorni: number }[] {
  return elenco
    .map((reminder) => ({ reminder, data: prossimaData(reminder, oggi), giorni: giorniMancanti(reminder, oggi) }))
    .sort((a, b) => a.giorni - b.giorni || a.reminder.nome.localeCompare(b.reminder.nome, "it"))
    .slice(0, n);
}

/**
 * Le caselle del calendario di un mese, settimane da lunedì: `null` per i giorni prima del primo del mese
 * e dopo l'ultimo, così ogni riga ha sette caselle.
 */
export function caselleDelMese(anno: number, mese: number): (number | null)[] {
  const primo = new Date(Date.UTC(anno, mese - 1, 1)).getUTCDay(); // 0 = domenica
  const vuoteInizio = (primo + 6) % 7;
  const giorni = giorniNelMese(anno, mese);
  const caselle: (number | null)[] = [...Array(vuoteInizio).fill(null), ...Array.from({ length: giorni }, (_, i) => i + 1)];
  while (caselle.length % 7) caselle.push(null);
  return caselle;
}

export function meseDopo(anno: number, mese: number, passo: number): { anno: number; mese: number } {
  const n = anno * 12 + (mese - 1) + passo;
  return { anno: Math.floor(n / 12), mese: (n % 12) + 1 };
}

/**
 * Controlla e ripulisce una ricorrenza scritta da chi usa il sito (o riletta dal browser).
 * Lancia `ErroreDominio` con un messaggio da mostrare se qualcosa non va.
 */
export function validaReminder(grezzo: unknown, oggi: Giorno): Reminder {
  if (!grezzo || typeof grezzo !== "object") throw new ErroreDominio("Ricorrenza non valida.");
  const r = grezzo as Record<string, unknown>;
  const id = typeof r.id === "string" ? r.id : "";
  if (!/^[A-Za-z0-9_-]{6,40}$/.test(id)) throw new ErroreDominio("Ricorrenza non valida.");
  const nome = typeof r.nome === "string" ? r.nome.trim().replace(/\s+/g, " ") : "";
  if (!nome) throw new ErroreDominio("Scrivi per chi è, o il nome della ricorrenza.");
  if (nome.length > MAX_NOME) throw new ErroreDominio(`Il nome può avere al massimo ${MAX_NOME} caratteri.`);
  const tipo = TIPI_RICORRENZA.find((t) => t.id === r.tipo)?.id;
  if (!tipo) throw new ErroreDominio("Scegli che ricorrenza è.");
  const mese = Number(r.mese);
  if (!Number.isInteger(mese) || mese < 1 || mese > 12) throw new ErroreDominio("Scegli il mese.");
  const giorno = Number(r.giorno);
  // il 29 febbraio vale sempre: negli anni non bisestili si festeggia il 28
  if (!Number.isInteger(giorno) || giorno < 1 || giorno > giorniNelMese(2024, mese)) throw new ErroreDominio("Questo giorno non esiste in quel mese.");
  let anno: number | null = null;
  if (r.anno !== null && r.anno !== undefined && r.anno !== "") {
    anno = Number(r.anno);
    if (!Number.isInteger(anno) || anno < 1900 || anno > oggi.anno) throw new ErroreDominio(`L'anno va dal 1900 al ${oggi.anno}.`);
    if (giorno > giorniNelMese(anno, mese)) throw new ErroreDominio(`Nel ${anno} febbraio non aveva il 29.`);
  }
  const preavviso = Number(r.preavvisoSettimane);
  const preavvisoSettimane = (PREAVVISI_SETTIMANE as readonly number[]).includes(preavviso) ? preavviso : PREAVVISO_PREDEFINITO;
  const nota = typeof r.nota === "string" ? r.nota.trim() : "";
  if (nota.length > MAX_NOTA) throw new ErroreDominio(`La nota può avere al massimo ${MAX_NOTA} caratteri.`);
  return { id, nome, tipo, giorno, mese, anno, preavvisoSettimane, nota };
}

/** Rilegge un elenco salvato (nel browser): tiene solo le ricorrenze valide, senza doppioni. */
export function ripulisciElenco(grezzo: unknown, oggi: Giorno): Reminder[] {
  if (!Array.isArray(grezzo)) return [];
  const visti = new Set<string>();
  const buoni: Reminder[] = [];
  for (const x of grezzo.slice(0, MAX_REMINDER)) {
    try {
      const r = validaReminder(x, oggi);
      if (!visti.has(r.id)) {
        visti.add(r.id);
        buoni.push(r);
      }
    } catch {
      // una ricorrenza rovinata si salta, le altre restano
    }
  }
  return buoni;
}

/** Un identificativo nuovo per una ricorrenza (anche nel browser, senza account). */
export function nuovoIdReminder(casuale: () => number = Math.random): string {
  const lettere = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 16 }, () => lettere[Math.floor(casuale() * lettere.length)]).join("");
}
