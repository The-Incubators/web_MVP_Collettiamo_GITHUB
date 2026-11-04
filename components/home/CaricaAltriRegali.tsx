"use client";

import { useRef, useState, type ReactNode } from "react";
import { Icona } from "@/components/ui";
import { altriRegali, type AltriRegali } from "./altriRegali";
import { CLASSI_RIQUADRO_REGALO, CLASSI_SECONDARIO, PRIMI_REGALI, SchedaRegaloAmato } from "./SchedaRegaloAmato";

/**
 * La griglia dei «Regali più amati» con «Carica altri prodotti» in fondo: ogni clic chiede al server i 3 prodotti
 * successivi (la home non scarica tutto il catalogo). I primi arrivano già fatti dal server, come `children`.
 * Finiti i prodotti il pulsante sparisce e il segno passa al primo dei nuovi, per non perderlo.
 */
export function CaricaAltriRegali({ children, ciSonoAltri, conLikes }: { children: ReactNode; ciSonoAltri: boolean; conLikes: boolean }) {
  const [caricati, setCaricati] = useState<AltriRegali["regali"]>([]);
  const [altri, setAltri] = useState(ciSonoAltri);
  const [stato, setStato] = useState<"pronto" | "carico" | "errore">("pronto");
  const [annuncio, setAnnuncio] = useState("");
  /** la posizione del primo prodotto dell'ultimo gruppo caricato */
  const [inizioUltimi, setInizioUltimi] = useState(0);
  const primoNuovo = useRef<HTMLLIElement>(null);

  async function carica() {
    if (stato === "carico") return;
    setStato("carico");
    try {
      const r = await altriRegali(PRIMI_REGALI + caricati.length);
      setInizioUltimi(caricati.length);
      setCaricati((c) => [...c, ...r.regali]);
      setAltri(r.altri && r.regali.length > 0);
      setAnnuncio(r.regali.length === 1 ? "Caricato un altro regalo" : `Caricati altri ${r.regali.length} regali`);
      setStato("pronto");
      if (!r.altri) requestAnimationFrame(() => primoNuovo.current?.focus());
    } catch {
      setStato("errore");
    }
  }

  return (
    <>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {children}
        {caricati.map(({ prodotto, stelle }, i) => (
          <li key={prodotto.slug} ref={i === inizioUltimi ? primoNuovo : undefined} tabIndex={i === inizioUltimi ? -1 : undefined} className={CLASSI_RIQUADRO_REGALO}>
            <SchedaRegaloAmato prodotto={prodotto} stelle={stelle} conLikes={conLikes} />
          </li>
        ))}
      </ul>
      <p className="sr-only" aria-live="polite">
        {annuncio}
      </p>
      {altri ? (
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={carica}
            // aria-disabled e non disabled: un pulsante disabilitato perde il segno della tastiera
            aria-disabled={stato === "carico"}
            className={`${CLASSI_SECONDARIO} text-base aria-disabled:cursor-wait aria-disabled:opacity-70`}
          >
            <Icona nome={stato === "carico" ? "hourglass_top" : "expand_more"} dimensione={22} />
            {stato === "carico" ? "Carico…" : "Carica altri prodotti"}
          </button>
          {stato === "errore" ? (
            <p role="alert" className="text-sm text-ink-soft">
              Non siamo riusciti a caricarli: riprova tra poco.
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
