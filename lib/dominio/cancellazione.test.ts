import { describe, expect, it } from "vitest";
import { elencoNomi, METODI_VUOTI, pianoCancellazione, type DatiAccount, type GruppoDaCancellare } from "./cancellazione";
import { collettaDiProva, rigaDiProva } from "./fixture";
import type { Colletta, Partecipante, Proposta, Voto } from "../tipi";

const ORA = Date.UTC(2026, 10, 5, 17, 40);
const IO = "cri";

const riga = (id: string, nome: string, extra: Partial<Partecipante> = {}): Partecipante =>
  rigaDiProva({ id, nome, uidAnonimo: id, causale: `X-${nome.toUpperCase()}`, ...extra });
const voto = (uid: string, propostaId: string): Voto => ({ id: `${uid}__${propostaId}`, propostaId, uid, stelle: 5, ts: 1 });
const proposta = (id: string, autoreUid: string): Proposta => ({
  id,
  prodotto: collettaDiProva().prodotto,
  daOrganizzatore: autoreUid === IO,
  autoreUid,
  autoreNome: "Chi",
  creatoIl: 1,
});
const gruppo = (c: Partial<Colletta>, righe: Partecipante[] = [], voti: Voto[] = [], proposte: Proposta[] = []): GruppoDaCancellare => ({
  colletta: collettaDiProva(c),
  righe,
  voti,
  proposte,
});

let n = 0;
const nuovoId = () => `nuovo${++n}`;

function account(extra: Partial<DatiAccount> = {}): DatiAccount {
  return { uid: IO, accesso: "google", preferiti: 0, ricorrenze: 0, organizzati: [], altrui: [], bigliettiCreati: [], firme: [], ...extra };
}

describe("pianoCancellazione: account, preferiti e ricorrenze", () => {
  it("cancella sempre nome, email e accesso, e dice con che cosa si accedeva", () => {
    expect(pianoCancellazione(account(), nuovoId, ORA).riepilogo.cancelliamo).toEqual([
      { icona: "account", testo: "Nome, email e accesso con Google", supporto: "" },
    ]);
    expect(pianoCancellazione(account({ accesso: "email" }), nuovoId, ORA).riepilogo.cancelliamo[0].testo).toBe("Nome, email e accesso con email");
  });
  it("conta preferiti e ricorrenze al singolare e al plurale, e tace quelli a zero", () => {
    const voce = (p: number, r: number) => pianoCancellazione(account({ preferiti: p, ricorrenze: r }), nuovoId, ORA).riepilogo.cancelliamo[1]?.testo;
    expect(voce(3, 3)).toBe("3 preferiti e 3 ricorrenze");
    expect(voce(1, 1)).toBe("1 preferito e 1 ricorrenza");
    expect(voce(2, 0)).toBe("2 preferiti");
    expect(voce(0, 0)).toBeUndefined();
  });
  it("senza regali né biglietti non c'è nulla da chiudere, scollegare o eliminare", () => {
    const p = pianoCancellazione(account(), nuovoId, ORA);
    expect([p.chiudi, p.eliminaBozze, p.eliminaRighe, p.scollegaRighe, p.eliminaVoti, p.eliminaBiglietti, p.eliminaFirme, p.riepilogo.resta]).toEqual([[], [], [], [], [], [], [], []]);
  });
});

