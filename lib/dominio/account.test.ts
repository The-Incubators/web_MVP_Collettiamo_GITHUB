import { describe, expect, it } from "vitest";
import { voceBiglietto, voceRegalo } from "./account";
import { collettaDiProva, rigaDiProva } from "./fixture";

describe("righe di «I miei regali»", () => {
  const c = collettaDiProva({ slug: "mauro", festeggiato: "Mauro", organizzatoreUid: "cri", organizzatoreNome: "Cri", dataRegalo: Date.UTC(2026, 11, 14, 11) });
  it("data, titolo, occasione e chi organizza per nome anche quando sono io (decisione 5)", () => {
    expect(voceRegalo(c, [], "cri")).toMatchObject({ href: "/gestisci/mauro", giorno: 14, mese: "dic", titolo: "Il regalo per Mauro", supporto: "Compleanno, organizzato da Cri", concluso: false });
  });
  it("chi partecipa va alla pagina dell'invito; il gruppo consegnato è concluso", () => {
    const v = voceRegalo({ ...c, consegnatoIl: 1 }, [rigaDiProva({ uidAnonimo: "anna" })], "anna");
    expect([v.href, v.concluso]).toEqual(["/c/mauro", true]);
  });
  it("senza il nome di chi organizza (account cancellato) resta solo l'occasione; «Altro» non si scrive", () => {
    expect(voceRegalo({ ...c, organizzatoreNome: "" }, [], "anna").supporto).toBe("Compleanno");
    expect(voceRegalo({ ...c, occasione: "altro" }, [], "anna").supporto).toBe("Organizzato da Cri");
  });
});

describe("righe di «I miei biglietti»", () => {
  const b = {
    id: "b1",
    slug: "per-marta",
    festeggiato: "Marta",
    occasione: "compleanno",
    stato: "aperto" as const,
    nFirme: 4,
    dataEvento: "2026-11-28",
    collettaSlug: null,
    organizzatoreNome: "Marco",
    copertina: { modelloId: "carta-menta", variante: 1, titolo: "", sottotitolo: null, immagineUrl: null },
  };
  it("creati da te: occasione con la data, firme, «Da mandare»", () => {
    expect(voceBiglietto(b, true)).toMatchObject({ href: "/biglietto/b1/gestisci", iniziale: "M", tema: "tema-menta", titolo: "Il biglietto per Marta", supporto: "Compleanno il 28 novembre, 4 firme", stato: { testo: "Da mandare" } });
    expect(voceBiglietto({ ...b, collettaSlug: "x", nFirme: 1, stato: "consegnato" }, true)).toMatchObject({ supporto: "Con il regalo di gruppo, 1 firma", stato: { testo: "Mandato a Marta", tono: "neutro" } });
  });
  it("firmati da te: chi l'ha creato, e se è già stato mandato", () => {
    expect(voceBiglietto(b, false)).toMatchObject({ href: "/b/per-marta", supporto: "Compleanno, creato da Marco", stato: { testo: "Non ancora mandato" } });
    expect(voceBiglietto({ ...b, stato: "consegnato" }, false).stato.testo).toBe("Mandato a Marta");
  });
});
