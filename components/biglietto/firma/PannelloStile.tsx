"use client";

import { useEffect, useRef, useState } from "react";
import { DIMENSIONI_TESTO, FONT_BIGLIETTO, type CategoriaFont } from "@/lib/dominio/biglietti";
import type { StileFirma } from "@/lib/tipi";
import { useFontBiglietto } from "../useFontBiglietto";

const CATEGORIE: { id: CategoriaFont; nome: string }[] = [
  { id: "senza-grazie", nome: "Senza grazie" },
  { id: "con-grazie", nome: "Con grazie" },
  { id: "a-mano", nome: "Scritto a mano" },
  { id: "decorativo", nome: "Decorativo" },
];

const COLORI_BASE = ["#16241F", "#0B5E4C", "#1E3A66", "#6E2E48", "#B3261E", "#8A5A1A", "#5B2E8A"];

/** «Stile del testo»: pannello dal basso con Carattere · Colore · Dimensione e «Fatto». Vale per tutto il messaggio. */
export function PannelloStile({ aperto, stile, onStile, onChiudi }: { aperto: boolean; stile: StileFirma; onStile: (s: StileFirma) => void; onChiudi: () => void }) {
  const [scheda, setScheda] = useState<"font" | "colore" | "dimensione">("font");
  const [categoria, setCategoria] = useState<CategoriaFont>(() => FONT_BIGLIETTO.find((f) => f.id === stile.font)?.categoria ?? "senza-grazie");
  const [usati, setUsati] = useState<string[]>([]);
  const chiudi = useRef<HTMLButtonElement>(null);
  const onChiudiRef = useRef(onChiudi);
  onChiudiRef.current = onChiudi;
  useFontBiglietto(aperto ? FONT_BIGLIETTO.filter((f) => f.categoria === categoria).map((f) => f.id) : []);

  useEffect(() => {
    if (!aperto) return;
    chiudi.current?.focus();
    const t = (e: KeyboardEvent) => e.key === "Escape" && onChiudiRef.current();
    document.addEventListener("keydown", t);
    return () => document.removeEventListener("keydown", t);
  }, [aperto]);

  if (!aperto) return null;
  const colori = [...new Set([...COLORI_BASE, ...usati, stile.colore])];
  const scegliColore = (c: string) => {
    const C = c.toUpperCase();
    if (!COLORI_BASE.includes(C)) setUsati((u) => [...new Set([C, ...u])].slice(0, 6));
    onStile({ ...stile, colore: C });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onChiudi}>
      <div role="dialog" aria-modal="true" aria-label="Stile del testo" onClick={(e) => e.stopPropagation()} className="flex max-h-[85dvh] w-full max-w-[600px] flex-col rounded-t-[20px] bg-surface shadow-2xl">
        <div className="flex items-center justify-between px-4 pt-2">
          <h2 className="font-display text-xl font-bold text-accent-2">Stile del testo</h2>
          <button ref={chiudi} type="button" onClick={onChiudi} aria-label="Chiudi" className="flex h-11 w-11 items-center justify-center rounded-full text-2xl hover:bg-surface-2">
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div role="tablist" className="flex gap-6 border-b border-line px-4">
          {(
            [
              ["font", "Carattere"],
              ["colore", "Colore"],
              ["dimensione", "Dimensione"],
            ] as const
          ).map(([id, nome]) => (
            <button key={id} role="tab" type="button" aria-selected={scheda === id} onClick={() => setScheda(id)} className={`-mb-px min-h-12 border-b-2 font-semibold ${scheda === id ? "border-accent" : "border-transparent text-ink-soft"}`}>
              {nome}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {scheda === "font" ? (
            <div className="flex flex-col gap-3">
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
                {CATEGORIE.map((c) => (
                  <button key={c.id} type="button" aria-pressed={categoria === c.id} onClick={() => setCategoria(c.id)} className={`min-h-tocco shrink-0 whitespace-nowrap rounded-full px-4 text-sm font-semibold ${categoria === c.id ? "bg-accent text-on-accent" : "bg-accent-field text-accent-2"}`}>
                    {c.nome}
                  </button>
                ))}
              </div>
              <div role="radiogroup" aria-label="Carattere" className="flex flex-col gap-2">
                {FONT_BIGLIETTO.filter((f) => f.categoria === categoria || (f.id === "predefinito" && categoria === "senza-grazie")).map((f) => {
                  const scelto = stile.font === f.id;
                  return (
                    <label key={f.id} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-controllo border px-4 focus-within:outline focus-within:outline-2 focus-within:outline-accent ${scelto ? "border-accent ring-1 ring-accent" : "border-line"}`}>
                      <input type="radio" name="font" className="sr-only" checked={scelto} onChange={() => onStile({ ...stile, font: f.id })} />
                      <span aria-hidden="true" className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${scelto ? "border-accent" : "border-ink-soft"}`}>
                        {scelto ? <span className="h-2.5 w-2.5 rounded-full bg-accent" /> : null}
                      </span>
                      <span style={{ fontFamily: f.css, fontSize: 20 }}>{f.nome}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : scheda === "colore" ? (
            <div className="flex flex-col gap-3">
              <p className="font-medium">Scegli un colore</p>
              <div className="flex flex-wrap items-center gap-3">
                <label className="relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-full focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent" style={{ background: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)" }}>
                  <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-full bg-surface text-lg font-bold text-ink">
                    +
                  </span>
                  <input type="color" aria-label="Altro colore" value={stile.colore} onChange={(e) => scegliColore(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
                </label>
                {colori.map((c) => (
                  <button key={c} type="button" aria-label={`Colore ${c}`} aria-pressed={stile.colore === c} onClick={() => scegliColore(c)} className={`h-11 w-11 rounded-full border border-line ${stile.colore === c ? "ring-2 ring-accent ring-offset-2 ring-offset-surface" : ""}`} style={{ background: c }} />
                ))}
              </div>
            </div>
          ) : (
            <div role="radiogroup" aria-label="Dimensione" className="flex flex-col gap-2">
              {DIMENSIONI_TESTO.map((d) => {
                const scelto = stile.dimensione === d.id;
                return (
                  <label key={d.id} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-controllo border px-4 focus-within:outline focus-within:outline-2 focus-within:outline-accent ${scelto ? "border-accent ring-1 ring-accent" : "border-line"}`}>
                    <input type="radio" name="dimensione" className="sr-only" checked={scelto} onChange={() => onStile({ ...stile, dimensione: d.id })} />
                    <span aria-hidden="true" className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${scelto ? "border-accent" : "border-ink-soft"}`}>
                      {scelto ? <span className="h-2.5 w-2.5 rounded-full bg-accent" /> : null}
                    </span>
                    {d.nome}
                  </label>
                );
              })}
            </div>
          )}
        </div>
        <div className="border-t border-line p-4">
          <button type="button" onClick={onChiudi} className="min-h-14 w-full rounded-full bg-accent font-bold text-on-accent hover:bg-accent-2">
            Fatto
          </button>
        </div>
      </div>
    </div>
  );
}
