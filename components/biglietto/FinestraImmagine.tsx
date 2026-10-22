"use client";

import { useEffect, useRef, useState } from "react";
import { preparaImmagine, type ImmaginePronta } from "@/lib/biglietti/immaginiClient";

export type ImmagineScelta =
  | ({ tipo: "caricata" } & ImmaginePronta)
  | { tipo: "giphy" | "unsplash"; url: string; larghezza: number; altezza: number; attribuzione: string };

export interface Librerie {
  gif: boolean;
  foto: boolean;
}

interface Risultato {
  id: string;
  anteprima: string;
  url: string;
  larghezza: number;
  altezza: number;
  attribuzione: string;
}

/**
 * «Aggiungi un'immagine al tuo messaggio»: schede Libreria GIF (GIF/Foto, solo con le chiavi, S7) e Carica immagine.
 * L'immagine magica (S8) non compare finché l'AI non è attiva.
 */
export function FinestraImmagine({
  aperta,
  onChiudi,
  onScegli,
  librerie,
  ricercaIniziale,
  schedaIniziale,
  titolo = "Aggiungi un’immagine al tuo messaggio",
}: {
  aperta: boolean;
  onChiudi: () => void;
  onScegli: (img: ImmagineScelta) => void;
  librerie: Librerie;
  ricercaIniziale: string;
  schedaIniziale?: "libreria" | "carica";
  titolo?: string;
}) {
  const conLibreria = librerie.gif || librerie.foto;
  const [scheda, setScheda] = useState<"libreria" | "carica">(schedaIniziale ?? (conLibreria ? "libreria" : "carica"));
  const [fonte, setFonte] = useState<"gif" | "foto">(librerie.gif ? "gif" : "foto");
  const [q, setQ] = useState(ricercaIniziale);
  const [risultati, setRisultati] = useState<Risultato[] | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [lavoro, setLavoro] = useState(false);
  const [sopra, setSopra] = useState(false);
  const chiudi = useRef<HTMLButtonElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const onChiudiRef = useRef(onChiudi);
  onChiudiRef.current = onChiudi;

  useEffect(() => {
    if (!aperta) return;
    setScheda(schedaIniziale ?? (conLibreria ? "libreria" : "carica"));
    setErrore(null);
    const prima = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    chiudi.current?.focus();
    const tasto = (e: KeyboardEvent) => e.key === "Escape" && onChiudiRef.current();
    document.addEventListener("keydown", tasto);
    return () => {
      document.removeEventListener("keydown", tasto);
      document.body.style.overflow = overflow;
      prima?.focus?.();
    };
  }, [aperta]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!aperta || scheda !== "libreria" || !conLibreria) return;
    const ctrl = new AbortController();
    setRisultati(null);
    const t = setTimeout(() => {
      fetch(`/api/libreria/${fonte}?q=${encodeURIComponent(q.trim())}`, { signal: ctrl.signal })
        .then((r) => r.json() as Promise<{ risultati?: Risultato[] }>)
        .then((j) => setRisultati(j.risultati ?? []))
        .catch(() => {});
    }, 400);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [aperta, scheda, fonte, q, conLibreria]);

  async function daFile(f: File | undefined | null) {
    if (!f) return;
    setErrore(null);
    setLavoro(true);
    try {
      const img = await preparaImmagine(f);
      onScegli({ tipo: "caricata", ...img });
    } catch (e) {
      setErrore(e instanceof Error ? e.message : "Immagine non valida.");
    } finally {
      setLavoro(false);
      if (file.current) file.current.value = "";
    }
  }

  if (!aperta) return null;
  const schede: { id: "libreria" | "carica"; nome: string; icona: string }[] = [
    ...(conLibreria ? [{ id: "libreria" as const, nome: "Libreria GIF", icona: "🎞️" }] : []),
    { id: "carica", nome: "Carica immagine", icona: "⬆️" },
  ];

  return (
    <div role="dialog" aria-modal="true" aria-label={titolo} className="fixed inset-0 z-50 flex flex-col bg-surface">
      <div className="gutter flex items-center justify-between border-b border-line py-2">
        <h2 className="font-display text-xl font-bold">{titolo}</h2>
        <button ref={chiudi} type="button" onClick={onChiudi} aria-label="Chiudi" className="flex h-11 w-11 items-center justify-center rounded-full text-2xl hover:bg-surface-2">
          <span aria-hidden="true">×</span>
        </button>
      </div>
      {schede.length > 1 ? (
        <div role="tablist" className="gutter flex gap-6 border-b border-line">
          {schede.map((s) => (
            <button key={s.id} role="tab" type="button" aria-selected={scheda === s.id} onClick={() => setScheda(s.id)} className={`-mb-px min-h-12 border-b-2 font-semibold ${scheda === s.id ? "border-accent text-ink" : "border-transparent text-ink-soft"}`}>
              <span aria-hidden="true">{s.icona}</span> {s.nome}
            </button>
          ))}
        </div>
      ) : null}

      <div className="gutter mx-auto flex w-full max-w-[600px] flex-1 flex-col gap-4 overflow-y-auto py-4">
        {scheda === "libreria" ? (
          <>
            {librerie.gif && librerie.foto ? (
              <div role="tablist" className="flex gap-6">
                {(["gif", "foto"] as const).map((f) => (
                  <button key={f} role="tab" type="button" aria-selected={fonte === f} onClick={() => setFonte(f)} className={`min-h-11 border-b-2 text-sm font-semibold uppercase ${fonte === f ? "border-accent" : "border-transparent text-ink-soft"}`}>
                    {f === "gif" ? "GIF" : "Foto"}
                  </button>
                ))}
              </div>
            ) : null}
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cerca nella libreria…"
              aria-label="Cerca nella libreria"
              className="h-12 w-full rounded-full border border-line bg-surface-2 px-5 text-base focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
            {risultati === null ? <p className="text-center text-sm text-ink-soft">Cerco…</p> : null}
            {risultati && risultati.length === 0 ? <p className="text-center text-sm text-ink-soft">Nessun risultato: prova con un’altra parola.</p> : null}
            <div className="columns-2 gap-3">
              {risultati?.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onScegli({ tipo: fonte === "gif" ? "giphy" : "unsplash", url: r.url, larghezza: r.larghezza, altezza: r.altezza, attribuzione: r.attribuzione })}
                  className="group relative mb-3 block w-full overflow-hidden rounded-controllo focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                  aria-label={`Scegli (${r.attribuzione})`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.anteprima} alt="" loading="lazy" className="block w-full" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100 group-focus-visible:bg-black/40 group-focus-visible:opacity-100">
                    <span className="rounded-full bg-surface px-4 py-2 text-sm font-bold text-ink">SCEGLI</span>
                  </span>
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-ink-soft">{fonte === "gif" ? "Ricerca via GIPHY" : "Foto da Unsplash"}</p>
          </>
        ) : (
          <>
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setSopra(true);
              }}
              onDragLeave={() => setSopra(false)}
              onDrop={(e) => {
                e.preventDefault();
                setSopra(false);
                void daFile(e.dataTransfer.files?.[0]);
              }}
              className={`flex min-h-64 cursor-pointer flex-col items-center justify-center gap-3 rounded-contenitore border-2 border-dashed p-6 text-center focus-within:outline focus-within:outline-2 focus-within:outline-accent ${sopra ? "border-accent bg-accent-field" : "border-line bg-surface-2"}`}
            >
              <span aria-hidden="true" className="text-4xl">
                🖼️
              </span>
              <span className="font-semibold">{lavoro ? "Preparo l’immagine…" : "Trascina qui la tua immagine o tocca per sceglierla"}</span>
              <span className="text-sm text-ink-soft">JPG, PNG o GIF. Le foto le rimpiccioliamo noi; le GIF fino a 900 KB.</span>
              <input ref={file} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="sr-only" disabled={lavoro} onChange={(e) => void daFile(e.target.files?.[0])} />
            </label>
            {errore ? (
              <p role="alert" className="text-sm font-semibold text-error">
                {errore}
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
