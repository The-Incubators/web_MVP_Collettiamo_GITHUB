// La cancellazione dell'account eseguita davvero sugli archivi in memoria (regali, voti, preferiti, ricorrenze, biglietti
// e firme): che cosa sparisce, che cosa resta e come lo vede chi rimane. Senza variabili Firebase la modalità è memoria.

import { beforeEach, describe, expect, it } from "vitest";
import { archivioBiglietti } from "../biglietti";
import type { BigliettoServer, FirmaServer } from "../biglietti/tipi";
import { creaDatiMemoria } from "../dati/memoria";
import { collettaDiProva } from "../dominio/fixture";
import { aperturaVoto } from "../dominio/gruppo";
import { cancellaAccount, pianoPer } from "./cancella";

const CRI = "org-cri";
const MARCO = "org-marco";
const LUCA = "org-luca";

const g = globalThis as Record<string, unknown>;

function biglietto(id: string, organizzatoreUid: string, festeggiato: string, extra: Partial<BigliettoServer> = {}): BigliettoServer {
  return {
    id,
    slug: `${id}-slug`,
    organizzatoreUid,
    organizzatoreNome: "X",
    tipo: "solo-biglietto",
    collettaSlug: null,
    occasione: "compleanno",
    festeggiato,
    daParteDi: "",
    destinatario: "festeggiato",
    emailDestinatario: "",
    consegna: { quando: 0, fuso: "Europe/Rome", data: "", ora: "" },
    messaggioGruppo: "",
    nome: "",
    copertina: { modelloId: "", variante: 1, titolo: "", sottotitolo: null, immagineUrl: null },
    colonne: 2,
    ordineFirme: null,
    stato: "aperto",
    nFirme: 0,
    creatoIl: 1,
    aggiornatoIl: 1,
    consegnatoIl: null,
    hashChiave: "h",
    tokenDestinatario: "t",
    ...extra,
  };
}

function firma(id: string, accountUid: string | null): FirmaServer {
  return {
    id,
    uid: id,
    messaggioHtml: "Auguri!",
    stile: { font: "a", colore: "#000", dimensione: "m" },
    immagine: null,
    daParteDi: "Cri",
    nome: "Cri",
    cognome: null,
    email: "cri@esempio.it",
    nascosta: false,
    creatoIl: 1,
    aggiornatoIl: 1,
    tokenModifica: "k",
    accountUid,
  };
}

async function scena() {
  const cri = creaDatiMemoria(CRI);
  const marco = creaDatiMemoria(MARCO);
  const luca = creaDatiMemoria(LUCA);
  // il regalo che Cri organizza, con Luca dentro
  await cri.creaColletta(collettaDiProva({ slug: "mauro", festeggiato: "Mauro", organizzatoreUid: CRI, organizzatoreNome: "Cri", stato: "aperta" }));
  await cri.esegui("mauro", CRI, { tipo: "aderisci", nome: "Cri" });
  await luca.esegui("mauro", LUCA, { tipo: "aderisci", nome: "Luca" });
  // il regalo che organizza Marco: Cri paga e vota
  const elena = collettaDiProva({ slug: "elena", festeggiato: "Elena", organizzatoreUid: MARCO, organizzatoreNome: "Marco", stato: "aperta" });
  await marco.creaColletta(elena);
  const due = [elena.prodotto, { ...elena.prodotto, prodottoId: "altro", nome: "Altro" }];
  await marco.impostaProposteIniziali("elena", due);
  await marco.aggiornaColletta("elena", aperturaVoto(elena, due, Date.now()));
  await cri.esegui("elena", CRI, { tipo: "aderisci", nome: "Cri" });
  const [p1] = await cri.proposte("elena");
  await cri.scegliVoto("elena", p1.id);
  await marco.scegliVoto("elena", p1.id);
  // preferiti, ricorrenze, profilo
  await cri.impostaPreferito(CRI, (await cri.elencaProdotti())[0].slug, true);
  await cri.salvaReminder(CRI, { id: "ricorrenza1", nome: "Luca", tipo: "compleanno", giorno: 3, mese: 1, anno: null, preavvisoSettimane: 2, nota: "" });
  await cri.salvaUtente({ uid: CRI, nome: "Cri", email: "cri@esempio.it" });
  // il biglietto di Cri e la sua firma su quello di Marco
  const arch = archivioBiglietti();
  await arch.crea(biglietto("bcri", CRI, "Marta"));
  await arch.prenotaSlug("bcri", "bcri-slug");
  await arch.crea(biglietto("bmarco", MARCO, "Paolo"));
  await arch.salvaFirma("bmarco", firma("f-cri", CRI));
  await arch.salvaFirma("bmarco", firma("f-altro", null));
  return { cri, marco, luca, p1 };
}

