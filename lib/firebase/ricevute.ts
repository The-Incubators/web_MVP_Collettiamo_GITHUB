// Caricamento della ricevuta su Firebase Storage. Importare solo in modalità "firestore" e con il bucket configurato.

import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { appFirebase } from "./client";

export const MAX_RICEVUTA_BYTE = 5 * 1024 * 1024;

export function storageConfigurato(): boolean {
  const b = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim().replace(/^"|"$/g, "");
  return !!b && b !== "INSERIRE";
}

export async function caricaRicevuta(slug: string, file: File): Promise<string> {
  if (file.size > MAX_RICEVUTA_BYTE) throw new Error("Il file è troppo grande (massimo 5 MB).");
  const nome = file.name.replace(/[^A-Za-z0-9._-]/g, "_").slice(-80);
  const r = ref(getStorage(appFirebase()), `ricevute/${slug}/${Date.now()}-${nome}`);
  await uploadBytes(r, file, { contentType: file.type });
  return getDownloadURL(r);
}
