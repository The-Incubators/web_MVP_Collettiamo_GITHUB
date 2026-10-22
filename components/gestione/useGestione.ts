"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { ErroreDominio, eseguiOperazione, type Operazione } from "@/lib/dominio/operazioni";
import type { Colletta, Partecipante } from "@/lib/tipi";

export type EsitoCaricamento = "caricamento" | "ok" | "assente";

/**
 * Lo stato in tempo reale di una colletta per chi la organizza. Chi non è l'organizzatore viene rimandato
 * alla pagina pubblica senza messaggi allarmanti. Le azioni sono ottimistiche: l'interfaccia si aggiorna
 * subito e, se la scrittura fallisce, torna indietro con un avviso.
 */
export function useGestione(slug: string) {
  const { dati, utente } = useApp();
  const router = useRouter();
  const [colletta, setColletta] = useState<Colletta | null>(null);
  const [righe, setRighe] = useState<Partecipante[]>([]);
  const [carico, setCarico] = useState<EsitoCaricamento>("caricamento");
  const [avviso, setAvviso] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const ultimo = useRef({ colletta, righe });
  ultimo.current = { colletta, righe };

  useEffect(() => {
    if (!utente) return;
    let ricevuta = false;
    const a = dati.osservaColletta(
      slug,
      (c) => {
        ricevuta = true;
        setOffline(false);
        if (!c) return setCarico("assente");
        if (c.organizzatoreUid !== utente.uid) return router.replace(`/c/${slug}`);
        if (c.stato === "bozza") return router.replace(`/crea?bozza=${slug}`);
        setColletta(c);
        setCarico("ok");
      },
      () => {
        setOffline(true);
        // Una colletta altrui non si può leggere con le regole di accesso: si finisce comunque sulla pagina pubblica.
        if (!ricevuta) router.replace(`/c/${slug}`);
      },
    );
    const b = dati.osservaPartecipanti(
      slug,
      (r) => {
        setRighe(r);
        setOffline(false);
      },
      () => setOffline(true),
    );
    return () => {
      a();
      b();
    };
  }, [dati, slug, utente, router]);

  /** Un cambio di stato di una riga, ottimistico. */
  const azione = useCallback(
    async (pid: string, op: Operazione) => {
      if (!utente) return;
      const prima = ultimo.current;
      if (!prima.colletta) return;
      setAvviso(null);
      try {
        const r = eseguiOperazione(op, {
          colletta: prima.colletta,
          pid,
          riga: prima.righe.find((x) => x.id === pid) ?? null,
          causaliAltre: prima.righe.filter((x) => x.id !== pid).map((x) => x.causale),
          uid: utente.uid,
          ora: Date.now(),
        });
        setColletta({ ...prima.colletta, ...r.colletta });
        setRighe(() => {
          const mappa = new Map(prima.righe.map((x) => [x.id, x]));
          for (const { id, valore } of r.righe) {
            if (valore === null) mappa.delete(id);
            else mappa.set(id, valore);
          }
          return [...mappa.values()];
        });
      } catch (e) {
        setAvviso(e instanceof ErroreDominio ? e.message : "Non posso farlo adesso.");
        return;
      }
      try {
        await dati.esegui(slug, pid, op);
      } catch {
        setColletta(prima.colletta);
        setRighe(prima.righe);
        setAvviso("Non sono riuscito a salvare: ho annullato la modifica. Riprova fra poco.");
      }
    },
    [dati, slug, utente],
  );

  /** Modifica della colletta (ottimistica anch'essa). */
  const aggiorna = useCallback(
    async (patch: Partial<Colletta>) => {
      const prima = ultimo.current.colletta;
      if (!prima) return false;
      setAvviso(null);
      setColletta({ ...prima, ...patch });
      try {
        await dati.aggiornaColletta(slug, patch);
        return true;
      } catch {
        setColletta(prima);
        setAvviso("Non sono riuscito a salvare: ho annullato la modifica. Riprova fra poco.");
        return false;
      }
    },
    [dati, slug],
  );

  const aggiungiNome = useCallback(
    async (nome: string) => {
      setAvviso(null);
      try {
        await dati.aggiungiInvitati(slug, [nome]);
        return true;
      } catch {
        setAvviso("Non sono riuscito ad aggiungere il nome. Riprova.");
        return false;
      }
    },
    [dati, slug],
  );

  return { colletta, righe, carico, avviso, setAvviso, offline, azione, aggiorna, aggiungiNome, utente };
}
