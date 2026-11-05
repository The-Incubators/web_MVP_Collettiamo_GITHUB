import { describe, expect, it } from "vitest";
import { collettaDiProva, rigaDiProva } from "./fixture";
import { aperturaVoto, consegna, iscritti, registro, ricevutoDopoPagamento, statoRegalo, totali } from "./gruppo";
import { creaInvitati, ErroreDominio, eseguiOperazione } from "./operazioni";
import { REGALO_DA_SCEGLIERE } from "./regali";
import { votazioneIniziale } from "./votazione";
import type { Partecipante } from "../tipi";

const ORA = Date.UTC(2026, 11, 14, 10);
const r = (id: string, nome: string, extra: Partial<Partecipante> = {}, t = 0) => rigaDiProva({ id, nome, uidAnonimo: id, creatoIl: t, ...extra });

describe("registro di chi organizza", () => {
  const c = collettaDiProva({ quotaCent: 1000, previsti: 10 });
  const righe = [
    r("cri", "Cri", { stato: "confermato", importoCent: 1000 }, 1),
    r("marco", "Marco", { stato: "dichiarato", importoCent: 1000 }, 2),
    r("giulia", "Giulia", {}, 3),
    r("paolo", "Paolo", { uidAnonimo: null, stato: "confermato", importoCent: 500 }, 4),
    r("nadia", "Nadia", { stato: "rinunciato" }, 5),
  ];

  it("una riga per persona in divisione, nell'ordine di arrivo, senza chi ha rinunciato", () => {
    expect(registro(c, righe).map((x) => x.riga.nome)).toEqual(["Cri", "Marco", "Giulia", "Paolo"]);
  });
  it("quota, dichiarato, ricevuto e saldo come nel prototipo", () => {
    const reg = registro(c, righe);
    expect(reg.map((x) => [x.quotaCent, x.dichiaratoCent, x.ricevutoCent, x.saldoCent])).toEqual([
      [1000, 1000, 1000, 0],
      [1000, 1000, 0, 1000],
      [1000, 0, 0, 1000],
      [1000, 500, 500, 500],
    ]);
    expect(totali(reg)).toEqual({ budgetCent: 4000, ricevutoCent: 1500, daRicevereCent: 2500 });
  });
  it("una sola azione per riga: «Segna ricevuto» per chi dichiara, «Segna un pagamento» per chi è a mano, niente per gli altri", () => {
    expect(registro(c, righe).map((x) => x.azione)).toEqual([null, { tipo: "ricevuto", cent: 1000 }, null, { tipo: "pagamento" }]);
  });
  it("lo stato in parole", () => {
    expect(registro(c, righe).map((x) => x.stato)).toEqual(["Ha pagato, ricevuto", "Dice di aver pagato 10\u00a0€", "Ha aderito", "Ricevuto 5\u00a0€"]);
    expect(registro({ ...c, consegnatoIl: ORA }, righe)[2].stato).toBe("Non ha ancora pagato");
  });
  it("se la quota sale, il ricevuto resta e cambia il saldo (AC-12)", () => {
    const reg = registro({ ...c, quotaCent: 1875 }, [r("a", "Anna", { stato: "confermato", importoCent: 1500 })]);
    expect([reg[0].ricevutoCent, reg[0].saldoCent]).toEqual([1500, 375]);
  });
  it("otto adesioni da 10 €, nessun versamento: budget 80 €, ricevuto 0 € (AC-11)", () => {
    const otto = Array.from({ length: 8 }, (_, i) => r(`u${i}`, `P${i}`));
    expect(totali(registro(c, otto))).toMatchObject({ budgetCent: 8000, ricevutoCent: 0 });
  });
  it("gli iscritti sono chi ha aderito con l'account, non le righe a mano (AC-08)", () => {
    expect(iscritti(righe)).toBe(3);
  });
  it("«Segna un pagamento» somma l'importo a quello già ricevuto (AC-09)", () => {
    expect(ricevutoDopoPagamento(righe[3], 500)).toBe(1000);
    expect(ricevutoDopoPagamento(r("x", "X", { uidAnonimo: null, stato: "invitato" }), 1000)).toBe(1000);
  });
});

describe("Regalo consegnato", () => {
  it("chiude le adesioni, ferma la quota e registra l'acquisto al prezzo del regalo", () => {
    const c = collettaDiProva({ modoQuota: "divisa", previsti: 10, nAderenti: 8, prodotto: { ...collettaDiProva().prodotto, prezzoCent: 16564 } });
    expect(consegna(c, ORA)).toEqual({
      consegnatoIl: ORA,
      listaAperta: false,
      quotaCongelata: true,
      quotaCent: 2071,
      acquisto: { fatto: true, speseCent: 16564, ricevutaUrl: null, destinazioneAvanzo: null },
      aggiornatoIl: ORA,
    });
  });
  it("senza regalo scelto l'acquisto non ha una spesa; una seconda volta non cambia nulla", () => {
    const c = collettaDiProva({ prodotto: REGALO_DA_SCEGLIERE });
    expect(consegna(c, ORA).acquisto).toMatchObject({ speseCent: null });
    expect(consegna({ ...c, consegnatoIl: ORA }, ORA + 1)).toEqual({});
  });
  it("non si consegna mentre si vota né un gruppo chiuso", () => {
    const voto = collettaDiProva({ votazione: { ...votazioneIniziale(24, true), apertaIl: ORA, scade: ORA + 1 } });
    expect(() => consegna(voto, ORA)).toThrow(ErroreDominio);
    expect(() => consegna(collettaDiProva({ stato: "chiusa" }), ORA)).toThrow(ErroreDominio);
  });
  it("dopo la consegna il server rifiuta nuove adesioni, anche a mano (AC-14), ma i pagamenti continuano", () => {
    const c = collettaDiProva({ consegnatoIl: ORA, listaAperta: false });
    const ctx = { colletta: c, pid: "nuovo", riga: null, causaliAltre: [], uid: "nuovo", ora: ORA };
    expect(() => eseguiOperazione({ tipo: "aderisci", nome: "Ugo" }, ctx)).toThrow("Le adesioni sono chiuse");
    const rinuncia = r("nuovo", "Ugo", { stato: "rinunciato" });
    expect(() => eseguiOperazione({ tipo: "aderisci", nome: "Ugo" }, { ...ctx, riga: rinuncia })).toThrow("Le adesioni sono chiuse");
    expect(() => creaInvitati(c, ["Ugo"], [], ORA, () => "x")).toThrow("Le adesioni sono chiuse");
    const dentro = r("anna", "Anna");
    const pagato = eseguiOperazione({ tipo: "dichiara", metodo: "paypal" }, { ...ctx, pid: "anna", uid: "anna", riga: dentro });
    expect(pagato.righe[0].valore?.stato).toBe("dichiarato");
    const ricevuto = eseguiOperazione({ tipo: "conferma" }, { ...ctx, pid: "anna", uid: c.organizzatoreUid, riga: pagato.righe[0].valore });
    expect(ricevuto.righe[0].valore?.stato).toBe("confermato");
  });
});

