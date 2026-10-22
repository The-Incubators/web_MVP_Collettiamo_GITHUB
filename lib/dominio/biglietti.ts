// Regole pure del biglietto di auguri: link, testo del messaggio, dati del passo 2, caratteri, vista pubblica.
// Niente Firebase qui: le usano le rotte server, l'interfaccia e i test.

import { confrontaGiorni, giornoDaIso, giornoRoma, istanteNelFuso, fusoValido } from "./date";
import type { Biglietto, BigliettoPubblico, Firma, StileFirma } from "../tipi";

// ---------- Link (slug) ----------

export const MAX_NOME_BIGLIETTO = 100;

/** "Compleanno dei 30 di Nicòla!" → "compleanno-dei-30-di-nicola" */
const TRASLITTERA: Record<string, string> = { ø: "o", Ø: "o", æ: "ae", Æ: "ae", œ: "oe", Œ: "oe", ß: "ss", ł: "l", Ł: "l", đ: "d", Đ: "d", þ: "th" };

export function slugDaNome(nome: string): string {
  return nome
    .replace(/[øØæÆœŒßłŁđĐþ]/g, (c) => TRASLITTERA[c] ?? c)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

export function slugBigliettoValido(slug: string): boolean {
  return slug.length >= 3 && slug.length <= 80 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

/** Il primo slug libero con un numero in fondo: base-2, base-3… */
export async function suggerisciSlug(base: string, occupato: (s: string) => Promise<boolean>): Promise<string> {
  const radice = base.slice(0, 74).replace(/-+$/g, "") || "biglietto";
  for (let n = 2; n < 500; n++) {
    const s = `${radice}-${n}`;
    if (!(await occupato(s))) return s;
  }
  return `${radice}-${Date.now().toString(36)}`;
}

// ---------- Testo del messaggio (HTML ripulito) ----------

export const MAX_TESTO_MESSAGGIO = 1000;
export const MAX_MESSAGGIO_GRUPPO = 2000;
/** Il ruolo o la parentela sotto la firma («Amica del liceo»). */
export const MAX_RUOLO = 40;

const TAG_PERMESSI: Record<string, "b" | "i" | "u" | "br"> = { b: "b", strong: "b", i: "i", em: "i", u: "u", br: "br" };
const TAG_BLOCCO = new Set(["div", "p", "li"]);

function decodifica(t: string): string {
  return t
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Math.min(Number(n), 0x10ffff)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(Math.min(parseInt(h, 16), 0x10ffff)))
    .replace(/&amp;/g, "&");
}

function scappa(t: string): string {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Tiene solo <b> <i> <u> <br> (e <strong>/<em> diventano <b>/<i>), senza attributi; tutto il resto è testo.
 * Gli a capo dell'editor (<div>, <p>) diventano <br>. Script e stili spariscono con il loro contenuto.
 */
export function ripulisciHtml(html: string): string {
  const senzaScript = html.replace(/<(script|style|template|iframe|object)[\s\S]*?<\/\1\s*>/gi, "").replace(/<!--[\s\S]*?-->/g, "");
  const re = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>|[^<]+|</g;
  let out = "";
  const aperti: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(senzaScript))) {
    const tok = m[0];
    if (m[1]) {
      const nome = m[1].toLowerCase();
      const chiude = tok.startsWith("</");
      const t = TAG_PERMESSI[nome];
      if (t === "br") {
        out += "<br>";
      } else if (t) {
        if (!chiude) {
          out += `<${t}>`;
          aperti.push(t);
        } else if (aperti.includes(t)) {
          const sopra: string[] = [];
          while (aperti.length) {
            const x = aperti.pop() as string;
            out += `</${x}>`;
            if (x === t) break;
            sopra.unshift(x);
          }
          for (const x of sopra) {
            out += `<${x}>`;
            aperti.push(x);
          }
        }
      } else if (TAG_BLOCCO.has(nome) && !chiude && out !== "" && !out.endsWith("<br>")) {
        out += "<br>";
      }
    } else if (tok === "<") {
      out += "&lt;";
    } else {
      out += scappa(decodifica(tok));
    }
  }
  while (aperti.length) out += `</${aperti.pop()}>`;
  // niente a capo all'inizio o alla fine, e al massimo due di fila
  return out
    .replace(/^(?:\s|<br>)+/, "")
    .replace(/(?:\s|<br>)+$/, "")
    .replace(/(?:<br>){3,}/g, "<br><br>")
    .replace(/<(b|i|u)><\/\1>/g, "");
}

/** Il testo visibile di un HTML ripulito (per contare i caratteri e controllare che non sia vuoto). */
export function testoDaHtml(html: string): string {
  return decodifica(html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, "")).replace(/ /g, " ");
}

export function lunghezzaTesto(html: string): number {
  return [...testoDaHtml(html)].length;
}

// ---------- Caratteri e stile del messaggio ----------

