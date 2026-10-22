import { describe, expect, it } from "vitest";
import { generaCausale } from "./causale";
import { giornoDaIso, giornoInIso, giornoRoma, istanteRoma } from "./date";
import { calcolaImbuto, mediana } from "./imbuto";
import { formattaEuro, leggiEuro } from "./importi";
import { validaIban } from "./iban";
import { payloadEpc } from "./epc";
import { linkPaypal } from "./paypal";
import { calcolaScadenza } from "./scadenza";
import { ALFABETO_SLUG, generaSlug } from "./slug";
import { calcolaChiusura, prospetto, quotaAllaChiusuraAdesioni, quotaEffettiva, quotaProposta } from "./quota";
import { creaInvitati, eseguiOperazione, ErroreDominio, type Contesto, type Operazione } from "./operazioni";
import { collettaDiProva, rigaDiProva } from "./fixture";
import { promemoriaCalendario } from "./promemoria";
import type { Evento } from "../tipi";

describe("importi", () => {
  it("formatta in euro", () => {
    expect(formattaEuro(1000)).toBe("10 €");
    expect(formattaEuro(33)).toBe("0,33 €");
    expect(formattaEuro(11650)).toBe("116,50 €");
  });
  it("legge gli importi digitati", () => {
    expect(leggiEuro("10")).toBe(1000);
    expect(leggiEuro("10,5")).toBe(1050);
    expect(leggiEuro("10.50")).toBe(1050);
    expect(leggiEuro("1.234,50")).toBe(123450);
    expect(leggiEuro("€ 12")).toBe(1200);
    expect(leggiEuro("")).toBeNull();
    expect(leggiEuro("abc")).toBeNull();
    expect(leggiEuro("0")).toBeNull();
    expect(leggiEuro("10,555")).toBeNull();
  });
});

describe("scadenza (10.1)", () => {
  it("è la data del regalo meno consegna e un giorno di margine, alle 20:00 italiane", () => {
    const adesso = istanteRoma({ a: 2026, m: 10, g: 13 }, 10);
    const r = calcolaScadenza({ a: 2026, m: 11, g: 20 }, 3, adesso);
    expect(giornoInIso(r.giornoScadenza)).toBe("2026-11-16");
    expect(r.compatibile).toBe(true);
    // 16 novembre 2026: ora solare (UTC+1) → 20:00 locali = 19:00 UTC
    expect(new Date(r.scadenza).toISOString()).toBe("2026-11-16T19:00:00.000Z");
  });
  it("usa l'ora legale d'estate", () => {
    const r = calcolaScadenza({ a: 2027, m: 7, g: 20 }, 2, istanteRoma({ a: 2027, m: 7, g: 1 }, 9));
    expect(new Date(r.scadenza).toISOString()).toBe("2027-07-17T18:00:00.000Z");
  });
  it("è incompatibile se cade oggi o nel passato e propone oggi + consegna + 2", () => {
    const adesso = istanteRoma({ a: 2026, m: 10, g: 13 }, 10);
    const r = calcolaScadenza({ a: 2026, m: 10, g: 17 }, 3, adesso); // scadenza 13 ottobre = oggi
    expect(r.compatibile).toBe(false);
    expect(giornoInIso(r.primaDataPossibile)).toBe("2026-10-18");
    const proposta = calcolaScadenza(r.primaDataPossibile, 3, adesso);
    expect(proposta.compatibile).toBe(true);
  });
  it("legge e scrive le date ISO", () => {
    expect(giornoDaIso("2026-02-30")).toBeNull();
    expect(giornoDaIso("2026-02-28")).toEqual({ a: 2026, m: 2, g: 28 });
    expect(giornoRoma(Date.UTC(2026, 9, 13, 22, 30))).toEqual({ a: 2026, m: 10, g: 14 });
  });
});

describe("slug (10.2)", () => {
  it("ha 10 caratteri dall'alfabeto senza ambiguità", () => {
    for (let i = 0; i < 200; i++) {
      const s = generaSlug();
      expect(s).toHaveLength(10);
      for (const ch of s) expect(ALFABETO_SLUG).toContain(ch);
    }
    expect(ALFABETO_SLUG).not.toMatch(/[01ilo]/);
  });
  it("non ripete valori", () => {
    const visti = new Set(Array.from({ length: 500 }, () => generaSlug()));
    expect(visti.size).toBe(500);
  });
});

