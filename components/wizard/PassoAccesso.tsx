"use client";

import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import { CampoModulo, Input } from "@/components/ui";
import { CHIAVE_DOPO_ACCESSO, scriviLocale } from "@/lib/auth/tipi";

/** Il logo di Google a colori, come nel prototipo (`.btn-google`). */
function LogoGoogle() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path fill="#4285F4" d="M22 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.6a4.8 4.8 0 0 1-2 3.1v2.6h3.3c1.9-1.8 3.1-4.4 3.1-7.5Z" />
      <path fill="#34A853" d="M12 22c2.8 0 5.1-.9 6.8-2.5l-3.3-2.6c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.8v2.7A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.2 13.6a6 6 0 0 1 0-3.8V7.1H2.8a10 10 0 0 0 0 9.2l3.4-2.7Z" />
      <path fill="#EA4335" d="M12 6c1.5 0 2.9.5 4 1.5l3-3A10 10 0 0 0 2.8 7.1l3.4 2.7C7 7.8 9.3 6 12 6Z" />
    </svg>
  );
}

/**
 * Passo 6 (prototipi/crea.html; D-13, spec §7.2): l'accesso si chiede solo qui. Con Google o con il collegamento via
 * email; il lavoro resta salvato nel browser e, appena c'è l'account, il wizard crea il gruppo da solo. Il collegamento
 * via email apre /accedi, che poi riporta qui (`CHIAVE_DOPO_ACCESSO`).
 */
export function PassoAccesso() {
  const { auth } = useApp();
  const [email, setEmail] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [erroreGoogle, setErroreGoogle] = useState<string | null>(null);
  const [inviata, setInviata] = useState<string | null>(null);
  const [occupato, setOccupato] = useState(false);

  async function google() {
    setErroreGoogle(null);
    setOccupato(true);
    scriviLocale(CHIAVE_DOPO_ACCESSO, "/crea");
    try {
      await auth.accediConGoogle();
    } catch {
      setErroreGoogle("Accesso con Google non riuscito. Riprova.");
    } finally {
      setOccupato(false);
    }
  }

  async function mandaLink(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setErrore("Controlla l'indirizzo email.");
      return;
    }
    setErrore(null);
    setOccupato(true);
    scriviLocale(CHIAVE_DOPO_ACCESSO, "/crea");
    try {
      const { accessoImmediato } = await auth.inviaLinkEmail(email, "");
      if (!accessoImmediato) setInviata(email.trim());
    } catch {
      setErrore("Non sono riuscito a mandare il collegamento. Riprova fra poco.");
    } finally {
      setOccupato(false);
    }
  }

  if (inviata) {
    return (
      <div className="accesso" role="status">
        <p className="t-titolo">Controlla la posta</p>
        <p>
          Ti abbiamo scritto a <strong>{inviata}</strong>. Apri il collegamento da questo dispositivo per entrare.
        </p>
      </div>
    );
  }

  return (
    <form className="accesso" onSubmit={mandaLink} noValidate>
      <button type="button" className="btn btn-google" onClick={() => void google()} disabled={occupato}>
        <LogoGoogle />
        Accedi con Google
      </button>
      {erroreGoogle ? (
        <p className="errore-testo" role="alert">
          {erroreGoogle}
        </p>
      ) : null}
      <p className="oppure">oppure</p>
      <CampoModulo id="email" etichetta="La tua email" errore={errore ?? undefined}>
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="nome@esempio.it"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          errore={!!errore}
          aria-describedby={errore ? "email-errore" : undefined}
        />
      </CampoModulo>
      <button type="submit" className="btn btn-contorno" disabled={occupato} aria-busy={occupato || undefined}>
        Mandami il link per accedere
      </button>
    </form>
  );
}
