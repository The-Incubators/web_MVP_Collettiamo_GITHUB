"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { leggiLocale, scriviLocale } from "@/lib/auth/tipi";
import { ErroreDominio } from "@/lib/dominio/operazioni";
import { MAX_REMINDER, oggiLocale, ripulisciElenco, validaReminder, type Reminder } from "@/lib/dominio/reminder";

const CHIAVE = "colletta.reminder";

function leggiLocali(): Reminder[] {
  try {
    return ripulisciElenco(JSON.parse(leggiLocale(CHIAVE) ?? "[]"), oggiLocale());
  } catch {
    return [];
  }
}

const scriviLocali = (elenco: Reminder[]) => scriviLocale(CHIAVE, elenco.length ? JSON.stringify(elenco) : null);

/**
 * I Reminder, come i preferiti: con un account stanno su Firestore (/utenti/{uid}/reminder) e li ritrovi
 * ovunque, e lì potranno partire le notifiche; senza account stanno nel browser. Accedendo, quelli del
 * browser passano all'account.
 */
export function useReminder() {
  const { dati, utente, pronto: autenticazionePronta } = useApp();
  const [elenco, setElenco] = useState<Reminder[]>([]);
  const [pronto, setPronto] = useState(false);
  const uid = utente?.uid ?? null;
  const uidRef = useRef(uid);
  uidRef.current = uid;
  const correnti = useRef(elenco);
  correnti.current = elenco;

  useEffect(() => {
    if (!autenticazionePronta) return;
    let attivo = true;
    setPronto(false);
    if (!uid) {
      setElenco(leggiLocali());
      setPronto(true);
      return;
    }
    (async () => {
      try {
        const remoti = await dati.reminder(uid);
        const locali = leggiLocali();
        const nuovi = locali.filter((l) => !remoti.some((r) => r.id === l.id));
        const salvati = await Promise.all(nuovi.map((r) => dati.salvaReminder(uid, r).then(() => r, () => null)));
        // il browser si svuota solo di quelli passati davvero all'account
        scriviLocali(nuovi.filter((_, i) => !salvati[i]));
        if (attivo) setElenco([...remoti, ...nuovi]);
      } catch {
        if (attivo) setElenco(leggiLocali());
      } finally {
        if (attivo) setPronto(true);
      }
    })();
    return () => {
      attivo = false;
    };
  }, [dati, uid, autenticazionePronta]);

  /** Crea o modifica una ricorrenza; lancia `ErroreDominio` con un messaggio da mostrare se non va. */
  const salva = useCallback(
    async (grezzo: Reminder) => {
      const r = validaReminder(grezzo, oggiLocale());
      const prima = correnti.current;
      const esiste = prima.some((x) => x.id === r.id);
      if (!esiste && prima.length >= MAX_REMINDER) throw new ErroreDominio("Hai raggiunto il numero massimo di ricorrenze.");
      const dopo = esiste ? prima.map((x) => (x.id === r.id ? r : x)) : [...prima, r];
      const u = uidRef.current;
      if (u) {
        try {
          await dati.salvaReminder(u, r);
        } catch (e) {
          throw e instanceof ErroreDominio ? e : new ErroreDominio("Non siamo riusciti a salvarla: riprova tra poco.");
        }
      } else {
        scriviLocali(dopo);
      }
      correnti.current = dopo;
      setElenco(dopo);
    },
    [dati],
  );

  const elimina = useCallback(
    async (id: string) => {
      const dopo = correnti.current.filter((x) => x.id !== id);
      const u = uidRef.current;
      if (u) {
        try {
          await dati.eliminaReminder(u, id);
        } catch {
          throw new ErroreDominio("Non siamo riusciti a eliminarla: riprova tra poco.");
        }
      } else {
        scriviLocali(dopo);
      }
      correnti.current = dopo;
      setElenco(dopo);
    },
    [dati],
  );

  return { elenco, pronto, conAccount: !!uid, autenticazionePronta, salva, elimina };
}