describe("quota (10.3)", () => {
  it("propone ceil(prezzo / previsti) arrotondata all'euro", () => {
    expect(quotaProposta(11600, 12)).toBe(1000);
    expect(quotaProposta(8900, 4)).toBe(2300);
  });
  it("in modalità divisa si ricalcola a ogni adesione, finché non è congelata", () => {
    const c = collettaDiProva({ modoQuota: "divisa", previsti: 4, quotaCent: 2900, prodotto: { ...collettaDiProva().prodotto, prezzoCent: 11600 } });
    expect(quotaEffettiva({ ...c, nAderenti: 0 })).toBe(2900);
    expect(quotaEffettiva({ ...c, nAderenti: 5 })).toBe(2320);
    expect(quotaEffettiva({ ...c, nAderenti: 8 })).toBe(1450);
  });
  it("dopo il congelamento la quota non cambia più al variare degli aderenti", () => {
    const c = collettaDiProva({ modoQuota: "divisa", previsti: 4, quotaCent: 2900, quotaCongelata: true });
    for (const n of [1, 4, 8, 20]) expect(quotaEffettiva({ ...c, nAderenti: n })).toBe(2900);
  });
  it("chiudendo le adesioni la quota divisa si ferma su chi ha aderito", () => {
    const c = collettaDiProva({ modoQuota: "divisa", previsti: 12, nAderenti: 8 });
    expect(quotaAllaChiusuraAdesioni(c)).toBe(1450);
  });
  it("il prospetto del wizard mostra quota, totale e avanzo", () => {
    const p = prospetto({ modoQuota: "fissa", prezzoCent: 11600, previsti: 12, quotaFissaCent: 1000 });
    expect(p).toEqual({ quotaCent: 1000, totalePrevistoCent: 12000, differenzaCent: 400 });
  });
});

describe("avanzo (criterio 12)", () => {
  it("12 quote da 10 € e una spesa di 116 € → 4 € di avanzo, 0,33 € a testa", () => {
    const r = calcolaChiusura(12 * 1000, 11600, 12);
    expect(r.avanzoCent).toBe(400);
    expect(r.restituzioneACapoCent).toBe(33);
  });
  it("senza avanzo non c'è nulla da restituire", () => {
    expect(calcolaChiusura(10000, 11600, 10)).toEqual({ avanzoCent: -1600, restituzioneACapoCent: 0 });
  });
});

describe("causale (10.4)", () => {
  it("è FESTEGGIATO-NOME in maiuscole, senza accenti", () => {
    expect(generaCausale("Giulia", "Marco", [])).toBe("GIULIA-MARCO");
    expect(generaCausale("Jérôme", "Ànna-Maria", [])).toBe("JEROME-ANNAMARIA");
    expect(generaCausale("Costantinopoli", "Bartolomeo Alessandro", [])).toBe("COSTANTINO-BARTOLOMEO");
  });
  it("due omonimi nella stessa colletta ricevono causali diverse", () => {
    const prima = generaCausale("Giulia", "Marco", []);
    const seconda = generaCausale("Giulia", "Marco", [prima]);
    const terza = generaCausale("Giulia", "Marco", [prima, seconda]);
    expect(new Set([prima, seconda, terza]).size).toBe(3);
    expect(seconda).toBe("GIULIA-MARCO2");
  });
});

describe("iban", () => {
  it("accetta IBAN corretti e rifiuta checksum e lunghezze sbagliate", () => {
    expect(validaIban("IT60 X054 2811 1010 0000 0123 456").valido).toBe(true);
    expect(validaIban("DE89370400440532013000").valido).toBe(true);
    expect(validaIban("IT60X0542811101000000123457").valido).toBe(false);
    expect(validaIban("IT60X05428111010000001234").valido).toBe(false);
    expect(validaIban("ZZ60X0542811101000000123456").valido).toBe(false);
    expect(validaIban("").valido).toBe(false);
  });
});

