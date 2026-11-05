import { describe, expect, it } from "vitest";
import { giornoRoma, istanteRoma } from "@/lib/dominio/date";
import { quotaEffettiva } from "@/lib/dominio/quota";
import { regaloDaScegliere } from "@/lib/dominio/regali";
import { NOME_SEGNAPOSTO, ORE } from "@/lib/dominio/votazione";
import type { ProdottoColletta } from "@/lib/tipi";
import {
  aperturaDaStato,
  bozzaDaRiprendere,
  budgetPrevisto,
  conMetodi,
  conRegaloAlVoto,
  conRegaloScelto,
  erroriPasso,
  fineVoto,
  fineVotoDaStato,
  inVotazione,
  leggiStato,
  limite,
  MAX_REGALI,
  metodiDaStato,
  nuovaColletta,
  occasioneValida,
  passoDopo,
  passoPrima,
  personeDivisione,
  posizione,
  primoPassoConErrori,
  quotaDaStato,
  scadenzaDaStato,
  senzaMetodi,
  senzaRegalo,
  sequenza,
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
function compilato(partenza: "adesioni" | "regalo" | "voto", extra: Partial<StatoWizard> = {}): StatoWizard {
  return {
    ...statoIniziale("org-1"),
    festeggiato: "Mauro",
    occasione: "compleanno",
    dataRegalo: "2026-12-14",
    partenza,
    regali: partenza === "regalo" ? [zaino] : partenza === "voto" ? [zaino, instax] : [],
    paypalAttivo: true,
    paypal: "paypal.me/cri",
    contantiAttivo: true,
    ...extra,
  };
}

describe("procedura: stato di partenza e bozza", () => {
  it("parte dal passo 1, compleanno, 10 persone, 10 € proposti, chi organizza partecipa (D-16), nessuna sorpresa", () => {
    const s = statoIniziale();
    expect(s).toMatchObject({ passo: 1, uid: null, occasione: "compleanno", chat: 10, quotaEuro: "10", partecipo: true, sorpresa: false, partenza: null, daProdotto: false });
  });

  it("riprende la bozza di nessuno o della stessa persona, non quella di un altro né di un'altra versione", () => {
    const anonima = JSON.stringify({ ...statoIniziale(null), festeggiato: "Mauro", passo: 6 });
    expect(leggiStato(anonima, "org-1")).toMatchObject({ festeggiato: "Mauro", passo: 6, uid: "org-1" });
    const mia = JSON.stringify({ ...statoIniziale("org-1"), festeggiato: "Elena" });
    expect(leggiStato(mia, "org-1")?.festeggiato).toBe("Elena");
    expect(leggiStato(mia, "org-2")).toBeNull();
    expect(leggiStato(JSON.stringify({ versione: 2, passo: 3, festeggiato: "x" }), null)).toBeNull();
    expect(leggiStato("non json", null)).toBeNull();
    expect(leggiStato(null, null)).toBeNull();
    expect(leggiStato(JSON.stringify({ ...statoIniziale(), passo: 9 }), null)?.passo).toBe(1);
  });

  it("«Riprendi il regalo per…» solo se c'è il nome di chi si festeggia", () => {
    expect(bozzaDaRiprendere(null)).toBe(false);
    expect(bozzaDaRiprendere(statoIniziale())).toBe(false);
    expect(bozzaDaRiprendere({ ...statoIniziale(), festeggiato: "Mauro" })).toBe(true);
  });

  it("accetta solo le dieci occasioni dell'elenco unico", () => {
    expect(occasioneValida("san-valentino")).toBe("san-valentino");
    expect(occasioneValida("condoglianze")).toBeNull();
    expect(occasioneValida(null)).toBeNull();
  });
});

describe("procedura: ordine dei passi", () => {
  it("sei passi; dal prodotto quattro, senza «da dove vuoi iniziare» né la scelta del regalo", () => {
    expect(sequenza({ daProdotto: false })).toEqual([1, 2, 3, 4, 5, 6]);
    expect(sequenza({ daProdotto: true })).toEqual([1, 2, 5, 6]);
    expect(posizione({ daProdotto: false, passo: 3 })).toEqual({ n: 3, totale: 6 });
    expect(posizione({ daProdotto: true, passo: 5 })).toEqual({ n: 3, totale: 4 });
    expect(passoDopo({ daProdotto: true, passo: 2 })).toBe(5);
    expect(passoPrima({ daProdotto: true, passo: 5 })).toBe(2);
    expect(passoPrima({ daProdotto: false, passo: 1 })).toBeNull();
    expect(passoDopo({ daProdotto: false, passo: 6 })).toBe(6);
  });
});

describe("procedura: regali scelti e da votare", () => {
  it("«Scegli questo regalo» sostituisce; «Aggiungi al regalo» aggiunge senza doppioni fino a cinque", () => {
    let s = conRegaloScelto(statoIniziale(), zaino);
    expect(s).toMatchObject({ partenza: "regalo", regali: [zaino] });
    s = conRegaloAlVoto(s, instax);
    expect(s).toMatchObject({ partenza: "voto", regali: [instax] });
    expect(inVotazione(s)).toBe(false);
    s = conRegaloAlVoto(s, zaino);
    expect(inVotazione(s)).toBe(true);
    s = conRegaloAlVoto(s, zaino);
    expect(s.regali).toHaveLength(2);
    for (const n of ["A", "B", "C", "D"]) s = conRegaloAlVoto(s, regalo(n, 1000));
    expect(s.regali).toHaveLength(MAX_REGALI);
    expect(senzaRegalo(s, 0).regali[0]).toEqual(zaino);
  });
});

describe("procedura: persone e quote", () => {
  it("divide fra le persone della chat, meno chi organizza se non partecipa (D-16)", () => {
    expect(personeDivisione({ chat: 10, partecipo: true })).toBe(10);
    expect(personeDivisione({ chat: 10, partecipo: false })).toBe(9);
    expect(personeDivisione({ chat: 1, partecipo: false })).toBe(1);
  });

  it("prima le adesioni: la quota proposta e il budget previsto; con il regalo il prezzo diviso; con il voto non si sa", () => {
    expect(quotaDaStato(compilato("adesioni"))).toBe(1000);
    expect(budgetPrevisto(compilato("adesioni"))).toBe(10000);
    expect(budgetPrevisto(compilato("adesioni", { partecipo: false }))).toBe(9000);
    expect(quotaDaStato(compilato("adesioni", { quotaEuro: "" }))).toBeNull();
    expect(quotaDaStato(compilato("regalo"))).toBe(1657);
    expect(quotaDaStato(compilato("regalo", { partecipo: false }))).toBe(1841);
    expect(quotaDaStato(compilato("voto"))).toBeNull();
  });
});

describe("procedura: data limite e fine della votazione", () => {
  it("la data limite proposta è il giorno prima della festa alle 20:00, mai prima di oggi; si cambia nel riepilogo", () => {
    expect(limite({ dataRegalo: "2026-12-14", limiteData: "", limiteOra: "" }, ADESSO)).toEqual({ data: "2026-12-13", ora: "20:00" });
    expect(limite({ dataRegalo: "2026-11-06", limiteData: "", limiteOra: "" }, ADESSO)).toEqual({ data: "2026-11-05", ora: "20:00" });
    expect(limite({ dataRegalo: "2026-12-14", limiteData: "2026-12-10", limiteOra: "18:30" }, ADESSO)).toEqual({ data: "2026-12-10", ora: "18:30" });
    expect(scadenzaDaStato({ dataRegalo: "2026-12-14", limiteData: "", limiteOra: "" }, ADESSO)).toBe(istanteRoma({ a: 2026, m: 12, g: 13 }, 20));
    expect(scadenzaDaStato({ dataRegalo: "", limiteData: "", limiteOra: "" }, ADESSO)).toBeNull();
  });

  it("la votazione finisce fra quattro giorni alle 20:00, ma non dopo la data limite; si sceglie data e ora", () => {
    expect(fineVoto(compilato("voto"), ADESSO)).toEqual({ data: "2026-11-09", ora: "20:00" });
    expect(fineVoto(compilato("voto", { dataRegalo: "2026-11-07" }), ADESSO)).toEqual({ data: "2026-11-06", ora: "20:00" });
    expect(fineVotoDaStato(compilato("voto", { fineVotoData: "2026-11-08", fineVotoOra: "12:15" }), ADESSO)).toBe(istanteRoma({ a: 2026, m: 11, g: 8 }, 12, 15));
  });
});

describe("procedura: controlli dei passi", () => {
  it("passo 1: il nome e una data da domani in poi", () => {
    const vuoto = erroriPasso(statoIniziale(), 1, ADESSO);
    expect(vuoto.festeggiato).toBe("Scrivi il nome di chi festeggiate");
    expect(vuoto.dataRegalo).toBeTruthy();
    expect(erroriPasso({ ...compilato("adesioni"), dataRegalo: "2026-11-05" }, 1, ADESSO).dataRegalo).toBe("Scegli una data da domani in poi");
    expect(erroriPasso(compilato("adesioni"), 1, ADESSO)).toEqual({});
  });

  it("passo 2: almeno due persone; dal prodotto serve il regalo", () => {
    expect(erroriPasso(compilato("adesioni", { chat: 1 }), 2, ADESSO).chat).toBeTruthy();
    expect(erroriPasso(compilato("regalo", { daProdotto: true, regali: [] }), 2, ADESSO).regali).toBeTruthy();
    expect(erroriPasso(compilato("regalo", { daProdotto: true }), 2, ADESSO)).toEqual({});
  });

  it("passo 4: la quota, il regalo, o da due regali in su con una fine del voto futura ed entro la data limite", () => {
    expect(erroriPasso(compilato("adesioni", { quotaEuro: "zero" }), 4, ADESSO).quotaEuro).toBeTruthy();
    expect(erroriPasso(compilato("regalo", { regali: [] }), 4, ADESSO).regali).toBeTruthy();
    expect(erroriPasso(compilato("voto", { regali: [zaino] }), 4, ADESSO).regali).toBe("Scegli almeno due regali da votare");
    expect(erroriPasso(compilato("voto", { fineVotoData: "2026-11-04", fineVotoOra: "20:00" }), 4, ADESSO).fineVoto).toBe("La fine della votazione è già passata");
    expect(erroriPasso(compilato("voto", { fineVotoData: "2026-12-13", fineVotoOra: "21:00" }), 4, ADESSO).fineVoto).toBe("La votazione deve finire entro la data limite delle adesioni");
    expect(erroriPasso(compilato("voto"), 4, ADESSO)).toEqual({});
    expect(erroriPasso(compilato("adesioni"), 4, ADESSO)).toEqual({});
  });

  it("passo 5: almeno un metodo, e i dati dei metodi scelti", () => {
    const nessuno = compilato("adesioni", { paypalAttivo: false, contantiAttivo: false });
    expect(senzaMetodi(nessuno)).toBe(true);
    expect(erroriPasso(nessuno, 5, ADESSO).metodi).toBeTruthy();
    const e = erroriPasso(compilato("adesioni", { satispayAttivo: true, satispay: "12", bonificoAttivo: true, iban: "IT00", intestatario: "" }), 5, ADESSO);
    expect(Object.keys(e).sort()).toEqual(["iban", "intestatario", "satispay"]);
    expect(erroriPasso(compilato("adesioni"), 5, ADESSO)).toEqual({});
    expect(testoMetodi(compilato("adesioni", { satispayAttivo: true }))).toBe("PayPal, Satispay, contanti");
  });

  it("passo 6: la data limite delle adesioni non è passata", () => {
    expect(erroriPasso(compilato("adesioni", { limiteData: "2026-11-04", limiteOra: "20:00" }), 6, ADESSO).limite).toBe("La data limite è già passata");
    expect(erroriPasso(compilato("adesioni"), 6, ADESSO)).toEqual({});
  });

  it("prima di creare il gruppo trova il primo passo da correggere, nel percorso giusto", () => {
    expect(primoPassoConErrori(compilato("regalo"), ADESSO)).toBeNull();
    expect(primoPassoConErrori(compilato("regalo", { festeggiato: " " }), ADESSO)).toBe(1);
    expect(primoPassoConErrori(compilato("regalo", { contantiAttivo: false, paypalAttivo: false }), ADESSO)).toBe(5);
    expect(primoPassoConErrori(compilato("voto", { regali: [zaino] }), ADESSO)).toBe(4);
    // dal prodotto il passo 4 non c'è: il regalo si controlla al passo 2
    expect(primoPassoConErrori(compilato("regalo", { daProdotto: true, regali: [] }), ADESSO)).toBe(2);
  });
});

describe("procedura: i metodi dell'ultima volta", () => {
  it("ritrova i metodi di una colletta di prima come campi del modulo", () => {
    const m = metodiDaStato(compilato("adesioni", { satispayAttivo: true, satispay: "3470000000" }));
    const s = conMetodi(statoIniziale(), m);
    expect(s).toMatchObject({ paypalAttivo: true, paypal: "paypal.me/cri", satispayAttivo: true, satispay: "3470000000", contantiAttivo: true, bonificoAttivo: false });
  });
});

describe("procedura: la colletta che nasce", () => {
  const base = { slug: "abc234defg", uid: "org-1", organizzatoreNome: " Cri ", adesso: ADESSO };

  it("prima le adesioni (F-01): nessun regalo, quota fissa proposta, scadenza il giorno prima della festa alle 20 (AC-01)", () => {
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
      votazione: null,
      sorpresa: false,
    });
    expect(c.scadenza).toBe(istanteRoma({ a: 2026, m: 12, g: 13 }, 20));
    expect(giornoRoma(c.dataRegalo)).toEqual({ a: 2026, m: 12, g: 14 });
    expect(quotaEffettiva(c)).toBe(1000);
  });

  it("un regalo (F-02): quota divisa fra le persone, che segue chi aderisce", () => {
    const c = nuovaColletta(compilato("regalo", { partecipo: false }), base);
    expect(c).toMatchObject({ prodotto: zaino, modoQuota: "divisa", previsti: 9, votazione: null });
    expect(quotaEffettiva(c)).toBe(1841);
    expect(quotaEffettiva({ ...c, nAderenti: 12 })).toBe(1381);
  });

  it("votiamo il regalo (F-03): il segnaposto e una votazione che finisce alla data e all'ora scelte", () => {
    const s = compilato("voto", { fineVotoData: "2026-11-08", fineVotoOra: "18:00" });
    const c = nuovaColletta(s, base);
    expect(c.prodotto.nome).toBe(NOME_SEGNAPOSTO);
    expect(c.votazione).toMatchObject({ consentiProposte: true, apertaIl: null, chiusa: false });
    const scade = istanteRoma({ a: 2026, m: 11, g: 8 }, 18);
    const apertura = aperturaDaStato(s, ADESSO);
    expect(apertura).toMatchObject({ stato: "aperta", votazione: { apertaIl: ADESSO, scade, durataOre: Math.round((scade - ADESSO) / ORE) } });
    expect(aperturaDaStato(compilato("adesioni"), ADESSO)).toEqual({ stato: "aperta" });
  });

  it("una bozza del wizard di prima si riapre con le sue risposte", () => {
    const c = nuovaColletta(compilato("regalo", { satispayAttivo: true, satispay: "3470000000" }), base);
    expect(statoDaColletta(c, "org-1")).toMatchObject({
      slug: "abc234defg",
      festeggiato: "Mauro",
      dataRegalo: "2026-12-14",
      partenza: "regalo",
      regali: [zaino],
      chat: 10,
      limiteData: "2026-12-13",
      limiteOra: "20:00",
      satispayAttivo: true,
    });
    expect(statoDaColletta(nuovaColletta(compilato("adesioni", { quotaEuro: "12,50" }), base), "org-1")).toMatchObject({ partenza: "adesioni", quotaEuro: "12,5" });
    const voto = statoDaColletta(nuovaColletta(compilato("voto"), base), "org-1", [zaino, instax]);
    expect(voto).toMatchObject({ partenza: "voto", regali: [zaino, instax] });
  });
});
