// I controlli su una riga del file dell'agente: gli stessi di scripts/importa_catalogo.py, perché il file non è
// fidato. Si usano due volte: nel browser, per dire subito cosa non va, e sul server, che ricontrolla tutto.

import { DESTINATARI, TEMI } from "../tipi";
import type { DatiCandidato, InfoAgente } from "./tipi";

/** Le colonne obbligatorie del file Excel → il campo. */
export const COLONNE = {
  "ID prodotto": "id",
  "Nome prodotto": "nome",
  Marca: "marca",
  "Descrizione breve": "descrizione",
  "Perché è interessante": "perche",
  Uomo: "uomo",
  Donna: "donna",
  Viaggio: "viaggio",
  Tecnologia: "tecnologia",
  Arredamento: "arredamento",
  "Prezzo rilevato (EUR)": "prezzo",
  ASIN: "asin",
  "Link Amazon": "link",
  "Immagine locale": "immagine",
  "Data rilevazione": "data",
} as const;
export const COLONNE_FACOLTATIVE = { Sottocategoria: "sottocategoria" } as const;

export const ESTENSIONI_FOTO = [".webp", ".jpg", ".jpeg", ".png"] as const;

export const LIMITI = { nome: 120, marca: 60, descrizione: 400, perche: 600, sottocategoria: 60 } as const;
export const PREZZO_MIN_CENT = 100;
export const PREZZO_MAX_CENT = 100000;

/** Testo da un file non fidato: niente caratteri di controllo, spazi singoli, e il segno di diametro rotto dell'Excel (ⵁ → Ø). */
export function pulisci(testo: string): string {
  const t = [...testo].filter((c) => c === "\n" || c >= " ").join("");
  return t.replace(/ⵁ/g, "Ø").replace(/\s+/g, " ").trim();
}

function si(v: string): boolean {
  return ["sì", "si", "yes", "true", "1", "x"].includes(v.trim().toLowerCase());
}

/** Excel conta i giorni dal 30/12/1899; alcuni file hanno invece una data ISO ("2026-10-16T00:00:00.000Z"). */
export function dataExcel(valore: string): string | null {
  if (/^\d{4}-\d{2}-\d{2}/.test(valore)) {
    const d = new Date(`${valore.slice(0, 10)}T12:00:00Z`);
    return Number.isNaN(d.getTime()) ? null : valore.slice(0, 10);
  }
  const giorni = Number(valore);
  if (!Number.isFinite(giorni) || giorni < 1 || giorni > 100000) return null;
  return new Date(Date.UTC(1899, 11, 30) + Math.floor(giorni) * 86_400_000).toISOString().slice(0, 10);
}

/** I controlli comuni a browser e server su un candidato già trasformato. Ritorna gli errori (vuoto = tutto bene). */
export function erroriDati(d: DatiCandidato): string[] {
  const e: string[] = [];
  if (!/^[A-Z0-9]{10}$/.test(d.asin)) e.push("ASIN non valido");
  if (!/^(PRD-\d{3,4}|#\d{1,4})$/.test(d.idOrigine)) e.push(`ID non valido (${d.idOrigine || "vuoto"})`);
  if (!d.link.startsWith(`https://www.amazon.it/dp/${d.asin}`)) e.push("il link non punta ad Amazon.it con lo stesso ASIN");
  if (!Number.isInteger(d.prezzoCent) || d.prezzoCent < PREZZO_MIN_CENT || d.prezzoCent > PREZZO_MAX_CENT) e.push("prezzo non valido o fuori scala (1–1000 €)");
  if (!d.nome) e.push("nome vuoto");
  if (!d.descrizione) e.push("descrizione vuota");
  for (const [campo, max] of Object.entries(LIMITI)) {
    const v = d[campo as keyof typeof LIMITI];
    if (typeof v === "string" && v.length > max) e.push(`${campo} troppo lungo (max ${max} caratteri)`);
  }
  if (!d.destinatari.every((x) => (DESTINATARI as readonly string[]).includes(x))) e.push("destinatari non validi");
  if (!d.temi.every((x) => (TEMI as readonly string[]).includes(x))) e.push("categorie non valide");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.rilevatoIl)) e.push("data di rilevazione non valida");
  return e;
}

/**
 * Le informazioni in più del formato JSON, ripulite: solo testi brevi, elenchi corti, fonti https. Arrivano da
 * un file esterno (e poi dal browser), quindi si tiene solo quello che ha la forma attesa.
 */
