// Chi può gestire il sito. L'indirizzo della pagina non è una protezione: l'accesso è riservato a un elenco
// di email (variabile ADMIN_EMAILS, separate da virgola) che il server controlla a ogni richiesta.
// Senza elenco, nessuno entra.

import { modalitaDati } from "../config";
import { authAdmin } from "../firebase/admin";

export function emailAmministratori(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * L'email dell'amministratore che fa la richiesta, o null se non è autorizzato.
 * Con Firebase: token di accesso nell'intestazione Authorization, con email verificata.
 * Senza Firebase (solo prove in locale): l'email dell'accesso finto, nell'intestazione x-email-prova.
 */
export async function amministratoreDa(richiesta: Request): Promise<string | null> {
  const consentite = emailAmministratori();
  if (consentite.length === 0) return null;

  let email: string | null = null;
  if (modalitaDati() === "memoria") {
    email = richiesta.headers.get("x-email-prova")?.trim().toLowerCase() ?? null;
  } else {
    const intestazione = richiesta.headers.get("authorization") ?? "";
    const token = intestazione.startsWith("Bearer ") ? intestazione.slice(7).trim() : "";
    if (!token) return null;
    try {
      const decodificato = await authAdmin().verifyIdToken(token);
      if (decodificato.email_verified !== true || !decodificato.email) return null;
      if (decodificato.firebase?.sign_in_provider === "anonymous") return null;
      email = decodificato.email.toLowerCase();
    } catch {
      return null;
    }
  }
  return email && consentite.includes(email) ? email : null;
}
