import { describe, expect, it } from "vitest";
import { ErroreDominio } from "./operazioni";
import {
  caselleDelMese,
  dataAvviso,
  dataNellAnno,
  giorniMancanti,
  meseDopo,
  nuovoIdReminder,
  prossimaData,
  prossimeRicorrenze,
  ricorrenzeDelMese,
  ripulisciElenco,
  testoAnni,
  testoMancano,
  validaReminder,
  type Reminder,
} from "./reminder";

const OGGI = { anno: 2026, mese: 11, giorno: 4 };
const r = (p: Partial<Reminder> = {}): Reminder => ({
  id: "abcdef123456",
  nome: "Giulia",
  tipo: "compleanno",
  giorno: 10,
  mese: 11,
  anno: null,
  preavvisoSettimane: 2,
  nota: "",
  ...p,
});

describe("prossima ricorrenza", () => {
  it("quest'anno se non è ancora passata, oggi compreso", () => {
    expect(prossimaData(r(), OGGI)).toEqual({ anno: 2026, mese: 11, giorno: 10 });
    expect(giorniMancanti(r({ giorno: 4 }), OGGI)).toBe(0);
  });
  it("l'anno dopo se è già passata", () => {
    expect(prossimaData(r({ giorno: 3 }), OGGI)).toEqual({ anno: 2027, mese: 11, giorno: 3 });
    expect(giorniMancanti(r({ giorno: 3 }), OGGI)).toBe(364);
  });
  it("il 29 febbraio negli anni non bisestili cade il 28", () => {
    expect(dataNellAnno({ giorno: 29, mese: 2 }, 2027)).toEqual({ anno: 2027, mese: 2, giorno: 28 });
    expect(dataNellAnno({ giorno: 29, mese: 2 }, 2028)).toEqual({ anno: 2028, mese: 2, giorno: 29 });
  });
  it("l'avviso arriva le settimane di preavviso prima, anche a cavallo d'anno", () => {
    expect(dataAvviso(r(), OGGI)).toEqual({ anno: 2026, mese: 10, giorno: 27 });
    expect(dataAvviso(r({ giorno: 5, mese: 1, preavvisoSettimane: 3 }), OGGI)).toEqual({ anno: 2026, mese: 12, giorno: 15 });
  });
});

describe("testi", () => {
  it("anni compiuti solo se l'anno si sa", () => {
    expect(testoAnni(r({ anno: 1986 }), 2026)).toBe("Compie 40 anni");
    expect(testoAnni(r({ anno: 2025 }), 2026)).toBe("Compie 1 anno");
    expect(testoAnni(r({ tipo: "anniversario", anno: 2016 }), 2026)).toBe("10° anniversario");
    expect(testoAnni(r(), 2026)).toBeNull();
    expect(testoAnni(r({ anno: 2026 }), 2026)).toBeNull();
  });
  it("quanto manca", () => {
    expect(testoMancano(0)).toBe("Oggi!");
    expect(testoMancano(1)).toBe("Domani");
    expect(testoMancano(6)).toBe("Tra 6 giorni");
    expect(testoMancano(21)).toBe("Tra 3 settimane");
    expect(testoMancano(120)).toBe("Tra 4 mesi");
    expect(testoMancano(364)).toBe("Tra un anno");
  });
});

describe("calendario", () => {
  it("novembre 2026 comincia di domenica: sei caselle vuote prima", () => {
    const c = caselleDelMese(2026, 11);
    expect(c.slice(0, 7)).toEqual([null, null, null, null, null, null, 1]);
    expect(c.length % 7).toBe(0);
    expect(c.filter((x) => x !== null)).toHaveLength(30);
  });
  it("mese dopo e mese prima, anche a cavallo d'anno", () => {
    expect(meseDopo(2026, 12, 1)).toEqual({ anno: 2027, mese: 1 });
    expect(meseDopo(2026, 1, -1)).toEqual({ anno: 2025, mese: 12 });
  });
  it("le ricorrenze del mese in ordine di giorno", () => {
    const elenco = [r({ id: "aaaaaa", giorno: 20 }), r({ id: "bbbbbb", giorno: 3, nome: "Marco" }), r({ id: "cccccc", mese: 12 })];
    expect(ricorrenzeDelMese(elenco, 2026, 11).map((x) => x.giorno)).toEqual([3, 20]);
    expect(ricorrenzeDelMese([r({ giorno: 29, mese: 2 })], 2027, 2)[0].giorno).toBe(28);
  });
  it("le prossime, la più vicina per prima", () => {
    const elenco = [r({ id: "aaaaaa", giorno: 3, nome: "Passata" }), r({ id: "bbbbbb", giorno: 25, nome: "Dopo" }), r({ id: "cccccc", nome: "Presto" })];
    expect(prossimeRicorrenze(elenco, OGGI, 2).map((x) => x.reminder.nome)).toEqual(["Presto", "Dopo"]);
  });
});

describe("validazione", () => {
  it("ripulisce nome e nota e tiene i campi giusti", () => {
    const v = validaReminder({ ...r(), nome: "  Zia   Anna ", nota: " cioccolato ", extra: 1 }, OGGI);
    expect(v.nome).toBe("Zia Anna");
    expect(v.nota).toBe("cioccolato");
    expect(v).not.toHaveProperty("extra");
  });
  it("rifiuta date impossibili", () => {
    expect(() => validaReminder(r({ giorno: 31, mese: 4 }), OGGI)).toThrow(ErroreDominio);
    expect(() => validaReminder(r({ mese: 13 }), OGGI)).toThrow(ErroreDominio);
    expect(() => validaReminder(r({ giorno: 29, mese: 2, anno: 2023 }), OGGI)).toThrow(/29/);
    expect(validaReminder(r({ giorno: 29, mese: 2 }), OGGI).giorno).toBe(29);
  });
  it("rifiuta nome vuoto, tipo sconosciuto, anno nel futuro", () => {
    expect(() => validaReminder(r({ nome: "  " }), OGGI)).toThrow(ErroreDominio);
    expect(() => validaReminder({ ...r(), tipo: "boh" }, OGGI)).toThrow(ErroreDominio);
    expect(() => validaReminder(r({ anno: 2027 }), OGGI)).toThrow(ErroreDominio);
  });
  it("anno vuoto vuol dire «non lo so»; preavviso strano torna a 2 settimane", () => {
    expect(validaReminder({ ...r(), anno: "" }, OGGI).anno).toBeNull();
    expect(validaReminder({ ...r(), preavvisoSettimane: 9 }, OGGI).preavvisoSettimane).toBe(2);
  });
  it("un elenco rovinato perde solo le voci rovinate e i doppioni", () => {
    const elenco = ripulisciElenco([r(), { nome: 3 }, r(), r({ id: "zzzzzzzz" })], OGGI);
    expect(elenco.map((x) => x.id)).toEqual(["abcdef123456", "zzzzzzzz"]);
    expect(ripulisciElenco("niente", OGGI)).toEqual([]);
  });
  it("un id nuovo è valido", () => {
    expect(validaReminder(r({ id: nuovoIdReminder() }), OGGI).id).toMatch(/^[a-z0-9]{16}$/);
  });
});
