"use client";

import { useEffect, useState } from "react";
import { ScegliRegalo } from "@/components/ScegliRegalo";
import { Avviso, Bottone, BottoneLink, Campo, Icona, ImmagineProdotto } from "@/components/ui";
import { DICHIARAZIONE_AFFILIATO_AMAZON, REL_LINK_PRODOTTO, urlPerAcquisto } from "@/lib/dominio/amazon";
import { dataBreve } from "@/lib/dominio/date";
import { formattaEuro } from "@/lib/dominio/importi";
import { inizialiDi } from "@/lib/dominio/partecipanti";
import { quotaProposta } from "@/lib/dominio/quota";
import { ErroreDominio } from "@/lib/dominio/operazioni";
import { MAX_PROPOSTE_PER_PERSONA, proposteDi, testoTempoRimasto } from "@/lib/dominio/votazione";
import type { ProdottoColletta } from "@/lib/tipi";
import { Stelle } from "./Stelle";
import type { Partecipazione } from "./usePartecipazione";

const CHIAVE_NOME = "colletta.nome";

const GIUDIZI = ["", "Non mi convince", "Così così", "Carina", "Molto buona", "Perfetta!"];

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
  // chi ha votato almeno un'idea: i voti hanno l'uid di chi vota, non il nome, quindi si contano e basta
  const votanti = new Set(p.voti.map((x) => x.uid)).size;
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="inline-flex items-center gap-2 rounded-full bg-surface py-1 pl-1 pr-3 text-xs font-bold shadow-carta">
          <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] text-on-accent">
            {inizialiDi(c.organizzatoreNome).slice(0, 1)}
          </span>
          {c.organizzatoreNome} organizza
        </p>
        <p className="rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-ink-soft">
          {c.occasione.charAt(0).toUpperCase() + c.occasione.slice(1)} {c.festeggiato} · {dataBreve(c.dataRegalo)}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl bg-accent px-4 py-3 text-on-accent" aria-live="polite">
        <p className="flex items-center gap-2 text-sm font-bold">
          <Icona nome="how_to_vote" dimensione={20} className="text-gold-vivo" />
          {scaduta ? "Votazione finita" : "Votazione in corso"}
        </p>
        <p className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
          <Icona nome="schedule" dimensione={16} />
          {scaduta ? "Conto i voti…" : ora !== null && v.scade !== null ? testoTempoRimasto(v.scade, ora) : "In corso"}
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-[32px] font-bold leading-[38px] tracking-tight text-accent-2">Quale regalo per {c.festeggiato}?</h1>
        <p className="text-ink-soft">Dai da 1 a 5 stelle a ogni idea. Vince la media più alta.</p>
      </div>

      <div className="flex items-start gap-3 rounded-2xl bg-surface-2 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ok-field text-accent">
          <Icona nome="verified_user" dimensione={22} />
        </span>
        <div className="flex flex-col">
          <p className="text-sm font-bold">Finché si vota non si paga</p>
          <p className="text-sm text-ink-soft">Le quote si raccolgono dopo, sul regalo che vince. Torna su questo link alla fine.</p>
        </div>
      </div>

      {votanti > 0 ? (
        <p className="flex items-center gap-2 rounded-2xl bg-surface px-4 py-3 text-sm font-semibold shadow-carta">
          <Icona nome="group" dimensione={20} className="text-accent" />
          {votanti === 1 ? "1 persona ha già votato" : `${votanti} persone hanno già votato`}
        </p>
      ) : null}

      {p.proposte.length === 0 ? <p className="text-ink-soft">Carico le idee…</p> : null}
      <ul className="flex flex-col gap-4">
        {p.proposte.map((x, i) => {
          const mia = !!p.uid && x.autoreUid === p.uid && !x.daOrganizzatore;
          const voto = p.mioVoto(x.id);
          return (
            <li key={x.id} className="flex flex-col gap-4 rounded-3xl bg-surface p-4 shadow-carta">
              <div className="flex gap-4">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-white">
                  <ImmagineProdotto prodotto={x.prodotto} className="aspect-square h-full" />
                  <span className="absolute left-1.5 top-1.5 rounded-md bg-surface px-1.5 text-[11px] font-bold shadow-carta">#{i + 1}</span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center justify-between gap-x-2">
                    <span className="cifre text-lg font-extrabold">{formattaEuro(x.prodotto.prezzoCent)}</span>
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-bold text-ink-soft">
                      ~{formattaEuro(quotaProposta(x.prodotto.prezzoCent, c.previsti))} / testa
                    </span>
                  </div>
                  <h2 className="line-clamp-2 font-display text-lg font-semibold leading-snug">{x.prodotto.nome}</h2>
                  {x.prodotto.urlEsterno ? (
                    <a
                      className="inline-flex items-center gap-1 self-start py-1 text-sm font-bold text-cta-2 underline underline-offset-4"
                      href={urlPerAcquisto(x.prodotto.urlEsterno)}
                      target="_blank"
                      rel={REL_LINK_PRODOTTO}
                    >
                      Vedi sul negozio <Icona nome="open_in_new" dimensione={16} />
                    </a>
                  ) : null}
                  <p className="flex items-center gap-1 text-xs font-semibold text-ink-soft">
                    <Icona nome="person" dimensione={16} />
                    Proposto da {x.daOrganizzatore ? c.organizzatoreNome : x.autoreNome}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-1 rounded-2xl bg-surface-2 px-3 py-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-ink-soft">Il tuo voto</span>
                  {voto > 0 ? (
                    <span className="font-bold text-cta-2">
                      {voto} su 5 ({GIUDIZI[voto]})
                    </span>
                  ) : null}
                </div>
                <Stelle valore={voto} onVota={(n) => void vota(x.id, n)} etichetta={x.prodotto.nome} disabilitato={scaduta} />
              </div>
              {mia && !scaduta ? (
                <Bottone
                  variante="testuale"
                  dimensione="piccolo"
                  onClick={() => p.rimuoviProposta(x.id).catch((e) => setErrore(messaggio(e)))}
                  aria-label={`Togli la tua proposta ${x.prodotto.nome}`}
                  className="-mt-2 self-start"
                >
                  Togli la mia proposta
                </Bottone>
              ) : null}
            </li>
          );
        })}
      </ul>

      {p.proposte.length > 0 ? (
        <p className="flex items-center justify-center gap-1.5 text-center text-sm font-semibold text-ink-soft" aria-live="polite">
          <Icona nome="check_circle" dimensione={18} className={votate === p.proposte.length ? "text-ok" : ""} />
          Hai votato {votate} {votate === 1 ? "idea" : "idee"} su {p.proposte.length}: ogni voto si salva da solo, e puoi cambiarlo fino alla chiusura.
        </p>
      ) : null}

      {errore ? (
        <Avviso tono="attenzione" live>
          <p>{errore}</p>
        </Avviso>
      ) : null}

      {v.consentiProposte && !scaduta ? (
        apriForm ? (
          <section aria-labelledby="proponi" className="flex flex-col gap-4 rounded-3xl bg-surface p-5 shadow-carta">
            <h2 id="proponi" className="flex items-center gap-2 text-xl font-semibold text-accent-2">
              <Icona nome="add_circle" className="text-accent" />
              Hai un’altra idea regalo?
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
            <Icona nome="add_circle" dimensione={20} />
            Proponi un’altra idea
          </Bottone>
        )
      ) : null}

      <BottoneLink href="/catalogo" variante="testuale" className="self-center text-sm">
        Organizzi anche tu un regalo di gruppo?
      </BottoneLink>
      {/* La pagina ha link ai prodotti di Amazon.it: la dichiarazione richiesta dal programma di affiliazione, in fondo. */}
      <div className="flex flex-col items-center gap-1 rounded-2xl bg-surface-2 p-4 text-center">
        <p className="text-xs font-semibold text-ink-soft">{DICHIARAZIONE_AFFILIATO_AMAZON}</p>
        <p className="inline-flex items-center gap-1 text-xs font-bold text-accent">
          <Icona nome="verified_user" dimensione={16} />I soldi non passano mai da Regaloop.
        </p>
      </div>
      {apriForm && nuovo && mie < MAX_PROPOSTE_PER_PERSONA && !scaduta ? (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface p-3 shadow-sollevata pb-[max(0.75rem,env(safe-area-inset-bottom))]">
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