describe("pianoCancellazione: i regali che organizzo", () => {
  const mio = gruppo(
    { slug: "mauro", festeggiato: "Mauro", organizzatoreUid: IO, organizzatoreNome: "Cri", nAttesi: 4, nAderenti: 4, nConfermati: 1, totaleConfermatoCent: 1000 },
    [
      riga(IO, "Cri", { stato: "confermato", importoCent: 1000 }),
      riga("luca", "Luca"),
      riga("sara", "Sara", { stato: "dichiarato" }),
      riga("davide", "Davide"),
      riga("x", "Paolo", { uidAnonimo: null, stato: "invitato" }),
      riga("nope", "Nadia", { stato: "rinunciato" }),
    ],
    [voto(IO, "p1"), voto("luca", "p1")],
    [proposta("p1", IO), proposta("p2", "luca")],
  );

  it("si chiude, senza nome né metodi di chi organizzava, e la sua riga sparisce con i totali in pari", () => {
    const p = pianoCancellazione(account({ organizzati: [mio] }), nuovoId, ORA);
    expect(p.chiudi).toEqual([
      {
        slug: "mauro",
        patch: {
          stato: "chiusa",
          organizzatoreUid: "",
          organizzatoreNome: "",
          metodi: METODI_VUOTI,
          listaAperta: false,
          aggiornatoIl: ORA,
          nAttesi: 3,
          nAderenti: 3,
          nConfermati: 0,
          totaleConfermatoCent: 0,
        },
      },
    ]);
    expect(p.eliminaRighe).toEqual([{ slug: "mauro", pid: IO }]);
  });
  it("le righe degli altri restano com'erano", () => {
    const p = pianoCancellazione(account({ organizzati: [mio] }), nuovoId, ORA);
    expect(p.scollegaRighe).toEqual([]);
    expect(p.eliminaRighe.map((r) => r.pid)).not.toContain("luca");
  });
  it("toglie il mio voto, lascia quello degli altri, e lascia le mie proposte senza autore", () => {
    const p = pianoCancellazione(account({ organizzati: [mio] }), nuovoId, ORA);
    expect(p.eliminaVoti).toEqual([{ slug: "mauro", votoId: `${IO}__p1` }]);
    expect(p.anonimizzaProposte).toEqual([{ slug: "mauro", propostaId: "p1" }]);
    expect(p.eliminaEventi).toEqual([{ slug: "mauro", tutti: true }]);
  });
  it("nel riepilogo nomina chi ha aderito con un account (non chi è a mano, non chi ha rinunciato, non me)", () => {
    const p = pianoCancellazione(account({ organizzati: [mio] }), nuovoId, ORA);
    expect(p.riepilogo.cancelliamo[1]).toEqual({
      icona: "regalo",
      testo: "Il regalo per Mauro, che organizzi",
      supporto: "Si chiude: Luca, Sara e Davide lo vedono chiuso nel loro account",
    });
  });
  it("con una sola persona usa il singolare, senza nessuno dice solo che si chiude", () => {
    const uno = gruppo({ slug: "a", festeggiato: "Anna", organizzatoreUid: IO }, [riga("luca", "Luca")]);
    const vuoto = gruppo({ slug: "b", festeggiato: "Bea", organizzatoreUid: IO }, [riga(IO, "Cri")]);
    const p = pianoCancellazione(account({ organizzati: [uno, vuoto] }), nuovoId, ORA);
    expect(p.riepilogo.cancelliamo.map((v) => v.supporto).slice(1)).toEqual(["Si chiude: Luca lo vede chiuso nel suo account", "Si chiude"]);
  });
  it("una bozza, che nessuno vede, si elimina invece di chiudersi", () => {
    const bozza = gruppo({ slug: "bozza", organizzatoreUid: IO, stato: "bozza" });
    const p = pianoCancellazione(account({ organizzati: [bozza] }), nuovoId, ORA);
    expect(p.eliminaBozze).toEqual(["bozza"]);
    expect(p.chiudi).toEqual([]);
    expect(p.riepilogo.cancelliamo).toHaveLength(1);
  });
  it("non tocca un gruppo passato fra i miei per errore ma organizzato da altri", () => {
    const altrui = gruppo({ slug: "z", organizzatoreUid: "marco" });
    expect(pianoCancellazione(account({ organizzati: [altrui] }), nuovoId, ORA).chiudi).toEqual([]);
  });
});

