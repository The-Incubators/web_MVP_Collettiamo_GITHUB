"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { emailValida } from "@/lib/dominio/biglietti";
import { useApi } from "@/lib/biglietti/client";
import { BottonePillola } from "../comuni";
import { immaginePerServer, leggiBozzaFirma, scriviBozzaFirma, type BozzaFirma } from "./bozza";

/** I tuoi dati (spec 5.3, con S3): obbligatorio solo il nome, precompilato da «Da parte di». */
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
    setBozza(s.nome ? s : { ...s, nome: s.daParteDi.trim().split(/\s+/)[0] ?? "" });
  }, [slug, router]);

  if (!bozza) return <p className="py-10 text-center text-ink-soft">Un momento…</p>;
  const cambia = (k: "nome" | "cognome" | "email", v: string) => {
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
        corpo: { messaggioHtml: bozza.messaggioHtml, stile: bozza.stile, immagine: immaginePerServer(bozza.immagine), daParteDi: bozza.daParteDi, nome: bozza.nome, cognome: bozza.cognome, email: bozza.email },
      });
      scriviBozzaFirma(slug, null);
      router.push(`/b/${slug}/grazie?f=${r.firmaId}`);
    } catch (e) {
      setErrore(e instanceof Error ? e.message : "Non sono riuscito a salvare il messaggio. Riprova.");
      setInvio(false);
    }
  }

  const campo = "h-14 w-full rounded-controllo border border-line bg-surface px-4 text-base focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-display text-3xl font-medium">I tuoi dati</h1>
        <p className="mt-1 text-ink-soft">Così chi organizza sa chi ha firmato. Il messaggio lo puoi modificare da questo dispositivo finché il biglietto è aperto.</p>
      </div>
      <div className="flex flex-col gap-4 rounded-contenitore border border-line bg-surface p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor={`${id}-n`} className="text-sm font-medium">
              Nome
            </label>
            <input id={`${id}-n`} className={campo} value={bozza.nome} maxLength={60} autoComplete="given-name" onChange={(e) => cambia("nome", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`${id}-c`} className="text-sm font-medium">
              Cognome <span className="font-normal text-ink-soft">(facoltativo)</span>
            </label>
            <input id={`${id}-c`} className={campo} value={bozza.cognome} maxLength={60} autoComplete="family-name" onChange={(e) => cambia("cognome", e.target.value)} />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-e`} className="text-sm font-medium">
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
        <Link href="/privacy" className="font-semibold text-accent-2 underline underline-offset-4">
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
