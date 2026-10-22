import { describe, expect, it } from "vitest";
import { firmeOrdinate, impaginaMessaggi, numeroPagine } from "./biglietto";
import type { Firma } from "../tipi";

const m = (id: string, altezza: number) => ({ id, altezza });

describe("impaginazione dei messaggi", () => {
  it("una colonna: riempie finché ci sta, poi cambia pagina", () => {
    const p = impaginaMessaggi([m("a", 100), m("b", 100), m("c", 100)], 1, 300, 10);
    expect(p).toHaveLength(2); // 100 + 10 + 100 = 210; +10+100 = 320 > 300 → pagina 2
    expect(p[0].colonne[0]).toEqual(["a", "b"]);
    expect(p[1].colonne[0]).toEqual(["c"]);
  });

  it("due colonne: mette ogni riquadro nella colonna più corta, a parità la prima", () => {
    const p = impaginaMessaggi(["a", "b", "c", "d", "e", "f", "g"].map((x) => m(x, 100)), 2, 300, 10);
    expect(p).toHaveLength(2);
    expect(p[0].colonne).toEqual([["a", "c"], ["b", "d"]]);
    expect(p[1].colonne).toEqual([["e", "g"], ["f"]]);
  });

  it("colonne di altezze diverse: la più corta prende il prossimo", () => {
    const p = impaginaMessaggi([m("alto", 200), m("a", 50), m("b", 50)], 2, 1000, 10);
    expect(p[0].colonne[0]).toEqual(["alto"]);
    expect(p[0].colonne[1]).toEqual(["a", "b"]);
  });

  it("un riquadro più alto della pagina viene messo da solo", () => {
    const p = impaginaMessaggi([m("x", 400), m("y", 400)], 2, 300, 10);
    expect(p).toHaveLength(2);
    expect(p[0].colonne[0]).toEqual(["x"]);
    expect(p[1].colonne[0]).toEqual(["y"]);
  });

  it("nessun messaggio: nessuna pagina interna; il totale è la sola copertina", () => {
    const p = impaginaMessaggi([], 2, 300);
    expect(p).toEqual([{ colonne: [[], []] }]);
    expect(numeroPagine([])).toBe(1);
    expect(numeroPagine([{ colonne: [[]] }, { colonne: [[]] }])).toBe(3);
  });
});

describe("ordine delle firme", () => {
  const f = (id: string, creatoIl: number, nascosta = false): Firma => ({
    id, uid: id, messaggioHtml: "", stile: { font: "", colore: "", dimensione: "m" }, immagine: null,
    daParteDi: id, nome: id, cognome: null, email: null, nascosta, creatoIl, aggiornatoIl: creatoIl,
  });
  it("per data quando non c'è un ordine, e scarta le nascoste", () => {
    expect(firmeOrdinate([f("b", 2), f("a", 1), f("x", 3, true)], null).map((x) => x.id)).toEqual(["a", "b"]);
  });
  it("segue l'ordine dato e mette in coda, per data, chi non c'è ancora", () => {
    expect(firmeOrdinate([f("a", 1), f("b", 2), f("c", 3), f("d", 4)], ["c", "a"]).map((x) => x.id)).toEqual(["c", "a", "b", "d"]);
  });
});
