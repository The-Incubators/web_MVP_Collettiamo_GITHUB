// Archivio in memoria per le prove in locale senza Firebase: condiviso dalle richieste, perso al riavvio.

import type { ArchivioImportazione, Candidato, FotoSalvata } from "./tipi";

interface Stato {
  candidati: Map<string, Candidato>;
  foto: Map<string, FotoSalvata>;
}

const g = globalThis as typeof globalThis & { __colletta_importazione?: Stato };

export function creaArchivioImportazioneMemoria(): ArchivioImportazione {
  g.__colletta_importazione ??= { candidati: new Map(), foto: new Map() };
  const s = g.__colletta_importazione;
  return {
    candidati: async () => [...s.candidati.values()].map((c) => structuredClone(c)),
    candidato: async (asin) => (s.candidati.has(asin) ? structuredClone(s.candidati.get(asin)!) : null),
    async salvaCandidato(c) {
      s.candidati.set(c.asin, structuredClone(c));
    },
    async salvaFoto(nome, foto) {
      s.foto.set(nome, { mime: foto.mime, dati: new Uint8Array(foto.dati) });
    },
    leggiFoto: async (nome) => s.foto.get(nome) ?? null,
  };
}
