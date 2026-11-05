import { describe, expect, it } from "vitest";
import { giornoRoma, istanteRoma } from "@/lib/dominio/date";
import { quotaEffettiva } from "@/lib/dominio/quota";
import { regaloDaScegliere } from "@/lib/dominio/regali";
import { NOME_SEGNAPOSTO, ORE } from "@/lib/dominio/votazione";
import type { ProdottoColletta } from "@/lib/tipi";
import {
  aperturaDaStato,
  conRegaloAlVoto,
  conRegaloScelto,
  erroriPasso,
  intervalloQuote,
  inVotazione,
  leggiStato,
  limitePredefinito,
  MAX_REGALI,
  nuovaColletta,
  occasioneValida,
  oreVotazione,
  personeDivisione,
  primoPassoConErrori,
  quotaDaStato,
  scadenzaDaStato,
  senzaRegalo,
  statoDaColletta,
  statoIniziale,
  testoMetodi,
  type StatoWizard,
} from "./stato";

// 5 novembre 2026, 10:00 a Roma
const ADESSO = istanteRoma({ a: 2026, m: 11, g: 5 }, 10);

const regalo = (nome: string, prezzoCent: number, consegnaGiorni = 1): ProdottoColletta => ({
  prodottoId: nome.toLowerCase(),
  nome,
  prezzoCent,
  consegnaGiorni,
  urlEsterno: `https://example.com/${nome}`,
  immagine: { seme: nome, icona: "viaggio" },
});

const zaino = regalo("Zaino", 16564);
const instax = regalo("Instax", 18982, 2);

/** Uno stato compilato fino al passo 5, con la partenza scelta. */
function compilato(partenza: "adesioni" | "regalo", extra: Partial<StatoWizard> = {}): StatoWizard {
  return {
    ...statoIniziale("org-1"),
    festeggiato: "Mauro",
    occasione: "compleanno",
    dataRegalo: "2026-12-14",
    partenza,
    quotaEuro: partenza === "adesioni" ? "10" : "",
    regali: partenza === "regalo" ? [zaino] : [],
    limiteData: "2026-12-12",
    limiteOra: "20:00",
    paypalAttivo: true,
    paypal: "paypal.me/cri",
    contantiAttivo: true,
    ...extra,
  };
}

describe("wizard: stato di partenza e lavoro salvato", () => {
  it("parte dal passo 1, compleanno, 10 persone, chi organizza partecipa, nessuna sorpresa", () => {
    const s = statoIniziale();
    expect(s).toMatchObject({ passo: 1, uid: null, occasione: "compleanno", chat: 10, partecipo: true, sorpresa: false, partenza: null, limiteOra: "20:00" });
  });

  it("riprende il lavoro di nessuno o della stessa persona, non quello di un altro né di un'altra versione", () => {
    const anonimo = JSON.stringify({ ...statoIniziale(null), festeggiato: "Mauro", passo: 6 });
    expect(leggiStato(anonimo, "org-1")).toMatchObject({ festeggiato: "Mauro", passo: 6, uid: "org-1" });
    const mio = JSON.stringify({ ...statoIniziale("org-1"), festeggiato: "Elena" });
    expect(leggiStato(mio, "org-1")?.festeggiato).toBe("Elena");
    expect(leggiStato(mio, "org-2")).toBeNull();
    expect(leggiStato(JSON.stringify({ passo: 3, festeggiato: "x" }), null)).toBeNull();
    expect(leggiStato("non json", null)).toBeNull();
    expect(leggiStato(null, null)).toBeNull();
  });

  it("accetta solo le dieci occasioni dell'elenco unico", () => {
    expect(occasioneValida("san-valentino")).toBe("san-valentino");
    expect(occasioneValida("compleanno")).toBe("compleanno");
    expect(occasioneValida("condoglianze")).toBeNull();
    expect(occasioneValida(null)).toBeNull();
  });
});

describe("wizard: regali scelti e da votare", () => {
  it("«Scegli questo regalo» sostituisce; «Aggiungi al voto» aggiunge senza doppioni fino a cinque", () => {
    let s = conRegaloScelto(statoIniziale(), zaino);
    expect(s).toMatchObject({ partenza: "regalo", regali: [zaino] });
    expect(inVotazione(s)).toBe(false);
    s = conRegaloAlVoto(s, instax);
    expect(s.regali).toEqual([zaino, instax]);
    expect(inVotazione(s)).toBe(true);
    s = conRegaloAlVoto(s, instax);
    expect(s.regali).toHaveLength(2);
    for (const n of ["A", "B", "C", "D"]) s = conRegaloAlVoto(s, regalo(n, 1000));
    expect(s.regali).toHaveLength(MAX_REGALI);
    s = conRegaloScelto(s, instax);
    expect(s.regali).toEqual([instax]);
  });

  it("«Aggiungi al voto» partendo dalle adesioni riparte dal solo regalo; «Togli» toglie quello indicato", () => {
    const s = conRegaloAlVoto({ ...statoIniziale(), partenza: "adesioni", regali: [zaino] }, instax);
    expect(s).toMatchObject({ partenza: "regalo", regali: [instax] });
    expect(senzaRegalo({ ...s, regali: [zaino, instax] }, 0).regali).toEqual([instax]);
  });
});

