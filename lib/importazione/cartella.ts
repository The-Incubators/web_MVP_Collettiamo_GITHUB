// La cartella dell'agente letta nel browser: arriva come elenco di file (cartella scelta per intero) oppure
// come un .zip. Due formati: quello JSON del GPT (catalogo.json + prodotti/<ASIN>/immagini/) e quello Excel
// delle prime cartelle (un .xlsx + immagini/). Si abbinano prodotti e foto e si dice subito cosa non va.

import { leggiFoglio, leggiZip } from "./excel";
import type { DatiCandidato } from "./tipi";
import { colonneMancanti, prodottoJsonInCandidato, rigaInCandidato } from "./valida";

export interface Pronto {
  dati: DatiCandidato;
  foto: Blob;
}

export interface LetturaCartella {
  lotto: string;
  pronti: Pronto[];
  /** righe scartate prima dell'invio, con il motivo */
  errori: { id: string; errori: string[] }[];
}

const MIME: Record<string, string> = { ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png" };

function estensione(nome: string): string {
  return nome.includes(".") ? nome.slice(nome.lastIndexOf(".")).toLowerCase() : "";
}

/** Oltre questa misura il catalogo.json non si apre: 30 prodotti pesano circa 65 KB. */
const MAX_JSON_BYTE = 5 * 1024 * 1024;

/** Il tipo lo dà l'estensione: dentro uno zip i file non ne hanno uno. */
function conTipo(blob: Blob, nome: string): Blob {
  return blob.type ? blob : new Blob([blob], { type: MIME[estensione(nome)] });
}

/** Riceve i file come «percorso → contenuto», da cartella o da zip, e sceglie il formato. */
async function daFile(lotto: string, file: Map<string, Blob>): Promise<LetturaCartella> {
  // Si ignorano i file di sistema del Mac (__MACOSX, .DS_Store) e i file temporanei di Excel (~$…).
  const utili = [...file.entries()].filter(([p]) => !p.split("/").some((parte) => parte === "__MACOSX" || parte.startsWith(".") || parte.startsWith("~$")));
  const json = utili.filter(([p]) => p === "catalogo.json" || p.endsWith("/catalogo.json"));
  if (json.length > 1) throw new Error(`Nella cartella ci sono ${json.length} file catalogo.json: ne serve uno solo.`);
  if (json.length === 1) return daJson(lotto, json[0], new Map(utili));
  return daExcel(lotto, utili);
}

/** Il formato del GPT: catalogo.json con l'elenco «prodotti»; le foto hanno il percorso scritto nel prodotto. */
async function daJson(lotto: string, [percorso, blob]: [string, Blob], file: Map<string, Blob>): Promise<LetturaCartella> {
  if (blob.size > MAX_JSON_BYTE) throw new Error("Il file catalogo.json è troppo grande.");
  let catalogo: unknown;
  try {
    catalogo = JSON.parse(await blob.text());
  } catch {
    throw new Error("Il file catalogo.json non è un JSON valido.");
  }
  const c = catalogo && typeof catalogo === "object" ? (catalogo as Record<string, unknown>) : {};
  if (!Array.isArray(c.prodotti)) throw new Error("Nel file catalogo.json manca l'elenco «prodotti».");
  if (c.prodotti.length === 0) throw new Error("Il file catalogo.json non ha prodotti.");
  const categoria = typeof c.categoria === "string" ? c.categoria : "";
  // i percorsi delle foto sono relativi alla cartella che contiene catalogo.json
  const radice = percorso.slice(0, percorso.length - "catalogo.json".length);

  const pronti: Pronto[] = [];
  const errori: LetturaCartella["errori"] = [];
  const visti = new Set<string>();
  for (const voce of c.prodotti) {
    const esito = prodottoJsonInCandidato(voce, categoria);
    if (!esito.ok) {
      errori.push({ id: esito.id, errori: esito.errori });
      continue;
    }
    const { dati, immagine } = esito;
    if (visti.has(dati.asin)) {
      errori.push({ id: dati.asin, errori: ["ASIN ripetuto nel file"] });
      continue;
    }
    visti.add(dati.asin);
    const foto = file.get(radice + immagine);
    if (!foto) {
      errori.push({ id: dati.asin, errori: [`foto mancante (${immagine})`] });
      continue;
    }
    pronti.push({ dati, foto: conTipo(foto, immagine) });
  }
  return { lotto, pronti, errori };
}

/** Il formato delle prime cartelle: un Excel con colonne fisse e la cartella immagini/. */
async function daExcel(lotto: string, utili: [string, Blob][]): Promise<LetturaCartella> {
  const excel = utili.filter(([p]) => p.toLowerCase().endsWith(".xlsx"));
  if (excel.length === 0) throw new Error("Nella cartella non trovo né un catalogo.json né un file Excel (.xlsx).");
  if (excel.length > 1) throw new Error(`Nella cartella ci sono ${excel.length} file Excel: ne serve uno solo.`);

  // Le foto si cercano per nome dentro una cartella «immagini», ovunque si trovi nella cartella caricata.
  const foto = new Map<string, Blob>();
  for (const [p, b] of utili) {
    const parti = p.split("/");
    if (parti.length >= 2 && parti[parti.length - 2] === "immagini") foto.set(parti[parti.length - 1], b);
  }

  const righe = (await leggiFoglio(new Uint8Array(await excel[0][1].arrayBuffer()))).filter((r) => Object.keys(r).length > 0);
  if (righe.length === 0) throw new Error("Il file Excel non ha prodotti.");
  const mancanti = colonneMancanti(righe);
  if (mancanti.length) throw new Error(`Nel file Excel mancano le colonne: ${mancanti.join(", ")}.`);

  const pronti: Pronto[] = [];
  const errori: LetturaCartella["errori"] = [];
  const visti = new Set<string>();
  for (const r of righe) {
    const esito = rigaInCandidato(r);
    if (!esito.ok) {
      errori.push({ id: esito.id, errori: esito.errori });
      continue;
    }
    const { dati, immagine } = esito;
    if (visti.has(dati.asin)) {
      errori.push({ id: dati.idOrigine, errori: ["ASIN ripetuto nel file"] });
      continue;
    }
    visti.add(dati.asin);
    const blob = foto.get(immagine);
    if (!blob) {
      errori.push({ id: dati.idOrigine, errori: [`foto mancante in immagini/ (${immagine})`] });
      continue;
    }
    pronti.push({ dati, foto: conTipo(blob, immagine) });
  }
  return { lotto, pronti, errori };
}

/** Una cartella scelta con <input webkitdirectory>: ogni file ha il percorso relativo. */
export async function leggiCartella(elenco: FileList | File[]): Promise<LetturaCartella> {
  const file = new Map<string, Blob>();
  for (const f of Array.from(elenco)) file.set(f.webkitRelativePath || f.name, f);
  const primo = Array.from(elenco)[0];
  const lotto = (primo?.webkitRelativePath || "").split("/")[0] || "cartella";
  return daFile(lotto, file);
}

/** Lo zip della cartella (come quelli scaricati dall'agente). */
export async function leggiZipCartella(zip: File): Promise<LetturaCartella> {
  const contenuto = await leggiZip(new Uint8Array(await zip.arrayBuffer()));
  const file = new Map<string, Blob>([...contenuto.entries()].map(([p, d]) => [p, new Blob([d as BlobPart])]));
  return daFile(zip.name.replace(/\.zip$/i, ""), file);
}

/** La foto pronta per l'invio: lato lungo al massimo 1000 px, JPEG, sotto il limite del server. */
export async function fotoPerInvio(foto: Blob): Promise<string> {
  const url = URL.createObjectURL(foto);
  try {
    const img = await new Promise<HTMLImageElement>((ok, ko) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => ko(new Error("La foto non si apre."));
      i.src = url;
    });
    const scala = Math.min(1, 1000 / Math.max(img.naturalWidth, img.naturalHeight));
    const tela = document.createElement("canvas");
    tela.width = Math.max(1, Math.round(img.naturalWidth * scala));
    tela.height = Math.max(1, Math.round(img.naturalHeight * scala));
    const ctx = tela.getContext("2d");
    if (!ctx) throw new Error("Il browser non riesce a preparare la foto.");
    // fondo bianco: le PNG e WebP trasparenti in JPEG diventerebbero nere
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, tela.width, tela.height);
    ctx.drawImage(img, 0, 0, tela.width, tela.height);
    for (const qualita of [0.86, 0.75, 0.6]) {
      const dataUrl = tela.toDataURL("image/jpeg", qualita);
      if (dataUrl.length * 0.75 < 880 * 1024) return dataUrl;
    }
    throw new Error("La foto resta troppo pesante anche rimpicciolita.");
  } finally {
    URL.revokeObjectURL(url);
  }
}
