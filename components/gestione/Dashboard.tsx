"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { BloccoInvito } from "@/components/BloccoInvito";
import { Avviso, Barra, Bottone, BottoneCopia, BottoneLink, Campo, CampoSelezione, Etichetta, Icona, ImmagineProdotto, RigaPartecipante } from "@/components/ui";
import { classiBottone } from "@/components/ui/Bottone";
import { dataBreve } from "@/lib/dominio/date";
import { euroPerCampo, formattaEuro, leggiEuro } from "@/lib/dominio/importi";
import { linkColletta, linkWhatsApp, messaggioDopoVoto, messaggioInvito, messaggioVotazione } from "@/lib/dominio/messaggi";
import { votazioneInCorso } from "@/lib/dominio/votazione";
import { RisultatoVotazione } from "@/components/partecipante/RisultatoVotazione";
import { SezioneVotazione } from "./SezioneVotazione";
import { avanzamento, contantiDaRicevere, daConfermare, ordinaPartecipanti } from "@/lib/dominio/partecipanti";
import { giorniAllaScadenza, promemoriaCalendario, testoScadenza, type Promemoria } from "@/lib/dominio/promemoria";
import { quotaAllaChiusuraAdesioni, quotaEffettiva, quoteMancanti } from "@/lib/dominio/quota";
import { spostaScadenza } from "@/lib/dominio/scadenza";
import { METODI, type Colletta, type Metodo, type Partecipante } from "@/lib/tipi";
import { baseUrlClient } from "@/lib/url";
import { NOMI_METODO } from "@/components/partecipante/PannelloPagamento";
import { useGestione } from "./useGestione";

type Azione = (pid: string, op: import("@/lib/dominio/operazioni").Operazione) => Promise<void>;

function dettaglioRiga(r: Partecipante): string {
  return [r.metodo ? NOMI_METODO[r.metodo] : null, `causale ${r.causale}`].filter(Boolean).join(" · ");
}

function ConfermaRiga({ r, quota, azione, tipo }: { r: Partecipante; quota: number; azione: Azione; tipo: "dichiarato" | "contanti" }) {
  const [diverso, setDiverso] = useState(false);
  const [testo, setTesto] = useState(euroPerCampo(r.importoCent ?? quota));
  const [errore, setErrore] = useState<string | null>(null);

  function conferma(importoCent?: number) {
    void azione(r.id, { tipo: "conferma", importoCent });
  }

  return (
    <RigaPartecipante
      nome={r.nome}
      dettaglio={dettaglioRiga(r)}
      etichetta={<span className="cifre shrink-0 text-lg font-extrabold">+{formattaEuro(r.importoCent ?? quota)}</span>}
      sfondo="bianco"
      azioni={
        <>
          <div className="grid w-full grid-cols-2 gap-2">
            <Bottone variante="verde" dimensione="piccolo" onClick={() => conferma(r.importoCent ?? undefined)}>
              <Icona nome="check" dimensione={18} />
              {tipo === "contanti" ? "Ricevuti" : "Accredito ricevuto"}
            </Bottone>
            {tipo === "dichiarato" ? (
              <Bottone dimensione="piccolo" variante="secondario" onClick={() => void azione(r.id, { tipo: "nonTrovato" })}>
                <Icona nome="close" dimensione={18} />
                Non trovato
              </Bottone>
            ) : (
              <Bottone dimensione="piccolo" variante="secondario" onClick={() => setDiverso((v) => !v)} aria-expanded={diverso}>
                Importo diverso
              </Bottone>
            )}
          </div>
          {tipo === "dichiarato" ? (
            <Bottone dimensione="piccolo" variante="testuale" onClick={() => setDiverso((v) => !v)} aria-expanded={diverso} className="text-xs">
              È arrivato un importo diverso?
            </Bottone>
          ) : null}
          {diverso ? (
            <form
              className="flex w-full flex-wrap items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const c = leggiEuro(testo);
                if (!c) return setErrore("Scrivi un importo valido.");
                setErrore(null);
                conferma(c);
              }}
            >
              <div className="min-w-0 flex-1">
                <Campo etichetta="Importo ricevuto (€)" inputMode="decimal" value={testo} onChange={(e) => setTesto(e.target.value)} errore={errore} />
              </div>
              <Bottone variante="verde" type="submit" dimensione="piccolo">
                Conferma questo importo
              </Bottone>
            </form>
          ) : null}
        </>
      }
    />
  );
}

