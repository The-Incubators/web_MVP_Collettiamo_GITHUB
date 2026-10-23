import { describe, expect, it } from "vitest";
import voci from "./catalogo-amazon.json";
import { ETA_PRODOTTI, FASCE_ETA, fasceEta } from "./eta-prodotti";

const prodotti = (Array.isArray(voci) ? voci : (voci as { prodotti: { id: string }[] }).prodotti) as { id: string }[];

describe("fasce d'età del catalogo", () => {
  it("ogni prodotto del catalogo ha almeno una fascia (un prodotto nuovo va classificato)", () => {
    const senza = prodotti.filter((p) => fasceEta(p).length === 0).map((p) => p.id);
    expect(senza).toEqual([]);
  });

  it("non ci sono codici di prodotti che non esistono più", () => {
    const ids = new Set(prodotti.map((p) => p.id));
    expect(Object.keys(ETA_PRODOTTI).filter((id) => !ids.has(id))).toEqual([]);
  });

  it("usa solo le lettere delle fasce, senza ripetizioni", () => {
    const lettere = FASCE_ETA.map((f) => f.codice).join("");
    for (const codici of Object.values(ETA_PRODOTTI)) {
      expect(codici).toMatch(new RegExp(`^[${lettere}]+$`));
      expect(new Set(codici).size).toBe(codici.length);
    }
  });

  it("un regalo senza codice (da link) non ha fasce", () => {
    expect(fasceEta({})).toEqual([]);
    expect(fasceEta({ id: "PRD-001" })).toEqual(["ragazzo", "adulto"]);
  });
});
