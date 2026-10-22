"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useApp } from "./AppProvider";

/** Protegge le pagine di chi organizza: senza account si va a /accedi e poi si torna qui. */
export function SoloOrganizzatore({ children }: { children: ReactNode }) {
  const { utente, pronto } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (pronto && !utente) {
      const ritorno = window.location.pathname + window.location.search;
      router.replace(`/accedi?next=${encodeURIComponent(ritorno)}`);
    }
  }, [pronto, utente, router]);

  if (!pronto || !utente) {
    return (
      <p role="status" className="py-16 text-center text-ink-soft">
        Un momento…
      </p>
    );
  }
  return <>{children}</>;
}