describe("wizard: persone e quote", () => {
  it("divide fra le persone della chat, meno chi organizza se non partecipa (D-16)", () => {
    expect(personeDivisione({ chat: 10, partecipo: true })).toBe(10);
    expect(personeDivisione({ chat: 10, partecipo: false })).toBe(9);
    expect(personeDivisione({ chat: 1, partecipo: false })).toBe(1);
  });

  it("prima le adesioni: la quota proposta; con il regalo: il prezzo diviso al centesimo per eccesso", () => {
    expect(quotaDaStato(compilato("adesioni"))).toBe(1000);
    expect(quotaDaStato(compilato("adesioni", { quotaEuro: "" }))).toBeNull();
    expect(quotaDaStato(compilato("regalo"))).toBe(1657);
    expect(quotaDaStato(compilato("regalo", { partecipo: false }))).toBe(1841);
  });

  it("durante il voto la quota non si sa: si mostra la più bassa e la più alta", () => {
    const s = compilato("regalo", { regali: [zaino, instax] });
    expect(quotaDaStato(s)).toBeNull();
    expect(intervalloQuote(s)).toEqual([1657, 1899]);
    expect(intervalloQuote(compilato("regalo"))).toBeNull();
  });
});

describe("wizard: data limite delle adesioni (D-15)", () => {
  it("propone la data del regalo meno consegna e un giorno, alle 20:00, mai prima di oggi", () => {
    expect(limitePredefinito({ dataRegalo: "2026-12-14", partenza: "adesioni", regali: [] }, ADESSO)).toBe("2026-12-12");
    expect(limitePredefinito({ dataRegalo: "2026-12-14", partenza: "regalo", regali: [zaino, instax] }, ADESSO)).toBe("2026-12-11");
    expect(limitePredefinito({ dataRegalo: "2026-11-06", partenza: "adesioni", regali: [] }, ADESSO)).toBe("2026-11-05");
    expect(limitePredefinito({ dataRegalo: "", partenza: null, regali: [] }, ADESSO)).toBe("");
  });

  it("legge data e ora a Roma; senza una delle due non c'è scadenza", () => {
    expect(scadenzaDaStato({ limiteData: "2026-12-12", limiteOra: "20:00" })).toBe(istanteRoma({ a: 2026, m: 12, g: 12 }, 20));
    expect(scadenzaDaStato({ limiteData: "2026-12-12", limiteOra: "21:30" })).toBe(istanteRoma({ a: 2026, m: 12, g: 12 }, 21, 30));
    expect(scadenzaDaStato({ limiteData: "", limiteOra: "20:00" })).toBeNull();
    expect(scadenzaDaStato({ limiteData: "2026-12-12", limiteOra: "25:00" })).toBeNull();
  });

  it("il voto dura un giorno, o meno se la data limite arriva prima, mai sotto un'ora", () => {
    expect(oreVotazione(compilato("regalo"), ADESSO)).toBe(24);
    expect(oreVotazione(compilato("regalo", { limiteData: "2026-11-05", limiteOra: "20:00" }), ADESSO)).toBe(10);
    expect(oreVotazione(compilato("regalo", { limiteData: "2026-11-05", limiteOra: "10:30" }), ADESSO)).toBe(1);
  });
});

