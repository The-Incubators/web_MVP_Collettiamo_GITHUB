import { describe, expect, it } from "vitest";
import { leggiZipCartella } from "./cartella";
import { jsonDecisioni } from "./prodotto";
import type { Candidato } from "./tipi";
import { prodottoJsonInCandidato } from "./valida";
import { zipStored } from "./zip-per-test";

/** Un prodotto nel formato JSON del GPT (stessi campi del pacchetto catalogo_tecnologia_2026-10-26). */
const voce = (patch: Record<string, unknown> = {}) => ({
  nome: "LaMetric TIME",
  marca: "LaMetric",
  modello: "TIME",
  variante: "nero",
  sottocategoria: "orologi connessi",
  asin: "B017N5FP0E",
  url_amazon: "https://www.amazon.it/dp/B017N5FP0E",
  prezzo_rilevato: 199.0,
  valuta: "EUR",
  spedizione_rilevata: 0,
  disponibilita: "Disponibilità immediata",
  motivo_selezione: "Il display a pixel mostra l'ora come una piccola insegna grafica.",
  elemento_distintivo: "Orologio Wi-Fi con quadranti pixel personalizzabili.",
  destinatari: ["amanti della pixel art", "chi lavora alla scrivania"],
  limiti: ["Richiede alimentazione, Wi-Fi e app."],
  immagini_esaminate: true,
  stato_verifica: "documentato",
  verifiche_mancanti: [],
  fonti: [{ url: "https://www.amazon.it/dp/B017N5FP0E", informazioni_supportate: "identità e prezzo" }, { url: "javascript:alert(1)", informazioni_supportate: "x" }],
  rilevato_il: "2026-10-26",
  immagine_locale: "prodotti/B017N5FP0E/immagini/amazon.jpg",
  ordine_editoriale: 9,
  ...patch,
});

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);

describe("il formato JSON del GPT", () => {
  it("diventa un candidato, con le informazioni dell'agente a parte", () => {
    const e = prodottoJsonInCandidato(voce(), "Prodotti tecnologici");
    expect(e.ok).toBe(true);
    if (!e.ok) return;
    expect(e.immagine).toBe("prodotti/B017N5FP0E/immagini/amazon.jpg");
    expect(e.dati).toMatchObject({
      asin: "B017N5FP0E",
      idOrigine: "#009",
      nome: "LaMetric TIME",
      descrizione: "Orologio Wi-Fi con quadranti pixel personalizzabili.",
      perche: "Il display a pixel mostra l'ora come una piccola insegna grafica.",
      prezzoCent: 19900,
      destinatari: ["uomo", "donna"],
      temi: ["tecnologia"],
      rilevatoIl: "2026-10-26",
    });
    // la sottocategoria dell'agente non diventa quella del catalogo (nel sito vorrebbe dire «Design»)
    expect(e.dati.sottocategoria).toBeUndefined();
    expect(e.dati.agente).toMatchObject({
      categoria: "Prodotti tecnologici",
      sottocategoria: "orologi connessi",
      variante: "nero",
      destinatari: ["amanti della pixel art", "chi lavora alla scrivania"],
      statoVerifica: "documentato",
      fonti: [{ url: "https://www.amazon.it/dp/B017N5FP0E", informazioni: "identità e prezzo" }],
    });
  });

  it.each([
    [{ prezzo_rilevato: "199" }, "prezzo"],
    [{ valuta: "USD" }, "valuta"],
    [{ url_amazon: "https://www.amazon.de/dp/B017N5FP0E" }, "stesso ASIN"],
    [{ immagine_locale: "prodotti/ALTRO12345/immagini/amazon.jpg" }, "percorso immagine"],
    [{ immagine_locale: "prodotti/B017N5FP0E/immagini/../../x.jpg" }, "percorso immagine"],
    [{ asin: "B0(.*)$" }, "ASIN non valido"],
    [{ ordine_editoriale: "nove" }, "ID non valido"],
  ])("segnala %o", (patch, atteso) => {
    const e = prodottoJsonInCandidato(voce(patch), "Prodotti tecnologici");
    expect(e.ok).toBe(false);
    if (!e.ok) expect(e.errori.join(" ")).toContain(atteso);
  });

  it("legge lo zip del GPT: abbina le foto e dice cosa manca", async () => {
    const catalogo = {
      categoria: "Prodotti tecnologici",
      prodotti: [voce(), voce({ asin: "B079M56Z4G", url_amazon: "https://www.amazon.it/dp/B079M56Z4G", immagine_locale: "prodotti/B079M56Z4G/immagini/amazon.jpg", ordine_editoriale: 2 }), voce()],
    };
    const zip = zipStored({
      "cat/catalogo.json": JSON.stringify(catalogo),
      "cat/prodotti/B017N5FP0E/scheda.json": "{}",
      "cat/prodotti/B017N5FP0E/immagini/amazon.jpg": JPEG,
      "__MACOSX/cat/._catalogo.json": "x",
    });
    const l = await leggiZipCartella(new File([zip as BlobPart], "catalogo_tecnologia_2026-10-26.zip"));
    expect(l.lotto).toBe("catalogo_tecnologia_2026-10-26");
    expect(l.pronti.map((p) => p.dati.asin)).toEqual(["B017N5FP0E"]);
    expect(l.pronti[0].foto.type).toBe("image/jpeg");
    expect(l.errori).toEqual([
      { id: "B079M56Z4G", errori: ["foto mancante (prodotti/B079M56Z4G/immagini/amazon.jpg)"] },
      { id: "B017N5FP0E", errori: ["ASIN ripetuto nel file"] },
    ]);
  });

  it("senza catalogo.json né Excel lo dice chiaramente", async () => {
    const zip = zipStored({ "cat/LEGGIMI.md": "ciao" });
    await expect(leggiZipCartella(new File([zip as BlobPart], "x.zip"))).rejects.toThrow("né un catalogo.json né un file Excel");
  });

  it("nell'esportazione porta anche le informazioni dell'agente", () => {
    const e = prodottoJsonInCandidato(voce(), "Prodotti tecnologici");
    if (!e.ok) throw new Error("atteso valido");
    const c: Candidato = {
      ...e.dati,
      foto: "/api/img/prodotti/B017N5FP0E-0123abcd.jpg",
      lotto: "tec",
      caricatoIl: 1,
      caricatoDa: "a@b.it",
      stato: "scartato",
      decisione: { esito: "scartato", motivi: ["Prezzo troppo alto"], nota: "", il: 0, da: "a@b.it" },
    };
    const riga = JSON.parse(jsonDecisioni([c])).decisioni[0];
    expect(riga).toMatchObject({ id_agente: "#009", sottocategoria_agente: "orologi connessi", destinatari_agente: ["amanti della pixel art", "chi lavora alla scrivania"], limiti: ["Richiede alimentazione, Wi-Fi e app."] });
  });
});
