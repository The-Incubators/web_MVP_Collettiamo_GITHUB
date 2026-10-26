// Lettura del pacchetto dell'agente senza librerie: un .xlsx (e un .zip) è un archivio zip di file, e il
// foglio è XML. Gira sia nel browser sia in Node (DecompressionStream c'è in entrambi). Il contenuto non è
// fidato: limiti sulle dimensioni, e i testi si puliscono dopo, in valida.ts.

/** Oltre questa misura un singolo file dell'archivio non si apre (difesa dagli zip «bomba»). */
const MAX_FILE_BYTE = 40 * 1024 * 1024;

export class ErroreArchivio extends Error {}

async function decomprimi(dati: Uint8Array): Promise<Uint8Array> {
  const flusso = new Blob([dati as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(flusso).arrayBuffer());
}

/** I file di un archivio zip (nome → contenuto). Solo «stored» e «deflate», niente zip64: bastano per Excel e per gli zip del Finder. */
export async function leggiZip(archivio: Uint8Array): Promise<Map<string, Uint8Array>> {
  const v = new DataView(archivio.buffer, archivio.byteOffset, archivio.byteLength);
  // La fine dell'indice centrale sta negli ultimi 22 byte + un eventuale commento (max 64 KB).
  let fine = -1;
  for (let i = archivio.length - 22; i >= Math.max(0, archivio.length - 22 - 65535); i--) {
    if (v.getUint32(i, true) === 0x06054b50) {
      fine = i;
      break;
    }
  }
  if (fine < 0) throw new ErroreArchivio("Il file non è un archivio zip o Excel valido.");
  const voci = v.getUint16(fine + 10, true);
  let pos = v.getUint32(fine + 16, true);
  const decoder = new TextDecoder();
  const file = new Map<string, Uint8Array>();
  for (let n = 0; n < voci; n++) {
    if (pos + 46 > archivio.length || v.getUint32(pos, true) !== 0x02014b50) throw new ErroreArchivio("Indice dell'archivio rovinato.");
    const metodo = v.getUint16(pos + 10, true);
    const compressi = v.getUint32(pos + 20, true);
    const originali = v.getUint32(pos + 24, true);
    const lungNome = v.getUint16(pos + 28, true);
    const lungExtra = v.getUint16(pos + 30, true);
    const lungCommento = v.getUint16(pos + 32, true);
    const locale = v.getUint32(pos + 42, true);
    const nome = decoder.decode(archivio.subarray(pos + 46, pos + 46 + lungNome));
    pos += 46 + lungNome + lungExtra + lungCommento;
    if (nome.endsWith("/")) continue; // cartella
    if (originali > MAX_FILE_BYTE || compressi > MAX_FILE_BYTE) throw new ErroreArchivio(`Il file «${nome}» è troppo grande.`);
    if (locale + 30 > archivio.length || v.getUint32(locale, true) !== 0x04034b50) throw new ErroreArchivio("Archivio rovinato.");
    const inizio = locale + 30 + v.getUint16(locale + 26, true) + v.getUint16(locale + 28, true);
    const grezzi = archivio.subarray(inizio, inizio + compressi);
    if (metodo === 0) file.set(nome, grezzi);
    else if (metodo === 8) {
      const dati = await decomprimi(grezzi);
      if (dati.length > MAX_FILE_BYTE) throw new ErroreArchivio(`Il file «${nome}» è troppo grande.`);
      file.set(nome, dati);
    } else throw new ErroreArchivio(`Il file «${nome}» usa una compressione non supportata.`);
  }
  return file;
}

const ENTITA: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

function testoXml(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (tutto, e: string) => {
    if (e[0] === "#") {
      const n = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : "";
    }
    return ENTITA[e] ?? tutto;
  });
}

/**
 * I tag possono avere un prefisso di namespace (`<x:row>`, come nei file dell'agente) oppure no (`<row>`, come
 * in quelli salvati da Excel): le espressioni accettano entrambi.
 */
const NS = "(?:[A-Za-z_][\\w.-]*:)?";
const tag = (nome: string, flag = "g") => new RegExp(`<${NS}${nome}\\b([^>]*?)(?:\\/>|>([\\s\\S]*?)<\\/${NS}${nome}>)`, flag);

/** Il testo di tutti i <t> dentro un frammento (le stringhe con formattazione mista ne hanno più d'uno). */
function testiT(frammento: string): string {
  return [...frammento.matchAll(tag("t"))].map((m) => testoXml(m[2] ?? "")).join("");
}

/**
 * Le righe del primo foglio come oggetti {intestazione: valore}. La prima riga è l'intestazione.
 * Le celle vuote mancano dall'oggetto; i numeri restano testo (per esempio "149.99" o il seriale della data).
 */
export async function leggiFoglio(xlsx: Uint8Array): Promise<Record<string, string>[]> {
  const file = await leggiZip(xlsx);
  const decoder = new TextDecoder();
  const foglio = file.get("xl/worksheets/sheet1.xml");
  if (!foglio) throw new ErroreArchivio("Nel file Excel non trovo il primo foglio.");
  const condivise = file.has("xl/sharedStrings.xml")
    ? [...decoder.decode(file.get("xl/sharedStrings.xml")).matchAll(tag("si"))].map((m) => testiT(m[2] ?? ""))
    : [];

  const righe: Record<string, string>[] = [];
  for (const r of decoder.decode(foglio).matchAll(tag("row"))) {
    const riga: Record<string, string> = {};
    for (const c of (r[2] ?? "").matchAll(tag("c"))) {
      const attributi = c[1];
      const colonna = /\br="([A-Z]+)\d+"/.exec(attributi)?.[1];
      if (!colonna) continue;
      const tipo = /\bt="([^"]+)"/.exec(attributi)?.[1];
      const dentro = c[2] ?? "";
      const v = tag("v", "").exec(dentro)?.[2];
      let valore: string | undefined;
      if (tipo === "inlineStr") valore = testiT(dentro);
      else if (tipo === "s" && v !== undefined) valore = condivise[Number(v)];
      else if (v !== undefined) valore = testoXml(v);
      if (valore !== undefined && valore !== "") riga[colonna] = valore;
    }
    righe.push(riga);
  }
  if (righe.length === 0) return [];
  const intestazione = righe[0];
  return righe.slice(1).map((r) => Object.fromEntries(Object.entries(r).filter(([k]) => k in intestazione).map(([k, val]) => [intestazione[k].trim(), val])));
}
