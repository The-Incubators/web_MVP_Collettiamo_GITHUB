"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { emailValida, MAX_RUOLO } from "@/lib/dominio/biglietti";
import { useApi } from "@/lib/biglietti/client";
import { BottonePillola, CLASSI_INPUT } from "../comuni";
import { immaginePerServer, leggiBozzaFirma, scriviBozzaFirma, type BozzaFirma } from "./bozza";

/** I tuoi dati (spec 5.3, con S3): obbligatorio solo il nome, precompilato da «Da parte di». */
/** Scelte rapide per il ruolo: neutre, si possono correggere a mano. */
const RUOLI_SUGGERITI = ["Amicizia di sempre", "Collega", "Famiglia", "Dai tempi della scuola"];

export function PaginaDati({ slug }: { slug: string }) {
  const router = useRouter();
  const api = useApi();
  const [bozza, setBozza] = useState<BozzaFirma | null>(null);
  const [invio, setInvio] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const id = useId();

  useEffect(() => {
    const s = leggiBozzaFirma(slug);
    if (!s || !s.messaggioHtml) {
      router.replace(`/b/${slug}/firma`);
      return;
    }
    // le bozze salvate prima del campo «ruolo» non ce l'hanno
    const conRuolo = { ...s, ruolo: s.ruolo ?? "" };
    setBozza(conRuolo.nome ? conRuolo : { ...conRuolo, nome: conRuolo.daParteDi.trim().split(/\s+/)[0] ?? "" });
  }, [slug, router]);

  if (!bozza) return <p className="py-10 text-center text-ink-soft">Un momento…</p>;
  const cambia = (k: "nome" | "cognome" | "email" | "ruolo", v: string) => {
    const x = { ...bozza, [k]: v };
    setBozza(x);
    scriviBozzaFirma(slug, x);
  };
  const emailOk = !bozza.email.trim() || emailValida(bozza.email);
  const valido = !!bozza.nome.trim() && emailOk;

  async function invia() {
    if (!bozza || !valido) return;
    setInvio(true);
    setErrore(null);
    try {
      const r = await api<{ firmaId: string }>(`/api/b/${slug}/firma`, {
        metodo: "POST",
        firmatario: slug,
        corpo: { messaggioHtml: bozza.messaggioHtml, stile: bozza.stile, immagine: immaginePerServer(bozza.immagine), daParteDi: bozza.daParteDi, ruolo: bozza.ruolo, nome: bozza.nome, cognome: bozza.cognome, email: bozza.email },
      });
      scriviBozzaFirma(slug, null);
      router.push(`/b/${slug}/grazie?f=${r.firmaId}`);
    } catch (e) {
      setErrore(e instanceof Error ? e.message : "Non sono riuscito a salvare il messaggio. Riprova.");
      setInvio(false);
    }
  }

  const campo = CLASSI_INPUT;
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-display text-[32px] font-bold leading-[38px] tracking-tight text-accent-2">Come ti firmi?</h1>
        <p className="mt-1 text-ink-soft">Così chi organizza sa chi ha firmato.</p>
      </div>
      <div className="flex flex-col gap-4 rounded-3xl bg-surface shadow-carta p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor={`${id}-n`} className="text-sm font-bold">
              Nome
            </label>
            <input id={`${id}-n`} className={campo} value={bozza.nome} maxLength={60} autoComplete="given-name" onChange={(e) => cambia("nome", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`${id}-c`} className="text-sm font-bold">
              Cognome <span className="font-normal text-ink-soft">(facoltativo)</span>
            </label>
            <input id={`${id}-c`} className={campo} value={bozza.cognome} maxLength={60} autoComplete="family-name" onChange={(e) => cambia("cognome", e.target.value)} />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor={`${id}-r`} className="text-sm font-bold">
            Ruolo o parentela <span className="font-normal text-ink-soft">(facoltativo)</span>
          </label>
          <input
            id={`${id}-r`}
            className={campo}
            value={bozza.ruolo}
            maxLength={MAX_RUOLO}
            placeholder="Es. Amica del liceo"
            onChange={(e) => cambia("ruolo", e.target.value)}
            aria-describedby={`${id}-rh`}
          />
          <div className="flex flex-wrap gap-2" role="group" aria-label="Suggerimenti per il ruolo">
            {RUOLI_SUGGERITI.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={bozza.ruolo === r}
                onClick={() => cambia("ruolo", bozza.ruolo === r ? "" : r)}
                className={`min-h-10 rounded-full px-4 text-sm font-semibold ${bozza.ruolo === r ? "bg-accent text-on-accent" : "bg-surface-2"}`}
              >
                {r}
              </button>
            ))}
          </div>
          <p id={`${id}-rh`} className="text-xs text-ink-soft">
            Si vede sotto la tua firma, sul biglietto.
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-e`} className="text-sm font-bold">
            Email <span className="font-normal text-ink-soft">(facoltativa)</span>
          </label>
          <input id={`${id}-e`} type="email" inputMode="email" className={campo} value={bozza.email} maxLength={254} autoComplete="email" onChange={(e) => cambia("email", e.target.value)} aria-describedby={`${id}-eh`} />
          <p id={`${id}-eh`} className={`text-sm ${emailOk ? "text-ink-soft" : "font-semibold text-error"}`}>
            {emailOk ? "Lasciala se vuoi poter modificare il messaggio anche da un altro dispositivo." : "Controlla l’indirizzo email."}
          </p>
        </div>
      </div>
      <p className="text-center text-sm text-ink-soft">
        Usiamo questi dati solo per il biglietto: li vede chi lo organizza. Leggi{" "}
        <Link href="/privacy" className="font-bold text-accent underline underline-offset-4">
          come trattiamo i dati
        </Link>
        .
      </p>
      {errore ? (
        <p role="alert" className="text-center text-sm font-semibold text-error">
          {errore}
        </p>
      ) : null}
      <BottonePillola disabled={!valido || invio} onClick={() => void invia()}>
        {invio ? "Un momento…" : "Continua"}
      </BottonePillola>
    </div>
  );
}
