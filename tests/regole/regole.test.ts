// Test delle regole di sicurezza (criteri di accettazione 5 e 11).
// Servono l'emulatore di Firestore e Java: pnpm test:rules

import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc, collection, query, where, limit, serverTimestamp, setLogLevel } from "firebase/firestore";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

let env: RulesTestEnvironment;

const ORG = "org1";
const ALTRO_ORG = "org2";
const PERS = "anon1";
const PERS2 = "anon2";
const SLUG = "abcdefghjk";

const colletta = (extra: Record<string, unknown> = {}) => ({
  slug: SLUG,
  organizzatoreUid: ORG,
  stato: "aperta",
  modoQuota: "fissa",
  quotaCent: 1000,
  quotaCongelata: false,
  totaleConfermatoCent: 0,
  nConfermati: 0,
  nAttesi: 0,
  nAderenti: 0,
  creatoIl: new Date(),
  aggiornatoIl: new Date(),
  ...extra,
});

const riga = (extra: Record<string, unknown> = {}) => ({
  nome: "Anna",
  uidAnonimo: PERS,
  stato: "aderito",
  metodo: null,
  importoCent: null,
  causale: "GIULIA-ANNA",
  messaggio: null,
  nota: null,
  creatoIl: new Date(),
  dichiaratoIl: null,
  confermatoIl: null,
  solleciti: 0,
  ...extra,
});

beforeAll(async () => {
  setLogLevel("silent"); // i rifiuti sono l'esito atteso: niente rumore
  env = await initializeTestEnvironment({
    projectId: "demo-colletta",
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
  });
});

afterAll(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "collette", SLUG), colletta());
    await setDoc(doc(db, "collette", SLUG, "partecipanti", PERS), riga());
    await setDoc(doc(db, "collette", SLUG, "partecipanti", "invitato1"), riga({ nome: "Luca", uidAnonimo: null, stato: "invitato" }));
    await setDoc(doc(db, "collette", "altrui1234"), colletta({ slug: "altrui1234", organizzatoreUid: ALTRO_ORG }));
    await setDoc(doc(db, "collette", "altrui1234", "partecipanti", "x"), riga({ uidAnonimo: "zzz" }));
    await setDoc(doc(db, "collette", "bozza12345"), colletta({ slug: "bozza12345", stato: "bozza" }));
  });
});

const comePersona = (uid = PERS) => env.authenticatedContext(uid).firestore();
const comeOrg = (uid = ORG) => env.authenticatedContext(uid).firestore();
const rigaRef = (db: ReturnType<typeof comePersona>, pid = PERS) => doc(db, "collette", SLUG, "partecipanti", pid);

describe("il partecipante non può confermarsi (criterio 5)", () => {
  it("rifiuta di scrivere stato 'confermato' sulla propria riga", async () => {
    await assertFails(updateDoc(rigaRef(comePersona()), { stato: "confermato" }));
  });
  it("rifiuta di creare la propria riga già 'confermato'", async () => {
    await assertFails(setDoc(rigaRef(comePersona(PERS2), PERS2), riga({ uidAnonimo: PERS2, stato: "confermato" })));
  });
  it("rifiuta di impostare confermatoIl", async () => {
    await assertFails(updateDoc(rigaRef(comePersona()), { stato: "dichiarato", confermatoIl: new Date() }));
  });
  it("rifiuta di cambiare i campi che sono dell'organizzatore", async () => {
    await assertFails(updateDoc(rigaRef(comePersona()), { stato: "dichiarato", solleciti: 9 }));
    await assertFails(updateDoc(rigaRef(comePersona()), { stato: "dichiarato", nota: "ok" }));
  });
  it("rifiuta di toccare il totale confermato della colletta", async () => {
    await assertFails(updateDoc(doc(comePersona(), "collette", SLUG), { totaleConfermatoCent: 99999 }));
    await assertFails(updateDoc(doc(comePersona(), "collette", SLUG), { nConfermati: 1, nAttesi: 1 }));
    await assertFails(updateDoc(doc(comePersona(), "collette", SLUG), { quotaCent: 1 }));
  });
  it("consente di dichiarare il pagamento", async () => {
    await assertSucceeds(updateDoc(rigaRef(comePersona()), { stato: "dichiarato", metodo: "paypal", dichiaratoIl: new Date() }));
  });
  it("consente di creare la propria riga e di aggiornare i contatori di una unità", async () => {
    const db = comePersona(PERS2);
    await assertSucceeds(setDoc(rigaRef(db, PERS2), riga({ uidAnonimo: PERS2, nome: "Sara" })));
    await assertSucceeds(updateDoc(doc(db, "collette", SLUG), { nAttesi: 1, nAderenti: 1, aggiornatoIl: new Date() }));
    await assertFails(updateDoc(doc(db, "collette", SLUG), { nAttesi: 50 }));
  });
  it("non consente di creare la riga di un altro uid", async () => {
    await assertFails(setDoc(rigaRef(comePersona(PERS2), "altroId"), riga({ uidAnonimo: PERS2 })));
    await assertFails(setDoc(rigaRef(comePersona(PERS2), PERS2), riga({ uidAnonimo: PERS })));
  });
  it("non consente di modificare la riga di un altro", async () => {
    await assertFails(updateDoc(rigaRef(comePersona(PERS2)), { stato: "dichiarato" }));
  });
  it("una riga già confermata non si cambia più dal partecipante", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), "collette", SLUG, "partecipanti", PERS), { stato: "confermato", confermatoIl: new Date() });
    });
    await assertFails(updateDoc(rigaRef(comePersona()), { stato: "rinunciato" }));
  });
  it("chi organizza può confermare", async () => {
    await assertSucceeds(updateDoc(rigaRef(comeOrg()), { stato: "confermato", confermatoIl: new Date(), importoCent: 1000 }));
  });
  it("senza account non si fa nulla", async () => {
    const anon = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(anon, "collette", SLUG)));
    await assertFails(updateDoc(rigaRef(anon), { stato: "dichiarato" }));
  });
});

