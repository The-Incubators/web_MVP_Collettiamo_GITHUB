import { describe, expect, it } from "vitest";
import { sezioneDi } from "./navigazione";

describe("sezione della navigazione", () => {
  it("la home è solo «/»", () => {
    expect(sezioneDi("/")).toBe("home");
    expect(sezioneDi("")).toBe("home");
  });

  it("/regalo-di-gruppo è il regalo di gruppo, non Idee regalo (UX-11)", () => {
    expect(sezioneDi("/regalo-di-gruppo")).toBe("gruppo");
    expect(sezioneDi("/regalo")).toBe("idee");
    expect(sezioneDi("/regalo/risultati")).toBe("idee");
  });

  it("Idee regalo raccoglie domande, catalogo e schede prodotto", () => {
    for (const p of ["/idee", "/catalogo", "/catalogo?modo=gruppo", "/prodotto/tazza"]) expect(sezioneDi(p)).toBe("idee");
  });

  it("le pagine del gruppo stanno sotto Regalo di gruppo", () => {
    for (const p of ["/crea", "/gestisci/abc", "/c/abc"]) expect(sezioneDi(p)).toBe("gruppo");
  });

  it("preferiti e pagine personali", () => {
    expect(sezioneDi("/preferiti")).toBe("preferiti");
    for (const p of ["/account", "/le-mie-collette", "/reminder", "/accedi"]) expect(sezioneDi(p)).toBe("account");
  });

  it("un prefisso simile non basta", () => {
    for (const p of ["/regalone", "/catalogo-vecchio", "/cx", "/biglietto/nuovo", "/b/abc", "/privacy"]) expect(sezioneDi(p)).toBeNull();
  });
});
