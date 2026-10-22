"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { eseguiOperazione, type Operazione } from "@/lib/dominio/operazioni";
import { idVoto, votazioneScaduta } from "@/lib/dominio/votazione";
import type { Colletta, NuovaProposta, NuovoEvento, Partecipante, Proposta, Voto } from "@/lib/tipi";

export const UID_VISITATORE_DEMO = "visitatore-demo";

/**
 * Tutto ciò che serve alla pagina pubblica: l'identità anonima (in silenzio), la colletta e le righe
 * in tempo reale, e le azioni del partecipante. In modalità `simulato` (colletta dimostrativa)
 * le operazioni girano solo in locale e non scrivono nulla.
 */
export function usePartecipazione(iniziale: Colletta, righeIniziali: Partecipante[] | null, simulato: boolean) {
  const { dati, auth } = useApp();
  const slug = iniziale.slug;
  const [colletta, setColletta] = useState(iniziale);
  const [righe, setRighe] = useState<Partecipante[] | null>(simulato ? (righeIniziali ?? []) : null);
  const [uid, setUid] = useState<string | null>(simulato ? UID_VISITATORE_DEMO : null);
  const [offline, setOffline] = useState(false);
  const [proposte, setProposte] = useState<Proposta[]>([]);
  const [voti, setVoti] = useState<Voto[]>([]);
  /** voti appena dati, mostrati subito mentre la scrittura è in corso */
  const [votiLocali, setVotiLocali] = useState<Record<string, number>>({});
  const conVotazione = !!iniziale.votazione;
  const identita = useRef<Promise<string> | null>(null);
  const apertura = useRef(false);

  // Identità anonima: all'apertura, senza alcuna interfaccia.
  useEffect(() => {
    if (simulato) return;
    let attivo = true;
    const p = auth.assicuraIdentita().then((u) => {
      if (attivo) setUid(u.uid);
      return u.uid;
    });
    identita.current = p;
    p.catch(() => attivo && setOffline(true));
    return () => {
      attivo = false;
    };
  }, [auth, simulato]);

  // Tempo reale, appena l'identità è nota.
  useEffect(() => {
    if (!uid || simulato) return;
    const a = dati.osservaColletta(
      slug,
      (c) => {
        if (c) setColletta(c);
        setOffline(false);
      },
      () => setOffline(true),
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
  }, [dati, slug, uid, simulato]);

  // Proposte e voti, solo per le collette scelte con il voto.
  useEffect(() => {
    if (!uid || simulato || !conVotazione) return;
    const a = dati.osservaProposte(slug, setProposte, () => setOffline(true));
    const b = dati.osservaVoti(slug, setVoti, () => setOffline(true));
    return () => {
      a();
      b();
    };
  }, [dati, slug, uid, simulato, conVotazione]);

  // La votazione si chiude a tempo: non c'è un processo pianificato, la fa scattare chi è sulla pagina.
  const scade = colletta.votazione && !colletta.votazione.chiusa ? colletta.votazione.scade : null;
  useEffect(() => {
    if (simulato || scade === null) return;
    let attivo = true;
    const chiudi = async () => {
      try {
        await fetch("/api/votazione/chiudi", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug }) });
        const c = await dati.colletta(slug).catch(() => null);
        if (attivo && c) setColletta(c);
      } catch {
        /* si riprova al prossimo giro */
      }
    };
    const attesa = Math.max(0, scade - Date.now()) + 800;
    const t = setTimeout(function giro() {
      void chiudi().then(() => {
        if (attivo) setTimeout(giro, 15_000); // se non è chiusa ancora, ci si riprova
      });
    }, Math.min(attesa, 2_000_000_000));
    return () => {
      attivo = false;
      clearTimeout(t);
    };
  }, [dati, slug, scade, simulato]);

  // L'apertura della pagina: il primo passo dell'imbuto.
  useEffect(() => {
    if (!uid || simulato || apertura.current) return;
    apertura.current = true;
    void dati.registraEvento(slug, { tipo: "apertura", uidAnonimo: uid, partecipanteId: null, meta: {} }).catch(() => {});
  }, [dati, slug, uid, simulato]);

  const miaRiga = useMemo(() => (uid && righe ? (righe.find((r) => r.uidAnonimo === uid) ?? null) : null), [righe, uid]);

  const ricarica = useCallback(async () => {
    const [c, r] = await Promise.all([dati.colletta(slug), dati.partecipanti(slug)]);
    if (c) setColletta(c);
    setRighe(r);
  }, [dati, slug]);

  const eseguiLocale = useCallback(
    (pid: string, op: Operazione) => {
      const corrente = righe ?? [];
      const r = eseguiOperazione(op, {
        colletta,
        pid,
        riga: corrente.find((x) => x.id === pid) ?? null,
        causaliAltre: corrente.filter((x) => x.id !== pid).map((x) => x.causale),
        uid: UID_VISITATORE_DEMO,
        ora: Date.now(),
      });
      setColletta((c) => ({ ...c, ...r.colletta }));
      setRighe(() => {
        const mappa = new Map(corrente.map((x) => [x.id, x]));
        for (const { id, valore } of r.righe) {
          if (valore === null) mappa.delete(id);
          else mappa.set(id, valore);
        }
        return [...mappa.values()];
      });
    },
    [colletta, righe],
  );

  /** Un cambio di stato della propria riga (o la sua creazione). Lancia se non riesce. */
  const esegui = useCallback(
    async (pid: string, op: Operazione) => {
      if (simulato) return eseguiLocale(pid, op);
      if (identita.current) await identita.current;
      await dati.esegui(slug, pid, op);
      await ricarica().catch(() => {});
    },
    [simulato, eseguiLocale, dati, slug, ricarica],
  );

  const registra = useCallback(
    (e: NuovoEvento) => {
      if (simulato) return;
      void dati.registraEvento(slug, e).catch(() => {});
    },
    [simulato, dati, slug],
  );

  const vota = useCallback(
    async (propostaId: string, stelle: number) => {
      if (simulato) return;
      setVotiLocali((v) => ({ ...v, [propostaId]: stelle }));
      try {
        await aspettaIdentitaInterna();
        await dati.vota(slug, propostaId, stelle);
        void dati.registraEvento(slug, { tipo: "voto", uidAnonimo: uid, partecipanteId: null, meta: { stelle } }).catch(() => {});
      } catch (e) {
        setVotiLocali((v) => {
          const { [propostaId]: _scartato, ...resto } = v;
          void _scartato;
          return resto;
        });
        throw e;
      }
    },
    [dati, slug, uid, simulato],
  );
  const aspettaIdentitaInterna = async () => {
    if (identita.current) await identita.current;
  };

  const proponi = useCallback(
    async (p: NuovaProposta) => {
      if (simulato) return;
      await aspettaIdentitaInterna();
      await dati.aggiungiProposta(slug, p);
      void dati.registraEvento(slug, { tipo: "proposta", uidAnonimo: uid, partecipanteId: null, meta: {} }).catch(() => {});
      // in modalità memoria il sondaggio è lento: si rilegge subito
      setProposte(await dati.proposte(slug).catch(() => proposte));
    },
    [dati, slug, uid, simulato, proposte],
  );

  const rimuoviProposta = useCallback(
    async (id: string) => {
      if (simulato) return;
      await dati.rimuoviProposta(slug, id);
      setProposte((ps) => ps.filter((x) => x.id !== id));
    },
    [dati, slug, simulato],
  );

  /** Il voto di questa persona a una proposta (0 se non ha votato). */
  const mioVoto = useCallback(
    (propostaId: string): number => votiLocali[propostaId] ?? voti.find((v) => v.id === (uid ? idVoto(uid, propostaId) : ""))?.stelle ?? 0,
    [votiLocali, voti, uid],
  );

  /** L'identità, anche se la richiesta è ancora in corso. */
  const aspettaIdentita = useCallback(async (): Promise<string> => {
    if (simulato) return UID_VISITATORE_DEMO;
    if (uid) return uid;
    if (!identita.current) throw new Error("Identità non disponibile");
    return identita.current;
  }, [simulato, uid]);

  return { colletta, righe, uid, miaRiga, offline, esegui, registra, aspettaIdentita, proposte, voti, vota, proponi, rimuoviProposta, mioVoto, votazioneScadutaOra: () => votazioneScaduta(colletta, Date.now()) };
}

export type Partecipazione = ReturnType<typeof usePartecipazione>;