export type CategoriaFont = "senza-grazie" | "con-grazie" | "a-mano" | "decorativo";

export interface FontBiglietto {
  id: string;
  nome: string;
  categoria: CategoriaFont;
  /** famiglia CSS completa, con ripiego */
  css: string;
  /** nome su Google Fonts; null per i caratteri di sistema */
  google: string | null;
}

const F = (nome: string, categoria: CategoriaFont, ripiego: string, google: string | null = nome): FontBiglietto => ({
  id: nome.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  nome,
  categoria,
  css: `'${nome}', ${ripiego}`,
  google,
});

/** I caratteri dello «Stile del testo» (elenco della specifica, equivalenti Google Fonts). */
export const FONT_BIGLIETTO: FontBiglietto[] = [
  { id: "predefinito", nome: "Predefinito", categoria: "senza-grazie", css: "var(--font-testo), system-ui, sans-serif", google: null },
  F("Poppins", "senza-grazie", "sans-serif"),
  F("Quicksand", "senza-grazie", "sans-serif"),
  F("Lexend", "senza-grazie", "sans-serif"),
  F("Barlow Condensed", "senza-grazie", "sans-serif"),
  F("Darker Grotesque", "senza-grazie", "sans-serif"),
  F("Arial", "senza-grazie", "sans-serif", null),
  F("Helvetica", "senza-grazie", "sans-serif", null),
  F("Shantell Sans", "senza-grazie", "sans-serif"),
  F("Comic Neue", "senza-grazie", "sans-serif"),
  F("Libre Baskerville", "con-grazie", "serif"),
  F("Playfair Display", "con-grazie", "serif"),
  F("Cinzel", "con-grazie", "serif"),
  F("Quattrocento", "con-grazie", "serif"),
  F("Josefin Slab", "con-grazie", "serif"),
  F("Times New Roman", "con-grazie", "serif", null),
  F("Indie Flower", "a-mano", "cursive"),
  F("Amatic SC", "a-mano", "cursive"),
  F("Architects Daughter", "a-mano", "cursive"),
  F("Nanum Pen Script", "a-mano", "cursive"),
  F("Homemade Apple", "a-mano", "cursive"),
  F("Gloria Hallelujah", "a-mano", "cursive"),
  F("Reenie Beanie", "a-mano", "cursive"),
  F("Nothing You Could Do", "a-mano", "cursive"),
  F("Cedarville Cursive", "a-mano", "cursive"),
  F("Give You Glory", "a-mano", "cursive"),
  F("Parisienne", "a-mano", "cursive"),
  F("Send Flowers", "a-mano", "cursive"),
  F("Space Mono", "decorativo", "monospace"),
  F("Cutive Mono", "decorativo", "monospace"),
  F("Courier Prime", "decorativo", "monospace"),
  F("Special Elite", "decorativo", "cursive"),
  F("Lacquer", "decorativo", "cursive"),
  F("Rock Salt", "decorativo", "cursive"),
];

export function fontPerId(id: string | null | undefined): FontBiglietto {
  return FONT_BIGLIETTO.find((f) => f.id === id) ?? FONT_BIGLIETTO[0];
}

/** L'indirizzo del foglio di stile di Google Fonts per i caratteri dati (null se non ne serve nessuno). */
export function urlGoogleFonts(ids: Iterable<string>): string | null {
  const nomi = [...new Set([...ids].map((i) => fontPerId(i).google).filter((g): g is string => !!g))].sort();
  if (nomi.length === 0) return null;
  return `https://fonts.googleapis.com/css2?${nomi.map((n) => `family=${encodeURIComponent(n).replace(/%20/g, "+")}`).join("&")}&display=swap`;
}

export const DIMENSIONI_TESTO: { id: StileFirma["dimensione"]; nome: string }[] = [
  { id: "xs", nome: "Molto piccolo" },
  { id: "s", nome: "Piccolo" },
  { id: "m", nome: "Medio" },
  { id: "l", nome: "Grande" },
  { id: "xl", nome: "Molto grande" },
  { id: "xxl", nome: "Enorme" },
];

export const STILE_PREDEFINITO: StileFirma = { font: "predefinito", colore: "#16241F", dimensione: "m" };

/** Uno stile che arriva dal browser: si tiene solo ciò che è ammesso, il resto torna al predefinito. */
export function stileValido(s: unknown): StileFirma {
  const d = (s && typeof s === "object" ? s : {}) as Record<string, unknown>;
  const font = typeof d.font === "string" && FONT_BIGLIETTO.some((f) => f.id === d.font) ? d.font : STILE_PREDEFINITO.font;
  const colore = typeof d.colore === "string" && /^#[0-9a-fA-F]{6}$/.test(d.colore) ? d.colore.toUpperCase() : STILE_PREDEFINITO.colore;
  const dimensione = DIMENSIONI_TESTO.some((x) => x.id === d.dimensione) ? (d.dimensione as StileFirma["dimensione"]) : STILE_PREDEFINITO.dimensione;
  return { font, colore, dimensione };
}

