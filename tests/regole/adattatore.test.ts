// Integrazione: l'adattatore Firestore del browser contro gli emulatori di Firestore e Auth,
// con le regole di sicurezza vere. Verifica che le scritture reali dell'applicazione (transazioni,
// contatori, eventi) siano quelle che le regole consentono, e che quelle vietate vengano rifiutate.
// Servono emulatori e Java: pnpm test:rules

import { createUserWithEmailAndPassword, signInAnonymously, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { setLogLevel } from "firebase/firestore";
import { beforeAll, describe, expect, it } from "vitest";
import { ErroreDominio } from "../../lib/dominio/operazioni";
import { collettaDiProva } from "../../lib/dominio/fixture";
import type { Dati } from "../../lib/dati/tipi";

let dati: Dati;
let auth: ReturnType<typeof import("../../lib/firebase/client").authFirebase>;
const SLUG = "adattatore1";
let orgUid = "";

async function comeOrganizzatore() {
  await signOut(auth);
  const u = await signInWithEmailAndPassword(auth, "marco@example.com", "password-di-prova");
  return u.user.uid;
}
async function comeAnonimo() {
  await signOut(auth);
  return (await signInAnonymously(auth)).user.uid;
}

beforeAll(async () => {
  setLogLevel("silent");
  Object.assign(process.env, {
    NEXT_PUBLIC_FIREBASE_API_KEY: "chiave-finta",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "localhost",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-colletta",
    NEXT_PUBLIC_FIREBASE_APP_ID: "app-finta",
    NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
    NEXT_PUBLIC_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
    // Admin SDK (letture e chiusura a tempo della votazione) sullo stesso emulatore
    FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
    FIREBASE_ADMIN_PROJECT_ID: "demo-colletta",
    FIREBASE_ADMIN_ADC: "true",
    FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
    GCLOUD_PROJECT: "demo-colletta",
    ADMIN_EMAILS: "marco@example.com",
  });
  const client = await import("../../lib/firebase/client");
  auth = client.authFirebase();
  dati = (await import("../../lib/dati/firestore")).creaDatiFirestore();
  orgUid = (await createUserWithEmailAndPassword(auth, "marco@example.com", "password-di-prova")).user.uid;
});

describe("giro completo con l'adattatore Firestore e le regole vere", () => {
  let uidA = "";
  let uidB = "";

  it("chi organizza crea la bozza, aggiunge i nomi e apre la raccolta", async () => {
    await comeOrganizzatore();
    const c = collettaDiProva({ slug: SLUG, organizzatoreUid: orgUid, listaAperta: false, stato: "bozza" });
    await dati.creaColletta(c);
    expect(await dati.slugLibero(SLUG)).toBe(false);
    await dati.aggiungiInvitati(SLUG, ["Luca", "Sara"]);
    await dati.aggiornaColletta(SLUG, { stato: "aperta" });
    const letta = await dati.colletta(SLUG);
    expect(letta).toMatchObject({ stato: "aperta", nAttesi: 2, nAderenti: 0 });
    expect(letta?.scadenza).toBeTypeOf("number");
    expect((await dati.elencaCollette(orgUid)).map((x) => x.slug)).toContain(SLUG);
  });

  it("un partecipante anonimo non può aderire con la lista chiusa, ma rivendica un nome", async () => {
    uidA = await comeAnonimo();
    await expect(dati.esegui(SLUG, uidA, { tipo: "aderisci", nome: "Intruso" })).rejects.toBeInstanceOf(ErroreDominio);
    const righe = await dati.partecipanti(SLUG);
    const luca = righe.find((r) => r.nome === "Luca")!;
    await dati.esegui(SLUG, luca.id, { tipo: "aderisci", nome: "Luca", rivendica: luca.id });
    const dopo = (await dati.partecipanti(SLUG)).find((r) => r.nome === "Luca")!;
    expect(dopo).toMatchObject({ uidAnonimo: uidA, stato: "aderito" });
    expect((await dati.colletta(SLUG))?.nAderenti).toBe(1);
  });

  it("sceglie il metodo e dichiara; non può confermarsi", async () => {
    const luca = (await dati.partecipanti(SLUG)).find((r) => r.nome === "Luca")!;
    await dati.esegui(SLUG, luca.id, { tipo: "sceglieMetodo", metodo: "paypal" });
    await dati.esegui(SLUG, luca.id, { tipo: "dichiara", metodo: "paypal", importoCent: 1000 });
    await expect(dati.esegui(SLUG, luca.id, { tipo: "conferma" })).rejects.toBeInstanceOf(ErroreDominio);
    await dati.esegui(SLUG, luca.id, { tipo: "messaggio", testo: "Auguri!" });
    const riga = (await dati.partecipanti(SLUG)).find((r) => r.nome === "Luca")!;
    expect(riga).toMatchObject({ stato: "dichiarato", metodo: "paypal", importoCent: 1000, messaggio: "Auguri!" });
    expect((await dati.colletta(SLUG))?.totaleConfermatoCent).toBe(0);
  });

  it("un altro dispositivo riprende la riga («Hai già partecipato?»)", async () => {
    uidB = await comeAnonimo();
    const luca = (await dati.partecipanti(SLUG)).find((r) => r.nome === "Luca")!;
    await dati.esegui(SLUG, luca.id, { tipo: "aderisci", nome: "Luca", rivendica: luca.id });
    const dopo = (await dati.partecipanti(SLUG)).find((r) => r.nome === "Luca")!;
    expect(dopo).toMatchObject({ uidAnonimo: uidB, stato: "dichiarato" });
  });

  it("un anonimo non legge gli eventi né scrive sulla colletta", async () => {
    await expect(dati.eventi(SLUG)).rejects.toBeTruthy();
    await expect(dati.aggiornaColletta(SLUG, { totaleConfermatoCent: 99999 })).rejects.toBeTruthy();
    await dati.registraEvento(SLUG, { tipo: "apertura", uidAnonimo: uidB, partecipanteId: null, meta: {} });
  });

  it("chi organizza conferma: il totale sale della quota esatta e la quota si congela", async () => {
    await comeOrganizzatore();
    const luca = (await dati.partecipanti(SLUG)).find((r) => r.nome === "Luca")!;
    await dati.esegui(SLUG, luca.id, { tipo: "conferma" });
    const c = await dati.colletta(SLUG);
    expect(c).toMatchObject({ totaleConfermatoCent: 1000, nConfermati: 1, quotaCongelata: true });
    const tipi = (await dati.eventi(SLUG)).map((e) => e.tipo);
    expect(tipi).toEqual(expect.arrayContaining(["adesione", "metodo_scelto", "dichiarazione", "messaggio", "conferma", "apertura"]));
  });

  it("registra i promemoria inoltrati e chiude la colletta", async () => {
    const sara = (await dati.partecipanti(SLUG)).find((r) => r.nome === "Sara")!;
    await dati.registraSolleciti(SLUG, [sara.id], "meno5");
    expect((await dati.partecipanti(SLUG)).find((r) => r.nome === "Sara")?.solleciti).toBe(1);
    await dati.aggiornaColletta(SLUG, { stato: "chiusa", acquisto: { fatto: true, speseCent: 900, ricevutaUrl: null, destinazioneAvanzo: "biglietto" } });
    expect((await dati.colletta(SLUG))?.acquisto?.speseCent).toBe(900);
  });

  it("dopo la chiusura nessuno può più aderire", async () => {
    await comeAnonimo();
    await expect(dati.esegui(SLUG, "x", { tipo: "aderisci", nome: "Tardi" })).rejects.toBeTruthy();
  });

  it("una bozza si elimina solo da chi l'ha creata", async () => {
    await comeOrganizzatore();
    await dati.creaColletta(collettaDiProva({ slug: "bozzaeliminare", organizzatoreUid: orgUid, stato: "bozza" }));
    await comeAnonimo();
    await expect(dati.eliminaBozza("bozzaeliminare")).rejects.toBeTruthy();
    await comeOrganizzatore();
    await dati.eliminaBozza("bozzaeliminare");
    expect(await dati.colletta("bozzaeliminare")).toBeNull();
  });
});

describe("votazione del regalo con l'adattatore Firestore e le regole vere", () => {
  const SLUG_V = "votazione01";
  const prodotto = (nome: string, euro: number, consegna = 3) => ({
    prodottoId: null,
    nome,
    prezzoCent: euro * 100,
    consegnaGiorni: consegna,
    urlEsterno: "https://negozio-esempio.it/p/x",
    immagine: { seme: nome, icona: "casa" as const },
  });
  let uidA = "";
  let uidB = "";

  it("chi organizza prepara le proposte in bozza e apre la votazione", async () => {
    await comeOrganizzatore();
    const candidati = [prodotto("Lampada", 60), prodotto("Cuffie", 120, 4)];
    const { prodottoSegnaposto, votazioneIniziale } = await import("../../lib/dominio/votazione");
    await dati.creaColletta(
      collettaDiProva({
        slug: SLUG_V,
        organizzatoreUid: orgUid,
        stato: "bozza",
        previsti: 12,
        prodotto: prodottoSegnaposto(candidati),
        votazione: votazioneIniziale(24, true),
        dataRegalo: Date.now() + 30 * 864e5,
        scadenza: Date.now() + 25 * 864e5,
      }),
    );
    await dati.impostaProposteIniziali(SLUG_V, candidati);
    await dati.impostaProposteIniziali(SLUG_V, candidati); // idempotente: non raddoppia
    expect(await dati.proposte(SLUG_V)).toHaveLength(2);
    const ora = Date.now();
    const c = (await dati.colletta(SLUG_V))!;
    await dati.aggiornaColletta(SLUG_V, { stato: "aperta", votazione: { ...c.votazione!, apertaIl: ora, scade: ora + 3_600_000 } });
    expect((await dati.colletta(SLUG_V))?.votazione).toMatchObject({ chiusa: false, durataOre: 24 });
  });

  it("A e B votano, cambiano idea e propongono; le regole rifiutano ciò che è vietato", async () => {
    uidA = await comeAnonimo();
    const ps = await dati.proposte(SLUG_V);
    const lampada = ps.find((p) => p.prodotto.nome === "Lampada")!;
    const cuffie = ps.find((p) => p.prodotto.nome === "Cuffie")!;
    await dati.vota(SLUG_V, lampada.id, 2);
    await dati.vota(SLUG_V, lampada.id, 3); // cambia voto: stesso documento
    await dati.vota(SLUG_V, cuffie.id, 4);
    await expect(dati.vota(SLUG_V, cuffie.id, 6)).rejects.toBeTruthy();
    await expect(dati.vota(SLUG_V, "nonesiste", 3)).rejects.toBeTruthy();
    await dati.aggiungiProposta(SLUG_V, { prodotto: prodotto("Zaino", 90, 2), autoreNome: "Anna" });
    expect((await dati.proposte(SLUG_V)).filter((p) => !p.daOrganizzatore)).toHaveLength(1);
    // massimo tre proposte a testa
    await dati.aggiungiProposta(SLUG_V, { prodotto: prodotto("Libro", 20), autoreNome: "Anna" });
    await dati.aggiungiProposta(SLUG_V, { prodotto: prodotto("Pianta", 25), autoreNome: "Anna" });
    await expect(dati.aggiungiProposta(SLUG_V, { prodotto: prodotto("Extra", 10), autoreNome: "Anna" })).rejects.toBeInstanceOf(ErroreDominio);

    uidB = await comeAnonimo();
    await dati.vota(SLUG_V, cuffie.id, 5);
    await dati.vota(SLUG_V, lampada.id, 1);
    const voti = await dati.voti(SLUG_V);
    expect(voti).toHaveLength(4);
    expect(voti.find((v) => v.uid === uidA && v.propostaId === lampada.id)?.stelle).toBe(3);
    // B non può togliere la proposta di A né modificare la colletta
    const zaino = (await dati.proposte(SLUG_V)).find((p) => p.prodotto.nome === "Zaino")!;
    await expect(dati.rimuoviProposta(SLUG_V, zaino.id)).rejects.toBeTruthy();
    await expect(dati.aggiornaColletta(SLUG_V, { votazione: null })).rejects.toBeTruthy();
    // e durante il voto nessuno aderisce
    await expect(dati.esegui(SLUG_V, uidB, { tipo: "aderisci", nome: "B" })).rejects.toBeInstanceOf(ErroreDominio);
  });

  it("a tempo scaduto non si vota più e il server chiude la votazione col vincitore", async () => {
    await comeOrganizzatore();
    const c = (await dati.colletta(SLUG_V))!;
    await dati.aggiornaColletta(SLUG_V, { votazione: { ...c.votazione!, scade: Date.now() - 1000 } });
    await comeAnonimo();
    const ps = await dati.proposte(SLUG_V);
    await expect(dati.vota(SLUG_V, ps[0].id, 5)).rejects.toBeTruthy();
    await expect(dati.aggiungiProposta(SLUG_V, { prodotto: prodotto("Tardi", 10), autoreNome: "Z" })).rejects.toBeTruthy();

    const { creaDatiFirestoreAdmin } = await import("../../lib/dati/firestore-admin");
    const server = creaDatiFirestoreAdmin();
    const chiusa = await server.chiudiVotazioneScaduta(SLUG_V);
    // Cuffie: (4 + 5) / 2 = 4,5 — Lampada: (3 + 1) / 2 = 2 — Zaino, Libro, Pianta: nessun voto
    expect(chiusa?.prodotto.nome).toBe("Cuffie");
    expect(chiusa?.votazione).toMatchObject({ chiusa: true });
    expect(chiusa?.quotaCent).toBe(1000); // 120 € / 12 persone
    expect(await server.chiudiVotazioneScaduta(SLUG_V)).toBeNull(); // idempotente
    const letta = await server.colletta(SLUG_V);
    expect(letta?.prodotto.nome).toBe("Cuffie");
    expect(letta?.votazione?.propostaVincenteId).toBeTruthy();
  });

  it("dopo il voto la colletta riparte: si aderisce e si paga la quota del regalo vincente", async () => {
    uidA = await comeAnonimo();
    await dati.esegui(SLUG_V, uidA, { tipo: "aderisci", nome: "Anna" });
    await dati.esegui(SLUG_V, uidA, { tipo: "dichiara", metodo: "contanti" }).catch(() => undefined);
    expect((await dati.colletta(SLUG_V))?.nAderenti).toBe(1);
  });
});

describe("preferiti con l'adattatore Firestore e le regole vere", () => {
  it("si aggiungono, si rileggono e si tolgono; un altro account non li vede", async () => {
    const uid = await comeOrganizzatore();
    await dati.impostaPreferito(uid, "mappamondo-vintage-in-sughero", true);
    await dati.impostaPreferito(uid, "diario-di-viaggio-in-lino", true);
    await dati.impostaPreferito(uid, "diario-di-viaggio-in-lino", true); // idempotente
    expect((await dati.preferiti(uid)).sort()).toEqual(["diario-di-viaggio-in-lino", "mappamondo-vintage-in-sughero"]);
    await dati.impostaPreferito(uid, "diario-di-viaggio-in-lino", false);
    expect(await dati.preferiti(uid)).toEqual(["mappamondo-vintage-in-sughero"]);
    await comeAnonimo();
    await expect(dati.preferiti(uid)).rejects.toBeTruthy();
    await expect(dati.impostaPreferito(uid, "x", true)).rejects.toBeTruthy();
  });
});

describe("area riservata: ordine del catalogo con Firestore e Auth veri (emulatori)", () => {
  const url = "http://localhost/api/admin/catalogo";
  const prodotto = (slug: string, euro: number) => ({ slug, nome: slug, marca: "m", prezzoCent: euro * 100, categoria: "casa", occasioni: [], descrizione: "", consegnaGiorni: 3, urlEsterno: "", immagine: { seme: slug, icona: "casa" }, attivo: true, destinatari: ["uomo"], temi: ["viaggio"] });

  async function token(forzaVerifica: boolean) {
    const { authAdmin } = await import("../../lib/firebase/admin");
    if (forzaVerifica) await authAdmin().updateUser(orgUid, { emailVerified: true });
    await comeOrganizzatore();
    return (await auth.currentUser!.getIdToken(true)) as string;
  }
  const chiama = async (metodo: "GET" | "PUT", tk: string | null, corpo?: unknown) => {
    const rotta = await import("../../app/api/admin/catalogo/route");
    const init = { method: metodo, headers: { ...(tk ? { authorization: `Bearer ${tk}` } : {}), "content-type": "application/json" }, body: corpo ? JSON.stringify(corpo) : undefined };
    return (metodo === "GET" ? rotta.GET : rotta.PUT)(new Request(url, init));
  };

  it("senza token, con email non verificata o con un accesso anonimo non entra nessuno", async () => {
    const { dbAdmin } = await import("../../lib/firebase/admin");
    const db = dbAdmin();
    for (const [slug, euro] of [["a", 50], ["b", 20], ["c", 80]] as const) await db.collection("prodotti").doc(slug).set(prodotto(slug, euro));

    expect((await chiama("GET", null)).status).toBe(403);
    expect((await chiama("GET", "token-inventato")).status).toBe(403);
    const nonVerificata = await token(false);
    expect((await chiama("GET", nonVerificata)).status).toBe(403);
    await comeAnonimo();
    expect((await chiama("GET", await auth.currentUser!.getIdToken())).status).toBe(403);
  });

  it("con l'email autorizzata e verificata legge e salva l'ordine; il sito lo usa subito", async () => {
    const tk = await token(true);
    const letto = await (await chiama("GET", tk)).json();
    expect(letto.ok).toBe(true);
    expect(letto.prodotti.map((p: { slug: string }) => p.slug)).toEqual(["b", "a", "c"]); // senza posizioni: per prezzo
    expect(letto.impostazioni).toBeNull();

    const r = await chiama("PUT", tk, { modo: "trascinamento", ordine: ["c", "a", "b"], stelle: {} });
    expect(r.status).toBe(200);
    const { creaDatiFirestoreAdmin } = await import("../../lib/dati/firestore-admin");
    const sito = creaDatiFirestoreAdmin();
    expect((await sito.elencaProdotti()).map((p) => p.slug)).toEqual(["c", "a", "b"]);
    expect((await sito.elencaProdotti({ per: "uomo" })).map((p) => p.slug)).toEqual(["c", "a", "b"]); // anche con i filtri

    const stelle = await chiama("PUT", tk, { modo: "stelle", ordine: ["c", "a", "b"], stelle: { b: 5, a: 4 } });
    expect(stelle.status).toBe(200);
    expect((await sito.elencaProdotti()).map((p) => p.slug)).toEqual(["b", "a", "c"]);
    const riletto = await (await chiama("GET", tk)).json();
    expect(riletto.impostazioni).toMatchObject({ modo: "stelle", aggiornatoDa: "marco@example.com" });
    // il resto del prodotto non è stato toccato
    expect((await sito.prodotto("b"))).toMatchObject({ nome: "b", prezzoCent: 2000, posizione: 1 });
  });

  it("rifiuta dati non validi e le scritture dirette dal browser", async () => {
    const tk = await token(true);
    for (const brutto of [{ modo: "x", ordine: [], stelle: {} }, { modo: "stelle", ordine: ["zzz"], stelle: {} }, { modo: "stelle", ordine: [], stelle: { a: 9 } }]) {
      expect((await chiama("PUT", tk, brutto)).status).toBe(400);
    }
    // le regole non danno alcun accesso a /impostazioni dal browser, e non si può scrivere la posizione dei prodotti
    await expect(dati.aggiornaColletta("x", {})).rejects.toBeTruthy();
    const { getDoc, doc, getFirestore } = await import("firebase/firestore");
    const { appFirebase } = await import("../../lib/firebase/client");
    void appFirebase;
    await expect(getDoc(doc(getFirestore(), "impostazioni", "catalogo"))).rejects.toBeTruthy();
  });
});

describe("migrazione dei link affiliati su Firestore (emulatore)", () => {
  const TAGGED = (asin: string) => `https://www.amazon.it/dp/${asin}?tag=pacestefano77-21`;

  it("converte i soli campi pertinenti, è idempotente e si può annullare dal backup", async () => {
    const { dbAdmin } = await import("../../lib/firebase/admin");
    const { archivioLinkAdmin } = await import("../../lib/admin/archivioLinkAdmin");
    const { creaBackup, eseguiPiano, pianifica, ripristina } = await import("../../lib/admin/migrazioneLink");
    const db = dbAdmin();
    const pulisci = async () => {
      for (const c of ["prodotti", "collette"]) for (const d of (await db.collection(c).get()).docs) await db.recursiveDelete(d.ref);
    };
    await pulisci();
    const prodotto = (slug: string, link: string, asin: string, extra: Record<string, unknown> = {}) => ({ slug, nome: slug, prezzoCent: 1000, urlEsterno: link, asin, immagine: { seme: slug, icona: "casa", foto: "/foto-prodotti/PRD-001.webp" }, attivo: true, ...extra });
    await db.collection("prodotti").doc("a").set(prodotto("a", "https://www.amazon.it/dp/B0C4P1MF8V", "B0C4P1MF8V"));
    await db.collection("prodotti").doc("b").set(prodotto("b", "https://www.amazon.it/dp/B0F6V789N8?th=1#x", "B0F6V789N8"));
    await db.collection("prodotti").doc("c").set(prodotto("c", "https://www.amazon.it/dp/B0C8HD6F5W?tag=altro-21", "B0C8HD6F5W"));
    await db.collection("prodotti").doc("d").set(prodotto("d", "", "B07J5PGC8W"));
    await db.collection("prodotti").doc("e").set(prodotto("e", "https://www.amazon.com/dp/B0B8P52RKW", "B0B8P52RKW"));
    await db.collection("prodotti").doc("f").set(prodotto("f", "https:/amazon it/dp/X", "B0B8P52RKW"));
    await db.collection("collette").doc("c1").set({ slug: "c1", prodotto: { prodottoId: "a", urlEsterno: "https://www.amazon.it/dp/B0C4P1MF8V", nome: "a" }, festeggiato: "Giulia" });
    await db.collection("collette").doc("c2").set({ slug: "c2", prodotto: { prodottoId: null, urlEsterno: "https://www.amazon.it/dp/B0AAAAAAAA", nome: "a mano" } });
    await db.collection("collette").doc("c1").collection("proposte").doc("p1").set({ prodotto: { prodottoId: "b", urlEsterno: "https://www.amazon.it/dp/B0F6V789N8", nome: "b" }, autoreNome: "Anna" });

    const archivio = archivioLinkAdmin();
    const piano = pianifica(await archivio.leggi());
    expect(piano.riepilogo).toMatchObject({ convertito: 5, creato: 1, ignorato: 1, malformato: 1, "non-pertinente": 1, invariato: 0 });
    // la prova non scrive: un secondo piano è identico
    expect(pianifica(await archivio.leggi()).riepilogo).toEqual(piano.riepilogo);

    const backup = creaBackup(piano);
    expect((await eseguiPiano(archivio, piano)).scritti).toBe(6);

    expect((await db.collection("prodotti").doc("a").get()).get("urlEsterno")).toBe(TAGGED("B0C4P1MF8V"));
    expect((await db.collection("prodotti").doc("b").get()).get("urlEsterno")).toBe("https://www.amazon.it/dp/B0F6V789N8?th=1&tag=pacestefano77-21#x");
    expect((await db.collection("prodotti").doc("c").get()).get("urlEsterno")).toBe(TAGGED("B0C8HD6F5W"));
    expect((await db.collection("prodotti").doc("d").get()).get("urlEsterno")).toBe(TAGGED("B07J5PGC8W")); // creato dall'ASIN
    expect((await db.collection("prodotti").doc("e").get()).get("urlEsterno")).toBe("https://www.amazon.com/dp/B0B8P52RKW"); // altro dominio
    expect((await db.collection("prodotti").doc("f").get()).get("urlEsterno")).toBe("https:/amazon it/dp/X"); // malformato
    expect((await db.collection("collette").doc("c1").get()).get("prodotto.urlEsterno")).toBe(TAGGED("B0C4P1MF8V"));
    expect((await db.collection("collette").doc("c2").get()).get("prodotto.urlEsterno")).toBe("https://www.amazon.it/dp/B0AAAAAAAA"); // a mano
    expect((await db.collection("collette").doc("c1").collection("proposte").doc("p1").get()).get("prodotto.urlEsterno")).toContain("tag=pacestefano77-21");
    // il resto dei documenti non è cambiato
    const a = (await db.collection("prodotti").doc("a").get()).data()!;
    expect(a).toMatchObject({ nome: "a", prezzoCent: 1000, asin: "B0C4P1MF8V", immagine: { foto: "/foto-prodotti/PRD-001.webp" }, attivo: true });
    expect((await db.collection("collette").doc("c1").get()).get("prodotto.nome")).toBe("a");

    // seconda esecuzione: niente da fare
    const secondo = pianifica(await archivio.leggi());
    expect(secondo.riepilogo).toMatchObject({ convertito: 0, creato: 0, invariato: 6, ignorato: 1, malformato: 1, "non-pertinente": 1 }); // a, b, c, d, c1, p1 sono già a posto
    expect((await eseguiPiano(archivio, secondo)).scritti).toBe(0);

    // ripristino
    expect(await ripristina(archivio, backup)).toEqual({ ripristinati: 6, saltati: 0 });
    expect((await db.collection("prodotti").doc("a").get()).get("urlEsterno")).toBe("https://www.amazon.it/dp/B0C4P1MF8V");
    expect((await db.collection("prodotti").doc("c").get()).get("urlEsterno")).toBe("https://www.amazon.it/dp/B0C8HD6F5W?tag=altro-21");
    expect((await db.collection("prodotti").doc("d").get()).get("urlEsterno")).toBe("");
    expect((await db.collection("collette").doc("c1").get()).get("prodotto.urlEsterno")).toBe("https://www.amazon.it/dp/B0C4P1MF8V");
    await pulisci();
  });
});
