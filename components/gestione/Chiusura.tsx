"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { BloccoInvito } from "@/components/BloccoInvito";
import { Avviso, Bottone, BottoneLink, Campo, Icona, ImmagineProdotto, SchedaScelta } from "@/components/ui";
import { urlPerAcquisto } from "@/lib/dominio/amazon";
import { dataConGiorno } from "@/lib/dominio/date";
import { euroPerCampo, formattaEuro, leggiEuro } from "@/lib/dominio/importi";
import { linkColletta } from "@/lib/dominio/messaggi";
import { testiPromemoria } from "@/lib/dominio/promemoria";
import { calcolaChiusura, quotaEffettiva, quoteMancanti } from "@/lib/dominio/quota";
import { spostaScadenza } from "@/lib/dominio/scadenza";
import type { DestinazioneAvanzo, Prodotto } from "@/lib/tipi";
import { baseUrlClient } from "@/lib/url";
import { useGestione } from "./useGestione";

type Strada = "io" | "meno" | "rimando";

function urlHttp(t: string): boolean {
  try {
    const u = new URL(t);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export function Chiusura({ slug }: { slug: string }) {
  const { dati, modalita } = useApp();
  const g = useGestione(slug);
  const { colletta: c, righe } = g;
  const [strada, setStrada] = useState<Strada | null>(null);
  const [spesa, setSpesa] = useState("");
  const [ricevuta, setRicevuta] = useState("");
  const [destinazione, setDestinazione] = useState<DestinazioneAvanzo>("biglietto");
  const [economici, setEconomici] = useState<Prodotto[] | null>(null);
  const [occupato, setOccupato] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [upload, setUpload] = useState(false);
  const [uploadPossibile, setUploadPossibile] = useState(false);

  useEffect(() => {
    if (modalita !== "firestore") return;
    import("@/lib/firebase/ricevute").then((m) => setUploadPossibile(m.storageConfigurato())).catch(() => {});
  }, [modalita]);

  const prezzo = c?.prodotto.prezzoCent ?? 0;
  const totale = c?.totaleConfermatoCent ?? 0;
  const mancante = Math.max(0, prezzo - totale);

  // La spesa parte dal prezzo del regalo.
  useEffect(() => {
    if (c && spesa === "") setSpesa(euroPerCampo(c.prodotto.prezzoCent));
  }, [c, spesa]);

  useEffect(() => {
    if (strada !== "meno" || economici) return;
    dati
      .elencaProdotti()
      .then((p) => setEconomici(p.filter((x) => x.prezzoCent <= totale)))
      .catch(() => setEconomici([]));
  }, [strada, economici, dati, totale]);

  if (g.carico === "caricamento") return <p className="py-10 text-center text-ink-soft">Carico la raccolta…</p>;
  if (!c) return <p className="py-10 text-center text-ink-soft">Questa colletta non esiste.</p>;

  const url = linkColletta(typeof window === "undefined" ? "" : baseUrlClient(), slug);
  const quota = quotaEffettiva(c);
  if (c.votazione && !c.votazione.chiusa) {
    return (
      <div className="mx-auto flex max-w-dashboard flex-col gap-4 rounded-3xl bg-surface p-6 shadow-carta">
        <h1 className="text-[28px] font-bold leading-tight text-accent-2">Prima si sceglie il regalo</h1>
        <p className="text-ink-soft">La votazione è ancora aperta: non c’è ancora un regalo da comprare. Chiudila dalla raccolta, o aspetta che scada.</p>
        <BottoneLink href={`/gestisci/${slug}`} className="self-start">
          Torna alla raccolta
        </BottoneLink>
      </div>
    );
  }
  const chiusa = c.stato === "chiusa";
  const puoComprare = mancante === 0 || strada === "io";
  const speseCent = leggiEuro(spesa);
  const esito = speseCent !== null ? calcolaChiusura(totale, speseCent, c.nConfermati) : null;
  const confermati = righe.filter((r) => r.stato === "confermato");

  async function chiudi() {
    if (!c || speseCent === null) return setErrore("Scrivi quanto hai speso, per esempio 116 o 115,90.");
    if (ricevuta.trim() && !urlHttp(ricevuta.trim())) return setErrore("Il link della ricevuta non è valido.");
    setErrore(null);
    setOccupato(true);
    const ok = await g.aggiorna({
      stato: "chiusa",
      acquisto: {
        fatto: true,
        speseCent,
        ricevutaUrl: ricevuta.trim() || null,
        destinazioneAvanzo: esito && esito.avanzoCent > 0 ? destinazione : null,
      },
    });
    setOccupato(false);
    if (!ok) setErrore("Non sono riuscito a chiudere la colletta. Riprova.");
  }

  async function caricaFile(file: File) {
    setUpload(true);
    setErrore(null);
    try {
      const { caricaRicevuta } = await import("@/lib/firebase/ricevute");
      setRicevuta(await caricaRicevuta(slug, file));
    } catch (e) {
      setErrore(e instanceof Error ? e.message : "Caricamento non riuscito.");
    } finally {
      setUpload(false);
    }
  }

  if (chiusa) {
    const a = c.acquisto;
    const ch = a?.speseCent != null ? calcolaChiusura(totale, a.speseCent, c.nConfermati) : null;
    return (
      <div className="mx-auto flex max-w-dashboard flex-col gap-5">
        <header className="flex flex-col gap-2 rounded-3xl bg-accent p-6 text-on-accent">
          <p className="inline-flex items-center gap-1 self-start rounded-full bg-surface text-accent px-3 py-1 text-xs font-bold">
            <Icona nome="check_circle" dimensione={16} />
            Colletta chiusa
          </p>
          <h1 className="text-[28px] font-bold leading-tight">Regalo comprato! 🎉</h1>
          <p className="text-sm">Il regalo per {c.festeggiato} è stato acquistato.</p>
        </header>
        <section className="flex flex-col gap-3 rounded-3xl bg-surface p-5 shadow-carta">
          <h2 className="text-xl font-semibold text-accent-2">Rendiconto</h2>
          <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2">
            <dt>Raccolto</dt>
            <dd className="cifre text-right font-bold">{formattaEuro(totale)}</dd>
            <dt>Speso</dt>
            <dd className="cifre text-right font-bold">{formattaEuro(a?.speseCent ?? 0)}</dd>
            {ch && ch.avanzoCent > 0 ? (
              <>
                <dt>Avanzo</dt>
                <dd className="cifre text-right font-bold">{formattaEuro(ch.avanzoCent)}</dd>
              </>
            ) : null}
          </dl>
          {ch && ch.avanzoCent > 0 && a?.destinazioneAvanzo === "restituito" ? (
            <div className="flex flex-col gap-2">
              <p>
                Da restituire: <strong className="cifre">{formattaEuro(ch.restituzioneACapoCent)}</strong> a testa. I bonifici li fai tu.
              </p>
              <ul className="grid gap-1 sm:grid-cols-2">
                {confermati.map((r) => (
                  <li key={r.id} className="flex justify-between rounded-xl bg-surface-2 px-3 py-2 text-sm">
                    <span>{r.nome}</span>
                    <span className="cifre font-bold">{formattaEuro(ch.restituzioneACapoCent)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {ch && ch.avanzoCent > 0 && a?.destinazioneAvanzo === "biglietto" ? <p>L’avanzo serve per il biglietto e la confezione.</p> : null}
          {ch && ch.avanzoCent > 0 && a?.destinazioneAvanzo === "extra" ? <p>L’avanzo è andato in un extra al regalo.</p> : null}
          {ch && ch.avanzoCent < 0 ? <p>La differenza di {formattaEuro(-ch.avanzoCent)} l’hai messa tu.</p> : null}
        </section>
        <div className="flex flex-col gap-2">
          <BottoneLink variante="verde" href={`/c/${slug}/biglietto`} pieno>
            <Icona nome="mail" dimensione={20} />
            Biglietto da stampare
          </BottoneLink>
          <BottoneLink href={`/c/${slug}`} variante="secondario" pieno>
            Rendiconto pubblico
          </BottoneLink>
          <BottoneLink href={`/gestisci/${slug}`} variante="testuale" className="self-center">
            Torna alla raccolta
          </BottoneLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-dashboard flex-col gap-5">
      <Link href={`/gestisci/${slug}`} className="inline-flex min-h-10 items-center gap-1 self-start rounded-full bg-surface-2 pl-3 pr-4 text-sm font-bold">
        <Icona nome="arrow_back" dimensione={18} />
        La raccolta
      </Link>
      {mancante === 0 ? (
        <header className="flex flex-col gap-2 rounded-3xl bg-accent p-6 text-on-accent" aria-live="polite">
          <p className="inline-flex items-center gap-1 self-start rounded-full bg-surface text-accent px-3 py-1 text-xs font-bold">
            <Icona nome="verified" dimensione={16} />
            {c.nConfermati} {c.nConfermati === 1 ? "confermato" : "confermati"} · Raccolta completata
          </p>
          <h1 className="text-[28px] font-bold leading-tight">Hai tutto quello che serve! 🎉</h1>
          <p className="text-sm">
            Raccolti <strong className="cifre">{formattaEuro(totale)}</strong> su {formattaEuro(prezzo)} previsti.
          </p>
        </header>
      ) : (
        <h1 className="text-[32px] font-bold leading-[38px] tracking-tight text-accent-2">Chiudi la colletta</h1>
      )}

      {g.avviso ? (
        <Avviso tono="attenzione" live>
          <p>{g.avviso}</p>
        </Avviso>
      ) : null}

      {mancante > 0 ? (
        <section aria-labelledby="mancano" className="flex flex-col gap-4">
          <div className="flex flex-col gap-1 rounded-3xl bg-gold-field p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-gold">Raccolti {formattaEuro(totale)} su {formattaEuro(prezzo)}</p>
            <h2 id="mancano" className="cifre text-4xl font-extrabold">
              Mancano {formattaEuro(mancante)}
            </h2>
            <p className="text-sm">
              Sono {quoteMancanti(prezzo, totale, quota)} {quoteMancanti(prezzo, totale, quota) === 1 ? "quota" : "quote"} da {formattaEuro(quota)}. Nessuna di queste strade scrive a chi non ha pagato.
            </p>
          </div>
          <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-ink-soft">Come procedere</h3>
          <div role="radiogroup" aria-label="Come procedere" className="flex flex-col gap-3">
            <SchedaScelta
              icona="volunteer_activism"
              titolo="Ci metto io la differenza"
              descrizione={`Metti tu ${formattaEuro(mancante)} e compri il regalo.`}
              selezionata={strada === "io"}
              onSeleziona={() => setStrada("io")}
            />
            <SchedaScelta
              icona="redeem"
              titolo="Scelgo un regalo meno costoso"
              descrizione={`Uno che costa al massimo ${formattaEuro(totale)}. Il gruppo vede il nuovo regalo.`}
              selezionata={strada === "meno"}
              onSeleziona={() => setStrada("meno")}
            />
            <SchedaScelta
              icona="schedule"
              titolo="Rimando di un giorno e sollecito"
              descrizione="Scadenza a domani alle 20:00 e un messaggio pronto: lo inoltri tu."
              selezionata={strada === "rimando"}
              onSeleziona={() => setStrada("rimando")}
            />
          </div>

          {strada === "meno" ? (
            <div className="flex flex-col gap-3">
              {economici === null ? <p className="text-ink-soft">Cerco nel catalogo…</p> : null}
              {economici?.length === 0 ? <p className="text-ink-soft">Nel catalogo non c’è nulla che costi così poco.</p> : null}
              <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {economici?.map((p) => (
                  <li key={p.slug} className="flex flex-col gap-1 overflow-hidden rounded-2xl bg-surface p-2 shadow-carta">
                    <ImmagineProdotto prodotto={p} className="rounded-xl" />
                    <div className="flex flex-1 flex-col gap-2 px-1 pb-1">
                      <p className="text-sm leading-snug">{p.nome}</p>
                      <p className="cifre font-bold">{formattaEuro(p.prezzoCent)}</p>
                      <Bottone variante="verde"
                        dimensione="piccolo"
                        className="mt-auto"
                        onClick={async () => {
                          const ok = await g.aggiorna({
                            prodotto: { prodottoId: p.slug, nome: p.nome, prezzoCent: p.prezzoCent, consegnaGiorni: p.consegnaGiorni, urlEsterno: p.urlEsterno, immagine: p.immagine },
                          });
                          if (ok) setStrada(null);
                        }}
                      >
                        Scegli questo
                      </Bottone>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {strada === "rimando" ? (
            <div className="flex flex-col gap-3">
              <Bottone variante="verde"
                className="self-start"
                onClick={async () => {
                  await g.aggiorna({ scadenza: spostaScadenza(c.scadenza, 1) });
                }}
              >
                Sposta la scadenza di un giorno
              </Bottone>
              <p className="text-sm text-ink-soft">Dopo lo spostamento la raccolta si chiude il {dataConGiorno(spostaScadenza(c.scadenza, 1))} alle 20:00. Ecco un messaggio da inoltrare:</p>
              <BloccoInvito url={url} messaggio={testiPromemoria(c, url).meno1} />
            </div>
          ) : null}
        </section>
      ) : (
        null
      )}

      {puoComprare ? (
        <>
        <section aria-labelledby="acquisto" className="flex flex-col gap-4 rounded-3xl bg-surface p-5 shadow-carta">
          <h2 id="acquisto" className="flex items-center gap-2 text-xl font-semibold text-accent-2">
            <span className="cifre flex h-7 w-7 items-center justify-center rounded-full bg-accent text-sm text-on-accent">1</span>
            Compra il regalo
          </h2>
          <div className="flex items-center gap-3 rounded-2xl bg-surface-2 p-2">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white">
              <ImmagineProdotto prodotto={c.prodotto} className="aspect-square h-full" />
            </div>
            <div className="min-w-0">
              <p className="line-clamp-2 font-display text-lg font-semibold leading-snug">{c.prodotto.nome}</p>
              <p className="cifre font-extrabold">
                {formattaEuro(c.prodotto.prezzoCent)} <span className="text-xs font-normal text-ink-soft">prezzo stimato</span>
              </p>
            </div>
          </div>
          <BottoneLink href={urlPerAcquisto(c.prodotto.urlEsterno)} esterno variante="secondario" pieno>
            Compra su Amazon.it <Icona nome="open_in_new" dimensione={20} />
          </BottoneLink>
          <Campo etichetta="Quanto hai speso davvero? (€)" inputMode="decimal" value={spesa} onChange={(e) => setSpesa(e.target.value)} />
          <div className="flex flex-col gap-2">
            <Campo
              etichetta="Link della ricevuta (facoltativo)"
              type="url"
              inputMode="url"
              value={ricevuta}
              onChange={(e) => setRicevuta(e.target.value)}
              placeholder="https://…"
              suggerimento={uploadPossibile ? "Oppure carica il file qui sotto." : "Puoi incollare il link del documento o della ricevuta."}
            />
            {uploadPossibile ? (
              <label className="flex min-h-tocco cursor-pointer flex-col gap-1 text-sm">
                <span className="font-medium">{upload ? "Carico il file…" : "Carica la ricevuta (immagine o PDF, massimo 5 MB)"}</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  disabled={upload}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void caricaFile(f);
                  }}
                />
              </label>
            ) : null}
          </div>

        </section>

          {esito ? (
            <section aria-labelledby="avanzo" className="flex flex-col gap-3 rounded-3xl bg-surface p-5 shadow-carta" aria-live="polite">
              {esito.avanzoCent > 0 ? (
                <>
                  <h2 id="avanzo" className="flex items-center gap-2 text-xl font-semibold text-accent-2">
                    <span className="cifre flex h-7 w-7 items-center justify-center rounded-full bg-accent text-sm text-on-accent">2</span>
                    C’è un avanzo di <span className="cifre text-accent">+{formattaEuro(esito.avanzoCent)}</span>
                  </h2>
                  <div role="radiogroup" aria-label="Che cosa ne facciamo dell'avanzo" className="flex flex-col gap-2">
                    <SchedaScelta icona="redeem" titolo="Lo tengo per biglietto e confezione" selezionata={destinazione === "biglietto"} onSeleziona={() => setDestinazione("biglietto")} />
                    <SchedaScelta
                      icona="payments"
                      titolo="Lo restituisco"
                      descrizione={`${formattaEuro(esito.restituzioneACapoCent)} a testa. I bonifici li fai tu.`}
                      selezionata={destinazione === "restituito"}
                      onSeleziona={() => setDestinazione("restituito")}
                    />
                    <SchedaScelta icona="add_circle" titolo="Lo aggiungo come extra al regalo" selezionata={destinazione === "extra"} onSeleziona={() => setDestinazione("extra")} />
                  </div>
                  {destinazione === "restituito" && esito.restituzioneACapoCent > 0 ? (
                    <ul className="grid gap-1 sm:grid-cols-2">
                      {confermati.map((r) => (
                        <li key={r.id} className="flex justify-between rounded-xl bg-surface-2 px-3 py-2 text-sm">
                          <span>{r.nome}</span>
                          <span className="cifre font-bold">{formattaEuro(esito.restituzioneACapoCent)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </>
              ) : esito.avanzoCent < 0 ? (
                <p id="avanzo">
                  La spesa supera il raccolto di <strong className="cifre">{formattaEuro(-esito.avanzoCent)}</strong>: la differenza la metti tu.
                </p>
              ) : (
                <p id="avanzo">Il raccolto copre esattamente la spesa: nessun avanzo.</p>
              )}
            </section>
          ) : null}

          {esito ? (
            <section aria-labelledby="riepilogo" className="flex flex-col gap-3 rounded-3xl bg-surface p-5 shadow-carta">
              <div className="flex items-center justify-between">
                <h2 id="riepilogo" className="text-xl font-semibold text-accent-2">
                  Rendiconto per il gruppo
                </h2>
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest">Pubblico</span>
              </div>
              <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 rounded-2xl bg-surface-2 p-4 text-sm">
                <dt>Totale raccolto ({c.nConfermati === 1 ? "1 quota" : `${c.nConfermati} quote`})</dt>
                <dd className="cifre text-right font-bold">{formattaEuro(totale)}</dd>
                <dt>Costo del regalo</dt>
                <dd className="cifre text-right font-bold">−{formattaEuro(speseCent ?? 0)}</dd>
                <dt className="border-t border-line pt-2 font-bold">{esito.avanzoCent >= 0 ? "Avanzo" : "Differenza che metti tu"}</dt>
                <dd className="cifre border-t border-line pt-2 text-right text-lg font-extrabold">{formattaEuro(Math.abs(esito.avanzoCent))}</dd>
              </dl>
            </section>
          ) : null}

          {errore ? (
            <p role="alert" className="text-sm font-semibold text-error before:mr-1 before:content-['⚠']">
              {errore}
            </p>
          ) : null}
          <Bottone variante="azione" pieno onClick={() => void chiudi()} disabled={occupato}>
            <Icona nome="done_all" dimensione={22} />
            {occupato ? "Chiudo…" : "Chiudi la colletta"}
          </Bottone>
          <p className="text-center text-xs text-ink-soft">Fallo dopo aver comprato il regalo: chi apre il link vedrà il rendiconto.</p>
        </>
      ) : null}
    </div>
  );
}
