// Lato server: sceglie a runtime l'adattatore per le letture delle pagine.
// (Il lato browser sta in client.ts.)

import { modalitaDati } from "../config";
import { creaDatiFirestoreAdmin } from "./firestore-admin";
import { creaDatiServerMemoria } from "./memoria";
import type { DatiServer } from "./tipi";

export function datiServer(): DatiServer {
  return modalitaDati() === "firestore" ? creaDatiFirestoreAdmin() : creaDatiServerMemoria();
}

export type { Dati, DatiLettura, DatiServer } from "./tipi";