describe("liste chiuse e cambio di dispositivo", () => {
  it("si può rivendicare un nome libero dell'elenco", async () => {
    await assertSucceeds(updateDoc(rigaRef(comePersona(PERS2), "invitato1"), { uidAnonimo: PERS2, stato: "aderito" }));
  });
  it("non si può rivendicare un nome e saltare a 'dichiarato' in un colpo", async () => {
    await assertFails(updateDoc(rigaRef(comePersona(PERS2), "invitato1"), { uidAnonimo: PERS2, stato: "dichiarato" }));
  });
  it("«Continua con il tuo nome» cambia solo il proprietario", async () => {
    await assertSucceeds(updateDoc(rigaRef(comePersona(PERS2)), { uidAnonimo: PERS2 }));
  });
  it("«Continua con il tuo nome» non può cambiare altro nello stesso colpo", async () => {
    await assertFails(updateDoc(rigaRef(comePersona(PERS2)), { uidAnonimo: PERS2, stato: "dichiarato" }));
  });
});

describe("isolamento (criterio 11)", () => {
  it("un organizzatore non legge né scrive i partecipanti di una colletta altrui", async () => {
    const db = comeOrg(ORG);
    await assertFails(updateDoc(doc(db, "collette", "altrui1234", "partecipanti", "x"), { stato: "confermato", confermatoIl: new Date() }));
    await assertFails(setDoc(doc(db, "collette", "altrui1234", "partecipanti", "nuovo"), riga({ stato: "invitato", uidAnonimo: null })));
    await assertFails(deleteDoc(doc(db, "collette", "altrui1234", "partecipanti", "x")));
    await assertFails(updateDoc(doc(db, "collette", "altrui1234"), { totaleConfermatoCent: 5000 }));
  });
  it("gli eventi li legge solo chi organizza quella colletta", async () => {
    await assertFails(getDocs(collection(comePersona(), "collette", SLUG, "eventi")));
    await assertFails(getDocs(collection(comeOrg(ALTRO_ORG), "collette", SLUG, "eventi")));
    await assertSucceeds(getDocs(collection(comeOrg(), "collette", SLUG, "eventi")));
  });
  it("nessuno può elencare le collette di altri", async () => {
    const db = comeOrg(ORG);
    await assertFails(getDocs(query(collection(db, "collette"), where("organizzatoreUid", "==", ALTRO_ORG), limit(50))));
    await assertFails(getDocs(query(collection(db, "collette"), limit(50))));
    await assertFails(getDocs(query(collection(db, "collette"), where("organizzatoreUid", "==", ORG), limit(500))));
    await assertSucceeds(getDocs(query(collection(db, "collette"), where("organizzatoreUid", "==", ORG), limit(50))));
  });
  it("non si crea una colletta a nome di un altro, né già con dei soldi", async () => {
    const db = comeOrg(ORG);
    await assertFails(setDoc(doc(db, "collette", "nuova12345"), colletta({ slug: "nuova12345", organizzatoreUid: ALTRO_ORG, stato: "bozza" })));
    await assertFails(setDoc(doc(db, "collette", "nuova12345"), colletta({ slug: "nuova12345", stato: "bozza", totaleConfermatoCent: 500 })));
    await assertSucceeds(setDoc(doc(db, "collette", "nuova12345"), colletta({ slug: "nuova12345", stato: "bozza" })));
  });
  it("non si cambia l'organizzatore di una colletta", async () => {
    await assertFails(updateDoc(doc(comeOrg(), "collette", SLUG), { organizzatoreUid: PERS }));
  });
  it("si eliminano solo le proprie bozze", async () => {
    await assertFails(deleteDoc(doc(comeOrg(), "collette", SLUG)));
    await assertFails(deleteDoc(doc(comeOrg(ALTRO_ORG), "collette", "bozza12345")));
    await assertSucceeds(deleteDoc(doc(comeOrg(), "collette", "bozza12345")));
  });
  it("il catalogo è in sola lettura", async () => {
    await assertFails(setDoc(doc(comeOrg(), "prodotti", "x"), { nome: "x" }));
    await assertSucceeds(getDoc(doc(comeOrg(), "prodotti", "x")));
  });
});

