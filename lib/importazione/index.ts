// Lato server: l'archivio dell'importazione, scelto come quello dei dati (Firestore o memoria).

import { modalitaDati } from "../config";
import { creaArchivioImportazioneFirestore } from "./firestore";
import { creaArchivioImportazioneMemoria } from "./memoria";
import type { ArchivioImportazione } from "./tipi";

export function archivioImportazione(): ArchivioImportazione {
  return modalitaDati() === "firestore" ? creaArchivioImportazioneFirestore() : creaArchivioImportazioneMemoria();
}