beforeEach(() => {
  delete g.__colletta_archivio;
  delete g.__colletta_biglietti;
});

describe("cancellazione dell'account, in memoria", () => {
  it("il riepilogo nomina regali, biglietti, voto e quello che resta", async () => {
    await scena();
    const { riepilogo } = await pianoPer({ uid: CRI, accesso: "google", accessoIl: null });
    expect(riepilogo.cancelliamo.map((v) => v.testo)).toEqual([
      "Nome, email e accesso con Google",
      "1 preferito e 1 ricorrenza",
      "Il regalo per Mauro, che organizzi",
      "Il biglietto per Marta",
      "La tua firma sul biglietto per Paolo",
      "Il tuo voto nel regalo per Elena",
    ]);
    expect(riepilogo.cancelliamo[2].supporto).toBe("Si chiude: Luca lo vede chiuso nel suo account");
    expect(riepilogo.resta.map((v) => v.testo)).toEqual(["Il tuo nome e la quota nel regalo per Elena"]);
  });

  it("cancella e lascia solo quello che serve agli altri, senza legami con l'account", async () => {
    const { marco, luca, p1 } = await scena();
    await cancellaAccount({ uid: CRI, accesso: "google", accessoIl: null });
    const cri = creaDatiMemoria(CRI);

    // il regalo di Cri: chiuso, senza nome né metodi; Luca lo ritrova chiuso nel suo account
    const mauro = await luca.colletta("mauro");
    expect(mauro).toMatchObject({ stato: "chiusa", organizzatoreUid: "", organizzatoreNome: "", listaAperta: false, nAderenti: 1 });
    expect(mauro?.metodi.bonifico).toEqual({ attivo: false, valore: "", intestatario: "" });
    expect((await luca.partecipanti("mauro")).map((r) => r.nome)).toEqual(["Luca"]);
    expect((await luca.mieiRegali(LUCA)).map((x) => [x.colletta.slug, x.colletta.stato])).toEqual([["mauro", "chiusa"]]);

    // il regalo di Marco: la riga di Cri resta con nome e quota, ma senza uid e con un id nuovo; il voto è sparito
    const righe = await marco.partecipanti("elena");
    const sua = righe.find((r) => r.nome === "Cri");
    expect(sua).toBeDefined();
    expect(sua?.uidAnonimo).toBeNull();
    expect(sua?.id).not.toBe(CRI);
    expect(righe.some((r) => r.uidAnonimo === CRI || r.id === CRI)).toBe(false);
    expect((await marco.voti("elena")).map((v) => v.uid)).toEqual([MARCO]);
    expect((await marco.proposte("elena")).some((p) => p.id === p1.id)).toBe(true);

    // preferiti, ricorrenze, profilo e regali dell'account: niente più
    expect(await cri.preferiti(CRI)).toEqual([]);
    expect(await cri.reminder(CRI)).toEqual([]);
    expect(await cri.profilo(CRI)).toBeNull();
    expect(await cri.mieiRegali(CRI)).toEqual([]);

    // il biglietto di Cri non si apre più; la sua firma sul biglietto di Marco è sparita, l'altra resta
    const arch = archivioBiglietti();
    expect(await arch.leggi("bcri")).toBeNull();
    expect(await arch.perSlug("bcri-slug")).toBeNull();
    expect((await arch.firme("bmarco")).map((f) => f.id)).toEqual(["f-altro"]);
    expect((await arch.leggi("bmarco"))?.nFirme).toBe(1);
  });

  it("si può ripetere: la seconda volta non trova più nulla da cancellare", async () => {
    await scena();
    await cancellaAccount({ uid: CRI, accesso: "google", accessoIl: null });
    await expect(cancellaAccount({ uid: CRI, accesso: "google", accessoIl: null })).resolves.toBeUndefined();
    const { riepilogo } = await pianoPer({ uid: CRI, accesso: "google", accessoIl: null });
    expect(riepilogo.cancelliamo).toHaveLength(1);
    expect(riepilogo.resta).toEqual([]);
  });

  it("non tocca gli altri account", async () => {
    const { marco } = await scena();
    await cancellaAccount({ uid: CRI, accesso: "google", accessoIl: null });
    expect(await marco.colletta("elena")).toMatchObject({ stato: "aperta", organizzatoreUid: MARCO, organizzatoreNome: "Marco" });
    expect((await marco.partecipanti("elena")).length).toBe(1);
    expect(await archivioBiglietti().leggi("bmarco")).not.toBeNull();
  });
});
