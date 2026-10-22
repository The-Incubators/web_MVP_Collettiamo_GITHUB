"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { BloccoInvito } from "@/components/BloccoInvito";
import { Avviso, Barra, Bottone, BottoneCopia, BottoneLink, Campo, CampoSelezione, Etichetta, RigaPartecipante } from "@/components/ui";
import { classiBottone } from "@/components/ui/Bottone";
import { dataConGiorno } from "@/lib/dominio/date";
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

function dettaglioRiga(r: Partecipante, quota: number): string {
  const parti: string[] = [];
  if (r.metodo) parti.push(NOMI_METODO[r.metodo]);
  parti.push(`causale ${r.causale}`);
  parti.push(formattaEuro(r.importoCent ?? quota));
  return parti.join(" · ");
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
      dettaglio={dettaglioRiga(r, quota)}
      etichetta={<Etichetta stato={tipo === "contanti" ? "contanti" : "daConfermare"} />}
      azioni={
        <>
          <Bottone dimensione="piccolo" onClick={() => conferma(r.importoCent ?? undefined)}>
            {tipo === "contanti" ? "Ricevuti" : "Confermo"}
          </Bottone>
          {tipo === "dichiarato" ? (
            <Bottone dimensione="piccolo" variante="secondario" onClick={() => void azione(r.id, { tipo: "nonTrovato" })}>
              Non l’ho trovato
            </Bottone>
          ) : null}
          <Bottone dimensione="piccolo" variante="testuale" onClick={() => setDiverso((v) => !v)} aria-expanded={diverso}>
            Importo diverso
          </Bottone>
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
              <Bottone type="submit" dimensione="piccolo">
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
      etichetta={<Etichetta stato={stato} />}
      azioni={
        chiusa ? undefined : (
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
                <Bottone type="submit" dimensione="piccolo">
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
    <li className="contenitore flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-sans text-base font-semibold">{p.titolo}</h3>
        <Etichetta stato={p.maturo ? "daConfermare" : "invitato"}>{quando}</Etichetta>
      </div>
      <p className="text-sm text-ink-soft">
        {p.destinatari}
        {p.nDestinatari !== null ? ` · ${p.nDestinatari} ${p.nDestinatari === 1 ? "persona" : "persone"}` : ""}
      </p>
      <p className="whitespace-pre-wrap rounded-controllo border border-line bg-surface-2 p-3 text-sm">{p.testo}</p>
      {p.esaurito ? (
        <p className="text-sm text-ink-soft">Tutti hanno già ricevuto quattro messaggi: meglio non insistere.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <BottoneCopia testo={p.testo} etichetta="Copia" onCopia={() => onInoltrato(p)} />
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
      <div className="mx-auto flex max-w-dashboard flex-col gap-8">
        <header className="flex flex-col gap-2">
          <p className="text-sm text-ink-soft">La tua raccolta</p>
          <h1 className="text-3xl">Scegliamo il regalo per {c.festeggiato}</h1>
        </header>
        {g.avviso ? (
          <Avviso tono="attenzione" live>
            <p>{g.avviso}</p>
          </Avviso>
        ) : null}
        <SezioneVotazione slug={slug} colletta={c} aggiorna={g.aggiorna} />
        <section aria-labelledby="link-voto" className="flex flex-col gap-3">
          <h2 id="link-voto" className="text-xl">
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

  return (
    <div className="mx-auto flex max-w-dashboard flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-sm text-ink-soft">{chiusa ? "Colletta chiusa" : "La tua raccolta"}</p>
        <h1 className="text-3xl">Il regalo per {c.festeggiato}</h1>
        <p className="text-ink-soft">{c.prodotto.nome}</p>
      </header>

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

      <section aria-labelledby="sommario" className="contenitore flex flex-col gap-4 p-5">
        <h2 id="sommario" className="sr-only">
          Sommario
        </h2>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p>
            <span className="cifre text-4xl font-bold">{formattaEuro(a.confermatoCent)}</span>
            <span className="text-ink-soft"> confermati su {formattaEuro(a.obiettivoCent)}</span>
          </p>
          <p className="text-sm text-ink-soft">
            {c.nConfermati} {c.nConfermati === 1 ? "persona" : "persone"} su {Math.max(c.previsti, c.nAttesi)}
          </p>
        </div>
        <Barra percento={a.percento} etichetta="Totale confermato sull'obiettivo" alta />
        <ul className="flex flex-col gap-1 text-sm">
          <li>
            {mancanti > 0 ? (
              <>
                Mancano <strong>{mancanti}</strong> {mancanti === 1 ? "quota" : "quote"} da {formattaEuro(quota)}
              </>
            ) : (
              <strong>Obiettivo raggiunto: puoi comprare il regalo.</strong>
            )}
          </li>
          {!chiusa ? (
            <li className={scaduta ? "font-semibold" : ""}>
              {scaduta ? "La raccolta è scaduta il" : "La raccolta si chiude"} {dataConGiorno(c.scadenza)} alle 20:00
              {!scaduta && giorni >= 0 ? ` (${giorni === 0 ? "oggi" : giorni === 1 ? "domani" : `fra ${giorni} giorni`})` : ""}
            </li>
          ) : null}
          {c.quotaCongelata && c.modoQuota === "divisa" ? <li>La quota è congelata a {formattaEuro(c.quotaCent)}: chi si aggiunge paga questa.</li> : null}
        </ul>
        <div className="flex flex-wrap gap-2">
          <BottoneLink href={`/gestisci/${slug}/chiusura`} variante={scaduta || mancanti === 0 ? "primario" : "secondario"}>
            {chiusa ? "Vedi la chiusura" : "Chiudi e compra il regalo"}
          </BottoneLink>
          <BottoneLink href={`/gestisci/${slug}/dati`} variante="secondario">
            I dati della colletta
          </BottoneLink>
          <BottoneLink href={`/c/${slug}`} variante="testuale">
            Pagina pubblica
          </BottoneLink>
        </div>
      </section>

      {scaduta && !chiusa ? (
        <Avviso tono="attenzione" titolo="La raccolta è scaduta">
          <p>{mancanti > 0 ? testoScadenza(mancanti) : "Hai raggiunto l’obiettivo: puoi procedere con l’acquisto."}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Bottone dimensione="piccolo" variante="secondario" onClick={() => void g.aggiorna({ scadenza: spostaScadenza(c.scadenza, 1) })}>
              Aspetta un giorno
            </Bottone>
            <BottoneLink href={`/gestisci/${slug}/chiusura`} dimensione="piccolo" variante="secondario">
              Procedi lo stesso
            </BottoneLink>
            <Bottone dimensione="piccolo" variante="secondario" onClick={() => sollecitiRef.current?.scrollIntoView({ behavior: "smooth" })}>
              Sollecita ancora
            </Bottone>
          </div>
        </Avviso>
      ) : null}

      {dichiarati.length > 0 ? (
        <section aria-labelledby="da-confermare" className="flex flex-col gap-3">
          <h2 id="da-confermare" className="text-xl">
            Da confermare ({dichiarati.length})
          </h2>
          <p className="text-sm text-ink-soft">Hanno detto di aver pagato. Conferma quando vedi arrivare i soldi: solo i confermati entrano nel totale.</p>
          <ul className="flex flex-col gap-2">
            {dichiarati.map((r) => (
              <ConfermaRiga key={r.id} r={r} quota={quota} azione={g.azione} tipo="dichiarato" />
            ))}
          </ul>
        </section>
      ) : null}

      {contanti.length > 0 ? (
        <section aria-labelledby="contanti" className="flex flex-col gap-3">
          <h2 id="contanti" className="text-xl">
            Contanti da ricevere ({contanti.length})
          </h2>
          <ul className="flex flex-col gap-2">
            {contanti.map((r) => (
              <ConfermaRiga key={r.id} r={r} quota={quota} azione={g.azione} tipo="contanti" />
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="tutti" className="flex flex-col gap-3">
        <h2 id="tutti" className="text-xl">
          Tutti i partecipanti ({righe.filter((r) => r.stato !== "rinunciato").length})
        </h2>
        {tutti.length === 0 ? <p className="text-ink-soft">Ancora nessuno. Manda il link al gruppo!</p> : null}
        <ul className="flex flex-col gap-2">
          {tutti.map((r) => (
            <RigaTutti key={r.id} r={r} c={c} azione={g.azione} />
          ))}
        </ul>
        {!chiusa ? (
          <form onSubmit={aggiungi} className="flex flex-wrap items-end gap-2">
            <div className="min-w-48 flex-1">
              <Campo etichetta="Aggiungi un nome" value={nuovoNome} onChange={(e) => setNuovoNome(e.target.value)} autoComplete="off" />
            </div>
            <Bottone type="submit" variante="secondario">
              Aggiungi
            </Bottone>
          </form>
        ) : null}
        {!chiusa && (c.listaAperta || !c.quotaCongelata) ? (
          <div className="flex flex-col gap-2 rounded-contenitore border border-line bg-surface-2 p-4">
            <p className="font-semibold">Chiudi le adesioni</p>
            <p className="text-sm text-ink-soft">
              Nessun altro potrà aggiungersi
              {c.modoQuota === "divisa" && !c.quotaCongelata ? ` e la quota si ferma a ${formattaEuro(quotaAllaChiusuraAdesioni(c))}, il prezzo diviso per chi ha aderito` : ""}.
              Chi ha già aderito può comunque pagare.
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
        ) : null}
      </section>

      {!chiusa ? (
        <section aria-labelledby="solleciti" ref={sollecitiRef} className="flex flex-col gap-3">
          <h2 id="solleciti" className="text-xl">
            Promemoria
          </h2>
          <p className="text-sm text-ink-soft">
            Noi prepariamo i messaggi, tu li inoltri dal tuo telefono. Mai più di quattro per persona, e nessuno viene nominato: dicono solo come partecipare.
          </p>
          <ul className="flex flex-col gap-3">
            {promemoria.map((p) => (
              <CartaPromemoria key={p.momento} p={p} url={url} onInoltrato={inoltrato} />
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="link" className="flex flex-col gap-3">
        <h2 id="link" className="text-xl">
          Il link
        </h2>
        <BloccoInvito url={url} messaggio={messaggio} />
      </section>
    </div>
  );
}
