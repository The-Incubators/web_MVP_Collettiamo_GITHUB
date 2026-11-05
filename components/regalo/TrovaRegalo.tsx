"use client";

// Le domande di «Trova il regalo» dopo la prima (Gifty UX v2, prototipi/domande.html): 2 di 3 l'occasione, con
// passaggio automatico al tocco (I-04); 3 di 3 che cosa le piace, passioni a chip con il secondo livello sotto, poi
// «Mostra le idee». La prima domanda sta su /idee. Le regole (quante passioni, quali si mostrano) sono quelle di
// lib/regalo; le risposte restano nell'indirizzo, così «indietro» e i chip dei risultati ritrovano tutto.

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Chip, IconaTratto, IndicatorePassi } from "@/components/ui";
import { CATEGORIE_INTERESSI, INTERESSI, OCCASIONI_REGALO, ORDINE_PASSIONI, SOGLIA_PRODOTTI } from "@/lib/regalo/dati";
import { domandaInteressi, hrefRisultati, parametriDaStato } from "@/lib/regalo/indirizzo";
import type { ConteggiPassioni } from "@/lib/regalo/punteggio";
import {
  cambiaInteresse,
  cambiaMacro,
  limiteInteressiRaggiunto,
  limiteMacroRaggiunto,
  puoAvanzare,
  scegliOccasione,
  vaiAllaTappa,
  type StatoRicerca,
} from "@/lib/regalo/stato";

const PASSIONI = ORDINE_PASSIONI.map((id) => CATEGORIE_INTERESSI.find((c) => c.id === id)!);

export function TrovaRegalo({ conteggi, iniziale }: { conteggi: ConteggiPassioni; iniziale: StatoRicerca }) {
  const router = useRouter();
  const [stato, setStato] = useState<StatoRicerca>(iniziale);
  const titolo = useRef<HTMLHeadingElement>(null);
  const primo = useRef(true);


  // L'indirizzo segue le risposte (senza una voce nuova nella cronologia); cambiando domanda il titolo prende il fuoco.
  useEffect(() => {
    window.history.replaceState(window.history.state, "", `/regalo?${parametriDaStato(stato, stato.tappa)}`);
  }, [stato]);
  useEffect(() => {
    if (primo.current) {
      primo.current = false;
      return;
    }
    titolo.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [stato.tappa]);

  if (stato.tappa === 2) {
    return (
      <>
        <IndicatorePassi passo={2} totale={3} indietroHref="/idee" />
        <h1 ref={titolo} tabIndex={-1} className="t-pagina outline-none">
          Qual è l&apos;occasione?
        </h1>
        <div className="tessere-scelta" role="radiogroup" aria-label="Occasione">
          {OCCASIONI_REGALO.map((o) => (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={stato.occasione === o.id}
              onClick={() => {
                const s = scegliOccasione(stato, o.id);
                setStato({ ...s, tappa: 3 });
              }}
            >
              <IconaTratto nome={o.icona} />
              {o.etichetta}
            </button>
          ))}
        </div>
      </>
    );
  }

  // Le passioni con abbastanza prodotti, più quelle già scelte.
  const passioni = PASSIONI.filter((c) => stato.macro.includes(c.id) || (conteggi.macro[c.id] ?? 0) >= SOGLIA_PRODOTTI);
  const pieneMacro = limiteMacroRaggiunto(stato);
  const pieneMicro = limiteInteressiRaggiunto(stato);
  const pronto = puoAvanzare(stato);

  return (
    <>
      <IndicatorePassi passo={3} totale={3} onIndietro={() => setStato(vaiAllaTappa(stato, 2))} />
      <h1 ref={titolo} tabIndex={-1} className="t-pagina outline-none">
        {domandaInteressi(stato.genere)}
      </h1>
      <div className="chips" role="group" aria-label="Interessi">
        {passioni.map((c) => {
          const scelto = stato.macro.includes(c.id);
          return (
            <Chip key={c.id} scelto={scelto} disabled={!scelto && pieneMacro} onClick={() => setStato(cambiaMacro(stato, c.id))}>
              {c.etichetta}
            </Chip>
          );
        })}
      </div>
      {stato.macro.map((id) => {
        const c = CATEGORIE_INTERESSI.find((x) => x.id === id);
        const micro = INTERESSI.filter((x) => x.categoria === id && (stato.interessi.includes(x.id) || (conteggi.micro[x.id] ?? 0) >= SOGLIA_PRODOTTI));
        if (!c || !micro.length) return null;
        const domanda = `${c.etichetta}: che cosa in particolare?`;
        return (
          <div key={id} className="gruppo-int">
            <h2>{domanda}</h2>
            <div className="chips" role="group" aria-label={domanda}>
              {micro.map((x) => {
                const scelto = stato.interessi.includes(x.id);
                return (
                  <Chip key={x.id} scelto={scelto} disabled={!scelto && pieneMicro} onClick={() => setStato(cambiaInteresse(stato, x.id))}>
                    {x.etichetta}
                  </Chip>
                );
              })}
            </div>
          </div>
        );
      })}
      <div className="avanti">
        <button type="button" className="btn btn-primario" disabled={!pronto} onClick={() => router.push(hrefRisultati(stato))}>
          Mostra le idee
        </button>
      </div>
    </>
  );
}
