"use client";

// Le immagini si preparano nel browser prima di partire: le foto si rimpiccioliscono (lato lungo 1200 px, JPEG),
// le GIF restano com'sono (animate) ma devono stare sotto il limite.

export const LIMITE_BYTE = 900 * 1024;
const LIMITE_ORIGINALE = 15 * 1024 * 1024;

export interface ImmaginePronta {
  dataUrl: string;
  larghezza: number;
  altezza: number;
}

function leggiDataUrl(b: Blob): Promise<string> {
  return new Promise((ok, ko) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => ko(new Error("lettura"));
    r.readAsDataURL(b);
  });
}

function carica(url: string): Promise<HTMLImageElement> {
  return new Promise((ok, ko) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = () => ko(new Error("immagine"));
    i.src = url;
  });
}

function comeBlob(c: HTMLCanvasElement, q: number): Promise<Blob | null> {
  return new Promise((ok) => c.toBlob(ok, "image/jpeg", q));
}

/** Errore leggibile (in italiano) se il file non va bene. */
export async function preparaImmagine(file: File): Promise<ImmaginePronta> {
  const tipo = file.type;
  if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(tipo)) throw new Error("Sono ammessi solo JPG, PNG e GIF.");
  if (tipo === "image/gif") {
    if (file.size > LIMITE_BYTE) throw new Error("La GIF supera i 900 KB: scegline una più leggera.");
    const dataUrl = await leggiDataUrl(file);
    const img = await carica(dataUrl);
    return { dataUrl, larghezza: img.naturalWidth, altezza: img.naturalHeight };
  }
  if (file.size > LIMITE_ORIGINALE) throw new Error("L'immagine è troppo grande (massimo 15 MB).");
  const url = URL.createObjectURL(file);
  try {
    const img = await carica(url).catch(() => {
      throw new Error("Non riesco ad aprire questa immagine.");
    });
    for (const [lato, q] of [
      [1200, 0.85],
      [1000, 0.75],
      [800, 0.7],
    ] as const) {
      const s = Math.min(1, lato / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * s));
      const h = Math.max(1, Math.round(img.naturalHeight * s));
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d");
      if (!ctx) throw new Error("Non riesco a preparare l'immagine.");
      ctx.fillStyle = "#FFFFFF"; // le parti trasparenti dei PNG diventano bianche, non nere
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      const blob = await comeBlob(c, q);
      if (blob && blob.size <= LIMITE_BYTE) return { dataUrl: await leggiDataUrl(blob), larghezza: w, altezza: h };
    }
    throw new Error("L'immagine è troppo pesante anche dopo averla ridotta.");
  } finally {
    URL.revokeObjectURL(url);
  }
}
