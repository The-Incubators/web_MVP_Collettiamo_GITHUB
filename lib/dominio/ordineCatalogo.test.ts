import { describe, expect, it } from "vitest";
import { confrontaProdotti, filtraProdotti } from "../dati/tipi";
import { ordineEffettivo, ordineManuale, posizioni, sposta, validaImpostazioni } from "./ordineCatalogo";
import type { Prodotto } from "../tipi";

const SLUGS = ["a", "b", "c", "d", "e"];

describe("ordine del catalogo", () => {
  it("in modalità trascinamento vale la lista, completata con i prodotti nuovi in coda", () => {
    expect(ordineEffettivo(SLUGS, { modo: "trascinamento", ordine: ["c", "a"], stelle: {} })).toEqual(["c", "a", "b", "d", "e"]);
    expect(ordineManuale(SLUGS, ["zzz", "e", "e", "a"])).toEqual(["e", "a", "b", "c", "d"]);
  });
  it("in modalità stelle prima le stelle più alte; a parità conta la lista; senza voto vale 3", () => {
    const o = ordineEffettivo(SLUGS, { modo: "stelle", ordine: ["a", "b", "c", "d", "e"], stelle: { d: 5, b: 5, e: 1, a: 4 } });
    expect(o).toEqual(["b", "d", "a", "c", "e"]);
  });
  it("le posizioni partono da 1", () => {
    expect(posizioni(SLUGS, { modo: "trascinamento", ordine: ["b"], stelle: {} })).toEqual({ b: 1, a: 2, c: 3, d: 4, e: 5 });
  });
  it("sposta un elemento senza uscire dai limiti", () => {
    expect(sposta([1, 2, 3, 4], 0, 2)).toEqual([2, 3, 1, 4]);
    expect(sposta([1, 2, 3, 4], 3, 0)).toEqual([4, 1, 2, 3]);
    expect(sposta([1, 2, 3], 1, 9)).toEqual([1, 2, 3]);
  });
  it("rifiuta tutto ciò che non è atteso", () => {
    const ok = validaImpostazioni({ modo: "stelle", ordine: ["a", "b"], stelle: { a: 5 } }, SLUGS);
    expect(ok.ok).toBe(true);
    for (const brutto of [
      null,
      { modo: "x", ordine: [], stelle: {} },
      { modo: "stelle", ordine: ["zzz"], stelle: {} },
      { modo: "stelle", ordine: ["a", "a"], stelle: {} },
      { modo: "stelle", ordine: [], stelle: { a: 6 } },
      { modo: "stelle", ordine: [], stelle: { a: 2.5 } },
      { modo: "stelle", ordine: [], stelle: { zzz: 3 } },
      { modo: "stelle", ordine: "a", stelle: {} },
      { modo: "stelle", ordine: [], stelle: [] },
    ]) {
      expect(validaImpostazioni(brutto, SLUGS).ok).toBe(false);
    }
  });
});

describe("elenco prodotti nel sito", () => {
  const p = (slug: string, prezzoCent: number, posizione?: number): Prodotto => ({
    slug, nome: slug, marca: "m", prezzoCent, categoria: "casa", occasioni: [], descrizione: "", consegnaGiorni: 3, urlEsterno: "", immagine: { seme: slug, icona: "casa" }, attivo: true, destinatari: ["uomo"], temi: ["viaggio"], posizione,
  });
  it("senza posizioni si ordina per prezzo", () => {
    expect(filtraProdotti([p("x", 30000), p("y", 10000), p("z", 20000)]).map((x) => x.slug)).toEqual(["y", "z", "x"]);
  });
  it("con le posizioni vince la posizione, prima e dopo i filtri; i nuovi vanno in coda per prezzo", () => {
    const tutti = [p("x", 30000, 1), p("y", 10000, 3), p("z", 20000, 2), p("nuovo-caro", 50000), p("nuovo-economico", 5000)];
    expect(filtraProdotti(tutti).map((x) => x.slug)).toEqual(["x", "z", "y", "nuovo-economico", "nuovo-caro"]);
    expect(filtraProdotti(tutti, { per: "uomo", fascia: "oltre" }).map((x) => x.slug)).toEqual(["x", "nuovo-caro"]);
    expect(filtraProdotti(tutti, { fascia: "200" }).map((x) => x.slug)).toEqual(["z"]);
  });
  it("i prodotti eliminati dall'area riservata non si mostrano, con o senza filtri", () => {
    const tutti = [p("x", 30000, 1), { ...p("y", 10000, 2), eliminato: true }, p("z", 20000, 3)];
    expect(filtraProdotti(tutti).map((x) => x.slug)).toEqual(["x", "z"]);
    expect(filtraProdotti(tutti, { per: "uomo" }).map((x) => x.slug)).toEqual(["x", "z"]);
    expect(filtraProdotti(tutti, { fascia: "30" })).toEqual([]);
    // `eliminato: false` è un prodotto normale: solo true nasconde
    expect(filtraProdotti([{ ...p("w", 1000), eliminato: false }]).map((x) => x.slug)).toEqual(["w"]);
  });
  it("l'ordine è lo stesso anche per l'area riservata, che vede pure gli eliminati", () => {
    const tutti = [p("tardi", 10000, 9), { ...p("presto", 30000, 1), eliminato: true }, p("senza-posizione", 500)];
    expect([...tutti].sort(confrontaProdotti).map((x) => x.slug)).toEqual(["presto", "tardi", "senza-posizione"]);
  });
});