describe("eventi", () => {
  const evento = (extra: Record<string, unknown> = {}) => ({ tipo: "apertura", uidAnonimo: PERS, partecipanteId: null, meta: {}, ts: serverTimestamp(), ...extra });
  it("chiunque sia autenticato può registrare un evento proprio, solo in scrittura", async () => {
    const db = comePersona();
    await assertSucceeds(setDoc(doc(collection(db, "collette", SLUG, "eventi")), evento()));
    await assertFails(setDoc(doc(collection(db, "collette", SLUG, "eventi")), evento({ ts: new Date(0) })));
    await assertFails(setDoc(doc(collection(db, "collette", SLUG, "eventi")), evento({ uidAnonimo: PERS2 })));
    await assertFails(setDoc(doc(collection(db, "collette", SLUG, "eventi")), evento({ tipo: "inventato" })));
  });
  it("gli eventi non si modificano né si cancellano", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "collette", SLUG, "eventi", "e1"), { tipo: "apertura", uidAnonimo: PERS, partecipanteId: null, meta: {}, ts: new Date() });
    });
    await assertFails(updateDoc(doc(comeOrg(), "collette", SLUG, "eventi", "e1"), { tipo: "conferma" }));
    await assertFails(deleteDoc(doc(comeOrg(), "collette", SLUG, "eventi", "e1")));
  });
});

describe("colletta dimostrativa", () => {
  it("è in sola lettura per chi partecipa", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "collette", "demo"), colletta({ slug: "demo", organizzatoreUid: "demo-organizzatore" }));
    });
    await assertSucceeds(getDoc(doc(comePersona(), "collette", "demo")));
    await assertFails(setDoc(doc(comePersona(PERS2), "collette", "demo", "partecipanti", PERS2), riga({ uidAnonimo: PERS2 })));
  });
});

