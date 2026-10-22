// Configurazione letta da process.env. Nessun valore reale nel codice.
// Finché le variabili valgono INSERIRE, l'applicazione usa l'adattatore in memoria.

export type Modalita = "firestore" | "memoria";

const SEGNAPOSTO = "INSERIRE";

function valido(v: string | undefined): v is string {
  if (!v) return false;
  const t = v.trim().replace(/^"|"$/g, "");
  return t !== "" && t !== SEGNAPOSTO;
}

/** Variabili NEXT_PUBLIC_*: vanno lette con il nome completo perché Next le sostituisca nel bundle. */
export function firebaseClientConfigurato(): boolean {
  return [
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  ].every(valido);
}

/** Su Firebase App Hosting le credenziali dell'Admin SDK arrivano dall'ambiente (ADC): niente chiave da custodire. */
export function adminConCredenzialiDiAmbiente(): boolean {
  return process.env.FIREBASE_ADMIN_ADC === "true" && valido(process.env.FIREBASE_ADMIN_PROJECT_ID);
}

export function firebaseAdminConfigurato(): boolean {
  if (adminConCredenzialiDiAmbiente()) return true;
  return [
    process.env.FIREBASE_ADMIN_PROJECT_ID,
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    process.env.FIREBASE_ADMIN_PRIVATE_KEY,
  ].every(valido);
}

/**
 * L'id del database Firestore. Vuoto = "(default)". Un progetto Firebase condiviso con altre app
 * si usa con un database dedicato, così le regole e i dati delle altre app non si toccano.
 * (Va letto con il nome completo perché Next lo sostituisca nel bundle del browser.)
 */
export function databaseFirestore(): string {
  const v = process.env.NEXT_PUBLIC_FIRESTORE_DATABASE;
  return valido(v) ? v.trim() : "(default)";
}

/** Lato server. La modalità è una sola per tutta l'applicazione: la decide il server e la passa al client. */
export function modalitaDati(): Modalita {
  return firebaseClientConfigurato() && firebaseAdminConfigurato() ? "firestore" : "memoria";
}

export function baseUrl(): string {
  const v = process.env.NEXT_PUBLIC_BASE_URL;
  return valido(v) ? v.replace(/\/+$/, "") : "http://localhost:3000";
}
