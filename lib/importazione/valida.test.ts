import { describe, expect, it } from "vitest";
import { dataExcel, datiDaRichiesta, pulisci, rigaInCandidato } from "./valida";

const riga = (patch: Record<string, string> = {}): Record<string, string> => ({
  "ID prodotto": "PRD-201",
  "Nome prodotto": "Lampada  da tavolo\u0007 LED",
  Marca: "",
  "Descrizione breve": "Luce calda dimmerabile.",
  "Perché è interessante": "Piace a tutti.",
  Uomo: "Sì",
  Donna: "no",
  Viaggio: "",
  Tecnologia: "sì",
  Arredamento: "Sì",
  "Prezzo rilevato (EUR)": "49,90",
  ASIN: "b0abcdef12",
  "Link Amazon": "https://www.amazon.it/dp/B0ABCDEF12",
  "Immagine locale": "immagini/PRD-201.webp",
  "Data rilevazione": "46311",
  ...patch,
});

describe("una riga del file dell'agente", () => {
  it("diventa un candidato pulito", () => {
    const e = rigaInCandidato(riga());
    expect(e.ok).toBe(true);
    if (!e.ok) return;
    expect(e.immagine).toBe("PRD-201.webp");
    expect(e.dati).toEqual({
      asin: "B0ABCDEF12",
      idOrigine: "PRD-201",
      nome: "Lampada da tavolo LED",
      marca: "Generico",
      descrizione: "Luce calda dimmerabile.",
      perche: "Piace a tutti.",
      prezzoCent: 4990,
      link: "https://www.amazon.it/dp/B0ABCDEF12",
      destinatari: ["uomo"],
      temi: ["tecnologia", "arredamento"],
      rilevatoIl: "2026-10-16",
    });
  });

  it.each([
    [{ ASIN: "corto" }, "ASIN non valido"],
    [{ "Link Amazon": "https://www.amazon.it/dp/B0ZZZZZZZZ" }, "stesso ASIN"],
    [{ "Link Amazon": "https://www.amazon.com/dp/B0ABCDEF12" }, "stesso ASIN"],
    [{ "Prezzo rilevato (EUR)": "0.5" }, "prezzo"],
    [{ "Prezzo rilevato (EUR)": "abc" }, "prezzo"],
    [{ "Nome prodotto": "" }, "nome vuoto"],
    [{ "Immagine locale": "../segreti/x.jpg" }, "percorso immagine"],
    [{ "Immagine locale": "immagini/x.svg" }, "percorso immagine"],
    [{ "Data rilevazione": "ieri" }, "data"],
    [{ "ID prodotto": "201" }, "ID non valido"],
  ])("segnala %o", (patch, atteso) => {
    const e = rigaInCandidato(riga(patch));
    expect(e.ok).toBe(false);
    if (!e.ok) expect(e.errori.join(" ")).toContain(atteso);
  });

  it("converte le date di Excel e quelle ISO", () => {
    expect(dataExcel("46311")).toBe("2026-10-16");
    expect(dataExcel("2026-10-16T00:00:00.000Z")).toBe("2026-10-16");
    expect(dataExcel("ieri")).toBeNull();
  });

  it("pulisce i testi", () => {
    expect(pulisci("  a\u0000b \n  c ⵁ 5 ")).toBe("ab c Ø 5");
  });
});

describe("i dati che arrivano al server", () => {
  const buoni = { ...((rigaInCandidato(riga()) as { dati: object }).dati) };

  it("passano se sono in forma", () => {
    expect(datiDaRichiesta(buoni).ok).toBe(true);
  });

  it("vengono ricontrollati", () => {
    expect(datiDaRichiesta({ ...buoni, prezzoCent: 999999 }).ok).toBe(false);
    expect(datiDaRichiesta({ ...buoni, temi: ["armi"] }).ok).toBe(false);
    expect(datiDaRichiesta({ ...buoni, link: "javascript:alert(1)" }).ok).toBe(false);
    expect(datiDaRichiesta(null).ok).toBe(false);
  });
});