describe("votazione del regalo", () => {
  const AVANTI = new Date(Date.now() + 3_600_000);
  const INDIETRO = new Date(Date.now() - 3_600_000);
  const votazione = (extra: Record<string, unknown> = {}) => ({
    durataOre: 24, consentiProposte: true, apertaIl: INDIETRO, scade: AVANTI, chiusa: false, chiusaIl: null, propostaVincenteId: null, ...extra,
  });
  const prodotto = { prodottoId: null, nome: "Lampada", prezzoCent: 6000, consegnaGiorni: 3, urlEsterno: "https://negozio-esempio.it/p/x", immagine: { seme: "l", icona: "casa" } };
  const proposta = (extra: Record<string, unknown> = {}) => ({ prodotto, daOrganizzatore: false, autoreUid: PERS2, autoreNome: "Sara", creatoIl: serverTimestamp(), ...extra });
  const voto = (uid: string, stelle: number, extra: Record<string, unknown> = {}) => ({ propostaId: "p1", uid, stelle, ts: serverTimestamp(), ...extra });

  async function preparaVoto(v = votazione()) {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, "collette", SLUG), colletta({ votazione: v }));
      await setDoc(doc(db, "collette", SLUG, "proposte", "p1"), { ...proposta({ creatoIl: new Date(), daOrganizzatore: true, autoreUid: ORG }) });
    });
  }
  const refVoto = (db: ReturnType<typeof comePersona>, uid: string, pid = "p1") => doc(db, "collette", SLUG, "voti", `${uid}__${pid}`);

  it("chi partecipa vota da 1 a 5 stelle, una volta per proposta, e può cambiare idea", async () => {
    await preparaVoto();
    const db = comePersona();
    await assertSucceeds(setDoc(refVoto(db, PERS), voto(PERS, 4)));
    await assertSucceeds(setDoc(refVoto(db, PERS), voto(PERS, 2)));
    await assertFails(setDoc(refVoto(db, PERS), voto(PERS, 0)));
    await assertFails(setDoc(refVoto(db, PERS), voto(PERS, 6)));
    await assertFails(setDoc(refVoto(db, PERS), voto(PERS, 3.5)));
  });
  it("non si vota a nome di un altro né su una proposta che non esiste", async () => {
    await preparaVoto();
    const db = comePersona();
    await assertFails(setDoc(refVoto(db, PERS2), voto(PERS2, 5)));
    await assertFails(setDoc(doc(db, "collette", SLUG, "voti", `${PERS}__p1`), voto(PERS, 5, { uid: PERS2 })));
    await assertFails(setDoc(doc(db, "collette", SLUG, "voti", "altro"), voto(PERS, 5)));
    await assertFails(setDoc(refVoto(db, PERS, "nonesiste"), voto(PERS, 5, { propostaId: "nonesiste" })));
  });
  it("non si vota a votazione scaduta o chiusa, né prima che la raccolta sia aperta", async () => {
    await preparaVoto(votazione({ scade: INDIETRO }));
    await assertFails(setDoc(refVoto(comePersona(), PERS), voto(PERS, 5)));
    await preparaVoto(votazione({ chiusa: true }));
    await assertFails(setDoc(refVoto(comePersona(), PERS), voto(PERS, 5)));
    await preparaVoto();
    await env.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), "collette", SLUG), { stato: "bozza" });
    });
    await assertFails(setDoc(refVoto(comePersona(), PERS), voto(PERS, 5)));
  });
  it("senza votazione non si vota", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "collette", SLUG, "proposte", "p1"), proposta());
    });
    await assertFails(setDoc(refVoto(comePersona(), PERS), voto(PERS, 5)));
  });
  it("chi partecipa propone un regalo con i propri dati, solo se consentito", async () => {
    await preparaVoto();
    const db = comePersona(PERS2);
    await assertSucceeds(setDoc(doc(collection(db, "collette", SLUG, "proposte")), proposta()));
    await assertFails(setDoc(doc(collection(db, "collette", SLUG, "proposte")), proposta({ autoreUid: PERS })));
    await assertFails(setDoc(doc(collection(db, "collette", SLUG, "proposte")), proposta({ daOrganizzatore: true })));
    await assertFails(setDoc(doc(collection(db, "collette", SLUG, "proposte")), proposta({ prodotto: { ...prodotto, prezzoCent: -5 } })));
    await assertFails(setDoc(doc(collection(db, "collette", SLUG, "proposte")), proposta({ autoreNome: "" })));
    await preparaVoto(votazione({ consentiProposte: false }));
    await assertFails(setDoc(doc(collection(db, "collette", SLUG, "proposte")), proposta()));
  });
  it("le proposte non si modificano; si tolgono solo le proprie (o tutte, se si organizza)", async () => {
    await preparaVoto();
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "collette", SLUG, "proposte", "mia"), { ...proposta({ creatoIl: new Date() }) });
    });
    await assertFails(updateDoc(doc(comePersona(PERS2), "collette", SLUG, "proposte", "mia"), { autoreNome: "X" }));
    await assertFails(deleteDoc(doc(comePersona(PERS), "collette", SLUG, "proposte", "mia")));
    await assertFails(deleteDoc(doc(comePersona(PERS2), "collette", SLUG, "proposte", "p1")));
    await assertSucceeds(deleteDoc(doc(comePersona(PERS2), "collette", SLUG, "proposte", "mia")));
    await assertSucceeds(deleteDoc(doc(comeOrg(), "collette", SLUG, "proposte", "p1")));
  });
  it("chi organizza imposta le proposte iniziali anche in bozza; gli altri no", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "collette", "bozza12345"), colletta({ slug: "bozza12345", stato: "bozza", votazione: votazione({ apertaIl: null, scade: null }) }));
    });
    const ini = (extra: Record<string, unknown> = {}) => proposta({ daOrganizzatore: true, autoreUid: ORG, ...extra });
    await assertSucceeds(setDoc(doc(collection(comeOrg(), "collette", "bozza12345", "proposte")), ini()));
    await assertFails(setDoc(doc(collection(comeOrg(ALTRO_ORG), "collette", "bozza12345", "proposte")), ini({ autoreUid: ALTRO_ORG })));
    await assertFails(setDoc(doc(collection(comePersona(PERS2), "collette", "bozza12345", "proposte")), proposta()));
  });
  it("i voti li cancella solo chi organizza", async () => {
    await preparaVoto();
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "collette", SLUG, "voti", `${PERS}__p1`), { propostaId: "p1", uid: PERS, stelle: 3, ts: new Date() });
    });
    await assertFails(deleteDoc(refVoto(comePersona(), PERS)));
    await assertSucceeds(deleteDoc(refVoto(comeOrg(), PERS)));
  });
  it("nessuno chiude la votazione dal browser se non chi organizza", async () => {
    await preparaVoto();
    await assertFails(updateDoc(doc(comePersona(), "collette", SLUG), { votazione: votazione({ chiusa: true }) }));
    await assertSucceeds(updateDoc(doc(comeOrg(), "collette", SLUG), { votazione: votazione({ chiusa: true }) }));
  });
});

