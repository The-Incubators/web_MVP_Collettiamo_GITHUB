import { describe, expect, it } from "vitest";
import {
  erroriDettagli,
  firmaPubblica,
  istanteConsegna,
  lunghezzaTesto,
  ripulisciHtml,
  slugBigliettoValido,
  slugDaNome,
  stileValido,
  suggerisciSlug,
  testoDaHtml,
  urlGoogleFonts,
  vistaPubblica,
  type DatiDettagli,
} from "./biglietti";
import { etichettaFuso, istanteNelFuso } from "./date";
import type { Biglietto, Firma } from "../tipi";

describe("link del biglietto", () => {
  it("minuscole, trattini, senza accenti (es. della specifica)", () => {
    expect(slugDaNome("Zqx Nic bday test 4821")).toBe("zqx-nic-bday-test-4821");
    expect(slugDaNome("  Compleanno dei 30 di Nicòla!! ")).toBe("compleanno-dei-30-di-nicola");
    expect(slugDaNome("Ünïcødé — ça va?")).toBe("unicode-ca-va");
    expect(slugBigliettoValido("ok-123")).toBe(true);
    expect(slugBigliettoValido("-no")).toBe(false);
    expect(slugBigliettoValido("ab")).toBe(false);
  });
  it("propone il primo slug libero con un numero in fondo", async () => {
    const presi = new Set(["festa-2", "festa-3"]);
    expect(await suggerisciSlug("festa", async (s) => presi.has(s))).toBe("festa-4");
  });
});

describe("ripulitura del messaggio", () => {
  it("tiene grassetto, corsivo, sottolineato e a capo, senza attributi", () => {
    expect(ripulisciHtml('<b class="x">Ciao</b> <i>bella</i> <u>gente</u><br/>!')).toBe("<b>Ciao</b> <i>bella</i> <u>gente</u><br>!");
    expect(ripulisciHtml("<strong>a</strong><em>b</em>")).toBe("<b>a</b><i>b</i>");
  });
  it("trasforma i blocchi dell'editor in a capo", () => {
    expect(ripulisciHtml("Riga uno<div>Riga due</div><div><br></div><div>Tre</div>")).toBe("Riga uno<br>Riga due<br><br>Tre");
  });
  it("neutralizza script, eventi, link e immagini", () => {
    const brutto = '<script>alert(1)</script><img src=x onerror="alert(2)"><a href="javascript:alert(3)">clic</a><b onclick="x">ok</b><style>*{}</style>';
    const pulito = ripulisciHtml(brutto);
    expect(pulito).toBe("clic<b>ok</b>");
    expect(pulito).not.toMatch(/script|onerror|onclick|javascript|<img|<a/i);
  });
  it("il testo resta testo: i simboli sono scappati, le entità decodificate una volta sola", () => {
    expect(ripulisciHtml("1 &lt; 2 &amp;&amp; 3 > 2")).toBe("1 &lt; 2 &amp;&amp; 3 &gt; 2");
    expect(ripulisciHtml('"<x>"')).toBe("&quot;&quot;");
    expect(ripulisciHtml("a < b")).toBe("a &lt; b");
  });
  it("chiude i tag lasciati aperti e risistema quelli incrociati", () => {
    expect(ripulisciHtml("<b>a<i>b</b>c</i>")).toBe("<b>a<i>b</i></b><i>c</i>");
    expect(ripulisciHtml("<u>senza fine")).toBe("<u>senza fine</u>");
  });
  it("niente a capo in testa, in coda o più di due di fila", () => {
    expect(ripulisciHtml("<br><br>ciao<br><br><br><br>tu<br>")).toBe("ciao<br><br>tu");
  });
  it("conta i caratteri visibili, emoji comprese", () => {
    expect(testoDaHtml("<b>Ciao</b><br>tu &amp; io")).toBe("Ciao\ntu & io");
    expect(lunghezzaTesto("🎂🎉 ok")).toBe(5);
  });
});

describe("stile del messaggio", () => {
  it("tiene solo caratteri, colori e dimensioni ammessi", () => {
    expect(stileValido({ font: "indie-flower", colore: "#aa00cc", dimensione: "xl" })).toEqual({ font: "indie-flower", colore: "#AA00CC", dimensione: "xl" });
    expect(stileValido({ font: "x'; } body {", colore: "red; background:url(x)", dimensione: "gigante" })).toEqual({ font: "predefinito", colore: "#16241F", dimensione: "m" });
    expect(stileValido(null).font).toBe("predefinito");
  });
  it("carica da Google Fonts solo i caratteri che non sono di sistema", () => {
    expect(urlGoogleFonts(["indie-flower", "arial", "predefinito", "playfair-display"])).toBe("https://fonts.googleapis.com/css2?family=Indie+Flower&family=Playfair+Display&display=swap");
    expect(urlGoogleFonts(["arial", "predefinito"])).toBeNull();
  });
});

