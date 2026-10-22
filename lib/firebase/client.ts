// Inizializzazione dello SDK web. Va importato solo quando la modalità è "firestore".
// Con NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST e NEXT_PUBLIC_AUTH_EMULATOR_HOST valorizzati ci si collega
// agli emulatori locali (serve ai test di integrazione, non alla produzione).

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";

export function appFirebase(): FirebaseApp {
  if (getApps().length) return getApp();
  return initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });
}

let authCollegato = false;
let dbCollegato = false;

export function authFirebase(): Auth {
  const auth = getAuth(appFirebase());
  const host = process.env.NEXT_PUBLIC_AUTH_EMULATOR_HOST;
  if (host && !authCollegato) {
    authCollegato = true;
    connectAuthEmulator(auth, `http://${host}`, { disableWarnings: true });
  }
  return auth;
}

export function dbFirebase(): Firestore {
  const id = process.env.NEXT_PUBLIC_FIRESTORE_DATABASE?.trim().replace(/^"|"$/g, "");
  const db = id && id !== "INSERIRE" && id !== "(default)" ? getFirestore(appFirebase(), id) : getFirestore(appFirebase());
  const host = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST;
  if (host && !dbCollegato) {
    dbCollegato = true;
    const [nome, porta] = host.split(":");
    connectFirestoreEmulator(db, nome, Number(porta));
  }
  return db;
}
