import { describe, expect, it } from "vitest";
import { MAX_MACRO, MAX_MICRO, MIN_MACRO } from "./dati";
import {
  avanza,
  cambiaInteresse,
  cambiaMacro,
  primaTappaIncompleta,
  puoAndareA,
  puoAvanzare,
  ripulisci,
  scegliGenere,
  scegliOccasione,
  statoIniziale,
  tappaCompleta,
  tuttaLaMacro,
  vaiAllaTappa,
} from "./stato";

/** Un percorso compilato fino alla tappa indicata. */
function compilato(fino: number) {
  let s = scegliGenere(statoIniziale(), "donna");
  if (fino >= 2) s = scegliOccasione(s, "compleanno");
  if (fino >= 3) s = cambiaInteresse(cambiaMacro(s, "tecnologia"), "tech-audio");
  return s;
}

describe("tappe del percorso", () => {
  it("la prima tappa vuole solo il destinatario", () => {
    const vuoto = statoIniziale();
    expect(tappaCompleta(vuoto, 1)).toBe(false);
    const s = scegliGenere(vuoto, "uomo");
    expect(tappaCompleta(s, 1)).toBe(true);
    expect(puoAvanzare(s)).toBe(true);
  });

  it("la terza tappa vuole almeno una passione; le micro sono facoltative", () => {
    const s = compilato(2);
    expect(tappaCompleta(s, 3)).toBe(false);
    expect(tappaCompleta(cambiaMacro(s, "giochi"), 3)).toBe(true);
    expect(MIN_MACRO).toBe(1);
  });

  it("si torna indietro ma non si salta avanti", () => {
    const s = { ...compilato(1), tappa: 2 };
    expect(puoAndareA(s, 1)).toBe(true);
    expect(puoAndareA(s, 2)).toBe(true);
    expect(puoAndareA(s, 3)).toBe(false);
    expect(puoAndareA(s, 5)).toBe(false);
    expect(vaiAllaTappa(s, 4).tappa).toBe(2);
    expect(vaiAllaTappa(s, 1).tappa).toBe(1);
  });

  it("avanza solo quando la tappa è completa", () => {
    expect(avanza(statoIniziale()).tappa).toBe(1);
    expect(avanza(compilato(1)).tappa).toBe(2);
  });

  it("primaTappaIncompleta vale 4 quando il questionario è pieno", () => {
    expect(primaTappaIncompleta(statoIniziale())).toBe(1);
    expect(primaTappaIncompleta(compilato(1))).toBe(2);
    expect(primaTappaIncompleta(compilato(3))).toBe(4);
  });
});

describe("scelte", () => {
  it("il destinatario si cambia, ma solo fra quelli previsti", () => {
    const donna = scegliGenere(statoIniziale(), "donna");
    expect(scegliGenere(donna, "uomo").genere).toBe("uomo");
    expect(scegliGenere(donna, "alieno").genere).toBe("donna");
  });

  it("rifiuta le occasioni che non esistono", () => {
    const s = scegliGenere(statoIniziale(), "donna");
    expect(scegliOccasione(s, "ferragosto").occasione).toBe(null);
    expect(scegliOccasione(s, "natale").occasione).toBe("natale");
  });

  it("le passioni si aggiungono, si tolgono e si fermano al massimo", () => {
    let s = compilato(2);
    for (const id of ["giochi", "bellezza"]) s = cambiaMacro(s, id);
    expect(s.macro).toHaveLength(MAX_MACRO);
    expect(cambiaMacro(s, "viaggi").macro).toEqual(["giochi", "bellezza"]);
    expect(cambiaMacro(s, "giochi").macro).toEqual(["bellezza"]);
    expect(cambiaMacro(s, "non-esiste")).toBe(s);
  });

  it("una micro si sceglie solo se la sua passione è scelta, fino al massimo", () => {
    let s = cambiaMacro(compilato(2), "tecnologia");
    expect(cambiaInteresse(s, "giochi-lego")).toBe(s);
    for (const id of ["tech-audio", "tech-foto", "tech-smartphone"]) s = cambiaInteresse(s, id);
    expect(s.interessi).toHaveLength(MAX_MICRO);
    expect(cambiaInteresse(s, "tech-smarthome").interessi).toHaveLength(MAX_MICRO);
    expect(cambiaInteresse(s, "tech-audio").interessi).toEqual(["tech-foto", "tech-smartphone"]);
  });

  it("togliendo una passione se ne vanno le sue micro; «va bene tutto» le toglie e lascia la passione", () => {
    let s = cambiaMacro(cambiaMacro(compilato(2), "tecnologia"), "viaggi");
    s = cambiaInteresse(cambiaInteresse(s, "tech-audio"), "viaggi-valigie");
    expect(cambiaMacro(s, "tecnologia").interessi).toEqual(["viaggi-valigie"]);
    const tutto = tuttaLaMacro(s, "viaggi");
    expect(tutto.interessi).toEqual(["tech-audio"]);
    expect(tutto.macro).toEqual(["tecnologia", "viaggi"]);
  });
});

describe("ripresa dalla sessione", () => {
  it("rilegge un percorso valido", () => {
    const s = { ...compilato(3), tappa: 4 };
    expect(ripulisci(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });

  it("butta via quello che non riconosce e riporta a una tappa raggiungibile", () => {
    expect(ripulisci(null)).toEqual(statoIniziale());
    expect(ripulisci("niente")).toEqual(statoIniziale());
    const sporco = ripulisci({ genere: "alieno", occasione: "ferragosto", macro: ["giochi", "nope"], interessi: ["giochi-lego", "tech-audio"], tappa: 4 });
    expect(sporco.genere).toBe(null);
    expect(sporco.occasione).toBe(null);
    expect(sporco.macro).toEqual(["giochi"]);
    expect(sporco.interessi).toEqual(["giochi-lego"]);
    expect(sporco.tappa).toBe(1);
  });

  it("un percorso salvato con i vecchi interessi torna alla terza tappa", () => {
    const vecchio = { genere: "donna", occasione: "natale", interessi: ["musica", "viaggi", "caffe"], tappa: 4 };
    const s = ripulisci(vecchio);
    expect(s.interessi).toEqual([]);
    expect(s.tappa).toBe(3);
  });

  it("una tappa troppo avanti torna alla prima incompleta", () => {
    expect(ripulisci({ ...compilato(1), tappa: 4 }).tappa).toBe(2);
  });
});