function RigaTutti({ r, c, azione }: { r: Partecipante; c: Colletta; azione: Azione }) {
  const [apri, setApri] = useState(false);
  const [metodo, setMetodo] = useState<Metodo>(r.metodo ?? "contanti");
  const [importo, setImporto] = useState(euroPerCampo(r.importoCent ?? quotaEffettiva(c)));
  const [rimuovi, setRimuovi] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  // le azioni della riga stanno dietro «⋯»: l'elenco resta leggibile anche con tanti nomi
  const [menu, setMenu] = useState(false);
  const stato = r.stato === "dichiarato" ? "daConfermare" : r.stato;
  const chiusa = c.stato === "chiusa";
  return (
    <RigaPartecipante
      nome={r.nome}
      dettaglio={
        r.stato === "confermato"
          ? `${r.metodo ? NOMI_METODO[r.metodo] : "Pagamento"} · ${formattaEuro(r.importoCent ?? 0)}`
          : r.nota ?? (r.stato === "invitato" ? "Non ha ancora aperto il link" : r.metodo ? NOMI_METODO[r.metodo] : undefined)
      }
      etichetta={
        <span className="flex shrink-0 items-center gap-1">
          <Etichetta stato={stato} />
          {!chiusa ? (
            <button
              type="button"
              onClick={() => setMenu((m) => !m)}
              aria-expanded={menu}
              aria-label={`Azioni per ${r.nome}`}
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface"
            >
              <Icona nome="more_horiz" />
            </button>
          ) : null}
        </span>
      }
      azioni={
        chiusa || !menu ? undefined : (
          <>
            {r.stato !== "confermato" && r.stato !== "dichiarato" ? (
              <Bottone dimensione="piccolo" variante="secondario" onClick={() => setApri((v) => !v)} aria-expanded={apri}>
                Registra un pagamento
              </Bottone>
            ) : null}
            {r.stato !== "rinunciato" ? (
              <Bottone dimensione="piccolo" variante="testuale" onClick={() => void azione(r.id, { tipo: "segnaRinuncia" })}>
                Segna rinuncia
              </Bottone>
            ) : null}
            {rimuovi ? (
              <>
                <Bottone dimensione="piccolo" variante="secondario" onClick={() => void azione(r.id, { tipo: "rimuovi" })}>
                  Sì, rimuovi
                </Bottone>
                <Bottone dimensione="piccolo" variante="testuale" onClick={() => setRimuovi(false)}>
                  Annulla
                </Bottone>
              </>
            ) : (
              <Bottone dimensione="piccolo" variante="testuale" onClick={() => setRimuovi(true)}>
                Rimuovi
              </Bottone>
            )}
            {apri ? (
              <form
                className="flex w-full flex-wrap items-end gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const cent = leggiEuro(importo);
                  if (!cent) return setErrore("Scrivi un importo valido.");
                  setErrore(null);
                  setApri(false);
                  void azione(r.id, { tipo: "conferma", importoCent: cent, metodo });
                }}
              >
                <div className="min-w-32 flex-1">
                  <CampoSelezione etichetta="Come ha pagato" value={metodo} onChange={(e) => setMetodo(e.target.value as Metodo)}>
                    {METODI.map((m) => (
                      <option key={m} value={m}>
                        {NOMI_METODO[m]}
                      </option>
                    ))}
                  </CampoSelezione>
                </div>
                <div className="min-w-32 flex-1">
                  <Campo etichetta="Importo (€)" inputMode="decimal" value={importo} onChange={(e) => setImporto(e.target.value)} errore={errore} />
                </div>
                <Bottone variante="verde" type="submit" dimensione="piccolo">
                  Registra come pagato
                </Bottone>
              </form>
            ) : null}
          </>
        )
      }
    />
  );
}

