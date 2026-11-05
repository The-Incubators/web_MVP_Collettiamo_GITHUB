import { describe, expect, it } from "vitest";
import {
  domandaInteressi,
  etichettaPer,
  hrefDomande,
  hrefRisultati,
  parametriDaStato,
  risposteComplete,
  statoDaParametri,
  testiInteressi,
  titoloRisultati,
} from "./indirizzo";

describe("le risposte nell'indirizzo", () => {
  it("legge per, occasione, passioni e interessi, e li riscrive uguali", () => {
    const s = statoDaParametri(new URLSearchParams("per=donna&occasione=compleanno&macro=casa,viaggi&interessi=casa-luci"));
    expect(s).toMatchObject({ genere: "donna", occasione: "compleanno", macro: ["casa", "viaggi"], interessi: ["casa-luci"] });
    expect(parametriDaStato(s)).toBe("per=donna&occasione=compleanno&macro=casa,viaggi&interessi=casa-luci");
    expect(risposteComplete(s)).toBe(true);
  });

  it("ignora valori sconosciuti e interessi di passioni non scelte", () => {
    const s = statoDaParametri({ per: "alieno", occasione: "ferragosto", macro: "casa,nope", interessi: "tech-audio" });
    expect(s).toMatchObject({ genere: null, occasione: null, macro: ["casa"], interessi: [] });
  });

  it("il passo vale solo se è raggiungibile, altrimenti si va alla prima domanda senza risposta", () => {
    expect(statoDaParametri({ per: "uomo" }).tappa).toBe(2);
    expect(statoDaParametri({ per: "uomo", passo: "3" }).tappa).toBe(2);
    expect(statoDaParametri({ per: "uomo", occasione: "natale", passo: "2" }).tappa).toBe(2);
    expect(statoDaParametri({ per: "uomo", occasione: "natale" }).tappa).toBe(3);
    expect(statoDaParametri({}).tappa).toBe(1);
  });

  it("senza almeno una passione le risposte non sono complete", () => {
    expect(risposteComplete(statoDaParametri({ per: "donna", occasione: "laurea" }))).toBe(false);
  });

  it("costruisce gli indirizzi delle domande e dei risultati", () => {
    const s = statoDaParametri({ per: "donna", occasione: "natale", macro: "tecnologia" });
    expect(hrefDomande(s, 2)).toBe("/regalo?per=donna&occasione=natale&macro=tecnologia&passo=2");
    expect(hrefRisultati(s)).toBe("/regalo/risultati?per=donna&occasione=natale&macro=tecnologia");
  });
});

describe("i testi che cambiano con la persona", () => {
  it("lei o lui", () => {
    expect([etichettaPer("donna"), titoloRisultati("donna"), domandaInteressi("donna")]).toEqual(["Per lei", "Idee per lei", "Che cosa le piace?"]);
    expect([etichettaPer("uomo"), titoloRisultati("uomo"), domandaInteressi("uomo")]).toEqual(["Per lui", "Idee per lui", "Che cosa gli piace?"]);
  });

  it("un chip per passione, con gli interessi scelti in minuscolo", () => {
    const s = statoDaParametri({ per: "donna", occasione: "natale", macro: "casa,viaggi", interessi: "casa-luci" });
    expect(testiInteressi(s)).toEqual(["Casa e design: lampade e luci d’atmosfera", "Viaggi"]);
  });
});