describe("passo 2: le basi", () => {
  const adesso = Date.UTC(2026, 9, 16, 10); // 16 ottobre 2026
  const base: DatiDettagli = { festeggiato: "Nicola", daParteDi: "Il marketing", destinatario: "festeggiato", emailFesteggiato: "nic@example.com", emailMia: "", data: "2026-10-20", ora: "09:30", fuso: "Europe/Rome", nome: "Compleanno di Nicola" };
  it("tutto a posto: nessun errore", () => {
    expect(erroriDettagli(base, adesso)).toEqual({});
  });
  it("chiede l'email giusta secondo il destinatario", () => {
    expect(erroriDettagli({ ...base, emailFesteggiato: "x" }, adesso).emailFesteggiato).toBeTruthy();
    const ame = erroriDettagli({ ...base, destinatario: "organizzatore", emailFesteggiato: "", emailMia: "" }, adesso);
    expect(ame.emailMia).toBeTruthy();
    expect(ame.emailFesteggiato).toBeUndefined();
    expect(erroriDettagli({ ...base, destinatario: null }, adesso).destinatario).toBeTruthy();
  });
  it("rifiuta date passate, ore fuori dai quarti d'ora e nomi troppo lunghi", () => {
    expect(erroriDettagli({ ...base, data: "2026-10-15" }, adesso).data).toBeTruthy();
    expect(erroriDettagli({ ...base, data: "2026-10-16", ora: "08:00" }, adesso).consegna).toBeTruthy();
    expect(erroriDettagli({ ...base, ora: "09:20" }, adesso).ora).toBeTruthy();
    expect(erroriDettagli({ ...base, nome: "x".repeat(101) }, adesso).nome).toBe("Il nome supera i 100 caratteri.");
    expect(erroriDettagli({ ...base, fuso: "Marte/Olympus" }, adesso).fuso).toBeTruthy();
  });
  it("calcola l'istante della consegna nel fuso scelto", () => {
    expect(new Date(istanteConsegna(base)).toISOString()).toBe("2026-10-20T07:30:00.000Z"); // ora legale: UTC+2
    expect(new Date(istanteNelFuso({ a: 2026, m: 12, g: 1 }, 9, 0, "America/New_York")).toISOString()).toBe("2026-12-01T14:00:00.000Z");
    expect(etichettaFuso("Europe/Rome", Date.UTC(2026, 6, 1))).toBe("(UTC+02:00) Roma");
    expect(etichettaFuso("Europe/Rome", Date.UTC(2026, 11, 1))).toBe("(UTC+01:00) Roma");
  });
});

describe("viste pubbliche", () => {
  it("il biglietto pubblico non contiene email, token né uid", () => {
    const b = { slug: "s", organizzatoreUid: "uid-segreto", organizzatoreNome: "Marco", tipo: "solo-biglietto", collettaSlug: null, occasione: "compleanno", festeggiato: "N", daParteDi: "G", destinatario: "festeggiato", emailDestinatario: "privata@example.com", consegna: { quando: 1, fuso: "Europe/Rome" }, messaggioGruppo: "", nome: "n", copertina: { modelloId: "m", variante: 1, titolo: "", sottotitolo: null, immagineUrl: null }, colonne: 2, ordineFirme: null, stato: "aperto", nFirme: 0, creatoIl: 1, aggiornatoIl: 1, consegnatoIl: null, id: "id" } as Biglietto;
    const json = JSON.stringify(vistaPubblica(b));
    expect(json).not.toMatch(/privata@example\.com|uid-segreto|emailDestinatario|consegna/);
  });
  it("la firma pubblica non contiene nome completo, email o uid", () => {
    const f = { id: "f", uid: "u-segreto", messaggioHtml: "ciao", stile: { font: "predefinito", colore: "#000000", dimensione: "m" }, immagine: null, daParteDi: "Anna", nome: "Anna", cognome: "Bianchi", email: "anna@example.com", nascosta: false, creatoIl: 1, aggiornatoIl: 1 } as Firma;
    expect(JSON.stringify(firmaPubblica(f))).not.toMatch(/anna@example|Bianchi|u-segreto/);
    expect(firmaPubblica(f).daParteDi).toBe("Anna");
  });
});

describe("messaggi da condividere", () => {
  it("invito e promemoria con data nel fuso della consegna", async () => {
    const { messaggioInvitoBiglietto, messaggioPromemoriaBiglietto } = await import("./biglietti");
    const b = { festeggiato: "Nicola", consegna: { quando: Date.UTC(2026, 9, 17, 8, 0), fuso: "Europe/Rome", data: "2026-10-17", ora: "10:00" } };
    expect(messaggioInvitoBiglietto(b, "https://x/b/n")).toBe("Ciao! Stiamo preparando un biglietto di auguri per Nicola. Aggiungi il tuo messaggio entro il 17 ottobre, ci vuole un minuto: https://x/b/n");
    expect(messaggioPromemoriaBiglietto(b, "https://x/b/n")).toContain("lo consegniamo il 17 ottobre");
  });
});
