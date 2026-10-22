"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { BloccoInvito } from "@/components/BloccoInvito";
import { Avviso, Bottone, BottoneLink, Campo, IconaEsterno, ImmagineProdotto, SchedaScelta } from "@/components/ui";
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
      <div className="mx-auto flex max-w-dashboard flex-col gap-4">
        <h1 className="text-3xl">Prima si sceglie il regalo</h1>
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
      <div className="mx-auto flex max-w-dashboard flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl">Colletta chiusa</h1>
          <p className="text-ink-soft">Il regalo per {c.festeggiato} è stato acquistato.</p>
        </header>
        <section className="contenitore flex flex-col gap-3 p-5">
          <h2 className="text-xl">Rendiconto</h2>
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
                  <li key={r.id} className="flex justify-between rounded-controllo border border-line bg-surface-2 px-3 py-2 text-sm">
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
        <div className="flex flex-wrap gap-2">
          <BottoneLink href={`/c/${slug}/biglietto`}>Biglietto da stampare</BottoneLink>
          <BottoneLink href={`/c/${slug}`} variante="secondario">
            Rendiconto pubblico
          </BottoneLink>
          <BottoneLink href={`/gestisci/${slug}`} variante="testuale">
            Torna alla raccolta
          </BottoneLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-dashboard flex-col gap-8">
      <header className="flex flex-col gap-2">
        <Link href={`/gestisci/${slug}`} className="inline-flex min-h-tocco items-center self-start text-sm font-semibold text-accent-2 underline underline-offset-4">
          Torna alla raccolta
        </Link>
        <h1 className="text-3xl">Chiudi e compra il regalo</h1>
        <p className="text-ink-soft">
          Raccolti <strong className="cifre text-ink">{formattaEuro(totale)}</strong> su {formattaEuro(prezzo)}. La scadenza è {dataConGiorno(c.scadenza)}.
        </p>
      </header>

      {g.avviso ? (
        <Avviso tono="attenzione" live>
          <p>{g.avviso}</p>
        </Avviso>
      ) : null}

      {mancante > 0 ? (
        <section aria-labelledby="mancano" className="flex flex-col gap-4">
          <div className="rounded-contenitore border border-gold-line bg-gold-field p-4">
            <h2 id="mancano" className="text-xl">
              Mancano {formattaEuro(mancante)}
            </h2>
            <p className="text-sm">
              Sono {quoteMancanti(prezzo, totale, quota)} {quoteMancanti(prezzo, totale, quota) === 1 ? "quota" : "quote"} da {formattaEuro(quota)}. Scegli come procedere. Nessuna di queste strade scrive a chi non ha pagato.
            </p>
          </div>
          <div role="radiogroup" aria-label="Come procedere" className="flex flex-col gap-3">
            <SchedaScelta
              titolo="Ci metto io la differenza"
              descrizione={`Compri il regalo al prezzo pieno e metti tu ${formattaEuro(mancante)}. Chi ha già pagato non cambia nulla.`}
              selezionata={strada === "io"}
              onSeleziona={() => setStrada("io")}
            />
            <SchedaScelta
              titolo="Scelgo un regalo meno costoso"
              descrizione={`Cambi il regalo con uno che costa al massimo ${formattaEuro(totale)}. Le quote già pagate restano valide e il gruppo vede il nuovo regalo.`}
              selezionata={strada === "meno"}
              onSeleziona={() => setStrada("meno")}
            />
            <SchedaScelta
              titolo="Rimando di un giorno e sollecito"
              descrizione="Sposti la scadenza a domani alle 20:00 e ti prepariamo un messaggio da inoltrare tu, se vuoi. Non scriviamo a nessuno."
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
                  <li key={p.slug} className="contenitore flex flex-col overflow-hidden">
                    <ImmagineProdotto prodotto={p} />
                    <div className="flex flex-1 flex-col gap-2 p-3">
                      <p className="text-sm leading-snug">{p.nome}</p>
                      <p className="cifre font-bold">{formattaEuro(p.prezzoCent)}</p>
                      <Bottone
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
              <Bottone
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
        <Avviso tono="positivo" titolo="Obiettivo raggiunto" live>
          <p>Hai tutto quello che serve. Compra il regalo e poi chiudi la colletta da qui.</p>
        </Avviso>
      )}

      {puoComprare ? (
        <section aria-labelledby="acquisto" className="contenitore flex flex-col gap-5 p-5">
          <h2 id="acquisto" className="text-xl">
            L’acquisto
          </h2>
          <BottoneLink href={urlPerAcquisto(c.prodotto.urlEsterno)} esterno variante="secondario" className="self-start">
            Compra il regalo <IconaEsterno width={18} height={18} />
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

          {esito ? (
            <div className="flex flex-col gap-3 rounded-contenitore border border-accent bg-accent-field p-4" aria-live="polite">
              {esito.avanzoCent > 0 ? (
                <>
                  <p>
                    Avanzo: <strong className="cifre text-2xl">{formattaEuro(esito.avanzoCent)}</strong>
                  </p>
                  <div role="radiogroup" aria-label="Che cosa ne facciamo dell'avanzo" className="flex flex-col gap-2">
                    <SchedaScelta titolo="Lo tengo per biglietto e confezione" selezionata={destinazione === "biglietto"} onSeleziona={() => setDestinazione("biglietto")} />
                    <SchedaScelta
                      titolo="Lo restituisco"
                      descrizione={`${formattaEuro(esito.restituzioneACapoCent)} a testa per ${c.nConfermati} ${c.nConfermati === 1 ? "persona" : "persone"}. I bonifici li fai tu: ti elenchiamo le cifre.`}
                      selezionata={destinazione === "restituito"}
                      onSeleziona={() => setDestinazione("restituito")}
                    />
                    <SchedaScelta titolo="Lo aggiungo come extra al regalo" selezionata={destinazione === "extra"} onSeleziona={() => setDestinazione("extra")} />
                  </div>
                  {destinazione === "restituito" && esito.restituzioneACapoCent > 0 ? (
                    <ul className="grid gap-1 sm:grid-cols-2">
                      {confermati.map((r) => (
                        <li key={r.id} className="flex justify-between rounded-controllo border border-line bg-surface px-3 py-2 text-sm">
                          <span>{r.nome}</span>
                          <span className="cifre font-bold">{formattaEuro(esito.restituzioneACapoCent)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </>
              ) : esito.avanzoCent < 0 ? (
                <p>
                  La spesa supera il raccolto di <strong className="cifre">{formattaEuro(-esito.avanzoCent)}</strong>: la differenza la metti tu.
                </p>
              ) : (
                <p>Il raccolto copre esattamente la spesa: nessun avanzo.</p>
              )}
            </div>
          ) : null}

          {errore ? (
            <p role="alert" className="text-sm font-semibold text-error before:mr-1 before:content-['⚠']">
              {errore}
            </p>
          ) : null}
          <Bottone pieno onClick={() => void chiudi()} disabled={occupato}>
            {occupato ? "Chiudo…" : "Ho comprato il regalo: chiudi la colletta"}
          </Bottone>
          <p className="text-sm text-ink-soft">Alla chiusura la pagina del gruppo mostra il rendiconto e il biglietto con i messaggi si può stampare.</p>
        </section>
      ) : null}
    </div>
  );
}
