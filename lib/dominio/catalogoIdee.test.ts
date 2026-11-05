import { describe, expect, it } from "vitest";
import type { Prodotto } from "../tipi";
import { altreIdee, filtraCatalogo, hrefCatalogo, leggiFiltriCatalogo, temiDelProdotto, TEMI_CATALOGO } from "./catalogoIdee";

function prodotto(p: Partial<Prodotto> & { slug: string }): Prodotto {
  return {
    nome: p.slug,
    marca: "Generico",
    prezzoCent: 5000,
    categoria: "casa",
    occasioni: [],
    descrizione: "",
    consegnaGiorni: 3,
    urlEsterno: "https://www.amazon.it/dp/B000000000",
    immagine: { seme: p.slug, icona: "casa" },
    attivo: true,
    ...p,
  };
}

const lampada = prodotto({ slug: "lampada", nome: "Lampada da tavolo", prezzoCent: 4000 });
const cuffie = prodotto({ slug: "cuffie", nome: "Cuffie wireless", prezzoCent: 15000 });
const speaker = prodotto({ slug: "speaker", nome: "Speaker bluetooth", prezzoCent: 9000 });
const zaino = prodotto({ slug: "zaino", nome: "Zaino da viaggio", prezzoCent: 20000 });

describe("catalogo di Idee regalo", () => {
  it("i temi sono le passioni, nell'ordine del prototipo", () => {
    expect(TEMI_CATALOGO.map((t) => t.etichetta).slice(0, 6)).toEqual([
      "Casa e design",
      "Tecnologia",
      "Viaggi",
      "Libri, musica e creatività",
      "Stile e accessori",
      "Cucina e buon gusto",
    ]);
    expect(temiDelProdotto(lampada)).toContain("casa");
    expect(temiDelProdotto(cuffie)).toContain("tecnologia");
  });

  it("legge solo filtri che esistono", () => {
    expect(leggiFiltriCatalogo("casa", "150")).toEqual({ tema: "casa", fascia: "150" });
    expect(leggiFiltriCatalogo("arredamento", "30")).toEqual({ tema: undefined, fascia: undefined });
  });

  it("filtra per tema e fascia senza cambiare l'ordine; il limite superiore è compreso", () => {
    const tutti = [zaino, cuffie, lampada, speaker];
    expect(filtraCatalogo(tutti, {})).toEqual(tutti);
    expect(filtraCatalogo(tutti, { tema: "tecnologia" }).map((p) => p.slug)).toEqual(["cuffie", "speaker"]);
    expect(filtraCatalogo(tutti, { fascia: "50" }).map((p) => p.slug)).toEqual(["lampada"]);
    expect(filtraCatalogo(tutti, { fascia: "150" }).map((p) => p.slug)).toEqual(["cuffie", "speaker"]);
    expect(filtraCatalogo(tutti, { fascia: "oltre" }).map((p) => p.slug)).toEqual(["zaino"]);
  });

  it("scrive l'indirizzo solo con i filtri attivi", () => {
    expect(hrefCatalogo({})).toBe("/catalogo");
    expect(hrefCatalogo({ tema: "casa", fascia: "oltre" })).toBe("/catalogo?tema=casa&fascia=oltre");
    expect(hrefCatalogo({ modo: "gruppo", mostra: 48 })).toBe("/catalogo?modo=gruppo&mostra=48");
  });

  it("le altre idee sono le più vicine, mai il prodotto stesso", () => {
    const altre = altreIdee(cuffie, [lampada, zaino, cuffie, speaker], 2);
    expect(altre[0].slug).toBe("speaker");
    expect(altre.map((p) => p.slug)).not.toContain("cuffie");
    expect(altre).toHaveLength(2);
  });
});
