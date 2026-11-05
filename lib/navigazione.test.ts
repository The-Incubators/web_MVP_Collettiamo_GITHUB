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

  it("il biglietto ha la sua voce", () => {
    for (const p of ["/biglietto", "/biglietto/nuovo", "/biglietto/abc/gestisci", "/biglietto/esempio"]) expect(sezioneDi(p)).toBe("biglietto");
  });

  it("un prefisso simile non basta", () => {
    for (const p of ["/regalone", "/catalogo-vecchio", "/cx", "/bigliettone", "/b/abc", "/privacy"]) expect(sezioneDi(p)).toBeNull();
  });
});

import { piePaginaVisibile } from "./navigazione";

describe("piè di pagina", () => {
  it("non c'è nei percorsi a passi", () => {
    for (const p of ["/regalo", "/crea", "/crea?bozza=x", "/accedi", "/biglietto/nuovo", "/biglietto/abc/design"]) expect(piePaginaVisibile(p)).toBe(false);
  });
  it("c'è nelle altre pagine", () => {
    for (const p of ["/", "/idee", "/catalogo", "/regalo-di-gruppo", "/biglietto", "/biglietto/abc/gestisci", "/account"]) expect(piePaginaVisibile(p)).toBe(true);
  });
});
