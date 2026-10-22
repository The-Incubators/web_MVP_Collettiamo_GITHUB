// Accesso server con l'Admin SDK. Credenziali: chiave dell'account di servizio da variabili d'ambiente
// (in locale) oppure credenziali di ambiente (ADC) su Firebase App Hosting, con FIREBASE_ADMIN_ADC=true.

import { applicationDefault, cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { adminConCredenzialiDiAmbiente, databaseFirestore } from "../config";

function app(): App {
  if (getApps().length) return getApp();
  if (adminConCredenzialiDiAmbiente()) {
    return initializeApp({ credential: applicationDefault(), projectId: process.env.FIREBASE_ADMIN_PROJECT_ID });
  }
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      // Nelle variabili d'ambiente gli a capo della chiave arrivano spesso come "\n" letterali.
      privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? "").replace(/\\n/g, "\n").replace(/^"|"$/g, ""),
    }),
  });
}

export function dbAdmin(): Firestore {
  const id = databaseFirestore();
  return id === "(default)" ? getFirestore(app()) : getFirestore(app(), id);
}

export function authAdmin(): Auth {
  return getAuth(app());
}