function CartaPromemoria({ p, url, onInoltrato }: { p: Promemoria; url: string; onInoltrato: (p: Promemoria) => void }) {
  const adesso = Date.now();
  const giorni = Math.round((p.quando - adesso) / 86_400_000);
  const quando = p.maturo ? "Da mandare adesso" : giorni <= 1 ? "Da mandare domani" : `Da mandare fra ${giorni} giorni`;
  return (
    <li className="flex flex-col gap-3 rounded-2xl bg-surface-2 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-sans text-base font-bold">{p.titolo}</h3>
        <Etichetta stato={p.maturo ? "daConfermare" : "invitato"}>{quando}</Etichetta>
      </div>
      <p className="text-sm text-ink-soft">
        {p.destinatari}
        {p.nDestinatari !== null ? ` · ${p.nDestinatari} ${p.nDestinatari === 1 ? "persona" : "persone"}` : ""}
      </p>
      <p className="whitespace-pre-wrap rounded-2xl bg-surface p-3 text-sm italic">«{p.testo}»</p>
      {p.esaurito ? (
        <p className="text-sm text-ink-soft">Tutti hanno già ricevuto quattro messaggi: meglio non insistere.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <BottoneCopia testo={p.testo} etichetta="Copia il testo" onCopia={() => onInoltrato(p)} />
          <a
            href={linkWhatsApp(p.testo)}
            target="_blank"
            rel="noopener noreferrer"
            className={classiBottone("secondario", "piccolo")}
            onClick={() => onInoltrato(p)}
          >
            Apri WhatsApp
          </a>
        </div>
      )}
      <span className="sr-only">{url}</span>
    </li>
  );
}

function DopoVoto({ slug, c }: { slug: string; c: Colletta }) {
  const { dati } = useApp();
  const [dati2, setDati2] = useState<{ p: import("@/lib/tipi").Proposta[]; v: import("@/lib/tipi").Voto[] } | null>(null);
  useEffect(() => {
    Promise.all([dati.proposte(slug), dati.voti(slug)])
      .then(([p, v]) => setDati2({ p, v }))
      .catch(() => {});
  }, [dati, slug]);
  return (
    <div className="flex flex-col gap-2">
      <RisultatoVotazione colletta={c} proposte={dati2?.p ?? []} voti={dati2?.v ?? []} />
      <p className="text-sm text-ink-soft">Avvisa il gruppo: in fondo alla pagina trovi il messaggio già scritto per far tornare tutti a pagare.</p>
    </div>
  );
}

