"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { modelloPerId, MODELLI_BIGLIETTO } from "@/lib/dati/modelli-biglietto";
import { ripulisciHtml } from "@/lib/dominio/biglietti";
import { cambiaFirmatario, useApi } from "@/lib/biglietti/client";
import type { BigliettoPubblico, Firma } from "@/lib/tipi";
import type { Librerie } from "../FinestraImmagine";
import { useLarghezza } from "../useLarghezza";
import { Visualizzatore } from "../Visualizzatore";
import { testoFirmatari } from "./PaginaInvito";
import { BOZZA_VUOTA, leggiBozzaFirma, scriviBozzaFirma, urlAnteprima, type BozzaFirma } from "./bozza";
import { EditorFirma } from "./EditorFirma";

/** L'id della firma provvisoria mostrata nell'anteprima quando non si sta modificando una firma già salvata. */
const ID_BOZZA = "bozza-in-corso";

/**
 * La bozza com'è adesso, nella forma di una firma: così l'anteprima mostra il messaggio mentre si scrive,
 * con lo stesso stile, la stessa immagine e la stessa pulizia dell'HTML che farà il server al salvataggio.
 * Torna null se non c'è ancora niente da mostrare (né testo né immagine).
 */
function firmaProvvisoria(b: BozzaFirma, mia: Firma | null): Firma | null {
  const html = ripulisciHtml(b.messaggioHtml);
  const testo = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  if (!testo && !b.immagine) return null;
  const i = b.immagine;
  const ora = Date.now();
  return {
    id: mia?.id ?? ID_BOZZA,
    uid: mia?.uid ?? "",
    messaggioHtml: html,
    stile: b.stile,
    immagine: i ? { tipo: i.tipo === "mantieni" ? "caricata" : i.tipo, url: urlAnteprima(i), larghezza: i.larghezza, altezza: i.altezza, attribuzione: ("attribuzione" in i ? i.attribuzione : null) ?? null } : null,
    daParteDi: b.daParteDi.trim() || "…",
    ruolo: b.ruolo?.trim() || null,
    nome: b.nome,
    cognome: null,
    email: null,
    nascosta: false,
    creatoIl: mia?.creatoIl ?? ora,
    aggiornatoIl: ora,
  };
}

function bozzaDaFirma(f: Firma): BozzaFirma {
  return {
    messaggioHtml: f.messaggioHtml,
    stile: f.stile,
    immagine: f.immagine ? { tipo: "mantieni", url: f.immagine.url, larghezza: f.immagine.larghezza, altezza: f.immagine.altezza, attribuzione: f.immagine.attribuzione } : null,
    daParteDi: f.daParteDi,
    nome: f.nome,
    cognome: f.cognome ?? "",
    ruolo: f.ruolo ?? "",
    email: f.email ?? "",
    modifica: true,
  };
}