describe("pagamenti", () => {
  it("costruisce il link PayPal con importo e il ripiego senza", () => {
    expect(linkPaypal("@marco", 1000)).toEqual({ conImporto: "https://paypal.me/marco/10EUR", profilo: "https://paypal.me/marco" });
    expect(linkPaypal("https://www.paypal.me/marco.rossi/5", 1050)?.conImporto).toBe("https://paypal.me/marco.rossi/10.50EUR");
    expect(linkPaypal("marco", null)?.conImporto).toBeNull();
    expect(linkPaypal("non valido!!", 1000)).toBeNull();
  });
  it("costruisce il payload EPC", () => {
    const righe = payloadEpc({ iban: "IT60 X054 2811 1010 0000 0123 456", intestatario: "Marco Rossi", importoCent: 1050, causale: "GIULIA-ANNA" }).split("\n");
    expect(righe[0]).toBe("BCD");
    expect(righe[3]).toBe("SCT");
    expect(righe[5]).toBe("Marco Rossi");
    expect(righe[6]).toBe("IT60X0542811101000000123456");
    expect(righe[7]).toBe("EUR10.50");
    expect(righe[10]).toBe("GIULIA-ANNA");
  });
});

function ctx(op: Operazione, extra: Partial<Contesto> = {}): { op: Operazione; ctx: Contesto } {
  return {
    op,
    ctx: {
      colletta: collettaDiProva(),
      pid: "u1",
      riga: null,
      causaliAltre: [],
      uid: "u1",
      ora: 1_000,
      ...extra,
    },
  };
}
const esegui = (op: Operazione, extra: Partial<Contesto> = {}) => {
  const x = ctx(op, extra);
  return eseguiOperazione(x.op, x.ctx);
};

