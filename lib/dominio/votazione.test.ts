import { describe, expect, it } from "vitest";
import { collettaDiProva } from "./fixture";
import { eseguiOperazione, ErroreDominio } from "./operazioni";
import { chiusuraVotazione, classifica, idVoto, prodottoSegnaposto, votazioneIniziale, votazioneInCorso, votazioneScaduta } from "./votazione";
import { istanteRoma } from "./date";
import type { Colletta, Proposta, Voto } from "../tipi";

const prodotto = (nome: string, prezzo: number, consegna = 3) => ({
  prodottoId: null,
  nome,
  prezzoCent: prezzo * 100,
  consegnaGiorni: consegna,
  urlEsterno: "https://negozio-esempio.it/p/x",
  immagine: { seme: nome, icona: "casa" as const },
});
const proposta = (id: string, nome: string, prezzo: number, creatoIl: number, consegna = 3): Proposta => ({
  id,
  prodotto: prodotto(nome, prezzo, consegna),
  daOrganizzatore: true,
  autoreUid: "org",
  autoreNome: "Marco",
  creatoIl,
});
const voto = (uid: string, propostaId: string, stelle: number): Voto => ({ id: idVoto(uid, propostaId), propostaId, uid, stelle, ts: 1 });

const ORA = istanteRoma({ a: 2026, m: 10, g: 13 }, 12);
const inVoto = (extra: Partial<Colletta> = {}) =>
  collettaDiProva({
    votazione: { ...votazioneIniziale(24, true), apertaIl: ORA - 3_600_000, scade: ORA + 3_600_000 },
    dataRegalo: istanteRoma({ a: 2026, m: 11, g: 20 }, 12),
    ...extra,
  });

describe("classifica e vincitore", () => {
  it("vince la media più alta, non il numero di voti", () => {
    const p = [proposta("a", "A", 50, 1), proposta("b", "B", 80, 2)];
    const v = [voto("u1", "a", 5), voto("u1", "b", 3), voto("u2", "b", 4), voto("u3", "b", 4)];
    const c = classifica(p, v);
    expect(c.map((x) => x.proposta.id)).toEqual(["a", "b"]);
    expect(c[0]).toMatchObject({ media: 5, nVoti: 1 });
    expect(c[1].media).toBeCloseTo(11 / 3);
  });
  it("a parità di media vince chi ha più voti, poi la proposta inserita prima", () => {
    const p = [proposta("a", "A", 50, 5), proposta("b", "B", 80, 2), proposta("c", "C", 30, 9)];
    const v = [voto("u1", "a", 4), voto("u2", "a", 4), voto("u1", "b", 4), voto("u1", "c", 4), voto("u2", "c", 4)];
    expect(classifica(p, v).map((x) => x.proposta.id)).toEqual(["a", "c", "b"]);
    const pari = [proposta("a", "A", 50, 5), proposta("b", "B", 80, 2)];
    expect(classifica(pari, [voto("u1", "a", 3), voto("u1", "b", 3)])[0].proposta.id).toBe("b");
  });
  it("ignora i voti di proposte che non esistono e le stelle fuori scala", () => {
    const p = [proposta("a", "A", 50, 1)];
    const c = classifica(p, [voto("u1", "zzz", 5), voto("u2", "a", 9), voto("u3", "a", 2)]);
    expect(c[0]).toMatchObject({ media: 2, nVoti: 1 });
  });
  it("senza voti vince la prima proposta inserita", () => {
    const p = [proposta("b", "B", 80, 2), proposta("a", "A", 50, 1)];
    expect(classifica(p, [])[0].proposta.id).toBe("a");
  });
});

describe("chiusura della votazione", () => {
  it("il vincitore diventa il regalo, la quota e la scadenza si ricalcolano", () => {
    const p = [proposta("a", "Lampada", 60, 1, 2), proposta("b", "Cuffie", 120, 2, 4)];
    const c = inVoto({ previsti: 12 });
    const patch = chiusuraVotazione(c, p, [voto("u1", "b", 5), voto("u1", "a", 2)], ORA)!;
    expect(patch.prodotto?.nome).toBe("Cuffie");
    expect(patch.quotaCent).toBe(1000); // 120 € / 12
    expect(patch.votazione).toMatchObject({ chiusa: true, propostaVincenteId: "b", chiusaIl: ORA });
    // 20 novembre − (4 + 1) giorni = 15 novembre, ore 20:00 italiane
    expect(new Date(patch.scadenza as number).toISOString()).toBe("2026-11-15T19:00:00.000Z");
  });
  it("in modalità divisa la quota è il prezzo diviso i previsti, al centesimo per eccesso", () => {
    const p = [proposta("a", "Lampada", 100, 1)];
    expect(chiusuraVotazione(inVoto({ modoQuota: "divisa", previsti: 3 }), p, [], ORA)?.quotaCent).toBe(3334);
  });
  it("se per il vincitore non resta tempo di consegna, la raccolta dura un giorno", () => {
    const c = inVoto({ dataRegalo: istanteRoma({ a: 2026, m: 10, g: 16 }, 12) });
    const patch = chiusuraVotazione(c, [proposta("a", "Lampada", 100, 1, 4)], [], ORA)!;
    expect(new Date(patch.scadenza as number).toISOString()).toBe("2026-10-14T18:00:00.000Z");
  });
  it("non si chiude due volte né senza proposte", () => {
    const c = inVoto();
    expect(chiusuraVotazione(c, [], [], ORA)).toBeNull();
    const chiusa = { ...c, votazione: { ...c.votazione!, chiusa: true } };
    expect(chiusuraVotazione(chiusa, [proposta("a", "A", 50, 1)], [], ORA)).toBeNull();
  });
  it("scade quando il tempo è finito", () => {
    const c = inVoto();
    expect(votazioneScaduta(c, ORA)).toBe(false);
    expect(votazioneScaduta(c, ORA + 3_600_000)).toBe(true);
    expect(votazioneInCorso(c)).toBe(true);
    expect(votazioneInCorso(collettaDiProva())).toBe(false);
  });
  it("il segnaposto ha prezzo medio e consegna massima", () => {
    const s = prodottoSegnaposto([prodotto("A", 50, 2), prodotto("B", 100, 5)]);
    expect(s).toMatchObject({ prezzoCent: 7500, consegnaGiorni: 5 });
  });
});

describe("durante il voto non si paga", () => {
  it("le adesioni e i pagamenti sono sospesi finché la votazione è aperta", () => {
    const ctx = { colletta: inVoto(), pid: "u1", riga: null, causaliAltre: [], uid: "u1", ora: ORA };
    expect(() => eseguiOperazione({ tipo: "aderisci", nome: "Anna" }, ctx)).toThrow(ErroreDominio);
    const chiusa = { ...ctx, colletta: { ...ctx.colletta, votazione: { ...ctx.colletta.votazione!, chiusa: true } } };
    expect(() => eseguiOperazione({ tipo: "aderisci", nome: "Anna" }, chiusa)).not.toThrow();
  });
});
