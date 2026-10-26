// Da candidato approvato a prodotto del catalogo, i controlli sulla decisione, e l'esportazione delle
// decisioni per l'agente. Funzioni pure: le usano le rotte del backoffice e i test.

import { affiliaLink } from "../dominio/amazon";
import { CONSEGNA_STIMATA_GIORNI, iconaPerTemi } from "../dati/catalogo-dati";
import { FASCE_ETA, type FasciaEta } from "../dati/eta-prodotti";
import { DESTINATARI, TEMI, type Prodotto } from "../tipi";
import { pulisci } from "./valida";
import { MOTIVI, type Candidato, type Esito } from "./tipi";

export const MAX_NOTA = 1000;

/** "Lampada LED da tavolo" → "lampada-led-da-tavolo", come lo script di importazione. */
export function slugDaNome(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
}

/** Uno slug libero: quello del nome, o col codice del prodotto in coda se è già preso. */
export function slugUnico(nome: string, id: string, esistenti: Set<string>): string {
  const base = slugDaNome(nome) || id.toLowerCase();
  if (!esistenti.has(base)) return base;
  const conId = `${base}-${id.toLowerCase()}`;
  if (!esistenti.has(conId)) return conId;
  let n = 2;
  while (esistenti.has(`${conId}-${n}`)) n++;
  return `${conId}-${n}`;
}

/** Il primo codice PRD-nnn dopo il più alto del catalogo. */
export function prossimoId(idEsistenti: (string | undefined)[]): string {
  const max = idEsistenti.reduce((m, id) => {
    const n = /^PRD-(\d+)$/.exec(id ?? "")?.[1];
    return n ? Math.max(m, Number(n)) : m;
  }, 0);
  return `PRD-${String(max + 1).padStart(3, "0")}`;
}

export interface DatiImportazione {
  destinatari: string[];
  temi: string[];
  sottocategoria?: string;
  eta: FasciaEta[];
  stelle: number;
}

export type DecisioneRichiesta =
  | { esito: "importato"; motivi: string[]; nota: string; dati: DatiImportazione }
  | { esito: "scartato"; motivi: string[]; nota: string }
  | { esito: "riapri" };

/** Il corpo della richiesta di decisione, controllato. Almeno un motivo rapido; per importare, almeno una fascia d'età. */
export function decisioneDaRichiesta(x: unknown): { ok: true; valore: DecisioneRichiesta } | { ok: false; errore: string } {
  if (!x || typeof x !== "object") return { ok: false, errore: "Richiesta non valida." };
  const o = x as Record<string, unknown>;
  if (o.esito === "riapri") return { ok: true, valore: { esito: "riapri" } };
  if (o.esito !== "importato" && o.esito !== "scartato") return { ok: false, errore: "Esito non valido." };
  const esito: Esito = o.esito;
  const elenco = (v: unknown) => (Array.isArray(v) ? [...new Set(v.filter((s): s is string => typeof s === "string"))] : []);
  const motivi = elenco(o.motivi);
  if (motivi.length === 0) return { ok: false, errore: "Scegli almeno un motivo." };
  if (!motivi.every((m) => MOTIVI[esito].includes(m))) return { ok: false, errore: "Motivo non riconosciuto." };
  const nota = typeof o.nota === "string" ? o.nota.replace(/[\u0000-\u0009\u000b-\u001f]/g, "").trim() : "";
  if (nota.length > MAX_NOTA) return { ok: false, errore: `La nota è troppo lunga (max ${MAX_NOTA} caratteri).` };
  if (esito === "scartato") return { ok: true, valore: { esito, motivi, nota } };

  const destinatari = elenco(o.destinatari);
  const temi = elenco(o.temi);
  const eta = elenco(o.eta);
  const sottocategoria = typeof o.sottocategoria === "string" ? pulisci(o.sottocategoria) : "";
  const stelle = o.stelle;
  if (!destinatari.every((d) => (DESTINATARI as readonly string[]).includes(d))) return { ok: false, errore: "Destinatari non validi." };
  if (!temi.every((t) => (TEMI as readonly string[]).includes(t))) return { ok: false, errore: "Categorie non valide." };
  if (eta.length === 0) return { ok: false, errore: "Scegli almeno una fascia d'età." };
  if (!eta.every((e) => FASCE_ETA.some((f) => f.id === e))) return { ok: false, errore: "Fascia d'età non valida." };
  if (sottocategoria.length > 60) return { ok: false, errore: "Sottocategoria troppo lunga." };
  if (typeof stelle !== "number" || !Number.isInteger(stelle) || stelle < 1 || stelle > 5) return { ok: false, errore: "Le stelle vanno da 1 a 5." };
  return {
    ok: true,
    valore: { esito, motivi, nota, dati: { destinatari, temi, ...(sottocategoria ? { sottocategoria } : {}), eta: eta as FasciaEta[], stelle } },
  };
}

