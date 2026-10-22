"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { BottoneCuore } from "@/components/BottoneCuore";
import { ImmagineProdotto } from "@/components/ui";
import { Icona } from "@/components/v3/Icona";
import { formattaEuro } from "@/lib/dominio/importi";
import { quotaProposta } from "@/lib/dominio/quota";
import { chiaveSottocategoria } from "@/lib/dominio/regali";
import type { Prodotto } from "@/lib/tipi";

/**
 * Il catalogo di UX_V3, nei due modi di sfogliare dei layout: griglia a due colonne e una card alla volta.
 *
 * I filtri lavorano sui campi che il catalogo ha davvero — destinatari, temi, sottocategorie, prezzo —
 * non sulle categorie di fantasia dei mockup («Cose inutili ma belle», «Esperienze Gourmet»), che non
 * corrispondono a nulla nei dati: un filtro che non filtra sarebbe peggio di un filtro in meno.
 * Il conto della quota è `quotaProposta`, lo stesso del wizard.
 */

type Vista = "griglia" | "singola";
type Destinatario = "" | "uomo" | "donna";
type Ordine = "scelti" | "prezzo-su" | "prezzo-giu";

const ORDINI: { id: Ordine; etichetta: string }[] = [
  { id: "scelti", etichetta: "Più desiderati" },
  { id: "prezzo-su", etichetta: "Prezzo crescente" },
  { id: "prezzo-giu", etichetta: "Prezzo decrescente" },
];

