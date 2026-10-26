"use client";

import { useCallback } from "react";
import { useApp } from "@/components/AppProvider";

/**
 * Le intestazioni per le rotte /api/admin: il token di accesso con Firebase, l'email dell'accesso finto nelle
 * prove in locale. Il server controlla comunque l'elenco ADMIN_EMAILS a ogni richiesta.
 */
export function useIntestazioniAdmin(): () => Promise<Record<string, string>> {
  const { auth, utente, modalita } = useApp();
  return useCallback(async (): Promise<Record<string, string>> => {
    if (modalita === "memoria") return { "x-email-prova": utente?.email ?? "" };
    const token = await auth.token();
    return token ? { authorization: `Bearer ${token}` } : {};
  }, [auth, modalita, utente?.email]);
}
