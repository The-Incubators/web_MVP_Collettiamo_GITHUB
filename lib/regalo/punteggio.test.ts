import { describe, expect, it } from "vitest";
import { CATALOGO } from "../dati/catalogo-dati";
import type { Prodotto } from "../tipi";
import { FASCIA_TUTTE, filtriIniziali, microDelProdotto, normalizza, ordinaProdotti, punteggio, testoProdotto } from "./punteggio";
import { cambiaInteresse, cambiaMacro, scegliGenere, scegliOccasione, statoIniziale } from "./stato";

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

/** Un percorso con le passioni (macro) e le micro indicate. */
const conScelte = (macro: string[], micro: string[] = []) => {
  let s = scegliOccasione(scegliGenere(statoIniziale(), "donna"), "compleanno");
  for (const id of macro) s = cambiaMacro(s, id);
  for (const id of micro) s = cambiaInteresse(s, id);
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

describe("micro-categorie dei prodotti", () => {
  it("un prodotto del catalogo usa le sue micro, uno nuovo quelle trovate con le parole", () => {
    expect(microDelProdotto(prodotto({ slug: "a", id: "PRD-301", nome: "Flip 7" }))).toEqual(["giochi-tavolo"]);
    expect(microDelProdotto(prodotto({ slug: "b", descrizione: "cuffie senza fili" }))).toEqual(["tech-audio"]);
    expect(microDelProdotto(prodotto({ slug: "c", descrizione: "un oggetto qualunque" }))).toEqual([]);
  });
});

describe("punteggio di affinità", () => {
  const cuffie = prodotto({ slug: "cuffie", descrizione: "cuffie senza fili", temi: ["tecnologia"] });

  it("la micro scelta vale 3, la passione 2, il tema 1", () => {
    // passione Tecnologia, «va bene tutto»: 2 + 1
    expect(punteggio(cuffie, conScelte(["tecnologia"]))).toBe(3);
    // più la micro scelta: 3 + 2 + 1
    expect(punteggio(cuffie, conScelte(["tecnologia"], ["tech-audio"]))).toBe(6);
    // un'altra micro della stessa passione: resta la passione, il tema è quello della micro scelta
    expect(punteggio(cuffie, conScelte(["tecnologia"], ["tech-foto"]))).toBe(3);
    expect(punteggio(prodotto({ slug: "vaso", descrizione: "un vaso" }), conScelte(["tecnologia"]))).toBe(0);
  });

  it("somma le due passioni scelte", () => {
    const p = prodotto({ slug: "a", descrizione: "cuffie da viaggio con power bank", temi: ["tecnologia", "viaggio"] });
    // Tecnologia: 2 + 1; Viaggi: 2 + 1
    expect(punteggio(p, conScelte(["tecnologia", "viaggi"]))).toBe(6);
  });

  it("non casca sui falsi positivi già trovati nel catalogo", () => {
    // "spa" prendeva «Spacey», "auto" prendeva «automatico», "eco" prendeva «economico»
    expect(punteggio(prodotto({ slug: "a", nome: "Spacey, tavolino oro" }), conScelte(["bellezza"]))).toBe(0);
    expect(punteggio(prodotto({ slug: "b", descrizione: "apertura automatica" }), conScelte(["viaggi"]))).toBe(0);
    expect(punteggio(prodotto({ slug: "c", descrizione: "molto economico" }), conScelte(["casa"]))).toBe(0);
  });

  it("l'occasione vale 2 solo se il prodotto la dichiara, e «altro» non conta", () => {
    const s = conScelte(["tecnologia"]);
    expect(punteggio(prodotto({ slug: "a", occasioni: ["compleanno"] }), s)).toBe(2);
    const altro = scegliOccasione(s, "altro");
    expect(punteggio(prodotto({ slug: "a", occasioni: ["altro"] }), altro)).toBe(0);
  });

  it("il genere vale 1 solo per i prodotti pensati per una persona sola", () => {
    const s = conScelte(["tecnologia"]);
    expect(punteggio(prodotto({ slug: "a", destinatari: ["donna"] }), s)).toBe(1);
    expect(punteggio(prodotto({ slug: "b", destinatari: ["uomo", "donna"] }), s)).toBe(0);
    expect(punteggio(prodotto({ slug: "c", destinatari: ["uomo"] }), s)).toBe(0);
  });
});

describe("ordine e filtri dei risultati", () => {
  const s = conScelte(["tecnologia"]);
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
  it("chi sceglie Viaggi trova in cima prodotti da viaggio", () => {
    const primi = ordinaProdotti(CATALOGO, conScelte(["viaggi"]), filtriIniziali()).slice(0, 5);
    expect(primi).toHaveLength(5);
    for (const p of primi) expect(p.temi).toContain("viaggio");
  });

  it("chi sceglie Casa e design trova in cima prodotti di casa", () => {
    const primi = ordinaProdotti(CATALOGO, conScelte(["casa"]), filtriIniziali()).slice(0, 5);
    for (const p of primi) expect(microDelProdotto(p).some((m) => m.startsWith("casa-"))).toBe(true);
  });

  it("chi restringe agli orologi trova in cima orologi", () => {
    const primi = ordinaProdotti(CATALOGO, conScelte(["stile"], ["stile-orologi"]), filtriIniziali()).slice(0, 10);
    for (const p of primi) expect(microDelProdotto(p)).toContain("stile-orologi");
  });

  it("risposte diverse danno risultati diversi", () => {
    const viaggio = ordinaProdotti(CATALOGO, conScelte(["viaggi"]), filtriIniziali());
    const giochi = ordinaProdotti(CATALOGO, conScelte(["giochi"], ["giochi-lego"]), filtriIniziali());
    expect(viaggio).toHaveLength(CATALOGO.length);
    expect(viaggio[0].slug).not.toBe(giochi[0].slug);
  });
});
