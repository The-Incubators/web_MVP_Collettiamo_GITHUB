import { describe, expect, it } from "vitest";
import { UX_PREDEFINITA, VARIANTI_UX, varianteUx } from "./ux";

describe("varianti di front-end", () => {
  it("la predefinita è UX_V4, il sito di oggi", () => {
    expect(UX_PREDEFINITA.id).toBe("v4");
    expect(UX_PREDEFINITA.nome).toBe("UX_V4");
    expect(UX_PREDEFINITA.percorso).toBe("/");
    expect(UX_PREDEFINITA.disponibile).toBe(true);
  });

  it("gli id sono unici e ogni variante ha un percorso", () => {
    expect(new Set(VARIANTI_UX.map((v) => v.id)).size).toBe(VARIANTI_UX.length);
    for (const v of VARIANTI_UX) expect(v.percorso.startsWith("/")).toBe(true);
  });

  it("sceglie la variante chiesta quando esiste ed è pronta", () => {
    expect(varianteUx("v4").id).toBe("v4");
  });

  it("chi aveva scelto una variante tolta (V1, V2, V3) ricade su UX_V4", () => {
    for (const vecchia of ["v1", "v2", "v3"]) expect(varianteUx(vecchia).id).toBe("v4");
  });

  it("ripiega sulla predefinita se la variante non esiste o non è scelta", () => {
    for (const storto of [undefined, null, "", "v99", "../v1", "V2"]) {
      expect(varianteUx(storto).id).toBe(UX_PREDEFINITA.id);
    }
  });

  it("una variante annunciata ma non pronta non si può attivare dal cookie", () => {
    const nonPronte = VARIANTI_UX.filter((v) => !v.disponibile);
    for (const v of nonPronte) expect(varianteUx(v.id).id).toBe(UX_PREDEFINITA.id);
  });
});