describe("stato del regalo in «I miei regali»", () => {
  const c = collettaDiProva({ organizzatoreUid: "cri", organizzatoreNome: "Cri", previsti: 10, quotaCent: 1000 });
  it("per chi organizza: iscritti su attesi, poi le quote da ricevere, poi Saldato", () => {
    const righe = [r("cri", "Cri", { stato: "confermato", importoCent: 1000 }), r("a", "Anna"), r("b", "Bea"), r("m", "Max", { uidAnonimo: null, stato: "invitato" })];
    expect(statoRegalo(c, righe, "cri")).toEqual({ testo: "3 su 10 hanno aderito", tono: "aperto" });
    const fatto = { ...c, consegnatoIl: ORA };
    expect(statoRegalo(fatto, righe, "cri")).toEqual({ testo: "3 quote da ricevere", tono: "caldo" });
    expect(statoRegalo(fatto, righe.slice(0, 2), "cri")).toEqual({ testo: "1 quota da ricevere", tono: "caldo" });
    expect(statoRegalo(fatto, righe.slice(0, 1), "cri")).toEqual({ testo: "Saldato", tono: "neutro" });
  });
  it("per chi partecipa: quota da pagare, in attesa della conferma, saldato", () => {
    expect(statoRegalo(c, [r("a", "Anna")], "a")).toEqual({ testo: "Quota da pagare", tono: "caldo" });
    expect(statoRegalo(c, [r("a", "Anna", { stato: "dichiarato" })], "a")).toEqual({ testo: "In attesa della conferma di Cri", tono: "neutro" });
    expect(statoRegalo(c, [r("a", "Anna", { stato: "confermato", importoCent: 1000 })], "a")).toEqual({ testo: "Saldato", tono: "neutro" });
  });
  it("mentre si vota, per tutti: Votazione aperta", () => {
    const voto = { ...c, votazione: { ...votazioneIniziale(24, true), apertaIl: ORA, scade: ORA + 1 } };
    expect(statoRegalo(voto, [], "cri").testo).toBe("Votazione aperta");
    expect(statoRegalo(voto, [r("a", "Anna")], "a").testo).toBe("Votazione aperta");
  });
});

describe("Metti ai voti più regali", () => {
  const due = [collettaDiProva().prodotto, { ...collettaDiProva().prodotto, prodottoId: "altro", nome: "Altro", prezzoCent: 5000 }];
  it("apre il voto fino a quattro giorni da oggi alle 20, con il regalo come segnaposto", () => {
    const c = collettaDiProva({ prodotto: REGALO_DA_SCEGLIERE, scadenza: Date.UTC(2026, 11, 30, 19) });
    const p = aperturaVoto(c, due, ORA);
    expect(p.votazione).toMatchObject({ apertaIl: ORA, scade: Date.UTC(2026, 11, 18, 19), chiusa: false, consentiProposte: true });
    expect(p.prodotto).toMatchObject({ prodottoId: null, prezzoCent: Math.round((11600 + 5000) / 2) });
  });
  it("non oltre la data limite delle adesioni, e mai meno di un'ora", () => {
    const vicina = collettaDiProva({ scadenza: ORA + 2 * 3_600_000 });
    expect(aperturaVoto(vicina, due, ORA).votazione?.scade).toBe(ORA + 2 * 3_600_000);
    const passata = collettaDiProva({ scadenza: ORA - 1 });
    expect(aperturaVoto(passata, due, ORA).votazione?.scade).toBe(Date.UTC(2026, 11, 18, 19));
    const quasi = collettaDiProva({ scadenza: ORA + 60_000 });
    expect(aperturaVoto(quasi, due, ORA).votazione?.scade).toBe(ORA + 3_600_000);
  });
  it("servono almeno due regali, e niente voto se si vota già o il regalo è consegnato", () => {
    expect(() => aperturaVoto(collettaDiProva(), due.slice(0, 1), ORA)).toThrow(ErroreDominio);
    const voto = collettaDiProva({ votazione: { ...votazioneIniziale(24, true), apertaIl: ORA, scade: ORA + 1 } });
    expect(() => aperturaVoto(voto, due, ORA)).toThrow(ErroreDominio);
    expect(() => aperturaVoto(collettaDiProva({ consegnatoIl: ORA }), due, ORA)).toThrow(ErroreDominio);
  });
});
