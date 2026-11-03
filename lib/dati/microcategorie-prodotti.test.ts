import { describe, expect, it } from "vitest";
import { INTERESSI } from "../regalo/dati";
import voci from "./catalogo-amazon.json";
import { MICRO_PRODOTTI, microDiCatalogo } from "./microcategorie-prodotti";

const prodotti = voci as { id: string }[];

describe("micro-categorie del catalogo", () => {
  it("ogni prodotto del catalogo ha almeno una micro (un prodotto nuovo va classificato)", () => {
    expect(prodotti.filter((p) => microDiCatalogo(p).length === 0).map((p) => p.id)).toEqual([]);
  });

  it("non ci sono codici di prodotti che non esistono più", () => {
    const ids = new Set(prodotti.map((p) => p.id));
    expect(Object.keys(MICRO_PRODOTTI).filter((id) => !ids.has(id))).toEqual([]);
  });

  it("usa solo micro che esistono, senza ripetizioni", () => {
    const valide = new Set(INTERESSI.map((x) => x.id));
    for (const codici of Object.values(MICRO_PRODOTTI)) {
      const micro = codici.split(" ");
      expect(micro.filter((m) => !valide.has(m))).toEqual([]);
      expect(new Set(micro).size).toBe(micro.length);
    }
  });

  it("un regalo senza codice (da link) non ha micro", () => {
    expect(microDiCatalogo({})).toEqual([]);
  });
});