describe("stati del partecipante (10.6)", () => {
  it("l'adesione crea la riga con causale e aggiorna i totali", () => {
    const r = esegui({ tipo: "aderisci", nome: "  Anna  Bianchi " });
    const riga = r.righe[0].valore!;
    expect(riga).toMatchObject({ nome: "Anna Bianchi", stato: "aderito", uidAnonimo: "u1", causale: "GIULIA-ANNABIANCH" });
    expect(r.colletta).toMatchObject({ nAttesi: 1, nAderenti: 1, nConfermati: 0, totaleConfermatoCent: 0 });
    expect(r.eventi[0].tipo).toBe("adesione");
  });

  it("aderire due volte non duplica", () => {
    const riga = rigaDiProva();
    const r = esegui({ tipo: "aderisci", nome: "Anna" }, { riga, colletta: collettaDiProva({ nAttesi: 1, nAderenti: 1 }) });
    expect(r.righe).toHaveLength(0);
  });

  it("con la lista chiusa si aderisce solo rivendicando un nome dell'elenco", () => {
    const colletta = collettaDiProva({ listaAperta: false });
    expect(() => esegui({ tipo: "aderisci", nome: "Nuovo" }, { colletta })).toThrow(ErroreDominio);
    const invitato = rigaDiProva({ id: "r1", stato: "invitato", uidAnonimo: null });
    const r = esegui({ tipo: "aderisci", nome: "Anna", rivendica: "r1" }, { colletta: { ...colletta, nAttesi: 1 }, pid: "r1", riga: invitato });
    expect(r.righe[0].valore).toMatchObject({ id: "r1", uidAnonimo: "u1", stato: "aderito" });
    expect(r.colletta.nAderenti).toBe(1);
    expect(r.colletta.nAttesi).toBe(1);
  });

  it("dichiarare non muove i totali confermati", () => {
    const colletta = collettaDiProva({ nAttesi: 1, nAderenti: 1 });
    const r = esegui({ tipo: "dichiara", metodo: "paypal" }, { colletta, riga: rigaDiProva() });
    expect(r.righe[0].valore).toMatchObject({ stato: "dichiarato", metodo: "paypal", dichiaratoIl: 1_000 });
    expect(r.colletta.totaleConfermatoCent).toBe(0);
    expect(r.colletta.nConfermati).toBe(0);
  });

  it("una seconda dichiarazione aggiorna e non duplica né ripete l'evento", () => {
    const colletta = collettaDiProva({ nAttesi: 1, nAderenti: 1 });
    const riga = rigaDiProva({ stato: "dichiarato", metodo: "paypal", dichiaratoIl: 500 });
    const r = esegui({ tipo: "dichiara", metodo: "satispay" }, { colletta, riga });
    expect(r.righe[0].valore).toMatchObject({ metodo: "satispay", dichiaratoIl: 500 });
    expect(r.eventi).toHaveLength(0);
  });

  it("i contanti non si dichiarano: li registra l'organizzatore", () => {
    expect(() => esegui({ tipo: "dichiara", metodo: "contanti" }, { riga: rigaDiProva() })).toThrow(ErroreDominio);
  });

  it("il partecipante non può confermarsi", () => {
    const riga = rigaDiProva({ stato: "dichiarato", metodo: "paypal" });
    expect(() => esegui({ tipo: "conferma" }, { riga })).toThrow(/organizza/);
  });

  it("non si può toccare la riga di un altro", () => {
    const riga = rigaDiProva({ uidAnonimo: "altro" });
    expect(() => esegui({ tipo: "dichiara", metodo: "paypal" }, { riga })).toThrow(ErroreDominio);
  });

  it("la conferma dell'organizzatore fa salire il totale della quota esatta", () => {
    const colletta = collettaDiProva({ nAttesi: 1, nAderenti: 1 });
    const riga = rigaDiProva({ stato: "dichiarato", metodo: "paypal", dichiaratoIl: 500 });
    const r = esegui({ tipo: "conferma" }, { colletta, riga, uid: "org" });
    expect(r.righe[0].valore).toMatchObject({ stato: "confermato", importoCent: 1000, confermatoIl: 1_000 });
    expect(r.colletta).toMatchObject({ totaleConfermatoCent: 1000, nConfermati: 1, quotaCongelata: true });
  });

  it("la conferma con importo diverso usa quello reale", () => {
    const colletta = collettaDiProva({ nAttesi: 1, nAderenti: 1 });
    const riga = rigaDiProva({ stato: "dichiarato", metodo: "paypal" });
    const r = esegui({ tipo: "conferma", importoCent: 1500 }, { colletta, riga, uid: "org" });
    expect(r.colletta.totaleConfermatoCent).toBe(1500);
  });

  it("la prima conferma congela la quota divisa al valore visto fino a quel momento", () => {
    const colletta = collettaDiProva({ modoQuota: "divisa", previsti: 4, quotaCent: 2900, nAttesi: 5, nAderenti: 5 });
    const riga = rigaDiProva({ stato: "dichiarato", metodo: "paypal" });
    const r = esegui({ tipo: "conferma" }, { colletta, riga, uid: "org" });
    expect(r.colletta.quotaCongelata).toBe(true);
    expect(r.colletta.quotaCent).toBe(2320);
    expect(r.righe[0].valore?.importoCent).toBe(2320);
  });

  it("«Non l'ho trovato» riporta ad aderito e il totale non cambia", () => {
    const colletta = collettaDiProva({ nAttesi: 1, nAderenti: 1, totaleConfermatoCent: 3000, nConfermati: 3 });
    const riga = rigaDiProva({ stato: "dichiarato", metodo: "paypal" });
    const r = esegui({ tipo: "nonTrovato" }, { colletta, riga, uid: "org" });
    expect(r.righe[0].valore).toMatchObject({ stato: "aderito", dichiaratoIl: null, nota: "Pagamento non trovato" });
    expect(r.colletta.totaleConfermatoCent).toBe(3000);
    expect(r.colletta.nConfermati).toBe(3);
  });

  it("i contanti: aderito → l'organizzatore registra → confermato", () => {
    const colletta = collettaDiProva({ nAttesi: 1, nAderenti: 1 });
    const riga = rigaDiProva({ metodo: "contanti" });
    const r = esegui({ tipo: "conferma" }, { colletta, riga, uid: "org" });
    expect(r.righe[0].valore?.stato).toBe("confermato");
    expect(r.colletta.totaleConfermatoCent).toBe(1000);
  });

  it("la rinuncia di un confermato toglie la sua quota dal totale", () => {
    const colletta = collettaDiProva({ nAttesi: 1, nAderenti: 1, nConfermati: 1, totaleConfermatoCent: 1000, quotaCongelata: true });
    const riga = rigaDiProva({ stato: "confermato", importoCent: 1000, metodo: "paypal" });
    const r = esegui({ tipo: "segnaRinuncia" }, { colletta, riga, uid: "org" });
    expect(r.colletta).toMatchObject({ totaleConfermatoCent: 0, nConfermati: 0, nAttesi: 0, nAderenti: 0 });
  });

  it("chi organizza può aggiungere nomi alla lista, con causali distinte", () => {
    let n = 0;
    const r = creaInvitati(collettaDiProva(), ["Marco", "Marco", "  ", "Luca"], [], 1, () => `id${++n}`);
    expect(r.righe.map((x) => x.valore?.causale)).toEqual(["GIULIA-MARCO", "GIULIA-MARCO2", "GIULIA-LUCA"]);
    expect(r.colletta.nAttesi).toBe(3);
    expect(r.righe.every((x) => x.valore?.stato === "invitato")).toBe(true);
  });

  it("il messaggio del biglietto è facoltativo e al massimo di 240 caratteri", () => {
    const riga = rigaDiProva({ stato: "dichiarato" });
    const r = esegui({ tipo: "messaggio", testo: "x".repeat(400) }, { riga });
    expect(r.righe[0].valore?.messaggio).toHaveLength(240);
    const vuoto = esegui({ tipo: "messaggio", testo: "  " }, { riga });
    expect(vuoto.righe[0].valore?.messaggio).toBeNull();
  });

  it("«Non partecipo» senza nome registra solo l'evento", () => {
    const r = esegui({ tipo: "rinuncia" });
    expect(r.righe).toHaveLength(0);
    expect(r.eventi[0].tipo).toBe("rinuncia");
  });

  it("una colletta chiusa non accetta più adesioni", () => {
    expect(() => esegui({ tipo: "aderisci", nome: "Anna" }, { colletta: collettaDiProva({ stato: "chiusa" }) })).toThrow(ErroreDominio);
  });
});

