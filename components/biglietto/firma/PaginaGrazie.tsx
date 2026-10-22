"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { modelloPerId, MODELLI_BIGLIETTO } from "@/lib/dati/modelli-biglietto";
import { cambiaFirmatario } from "@/lib/biglietti/client";
import { linkWhatsApp } from "@/lib/dominio/messaggi";
import { baseUrlClient } from "@/lib/url";
import { BottoneCopia } from "@/components/ui";
import type { BigliettoPubblico, Firma } from "@/lib/tipi";
import { useLarghezza } from "../useLarghezza";
import { Visualizzatore } from "../Visualizzatore";

/** Conferma dopo la firma (spec 5.4, non osservata: ripiego indicato dalla specifica). */
export function PaginaGrazie({ b, firme, firmaId }: { b: BigliettoPubblico; firme: Firma[]; firmaId: string | null }) {
  const [rif, larghezza] = useLarghezza(420);
  const router = useRouter();
  const [url, setUrl] = useState("");
  useEffect(() => setUrl(`${baseUrlClient()}/b/${b.slug}`), [b.slug]);
  const modello = modelloPerId(b.copertina.modelloId) ?? MODELLI_BIGLIETTO[0];
  const messaggio = `Stiamo preparando un biglietto per ${b.festeggiato}: aggiungi anche tu il tuo messaggio, ci vuole un minuto. ${url}`;
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <p aria-hidden="true" className="text-4xl">
          🎉
        </p>
        <h1 className="font-display text-3xl font-medium">Fatto! Il tuo messaggio è sul biglietto</h1>
      </div>
      <div ref={rif} className="h-0 w-full" />
      <Visualizzatore
        modello={modello}
        titolo={b.copertina.titolo}
        sottotitolo={b.copertina.sottotitolo}
        immagineUrl={b.copertina.immagineUrl}
        firme={firme}
        colonne={b.colonne}
        larghezza={Math.min(larghezza, 420)}
        evidenziaId={firmaId}
      />
      <div className="flex flex-col gap-3">
        <Link href={`/b/${b.slug}/firma`} className="inline-flex min-h-14 items-center justify-center rounded-full border border-line bg-surface px-6 font-semibold hover:bg-surface-2">
          Modifica il messaggio
        </Link>
        <button
          type="button"
          onClick={() => {
            // stesso telefono, un'altra persona: la firma appena fatta resta dov'è
            cambiaFirmatario(b.slug);
            router.push(`/b/${b.slug}/firma`);
          }}
          className="inline-flex min-h-14 items-center justify-center rounded-full border border-line bg-surface px-6 font-semibold hover:bg-surface-2"
        >
          Firma anche tu da questo telefono
        </button>
        <div className="flex flex-col gap-3 rounded-contenitore border border-line bg-surface p-4">
          <h2 className="font-semibold">Condividi il link con chi manca</h2>
          <p className="break-all text-sm text-ink-soft">{url}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <BottoneCopia testo={url} etichetta="Copia il link" piccolo={false} />
            <a href={linkWhatsApp(messaggio)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-tocco items-center justify-center rounded-controllo bg-accent px-5 font-semibold text-on-accent hover:bg-accent-2">
              Apri WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
