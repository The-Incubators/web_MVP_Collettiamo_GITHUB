import { describe, expect, it } from "vitest";
import { CATALOGO_GRUPPO, MODO_CATALOGO_PREDEFINITO, conModo, modoCatalogo } from "./ux";

describe("contesto del catalogo", () => {
  it("senza ?modo= il catalogo è quello di Idee regalo, qualunque cosa ci fosse prima", () => {
    expect(MODO_CATALOGO_PREDEFINITO).toBe("singolo");
    expect(modoCatalogo(undefined)).toBe("singolo");
  });

  it("legge solo i due valori validi e ripiega sul predefinito per gli altri", () => {
    expect(modoCatalogo("gruppo")).toBe("gruppo");
    expect(modoCatalogo("singolo")).toBe("singolo");
    for (const storto of ["", "GRUPPO", "classica", "nuova", "v4", "<script>"]) expect(modoCatalogo(storto)).toBe("singolo");
  });

  it("scrive ?modo= solo per il regalo di gruppo", () => {
    expect(conModo("/prodotto/x", "singolo")).toBe("/prodotto/x");
    expect(conModo("/prodotto/x", "gruppo")).toBe("/prodotto/x?modo=gruppo");
    expect(CATALOGO_GRUPPO).toBe(conModo("/catalogo", "gruppo"));
  });
});
