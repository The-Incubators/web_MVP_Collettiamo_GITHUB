import { describe, expect, it } from "vitest";
import { testoIlGiorno, testoRilevazioneCatalogo } from "./regali";

const giorni = (...g: string[]) => g.map((rilevatoIl) => ({ rilevatoIl }));

describe("giorni di rilevazione dei prezzi", () => {
  it("scrive uno, due o più giorni dello stesso mese", () => {
    expect(testoRilevazioneCatalogo(giorni("2026-10-14", "2026-10-14"))).toBe("14 ottobre 2026");
    expect(testoRilevazioneCatalogo(giorni("2026-10-14", "2026-10-15"))).toBe("14 e 15 ottobre 2026");
    expect(testoRilevazioneCatalogo(giorni("2026-10-16", "2026-10-14", "2026-10-15"))).toBe("14, 15 e 16 ottobre 2026");
  });
  it("con mesi diversi usa «dal … al …»; senza date resta vuoto", () => {
    expect(testoRilevazioneCatalogo(giorni("2026-10-30", "2026-11-02"))).toBe("dal 30 ottobre 2026 al 2 novembre 2026");
    expect(testoRilevazioneCatalogo([{}])).toBe("");
  });
});

describe("testoIlGiorno", () => {
  it("mette l'articolo e lo elide davanti a 8 e 11", () => {
    expect(testoIlGiorno("2026-10-14")).toBe("il 14 ottobre 2026");
    expect(testoIlGiorno("2026-10-08")).toBe("l'8 ottobre 2026");
    expect(testoIlGiorno("2026-11-11")).toBe("l'11 novembre 2026");
    expect(testoIlGiorno("2026-11-01")).toBe("il 1 novembre 2026");
  });
});
