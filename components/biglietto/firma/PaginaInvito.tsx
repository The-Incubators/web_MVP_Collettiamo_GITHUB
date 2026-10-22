"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icona } from "@/components/ui";
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

  const bottone = "inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-cta px-8 text-[19px] font-bold text-on-cta shadow-sollevata hover:bg-cta-2";
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <div ref={rif} className="h-0 w-full" />
      <div className="flex w-full items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-ink-soft">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-cta" />
          Invito privato
        </span>
        {b.nFirme > 0 ? <p className="rounded-full bg-gold-field px-3 py-1 text-xs font-bold">{testoFirmatari(b.nFirme)}</p> : null}
      </div>
      <h1 className="font-display text-[36px] font-bold leading-tight tracking-tight text-accent-2">{b.nome}</h1>
      {b.messaggioGruppo ? (
        <div className="w-full rounded-3xl bg-surface p-4 text-left italic shadow-carta">
          <div className="max-w-full whitespace-normal break-words" dangerouslySetInnerHTML={{ __html: b.messaggioGruppo }} />
        </div>
      ) : null}
      <div className="w-full py-2">
        <Busta larghezza={Math.round(Math.min(larghezza, 420) * 0.72)}>
          <Copertina modello={modello} titolo={b.copertina.titolo} sottotitolo={b.copertina.sottotitolo} immagineUrl={b.copertina.immagineUrl} larghezza={Math.round(Math.min(larghezza, 420) * 0.72)} />
        </Busta>
      </div>
      {!chiuso ? (
        <p className="flex items-center gap-1.5 rounded-full bg-surface-2 px-4 py-2 text-xs font-semibold">
          <Icona nome="verified" dimensione={16} className="text-cta-2" />
          Gratis e senza registrazione. Ci metti meno di un minuto.
        </p>
      ) : null}
      {chiuso ? (
        <p className="rounded-3xl bg-surface-2 p-4 font-semibold">Questo biglietto è già stato consegnato.</p>
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
            className="min-h-tocco text-sm font-bold text-accent underline underline-offset-4"
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
    </div>
  );
}
