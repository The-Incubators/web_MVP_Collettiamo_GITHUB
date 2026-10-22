"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { modelloPerId, MODELLI_BIGLIETTO } from "@/lib/dati/modelli-biglietto";
import { cambiaFirmatario, useApi } from "@/lib/biglietti/client";
import type { BigliettoPubblico, Firma } from "@/lib/tipi";
import { Busta } from "../Busta";
import { Copertina } from "../Copertina";
import { useLarghezza } from "../useLarghezza";

export function testoFirmatari(n: number): string {
  return n === 1 ? "1 ha già firmato" : `${n} hanno già firmato`;
}

/** La pagina d'invito (spec 5.1): contatore, nome del biglietto, messaggio al gruppo, «Firma il biglietto», busta. */
export function PaginaInvito({ b, hrefFirma, onFirma }: { b: BigliettoPubblico; hrefFirma?: string; onFirma?: () => void }) {
  const [rif, larghezza] = useLarghezza(420);
  const router = useRouter();
  const api = useApi();
  const [mia, setMia] = useState<Firma | null>(null);
  const modello = modelloPerId(b.copertina.modelloId) ?? MODELLI_BIGLIETTO[0];
  const chiuso = b.stato !== "aperto";
  const anteprima = !!onFirma;

  // ho già firmato da questo dispositivo? Così non si riscrive per sbaglio sopra il proprio messaggio.
  useEffect(() => {
    if (anteprima || chiuso) return;
    api<{ firma: Firma | null }>(`/api/b/${b.slug}/mia-firma`, { firmatario: b.slug })
      .then(({ firma }) => setMia(firma))
      .catch(() => {});
  }, [anteprima, chiuso, api, b.slug]);

  const bottone = "inline-flex min-h-14 min-w-[200px] items-center justify-center rounded-full bg-accent px-8 font-semibold text-on-accent hover:bg-accent-2";
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <div ref={rif} className="h-0 w-full" />
      {b.nFirme > 0 ? <p className="self-end rounded-full bg-accent-field px-3 py-1 text-sm font-semibold text-accent-2">{testoFirmatari(b.nFirme)}</p> : null}
      <h1 className="font-display text-4xl font-medium leading-tight">{b.nome}</h1>
      {b.messaggioGruppo ? <div className="max-w-full whitespace-normal break-words text-ink-soft" dangerouslySetInnerHTML={{ __html: b.messaggioGruppo }} /> : null}
      {chiuso ? (
        <p className="rounded-contenitore bg-surface-2 p-4 font-semibold ring-1 ring-line">Questo biglietto è già stato consegnato.</p>
      ) : mia && hrefFirma ? (
        <div className="flex flex-col items-center gap-3">
          <p className="font-semibold">
            <span aria-hidden="true">✓ </span>Hai già firmato questo biglietto.
          </p>
          <Link href={hrefFirma} className={bottone}>
            Modifica il tuo messaggio
          </Link>
          <button
            type="button"
            onClick={() => {
              cambiaFirmatario(b.slug);
              router.push(hrefFirma);
            }}
            className="min-h-tocco text-sm font-semibold text-accent-2 underline underline-offset-4"
          >
            Sono un’altra persona: aggiungi la mia firma
          </button>
        </div>
      ) : onFirma ? (
        <button type="button" className={bottone} onClick={onFirma}>
          Firma il biglietto
        </button>
      ) : hrefFirma ? (
        <Link href={hrefFirma} className={bottone}>
          Firma il biglietto
        </Link>
      ) : null}
      <div className="mt-4 w-full">
        <Busta larghezza={Math.round(Math.min(larghezza, 420) * 0.72)}>
          <Copertina modello={modello} titolo={b.copertina.titolo} sottotitolo={b.copertina.sottotitolo} immagineUrl={b.copertina.immagineUrl} larghezza={Math.round(Math.min(larghezza, 420) * 0.72)} />
        </Busta>
      </div>
    </div>
  );
}