const maiuscola = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const posizione = (p: Prodotto) => p.posizione ?? Number.MAX_SAFE_INTEGER;
const normalizza = (t: string) =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function CatalogoV3({ prodotti, temi, tipi }: { prodotti: Prodotto[]; temi: string[]; tipi: { valore: string; etichetta: string }[] }) {
  const router = useRouter();
  const [vista, setVista] = useState<Vista>("griglia");
  const [filtriAperti, setFiltriAperti] = useState(false);
  const [cerca, setCerca] = useState("");
  const [destinatario, setDestinatario] = useState<Destinatario>("");
  const [temiScelti, setTemiScelti] = useState<string[]>([]);
  const [tipo, setTipo] = useState<string>("");
  const [minEuro, setMinEuro] = useState("");
  const [maxEuro, setMaxEuro] = useState("");
  const [ordine, setOrdine] = useState<Ordine>("scelti");
  const [amici, setAmici] = useState(10);
  const [indice, setIndice] = useState(0);

  const minCent = Math.max(0, Math.round((Number(minEuro.replace(",", ".")) || 0) * 100));
  const maxCent = maxEuro.trim() ? Math.round((Number(maxEuro.replace(",", ".")) || 0) * 100) : Infinity;

  const risultati = useMemo(() => {
    const testo = normalizza(cerca.trim());
    const righe = prodotti.filter((p) => {
      if (destinatario && !(p.destinatari ?? []).includes(destinatario)) return false;
      if (temiScelti.length && !temiScelti.some((t) => (p.temi ?? []).includes(t))) return false;
      if (tipo && (!p.sottocategoria || chiaveSottocategoria(p.sottocategoria) !== tipo)) return false;
      if (p.prezzoCent < minCent || p.prezzoCent > maxCent) return false;
      if (testo && !normalizza(`${p.nome} ${p.marca} ${p.descrizione} ${p.sottocategoria ?? ""}`).includes(testo)) return false;
      return true;
    });
    const per: Record<Ordine, (a: Prodotto, b: Prodotto) => number> = {
      scelti: (a, b) => posizione(a) - posizione(b) || a.prezzoCent - b.prezzoCent,
      "prezzo-su": (a, b) => a.prezzoCent - b.prezzoCent,
      "prezzo-giu": (a, b) => b.prezzoCent - a.prezzoCent,
    };
    return [...righe].sort(per[ordine]);
  }, [prodotti, cerca, destinatario, temiScelti, tipo, minCent, maxCent, ordine]);

  const nFiltri = [destinatario, tipo, minEuro, maxEuro].filter(Boolean).length + temiScelti.length;
  const corrente = risultati[Math.min(indice, Math.max(0, risultati.length - 1))];

  function azzera() {
    setDestinatario("");
    setTemiScelti([]);
    setTipo("");
    setMinEuro("");
    setMaxEuro("");
    setCerca("");
    setIndice(0);
  }

  function cambiaTema(t: string) {
    setTemiScelti((v) => (v.includes(t) ? v.filter((x) => x !== t) : [...v, t]));
    setIndice(0);
  }

  const creaColletta = (p: Prodotto) => router.push(`/crea?prodotto=${p.slug}&persone=${amici}`);

  return (
    <div className="flex flex-col gap-space-md">
      {/* Ricerca, filtri, modo di sfogliare */}
      <div className="flex items-center gap-2">
        <div className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-xl border border-border-warm bg-surface-cream-card px-3">
          <Icona nome="search" dimensione={20} className="text-text-muted" />
          <input
            value={cerca}
            onChange={(e) => {
              setCerca(e.target.value);
              setIndice(0);
            }}
            placeholder="Cerca tra i regali…"
            aria-label="Cerca tra i regali"
            className="min-w-0 flex-1 bg-transparent font-body-md text-body-md text-on-surface placeholder:text-text-muted focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => setFiltriAperti((a) => !a)}
          aria-expanded={filtriAperti}
          aria-controls="filtri-v3"
          className="flex h-12 items-center gap-1.5 rounded-xl bg-primary-container px-3.5 font-label-md text-label-md text-on-primary"
        >
          <Icona nome="tune" dimensione={18} />
          <span>Filtri</span>
          {nFiltri > 0 ? (
            <span className="cifre flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary-container px-1 text-[11px] font-bold text-on-secondary">
              {nFiltri}
            </span>
          ) : null}
        </button>
        <div className="flex h-12 items-center gap-1 rounded-xl border border-border-warm bg-surface-cream-card p-1" role="group" aria-label="Come sfogliare">
          {([
            { id: "griglia" as const, icona: "grid_view" as const, testo: "Griglia" },
            { id: "singola" as const, icona: "view_agenda" as const, testo: "Una alla volta" },
          ]).map((v) => (
            <button
              key={v.id}
              type="button"
              aria-pressed={vista === v.id}
              aria-label={v.testo}
              onClick={() => setVista(v.id)}
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                vista === v.id ? "bg-secondary-container text-on-secondary" : "text-text-muted hover:bg-forest-tint"
              }`}
            >
              <Icona nome={v.icona} dimensione={20} />
            </button>
          ))}
        </div>
      </div>

      {/* Scorciatoie */}
      <div className="-mx-margin flex gap-2 overflow-x-auto px-margin pb-1">
        <button
          type="button"
          onClick={azzera}
          aria-pressed={nFiltri === 0 && !cerca}
          className={`flex-shrink-0 rounded-full px-4 py-2 font-label-md text-label-md transition-colors ${
            nFiltri === 0 && !cerca ? "bg-primary-container text-on-primary" : "bg-surface-container-low text-on-surface"
          }`}
        >
          Tutti ({prodotti.length})
        </button>
        {temi.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={temiScelti.includes(t)}
            onClick={() => cambiaTema(t)}
            className={`flex-shrink-0 rounded-full px-4 py-2 font-label-md text-label-md transition-colors ${
              temiScelti.includes(t) ? "bg-secondary-container text-on-secondary" : "bg-surface-container-low text-on-surface"
            }`}
          >
            {maiuscola(t)}
          </button>
        ))}
      </div>

      {/* Pannello dei filtri */}
      <div id="filtri-v3" hidden={!filtriAperti} className="flex flex-col gap-4 rounded-2xl border border-border-warm bg-surface-cream-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 font-headline-sm text-headline-sm text-primary-container">
            <Icona nome="filter_alt" dimensione={18} /> Filtri avanzati
          </span>
          <button type="button" onClick={azzera} className="flex items-center gap-1 font-label-md text-label-md text-secondary">
            <Icona nome="refresh" dimensione={16} /> Azzera
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <span className="font-label-md text-label-md font-bold text-primary-container">Budget totale del regalo</span>
          <div className="grid grid-cols-2 gap-3">
            {([
              { id: "min", etichetta: "Min", valore: minEuro, set: setMinEuro },
              { id: "max", etichetta: "Max", valore: maxEuro, set: setMaxEuro },
            ]).map((c) => (
              <label key={c.id} className="flex flex-col gap-1 rounded-xl bg-surface-container-low p-2">
                <span className="font-label-sm text-label-sm text-text-muted">{c.etichetta}</span>
                <span className="flex items-center gap-1">
                  <input
                    inputMode="decimal"
                    value={c.valore}
                    onChange={(e) => {
                      c.set(e.target.value.replace(/[^\d.,]/g, "").slice(0, 7));
                      setIndice(0);
                    }}
                    placeholder="—"
                    className="cifre w-full bg-transparent text-lg font-bold text-on-surface focus:outline-none"
                  />
                  <span className="cifre text-text-muted">€</span>
                </span>
              </label>
            ))}
          </div>
          {minCent > 0 || Number.isFinite(maxCent) ? (
            <p className="flex items-center gap-1.5 rounded-xl bg-gold-tint px-3 py-2 font-body-sm text-body-sm text-on-surface">
              <Icona nome="calculate" dimensione={16} className="text-gift-gold" />
              <span>
                Quota stimata in {amici}: da{" "}
                <strong className="cifre">{formattaEuro(quotaProposta(minCent, amici))}</strong>
                {Number.isFinite(maxCent) ? (
                  <>
                    {" "}
                    a <strong className="cifre">{formattaEuro(quotaProposta(maxCent, amici))}</strong>
                  </>
                ) : null}{" "}
                a testa
              </span>
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <span className="font-label-md text-label-md font-bold text-primary-container">Destinatario</span>
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Destinatario">
            {([
              { v: "uomo" as const, t: "Uomo" },
              { v: "donna" as const, t: "Donna" },
              { v: "" as const, t: "Chiunque" },
            ]).map((d) => (
              <button
                key={d.t}
                type="button"
                aria-pressed={destinatario === d.v}
                onClick={() => {
                  setDestinatario(d.v);
                  setIndice(0);
                }}
                className={`rounded-xl px-3 py-2.5 font-label-md text-label-md transition-colors ${
                  destinatario === d.v ? "bg-primary-container text-on-primary" : "bg-surface-container-low text-on-surface"
                }`}
              >
                {d.t}
              </button>
            ))}
          </div>
        </div>

        {tipi.length > 0 ? (
          <div className="flex flex-col gap-2">
            <span className="font-label-md text-label-md font-bold text-primary-container">Tipo (arredamento e design)</span>
            <div className="flex flex-wrap gap-2">
              {tipi.map((t) => (
                <button
                  key={t.valore}
                  type="button"
                  aria-pressed={tipo === t.valore}
                  onClick={() => {
                    setTipo(tipo === t.valore ? "" : t.valore);
                    setIndice(0);
                  }}
                  className={`rounded-full px-3 py-1.5 font-label-sm text-label-sm transition-colors ${
                    tipo === t.valore ? "bg-secondary-container text-on-secondary" : "bg-surface-container-low text-on-surface"
                  }`}
                >
                  {t.etichetta}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setFiltriAperti(false)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary-container font-label-lg text-label-lg text-on-primary"
        >
          <Icona nome="check_circle" dimensione={18} />
          <span>
            Mostra {risultati.length} {risultati.length === 1 ? "regalo" : "regali"}
          </span>
        </button>
      </div>

      {/* Intestazione dei risultati */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-headline-sm text-headline-sm text-primary-container">
          <span className="cifre">{risultati.length}</span> {risultati.length === 1 ? "idea regalo" : "idee regalo"}
        </h2>
        <label className="flex items-center gap-1 font-label-md text-label-md text-text-muted">
          Ordina
          <select
            value={ordine}
            onChange={(e) => setOrdine(e.target.value as Ordine)}
            className="rounded-lg bg-surface-container-low px-2 py-1.5 font-label-md text-label-md text-on-surface focus:outline-none"
          >
            {ORDINI.map((o) => (
              <option key={o.id} value={o.id}>
                {o.etichetta}
              </option>
            ))}
          </select>
        </label>
      </div>

      {risultati.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border-warm bg-surface-container-low p-6 text-center font-body-md text-body-md text-text-muted">
          Nessun regalo con questi filtri. Prova ad allargare la ricerca.
        </p>
      ) : vista === "griglia" ? (
        <ul className="grid grid-cols-2 gap-3">
          {risultati.map((p) => (
            <li key={p.slug} className="flex">
              <article className="flex w-full flex-col overflow-hidden rounded-2xl border border-border-warm bg-surface-cream-card shadow-sm">
                <div className="relative h-32 w-full overflow-hidden bg-surface-container">
                  <Link href={`/prodotto/${p.slug}`} tabIndex={-1} aria-hidden="true">
                    <ImmagineProdotto prodotto={p} className="h-full w-full" />
                  </Link>
                  <BottoneCuore slug={p.slug} nome={p.nome} className="absolute right-2 top-2" />
                </div>
                <div className="flex flex-1 flex-col gap-1 p-3">
                  {p.marca !== "Generico" ? (
                    <span className="truncate font-label-sm text-[10px] uppercase tracking-wider text-text-muted">{p.marca}</span>
                  ) : null}
                  <h3 className="line-clamp-2 font-headline-sm text-[14px] leading-tight text-primary-container">
                    <Link href={`/prodotto/${p.slug}`} className="hover:underline">
                      {p.nome}
                    </Link>
                  </h3>
                  <span className="cifre mt-auto pt-1 font-headline-sm text-[18px] text-primary-container">{formattaEuro(p.prezzoCent)}</span>
                  <span className="flex items-center gap-1 font-body-sm text-[11px] text-text-muted">
                    <Icona nome="group" dimensione={13} />~{formattaEuro(quotaProposta(p.prezzoCent, amici))} in {amici}
                  </span>
                  <button
                    type="button"
                    onClick={() => creaColletta(p)}
                    className="mt-2 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-primary-container font-label-md text-label-md text-on-primary transition-colors hover:bg-forest-hover"
                  >
                    <Icona nome="bolt" dimensione={16} piena />
                    <span>Crea colletta</span>
                  </button>
                </div>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        corrente && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-label-md text-label-md text-secondary">
                <span className="h-2 w-2 rounded-full bg-secondary-container" />
                Idea <span className="cifre">{Math.min(indice, risultati.length - 1) + 1}</span> di{" "}
                <span className="cifre">{risultati.length}</span>
              </span>
              <span className="flex gap-2">
                <button
                  type="button"
                  aria-label="Idea precedente"
                  onClick={() => setIndice((i) => Math.max(0, i - 1))}
                  disabled={indice <= 0}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border-warm bg-surface-cream-card text-primary-container disabled:opacity-40"
                >
                  <Icona nome="arrow_back" dimensione={18} />
                </button>
                <button
                  type="button"
                  aria-label="Idea successiva"
                  onClick={() => setIndice((i) => Math.min(risultati.length - 1, i + 1))}
                  disabled={indice >= risultati.length - 1}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border-warm bg-surface-cream-card text-primary-container disabled:opacity-40"
                >
                  <Icona nome="arrow_forward" dimensione={18} />
                </button>
              </span>
            </div>

            <article className="flex flex-col overflow-hidden rounded-2xl border border-border-warm bg-surface-cream-card shadow-md">
              <div className="relative h-56 w-full overflow-hidden bg-surface-container">
                <Link href={`/prodotto/${corrente.slug}`} tabIndex={-1} aria-hidden="true">
                  <ImmagineProdotto prodotto={corrente} className="h-full w-full" />
                </Link>
                <BottoneCuore slug={corrente.slug} nome={corrente.nome} className="absolute right-3 top-3" />
              </div>
              <div className="flex flex-col gap-3 p-4">
                <div className="flex flex-wrap gap-2">
                  {(corrente.temi ?? []).map((t) => (
                    <span key={t} className="rounded-full bg-tangerine-tint px-2.5 py-1 font-label-sm text-[11px] text-secondary">
                      {maiuscola(t)}
                    </span>
                  ))}
                  {corrente.sottocategoria ? (
                    <span className="rounded-full bg-surface-container-low px-2.5 py-1 font-label-sm text-[11px] text-on-surface">
                      {corrente.sottocategoria}
                    </span>
                  ) : null}
                </div>
                <h3 className="font-headline-md text-headline-md leading-tight text-primary-container">
                  <Link href={`/prodotto/${corrente.slug}`} className="hover:underline">
                    {corrente.nome}
                  </Link>
                </h3>
                <p className="line-clamp-3 font-body-sm text-body-sm text-text-muted">{corrente.descrizione}</p>

                <div className="flex items-end justify-between rounded-xl bg-surface-container-low px-3 py-2.5">
                  <span className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-text-muted">Prezzo totale</span>
                    <span className="cifre font-headline-sm text-[20px] text-primary-container">{formattaEuro(corrente.prezzoCent)}</span>
                  </span>
                  <span className="flex flex-col items-end">
                    <span className="font-label-sm text-label-sm text-text-muted">Quota per amico</span>
                    <span className="cifre font-headline-sm text-[20px] text-secondary-container">
                      {formattaEuro(quotaProposta(corrente.prezzoCent, amici))}
                    </span>
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-surface-container-low px-3 py-2">
                  <span className="flex items-center gap-2 font-label-md text-label-md text-on-surface">
                    <Icona nome="group" dimensione={18} /> Dividi tra
                  </span>
                  <span className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Un amico in meno"
                      onClick={() => setAmici((n) => Math.max(2, n - 1))}
                      disabled={amici <= 2}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-cream-card text-primary-container disabled:opacity-40"
                    >
                      −
                    </button>
                    <output className="cifre w-8 text-center text-lg font-bold">{amici}</output>
                    <button
                      type="button"
                      aria-label="Un amico in più"
                      onClick={() => setAmici((n) => Math.min(200, n + 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-container text-on-primary"
                    >
                      +
                    </button>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => creaColletta(corrente)}
                  className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-secondary-container font-label-lg text-label-lg font-bold text-on-secondary shadow-md transition-all hover:bg-secondary active:scale-[0.98]"
                >
                  <Icona nome="rocket_launch" dimensione={20} />
                  <span>Lancia la colletta per questo regalo</span>
                </button>
                <Link
                  href={`/prodotto/${corrente.slug}`}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-surface-container-low font-label-md text-label-md text-primary-container"
                >
                  <Icona nome="visibility" dimensione={18} />
                  <span>Vedi la scheda completa</span>
                </Link>
              </div>
            </article>
          </div>
        )
      )}

      {/* Regalo trovato altrove */}
      <section className="flex flex-col items-center gap-3 rounded-2xl border border-border-warm bg-surface-cream-card p-space-lg text-center shadow-sm">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-forest-tint text-primary-container">
          <Icona nome="add_link" dimensione={22} />
        </span>
        <h2 className="font-headline-sm text-headline-sm text-primary-container">Non trovi quello che cerchi?</h2>
        <p className="font-body-sm text-body-sm text-text-muted">
          Nel wizard puoi incollare il link di qualsiasi negozio online e la colletta parte comunque.
        </p>
        <Link
          href="/crea"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-secondary-container font-label-lg text-label-lg text-on-secondary"
        >
          <Icona nome="link" dimensione={18} />
          <span>Incolla un link</span>
        </Link>
      </section>
    </div>
  );
}
