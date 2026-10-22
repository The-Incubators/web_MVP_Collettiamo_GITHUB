"use client";

import { useEffect, useState } from "react";
import { ScegliRegalo } from "@/components/ScegliRegalo";
import { Avviso, Bottone, BottoneLink, Campo, IconaEsterno, ImmagineProdotto } from "@/components/ui";
import { DICHIARAZIONE_AFFILIATO_AMAZON, REL_LINK_PRODOTTO, urlPerAcquisto } from "@/lib/dominio/amazon";
import { formattaEuro } from "@/lib/dominio/importi";
import { ErroreDominio } from "@/lib/dominio/operazioni";
import { MAX_PROPOSTE_PER_PERSONA, proposteDi, testoTempoRimasto } from "@/lib/dominio/votazione";
import type { ProdottoColletta } from "@/lib/tipi";
import { Stelle } from "./Stelle";
import type { Partecipazione } from "./usePartecipazione";

const CHIAVE_NOME = "colletta.nome";

function nomeSalvato(): string {
  try {
    return window.localStorage.getItem(CHIAVE_NOME) ?? "";
  } catch {
    return "";
  }
}

/** La schermata di chi partecipa mentre si vota: tutte le idee con le stelle, e la possibilità di proporne altre. */
export function VotazioneGruppo({ p }: { p: Partecipazione }) {
  const c = p.colletta;
  const v = c.votazione!;
  const [ora, setOra] = useState<number | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [apriForm, setApriForm] = useState(false);
  const [nuovo, setNuovo] = useState<ProdottoColletta | null>(null);
  const [nome, setNome] = useState("");
  const [chiave, setChiave] = useState(0);
  const [occupato, setOccupato] = useState(false);

  useEffect(() => {
    setOra(Date.now());
    const t = setInterval(() => setOra(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => setNome(p.miaRiga?.nome ?? nomeSalvato()), [p.miaRiga?.nome]);

  const scaduta = ora !== null && v.scade !== null && ora >= v.scade;
  const mie = p.uid ? proposteDi(p.proposte, p.uid) : 0;
  const votate = p.proposte.filter((x) => p.mioVoto(x.id) > 0).length;
  const messaggio = (e: unknown) => (e instanceof ErroreDominio ? e.message : "Non sono riuscito a salvare. Controlla la connessione e riprova.");

  async function vota(id: string, stelle: number) {
    setErrore(null);
    try {
      await p.vota(id, stelle);
    } catch (e) {
      setErrore(messaggio(e));
    }
  }

  async function proponi() {
    if (!nuovo) return;
    if (!nome.trim()) return setErrore("Scrivi il tuo nome, così gli altri sanno chi ha avuto l'idea.");
    setErrore(null);
    setOccupato(true);
    try {
      await p.proponi({ prodotto: nuovo, autoreNome: nome });
      try {
        window.localStorage.setItem(CHIAVE_NOME, nome.trim());
      } catch {
        /* ignorato */
      }
      setNuovo(null);
      setChiave((k) => k + 1);
      setApriForm(false);
    } catch (e) {
      setErrore(messaggio(e));
    } finally {
      setOccupato(false);
    }
  }

  return (
    <div className={`flex flex-col gap-5 ${apriForm && nuovo ? "pb-24" : ""}`}>
      <div className="flex flex-col gap-1">
        <p className="text-sm text-ink-soft">{c.organizzatoreNome} organizza</p>
        <h1 className="text-3xl leading-tight">Scegliamo il regalo per {c.festeggiato}</h1>
        <p className="text-ink-soft">Dai da 1 a 5 stelle a ogni idea. Vince quella con la media più alta.</p>
      </div>

      <div className="rounded-contenitore border border-accent bg-accent-field p-4" aria-live="polite">
        <p className="font-semibold">{scaduta ? "La votazione è finita: conto i voti…" : ora !== null && v.scade !== null ? testoTempoRimasto(v.scade, ora) : "Votazione in corso"}</p>
        <p className="text-sm text-ink-soft">
          Puoi cambiare voto finché non si chiude. Poi torna su questo link: partecipare alla colletta richiede un minuto.
        </p>
      </div>

      {p.proposte.length === 0 ? <p className="text-ink-soft">Carico le idee…</p> : null}
      <ul className="flex flex-col gap-4">
        {p.proposte.map((x) => {
          const mia = !!p.uid && x.autoreUid === p.uid && !x.daOrganizzatore;
          return (
            <li key={x.id} className="contenitore overflow-hidden">
              <ImmagineProdotto prodotto={x.prodotto} className="max-h-36 object-cover" />
              <div className="flex flex-col gap-3 p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-sans text-base font-semibold leading-snug">{x.prodotto.nome}</h2>
                  <span className="cifre shrink-0 font-bold">{formattaEuro(x.prodotto.prezzoCent)}</span>
                </div>
                {!x.daOrganizzatore ? <p className="text-sm text-ink-soft">Proposto da {x.autoreNome}</p> : null}
                <Stelle valore={p.mioVoto(x.id)} onVota={(n) => void vota(x.id, n)} etichetta={x.prodotto.nome} disabilitato={scaduta} />
                <div className="flex flex-wrap items-center gap-3">
                  {x.prodotto.urlEsterno ? (
                    <a
                      className="inline-flex min-h-tocco items-center gap-1 text-sm font-semibold text-accent-2 underline underline-offset-4"
                      href={urlPerAcquisto(x.prodotto.urlEsterno)}
                      target="_blank"
                      rel={REL_LINK_PRODOTTO}
                    >
                      Vedi sul negozio <IconaEsterno width={16} height={16} />
                    </a>
                  ) : null}
                  {mia && !scaduta ? (
                    <Bottone
                      variante="testuale"
                      dimensione="piccolo"
                      onClick={() => p.rimuoviProposta(x.id).catch((e) => setErrore(messaggio(e)))}
                      aria-label={`Togli la tua proposta ${x.prodotto.nome}`}
                    >
                      Togli la mia proposta
                    </Bottone>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {p.proposte.length > 0 ? (
        <p className="text-sm text-ink-soft" aria-live="polite">
          Hai votato {votate} idee su {p.proposte.length}.
        </p>
      ) : null}

      {errore ? (
        <Avviso tono="attenzione" live>
          <p>{errore}</p>
        </Avviso>
      ) : null}

      {v.consentiProposte && !scaduta ? (
        apriForm ? (
          <section aria-labelledby="proponi" className="contenitore flex flex-col gap-4 p-4">
            <h2 id="proponi" className="text-xl">
              Proponi un’altra idea
            </h2>
            {mie >= MAX_PROPOSTE_PER_PERSONA ? (
              <Avviso>
                <p>Hai già proposto {MAX_PROPOSTE_PER_PERSONA} regali: è il massimo. Se vuoi cambiare, togline uno.</p>
              </Avviso>
            ) : (
              <>
                <Campo etichetta="Il tuo nome" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="given-name" maxLength={40} />
                <ScegliRegalo key={chiave} valore={nuovo} onScelta={setNuovo} avvisoLink={false} />
                <div className="flex flex-col gap-2">
                  <Bottone pieno variante="testuale" onClick={() => setApriForm(false)}>
                    Annulla
                  </Bottone>
                </div>
              </>
            )}
          </section>
        ) : (
          <Bottone pieno variante="secondario" onClick={() => setApriForm(true)}>
            Proponi un’altra idea
          </Bottone>
        )
      ) : null}

      <BottoneLink href="/catalogo" variante="testuale">
        Organizzi anche tu un regalo di gruppo?
      </BottoneLink>
      {/* La pagina ha link ai prodotti di Amazon.it: la dichiarazione richiesta dal programma di affiliazione, in fondo. */}
      <p className="text-center text-xs text-ink-soft">{DICHIARAZIONE_AFFILIATO_AMAZON}</p>
      {apriForm && nuovo && mie < MAX_PROPOSTE_PER_PERSONA && !scaduta ? (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-ink/10 bg-white p-3 shadow-lg pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto max-w-catalogo">
            <Bottone pieno onClick={() => void proponi()} disabled={occupato}>
              {occupato ? "Aggiungo…" : "Aggiungi alla lista"}
            </Bottone>
          </div>
        </div>
      ) : null}
    </div>
  );
}