export function Dashboard({ slug }: { slug: string }) {
  const { dati } = useApp();
  const g = useGestione(slug);
  const { colletta: c, righe } = g;
  const [nuovoNome, setNuovoNome] = useState("");
  const [aggiungiAperto, setAggiungiAperto] = useState(false);
  const [filtro, setFiltro] = useState<string>("tutti");
  const [inoltrati, setInoltrati] = useState<Set<string>>(new Set());
  const [adesso, setAdesso] = useState(0);
  const sollecitiRef = useRef<HTMLElement>(null);

  useEffect(() => setAdesso(Date.now()), [c?.scadenza]);

  const base = typeof window === "undefined" ? "" : baseUrlClient();
  const url = linkColletta(base, slug);
  const quota = c ? quotaEffettiva(c) : 0;
  const promemoria = useMemo(() => (c && adesso ? promemoriaCalendario(c, righe, url, adesso) : []), [c, righe, url, adesso]);

  if (g.carico === "caricamento") return <p className="py-10 text-center text-ink-soft">Carico la raccolta…</p>;
  if (g.carico === "assente" || !c) {
    return (
      <div className="mx-auto flex max-w-dashboard flex-col gap-3 py-10">
        <h1 className="text-2xl">Questa colletta non esiste</h1>
        <Link href="/le-mie-collette" className="font-semibold text-accent-2 underline underline-offset-4">
          Vai alle tue collette
        </Link>
      </div>
    );
  }

  // Mentre si vota non c'è nulla da incassare: la dashboard è la votazione.
  if (votazioneInCorso(c)) {
    return (
      <div className="mx-auto flex max-w-dashboard flex-col gap-5">
        <header className="flex flex-col gap-1">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-soft">Votazione in corso</p>
          <h1 className="text-[32px] font-bold leading-[38px] tracking-tight text-accent-2">Il regalo per {c.festeggiato}</h1>
        </header>
        {g.avviso ? (
          <Avviso tono="attenzione" live>
            <p>{g.avviso}</p>
          </Avviso>
        ) : null}
        <SezioneVotazione slug={slug} colletta={c} aggiorna={g.aggiorna} />
        <section aria-labelledby="link-voto" className="flex flex-col gap-3 rounded-3xl bg-surface p-4 shadow-carta">
          <h2 id="link-voto" className="text-xl font-semibold text-accent-2">
            Il link per votare
          </h2>
          <BloccoInvito url={url} messaggio={messaggioVotazione({ festeggiato: c.festeggiato, scade: c.votazione?.scade ?? Date.now(), url })} />
        </section>
      </div>
    );
  }

  const a = avanzamento(c);
  const mancanti = quoteMancanti(c.prodotto.prezzoCent, c.totaleConfermatoCent, quota);
  const scaduta = adesso > 0 && adesso > c.scadenza;
  const giorni = adesso ? giorniAllaScadenza(c.scadenza, adesso) : 0;
  const dichiarati = daConfermare(righe).filter((r) => r.metodo !== "contanti");
  const contanti = contantiDaRicevere(righe);
  const tutti = ordinaPartecipanti(righe);
  const chiusa = c.stato === "chiusa";

  function inoltrato(p: Promemoria) {
    if (inoltrati.has(p.momento)) return;
    setInoltrati((s) => new Set(s).add(p.momento));
    void dati.registraSolleciti(slug, p.pidDestinatari, p.momento).catch(() => {});
  }

  async function aggiungi(e: React.FormEvent) {
    e.preventDefault();
    if (!nuovoNome.trim()) return;
    if (await g.aggiungiNome(nuovoNome)) setNuovoNome("");
  }

  const messaggio = c.votazione?.chiusa
    ? messaggioDopoVoto({ festeggiato: c.festeggiato, regalo: c.prodotto.nome, quotaCent: quota, scadenza: c.scadenza, url })
    : messaggioInvito({ festeggiato: c.festeggiato, quotaCent: quota, scadenza: c.scadenza, url });

  const mancaCent = Math.max(0, a.obiettivoCent - a.confermatoCent);
  const inAttesa = (r: Partecipante) => r.stato === "dichiarato";
  const daSollecitare = (r: Partecipante) => r.stato === "invitato" || r.stato === "aderito";
  const FILTRI = [
    { id: "tutti", testo: "Tutti", vale: (r: Partecipante) => !!r },
    { id: "confermati", testo: "Confermati", vale: (r: Partecipante) => r.stato === "confermato" },
    { id: "attesa", testo: "In attesa", vale: inAttesa },
    { id: "sollecitare", testo: "Da sollecitare", vale: daSollecitare },
  ] as const;
  const filtroAttivo = FILTRI.find((f) => f.id === filtro) ?? FILTRI[0];
  const visibili = tutti.filter(filtroAttivo.vale);

  return (
    <div className="mx-auto flex max-w-dashboard flex-col gap-5">
      <h1 className="sr-only">La raccolta per {c.festeggiato}</h1>
      {c.votazione?.chiusa ? <DopoVoto slug={slug} c={c} /> : null}
      {g.offline ? (
        <Avviso tono="attenzione" live>
          <p>Non riesco a collegarmi: riprovo da solo. Le modifiche appena fatte potrebbero non essere salvate.</p>
        </Avviso>
      ) : null}
      {g.avviso ? (
        <Avviso tono="attenzione" live>
          <p>{g.avviso}</p>
        </Avviso>
      ) : null}

      {/* la card verde in evidenza: quanto è stato confermato, chi c'è, quanto manca, e le scorciatoie */}
      <section aria-labelledby="sommario" className="eroe flex flex-col gap-5 p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-xs font-bold text-accent">
            <Icona nome="schedule" dimensione={16} />
            {chiusa ? "Colletta chiusa" : scaduta ? "Scaduta" : giorni === 0 ? "Chiude oggi" : giorni === 1 ? "Chiude domani" : `Fino al ${dataBreve(c.scadenza)}`}
          </span>
          <span className="cifre rounded-full bg-accent-field px-3 py-1 text-xs font-bold text-accent-2">{a.percento}%</span>
        </div>
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-surface bg-surface">
            <ImmagineProdotto prodotto={c.prodotto} className="aspect-square h-full" />
          </div>
          <div className="min-w-0">
            <h2 id="sommario" className="text-2xl font-bold leading-tight">
              Regalo per {c.festeggiato}
            </h2>
            <p className="truncate text-sm text-accent-field">{c.prodotto.nome}</p>
          </div>
          <p>
            <span className="cifre text-5xl font-extrabold">{formattaEuro(a.confermatoCent)}</span>
            <span className="cifre block text-sm text-accent-field">confermati su {formattaEuro(a.obiettivoCent)}</span>
          </p>
        </div>
        <Barra percento={a.percento} etichetta="Totale confermato sull'obiettivo" alta />
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm font-semibold">
          <span>
            {c.nConfermati} su {Math.max(c.previsti, c.nAttesi)} hanno partecipato
          </span>
          <span aria-hidden="true">·</span>
          {mancanti > 0 ? (
            <span>
              Mancano {formattaEuro(mancaCent)} (~{mancanti} {mancanti === 1 ? "quota" : "quote"})
            </span>
          ) : (
            <span>Obiettivo raggiunto!</span>
          )}
        </div>
        <nav aria-label="Vai a" className="grid grid-cols-4 gap-2">
          {[
            { href: "#tutti", testo: "Partecipanti", icona: "groups" as const },
            ...(!chiusa ? [{ href: "#solleciti", testo: "Promemoria", icona: "chat" as const }] : []),
            { href: "#link", testo: "Invita", icona: "person_add" as const },
            { href: `/gestisci/${slug}/dati`, testo: "Statistiche", icona: "bar_chart" as const },
          ].map((v) => (
            <a key={v.href} href={v.href} className="flex flex-col items-center gap-1.5 text-xs font-semibold">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-accent">
                <Icona nome={v.icona} />
              </span>
              {v.testo}
            </a>
          ))}
        </nav>
        {c.quotaCongelata && c.modoQuota === "divisa" ? <p className="text-center text-xs text-accent-field">La quota è congelata a {formattaEuro(c.quotaCent)}: chi si aggiunge paga questa.</p> : null}
      </section>

      {scaduta && !chiusa ? (
        <Avviso tono="attenzione" titolo="La raccolta è scaduta">
          <p>{mancanti > 0 ? testoScadenza(mancanti) : "Hai raggiunto l’obiettivo: puoi procedere con l’acquisto."}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Bottone dimensione="piccolo" variante="secondario" onClick={() => void g.aggiorna({ scadenza: spostaScadenza(c.scadenza, 1) })}>
              Aspetta un giorno
            </Bottone>
            <Bottone dimensione="piccolo" variante="secondario" onClick={() => sollecitiRef.current?.scrollIntoView({ behavior: "smooth" })}>
              Sollecita ancora
            </Bottone>
          </div>
        </Avviso>
      ) : null}

      {dichiarati.length > 0 ? (
        <section aria-labelledby="da-confermare" className="flex flex-col gap-3 rounded-3xl bg-surface-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 id="da-confermare" className="flex items-center gap-2 text-xl font-semibold text-accent-2">
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-verde-medio" />
              Da confermare
            </h2>
            <span className="rounded-full bg-verde-medio px-3 py-1 text-xs font-bold text-on-accent">
              {dichiarati.length} {dichiarati.length === 1 ? "accredito" : "accrediti"}
            </span>
          </div>
          <p className="text-sm text-ink-soft">Conferma quando vedi arrivare i soldi: solo i confermati entrano nel totale.</p>
          <ul className="flex flex-col gap-2">
            {dichiarati.map((r) => (
              <ConfermaRiga key={r.id} r={r} quota={quota} azione={g.azione} tipo="dichiarato" />
            ))}
          </ul>
        </section>
      ) : null}

      {contanti.length > 0 ? (
        <section aria-labelledby="contanti" className="flex flex-col gap-3 rounded-3xl bg-gold-field p-4">
          <h2 id="contanti" className="flex items-center gap-2 text-xl font-semibold">
            <Icona nome="handshake" />
            Contanti da ricevere ({contanti.length})
          </h2>
          <ul className="flex flex-col gap-2">
            {contanti.map((r) => (
              <ConfermaRiga key={r.id} r={r} quota={quota} azione={g.azione} tipo="contanti" />
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="tutti" className="flex flex-col gap-3 rounded-3xl bg-surface p-4 shadow-carta">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 id="tutti" className="scroll-mt-24 text-xl font-semibold text-accent-2">
              Partecipanti
            </h2>
            <p className="text-xs text-ink-soft">{Math.max(c.previsti, c.nAttesi)} previsti</p>
          </div>
          {!chiusa ? (
            <Bottone variante="verde" dimensione="piccolo" onClick={() => setAggiungiAperto((v) => !v)} aria-expanded={aggiungiAperto}>
              <Icona nome="person_add" dimensione={18} />
              Aggiungi
            </Bottone>
          ) : null}
        </div>
        {aggiungiAperto && !chiusa ? (
          <form onSubmit={aggiungi} className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <Campo etichetta="Nome da aggiungere" value={nuovoNome} onChange={(e) => setNuovoNome(e.target.value)} autoComplete="off" autoFocus />
            </div>
            <Bottone type="submit" variante="secondario">
              Aggiungi
            </Bottone>
          </form>
        ) : null}
        <div role="group" aria-label="Mostra" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {FILTRI.map((f) => {
            const n = tutti.filter(f.vale).length;
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={filtro === f.id}
                onClick={() => setFiltro(f.id)}
                className={`inline-flex min-h-10 shrink-0 items-center rounded-full px-4 text-sm font-bold ${filtro === f.id ? "bg-accent text-on-accent" : "bg-surface-2"}`}
              >
                {f.testo} ({n})
              </button>
            );
          })}
        </div>
        {visibili.length === 0 ? (
          <p className="py-4 text-center text-sm text-ink-soft">{tutti.length === 0 ? "Ancora nessuno. Manda il link al gruppo!" : "Nessuno in questo elenco."}</p>
        ) : null}
        <ul className="flex flex-col gap-2">
          {visibili.map((r) => (
            <RigaTutti key={r.id} r={r} c={c} azione={g.azione} />
          ))}
        </ul>
        {!chiusa && (c.listaAperta || !c.quotaCongelata) ? (
          <details className="rounded-2xl bg-surface-2 px-4 py-1">
            <summary className="min-h-tocco cursor-pointer py-3 text-sm font-bold">Chiudi le adesioni</summary>
            <div className="flex flex-col gap-2 pb-3">
              <p className="text-sm text-ink-soft">
                Nessun altro potrà aggiungersi
                {c.modoQuota === "divisa" && !c.quotaCongelata ? ` e la quota si ferma a ${formattaEuro(quotaAllaChiusuraAdesioni(c))}` : ""}. Chi ha già aderito può comunque pagare.
              </p>
              <Bottone
                variante="secondario"
                dimensione="piccolo"
                className="self-start"
                onClick={() => void g.aggiorna({ listaAperta: false, quotaCongelata: true, quotaCent: quotaAllaChiusuraAdesioni(c) })}
              >
                Chiudi le adesioni
              </Bottone>
            </div>
          </details>
        ) : null}
      </section>

      {!chiusa ? (
        <section aria-labelledby="solleciti" ref={sollecitiRef} className="flex flex-col gap-3 rounded-3xl bg-surface p-4 shadow-carta">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent">
              <Icona nome="chat" dimensione={20} />
            </span>
            <div>
              <h2 id="solleciti" className="scroll-mt-24 text-xl font-semibold text-accent-2">
                Promemoria WhatsApp
              </h2>
              <p className="text-xs text-ink-soft">Già scritti: li inoltri tu. Nessuno viene nominato.</p>
            </div>
          </div>
          <ul className="flex flex-col gap-3">
            {promemoria.map((p) => (
              <CartaPromemoria key={p.momento} p={p} url={url} onInoltrato={inoltrato} />
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="link" className="flex flex-col gap-3 rounded-3xl bg-surface p-4 shadow-carta">
        <h2 id="link" className="scroll-mt-24 text-xl font-semibold text-accent-2">
          Il link della colletta
        </h2>
        <BloccoInvito url={url} messaggio={messaggio} />
      </section>

      <div className="flex flex-col items-center gap-1">
        <BottoneLink href={`/gestisci/${slug}/chiusura`} variante="azione" pieno>
          <Icona nome="shopping_bag" dimensione={22} />
          {chiusa ? "Vedi la chiusura" : "Chiudi e compra il regalo"}
        </BottoneLink>
        <div className="flex flex-wrap justify-center gap-x-4">
          <Link href={`/gestisci/${slug}/dati`} className="inline-flex min-h-tocco items-center gap-1 text-sm font-bold text-accent">
            <Icona nome="bar_chart" dimensione={18} />
            Statistiche
          </Link>
          <Link href={`/c/${slug}`} className="inline-flex min-h-tocco items-center gap-1 text-sm font-bold text-accent">
            <Icona nome="visibility" dimensione={18} />
            Pagina pubblica
          </Link>
        </div>
      </div>
    </div>
  );
}