describe("wizard: controlli dei passi", () => {
  it("passo 1: il nome e una data da domani in poi", () => {
    const vuoto = erroriPasso(statoIniziale(), 1, ADESSO);
    expect(vuoto.festeggiato).toBe("Scrivi il nome di chi festeggiamo");
    expect(vuoto.dataRegalo).toBeTruthy();
    expect(erroriPasso({ ...compilato("adesioni"), dataRegalo: "2026-11-05" }, 1, ADESSO).dataRegalo).toBe("Scegli una data da domani in poi");
    expect(erroriPasso(compilato("adesioni"), 1, ADESSO)).toEqual({});
  });

  it("passi 2 e 3: la partenza, poi la quota o almeno un regalo", () => {
    expect(erroriPasso(statoIniziale(), 2, ADESSO).partenza).toBeTruthy();
    expect(erroriPasso(compilato("adesioni", { quotaEuro: "zero" }), 3, ADESSO).quotaEuro).toBeTruthy();
    expect(erroriPasso(compilato("regalo", { regali: [] }), 3, ADESSO).regali).toBeTruthy();
    expect(erroriPasso(compilato("regalo"), 3, ADESSO)).toEqual({});
  });

  it("passo 4: almeno due persone e una data limite futura", () => {
    expect(erroriPasso(compilato("adesioni", { chat: 1 }), 4, ADESSO).chat).toBeTruthy();
    expect(erroriPasso(compilato("adesioni", { limiteData: "2026-11-04" }), 4, ADESSO).limite).toBe("La data limite è già passata");
    expect(erroriPasso(compilato("adesioni", { limiteData: "" }), 4, ADESSO).limite).toBeTruthy();
    expect(erroriPasso(compilato("adesioni"), 4, ADESSO)).toEqual({});
  });

  it("passo 5: almeno un metodo, e i dati dei metodi scelti", () => {
    const nessuno = compilato("adesioni", { paypalAttivo: false, contantiAttivo: false });
    expect(erroriPasso(nessuno, 5, ADESSO).metodi).toBeTruthy();
    const e = erroriPasso(compilato("adesioni", { satispayAttivo: true, satispay: "12", bonificoAttivo: true, iban: "IT00", intestatario: "" }), 5, ADESSO);
    expect(Object.keys(e).sort()).toEqual(["iban", "intestatario", "satispay"]);
    expect(erroriPasso(compilato("adesioni"), 5, ADESSO)).toEqual({});
    expect(testoMetodi(compilato("adesioni", { satispayAttivo: true }))).toBe("PayPal, Satispay, contanti");
  });

  it("prima di creare il gruppo trova il primo passo da correggere", () => {
    expect(primoPassoConErrori(compilato("regalo"), 5, ADESSO)).toBeNull();
    expect(primoPassoConErrori(compilato("regalo", { festeggiato: " " }), 5, ADESSO)).toBe(1);
    expect(primoPassoConErrori(compilato("regalo", { contantiAttivo: false, paypalAttivo: false }), 5, ADESSO)).toBe(5);
  });
});

describe("wizard: la colletta che nasce", () => {
  const base = { slug: "abc234defg", uid: "org-1", organizzatoreNome: " Cri ", adesso: ADESSO };

  it("prima le adesioni (F-01): nessun regalo, quota fissa proposta, scadenza scelta (AC-01)", () => {
    const c = nuovaColletta(compilato("adesioni"), base);
    expect(regaloDaScegliere(c.prodotto)).toBe(true);
    expect(c).toMatchObject({
      slug: "abc234defg",
      organizzatoreUid: "org-1",
      organizzatoreNome: "Cri",
      festeggiato: "Mauro",
      modoQuota: "fissa",
      quotaCent: 1000,
      previsti: 10,
      listaAperta: true,
      stato: "bozza",
      totaleConfermatoCent: 0,
      nConfermati: 0,
      votazione: null,
      sorpresa: false,
    });
    expect(c.scadenza).toBe(istanteRoma({ a: 2026, m: 12, g: 12 }, 20));
    expect(giornoRoma(c.dataRegalo)).toEqual({ a: 2026, m: 12, g: 14 });
    expect(quotaEffettiva(c)).toBe(1000);
  });

  it("un regalo (F-02): quota divisa fra le persone, che segue chi aderisce", () => {
    const c = nuovaColletta(compilato("regalo", { partecipo: false }), base);
    expect(c).toMatchObject({ prodotto: zaino, modoQuota: "divisa", previsti: 9, votazione: null });
    expect(quotaEffettiva(c)).toBe(1841);
    expect(quotaEffettiva({ ...c, nAderenti: 12 })).toBe(1381);
  });

  it("più regali (F-03): il segnaposto del voto e una votazione che parte all'apertura", () => {
    const s = compilato("regalo", { regali: [zaino, instax] });
    const c = nuovaColletta(s, base);
    expect(c.prodotto.nome).toBe(NOME_SEGNAPOSTO);
    expect(c.votazione).toMatchObject({ durataOre: 24, consentiProposte: true, apertaIl: null, chiusa: false });
    const apertura = aperturaDaStato(s, ADESSO);
    expect(apertura).toMatchObject({ stato: "aperta", votazione: { apertaIl: ADESSO, scade: ADESSO + 24 * ORE } });
    expect(aperturaDaStato(compilato("adesioni"), ADESSO)).toEqual({ stato: "aperta" });
  });

  it("una bozza del wizard di prima si riapre con le sue risposte", () => {
    const c = nuovaColletta(compilato("regalo", { satispayAttivo: true, satispay: "3470000000" }), base);
    const s = statoDaColletta(c, "org-1");
    expect(s).toMatchObject({
      slug: "abc234defg",
      festeggiato: "Mauro",
      dataRegalo: "2026-12-14",
      partenza: "regalo",
      regali: [zaino],
      chat: 10,
      limiteData: "2026-12-12",
      limiteOra: "20:00",
      satispayAttivo: true,
    });
    expect(statoDaColletta(nuovaColletta(compilato("adesioni", { quotaEuro: "12,50" }), base), "org-1")).toMatchObject({ partenza: "adesioni", quotaEuro: "12,5" });
    const voto = statoDaColletta(nuovaColletta(compilato("regalo", { regali: [zaino, instax] }), base), "org-1", [zaino, instax]);
    expect(voto.regali).toEqual([zaino, instax]);
  });
});