export function pulisciInfoAgente(x: unknown): InfoAgente | undefined {
  if (!x || typeof x !== "object") return undefined;
  const o = x as Record<string, unknown>;
  const testo = (v: unknown, max = 200) => (typeof v === "string" ? pulisci(v).slice(0, max) : "");
  const elenco = (v: unknown) => (Array.isArray(v) ? v.map((t) => testo(t)).filter(Boolean).slice(0, 8) : []);
  const fonti = Array.isArray(o.fonti)
    ? o.fonti
        .map((f) => (f && typeof f === "object" ? (f as Record<string, unknown>) : {}))
        .map((f) => ({ url: testo(f.url, 300), informazioni: testo(f.informazioni ?? f.informazioni_supportate) }))
        .filter((f) => /^https:\/\/[^\s]+$/.test(f.url))
        .slice(0, 5)
    : [];
  const info: InfoAgente = {
    categoria: testo(o.categoria, 80),
    sottocategoria: testo(o.sottocategoria, 80),
    modello: testo(o.modello, 120),
    variante: testo(o.variante, 120),
    destinatari: elenco(o.destinatari),
    limiti: elenco(o.limiti),
    statoVerifica: testo(o.statoVerifica ?? o.stato_verifica, 60),
    verificheMancanti: elenco(o.verificheMancanti ?? o.verifiche_mancanti),
    disponibilita: testo(o.disponibilita, 120),
    fonti,
  };
  // via i campi vuoti, così il documento resta pulito
  const pieno = Object.fromEntries(Object.entries(info).filter(([, v]) => (Array.isArray(v) ? v.length > 0 : v !== "")));
  return Object.keys(pieno).length ? (pieno as InfoAgente) : undefined;
}

/** La categoria del pacchetto («Prodotti tecnologici») → i temi del catalogo che si riconoscono. */
export function temiDaCategoria(categoria: string): string[] {
  const c = categoria.toLowerCase();
  return [
    ...(/tecnolog/.test(c) ? ["tecnologia"] : []),
    ...(/viagg/.test(c) ? ["viaggio"] : []),
    ...(/arred|casa|design/.test(c) ? ["arredamento"] : []),
  ];
}

export type EsitoRiga =
  | { ok: true; dati: DatiCandidato; immagine: string }
  | { ok: false; id: string; errori: string[] };

/** Le colonne obbligatorie che mancano nel file (si controlla una volta, sull'intestazione). */
export function colonneMancanti(righe: Record<string, string>[]): string[] {
  const presenti = new Set(righe.flatMap((r) => Object.keys(r)));
  return Object.keys(COLONNE).filter((c) => !presenti.has(c));
}

/** Una riga del foglio → candidato, oppure l'elenco di cosa non va. `immagine` è il nome del file dentro immagini/. */
export function rigaInCandidato(riga: Record<string, string>): EsitoRiga {
  const campo = (colonna: string) => pulisci(riga[colonna] ?? "");
  const id = campo("ID prodotto");
  const asin = campo("ASIN").toUpperCase();
  const prezzo = Number(campo("Prezzo rilevato (EUR)").replace(",", "."));
  const data = dataExcel(campo("Data rilevazione"));
  const sottocategoria = campo("Sottocategoria");
  const dati: DatiCandidato = {
    asin,
    idOrigine: id,
    nome: campo("Nome prodotto"),
    marca: campo("Marca") || "Generico",
    descrizione: campo("Descrizione breve"),
    perche: campo("Perché è interessante"),
    prezzoCent: Number.isFinite(prezzo) ? Math.round(prezzo * 100) : NaN,
    link: campo("Link Amazon"),
    destinatari: (["uomo", "donna"] as const).filter((x) => si(riga[x === "uomo" ? "Uomo" : "Donna"] ?? "")),
    temi: (["viaggio", "tecnologia", "arredamento"] as const).filter((x) => si(riga[x[0].toUpperCase() + x.slice(1)] ?? "")),
    ...(sottocategoria ? { sottocategoria } : {}),
    rilevatoIl: data ?? "",
  };
  const errori = erroriDati(dati);

  // L'immagine deve stare in immagini/ con un'estensione da foto: niente percorsi che escono dalla cartella.
  const percorso = campo("Immagine locale").replace(/\\/g, "/");
  const parti = percorso.split("/");
  const nomeFile = parti[1] ?? "";
  const estensione = nomeFile.includes(".") ? nomeFile.slice(nomeFile.lastIndexOf(".")).toLowerCase() : "";
  if (parti.length !== 2 || parti[0] !== "immagini" || !/^[\w.-]+$/.test(nomeFile) || !(ESTENSIONI_FOTO as readonly string[]).includes(estensione)) {
    errori.push(`percorso immagine non valido (${percorso || "vuoto"})`);
  }
  return errori.length ? { ok: false, id: id || asin || "?", errori } : { ok: true, dati, immagine: nomeFile };
}

