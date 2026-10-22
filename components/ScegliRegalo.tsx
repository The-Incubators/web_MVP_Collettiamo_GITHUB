"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Avviso, Campo, CampoSelezione, IconaPiu, IconaSpunta, ImmagineProdotto, SchedaScelta } from "@/components/ui";
import { euroPerCampo, formattaEuro, leggiEuro } from "@/lib/dominio/importi";
import { contiene, daProdotto } from "@/lib/dominio/regali";
import { CATEGORIE, type Categoria, type Prodotto, type ProdottoColletta } from "@/lib/tipi";

export { daProdotto };

export function categoriaPerRegalo(c: string): Categoria {
  return CATEGORIE.find((x) => x === c) ?? "esperienze";
}

function urlValido(testo: string): boolean {
  try {
    const u = new URL(testo);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Sceglie un regalo dal catalogo oppure lo descrive a mano (nome, prezzo, consegna, link).
 * Chiama `onScelta` a ogni cambio: con il regalo se i dati sono completi, altrimenti con null.
 */
export function ScegliRegalo({
  valore,
  onScelta,
  avvisoLink = true,
  onAggiungi,
  giaInLista = [],
}: {
  valore: ProdottoColletta | null;
  onScelta: (p: ProdottoColletta | null) => void;
  avvisoLink?: boolean;
  /** se c'è, ogni prodotto del catalogo ha un «+» che lo aggiunge direttamente alla lista dei regali */
  onAggiungi?: (p: ProdottoColletta) => void;
  giaInLista?: ProdottoColletta[];
}) {
  const { dati } = useApp();
  const daLink = valore !== null && valore.prodottoId === null;
  const [modo, setModo] = useState<"catalogo" | "link">(daLink ? "link" : "catalogo");
  const [prodotti, setProdotti] = useState<Prodotto[] | null>(null);
  const [erroreCatalogo, setErroreCatalogo] = useState(false);
  const [ricerca, setRicerca] = useState("");
  const [link, setLink] = useState(() => ({
    url: daLink ? (valore?.urlEsterno ?? "") : "",
    nome: daLink ? (valore?.nome ?? "") : "",
    prezzo: daLink && valore ? euroPerCampo(valore.prezzoCent) : "",
    giorni: String(daLink ? (valore?.consegnaGiorni ?? 3) : 3),
    categoria: daLink ? (valore?.immagine.icona ?? "esperienze") : "esperienze",
  }));

  useEffect(() => {
    let attivo = true;
    dati
      .elencaProdotti()
      .then((p) => attivo && setProdotti(p))
      .catch(() => attivo && setErroreCatalogo(true));
    return () => {
      attivo = false;
    };
  }, [dati]);

  const filtrati = useMemo(() => {
    const t = ricerca.trim().toLowerCase();
    return (prodotti ?? []).filter((p) => !t || `${p.nome} ${p.marca} ${p.descrizione} ${(p.temi ?? []).join(" ")} ${(p.destinatari ?? []).join(" ")}`.toLowerCase().includes(t));
  }, [prodotti, ricerca]);

  function aggiornaLink(patch: Partial<typeof link>) {
    const nuovo = { ...link, ...patch };
    setLink(nuovo);
    const prezzoCent = leggiEuro(nuovo.prezzo);
    const giorni = Math.round(Number(nuovo.giorni));
    if (nuovo.nome.trim() && prezzoCent && urlValido(nuovo.url.trim()) && giorni >= 1 && giorni <= 30) {
      onScelta({
        prodottoId: null,
        nome: nuovo.nome.trim().slice(0, 120),
        prezzoCent,
        consegnaGiorni: giorni,
        urlEsterno: nuovo.url.trim(),
        immagine: { seme: nuovo.nome.trim().toLowerCase(), icona: categoriaPerRegalo(nuovo.categoria) },
      });
    } else if (valore?.prodottoId === null) {
      onScelta(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div role="radiogroup" aria-label="Come scegli il regalo" className="grid gap-3 sm:grid-cols-2">
        <SchedaScelta titolo="Dal catalogo" descrizione="Idee già pronte, con prezzo e tempi di consegna." selezionata={modo === "catalogo"} onSeleziona={() => setModo("catalogo")} />
        <SchedaScelta titolo="Incolla un link" descrizione="Un regalo che hai già in mente, da un altro negozio." selezionata={modo === "link"} onSeleziona={() => setModo("link")} />
      </div>

      {modo === "catalogo" ? (
        <div className="flex flex-col gap-4">
          <Campo etichetta="Cerca nel catalogo" type="search" value={ricerca} onChange={(e) => setRicerca(e.target.value)} placeholder="Mappa, lampada, speaker…" />
          {erroreCatalogo ? <Avviso tono="attenzione">Non riesco a caricare il catalogo. Controlla la connessione e riprova.</Avviso> : null}
          {prodotti === null && !erroreCatalogo ? <p className="text-ink-soft">Carico il catalogo…</p> : null}
          {prodotti !== null && filtrati.length === 0 ? <p className="text-ink-soft">Nessun risultato per «{ricerca}».</p> : null}
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {filtrati.map((p) => {
              const scelto = valore?.prodottoId === p.slug;
              const dentro = contiene(giaInLista, daProdotto(p));
              return (
                <li key={p.slug} className="relative">
                  <button
                    type="button"
                    onClick={() => onScelta(daProdotto(p))}
                    aria-pressed={scelto}
                    className={`flex h-full w-full flex-col overflow-hidden rounded-contenitore border text-left transition-colors ${scelto ? "border-accent ring-2 ring-accent" : "border-line bg-surface hover:bg-surface-2"}`}
                  >
                    <ImmagineProdotto prodotto={p} />
                    <span className="flex flex-1 flex-col gap-1 p-3">
                      <span className="text-sm leading-snug">{p.nome}</span>
                      <span className="mt-auto flex items-center justify-between">
                        <span className="cifre font-bold">{formattaEuro(p.prezzoCent)}</span>
                        {scelto ? <IconaSpunta className="text-accent" width={18} height={18} /> : null}
                      </span>
                    </span>
                  </button>
                  {onAggiungi ? (
                    <button
                      type="button"
                      disabled={dentro}
                      aria-label={dentro ? `${p.nome} è già nella lista dei regali` : `Aggiungi alla lista dei regali: ${p.nome}`}
                      onClick={() => onAggiungi(daProdotto(p))}
                      className={`group/piu absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full border shadow-sm transition-colors ${
                        dentro ? "border-accent bg-accent text-on-accent" : "border-line bg-surface text-ink hover:bg-accent-field"
                      }`}
                    >
                      {dentro ? <IconaSpunta width={22} height={22} /> : <IconaPiu width={22} height={22} />}
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute right-0 top-full z-20 mt-1 hidden whitespace-nowrap rounded-controllo bg-ink px-2.5 py-1.5 text-xs font-medium text-field group-hover/piu:block group-focus-within/piu:block"
                      >
                        {dentro ? "Nella lista dei regali" : "Aggiungi alla lista dei regali"}
                      </span>
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {avvisoLink ? <Avviso>Nella versione definitiva questi dati li leggiamo noi dalla pagina.</Avviso> : null}
          <Campo etichetta="Link del regalo" type="url" inputMode="url" value={link.url} onChange={(e) => aggiornaLink({ url: e.target.value })} placeholder="https://…" />
          <Campo etichetta="Nome del regalo" value={link.nome} onChange={(e) => aggiornaLink({ nome: e.target.value })} maxLength={120} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etichetta="Prezzo (€)" inputMode="decimal" value={link.prezzo} onChange={(e) => aggiornaLink({ prezzo: e.target.value })} placeholder="89" />
            <Campo etichetta="Giorni di consegna" type="number" min={1} max={30} value={link.giorni} onChange={(e) => aggiornaLink({ giorni: e.target.value })} />
          </div>
          <CampoSelezione etichetta="Tipo di regalo" value={link.categoria} onChange={(e) => aggiornaLink({ categoria: categoriaPerRegalo(e.target.value) })} suggerimento="Serve solo per l’illustrazione.">
            {CATEGORIE.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </CampoSelezione>
        </div>
      )}

      {valore ? (
        <Avviso tono="positivo" live>
          <p>
            Selezionato: <strong>{valore.nome}</strong>, {formattaEuro(valore.prezzoCent)}.
          </p>
        </Avviso>
      ) : null}
    </div>
  );
}