// ---------- Passo 2 «Le basi» ----------

export function emailValida(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim()) && e.trim().length <= 254;
}

export interface DatiDettagli {
  festeggiato: string;
  daParteDi: string;
  destinatario: "festeggiato" | "organizzatore" | null;
  emailFesteggiato: string;
  emailMia: string;
  data: string; // AAAA-MM-GG
  ora: string; // HH:MM
  fuso: string;
  nome: string;
}

export type ErroriDettagli = Partial<Record<keyof DatiDettagli | "consegna", string>>;

export function erroriDettagli(d: DatiDettagli, adesso = Date.now()): ErroriDettagli {
  const e: ErroriDettagli = {};
  if (!d.festeggiato.trim()) e.festeggiato = "Scrivi per chi è il biglietto.";
  if (!d.daParteDi.trim()) e.daParteDi = "Scrivi da parte di chi arriva.";
  if (!d.destinatario) e.destinatario = "Scegli a chi lo mandiamo.";
  if (d.destinatario === "festeggiato" && !emailValida(d.emailFesteggiato)) e.emailFesteggiato = "Scrivi un'email valida.";
  if (d.destinatario === "organizzatore" && !emailValida(d.emailMia)) e.emailMia = "Scrivi un'email valida.";
  const giorno = giornoDaIso(d.data);
  if (!giorno) e.data = "Scegli una data.";
  else if (confrontaGiorni(giorno, giornoRoma(adesso)) < 0) e.data = "La data è già passata.";
  if (!/^([01]\d|2[0-3]):(00|15|30|45)$/.test(d.ora)) e.ora = "Scegli l'ora.";
  if (!fusoValido(d.fuso)) e.fuso = "Fuso orario non valido.";
  if (giorno && !e.ora && !e.fuso && istanteConsegna(d) <= adesso) e.consegna = "Data e ora sono già passate.";
  if (!d.nome.trim()) e.nome = "Dai un nome al biglietto.";
  else if (d.nome.trim().length > MAX_NOME_BIGLIETTO) e.nome = "Il nome supera i 100 caratteri.";
  return e;
}

export function istanteConsegna(d: Pick<DatiDettagli, "data" | "ora" | "fuso">): number {
  const giorno = giornoDaIso(d.data);
  const [h, m] = d.ora.split(":").map(Number);
  if (!giorno || Number.isNaN(h) || !fusoValido(d.fuso)) return NaN;
  return istanteNelFuso(giorno, h, m, d.fuso);
}

/** Le ore a passi di 15 minuti: "00:00", "00:15", … "23:45". */
export const ORARI_15: string[] = Array.from({ length: 96 }, (_, i) => `${String(Math.floor(i / 4)).padStart(2, "0")}:${String((i % 4) * 15).padStart(2, "0")}`);

// ---------- Viste pubbliche: ciò che può arrivare al browser del firmatario ----------

export function vistaPubblica(b: Biglietto): BigliettoPubblico {
  return {
    slug: b.slug,
    organizzatoreNome: b.organizzatoreNome,
    occasione: b.occasione,
    festeggiato: b.festeggiato,
    messaggioGruppo: b.messaggioGruppo,
    nome: b.nome,
    copertina: b.copertina,
    colonne: b.colonne,
    ordineFirme: b.ordineFirme,
    stato: b.stato,
    nFirme: b.nFirme,
  };
}

/** Una firma per gli altri firmatari: senza cognome, email e uid. */
export function firmaPubblica(f: Firma): Firma {
  return { ...f, uid: "", nome: "", cognome: null, email: null };
}

// ---------- Messaggi da condividere ----------

const dataItaliana = (ms: number, fuso: string) => new Intl.DateTimeFormat("it-IT", { timeZone: fuso, day: "numeric", month: "long" }).format(new Date(ms));

/** Il messaggio già scritto per invitare il gruppo a firmare. */
export function messaggioInvitoBiglietto(b: Pick<Biglietto, "festeggiato" | "consegna">, url: string): string {
  const entro = b.consegna.quando > 0 ? ` entro il ${dataItaliana(b.consegna.quando, b.consegna.fuso)}` : "";
  return `Ciao! Stiamo preparando un biglietto di auguri per ${b.festeggiato}. Aggiungi il tuo messaggio${entro}, ci vuole un minuto: ${url}`;
}

/** Il sollecito per chi non ha ancora firmato. */
export function messaggioPromemoriaBiglietto(b: Pick<Biglietto, "festeggiato" | "consegna">, url: string): string {
  const entro = b.consegna.quando > 0 ? `: lo consegniamo il ${dataItaliana(b.consegna.quando, b.consegna.fuso)}` : "";
  return `Promemoria: manca ancora il tuo messaggio sul biglietto per ${b.festeggiato}${entro}. Ecco il link: ${url}`;
}
