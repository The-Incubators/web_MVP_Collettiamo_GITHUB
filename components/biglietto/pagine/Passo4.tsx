"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { BloccoInvito } from "@/components/BloccoInvito";
import { BottoneGoogle } from "@/components/BottoneGoogle";
import { classiBottone } from "@/components/ui/Bottone";
import { ErroreApi } from "@/lib/biglietti/client";
import { messaggioInvitoBiglietto, vistaPubblica } from "@/lib/dominio/biglietti";
import { baseUrlClient } from "@/lib/url";
import type { Biglietto } from "@/lib/tipi";
import { Finestra, IntestazioneWizard } from "../comuni";
import type { Librerie } from "../FinestraImmagine";
import { PaginaFirma } from "../firma/PaginaFirma";
import { PaginaInvito } from "../firma/PaginaInvito";
import { StatoBozza } from "../StatoBozza";
import { useBozza } from "../useBozza";
import { ModuloDettagli } from "./Passo2";

/** Il carosello «Ecco cosa vedrà il gruppo»: le vere schermate di chi firma, in anteprima (niente scritture). */
function CaroselloAnteprima({ b, librerie }: { b: Biglietto; librerie: Librerie }) {
  const [i, setI] = useState(0);
  // in anteprima il biglietto si mostra come sarà una volta aperto
  const vista = { ...vistaPubblica(b), stato: "aperto" as const };
  const freccia = "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface text-xl shadow disabled:opacity-30";
  return (
    <section aria-roledescription="carosello" aria-label="Ecco cosa vedrà il gruppo" className="bg-accent-field py-6">
      <div className="gutter mx-auto flex max-w-[600px] flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <button type="button" className={freccia} onClick={() => setI(0)} disabled={i === 0} aria-label="Schermata precedente">
            ‹
          </button>
          <h2 className="text-center font-display text-2xl font-bold text-accent-2">Ecco cosa vedrà il gruppo</h2>
          <button type="button" className={freccia} onClick={() => setI(1)} disabled={i === 1} aria-label="Schermata successiva">
            ›
          </button>
        </div>
        <p className="text-center text-sm text-ink-soft" aria-live="polite">
          {i === 0 ? "1 di 2 · L’invito" : "2 di 2 · La firma"}
        </p>
        {/* cornice che simula un telefono: angoli superiori arrotondati */}
        <div className="mx-auto w-full max-w-[420px] overflow-hidden rounded-t-[28px] border-x-[6px] border-t-[6px] border-ink/80 bg-field shadow-xl">
          <div className="pointer-events-auto max-h-[720px] overflow-y-auto px-4 pb-6 pt-4">
            {i === 0 ? <PaginaInvito b={vista} onFirma={() => setI(1)} /> : <PaginaFirma b={vista} firme={[]} librerie={librerie} anteprima onContinuaAnteprima={() => setI(0)} />}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Passo 4 — Anteprima e pubblicazione (spec 4.4). */
export function Passo4({ id, librerie }: { id: string; librerie: Librerie }) {
  const router = useRouter();
  const { b, setB, stato, api } = useBozza(id);
  const { utente, auth, modalita } = useApp();
  const [dettagli, setDettagli] = useState(false);
  const [accesso, setAccesso] = useState(false);
  const [condividi, setCondividi] = useState(false);
  const [invio, setInvio] = useState(false);
  const [errore, setErrore] = useState<{ testo: string; data?: boolean } | null>(null);
  const [url, setUrl] = useState("");
  const inAttesa = useRef(false);

  useEffect(() => {
    if (b?.slug) setUrl(`${baseUrlClient()}/b/${b.slug}`);
  }, [b?.slug]);

  async function pubblica() {
    if (!b) return;
    setErrore(null);
    if (!utente) {
      // si chiede l'accesso solo ora; dopo, il flusso riprende da qui senza perdere la bozza
      inAttesa.current = true;
      setAccesso(true);
      return;
    }
    setInvio(true);
    try {
      const r = await api<{ biglietto: Biglietto }>(`/api/biglietti/${id}/pubblica`, { metodo: "POST", bigliettoId: id, corpo: { nome: utente.nome } });
      setB(r.biglietto);
      setCondividi(true);
    } catch (e) {
      if (e instanceof ErroreApi && e.dati.motivo === "accesso") {
        inAttesa.current = true;
        setAccesso(true);
      } else if (e instanceof ErroreApi && e.dati.motivo === "data") {
        setErrore({ testo: "La data di consegna è già passata: scegline un’altra prima di pubblicare.", data: true });
      } else setErrore({ testo: e instanceof Error ? e.message : "Non sono riuscito a pubblicare. Riprova." });
    } finally {
      setInvio(false);
    }
  }

  // appena l'accesso riesce, la pubblicazione riparte da sola
  useEffect(() => {
    if (utente && inAttesa.current) {
      inAttesa.current = false;
      setAccesso(false);
      void pubblica();
    }
  }, [utente]); // eslint-disable-line react-hooks/exhaustive-deps

  async function accedi() {
    try {
      await auth.accediConGoogle();
    } catch {
      setErrore({ testo: "Accesso con Google non riuscito. Riprova." });
    }
  }

  return (
    <>
      <IntestazioneWizard indietro={`/biglietto/${id}/design`} titolo="Anteprima" />
      {!b ? (
        <main className="gutter">
          <StatoBozza stato={stato === "ok" ? "carica" : stato} />
        </main>
      ) : !b.slug || !b.copertina.modelloId ? (
        <main className="gutter mx-auto flex max-w-[600px] flex-col items-center gap-4 py-16 text-center">
          <p>Mancano ancora alcuni dati del biglietto.</p>
          <Link href={b.slug ? `/biglietto/${id}/design` : `/biglietto/${id}/dettagli`} className={classiBottone("primario")}>
            Completa il biglietto
          </Link>
        </main>
      ) : (
        <main className="flex flex-col gap-0 pb-16">
          <div className="gutter mx-auto flex w-full max-w-[600px] items-center justify-between gap-3 py-4">
            <button type="button" onClick={() => setDettagli(true)} className="min-h-tocco text-sm font-semibold underline underline-offset-4">
              Modifica i dettagli
            </button>
            <button type="button" onClick={() => void pubblica()} disabled={invio} className="inline-flex min-h-12 items-center rounded-full bg-cta px-5 text-[19px] font-bold text-on-cta shadow-sollevata hover:bg-cta-2 disabled:opacity-60">
              {invio ? "Un momento…" : b.stato === "bozza" ? "Pubblica e condividi" : "Condividi"}
            </button>
          </div>
          {errore ? (
            <div role="alert" className="gutter mx-auto mb-4 flex w-full max-w-[600px] flex-col gap-2">
              <p className="rounded-controllo bg-error-field p-3 text-sm font-semibold text-error">{errore.testo}</p>
              {errore.data ? (
                <button type="button" onClick={() => router.push(`/biglietto/${id}/dettagli`)} className={classiBottone("secondario", "piccolo", "self-start")}>
                  Cambia la data
                </button>
              ) : null}
            </div>
          ) : null}
          <CaroselloAnteprima b={b} librerie={librerie} />
        </main>
      )}

      <Finestra aperta={dettagli} onChiudi={() => setDettagli(false)} titolo="Modifica i dettagli" larga>
        {b ? (
          <ModuloDettagli
            b={b}
            testoBottone="Salva"
            chiaveSessione={`colletta.biglietto.${id}.dettagli`}
            onSalvato={(x) => {
              setB(x);
              setDettagli(false);
              setErrore(null);
            }}
          />
        ) : null}
      </Finestra>

      <Finestra aperta={accesso} onChiudi={() => ((inAttesa.current = false), setAccesso(false))} titolo="Accedi per continuare">
        <div className="flex flex-col items-center gap-4 text-center">
          <p>Per pubblicare il biglietto serve un account: così potrai gestirlo anche da un altro dispositivo. La bozza resta com’è.</p>
          <BottoneGoogle onClick={() => void accedi()} />
          {modalita === "memoria" ? <p className="text-xs text-ink-soft">Senza Firebase l’accesso è finto e immediato.</p> : null}
        </div>
      </Finestra>

      <Finestra aperta={condividi} onChiudi={() => setCondividi(false)} titolo="Il tuo biglietto è pronto da condividere" larga>
        {b ? (
          <div className="flex flex-col gap-5">
            <BloccoInvito url={url} messaggio={messaggioInvitoBiglietto(b, url)} />
            <Link href={`/biglietto/${id}/gestisci`} className={classiBottone("secondario", "normale", "w-full")}>
              Vai alla gestione
            </Link>
          </div>
        ) : null}
      </Finestra>
    </>
  );
}
