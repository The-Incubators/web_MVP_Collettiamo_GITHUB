"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Stelle } from "@/components/partecipante/Stelle";
import { Avviso, Bottone, Campo, CampoTesto } from "@/components/ui";
import { useIntestazioniAdmin } from "@/lib/admin/client";
import { FASCE_ETA, type FasciaEta } from "@/lib/dati/eta-prodotti";
import { linkSchedaAmazon } from "@/lib/dominio/amazon";
import { formattaEuro } from "@/lib/dominio/importi";
import { STELLE_PREDEFINITE } from "@/lib/dominio/ordineCatalogo";
import { MAX_NOTA } from "@/lib/importazione/prodotto";
import { MOTIVI, type Candidato, type Esito } from "@/lib/importazione/tipi";

const DESTINATARI = [
  { id: "uomo", testo: "Uomo" },
  { id: "donna", testo: "Donna" },
] as const;
const TEMI = [
  { id: "viaggio", testo: "Viaggio" },
  { id: "tecnologia", testo: "Tecnologia" },
  { id: "arredamento", testo: "Arredamento" },
] as const;

interface Modulo {
  esito: Esito | null;
  motivi: string[];
  nota: string;
  destinatari: string[];
  temi: string[];
  sottocategoria: string;
  eta: FasciaEta[];
  stelle: number;
}

function moduloDa(c: Candidato): Modulo {
  return { esito: null, motivi: [], nota: "", destinatari: c.destinatari, temi: c.temi, sottocategoria: c.sottocategoria ?? "", eta: [], stelle: STELLE_PREDEFINITE };
}

const alterna = <T,>(lista: T[], x: T) => (lista.includes(x) ? lista.filter((y) => y !== x) : [...lista, x]);

/** Un'etichetta che si accende e si spegne (scelta multipla). */
function Pillola({ attiva, onClick, children }: { attiva: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={attiva}
      onClick={onClick}
      className={`inline-flex min-h-tocco items-center rounded-full px-4 text-sm font-semibold transition-colors ${
        attiva ? "bg-accent text-on-accent" : "bg-surface-2 text-ink hover:bg-line"
      }`}
    >
      {children}
    </button>
  );
}

/** Quello che il formato JSON dell'agente aggiunge: si legge prima di decidere. */
function InfoDellAgente({ info }: { info: NonNullable<Candidato["agente"]> }) {
  const righe: [string, string | undefined][] = [
    ["Variante", info.variante],
    ["Tipo", [info.categoria, info.sottocategoria].filter(Boolean).join(" · ") || undefined],
    ["Per chi", info.destinatari?.join(" · ")],
    ["Limiti", info.limiti?.join(" ")],
    ["Da verificare", info.verificheMancanti?.join(" ")],
    ["Disponibilità", info.disponibilita],
  ];
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-2xl bg-surface-2 p-3 text-sm">
      {righe
        .filter(([, v]) => v)
        .map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="font-semibold">{k}</dt>
            <dd className="text-ink-soft">{v}</dd>
          </div>
        ))}
    </dl>
  );
}

function Gruppo({ titolo, children, nota }: { titolo: string; children: ReactNode; nota?: string }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-semibold">{titolo}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
      {nota ? <p className="text-xs text-ink-soft">{nota}</p> : null}
    </fieldset>
  );
}

/**
 * Fase 2: i prodotti in revisione uno alla volta. Per ciascuno: Importa (con età, categorie e stelle) o Scarta,
 * sempre con almeno un motivo e, se vuoi, una frase. Sotto, lo storico delle decisioni.
 */