/** Il prodotto da scrivere nel catalogo. Il link diventa quello affiliato, come per tutto il catalogo. */
export function prodottoDaCandidato(c: Candidato, d: DatiImportazione, id: string, slug: string): Prodotto {
  const esito = affiliaLink(c.link, c.asin);
  if (esito.stato !== "convertito" && esito.stato !== "invariato" && esito.stato !== "creato") throw new Error(`${c.asin}: link non convertibile`);
  const icona = iconaPerTemi(d.temi);
  return {
    slug,
    id,
    nome: c.nome,
    marca: c.marca,
    prezzoCent: c.prezzoCent,
    categoria: icona,
    occasioni: [],
    descrizione: c.descrizione,
    perche: c.perche,
    destinatari: d.destinatari,
    temi: d.temi,
    asin: c.asin,
    rilevatoIl: c.rilevatoIl,
    ...(d.sottocategoria ? { sottocategoria: d.sottocategoria } : {}),
    consegnaGiorni: CONSEGNA_STIMATA_GIORNI,
    urlEsterno: esito.url,
    immagine: { seme: id, icona, foto: c.foto },
    attivo: true,
    eta: d.eta,
    importato: true,
  };
}

/** Le colonne dell'esportazione, nell'ordine del CSV. */
const COLONNE_EXPORT = [
  "asin",
  "esito",
  "motivi",
  "nota",
  "deciso_il",
  "deciso_da",
  "nome",
  "marca",
  "prezzo_eur",
  "link",
  "categorie",
  "destinatari",
  "sottocategoria",
  "eta",
  "stelle",
  "descrizione",
  "perche",
  "id_agente",
  "id_catalogo",
  "lotto",
  "rilevato_il",
] as const;

type RigaExport = Record<(typeof COLONNE_EXPORT)[number], string | number | string[] | null>;

/** Una decisione come riga dell'esportazione: tutto quello che serve all'agente per imparare, senza la foto. */
export function rigaExport(c: Candidato): RigaExport | null {
  const d = c.decisione;
  if (!d || c.stato === "in_revisione") return null;
  return {
    asin: c.asin,
    esito: d.esito === "importato" ? "ottimo" : "sbagliato",
    motivi: d.motivi,
    nota: d.nota,
    deciso_il: new Date(d.il).toISOString(),
    deciso_da: d.da,
    nome: c.nome,
    marca: c.marca,
    prezzo_eur: c.prezzoCent / 100,
    link: c.link,
    // per gli importati, i valori decisi in revisione; per gli scartati, quelli proposti dall'agente
    categorie: d.temi ?? c.temi,
    destinatari: d.destinatari ?? c.destinatari,
    sottocategoria: (d.esito === "importato" ? d.sottocategoria : c.sottocategoria) ?? null,
    eta: d.eta ?? null,
    stelle: d.stelle ?? null,
    descrizione: c.descrizione,
    perche: c.perche,
    id_agente: c.idOrigine,
    id_catalogo: d.id ?? null,
    lotto: c.lotto,
    rilevato_il: c.rilevatoIl,
  };
}

/**
 * Una cella CSV: tra virgolette se serve, e con un apostrofo davanti ai testi che Excel prenderebbe per una
 * formula (=, +, -, @): i testi arrivano da un file esterno e non devono eseguire niente all'apertura.
 */
function cella(v: RigaExport[keyof RigaExport]): string {
  let t = v === null ? "" : Array.isArray(v) ? v.join(" | ") : String(v);
  if (typeof v === "string" && /^[=+\-@\t\r]/.test(t)) t = `'${t}`;
  return /[",\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
}

/** CSV con intestazione, separato da virgole, con il BOM perché Excel legga bene gli accenti. */
export function csvDecisioni(candidati: Candidato[]): string {
  const righe = candidati.map(rigaExport).filter((r): r is RigaExport => r !== null);
  return "﻿" + [COLONNE_EXPORT.join(","), ...righe.map((r) => COLONNE_EXPORT.map((k) => cella(r[k])).join(","))].join("\r\n") + "\r\n";
}

export function jsonDecisioni(candidati: Candidato[]): string {
  const righe = candidati.map(rigaExport).filter((r): r is RigaExport => r !== null);
  return JSON.stringify({ esportatoIl: new Date().toISOString(), totale: righe.length, decisioni: righe }, null, 2);
}
