"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useApp } from "./AppProvider";
import { leggiLocale, scriviLocale } from "@/lib/auth/tipi";

const CHIAVE = "colletta.preferiti";

function leggiLocali(): string[] {
  try {
    const dati = JSON.parse(leggiLocale(CHIAVE) ?? "[]");
    return Array.isArray(dati) ? dati.filter((x): x is string => typeof x === "string").slice(0, 200) : [];
  } catch {
    return [];
  }
}

interface Valore {
  /** gli slug dei prodotti preferiti */
  preferiti: ReadonlySet<string>;
  /** true quando l'elenco è stato letto (dal browser o dall'account) */
  pronto: boolean;
  /** true se i preferiti sono legati a un account e quindi li ritrovi su ogni dispositivo */
  conAccount: boolean;
  toggle: (slug: string) => void;
}

const Contesto = createContext<Valore | null>(null);

/**
 * I preferiti. Con un account (chi organizza) stanno su Firestore, in /utenti/{uid}/preferiti, e li ritrovi
 * su ogni dispositivo; senza account stanno nel browser. Accedendo, quelli del browser passano all'account.
 */
export function PreferitiProvider({ children }: { children: ReactNode }) {
  const { dati, utente, pronto: autenticazionePronta } = useApp();
  const [preferiti, setPreferiti] = useState<ReadonlySet<string>>(new Set());
  const [pronto, setPronto] = useState(false);
  const uid = utente?.uid ?? null;
  const uidRef = useRef(uid);
  uidRef.current = uid;

  useEffect(() => {
    if (!autenticazionePronta) return;
    let attivo = true;
    setPronto(false);
    if (!uid) {
      setPreferiti(new Set(leggiLocali()));
      setPronto(true);
      return;
    }
    (async () => {
      try {
        const remoti = await dati.preferiti(uid);
        const locali = leggiLocali();
        const nuovi = locali.filter((s) => !remoti.includes(s));
        // I preferiti messi da ospite passano all'account, poi il browser si svuota.
        await Promise.all(nuovi.map((s) => dati.impostaPreferito(uid, s, true).catch(() => {})));
        if (locali.length) scriviLocale(CHIAVE, null);
        if (attivo) setPreferiti(new Set([...remoti, ...nuovi]));
      } catch {
        if (attivo) setPreferiti(new Set(leggiLocali()));
      } finally {
        if (attivo) setPronto(true);
      }
    })();
    return () => {
      attivo = false;
    };
  }, [dati, uid, autenticazionePronta]);

  // L'elenco corrente, per calcolare il cambio fuori dall'aggiornamento di stato (che deve restare puro).
  const correnti = useRef<ReadonlySet<string>>(preferiti);
  correnti.current = preferiti;

  const toggle = useCallback(
    (slug: string) => {
      const prima = correnti.current;
      const aggiungi = !prima.has(slug);
      const dopo = new Set(prima);
      if (aggiungi) dopo.add(slug);
      else dopo.delete(slug);
      correnti.current = dopo;
      setPreferiti(dopo);

      const utenteCorrente = uidRef.current;
      if (utenteCorrente) {
        // ottimistico: se la scrittura fallisce si torna com'era
        dati.impostaPreferito(utenteCorrente, slug, aggiungi).catch(() => {
          const annullato = new Set(correnti.current);
          if (aggiungi) annullato.delete(slug);
          else annullato.add(slug);
          correnti.current = annullato;
          setPreferiti(annullato);
        });
      } else {
        scriviLocale(CHIAVE, dopo.size ? JSON.stringify([...dopo]) : null);
      }
    },
    [dati],
  );

  const valore = useMemo(() => ({ preferiti, pronto, conAccount: !!uid, toggle }), [preferiti, pronto, uid, toggle]);
  return <Contesto.Provider value={valore}>{children}</Contesto.Provider>;
}

export function usePreferiti(): Valore {
  const v = useContext(Contesto);
  if (!v) throw new Error("usePreferiti fuori da PreferitiProvider");
  return v;
}
