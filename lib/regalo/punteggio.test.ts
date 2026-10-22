import { describe, expect, it } from "vitest";
import { CATALOGO } from "../dati/catalogo-dati";
import type { Prodotto } from "../tipi";
import { FASCIA_TUTTE, filtriIniziali, normalizza, ordinaProdotti, punteggio, testoProdotto } from "./punteggio";
import { cambiaInteresse, scegliGenere, scegliOccasione, statoIniziale } from "./stato";

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

const conInteressi = (...ids: string[]) => {
  let s = scegliOccasione(scegliGenere(statoIniziale(), "donna"), "compleanno");
  for (const id of ids) s = cambiaInteresse(s, id);
  return s;
};

describe("normalizzazione dei testi", () => {
  it("toglie accenti e segni, e ancora le parole all'inizio", () => {
    expect(normalizza("Caffè & Co.")).toBe(" caffe co ");
    const testo = testoProdotto(prodotto({ slug: "x", nome: "Arte da parete", descrizione: "una cartella" }));
    // "arte" trova "Arte", non "cartella": la radice è ancorata all'inizio della parola
    expect(testo.includes(" arte")).toBe(true);
    expect(normalizza("cartella").includes(" arte")).toBe(false);
  });
});

describe("punteggio di affinità", () => {
  it("le parole dell'interesse valgono 3, il tema 1", () => {
    const s = conInteressi("musica");
    expect(punteggio(prodotto({ slug: "a", descrizione: "cuffie senza fili" }), s)).toBe(3);
    expect(punteggio(prodotto({ slug: "b", temi: ["tecnologia"] }), s)).toBe(1);
    expect(punteggio(prodotto({ slug: "c", descrizione: "cuffie", temi: ["tecnologia"] }), s)).toBe(4);
    expect(punteggio(prodotto({ slug: "d", descrizione: "un vaso" }), s)).toBe(0);
  });

  it("somma gli interessi scelti", () => {
    const s = conInteressi("musica", "viaggi", "casa");
    const p = prodotto({ slug: "a", descrizione: "cuffie da viaggio", temi: ["tecnologia", "viaggio"] });
    // musica: 3 + 1, viaggi: 3 + 1, casa: 0
    expect(punteggio(p, s)).toBe(8);
  });

  it("non casca sui falsi positivi già trovati nel catalogo", () => {
    // "spa" prendeva «Spacey», "design" prendeva le marche «Peak Design» e «Kare Design»
    expect(punteggio(prodotto({ slug: "a", nome: "Spacey, tavolino oro" }), conInteressi("benessere"))).toBe(0);
    expect(punteggio(prodotto({ slug: "b", nome: "Tech Pouch", marca: "Peak Design" }), conInteressi("musei"))).toBe(0);
    expect(punteggio(prodotto({ slug: "c", descrizione: "apertura automatica" }), conInteressi("motori"))).toBe(0);
    expect(punteggio(prodotto({ slug: "d", descrizione: "molto economico" }), conInteressi("volontariato"))).toBe(0);
  });

  it("l'occasione vale 2 solo se il prodotto la dichiara, e «altro» non conta", () => {
    const s = conInteressi("musica");
    expect(punteggio(prodotto({ slug: "a", occasioni: ["compleanno"] }), s)).toBe(2);
    const altro = scegliOccasione(s, "altro");
    expect(punteggio(prodotto({ slug: "a", occasioni: ["altro"] }), altro)).toBe(0);
  });

  it("il genere vale 1 solo per i prodotti pensati per una persona sola", () => {
    const s = conInteressi("musica");
    expect(punteggio(prodotto({ slug: "a", destinatari: ["donna"] }), s)).toBe(1);
    expect(punteggio(prodotto({ slug: "b", destinatari: ["uomo", "donna"] }), s)).toBe(0);
    expect(punteggio(prodotto({ slug: "c", destinatari: ["uomo"] }), s)).toBe(0);
  });
});

describe("ordine e filtri dei risultati", () => {
  const s = conInteressi("musica", "viaggi", "casa");
  const elenco = [
    prodotto({ slug: "caro-affine", descrizione: "cuffie", prezzoCent: 30000, posizione: 9 }),
    prodotto({ slug: "economico", prezzoCent: 1000, posizione: 2 }),
    prodotto({ slug: "medio", prezzoCent: 9000, posizione: 1 }),
  ];

  it("per rilevanza vince il punteggio, a pari merito l'ordine del sito", () => {
    expect(ordinaProdotti(elenco, s, filtriIniziali()).map((p) => p.slug)).toEqual(["caro-affine", "medio", "economico"]);
  });

  it("gli altri ordini guardano prezzo e posizione", () => {
    expect(ordinaProdotti(elenco, s, { fascia: FASCIA_TUTTE, ordine: "prezzo-su" }).map((p) => p.slug)).toEqual(["economico", "medio", "caro-affine"]);
    expect(ordinaProdotti(elenco, s, { fascia: FASCIA_TUTTE, ordine: "prezzo-giu" }).map((p) => p.slug)).toEqual(["caro-affine", "medio", "economico"]);
    expect(ordinaProdotti(elenco, s, { fascia: FASCIA_TUTTE, ordine: "scelti" }).map((p) => p.slug)).toEqual(["medio", "economico", "caro-affine"]);
  });

  it("la fascia di prezzo filtra, «tutte» no", () => {
    expect(ordinaProdotti(elenco, s, { fascia: "30", ordine: "rilevanza" }).map((p) => p.slug)).toEqual(["economico"]);
    expect(ordinaProdotti(elenco, s, { fascia: FASCIA_TUTTE, ordine: "rilevanza" })).toHaveLength(3);
  });
});

describe("sul catalogo vero", () => {
  it("chi cerca regali da viaggio trova in cima prodotti da viaggio", () => {
    const s = conInteressi("viaggi", "trekking", "campeggio");
    const primi = ordinaProdotti(CATALOGO, s, filtriIniziali()).slice(0, 5);
    expect(primi).toHaveLength(5);
    for (const p of primi) expect(p.temi).toContain("viaggio");
  });

  it("chi cerca casa e design trova in cima prodotti di arredamento", () => {
    const s = conInteressi("casa", "musei", "giardinaggio");
    const primi = ordinaProdotti(CATALOGO, s, filtriIniziali()).slice(0, 5);
    for (const p of primi) expect(p.temi).toContain("arredamento");
  });

  it("risposte diverse danno risultati diversi", () => {
    const viaggio = ordinaProdotti(CATALOGO, conInteressi("viaggi", "trekking", "mare"), filtriIniziali());
    const casa = ordinaProdotti(CATALOGO, conInteressi("casa", "musei", "benessere"), filtriIniziali());
    expect(viaggio).toHaveLength(CATALOGO.length);
    expect(viaggio[0].slug).not.toBe(casa[0].slug);
  });
});
