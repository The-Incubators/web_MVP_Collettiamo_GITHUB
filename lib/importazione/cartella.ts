// La cartella dell'agente letta nel browser: arriva come elenco di file (cartella scelta per intero) oppure
// come un .zip. Si trova l'Excel, si abbinano righe e foto di immagini/, si dice subito cosa non va.

import { leggiFoglio, leggiZip } from "./excel";
import type { DatiCandidato } from "./tipi";
import { colonneMancanti, rigaInCandidato } from "./valida";

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

/** Riceve i file come «percorso → contenuto», da cartella o da zip, e fa il resto. */
async function daFile(lotto: string, file: Map<string, Blob>): Promise<LetturaCartella> {
  // Si ignorano i file di sistema del Mac (__MACOSX, .DS_Store) e i file temporanei di Excel (~$…).
  const utili = [...file.entries()].filter(([p]) => !p.split("/").some((parte) => parte === "__MACOSX" || parte.startsWith(".") || parte.startsWith("~$")));
  const excel = utili.filter(([p]) => p.toLowerCase().endsWith(".xlsx"));
  if (excel.length === 0) throw new Error("Nella cartella non c'è un file Excel (.xlsx).");
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
    // Il tipo lo dà l'estensione: dentro uno zip i file non ne hanno uno.
    pronti.push({ dati, foto: blob.type ? blob : new Blob([blob], { type: MIME[estensione(immagine)] }) });
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
