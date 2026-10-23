import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * L'icona del marchio (la scatola regalo di Gifty) per le anteprime social. ImageResponse non prende i file
 * del sito da sé: glieli si passa come data URI. Si usa la versione chiara, con il verde schiarito, perché le
 * anteprime hanno il fondo verde scuro e il verde del logo ci sparirebbe.
 * Letta dal disco una volta sola, al primo uso (le rotte delle anteprime girano sul runtime Node).
 */
let cache: string | null = null;

export function iconaMarchioDataUri(): string {
  if (cache === null) {
    const file = readFileSync(join(process.cwd(), "public", "logo", "gifty-icona-chiara.png"));
    cache = `data:image/png;base64,${file.toString("base64")}`;
  }
  return cache;
}

/** Il nome del progetto, dove serve scriverlo. */
export const NOME_PROGETTO = "Gifty";
