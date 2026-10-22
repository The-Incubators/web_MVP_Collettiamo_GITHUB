"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { ScegliRegalo } from "@/components/ScegliRegalo";
import { Avviso, Bottone, IconaEsterno, IconaPiu, ImmagineProdotto } from "@/components/ui";
import { dataConGiorno } from "@/lib/dominio/date";
import { REL_LINK_PRODOTTO, urlPerAcquisto } from "@/lib/dominio/amazon";
import { formattaEuro } from "@/lib/dominio/importi";
import { ErroreDominio } from "@/lib/dominio/operazioni";
import { chiusuraVotazione, classifica, mediaInTesto, ORE, testoTempoRimasto } from "@/lib/dominio/votazione";
import type { Colletta, ProdottoColletta, Proposta, Voto } from "@/lib/tipi";
import { useChiusuraVotazione } from "./useChiusuraVotazione";

/** La votazione vista da chi organizza: classifica in tempo reale, proposte da gestire, chiusura anticipata o proroga. */
export function SezioneVotazione({
  slug,
  colletta: c,
  aggiorna,
}: {
  slug: string;
  colletta: Colletta;
  aggiorna: (patch: Partial<Colletta>) => Promise<boolean>;
}) {
  const { dati } = useApp();
  const v = c.votazione!;
  const [proposte, setProposte] = useState<Proposta[]>([]);
  const [voti, setVoti] = useState<Voto[]>([]);
  const [ora, setOra] = useState<number | null>(null);
  const [chiedoChiusura, setChiedoChiusura] = useState(false);
  const [rimuovi, setRimuovi] = useState<string | null>(null);
  const [nuovo, setNuovo] = useState<ProdottoColletta | null>(null);
  const [chiave, setChiave] = useState(0);
  const [errore, setErrore] = useState<string | null>(null);
  const [occupato, setOccupato] = useState(false);

  useEffect(() => {
    const a = dati.osservaProposte(slug, setProposte);
    const b = dati.osservaVoti(slug, setVoti);
    return () => {
      a();
      b();
    };
  }, [dati, slug]);
  useEffect(() => {
    setOra(Date.now());
    const t = setInterval(() => setOra(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Se il tempo scade con la pagina aperta, la chiusura la fa il server; la colletta si aggiorna da sola in tempo reale.
  useChiusuraVotazione(slug, v.scade, () => {});

  const ordine = classifica(proposte, voti);
  const votanti = new Set(voti.map((x) => x.uid)).size;
  const scaduta = ora !== null && v.scade !== null && ora >= v.scade;

  async function chiudiOra() {
    setOccupato(true);
    setErrore(null);
    try {
      const [ps, vs] = await Promise.all([dati.proposte(slug), dati.voti(slug)]);
      const patch = chiusuraVotazione(c, ps, vs, Date.now());
      if (!patch) throw new ErroreDominio("Serve almeno una proposta per chiudere la votazione.");
      if (!(await aggiorna(patch))) throw new Error("salvataggio");
    } catch (e) {
      setErrore(e instanceof ErroreDominio ? e.message : "Non sono riuscito a chiudere la votazione. Riprova.");
    } finally {
      setOccupato(false);
      setChiedoChiusura(false);
    }
  }

  async function prolunga() {
    if (v.scade === null) return;
    setErrore(null);
    const base = Math.max(v.scade, Date.now());
    await aggiorna({ votazione: { ...v, scade: base + 24 * ORE, durataOre: v.durataOre + 24 } });
  }

  async function aggiungi() {
    if (!nuovo) return;
    setErrore(null);
    try {
      await dati.aggiungiProposta(slug, { prodotto: nuovo, autoreNome: c.organizzatoreNome });
      setProposte(await dati.proposte(slug));
      setNuovo(null);
      setChiave((k) => k + 1);
    } catch (e) {
      setErrore(e instanceof ErroreDominio ? e.message : "Non sono riuscito ad aggiungerla. Riprova.");
    }
  }

  async function togli(id: string) {
    setErrore(null);
    try {
      await dati.rimuoviProposta(slug, id);
      setProposte((ps) => ps.filter((x) => x.id !== id));
    } catch {
      setErrore("Non sono riuscito a toglierla. Riprova.");
    }
    setRimuovi(null);
  }

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="voto-stato" className="contenitore flex flex-col gap-4 p-5">
        <h2 id="voto-stato" className="text-xl">
          Votazione in corso
        </h2>
        <p className="text-lg font-semibold" aria-live="polite">
          {ora !== null && v.scade !== null ? (scaduta ? "Tempo scaduto: sto contando i voti…" : testoTempoRimasto(v.scade, ora)) : "…"}
        </p>
        {v.scade ? <p className="text-sm text-ink-soft">Si chiude {dataConGiorno(v.scade)} alle {new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" }).format(new Date(v.scade))}.</p> : null}
        <p className="text-sm">
          {votanti === 0 ? "Nessuno ha ancora votato." : `${votanti} ${votanti === 1 ? "persona ha" : "persone hanno"} votato.`} Chi partecipa non vede le medie finché non si chiude.
        </p>
        <p className="text-sm text-ink-soft">Finché si vota nessuno paga. Alla chiusura il regalo più votato diventa quello della colletta e la quota si calcola sul suo prezzo.</p>
        <div className="flex flex-wrap gap-2">
          {chiedoChiusura ? (
            <>
              <Bottone onClick={() => void chiudiOra()} disabled={occupato}>
                {occupato ? "Chiudo…" : "Sì, chiudi adesso"}
              </Bottone>
              <Bottone variante="testuale" onClick={() => setChiedoChiusura(false)}>
                Annulla
              </Bottone>
            </>
          ) : (
            <Bottone variante="secondario" onClick={() => setChiedoChiusura(true)} disabled={proposte.length === 0}>
              Chiudi ora la votazione
            </Bottone>
          )}
          <Bottone variante="secondario" onClick={() => void prolunga()}>
            Prolunga di 24 ore
          </Bottone>
        </div>
      </section>

      {errore ? (
        <Avviso tono="attenzione" live>
          <p>{errore}</p>
        </Avviso>
      ) : null}

      <section aria-labelledby="classifica" className="flex flex-col gap-3">
        <h2 id="classifica" className="text-xl">
          Classifica provvisoria ({proposte.length})
        </h2>
        {proposte.length === 0 ? <p className="text-ink-soft">Nessuna proposta: aggiungine una.</p> : null}
        <ol className="flex flex-col gap-3">
          {ordine.map((x, i) => (
            <li key={x.proposta.id} className="contenitore flex flex-col overflow-hidden sm:flex-row">
              <div className="sm:w-40 sm:shrink-0">
                <ImmagineProdotto prodotto={x.proposta.prodotto} className="max-h-32 object-cover sm:h-full" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-sans text-base font-semibold">
                    {i + 1}. {x.proposta.prodotto.nome}
                  </h3>
                  <span className="cifre shrink-0 font-bold">{formattaEuro(x.proposta.prodotto.prezzoCent)}</span>
                </div>
                <p className="text-sm">
                  <strong className="cifre text-lg">{x.nVoti ? mediaInTesto(x.media) : "—"}</strong> ★ · {x.nVoti} {x.nVoti === 1 ? "voto" : "voti"}
                  <span className="text-ink-soft"> · {x.proposta.daOrganizzatore ? "tua proposta" : `proposta da ${x.proposta.autoreNome}`}</span>
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  {x.proposta.prodotto.urlEsterno ? (
                    <a className="inline-flex min-h-tocco items-center gap-1 text-sm font-semibold text-accent-2 underline underline-offset-4" href={urlPerAcquisto(x.proposta.prodotto.urlEsterno)} target="_blank" rel={REL_LINK_PRODOTTO}>
                      Vedi sul negozio <IconaEsterno width={16} height={16} />
                    </a>
                  ) : null}
                  {rimuovi === x.proposta.id ? (
                    <>
                      <Bottone dimensione="piccolo" variante="secondario" onClick={() => void togli(x.proposta.id)}>
                        Sì, togli
                      </Bottone>
                      <Bottone dimensione="piccolo" variante="testuale" onClick={() => setRimuovi(null)}>
                        Annulla
                      </Bottone>
                    </>
                  ) : (
                    <Bottone dimensione="piccolo" variante="testuale" onClick={() => setRimuovi(x.proposta.id)} aria-label={`Togli ${x.proposta.prodotto.nome} dalla lista`}>
                      Togli dalla lista
                    </Bottone>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="aggiungi-org" className="flex flex-col gap-4">
        <h2 id="aggiungi-org" className="text-xl">
          Aggiungi un regalo
        </h2>
        <ScegliRegalo key={chiave} valore={nuovo} onScelta={setNuovo} avvisoLink={false} />
        <Bottone onClick={() => void aggiungi()} disabled={!nuovo} className="self-start">
          <IconaPiu width={18} height={18} /> Aggiungi alla lista
        </Bottone>
      </section>
    </div>
  );
}
