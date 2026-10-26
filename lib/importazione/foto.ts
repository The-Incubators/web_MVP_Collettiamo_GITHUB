// La foto di un candidato arriva dal browser già rimpicciolita (JPEG o WebP) come data URL. Il server ricontrolla
// tipo, firma del file e misura: un documento Firestore non supera 1 MB.

export const MAX_FOTO_BYTE = 900 * 1024;

const FIRME: Record<string, (b: Uint8Array) => boolean> = {
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/webp": (b) => String.fromCharCode(...b.subarray(0, 4)) === "RIFF" && String.fromCharCode(...b.subarray(8, 12)) === "WEBP",
  "image/png": (b) => b[0] === 0x89 && String.fromCharCode(...b.subarray(1, 4)) === "PNG",
};

export const ESTENSIONE: Record<string, string> = { "image/jpeg": "jpg", "image/webp": "webp", "image/png": "png" };

export function fotoDaDataUrl(dataUrl: unknown): { ok: true; mime: string; dati: Uint8Array } | { ok: false; errore: string } {
  if (typeof dataUrl !== "string") return { ok: false, errore: "Foto mancante." };
  const m = /^data:(image\/(?:jpeg|webp|png));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) return { ok: false, errore: "Foto in un formato non ammesso." };
  const dati = new Uint8Array(Buffer.from(m[2], "base64"));
  if (dati.length === 0 || dati.length > MAX_FOTO_BYTE) return { ok: false, errore: "Foto vuota o troppo grande." };
  if (!FIRME[m[1]](dati)) return { ok: false, errore: "Il file non è la foto che dichiara di essere." };
  return { ok: true, mime: m[1], dati };
}

/** Nome della foto: ASIN più una parte casuale, così un nuovo caricamento non riusa la cache di quello vecchio. */
export function nomeFoto(asin: string, mime: string): string {
  const casuale = globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  return `${asin}-${casuale}.${ESTENSIONE[mime]}`;
}

export const FORMA_NOME_FOTO = /^[A-Z0-9]{10}-[a-f0-9]{8}\.(jpg|webp|png)$/;
