"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { creaAutenticazioneClient } from "@/lib/auth/client";
import type { Autenticazione, Utente } from "@/lib/auth/tipi";
import type { Modalita } from "@/lib/config";
import { creaDatiClient } from "@/lib/dati/client";
import type { Dati } from "@/lib/dati/tipi";

interface Valore {
  modalita: Modalita;
  dati: Dati;
  auth: Autenticazione;
  /** chi organizza, se ha un account; null se nessuno (o se la persona è anonima) */
  utente: Utente | null;
  /** false finché lo stato di accesso non è noto */
  pronto: boolean;
}

const Contesto = createContext<Valore | null>(null);

export function AppProvider({ modalita, children }: { modalita: Modalita; children: ReactNode }) {
  const dati = useMemo(() => creaDatiClient(modalita), [modalita]);
  const auth = useMemo(() => creaAutenticazioneClient(modalita), [modalita]);
  const [utente, setUtente] = useState<Utente | null>(null);
  const [pronto, setPronto] = useState(false);

  useEffect(
    () =>
      auth.osserva((u) => {
        setUtente(u);
        setPronto(true);
      }),
    [auth],
  );

  // Alla prima autenticazione di chi organizza si crea /utenti/{uid}.
  const uid = utente?.uid;
  useEffect(() => {
    if (utente) void dati.salvaUtente({ uid: utente.uid, nome: utente.nome, email: utente.email }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, dati]);

  const valore = useMemo(() => ({ modalita, dati, auth, utente, pronto }), [modalita, dati, auth, utente, pronto]);
  return <Contesto.Provider value={valore}>{children}</Contesto.Provider>;
}

export function useApp(): Valore {
  const v = useContext(Contesto);
  if (!v) throw new Error("useApp fuori da AppProvider");
  return v;
}
