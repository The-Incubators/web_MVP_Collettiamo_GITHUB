"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  GAP_RIQUADRI,
  impaginaMessaggi,
  larghezzaColonna,
  numeroPagine,
  primaPaginaConSpazio,
  type MisuraRiquadro,
} from "@/lib/dominio/biglietto";
import { useFontBiglietto } from "./useFontBiglietto";
import type { Firma, ModelloBiglietto } from "@/lib/tipi";
import { Copertina } from "./Copertina";
import { PaginaMessaggi } from "./PaginaMessaggi";
import { RiquadroMessaggio } from "./RiquadroMessaggio";

/**
 * Sfoglia il biglietto una pagina alla volta: copertina, poi le pagine dei messaggi, impaginate da sole misurando
 * i riquadri (una sola fonte di impaginazione, sezione 11). Frecce, tasti freccia e scorrimento a dito.
 */
export function Visualizzatore({
  modello,
  titolo,
  sottotitolo,
  firme,
  colonne,
  larghezza,
  paginaIniziale = 0,
  bordoPaginaFirma,
  immagineUrl,
  evidenziaId,
}: {
  modello: ModelloBiglietto;
  titolo: string;
  sottotitolo?: string | null;
  immagineUrl?: string | null;
  /** il messaggio da evidenziare (es. quello appena firmato): il visualizzatore si apre sulla sua pagina */
  evidenziaId?: string | null;
  firme: Firma[];
  colonne: 1 | 2 | 3;
  larghezza: number;
  /** pagina da mostrare all'apertura, 0-based (0 = copertina) */
  paginaIniziale?: number;
  /**
   * Pagina della firma: si apre sulla prima pagina con spazio (dove finirà il nuovo messaggio, anche vuota se
   * non ci sono ancora messaggi) e la evidenzia con un bordo accento. Ignora paginaIniziale.
   */
  bordoPaginaFirma?: boolean;
}) {
  useFontBiglietto(useMemo(() => firme.map((f) => f.stile.font), [firme]));
  const firmePerId = useMemo(() => new Map(firme.map((f) => [f.id, f])), [firme]);
  const misuratore = useRef<HTMLDivElement>(null);
  const [misure, setMisure] = useState<MisuraRiquadro[] | null>(null);

  // Misura l'altezza logica di ogni riquadro (alla larghezza logica della colonna), poi impagina.
  const misura = useCallback(() => {
    const cont = misuratore.current;
    if (!cont) return;
    const out: MisuraRiquadro[] = firme.map((f) => {
      const el = cont.querySelector<HTMLElement>(`[data-id="${CSS.escape(f.id)}"]`);
      return { id: f.id, altezza: el ? Math.ceil(el.getBoundingClientRect().height) : 0 };
    });
    setMisure((prima) => (prima && JSON.stringify(prima) === JSON.stringify(out) ? prima : out));
  }, [firme]);

  useLayoutEffect(() => {
    misura();
  }, [misura, colonne]);
  useEffect(() => {
    // le immagini e i font possono cambiare le altezze: rimisura quando sono pronti
    const cont = misuratore.current;
    if (!cont) return;
    const imgs = Array.from(cont.querySelectorAll("img"));
    let vivo = true;
    const ri = () => vivo && misura();
    imgs.forEach((i) => i.addEventListener("load", ri));
    document.fonts?.ready.then(ri).catch(() => {});
    return () => {
      vivo = false;
      imgs.forEach((i) => i.removeEventListener("load", ri));
    };
  }, [misura]);

  const pagineMessaggi = useMemo(
    () => (misure ? impaginaMessaggi(misure, colonne) : []),
    [misure, colonne],
  );
  // in firma, senza messaggi c'è comunque una pagina vuota: quella dove andrà il primo
  const paginaVuota = !!bordoPaginaFirma && !!misure && pagineMessaggi.length === 0;
  const totale = numeroPagine(misure ? pagineMessaggi : []) + (paginaVuota ? 1 : 0);
  const paginaFirma = primaPaginaConSpazio(pagineMessaggi) - 1;
  const paginaEvidenziata = evidenziaId ? pagineMessaggi.findIndex((p) => p.colonne.some((c) => c.includes(evidenziaId))) + 1 : 0;
  const iniziale = bordoPaginaFirma ? paginaFirma : paginaEvidenziata > 0 ? paginaEvidenziata : paginaIniziale;
  const [pagina, setPagina] = useState(iniziale);
  useEffect(() => {
    if (misure) setPagina(Math.min(Math.max(0, iniziale), totale - 1));
  }, [iniziale, totale, misure]);
  const corrente = Math.min(pagina, totale - 1);

  const tocco = useRef<number | null>(null);
  const vai = (d: number) => setPagina((p) => Math.min(totale - 1, Math.max(0, p + d)));

  const larCol = larghezzaColonna(colonne);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* misuratore nascosto: riquadri alla larghezza logica della colonna */}
      <div aria-hidden="true" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div ref={misuratore} style={{ width: larCol }}>
          {firme.map((f) => (
            <div key={f.id} data-id={f.id} style={{ marginBottom: GAP_RIQUADRI }}>
              <RiquadroMessaggio firma={f} />
            </div>
          ))}
        </div>
      </div>

      <div
        role="group"
        aria-label={`Pagina ${corrente + 1} di ${totale}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") vai(1);
          if (e.key === "ArrowLeft") vai(-1);
        }}
        onTouchStart={(e) => (tocco.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (tocco.current === null) return;
          const dx = e.changedTouches[0].clientX - tocco.current;
          if (Math.abs(dx) > 40) vai(dx < 0 ? 1 : -1);
          tocco.current = null;
        }}
        className="outline-none focus-visible:ring-2 focus-visible:ring-accent"
        style={{
          ...(bordoPaginaFirma && corrente === paginaFirma ? { outline: "2px solid var(--accent)", outlineOffset: 4 } : {}),
        }}
      >
        {corrente === 0 ? (
          <Copertina modello={modello} titolo={titolo} sottotitolo={sottotitolo} immagineUrl={immagineUrl} larghezza={larghezza} />
        ) : misure && pagineMessaggi[corrente - 1] ? (
          <PaginaMessaggi pagina={pagineMessaggi[corrente - 1]} firmePerId={firmePerId} larghezza={larghezza} sfondo={modello.sfondo} evidenziaId={evidenziaId} />
        ) : paginaVuota && corrente === 1 ? (
          <PaginaMessaggi pagina={{ colonne: Array.from({ length: colonne }, () => []) }} firmePerId={firmePerId} larghezza={larghezza} sfondo={modello.sfondo} />
        ) : (
          <div style={{ width: larghezza, height: Math.round(larghezza * 1.414) }} className="bg-surface-2" />
        )}
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => vai(-1)}
          disabled={corrente === 0}
          aria-label="Pagina precedente"
          className="flex min-h-tocco items-center gap-2 text-sm font-semibold text-accent-2 disabled:opacity-40"
        >
          <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-field text-xl">‹</span>
          <span className="hidden min-[400px]:inline">Precedente</span>
        </button>
        <span className="cifre min-w-16 text-center text-sm font-semibold" aria-live="polite">
          {corrente + 1} di {totale}
        </span>
        <button
          type="button"
          onClick={() => vai(1)}
          disabled={corrente >= totale - 1}
          aria-label="Pagina successiva"
          className="flex min-h-tocco items-center gap-2 text-sm font-semibold text-accent-2 disabled:opacity-40"
        >
          <span className="hidden min-[400px]:inline">Successiva</span>
          <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-field text-xl">›</span>
        </button>
      </div>
    </div>
  );
}
