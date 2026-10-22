// Integrazione: l'archivio dei biglietti su Firestore (Admin SDK) contro l'emulatore.
// Transazioni dello slug, contatore delle firme, firme su biglietto chiuso, immagini come byte.
// Servono emulatori e Java: pnpm test:rules

import { beforeAll, describe, expect, it } from "vitest";
import type { ArchivioBiglietti, BigliettoServer, FirmaServer } from "../../lib/biglietti/tipi";

let a: ArchivioBiglietti;

beforeAll(async () => {
  Object.assign(process.env, { FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080", FIREBASE_ADMIN_PROJECT_ID: "demo-colletta", FIREBASE_ADMIN_ADC: "true" });
  a = (await import("../../lib/biglietti/firestore")).archivioBigliettiFirestore();
});

const biglietto = (id: string, extra: Partial<BigliettoServer> = {}): BigliettoServer => ({
  id,
  slug: "",
  organizzatoreUid: "",
  organizzatoreNome: null,
  tipo: "solo-biglietto",
  collettaSlug: null,
  occasione: "compleanno",
  festeggiato: "Nicola",
  daParteDi: "Noi",
  destinatario: "festeggiato",
  emailDestinatario: "n@example.com",
  consegna: { quando: Date.now() + 864e5, fuso: "Europe/Rome", data: "2030-01-01", ora: "10:00" },
  messaggioGruppo: "",
  nome: "Prova",
  copertina: { modelloId: "auguri-neutro", variante: 1, titolo: "", sottotitolo: null, immagineUrl: null },
  colonne: 2,
  ordineFirme: null,
  stato: "aperto",
  nFirme: 0,
  creatoIl: Date.now(),
  aggiornatoIl: Date.now(),
  consegnatoIl: null,
  hashChiave: "h",
  tokenDestinatario: "t",
  ...extra,
});

const firma = (id: string, testo: string): FirmaServer => ({
  id,
  uid: id,
  messaggioHtml: testo,
  stile: { font: "predefinito", colore: "#16241F", dimensione: "m" },
  immagine: null,
  daParteDi: "Luca",
  nome: "Luca",
  cognome: null,
  email: null,
  nascosta: false,
  creatoIl: 1,
  aggiornatoIl: 1,
  tokenModifica: "x",
});

describe("archivio biglietti su Firestore", () => {
  it("slug unico in transazione; cambiarlo libera il vecchio", async () => {
    const id1 = `b1${Date.now()}`;
    const id2 = `b2${Date.now()}`;
    const s = `prova-${Date.now()}`;
    await a.crea(biglietto(id1));
    await a.crea(biglietto(id2));
    expect(await a.prenotaSlug(id1, s)).toBe(true);
    expect(await a.prenotaSlug(id2, s)).toBe(false);
    expect(await a.slugOccupato(s)).toBe(true);
    expect(await a.slugOccupato(s, id1)).toBe(false);
    expect((await a.perSlug(s))?.id).toBe(id1);
    expect(await a.prenotaSlug(id1, `${s}-nuovo`)).toBe(true);
    expect(await a.slugOccupato(s)).toBe(false);
    expect(await a.prenotaSlug(id2, s)).toBe(true);
    expect((await a.leggi(id2))?.slug).toBe(s);
  });

  it("la firma si crea una volta, poi si aggiorna; niente firme a biglietto chiuso", async () => {
    const id = `bf${Date.now()}`;
    await a.crea(biglietto(id));
    expect(await a.salvaFirma(id, firma("f1", "Ciao"))).toEqual({ nuova: true });
    expect(await a.salvaFirma(id, { ...firma("f1", "Ciao di nuovo"), creatoIl: 99 })).toEqual({ nuova: false });
    const f = await a.firma(id, "f1");
    expect(f?.messaggioHtml).toBe("Ciao di nuovo");
    expect(f?.creatoIl).toBe(1);
    expect((await a.leggi(id))?.nFirme).toBe(1);
    await Promise.all([a.salvaFirma(id, firma("f2", "A")), a.salvaFirma(id, firma("f3", "B"))]);
    expect((await a.leggi(id))?.nFirme).toBe(3);
    expect((await a.firme(id)).length).toBe(3);
    await a.aggiorna(id, { stato: "consegnato" });
    expect(await a.salvaFirma(id, firma("f4", "Tardi"))).toEqual({ errore: "chiuso" });
  });

  it("immagini come byte, lette uguali e cancellabili; aggiornamento parziale", async () => {
    const id = `bi${Date.now()}`;
    await a.crea(biglietto(id, { organizzatoreUid: "org-x" }));
    const dati = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);
    await a.salvaImmagine(id, "c-abc", { mime: "image/png", dati });
    const letta = await a.leggiImmagine(id, "c-abc");
    expect(letta?.mime).toBe("image/png");
    expect([...(letta?.dati ?? [])]).toEqual([...dati]);
    await a.eliminaImmagine(id, "c-abc");
    expect(await a.leggiImmagine(id, "c-abc")).toBeNull();
    await a.aggiorna(id, { consegna: { quando: 5, fuso: "Europe/Rome", data: "2031-01-01", ora: "09:00" }, colonne: 3 });
    const b = await a.leggi(id);
    expect(b?.colonne).toBe(3);
    expect(b?.festeggiato).toBe("Nicola");
    expect(b?.consegna.data).toBe("2031-01-01");
    expect((await a.perOrganizzatore("org-x")).map((x) => x.id)).toContain(id);
  });
});
