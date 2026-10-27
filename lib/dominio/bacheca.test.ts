import { describe, expect, it } from "vitest";
import { MODELLI_BIGLIETTO } from "../dati/modelli-biglietto";
import { OCCASIONI_BIGLIETTO } from "../tipi";
import {
  coloriDelModello,
  coloriValidi,
  dataEventoValida,
  htmlDaTestoSemplice,
  NOME_ESEMPIO,
  rivelazioneValida,
  scurisciValido,
  slugPerFesteggiato,
  testoSu,
  titoloEffettivo,
  titoloPredefinito,
} from "./bacheca";
import { slugBigliettoValido } from "./biglietti";

describe("titolo della bacheca", () => {
  it("ogni occasione ha il suo titolo con il nome", () => {
    for (const o of OCCASIONI_BIGLIETTO) expect(titoloPredefinito(o.valore, "Luca")).toContain("Luca");
    expect(titoloPredefinito("compleanno", "Luca")).toBe("Buon compleanno, Luca!");
  });
  it("senza nome usa quello d'esempio; occasione sconosciuta come «altro»", () => {
    expect(titoloPredefinito("compleanno", "  ")).toContain(NOME_ESEMPIO);
    expect(titoloPredefinito("boh", "Luca")).toBe("Per Luca");
  });
  it("il titolo scritto vince sul predefinito", () => {
    expect(titoloEffettivo("  Evviva!  ", "compleanno", "Luca")).toBe("Evviva!");
    expect(titoloEffettivo("", "pensione", "Luca")).toBe("Buona pensione, Luca!");
  });
});

describe("colori", () => {
  it("ogni tema ha tre colori validi", () => {
    for (const m of MODELLI_BIGLIETTO) expect(coloriValidi(coloriDelModello(m))).not.toBeNull();
  });
  it("rifiuta colori incompleti o non esadecimali", () => {
    expect(coloriValidi({ sfondo1: "#fff", sfondo2: "#FFFFFF", accento: "#000000" })).toBeNull();
    expect(coloriValidi({ sfondo1: "#ffffff", sfondo2: "#FFFFFF" })).toBeNull();
    expect(coloriValidi({ sfondo1: "#aabbcc", sfondo2: "#FFFFFF", accento: "#000000" })).toEqual({ sfondo1: "#AABBCC", sfondo2: "#FFFFFF", accento: "#000000" });
  });
  it("testo leggibile: bianco sullo scuro, scuro sul chiaro", () => {
    expect(testoSu("#033922")).toBe("#FFFFFF");
    expect(testoSu("#FFF3C4")).toBe("#16241F");
    expect(testoSu("rosso")).toBe("#16241F");
  });
});

describe("valori dal browser", () => {
  it("scurisci resta tra 0 e 0,8", () => {
    expect(scurisciValido(2)).toBe(0.8);
    expect(scurisciValido(-1)).toBe(0);
    expect(scurisciValido("x")).toBe(0.3);
    expect(scurisciValido(0.456)).toBe(0.46);
  });
  it("rivelazione: solo i quattro modi, altrimenti storie", () => {
    expect(rivelazioneValida("film")).toBe("film");
    expect(rivelazioneValida("diapositive")).toBe("storie");
  });
  it("data dell'evento facoltativa e nel formato AAAA-MM-GG", () => {
    expect(dataEventoValida("2026-11-03")).toBe("2026-11-03");
    expect(dataEventoValida("03/11/2026")).toBe("");
    expect(dataEventoValida(undefined)).toBe("");
  });
  it("il benvenuto è testo: niente tag, gli a capo restano", () => {
    expect(htmlDaTestoSemplice("Ciao <b>tutti</b>\nA presto")).toBe("Ciao &lt;b&gt;tutti&lt;/b&gt;<br>A presto");
  });
});

describe("link dal nome del festeggiato", () => {
  it("nome leggibile + codice di 6 caratteri, sempre valido", () => {
    const s = slugPerFesteggiato("Nicòla Rossi", () => 0);
    expect(s).toBe("nicola-rossi-aaaaaa");
    expect(slugBigliettoValido(s)).toBe(true);
  });
  it("senza lettere usabili parte da «biglietto»", () => {
    const s = slugPerFesteggiato("🎉", () => 0.999);
    expect(s).toBe("biglietto-999999");
    expect(slugBigliettoValido(s)).toBe(true);
  });
});
