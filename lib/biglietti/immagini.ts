// Immagini caricate (copertina e messaggi): controllate dal contenuto, non dal nome o dal tipo dichiarato.

import { MAX_BYTE_IMMAGINE, type ImmagineSalvata } from "./tipi";

const FIRME: { mime: string; ok: (b: Uint8Array) => boolean }[] = [
  { mime: "image/jpeg", ok: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/png", ok: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { mime: "image/gif", ok: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38 },
  { mime: "image/webp", ok: (b) => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 },
];

export type EsitoImmagine = { ok: true; img: ImmagineSalvata } | { ok: false; errore: string };

/** "data:image/…;base64,…" → byte, se è davvero un'immagine ammessa e non supera il limite. */
export function immagineDaDataUrl(dataUrl: unknown): EsitoImmagine {
  if (typeof dataUrl !== "string") return { ok: false, errore: "Immagine mancante." };
  const m = /^data:([a-z/+-]+);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) return { ok: false, errore: "Formato dell'immagine non valido." };
  const dati = Uint8Array.from(Buffer.from(m[2], "base64"));
  if (dati.length > MAX_BYTE_IMMAGINE) return { ok: false, errore: "L'immagine è troppo grande." };
  const tipo = FIRME.find((f) => f.ok(dati));
  if (!tipo) return { ok: false, errore: "Sono ammessi solo JPG, PNG, GIF e WebP." };
  return { ok: true, img: { mime: tipo.mime, dati } };
}

export function urlImmagine(bigliettoId: string, nome: string): string {
  return `/api/img/b/${bigliettoId}/${nome}`;
}

/** Il nome dell'immagine da un nostro url (per eliminarla quando si sostituisce). */
export function nomeDaUrl(bigliettoId: string, url: string | null | undefined): string | null {
  const pre = `/api/img/b/${bigliettoId}/`;
  return url && url.startsWith(pre) ? url.slice(pre.length) : null;
}

/** Host ammessi per le immagini delle librerie esterne (GIF e foto). */
export function urlEsternoAmmesso(url: unknown): url is string {
  if (typeof url !== "string") return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && (/(^|\.)giphy\.com$/.test(u.hostname) || u.hostname === "images.unsplash.com");
  } catch {
    return false;
  }
}
