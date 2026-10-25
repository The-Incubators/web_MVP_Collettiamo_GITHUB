"use client";

import { useState } from "react";
import { Avviso, Bottone, Campo } from "@/components/ui";
import { ErroreDominio } from "@/lib/dominio/operazioni";
import type { Partecipante } from "@/lib/tipi";
import type { Partecipazione } from "./usePartecipazione";

const normalizza = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();

function messaggioErrore(e: unknown): string {
  return e instanceof ErroreDominio ? e.message : "Non sono riuscito a salvare. Controlla la connessione e riprova.";
}

export function PassoNome({ p, onFatto }: { p: Partecipazione; onFatto: (riga?: Partecipante) => void }) {
  const { colletta, righe, uid } = p;
  const [nome, setNome] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [occupato, setOccupato] = useState(false);
  const [ricerca, setRicerca] = useState("");
  const [cerco, setCerco] = useState(false);

  const liberi = (righe ?? []).filter((r) => r.stato === "invitato" && r.uidAnonimo === null);
  const trovati = ricerca.trim()
    ? (righe ?? []).filter((r) => r.uidAnonimo && r.uidAnonimo !== uid && normalizza(r.nome) === normalizza(ricerca))
    : [];

  async function conferma(azione: () => Promise<void>) {
    setErrore(null);
    setOccupato(true);
    try {
      await azione();
      onFatto();
    } catch (e) {
      setErrore(messaggioErrore(e));
      setOccupato(false);
    }
  }

  const aderisciConNome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErrore("Scrivi il tuo nome.");
      return;
    }
    void conferma(async () => p.esegui(await p.aspettaIdentita(), { tipo: "aderisci", nome }));
  };

  const rivendica = (riga: Partecipante) =>
    conferma(async () => {
      await p.aspettaIdentita();
      await p.esegui(riga.id, { tipo: "aderisci", nome: riga.nome, rivendica: riga.id });
    });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-[32px] font-bold leading-[38px] tracking-tight text-accent-2">Come ti chiami?</h2>
        <p className="text-ink-soft">{colletta.listaAperta ? "È l’unica cosa che ti chiediamo." : "Tocca il tuo nome nell’elenco."}</p>
      </div>

      {colletta.listaAperta ? (
        <form onSubmit={aderisciConNome} className="flex flex-col gap-4" noValidate>
          <Campo
            etichetta="Il tuo nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            autoComplete="given-name"
            autoFocus
            errore={errore}
          />
          <Bottone type="submit" pieno disabled={occupato}>
            {occupato ? "Un attimo…" : "Avanti"}
          </Bottone>
        </form>
      ) : (
        <div className="flex flex-col gap-3">
          {righe === null ? <p className="text-ink-soft">Carico l’elenco…</p> : null}
          {righe !== null && liberi.length === 0 ? (
            <Avviso>
              <p>Non vedo altri nomi liberi nell’elenco. Se manchi, chiedi a {colletta.organizzatoreNome} di aggiungerti.</p>
            </Avviso>
          ) : null}
          <ul className="flex flex-wrap gap-2">
            {liberi.map((r) => (
              <li key={r.id}>
                <Bottone variante="secondario" disabled={occupato} onClick={() => void rivendica(r)}>
                  {r.nome}
                </Bottone>
              </li>
            ))}
          </ul>
          {errore ? <Avviso tono="attenzione" live><p>{errore}</p></Avviso> : null}
        </div>
      )}

      <div className="border-t border-line pt-4">
        {cerco ? (
          <div className="flex flex-col gap-3">
            <Campo etichetta="Il nome con cui avevi partecipato" value={ricerca} onChange={(e) => setRicerca(e.target.value)} autoComplete="given-name" />
            {ricerca.trim() && trovati.length === 0 ? <p className="text-sm text-ink-soft">Non trovo nessuno con questo nome.</p> : null}
            {trovati.map((r) => (
              <div key={r.id} className="flex flex-col gap-2 rounded-2xl bg-surface-2 p-4">
                <p>Sei <strong>{r.nome}</strong>? Ha già partecipato con questo nome.</p>
                <Bottone variante="verde" dimensione="piccolo" disabled={occupato} onClick={() => void rivendica(r)}>
                  Sì, sono io
                </Bottone>
              </div>
            ))}
          </div>
        ) : (
          <button type="button" onClick={() => setCerco(true)} className="min-h-tocco text-sm font-semibold text-accent underline underline-offset-4">
            Hai già partecipato? Continua con il tuo nome
          </button>
        )}
      </div>
    </div>
  );
}
