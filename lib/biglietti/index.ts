import { modalitaDati } from "../config";
import { archivioBigliettiFirestore } from "./firestore";
import { archivioBigliettiMemoria } from "./memoria";
import type { ArchivioBiglietti } from "./tipi";

export function archivioBiglietti(): ArchivioBiglietti {
  return modalitaDati() === "firestore" ? archivioBigliettiFirestore() : archivioBigliettiMemoria();
}
