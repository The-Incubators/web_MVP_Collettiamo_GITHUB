import { describe, expect, it } from "vitest";
import { conVisto, leggiVisti, MAX_VISTI, slugValido } from "./visti";

describe("visti di recente", () => {
  it("mette l'ultimo aperto in cima", () => {
    expect(conVisto(["a", "b"], "c")).toEqual(["c", "a", "b"]);
  });

  it("non ripete un prodotto riaperto: lo sposta in cima", () => {
    expect(conVisto(["a", "b", "c"], "b")).toEqual(["b", "a", "c"]);
  });

  it("ne tiene al massimo quattro, perdendo il più vecchio", () => {
    expect(MAX_VISTI).toBe(4);
    expect(conVisto(["a", "b", "c", "d"], "e")).toEqual(["e", "a", "b", "c"]);
  });

  it("ignora uno slug non valido", () => {
    expect(conVisto(["a"], "../x")).toEqual(["a"]);
    expect(slugValido("Cuffie Sony")).toBe(false);
    expect(slugValido("cuffie-sony-wh-1000")).toBe(true);
  });

  it("legge la lista salvata scartando valori rovinati", () => {
    expect(leggiVisti(null)).toEqual([]);
    expect(leggiVisti("non json")).toEqual([]);
    expect(leggiVisti('{"a":1}')).toEqual([]);
    expect(leggiVisti('["a", 3, "a", "<b>", "c", "d", "e", "f"]')).toEqual(["a", "c", "d", "e"]);
  });
});