describe("pianoCancellazione: i regali organizzati da altri", () => {
  const elena = gruppo(
    { slug: "elena", festeggiato: "Elena", organizzatoreUid: "marco", organizzatoreNome: "Marco" },
    [
      riga("marco", "Marco"),
      riga(IO, "Cri", { stato: "confermato", importoCent: 1582, messaggio: "Auguri!", metodo: "paypal" }),
    ],
    [voto(IO, "p1"), voto(IO, "p2"), voto("marco", "p1")],
    [proposta("p1", "marco"), proposta("p3", IO)],
  );

  it("tengono nome e quota, ma la riga non è più legata all'account: uid tolto, id nuovo, messaggio cancellato", () => {
    const p = pianoCancellazione(account({ altrui: [elena] }), () => "abc123", ORA);
    expect(p.scollegaRighe).toHaveLength(1);
    const { slug, vecchioId, riga: r } = p.scollegaRighe[0];
    expect([slug, vecchioId, r.id, r.uidAnonimo, r.messaggio]).toEqual(["elena", IO, "abc123", null, null]);
    expect(r).toMatchObject({ nome: "Cri", stato: "confermato", importoCent: 1582, metodo: "paypal", causale: "X-CRI" });
    expect(p.eliminaRighe).toEqual([]);
    expect(p.chiudi).toEqual([]);
  });
  it("tolgono tutti i miei voti, solo i miei, e lasciano le mie proposte senza autore", () => {
    const p = pianoCancellazione(account({ altrui: [elena] }), nuovoId, ORA);
    expect(p.eliminaVoti).toEqual([
      { slug: "elena", votoId: `${IO}__p1` },
      { slug: "elena", votoId: `${IO}__p2` },
    ]);
    expect(p.anonimizzaProposte).toEqual([{ slug: "elena", propostaId: "p3" }]);
    expect(p.eliminaEventi).toEqual([{ slug: "elena", tutti: false }]);
  });
  it("nel riepilogo: il voto e il messaggio vanno, nome e quota restano per chi organizza", () => {
    const p = pianoCancellazione(account({ altrui: [elena] }), nuovoId, ORA);
    expect(p.riepilogo.cancelliamo[1]).toEqual({ icona: "voto", testo: "Il tuo voto e il tuo messaggio nel regalo per Elena", supporto: "" });
    expect(p.riepilogo.resta).toEqual([
      { icona: "gruppo", testo: "Il tuo nome e la quota nel regalo per Elena", supporto: "Marco li vede ancora, per chiudere il conto dei rimborsi" },
    ]);
  });
  it("solo il voto, o solo il messaggio", () => {
    const soloVoto = gruppo({ slug: "a", festeggiato: "Anna", organizzatoreUid: "marco" }, [riga(IO, "Cri")], [voto(IO, "p1")]);
    const soloMsg = gruppo({ slug: "b", festeggiato: "Bea", organizzatoreUid: "marco" }, [riga(IO, "Cri", { messaggio: "Ciao" })]);
    const testi = pianoCancellazione(account({ altrui: [soloVoto, soloMsg] }), nuovoId, ORA).riepilogo.cancelliamo.map((v) => v.testo);
    expect(testi).toContain("Il tuo voto nel regalo per Anna");
    expect(testi).toContain("Il tuo messaggio nel regalo per Bea");
  });
  it("una rinuncia, che non muove soldi, si elimina e non resta nulla", () => {
    const g = gruppo({ slug: "r", festeggiato: "Rita", organizzatoreUid: "marco" }, [riga(IO, "Cri", { stato: "rinunciato" })]);
    const p = pianoCancellazione(account({ altrui: [g] }), nuovoId, ORA);
    expect(p.eliminaRighe).toEqual([{ slug: "r", pid: IO }]);
    expect(p.scollegaRighe).toEqual([]);
    expect(p.riepilogo.resta).toEqual([]);
  });
  it("non tocca le righe con lo stesso nome ma di altri account, né le righe aggiunte a mano", () => {
    const g = gruppo({ slug: "o", organizzatoreUid: "marco" }, [riga("altra", "Cri"), riga("m", "Cri", { uidAnonimo: null })]);
    const p = pianoCancellazione(account({ altrui: [g] }), nuovoId, ORA);
    expect(p.scollegaRighe).toEqual([]);
    expect(p.eliminaRighe).toEqual([]);
  });
});

describe("pianoCancellazione: biglietti e firme", () => {
  it("elimina i biglietti creati; il link si spegne solo se era stato mandato", () => {
    const p = pianoCancellazione(
      account({
        bigliettiCreati: [
          { id: "b1", festeggiato: "Marta", stato: "aperto" },
          { id: "b2", festeggiato: "Ugo", stato: "bozza" },
        ],
      }),
      nuovoId,
      ORA,
    );
    expect(p.eliminaBiglietti).toEqual(["b1", "b2"]);
    expect(p.riepilogo.cancelliamo.slice(1)).toEqual([
      { icona: "biglietto", testo: "Il biglietto per Marta", supporto: "Il link che hai mandato non si apre più" },
      { icona: "biglietto", testo: "Il biglietto per Ugo", supporto: "" },
    ]);
  });
  it("elimina le firme sui biglietti di altri", () => {
    const p = pianoCancellazione(account({ firme: [{ bigliettoId: "b9", firmaId: "f1", festeggiato: "Elena" }] }), nuovoId, ORA);
    expect(p.eliminaFirme).toEqual([{ bigliettoId: "b9", firmaId: "f1" }]);
    expect(p.riepilogo.cancelliamo[1].testo).toBe("La tua firma sul biglietto per Elena");
  });
});

describe("elencoNomi", () => {
  it("unisce i nomi come si scrive in italiano", () => {
    expect([elencoNomi([]), elencoNomi(["Luca"]), elencoNomi(["Luca", "Sara"]), elencoNomi(["Luca", "Sara", "Davide"])]).toEqual(["", "Luca", "Luca e Sara", "Luca, Sara e Davide"]);
  });
});
