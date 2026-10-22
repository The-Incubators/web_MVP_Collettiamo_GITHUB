"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useApp } from "./AppProvider";
import { BottoneGoogle } from "./BottoneGoogle";
import { Avviso, Bottone, Campo } from "./ui";
import { leggiLocale, scriviLocale } from "@/lib/auth/tipi";

const CHIAVE_DOPO = "colletta.dopoAccesso";

function destinazioneSicura(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/crea";
}

export function FormAccesso() {
  const { auth, utente, pronto, modalita } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [inviata, setInviata] = useState(false);
  const [occupato, setOccupato] = useState(false);
  const controllato = useRef(false);

  const dopo = destinazioneSicura(params.get("next") ?? leggiLocale(CHIAVE_DOPO));

  // Se si arriva da un collegamento ricevuto via email, si completa l'accesso.
  useEffect(() => {
    if (controllato.current) return;
    controllato.current = true;
    auth
      .completaLinkEmail(window.location.href)
      .then((u) => {
        if (u) router.replace(destinazioneSicura(leggiLocale(CHIAVE_DOPO)));
      })
      .catch(() => setErrore("Il collegamento non è più valido. Chiedine uno nuovo."));
  }, [auth, router]);

  useEffect(() => {
    if (pronto && utente) {
      scriviLocale(CHIAVE_DOPO, null);
      router.replace(dopo);
    }
  }, [pronto, utente, router, dopo]);

  async function invia(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setErrore("Controlla l'indirizzo email.");
      return;
    }
    setErrore(null);
    setOccupato(true);
    scriviLocale(CHIAVE_DOPO, dopo);
    try {
      const { accessoImmediato } = await auth.inviaLinkEmail(email, nome);
      if (!accessoImmediato) setInviata(true);
    } catch {
      setErrore("Non sono riuscito a mandare il collegamento. Riprova fra poco.");
    } finally {
      setOccupato(false);
    }
  }

  async function google() {
    setErrore(null);
    setOccupato(true);
    scriviLocale(CHIAVE_DOPO, dopo);
    try {
      await auth.accediConGoogle(nome);
    } catch {
      setErrore("Accesso con Google non riuscito. Riprova.");
    } finally {
      setOccupato(false);
    }
  }

  const campoNome = (
    <Campo
      etichetta="Come ti chiami? (facoltativo)"
      autoComplete="given-name"
      value={nome}
      onChange={(e) => setNome(e.target.value)}
      suggerimento="Lo vedranno i partecipanti."
    />
  );

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <h1 className="text-center text-3xl">Accedi per organizzare la colletta</h1>

      {modalita === "firestore" ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-3">
            <BottoneGoogle onClick={() => void google()} disabled={occupato} />
            {errore ? (
              <p role="alert" className="text-center text-sm font-semibold text-error before:mr-1 before:content-['⚠']">
                {errore}
              </p>
            ) : null}
          </div>
          {campoNome}
        </div>
      ) : inviata ? (
        <Avviso tono="positivo" titolo="Controlla la posta" live>
          <p>
            Ti abbiamo scritto a <strong>{email}</strong>. Apri il collegamento da questo dispositivo per entrare.
          </p>
        </Avviso>
      ) : (
        // Senza Firebase (solo prove in locale) l'accesso è finto e immediato, con un indirizzo qualsiasi.
        <form onSubmit={invia} className="flex flex-col gap-4" noValidate>
          <Avviso>
            <p>Senza Firebase l’accesso è immediato e finto: nessuna email viene inviata.</p>
          </Avviso>
          <Campo etichetta="La tua email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} errore={errore} />
          {campoNome}
          <Bottone type="submit" pieno disabled={occupato}>
            Entra
          </Bottone>
          <div className="flex justify-center">
            <BottoneGoogle onClick={() => void google()} disabled={occupato} />
          </div>
        </form>
      )}
    </div>
  );
}
