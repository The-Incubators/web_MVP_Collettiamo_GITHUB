// La firma come arriva dal browser di chi firma: tutto si ricontrolla qui.

import { archivioBiglietti } from ".";
import { chiaveValida, idFirma, nuovaChiave, nuovoId } from "./accesso";
import { immagineDaDataUrl, nomeDaUrl, urlEsternoAmmesso, urlImmagine } from "./immagini";
import type { BigliettoServer, FirmaServer } from "./tipi";
import { emailValida, lunghezzaTesto, MAX_TESTO_MESSAGGIO, ripulisciHtml, stileValido } from "../dominio/biglietti";
import type { ImmagineFirma } from "../tipi";

export function chiaveFirmatario(richiesta: Request): string | null {
  const c = richiesta.headers.get("x-chiave-firmatario");
  return chiaveValida(c) ? c : null;
}

const t = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const misura = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 && v < 10000 ? Math.round(v) : 0);

export type EsitoFirma = { ok: true; firma: FirmaServer; nuova: boolean } | { ok: false; errore: string; status: number };

export async function salvaFirmaDaCorpo(b: BigliettoServer, chiave: string, c: Record<string, unknown>): Promise<EsitoFirma> {
  if (b.stato !== "aperto") return { ok: false, errore: "Questo biglietto è già stato consegnato.", status: 409 };
  const archivio = archivioBiglietti();
  const id = idFirma(chiave, b.id);
  const prima = await archivio.firma(b.id, id);

  const messaggioHtml = ripulisciHtml(typeof c.messaggioHtml === "string" ? c.messaggioHtml.slice(0, 20000) : "");
  const lunghezza = lunghezzaTesto(messaggioHtml);
  if (lunghezza === 0 || !messaggioHtml.replace(/<[^>]*>/g, "").trim()) return { ok: false, errore: "Scrivi il tuo messaggio.", status: 400 };
  if (lunghezza > MAX_TESTO_MESSAGGIO) return { ok: false, errore: "Il messaggio supera i 1.000 caratteri.", status: 400 };
  const daParteDi = t(c.daParteDi, 80);
  if (!daParteDi) return { ok: false, errore: "Scrivi chi firma il messaggio.", status: 400 };
  const nome = t(c.nome, 60);
  if (!nome) return { ok: false, errore: "Scrivi il tuo nome.", status: 400 };
  const email = t(c.email, 254);
  if (email && !emailValida(email)) return { ok: false, errore: "L'email non è valida.", status: 400 };

  // Immagine: nuova caricata, presa da una libreria, tenuta com'era, o nessuna.
  let immagine: ImmagineFirma | null = null;
  let daEliminare: string | null = null;
  const vecchiaNome = nomeDaUrl(b.id, prima?.immagine?.url);
  const im = c.immagine as Record<string, unknown> | null | undefined;
  if (im && im.tipo === "mantieni") {
    immagine = prima?.immagine ?? null;
  } else if (im && im.tipo === "caricata") {
    const img = immagineDaDataUrl(im.dataUrl);
    if (!img.ok) return { ok: false, errore: img.errore, status: 400 };
    const nomeFile = `f-${nuovoId(9)}`;
    await archivio.salvaImmagine(b.id, nomeFile, img.img);
    immagine = { tipo: "caricata", url: urlImmagine(b.id, nomeFile), larghezza: misura(im.larghezza), altezza: misura(im.altezza), attribuzione: null };
    daEliminare = vecchiaNome;
  } else if (im && (im.tipo === "giphy" || im.tipo === "unsplash")) {
    if (!urlEsternoAmmesso(im.url)) return { ok: false, errore: "Immagine non valida.", status: 400 };
    immagine = { tipo: im.tipo, url: im.url, larghezza: misura(im.larghezza), altezza: misura(im.altezza), attribuzione: t(im.attribuzione, 120) || (im.tipo === "giphy" ? "via GIPHY" : null) };
    daEliminare = vecchiaNome;
  } else {
    daEliminare = vecchiaNome;
  }

  const adesso = Date.now();
  const firma: FirmaServer = {
    id,
    uid: id,
    messaggioHtml,
    stile: stileValido(c.stile),
    immagine,
    daParteDi,
    nome,
    cognome: t(c.cognome, 60) || null,
    email: email || null,
    nascosta: prima?.nascosta ?? false,
    creatoIl: prima?.creatoIl ?? adesso,
    aggiornatoIl: adesso,
    tokenModifica: prima?.tokenModifica ?? nuovaChiave(),
  };
  const esito = await archivio.salvaFirma(b.id, firma);
  if ("errore" in esito) {
    if (immagine?.tipo === "caricata" && immagine.url !== prima?.immagine?.url) await archivio.eliminaImmagine(b.id, nomeDaUrl(b.id, immagine.url) ?? "");
    return esito.errore === "pieno"
      ? { ok: false, errore: "Il biglietto ha raggiunto il numero massimo di messaggi.", status: 409 }
      : { ok: false, errore: "Questo biglietto è già stato consegnato.", status: 409 };
  }
  if (daEliminare && daEliminare !== nomeDaUrl(b.id, immagine?.url)) await archivio.eliminaImmagine(b.id, daEliminare);
  return { ok: true, firma, nuova: esito.nuova };
}
