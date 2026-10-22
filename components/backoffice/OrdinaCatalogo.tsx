"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Stelle } from "@/components/partecipante/Stelle";
import { Avviso, Bottone, SchedaScelta, classiBottone } from "@/components/ui";
import { formattaEuro } from "@/lib/dominio/importi";
import {
  STELLE_PREDEFINITE,
  ordineEffettivo,
  ordineManuale,
  sposta,
  stelleDi,
  type ImpostazioniCatalogo,
  type ModoOrdine,
} from "@/lib/dominio/ordineCatalogo";

interface Voce {
  slug: string;
  id: string;
  nome: string;
  marca: string;
  prezzoCent: number;
  foto: string | null;
  /** eliminato dal catalogo pubblico: resta qui, si può ripristinare */
  eliminato: boolean;
  /** scheda Amazon del prodotto, senza tag affiliato: si guarda prima di decidere l'ordine */
  amazon: string;
}

interface Stato {
  modo: ModoOrdine;
  ordine: string[];
  stelle: Record<string, number>;
}

const chiave = (s: Stato) => JSON.stringify({ m: s.modo, o: s.ordine, s: Object.entries(s.stelle).sort() });

export function OrdinaCatalogo() {
  const { auth, utente, modalita } = useApp();
  const [voci, setVoci] = useState<Record<string, Voce>>({});
  const [stato, setStato] = useState<Stato | null>(null);
  const [salvato, setSalvato] = useState("");
  const [ultimo, setUltimo] = useState<{ il: number; da: string } | null>(null);
  const [caricamento, setCaricamento] = useState<"in corso" | "ok" | "vietato" | "errore">("in corso");
  const [messaggio, setMessaggio] = useState<{ tono: "positivo" | "attenzione"; testo: string } | null>(null);
  const [occupato, setOccupato] = useState(false);
  const [trascinato, setTrascinato] = useState<string | null>(null);
  const [inCorso, setInCorso] = useState<string | null>(null);
  const prima = useRef<string[]>([]);

  const intestazioni = useCallback(async (): Promise<Record<string, string>> => {
    if (modalita === "memoria") return { "x-email-prova": utente?.email ?? "" };
    const token = await auth.token();
    return token ? { authorization: `Bearer ${token}` } : {};
  }, [auth, modalita, utente?.email]);

  useEffect(() => {
    if (!utente) return;
    let attivo = true;
    (async () => {
      try {
        const r = await fetch("/api/admin/catalogo", { headers: await intestazioni(), cache: "no-store" });
        if (r.status === 403) return attivo && setCaricamento("vietato");
        const dati = (await r.json()) as { ok: boolean; prodotti: Voce[]; impostazioni: ImpostazioniCatalogo | null };
        if (!dati.ok || !attivo) return;
        const mappa = Object.fromEntries(dati.prodotti.map((p) => [p.slug, p]));
        const slugs = dati.prodotti.map((p) => p.slug); // già nell'ordine attuale del sito
        const iniziale: Stato = {
          modo: dati.impostazioni?.modo ?? "trascinamento",
          ordine: ordineManuale(slugs, dati.impostazioni?.ordine ?? slugs),
          stelle: dati.impostazioni?.stelle ?? {},
        };
        setVoci(mappa);
        setStato(iniziale);
        setSalvato(chiave(iniziale));
        if (dati.impostazioni) setUltimo({ il: dati.impostazioni.aggiornatoIl, da: dati.impostazioni.aggiornatoDa });
        setCaricamento("ok");
      } catch {
        if (attivo) setCaricamento("errore");
      }
    })();
    return () => {
      attivo = false;
    };
  }, [utente, intestazioni]);

  const slugs = useMemo(() => Object.keys(voci), [voci]);
  const ordinati = useMemo(() => (stato ? ordineEffettivo(slugs, stato) : []), [stato, slugs]);
  // Gli eliminati restano nell'ordine (così ripristinandoli tornano al loro posto) ma stanno in fondo, a parte.
  const elenco = useMemo(() => ordinati.filter((s) => !voci[s]?.eliminato), [ordinati, voci]);
  const eliminati = useMemo(() => ordinati.filter((s) => voci[s]?.eliminato), [ordinati, voci]);
  const modificato = stato !== null && chiave(stato) !== salvato;

  // Chi sta per lasciare la pagina con modifiche non salvate viene avvisato.
  useEffect(() => {
    if (!modificato) return;
    const avviso = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", avviso);
    return () => window.removeEventListener("beforeunload", avviso);
  }, [modificato]);

  if (caricamento === "in corso") return <p className="py-10 text-center text-ink-soft">Carico il catalogo…</p>;
  if (caricamento === "vietato") {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-3 py-16 text-center">
        <h1 className="text-2xl">Accesso riservato</h1>
        <p className="text-ink-soft">Questo account non è autorizzato a gestire il catalogo.</p>
        <Bottone variante="secondario" className="self-center" onClick={() => void auth.esci().then(() => window.location.assign("/"))}>
          Esci
        </Bottone>
      </div>
    );
  }
  if (caricamento === "errore" || !stato) {
    return <Avviso tono="attenzione">Non riesco a caricare il catalogo. Riprova fra poco.</Avviso>;
  }

  const trascinamento = stato.modo === "trascinamento";

  function aggiorna(patch: Partial<Stato>) {
    setMessaggio(null);
    setStato((s) => (s ? { ...s, ...patch } : s));
  }

  /** Si sposta rispetto al prodotto visibile vicino: quelli eliminati non si vedono e non devono contare. */
  function muovi(slug: string, verso: number) {
    if (!trascinamento || !stato) return;
    const vicino = elenco[elenco.indexOf(slug) + verso];
    if (!vicino) return;
    aggiorna({ ordine: sposta(stato.ordine, stato.ordine.indexOf(slug), stato.ordine.indexOf(vicino)) });
  }

  /** Elimina o ripristina: ha effetto subito sul sito, senza passare dal salvataggio dell'ordine. */
  async function cambiaEliminato(slug: string, eliminato: boolean) {
    setInCorso(slug);
    setMessaggio(null);
    try {
      const r = await fetch("/api/admin/catalogo", {
        method: "PATCH",
        headers: { "content-type": "application/json", ...(await intestazioni()) },
        body: JSON.stringify({ slug, eliminato }),
      });
      const dati = (await r.json()) as { ok: boolean; errore?: string };
      if (!dati.ok) throw new Error(dati.errore ?? "Errore");
      setVoci((v) => ({ ...v, [slug]: { ...v[slug], eliminato } }));
      setMessaggio({
        tono: "positivo",
        testo: eliminato
          ? `«${voci[slug].nome}» non si vede più nel catalogo. Lo trovi fra gli eliminati, qui sotto, e puoi rimetterlo quando vuoi.`
          : `«${voci[slug].nome}» è di nuovo nel catalogo.`,
      });
    } catch (e) {
      setMessaggio({ tono: "attenzione", testo: `Non sono riuscito a ${eliminato ? "eliminare" : "ripristinare"} il prodotto${e instanceof Error && e.message !== "Errore" ? `: ${e.message}` : ". Riprova."}` });
    } finally {
      setInCorso(null);
    }
  }

  /**
   * «Manda in cima» e «Manda in fondo». Col trascinamento il prodotto va al primo o all'ultimo posto della lista.
   * Con le stelle, che pesano più della posizione, prende anche 5 o 1 stella: così sale o scende davvero.
   */
  function manda(slug: string, dove: "cima" | "fondo") {
    if (!stato) return;
    const i = stato.ordine.indexOf(slug);
    const ordine = sposta(stato.ordine, i, dove === "cima" ? 0 : stato.ordine.length - 1);
    aggiorna(trascinamento ? { ordine } : { ordine, stelle: { ...stato.stelle, [slug]: dove === "cima" ? 5 : 1 } });
  }

  function entraSu(slugSopra: string) {
    if (!trascinamento || !stato || !trascinato || trascinato === slugSopra) return;
    const da = stato.ordine.indexOf(trascinato);
    const a = stato.ordine.indexOf(slugSopra);
    if (da >= 0 && a >= 0) aggiorna({ ordine: sposta(stato.ordine, da, a) });
  }

  async function salva() {
    if (!stato) return;
    setOccupato(true);
    setMessaggio(null);
    try {
      const r = await fetch("/api/admin/catalogo", {
        method: "PUT",
        headers: { "content-type": "application/json", ...(await intestazioni()) },
        body: JSON.stringify(stato),
      });
      const dati = (await r.json()) as { ok: boolean; errore?: string; aggiornatoIl?: number };
      if (!dati.ok) throw new Error(dati.errore ?? "Errore");
      setSalvato(chiave(stato));
      setUltimo({ il: dati.aggiornatoIl ?? Date.now(), da: utente?.email ?? "" });
      setMessaggio({ tono: "positivo", testo: "Salvato: il nuovo ordine è già attivo sul sito." });
    } catch (e) {
      setMessaggio({ tono: "attenzione", testo: `Non sono riuscito a salvare${e instanceof Error && e.message !== "Errore" ? `: ${e.message}` : ". Riprova."}` });
    } finally {
      setOccupato(false);
    }
  }

  function perPrezzo() {
    const ordine = [...slugs].sort((a, b) => voci[a].prezzoCent - voci[b].prezzoCent || voci[a].nome.localeCompare(voci[b].nome, "it"));
    // (gli eliminati restano nell'ordine: non si vedono finché non li ripristini)
    aggiorna({ modo: "trascinamento", ordine, stelle: {} });
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl">Catalogo: ordine e prodotti</h1>
        <p className="text-ink-soft">
          Decidi in che ordine compaiono i prodotti nel catalogo, anche dopo che chi visita ha applicato i filtri. Il primo della lista è il
          primo del sito. Con «Elimina» togli un prodotto dal sito senza cancellarlo: finisce in fondo a questa pagina e lo puoi rimettere.
        </p>
      </header>

      <div role="radiogroup" aria-label="Come ordinare" className="grid gap-3 sm:grid-cols-2">
        <SchedaScelta
          titolo="Trascinamento"
          descrizione="L'ordine è quello della lista: trascina i prodotti, o usa le frecce."
          selezionata={trascinamento}
          onSeleziona={() => aggiorna({ modo: "trascinamento" })}
        />
        <SchedaScelta
          titolo="Stelle"
          descrizione={`Prima i prodotti con più stelle (da 1 a 5; senza voto valgono ${STELLE_PREDEFINITE}). A parità conta la posizione nella lista.`}
          selezionata={!trascinamento}
          onSeleziona={() => aggiorna({ modo: "stelle" })}
        />
      </div>

      <div className="sticky top-0 z-30 flex flex-wrap items-center gap-3 rounded-contenitore border border-line bg-surface p-3 shadow-sm">
        <Bottone onClick={() => void salva()} disabled={!modificato || occupato}>
          {occupato ? "Salvo…" : "Salva l'ordine"}
        </Bottone>
        <Bottone variante="secondario" onClick={perPrezzo} disabled={occupato}>
          Ripristina per prezzo
        </Bottone>
        <p className="min-w-0 flex-1 text-sm text-ink-soft" aria-live="polite">
          {modificato ? "Modifiche non ancora salvate." : ultimo ? `Ultimo salvataggio: ${new Date(ultimo.il).toLocaleString("it-IT")}${ultimo.da ? ` (${ultimo.da})` : ""}.` : "Nessun ordine salvato: il sito usa il prezzo."}
        </p>
      </div>
      {messaggio ? (
        <Avviso tono={messaggio.tono} live>
          <p>{messaggio.testo}</p>
        </Avviso>
      ) : null}

      <ol className="flex flex-col gap-2" aria-label="Prodotti nell'ordine del sito">
        {elenco.map((slug, i) => {
          const v = voci[slug];
          return (
            <li
              key={slug}
              draggable={trascinamento}
              onDragStart={(e) => {
                setTrascinato(slug);
                prima.current = stato.ordine;
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", slug);
              }}
              onDragEnter={() => entraSu(slug)}
              onDragOver={(e) => trascinamento && e.preventDefault()}
              onDragEnd={() => setTrascinato(null)}
              className={`flex flex-wrap items-center gap-3 rounded-controllo border bg-surface p-2 pr-3 transition-colors sm:flex-nowrap ${
                trascinato === slug ? "border-accent bg-accent-field opacity-70" : "border-line"
              }`}
            >
              <span
                aria-hidden="true"
                title={trascinamento ? "Trascina per spostare" : "Passa a «Trascinamento» per spostare"}
                className={`flex h-11 w-7 shrink-0 select-none items-center justify-center text-xl ${trascinamento ? "cursor-grab text-ink-soft" : "text-line"}`}
              >
                ⋮⋮
              </span>
              <span className="cifre w-8 shrink-0 text-center text-lg font-bold">{i + 1}</span>
              <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-controllo border border-line bg-white">
                {v.foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.foto} alt="" loading="lazy" draggable={false} className="h-full w-full object-contain p-1" />
                ) : null}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-xs font-semibold text-ink-soft">{v.id || slug}</span>
                <span className="line-clamp-2 font-semibold leading-snug" title={v.nome}>
                  {v.nome}
                </span>
                <span className="cifre text-sm text-ink-soft">{formattaEuro(v.prezzoCent)}</span>
              </span>
              <span className={`flex items-center ${!trascinamento ? "" : "opacity-80"}`}>
                <Stelle
                  valore={stelleDi(stato.stelle, slug)}
                  etichetta={v.nome}
                  onVota={(n) => aggiorna({ stelle: { ...stato.stelle, [slug]: n } })}
                />
              </span>
              <span className="flex shrink-0 flex-wrap items-center gap-1">
                {trascinamento ? (
                  <>
                    <Bottone dimensione="piccolo" variante="secondario" aria-label={`Sposta in su: ${v.nome}`} onClick={() => muovi(slug, -1)} disabled={i === 0} className="!px-2">
                      ↑
                    </Bottone>
                    <Bottone dimensione="piccolo" variante="secondario" aria-label={`Sposta in giù: ${v.nome}`} onClick={() => muovi(slug, 1)} disabled={i === elenco.length - 1} className="!px-2">
                      ↓
                    </Bottone>
                  </>
                ) : null}
                <Bottone
                  dimensione="piccolo"
                  variante="secondario"
                  title={trascinamento ? "Primo della lista" : "Primo della lista, con 5 stelle"}
                  aria-label={`Manda in cima: ${v.nome}`}
                  onClick={() => manda(slug, "cima")}
                  disabled={i === 0 && (trascinamento || stelleDi(stato.stelle, slug) === 5)}
                >
                  Manda in cima
                </Bottone>
                <Bottone
                  dimensione="piccolo"
                  variante="secondario"
                  title={trascinamento ? "Ultimo della lista" : "Ultimo della lista, con 1 stella"}
                  aria-label={`Manda in fondo: ${v.nome}`}
                  onClick={() => manda(slug, "fondo")}
                  disabled={i === elenco.length - 1 && (trascinamento || stelleDi(stato.stelle, slug) === 1)}
                >
                  Manda in fondo
                </Bottone>
                <a
                  href={v.amazon}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Apre la scheda Amazon in una finestra nuova"
                  aria-label={`Vedi su Amazon: ${v.nome} (si apre in una finestra nuova)`}
                  className={classiBottone("secondario", "piccolo", "shrink-0 whitespace-nowrap")}
                >
                  Vedi prodotto su Amazon
                </a>
                <Bottone
                  dimensione="piccolo"
                  variante="secondario"
                  title="Toglilo dal catalogo pubblico: resta qui e lo puoi rimettere"
                  aria-label={`Elimina dal catalogo: ${v.nome}`}
                  onClick={() => void cambiaEliminato(slug, true)}
                  disabled={inCorso === slug}
                  className="!text-error"
                >
                  {inCorso === slug ? "…" : "Elimina"}
                </Bottone>
              </span>
            </li>
          );
        })}
      </ol>

      {eliminati.length > 0 ? (
        <section aria-labelledby="eliminati" className="flex flex-col gap-3 rounded-contenitore border border-line bg-surface-2 p-4">
          <div className="flex flex-col gap-1">
            <h2 id="eliminati" className="text-xl">
              Eliminati ({eliminati.length})
            </h2>
            <p className="text-sm text-ink-soft">
              Questi prodotti restano nel catalogo e nel file sorgente, ma chi visita il sito non li vede: spariscono dal catalogo, dai
              filtri, dai preferiti, da «Trova il regalo» e dalla loro scheda. Le collette già create con uno di questi non cambiano.
            </p>
          </div>
          <ul className="flex flex-col gap-2">
            {eliminati.map((slug) => {
              const v = voci[slug];
              return (
                <li key={slug} className="flex flex-wrap items-center gap-3 rounded-controllo border border-line bg-surface p-2 pr-3 sm:flex-nowrap">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-controllo border border-line bg-white">
                    {v.foto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.foto} alt="" loading="lazy" className="h-full w-full object-contain p-1 opacity-60" />
                    ) : null}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-xs font-semibold text-ink-soft">{v.id || slug}</span>
                    <span className="line-clamp-2 leading-snug text-ink-soft" title={v.nome}>
                      {v.nome}
                    </span>
                    <span className="cifre text-sm text-ink-soft">{formattaEuro(v.prezzoCent)}</span>
                  </span>
                  <a
                    href={v.amazon}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Vedi su Amazon: ${v.nome} (si apre in una finestra nuova)`}
                    className={classiBottone("secondario", "piccolo", "shrink-0 whitespace-nowrap")}
                  >
                    Vedi prodotto su Amazon
                  </a>
                  <Bottone
                    dimensione="piccolo"
                    variante="secondario"
                    aria-label={`Rimetti nel catalogo: ${v.nome}`}
                    onClick={() => void cambiaEliminato(slug, false)}
                    disabled={inCorso === slug}
                    className="shrink-0"
                  >
                    {inCorso === slug ? "…" : "Ripristina"}
                  </Bottone>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