export function Revisione() {
  const intestazioni = useIntestazioniAdmin();
  const [candidati, setCandidati] = useState<Candidato[] | null>(null);
  const [vietato, setVietato] = useState(false);
  const [attivo, setAttivo] = useState<string | null>(null);
  const [modulo, setModulo] = useState<Modulo | null>(null);
  const [invio, setInvio] = useState(false);
  const [messaggio, setMessaggio] = useState<{ tono: "positivo" | "attenzione"; testo: ReactNode } | null>(null);
  const [filtro, setFiltro] = useState<"tutti" | Esito>("tutti");

  const carica = useCallback(async () => {
    const r = await fetch("/api/admin/importazione", { headers: await intestazioni(), cache: "no-store" });
    if (r.status === 403) return setVietato(true);
    const d = (await r.json()) as { ok: boolean; candidati: Candidato[] };
    if (d.ok) setCandidati(d.candidati);
  }, [intestazioni]);

  useEffect(() => {
    void carica().catch(() => setMessaggio({ tono: "attenzione", testo: "Non riesco a caricare i prodotti. Riprova fra poco." }));
  }, [carica]);

  // In revisione, dal lotto più vecchio; dentro il lotto, nell'ordine dell'agente.
  const coda = useMemo(
    () => (candidati ?? []).filter((c) => c.stato === "in_revisione").sort((a, b) => a.caricatoIl - b.caricatoIl || a.idOrigine.localeCompare(b.idOrigine)),
    [candidati],
  );
  const decisi = useMemo(
    () => (candidati ?? []).filter((c) => c.stato !== "in_revisione").sort((a, b) => (b.decisione?.il ?? 0) - (a.decisione?.il ?? 0)),
    [candidati],
  );
  const corrente = coda.find((c) => c.asin === attivo) ?? coda[0] ?? null;

  useEffect(() => {
    setModulo(corrente ? moduloDa(corrente) : null);
  }, [corrente?.asin]); // eslint-disable-line react-hooks/exhaustive-deps

  if (vietato) return <Avviso tono="attenzione">Questo account non è autorizzato a gestire il catalogo.</Avviso>;
  if (!candidati) return <p className="py-10 text-center text-ink-soft">Carico i prodotti…</p>;

  const cambia = (patch: Partial<Modulo>) => setModulo((m) => (m ? { ...m, ...patch } : m));
  const prossimo = (dopo: Candidato) => {
    const i = coda.findIndex((c) => c.asin === dopo.asin);
    return coda[(i + 1) % coda.length]?.asin ?? null;
  };

  async function decidi() {
    if (!corrente || !modulo?.esito) return;
    setInvio(true);
    setMessaggio(null);
    const corpo =
      modulo.esito === "scartato"
        ? { esito: "scartato", motivi: modulo.motivi, nota: modulo.nota }
        : {
            esito: "importato",
            motivi: modulo.motivi,
            nota: modulo.nota,
            destinatari: modulo.destinatari,
            temi: modulo.temi,
            sottocategoria: modulo.sottocategoria,
            eta: modulo.eta,
            stelle: modulo.stelle,
          };
    try {
      const r = await fetch(`/api/admin/importazione/${corrente.asin}`, {
        method: "PUT",
        headers: { "content-type": "application/json", ...(await intestazioni()) },
        body: JSON.stringify(corpo),
      });
      const d = (await r.json()) as { ok: boolean; errore?: string; slug?: string; id?: string };
      if (!d.ok) throw new Error(d.errore ?? "Errore");
      const successivo = coda.length > 1 ? prossimo(corrente) : null;
      setMessaggio({
        tono: "positivo",
        testo:
          modulo.esito === "importato" ? (
            <>
              «{corrente.nome}» è nel catalogo come <strong>{d.id}</strong>, in fondo all’ordine.{" "}
              <Link href={`/prodotto/${d.slug}`} target="_blank" className="font-bold underline underline-offset-4">
                Guardalo nel sito
              </Link>
            </>
          ) : (
            <>«{corrente.nome}» scartato.</>
          ),
      });
      setAttivo(successivo);
      await carica();
    } catch (e) {
      setMessaggio({ tono: "attenzione", testo: `Non sono riuscito a salvare la decisione${e instanceof Error && e.message !== "Errore" ? `: ${e.message}` : ". Riprova."}` });
    } finally {
      setInvio(false);
    }
  }

  async function riapri(c: Candidato) {
    setMessaggio(null);
    const r = await fetch(`/api/admin/importazione/${c.asin}`, {
      method: "PUT",
      headers: { "content-type": "application/json", ...(await intestazioni()) },
      body: JSON.stringify({ esito: "riapri" }),
    });
    const d = (await r.json()) as { ok: boolean; errore?: string };
    if (!d.ok) return setMessaggio({ tono: "attenzione", testo: d.errore ?? "Non sono riuscito a rimetterlo in revisione." });
    setAttivo(c.asin);
    await carica();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const mancaQualcosa = !modulo?.esito || modulo.motivi.length === 0 || (modulo.esito === "importato" && modulo.eta.length === 0);
  const storico = decisi.filter((c) => filtro === "tutti" || c.stato === filtro);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-[32px] font-bold leading-[38px] tracking-tight text-accent-2">Revisione</h1>
        <p className="text-ink-soft">
          {coda.length === 0
            ? "Nessun prodotto da rivedere."
            : `${coda.length} ${coda.length === 1 ? "prodotto da rivedere" : "prodotti da rivedere"}. Per ognuno scegli se importarlo o scartarlo, e perché: le tue scelte diventano gli esempi per il tuo agente.`}
        </p>
      </header>

      {messaggio ? (
        <Avviso tono={messaggio.tono} live>
          <p>{messaggio.testo}</p>
        </Avviso>
      ) : null}

      {coda.length === 0 ? (
        <Link href="/backoffice/importa" className="self-start text-sm font-bold text-accent underline underline-offset-4">
          Importa una nuova cartella →
        </Link>
      ) : null}

      {corrente && modulo ? (
        <article aria-labelledby="corrente" className="contenitore flex flex-col gap-5 p-5">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex aspect-square w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-line bg-white sm:w-64">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={corrente.foto} alt="" className="h-full w-full object-contain p-2" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <p className="text-xs font-semibold text-ink-soft">
                {corrente.idOrigine} · {corrente.asin} · {corrente.marca} · lotto «{corrente.lotto}» · {coda.indexOf(corrente) + 1} di {coda.length}
              </p>
              <h2 id="corrente" className="text-2xl font-bold leading-tight">
                {corrente.nome}
              </h2>
              <p className="cifre text-2xl font-extrabold text-accent">{formattaEuro(corrente.prezzoCent)}</p>
              <p className="text-sm">{corrente.descrizione}</p>
              {corrente.perche ? (
                <p className="text-sm text-ink-soft">
                  <strong className="text-ink">Perché l’agente l’ha scelto:</strong> {corrente.perche}
                </p>
              ) : null}
              {corrente.agente ? <InfoDellAgente info={corrente.agente} /> : null}
              <a
                href={linkSchedaAmazon(corrente.asin, corrente.link)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-tocco items-center self-start text-sm font-bold text-accent underline underline-offset-4"
              >
                Apri la scheda su Amazon ↗
              </a>
            </div>
          </div>

          <div role="radiogroup" aria-label="Decisione" className="grid grid-cols-2 gap-3">
            {(["importato", "scartato"] as const).map((e) => (
              <button
                key={e}
                type="button"
                role="radio"
                aria-checked={modulo.esito === e}
                onClick={() => cambia({ esito: e, motivi: [] })}
                className={`min-h-14 rounded-2xl px-4 text-lg font-bold transition-colors ${
                  modulo.esito === e
                    ? e === "importato"
                      ? "bg-accent text-on-accent"
                      : "bg-error text-on-accent"
                    : "border-[1.5px] border-line bg-surface hover:border-line-forte"
                }`}
              >
                {e === "importato" ? "Importa" : "Scarta"}
              </button>
            ))}
          </div>

          {modulo.esito ? (
            <>
              <Gruppo titolo={modulo.esito === "importato" ? "Perché lo importi? (almeno uno)" : "Perché lo scarti? (almeno uno)"}>
                {MOTIVI[modulo.esito].map((m) => (
                  <Pillola key={m} attiva={modulo.motivi.includes(m)} onClick={() => cambia({ motivi: alterna(modulo.motivi, m) })}>
                    {m}
                  </Pillola>
                ))}
              </Gruppo>
              <CampoTesto
                etichetta="Una frase tua (facoltativa)"
                rows={3}
                maxLength={MAX_NOTA}
                value={modulo.nota}
                onChange={(e) => cambia({ nota: e.target.value })}
                suggerimento="Più sei preciso, più il tuo agente impara: per esempio «troppo simile al diffusore che abbiamo già»."
              />
            </>
          ) : null}

          {modulo.esito === "importato" ? (
            <section aria-labelledby="completa" className="flex flex-col gap-4 rounded-2xl bg-surface-2 p-4">
              <h3 id="completa" className="font-bold">
                Completa i dati del catalogo
              </h3>
              <Gruppo titolo="Età (almeno una)">
                {FASCE_ETA.map((f) => (
                  <Pillola key={f.id} attiva={modulo.eta.includes(f.id)} onClick={() => cambia({ eta: alterna(modulo.eta, f.id) })}>
                    {f.etichetta} {f.anni}
                  </Pillola>
                ))}
              </Gruppo>
              <Gruppo titolo="Per chi" nota="Proposto dall’agente (nel formato JSON partono accesi tutti e due): correggi se serve.">
                {DESTINATARI.map((d) => (
                  <Pillola key={d.id} attiva={modulo.destinatari.includes(d.id)} onClick={() => cambia({ destinatari: alterna(modulo.destinatari, d.id) })}>
                    {d.testo}
                  </Pillola>
                ))}
              </Gruppo>
              <Gruppo titolo="Categorie">
                {TEMI.map((t) => (
                  <Pillola key={t.id} attiva={modulo.temi.includes(t.id)} onClick={() => cambia({ temi: alterna(modulo.temi, t.id) })}>
                    {t.testo}
                  </Pillola>
                ))}
              </Gruppo>
              <Campo
                etichetta="Sottocategoria (facoltativa)"
                value={modulo.sottocategoria}
                maxLength={60}
                onChange={(e) => cambia({ sottocategoria: e.target.value })}
                suggerimento="Per l’arredamento: lampade da tavolo, vasi, specchi…"
              />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold">Stelle per l’ordine del catalogo</span>
                <Stelle valore={modulo.stelle} etichetta={corrente.nome} onVota={(n) => cambia({ stelle: n })} />
              </div>
            </section>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Bottone variante="azione" onClick={() => void decidi()} disabled={mancaQualcosa || invio}>
              {invio ? "Salvo…" : modulo.esito === "scartato" ? "Conferma lo scarto" : "Importa nel catalogo"}
            </Bottone>
            {coda.length > 1 ? (
              <Bottone variante="testuale" onClick={() => setAttivo(prossimo(corrente))} disabled={invio}>
                Salta, decido dopo
              </Bottone>
            ) : null}
          </div>
        </article>
      ) : null}

      {decisi.length ? (
        <section aria-labelledby="storico" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="storico" className="text-xl font-semibold text-accent-2">
              Già decisi ({decisi.length})
            </h2>
            <div role="group" aria-label="Mostra" className="flex gap-2">
              {(
                [
                  ["tutti", "Tutti"],
                  ["importato", "Importati"],
                  ["scartato", "Scartati"],
                ] as const
              ).map(([id, testo]) => (
                <Pillola key={id} attiva={filtro === id} onClick={() => setFiltro(id)}>
                  {testo}
                </Pillola>
              ))}
            </div>
          </div>
          <ul className="flex flex-col gap-2">
            {storico.map((c) => (
              <li key={c.asin} className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.foto} alt="" loading="lazy" className="h-14 w-14 shrink-0 rounded-xl border border-line bg-white object-contain p-1" />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${c.stato === "importato" ? "bg-ok-field text-ok" : "bg-error-field text-error"}`}>
                      {c.stato === "importato" ? `Importato${c.decisione?.id ? ` · ${c.decisione.id}` : ""}` : "Scartato"}
                    </span>
                    <span className="truncate font-semibold">{c.nome}</span>
                  </p>
                  <p className="text-sm text-ink-soft">
                    {c.decisione?.motivi.join(" · ")}
                    {c.decisione?.nota ? ` — «${c.decisione.nota}»` : ""}
                  </p>
                </div>
                {c.stato === "scartato" ? (
                  <Bottone variante="testuale" dimensione="piccolo" onClick={() => void riapri(c)}>
                    Rivedi
                  </Bottone>
                ) : c.decisione?.slug ? (
                  <Link href={`/prodotto/${c.decisione.slug}`} target="_blank" className="inline-flex min-h-tocco shrink-0 items-center text-sm font-bold text-accent underline underline-offset-4">
                    Nel sito
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
