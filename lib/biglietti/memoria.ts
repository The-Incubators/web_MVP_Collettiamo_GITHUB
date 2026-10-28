// Archivio dei biglietti in memoria (modalità senza Firebase): vive nel processo del server.

import type { ArchivioBiglietti, BigliettoServer, FirmaServer, ImmagineSalvata } from "./tipi";
import { MAX_FIRME_PER_BIGLIETTO } from "./tipi";

interface Stato {
  biglietti: Map<string, BigliettoServer>;
  slug: Map<string, string>;
  firme: Map<string, Map<string, FirmaServer>>;
  immagini: Map<string, ImmagineSalvata>;
}

const g = globalThis as typeof globalThis & { __colletta_biglietti?: Stato };
function stato(): Stato {
  g.__colletta_biglietti ??= { biglietti: new Map(), slug: new Map(), firme: new Map(), immagini: new Map() };
  return g.__colletta_biglietti;
}
const copia = <T>(v: T): T => structuredClone(v);

export function archivioBigliettiMemoria(): ArchivioBiglietti {
  const s = stato();
  return {
    async crea(b) {
      s.biglietti.set(b.id, copia(b));
    },
    async leggi(id) {
      const b = s.biglietti.get(id);
      return b ? copia(b) : null;
    },
    async perSlug(slug) {
      const id = s.slug.get(slug);
      const b = id ? s.biglietti.get(id) : undefined;
      return b ? copia(b) : null;
    },
    async aggiorna(id, patch) {
      const b = s.biglietti.get(id);
      if (b) s.biglietti.set(id, { ...b, ...copia(patch) });
    },
    async slugOccupato(slug, escludiId) {
      const id = s.slug.get(slug);
      return !!id && id !== escludiId;
    },
    async prenotaSlug(id, slug) {
      const di = s.slug.get(slug);
      if (di && di !== id) return false;
      const b = s.biglietti.get(id);
      if (!b) return false;
      if (b.slug && b.slug !== slug && s.slug.get(b.slug) === id) s.slug.delete(b.slug);
      s.slug.set(slug, id);
      s.biglietti.set(id, { ...b, slug });
      return true;
    },
    async firme(id) {
      return [...(s.firme.get(id)?.values() ?? [])].map(copia);
    },
    async firma(id, firmaId) {
      const f = s.firme.get(id)?.get(firmaId);
      return f ? copia(f) : null;
    },
    async salvaFirma(id, f) {
      const b = s.biglietti.get(id);
      if (!b || b.stato !== "aperto") return { errore: "chiuso" as const };
      const mappa = s.firme.get(id) ?? new Map<string, FirmaServer>();
      const prima = mappa.get(f.id);
      if (!prima && mappa.size >= MAX_FIRME_PER_BIGLIETTO) return { errore: "pieno" as const };
      mappa.set(f.id, copia(prima ? { ...f, creatoIl: prima.creatoIl } : f));
      s.firme.set(id, mappa);
      if (!prima) s.biglietti.set(id, { ...b, nFirme: b.nFirme + 1 });
      return { nuova: !prima };
    },
    async eliminaFirma(id, firmaId) {
      const b = s.biglietti.get(id);
      if (!b || b.stato !== "aperto") return { errore: "chiuso" as const };
      if (!s.firme.get(id)?.delete(firmaId)) return { eliminata: false };
      s.biglietti.set(id, { ...b, nFirme: Math.max(0, b.nFirme - 1) });
      return { eliminata: true };
    },
    async salvaImmagine(id, nome, img) {
      s.immagini.set(`${id}/${nome}`, { mime: img.mime, dati: new Uint8Array(img.dati) });
    },
    async leggiImmagine(id, nome) {
      return s.immagini.get(`${id}/${nome}`) ?? null;
    },
    async eliminaImmagine(id, nome) {
      s.immagini.delete(`${id}/${nome}`);
    },
    async perOrganizzatore(uid) {
      return [...s.biglietti.values()].filter((b) => b.organizzatoreUid === uid).sort((a, b) => b.creatoIl - a.creatoIl).map(copia);
    },
  };
}