describe("preferiti", () => {
  const pref = (db: ReturnType<typeof comePersona>, uid: string, prodotto = "appendiabiti-cactus-arizona") => doc(db, "utenti", uid, "preferiti", prodotto);
  it("ognuno legge e scrive solo i propri preferiti", async () => {
    const db = comeOrg(ORG);
    await assertSucceeds(setDoc(pref(db, ORG), { creatoIl: serverTimestamp() }));
    await assertSucceeds(getDoc(pref(db, ORG)));
    await assertSucceeds(getDocs(collection(db, "utenti", ORG, "preferiti")));
    await assertSucceeds(deleteDoc(pref(db, ORG)));
  });
  it("nessuno tocca i preferiti di un altro", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(pref(ctx.firestore(), ALTRO_ORG), { creatoIl: new Date() });
    });
    const db = comeOrg(ORG);
    await assertFails(getDoc(pref(db, ALTRO_ORG)));
    await assertFails(getDocs(collection(db, "utenti", ALTRO_ORG, "preferiti")));
    await assertFails(setDoc(pref(db, ALTRO_ORG, "altro"), { creatoIl: serverTimestamp() }));
    await assertFails(deleteDoc(pref(db, ALTRO_ORG)));
  });
  it("senza account non si salva nulla e il documento ha solo la data", async () => {
    await assertFails(setDoc(pref(env.unauthenticatedContext().firestore(), ORG), { creatoIl: serverTimestamp() }));
    const db = comeOrg(ORG);
    await assertFails(setDoc(pref(db, ORG), { creatoIl: serverTimestamp(), altro: "x" }));
    await assertFails(setDoc(pref(db, ORG), { creatoIl: new Date(0) }));
  });
});

describe("biglietto di auguri", () => {
  it("dal browser nessuno legge o scrive biglietti, firme e link: passa tutto dal server", async () => {
    await env.withSecurityRulesDisabled(async (c) => {
      await setDoc(doc(c.firestore(), "biglietti/b1"), { organizzatoreUid: ORG, emailDestinatario: "x@example.com", stato: "aperto" });
      await setDoc(doc(c.firestore(), "biglietti/b1/firme/f1"), { nome: "Anna" });
      await setDoc(doc(c.firestore(), "slugBiglietti/compleanno"), { bigliettoId: "b1" });
    });
    for (const db of [comeOrg(ORG), env.unauthenticatedContext().firestore()]) {
      await assertFails(getDoc(doc(db, "biglietti/b1")));
      await assertFails(getDoc(doc(db, "biglietti/b1/firme/f1")));
      await assertFails(getDoc(doc(db, "slugBiglietti/compleanno")));
      await assertFails(setDoc(doc(db, "biglietti/b2"), { organizzatoreUid: ORG }));
      await assertFails(setDoc(doc(db, "biglietti/b1/firme/f2"), { nome: "Luca" }));
      await assertFails(updateDoc(doc(db, "biglietti/b1"), { stato: "consegnato" }));
    }
  });
});
