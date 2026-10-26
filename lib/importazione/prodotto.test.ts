import { describe, expect, it } from "vitest";
import { fasceEta } from "../dati/eta-prodotti";
import { fotoDaDataUrl, nomeFoto, FORMA_NOME_FOTO } from "./foto";
import { csvDecisioni, decisioneDaRichiesta, jsonDecisioni, prodottoDaCandidato, prossimoId, slugUnico } from "./prodotto";
import type { Candidato } from "./tipi";

const candidato = (patch: Partial<Candidato> = {}): Candidato => ({
  asin: "B0ABCDEF12",
  idOrigine: "PRD-201",
  nome: "Lampada LED",
  marca: "Luce",
  descrizione: "Luce calda.",
  perche: "Piace.",
  prezzoCent: 4990,
  link: "https://www.amazon.it/dp/B0ABCDEF12",
  destinatari: ["uomo"],
  temi: ["arredamento"],
  rilevatoIl: "2026-10-16",
  foto: "/api/img/prodotti/B0ABCDEF12-0123abcd.jpg",
  lotto: "lotto-1",
  caricatoIl: 1,
  caricatoDa: "a@b.it",
  stato: "in_revisione",
  decisione: null,
  ...patch,
});

describe("codici e slug dei prodotti importati", () => {
  it("prende il primo codice libero", () => {
    expect(prossimoId(["PRD-001", "PRD-180", undefined, "XYZ"])).toBe("PRD-181");
    expect(prossimoId([])).toBe("PRD-001");
  });

  it("non riusa uno slug già preso", () => {
    expect(slugUnico("Lampada LED è bella", "PRD-181", new Set())).toBe("lampada-led-e-bella");
    expect(slugUnico("Lampada LED", "PRD-181", new Set(["lampada-led"]))).toBe("lampada-led-prd-181");
  });
});

describe("la decisione", () => {
  const importa = { esito: "importato", motivi: ["Prezzo giusto"], nota: " ok ", destinatari: ["donna"], temi: ["viaggio"], eta: ["adulto"], stelle: 4 };

  it("vuole almeno un motivo, e motivi conosciuti", () => {
    expect(decisioneDaRichiesta({ esito: "scartato", motivi: [] }).ok).toBe(false);
    expect(decisioneDaRichiesta({ esito: "scartato", motivi: ["Prezzo giusto"] }).ok).toBe(false);
    expect(decisioneDaRichiesta({ esito: "scartato", motivi: ["Prezzo troppo alto"], nota: "caro" })).toEqual({
      ok: true,
      valore: { esito: "scartato", motivi: ["Prezzo troppo alto"], nota: "caro" },
    });
  });

  it("per importare vuole età e stelle valide", () => {
    expect(decisioneDaRichiesta(importa).ok).toBe(true);
    expect(decisioneDaRichiesta({ ...importa, eta: [] }).ok).toBe(false);
    expect(decisioneDaRichiesta({ ...importa, eta: ["anziano"] }).ok).toBe(false);
    expect(decisioneDaRichiesta({ ...importa, stelle: 6 }).ok).toBe(false);
    expect(decisioneDaRichiesta({ ...importa, nota: "x".repeat(1001) }).ok).toBe(false);
    expect(decisioneDaRichiesta({ esito: "boh" }).ok).toBe(false);
  });

  it("fa del candidato un prodotto completo, col link affiliato e l'età", () => {
    const p = prodottoDaCandidato(candidato(), { destinatari: ["donna"], temi: ["viaggio"], eta: ["adulto", "ragazzo"], stelle: 4 }, "PRD-181", "lampada-led");
    expect(p).toMatchObject({ id: "PRD-181", slug: "lampada-led", temi: ["viaggio"], destinatari: ["donna"], importato: true, attivo: true });
    expect(p.urlEsterno).toContain("tag=");
    expect(p.immagine.foto).toBe("/api/img/prodotti/B0ABCDEF12-0123abcd.jpg");
    expect(fasceEta(p)).toEqual(["ragazzo", "adulto"]);
  });
});

describe("l'esportazione per l'agente", () => {
  const decisi = [
    candidato({ stato: "scartato", decisione: { esito: "scartato", motivi: ["Prezzo troppo alto", "Qualità dubbia"], nota: '=HYPERLINK("x"), "caro"', il: 0, da: "a@b.it" } }),
    candidato({ asin: "B0ZZZZZZZZ", stato: "in_revisione" }),
  ];

  it("contiene solo i prodotti decisi", () => {
    const j = JSON.parse(jsonDecisioni(decisi));
    expect(j.totale).toBe(1);
    expect(j.decisioni[0]).toMatchObject({ asin: "B0ABCDEF12", esito: "sbagliato", motivi: ["Prezzo troppo alto", "Qualità dubbia"] });
  });

  it("nel CSV mette le virgolette e disinnesca le formule", () => {
    const csv = csvDecisioni(decisi);
    expect(csv.startsWith("﻿asin,esito,motivi")).toBe(true);
    expect(csv).toContain('"\'=HYPERLINK(""x""), ""caro"""');
    expect(csv.split("\r\n").filter(Boolean)).toHaveLength(2);
  });
});

describe("la foto inviata", () => {
  const jpeg = `data:image/jpeg;base64,${Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]).toString("base64")}`;

  it("si accetta solo se è davvero quello che dice", () => {
    expect(fotoDaDataUrl(jpeg).ok).toBe(true);
    expect(fotoDaDataUrl(`data:image/png;base64,${Buffer.from([0xff, 0xd8, 0xff]).toString("base64")}`).ok).toBe(false);
    expect(fotoDaDataUrl("data:image/svg+xml;base64,PHN2Zz4=").ok).toBe(false);
  });

  it("ha un nome che la rotta delle immagini riconosce", () => {
    expect(FORMA_NOME_FOTO.test(nomeFoto("B0ABCDEF12", "image/jpeg"))).toBe(true);
  });
});
