import { describe, expect, it } from "vitest";
import { affiliaLink, asinValido, linkSchedaAmazon, REL_LINK_PRODOTTO, TAG_AFFILIATO_AMAZON as TAG, urlPerAcquisto } from "./amazon";

const conv = (link: string, asin?: string) => affiliaLink(link, asin);

describe("link affiliati Amazon.it", () => {
  it("i cinque esempi del catalogo", () => {
    for (const [asin] of [["B0C4P1MF8V"], ["B0F6V789N8"], ["B0C8HD6F5W"], ["B07J5PGC8W"], ["B0B8P52RKW"]]) {
      expect(conv(`https://www.amazon.it/dp/${asin}`)).toEqual({ stato: "convertito", url: `https://www.amazon.it/dp/${asin}?tag=${TAG}` });
    }
  });
  it("link semplice: aggiunge il tag", () => {
    expect(conv("https://www.amazon.it/dp/B0C4P1MF8V")).toEqual({ stato: "convertito", url: `https://www.amazon.it/dp/B0C4P1MF8V?tag=${TAG}` });
    expect(conv("https://amazon.it/gp/product/B0C4P1MF8V/")).toMatchObject({ url: `https://amazon.it/gp/product/B0C4P1MF8V/?tag=${TAG}` });
    expect(conv("https://m.amazon.it/dp/B0C4P1MF8V")).toMatchObject({ stato: "convertito" });
  });
  it("link con parametri: li conserva così come sono e aggiunge il tag in fondo", () => {
    expect(conv("https://www.amazon.it/dp/B0C4P1MF8V?th=1&psc=1")).toEqual({ stato: "convertito", url: `https://www.amazon.it/dp/B0C4P1MF8V?th=1&psc=1&tag=${TAG}` });
    // nessuna ricodifica: %20, +, vuoti e parametri senza valore restano identici
    expect(conv("https://www.amazon.it/s?k=lampada%20da+tavolo&&rh=n%3A1&x")).toMatchObject({ url: `https://www.amazon.it/s?k=lampada%20da+tavolo&&rh=n%3A1&x&tag=${TAG}` });
    expect(conv("https://www.amazon.it/dp/B0C4P1MF8V?")).toMatchObject({ url: `https://www.amazon.it/dp/B0C4P1MF8V?tag=${TAG}` });
  });
  it("conserva il frammento", () => {
    expect(conv("https://www.amazon.it/dp/B0C4P1MF8V#customerReviews")).toMatchObject({ url: `https://www.amazon.it/dp/B0C4P1MF8V?tag=${TAG}#customerReviews` });
    expect(conv("https://www.amazon.it/dp/B0C4P1MF8V?th=1#a?b=c")).toMatchObject({ url: `https://www.amazon.it/dp/B0C4P1MF8V?th=1&tag=${TAG}#a?b=c` });
  });
  it("tag già presente: lo sostituisce, nella stessa posizione, senza duplicarlo", () => {
    expect(conv("https://www.amazon.it/dp/B0C4P1MF8V?tag=altro-21")).toEqual({ stato: "convertito", url: `https://www.amazon.it/dp/B0C4P1MF8V?tag=${TAG}` });
    expect(conv("https://www.amazon.it/dp/B0C4P1MF8V?th=1&tag=altro-21&psc=1#x")).toMatchObject({ url: `https://www.amazon.it/dp/B0C4P1MF8V?th=1&tag=${TAG}&psc=1#x` });
    expect(conv("https://www.amazon.it/dp/B0C4P1MF8V?tag=a-21&th=1&tag=b-21")).toMatchObject({ url: `https://www.amazon.it/dp/B0C4P1MF8V?tag=${TAG}&th=1` });
    expect(conv("https://www.amazon.it/dp/B0C4P1MF8V?tag=")).toMatchObject({ url: `https://www.amazon.it/dp/B0C4P1MF8V?tag=${TAG}` });
    // un parametro che contiene "tag" non è il tag
    expect(conv("https://www.amazon.it/dp/B0C4P1MF8V?linkCode=tag&mytag=x")).toMatchObject({ url: `https://www.amazon.it/dp/B0C4P1MF8V?linkCode=tag&mytag=x&tag=${TAG}` });
  });
  it("è idempotente: rieseguirla non cambia più nulla", () => {
    for (const partenza of [
      "https://www.amazon.it/dp/B0C4P1MF8V",
      "https://www.amazon.it/dp/B0C4P1MF8V?th=1&psc=1#x",
      "https://www.amazon.it/dp/B0C4P1MF8V?tag=a-21&tag=b-21&th=1",
      "https://www.amazon.it/dp/B0C4P1MF8V?tag=pacestefano77-21",
    ]) {
      const una = conv(partenza);
      const due = conv((una as { url: string }).url);
      const tre = conv((due as { url: string }).url);
      expect(due.stato).toBe("invariato");
      expect((due as { url: string }).url).toBe((una as { url: string }).url);
      expect((tre as { url: string }).url).toBe((una as { url: string }).url);
      expect((una as { url: string }).url.match(/tag=/g)).toHaveLength(1);
    }
    expect(conv(`https://www.amazon.it/dp/B0C4P1MF8V?tag=${TAG}`)).toEqual({ stato: "invariato", url: `https://www.amazon.it/dp/B0C4P1MF8V?tag=${TAG}` });
  });
  it("senza link ma con un ASIN valido crea il link", () => {
    expect(affiliaLink("", "B0C4P1MF8V")).toEqual({ stato: "creato", url: `https://www.amazon.it/dp/B0C4P1MF8V?tag=${TAG}` });
    expect(affiliaLink(null, " b0c4p1mf8v ")).toMatchObject({ stato: "creato", url: `https://www.amazon.it/dp/B0C4P1MF8V?tag=${TAG}` });
    expect(affiliaLink("   ", "B0C4P1MF8V").stato).toBe("creato");
    expect(affiliaLink(undefined, "8804668032")).toMatchObject({ stato: "creato" }); // ISBN-10
    // il link creato è già a posto: rieseguire non lo cambia
    const creato = affiliaLink("", "B0C4P1MF8V") as { url: string };
    expect(conv(creato.url).stato).toBe("invariato");
  });
  it("senza link e senza ASIN valido segnala «mancante»", () => {
    expect(affiliaLink("", null).stato).toBe("mancante");
    expect(affiliaLink(undefined, "ABC").stato).toBe("mancante");
    expect(affiliaLink("", "B0C4P1MF8V!!").stato).toBe("mancante");
    expect(asinValido("B0C4P1MF8V")).toBe(true);
    expect(asinValido("B0C4P1MF8")).toBe(false);
  });
  it("URL non Amazon.it: lo lascia com'è", () => {
    for (const url of [
      "https://www.amazon.com/dp/B0C4P1MF8V",
      "https://www.amazon.de/dp/B0C4P1MF8V",
      "https://negozio-esempio.it/p/lampada",
      "https://amzn.to/3xYz",
      "https://www.amazon.it.evil.example/dp/B0C4P1MF8V",
      "https://notamazon.it/dp/B0C4P1MF8V",
      "https://www.amazon.it@evil.example/dp/B0C4P1MF8V",
      "https://m.media-amazon.com/images/I/619BkgEoP1L._AC_SL1500_.jpg",
    ]) {
      const e = conv(url, "B0C4P1MF8V");
      expect(e.stato).toBe("ignorato");
      expect((e as { url: string }).url).toBe(url);
    }
    expect(urlPerAcquisto("https://www.amazon.com/dp/B0C4P1MF8V")).toBe("https://www.amazon.com/dp/B0C4P1MF8V");
  });
  it("URL malformato: lo segnala e non lo tocca", () => {
    for (const brutto of ["htp//amazon.it/dp/B0C4P1MF8V", "https://", "amazon.it/dp/B0C4P1MF8V", "https://www.amazon.it/dp/B0C4P1MF8V con spazio", "javascript:alert(1)", "ftp://www.amazon.it/dp/B0C4P1MF8V", "https://user:pw@www.amazon.it/dp/B0C4P1MF8V", "https://www.amazon.it/dp/\nB0C4P1MF8V"]) {
      const e = conv(brutto, "B0C4P1MF8V");
      expect(e.stato, brutto).toBe("malformato");
      expect((e as { url: string }).url).toBe(brutto.trim());
    }
  });
  it("i pulsanti del sito usano il link affiliato e rifiutano di inventarsene uno", () => {
    expect(urlPerAcquisto("https://www.amazon.it/dp/B0C4P1MF8V")).toBe(`https://www.amazon.it/dp/B0C4P1MF8V?tag=${TAG}`);
    expect(urlPerAcquisto(`https://www.amazon.it/dp/B0C4P1MF8V?tag=${TAG}`)).toBe(`https://www.amazon.it/dp/B0C4P1MF8V?tag=${TAG}`);
    expect(urlPerAcquisto("")).toBe("");
    expect(urlPerAcquisto(undefined)).toBe("");
    expect(urlPerAcquisto("non un link")).toBe("non un link");
    expect(REL_LINK_PRODOTTO).toContain("sponsored");
  });
});

describe("link alla scheda Amazon per l'area riservata", () => {
  it("lo costruisce dall'ASIN, senza tag affiliato", () => {
    expect(linkSchedaAmazon("B0D3V6TR98", "https://www.amazon.it/dp/B0D3V6TR98?tag=pacestefano77-21")).toBe("https://www.amazon.it/dp/B0D3V6TR98");
  });
  it("senza un ASIN valido ripiega sul link del prodotto", () => {
    const link = "https://www.amazon.it/dp/B0D3V6TR98?tag=pacestefano77-21";
    for (const storto of [undefined, null, "", "b0d3v6tr98", "TROPPOCORTO", "B0D3V6TR9/../x"]) {
      expect(linkSchedaAmazon(storto, link)).toBe(link);
    }
  });
});