describe("promemoria (12)", () => {
  it("non propone oltre quattro messaggi per persona e non nomina chi ha pagato", () => {
    const c = collettaDiProva({ listaAperta: false });
    const righe = [
      rigaDiProva({ id: "a", stato: "invitato", solleciti: 4, uidAnonimo: null }),
      rigaDiProva({ id: "b", stato: "invitato", solleciti: 1, uidAnonimo: null }),
      rigaDiProva({ id: "c", stato: "confermato", nome: "Paola" }),
    ];
    const p = promemoriaCalendario(c, righe, "https://x.it/c/abc", c.creatoIl);
    expect(p[0].pidDestinatari).toEqual(["b"]);
    for (const m of p) {
      expect(m.testo).toContain("https://x.it/c/abc");
      expect(m.testo).not.toMatch(/Paola|unico|ultimo/i);
    }
  });
});

describe("imbuto (13)", () => {
  const ev = (tipo: Evento["tipo"], uid: string, ts: number, meta: Evento["meta"] = {}): Evento => ({
    id: `${tipo}${uid}${ts}`,
    tipo,
    uidAnonimo: uid,
    partecipanteId: uid,
    ts,
    meta,
  });
  it("conta persone distinte, percentuali, mediane e dichiarazioni spontanee", () => {
    const eventi: Evento[] = [
      ev("apertura", "a", 0), ev("apertura", "a", 50), ev("apertura", "b", 0), ev("apertura", "c", 0), ev("apertura", "d", 0),
      ev("adesione", "a", 10_000), ev("adesione", "b", 20_000), ev("adesione", "c", 30_000),
      ev("metodo_scelto", "a", 40_000, { metodo: "paypal" }), ev("metodo_scelto", "b", 50_000, { metodo: "bonifico" }),
      ev("dichiarazione", "a", 100_000), ev("dichiarazione", "b", 300_000),
      ev("sollecito_preparato", "", 200_000),
      ev("messaggio", "a", 130_000),
    ];
    const i = calcolaImbuto(eventi);
    expect(i.passi.map((p) => p.numero)).toEqual([4, 3, 2, 2, 1]);
    expect(i.passi[1].percentuale).toBe(75);
    expect(i.passi[2].medianaMs).toBe(30_000);
    expect(i.passi[3].medianaMs).toBe(155_000);
    expect(i.dichiarazioniTotali).toBe(2);
    expect(i.dichiarazioniSpontanee).toBe(1);
    expect(i.metodi).toHaveLength(2);
    expect(mediana([])).toBeNull();
  });
});
