import { describe, expect, it } from "vitest";
import { MAX_INTERESSI, MIN_INTERESSI } from "./dati";
import {
  avanza,
  cambiaInteresse,
  primaTappaIncompleta,
  puoAndareA,
  puoAvanzare,
  ripulisci,
  scegliGenere,
  scegliOccasione,
  statoIniziale,
  tappaCompleta,
  vaiAllaTappa,
} from "./stato";

/** Un percorso compilato fino alla tappa indicata. */
function compilato(fino: number) {
  let s = scegliGenere(statoIniziale(), "donna");
  if (fino >= 2) s = scegliOccasione(s, "compleanno");
  if (fino >= 3) for (const id of ["musica", "viaggi", "caffe"]) s = cambiaInteresse(s, id);
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

  it("la terza tappa vuole almeno il minimo di interessi", () => {
    const s = compilato(2);
    const conDue = cambiaInteresse(cambiaInteresse(s, "musica"), "viaggi");
    expect(tappaCompleta(conDue, 3)).toBe(false);
    expect(tappaCompleta(cambiaInteresse(conDue, "caffe"), 3)).toBe(true);
    expect(MIN_INTERESSI).toBe(3);
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

  it("gli interessi si aggiungono, si togliono e si fermano al massimo", () => {
    let s = compilato(2);
    for (const id of ["musica", "viaggi", "caffe", "casa", "fitness"]) s = cambiaInteresse(s, id);
    expect(s.interessi).toHaveLength(MAX_INTERESSI);
    expect(cambiaInteresse(s, "yoga").interessi).toHaveLength(MAX_INTERESSI);
    const senzaMusica = cambiaInteresse(s, "musica");
    expect(senzaMusica.interessi).not.toContain("musica");
    expect(cambiaInteresse(senzaMusica, "yoga").interessi).toContain("yoga");
    expect(cambiaInteresse(s, "non-esiste")).toBe(s);
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
    const sporco = ripulisci({ genere: "alieno", occasione: "ferragosto", interessi: ["musica", "nope", "musica"], tappa: 4 });
    expect(sporco.genere).toBe(null);
    expect(sporco.occasione).toBe(null);
    expect(sporco.interessi).toEqual(["musica"]);
    expect(sporco.tappa).toBe(1);
  });

  it("una tappa troppo avanti torna alla prima incompleta", () => {
    expect(ripulisci({ ...compilato(1), tappa: 4 }).tappa).toBe(2);
  });
});
