// La musica del biglietto (MP3): controllata dal contenuto, non dal nome o dal tipo dichiarato, e servita anche a pezzi
// (Safari e iPhone chiedono l'audio con «Range» e senza risposta 206 non lo suonano).

/** È un MP3? Etichetta ID3 in testa, oppure direttamente il primo frame MPEG Layer III. */
export function eMp3(b: Uint8Array): boolean {
  if (b.length < 4) return false;
  if (b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) return true;
  const sync = b[0] === 0xff && (b[1] & 0xe0) === 0xe0;
  const versione = (b[1] >> 3) & 0x03; // 01 = riservato
  const layer = (b[1] >> 1) & 0x03; // 01 = Layer III
  return sync && versione !== 0x01 && layer === 0x01;
}

export function urlAudio(bigliettoId: string, nome: string): string {
  return `/api/audio/b/${bigliettoId}/${nome}`;
}

/** Il nome dell'audio da un nostro url (per eliminarlo quando si sostituisce). */
export function nomeAudioDaUrl(bigliettoId: string, url: string | null | undefined): string | null {
  const pre = `/api/audio/b/${bigliettoId}/`;
  return url && url.startsWith(pre) ? url.slice(pre.length) : null;
}

/** Il nome del file come lo si mostra a chi organizza: senza cartelle, corto. */
export function nomeFileMusica(v: unknown): string {
  const nome = typeof v === "string" ? v.split(/[\\/]/).pop()!.replace(/[\u0000-\u001f]/g, "").trim() : "";
  return nome.slice(0, 80) || "musica.mp3";
}

/**
 * L'intestazione Range di una richiesta: la parte da mandare (estremi inclusi); null = tutto il file;
 * "fuori" = la parte chiesta non esiste (416). Si gestisce un solo intervallo, come fanno i lettori audio.
 */
export function intervalloRichiesto(h: string | null, totale: number): { inizio: number; fine: number } | null | "fuori" {
  const m = h ? /^bytes=(\d*)-(\d*)$/.exec(h.trim()) : null;
  if (!m || (!m[1] && !m[2])) return null;
  let inizio: number;
  let fine: number;
  if (!m[1]) {
    // «bytes=-500»: gli ultimi 500 byte
    const n = Number(m[2]);
    if (n === 0) return "fuori";
    inizio = Math.max(0, totale - n);
    fine = totale - 1;
  } else {
    inizio = Number(m[1]);
    fine = m[2] ? Math.min(Number(m[2]), totale - 1) : totale - 1;
  }
  if (inizio >= totale || inizio > fine) return "fuori";
  return { inizio, fine };
}