/**
 * Il server non si fida di quello che arriva dal browser: rifà la forma e i controlli.
 * Ritorna il candidato ripulito, o un messaggio d'errore.
 */
export function datiDaRichiesta(x: unknown): { ok: true; dati: DatiCandidato } | { ok: false; errore: string } {
  if (!x || typeof x !== "object") return { ok: false, errore: "Dati mancanti." };
  const o = x as Record<string, unknown>;
  const testo = (k: string) => (typeof o[k] === "string" ? pulisci(o[k] as string) : "");
  const elenco = (k: string) => (Array.isArray(o[k]) ? (o[k] as unknown[]).filter((v): v is string => typeof v === "string") : []);
  const sottocategoria = testo("sottocategoria");
  const dati: DatiCandidato = {
    asin: testo("asin").toUpperCase(),
    idOrigine: testo("idOrigine"),
    nome: testo("nome"),
    marca: testo("marca") || "Generico",
    descrizione: testo("descrizione"),
    perche: testo("perche"),
    prezzoCent: typeof o.prezzoCent === "number" ? o.prezzoCent : NaN,
    link: testo("link"),
    destinatari: [...new Set(elenco("destinatari"))],
    temi: [...new Set(elenco("temi"))],
    ...(sottocategoria ? { sottocategoria } : {}),
    rilevatoIl: testo("rilevatoIl"),
  };
  const agente = pulisciInfoAgente(o.agente);
  if (agente) dati.agente = agente;
  const errori = erroriDati(dati);
  return errori.length ? { ok: false, errore: errori.join("; ") } : { ok: true, dati };
}

/**
 * Un prodotto del formato JSON dell'agente (catalogo.json → «prodotti») → candidato. `immagine` è il percorso
 * della foto relativo alla cartella del catalogo (prodotti/<ASIN>/immagini/…).
 *
 * - descrizione = «elemento_distintivo», perché = «motivo_selezione»;
 * - i temi vengono dalla categoria del pacchetto; Uomo/Donna non ci sono e partono entrambi accesi (si
 *   correggono in revisione); la sottocategoria dell'agente non diventa quella del catalogo, che nel sito vuol
 *   dire «Design», ma resta fra le informazioni dell'agente.
 */
export function prodottoJsonInCandidato(x: unknown, categoria: string): EsitoRiga {
  if (!x || typeof x !== "object") return { ok: false, id: "?", errori: ["voce non valida"] };
  const o = x as Record<string, unknown>;
  const testo = (v: unknown) => (typeof v === "string" ? pulisci(v) : "");
  const asin = testo(o.asin).toUpperCase();
  const ordine = typeof o.ordine_editoriale === "number" && Number.isInteger(o.ordine_editoriale) ? o.ordine_editoriale : null;
  const prezzo = typeof o.prezzo_rilevato === "number" ? o.prezzo_rilevato : NaN;
  const dati: DatiCandidato = {
    asin,
    idOrigine: ordine !== null && ordine >= 0 && ordine < 10000 ? `#${String(ordine).padStart(3, "0")}` : "",
    nome: testo(o.nome),
    marca: testo(o.marca) || "Generico",
    descrizione: testo(o.elemento_distintivo),
    perche: testo(o.motivo_selezione),
    prezzoCent: Number.isFinite(prezzo) ? Math.round(prezzo * 100) : NaN,
    link: testo(o.url_amazon),
    destinatari: ["uomo", "donna"],
    temi: temiDaCategoria(categoria),
    rilevatoIl: /^\d{4}-\d{2}-\d{2}$/.test(testo(o.rilevato_il)) ? testo(o.rilevato_il) : "",
  };
  const agente = pulisciInfoAgente({ ...o, categoria });
  if (agente) dati.agente = agente;

  const errori = erroriDati(dati);
  if (o.valuta !== undefined && o.valuta !== "EUR") errori.push(`valuta diversa dall'euro (${String(o.valuta)})`);
  const immagine = testo(o.immagine_locale).replace(/\\/g, "/");
  // l'ASIN entra nell'espressione solo se è valido (altrimenti potrebbe contenere caratteri speciali)
  const asinValido = /^[A-Z0-9]{10}$/.test(asin);
  if (!asinValido || !new RegExp(`^prodotti/${asin}/immagini/[\\w.-]+\\.(jpg|jpeg|png|webp)$`, "i").test(immagine) || immagine.includes("..")) {
    errori.push(`percorso immagine non valido (${immagine || "vuoto"})`);
  }
  return errori.length ? { ok: false, id: asin || dati.idOrigine || "?", errori } : { ok: true, dati, immagine };
}