/** La firma (spec 5.2): il biglietto aperto sulla pagina dove finirà il messaggio, e l'editor. */
export function PaginaFirma({
  b,
  firme,
  librerie,
  anteprima,
  onContinuaAnteprima,
}: {
  b: BigliettoPubblico;
  firme: Firma[];
  librerie: Librerie;
  /** nell'anteprima dell'organizzatore: niente rete, «Continua» non salva */
  anteprima?: boolean;
  onContinuaAnteprima?: () => void;
}) {
  const router = useRouter();
  const api = useApi();
  const [bozza, setBozza] = useState<BozzaFirma | null>(anteprima ? BOZZA_VUOTA : null);
  const [mia, setMia] = useState<Firma | null>(null);
  const [rif, larghezza] = useLarghezza(420);
  const rifAnteprima = useRef<HTMLDivElement>(null);
  const modello = modelloPerId(b.copertina.modelloId) ?? MODELLI_BIGLIETTO[0];

  // la firma già fatta da questo dispositivo (si modifica, non si duplica), e la bozza lasciata a metà
  const carica = useCallback(() => {
    api<{ firma: Firma | null }>(`/api/b/${b.slug}/mia-firma`, { firmatario: b.slug })
      .then(({ firma: f }) => {
        setMia(f);
        const s = leggiBozzaFirma(b.slug);
        setBozza(s ?? (f ? bozzaDaFirma(f) : BOZZA_VUOTA));
      })
      .catch(() => setBozza((x) => x ?? leggiBozzaFirma(b.slug) ?? BOZZA_VUOTA));
  }, [api, b.slug]);

  useEffect(() => {
    if (!anteprima) carica();
  }, [anteprima, carica]);

  const cambia = (x: BozzaFirma) => {
    setBozza(x);
    if (!anteprima) scriviBozzaFirma(b.slug, x);
  };

  /** Su un dispositivo condiviso: da qui in poi firma un'altra persona, senza toccare la firma di prima. */
  function altraPersona() {
    cambiaFirmatario(b.slug);
    scriviBozzaFirma(b.slug, null);
    setMia(null);
    setBozza(BOZZA_VUOTA);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // l'anteprima segue la scrittura, ma con un filo di ritardo: così non si rimpagina a ogni tasto
  const [bozzaLenta, setBozzaLenta] = useState<BozzaFirma | null>(bozza);
  useEffect(() => {
    const t = setTimeout(() => setBozzaLenta(bozza), 250);
    return () => clearTimeout(t);
  }, [bozza]);

  // la propria firma resta visibile sul biglietto, evidenziata: così non sembra sparita mentre si modifica.
  // Finché si scrive, al suo posto (o in fondo) va la bozza in corso, come firma provvisoria.
  const provvisoria = useMemo(() => (bozzaLenta ? firmaProvvisoria(bozzaLenta, mia) : null), [bozzaLenta, mia]);
  const perId = useMemo(() => new Map(firme.map((f) => [f.id, f])), [firme]);
  const tutte = useMemo(() => {
    const propria = provvisoria ?? mia;
    if (!propria) return firme;
    return perId.has(propria.id) ? firme.map((f) => (f.id === propria.id ? propria : f)) : [...firme, propria];
  }, [firme, mia, perId, provvisoria]);

  if (b.stato !== "aperto") {
    return <p className="rounded-3xl bg-surface-2 p-4 text-center font-semibold">Questo biglietto è già stato consegnato.</p>;
  }

  const modifica = !!mia;
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-display text-[32px] font-bold leading-[38px] tracking-tight text-accent-2">{modifica ? "Il tuo messaggio" : "Firma il biglietto"}</h1>
        <p className="mt-1 text-ink-soft">{modifica ? "Puoi cambiarlo quando vuoi, finché il biglietto è aperto." : "Scrivi un messaggio e aggiungi una foto qui sotto."}</p>
        {!modifica && b.nFirme > 0 ? <p className="mt-2 text-sm font-semibold text-accent-2">{testoFirmatari(b.nFirme)}</p> : null}
      </div>
      {bozza ? (
        <EditorFirma
          bozza={bozza}
          onBozza={cambia}
          librerie={librerie}
          occasione={b.occasione}
          testoContinua={modifica ? "Salva le modifiche" : "Conferma e salva la tua firma"}
          onAnteprima={() => rifAnteprima.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          intestazione={
            modifica ? (
              <div className="flex flex-col items-start gap-2 border-b border-line bg-accent-field px-4 py-3">
                <p className="text-sm font-semibold">
                  <span aria-hidden="true">✓ </span>Hai già firmato questo biglietto: qui sotto c’è il tuo messaggio.
                </p>
                <button type="button" onClick={altraPersona} className="min-h-tocco text-sm font-semibold text-accent-2 underline underline-offset-4">
                  Non sei tu? Aggiungi un’altra firma
                </button>
              </div>
            ) : null
          }
          onContinua={() => {
            if (anteprima) onContinuaAnteprima?.();
            else router.push(`/b/${b.slug}/i-tuoi-dati`);
          }}
        />
      ) : (
        <p className="text-center text-ink-soft">Un momento…</p>
      )}

      {/* l'anteprima del biglietto sta sotto l'editor: prima si scrive, poi si guarda com'è venuto */}
      <div ref={rifAnteprima} className="flex scroll-mt-24 flex-col gap-3">
        <h2 className="text-center font-display text-xl font-bold text-accent-2">Anteprima del biglietto</h2>
        <div ref={rif} className="h-0 w-full" />
        <Visualizzatore
          modello={modello}
          titolo={b.copertina.titolo}
          sottotitolo={b.copertina.sottotitolo}
          immagineUrl={b.copertina.immagineUrl}
          firme={tutte}
          colonne={b.colonne}
          larghezza={Math.min(larghezza, 420)}
          bordoPaginaFirma={!modifica && !provvisoria}
          evidenziaId={provvisoria?.id ?? (modifica ? (mia?.id ?? null) : null)}
        />
      </div>
    </div>
  );
}
