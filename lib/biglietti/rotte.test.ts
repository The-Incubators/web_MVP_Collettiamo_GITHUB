// Il percorso completo del biglietto sulle rotte server, nella modalità senza Firebase (archivio in memoria).

import { describe, expect, it } from "vitest";
import { POST as creaBozza } from "@/app/api/biglietti/route";
import { GET as leggi, PATCH as salva } from "@/app/api/biglietti/[id]/route";
import { GET as verificaSlug } from "@/app/api/biglietti/slug/route";
import { POST as pubblica } from "@/app/api/biglietti/[id]/pubblica/route";
import { POST as copertina } from "@/app/api/biglietti/[id]/copertina/route";
import { GET as firmeOrg } from "@/app/api/biglietti/[id]/firme/route";
import { GET as pubblico } from "@/app/api/b/[slug]/route";
import { POST as firma } from "@/app/api/b/[slug]/firma/route";
import { GET as miaFirma } from "@/app/api/b/[slug]/mia-firma/route";
import { GET as immagine } from "@/app/api/img/b/[id]/[nome]/route";

const B = "http://localhost/api";
const json = (r: Response) => r.json() as Promise<Record<string, any>>; // eslint-disable-line @typescript-eslint/no-explicit-any
const req = (url: string, init: { method?: string; body?: unknown; headers?: Record<string, string> } = {}) =>
  new Request(url, { method: init.method ?? "GET", headers: { "content-type": "application/json", ...init.headers }, body: init.body === undefined ? undefined : JSON.stringify(init.body) });
const ctx = <T,>(p: T) => ({ params: Promise.resolve(p) });

const domani = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
const dettagli = (slug: string) => ({
  festeggiato: "Nicola",
  daParteDi: "I colleghi",
  destinatario: "festeggiato",
  emailFesteggiato: "nicola@example.com",
  emailMia: "",
  data: domani,
  ora: "10:00",
  fuso: "Europe/Rome",
  nome: "Compleanno di Nicola",
  slug,
  messaggioGruppo: "Ciao <script>alert(1)</script><b>tutti</b>",
});
const PNG_1PX = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

async function nuovaBozza() {
  const r = await json(await creaBozza(req(`${B}/biglietti`, { method: "POST", body: { occasione: "compleanno" } })));
  return { id: r.id as string, h: { "x-chiave-biglietto": r.chiave as string } };
}

describe("rotte del biglietto (memoria)", () => {
  it("bozza → dettagli → copertina → pubblica → firma", async () => {
    const { id, h } = await nuovaBozza();
    expect(id).toMatch(/^[A-Za-z0-9]{20}$/);

    // senza chiave non si legge
    expect((await leggi(req(`${B}/biglietti/${id}`), ctx({ id }))).status).toBe(404);
    const letto = await json(await leggi(req(`${B}/biglietti/${id}`, { headers: h }), ctx({ id })));
    expect(letto.biglietto.stato).toBe("bozza");
    expect(letto.biglietto.hashChiave).toBeUndefined();
    expect(letto.biglietto.tokenDestinatario).toBeUndefined();

    const slug = `compleanno-nicola-${Date.now().toString(36)}`;
    expect((await json(await verificaSlug(req(`${B}/biglietti/slug?s=${slug}`)))).disponibile).toBe(true);
    const r2 = await json(await salva(req(`${B}/biglietti/${id}`, { method: "PATCH", headers: h, body: { dettagli: dettagli(slug) } }), ctx({ id })));
    expect(r2.ok).toBe(true);
    expect(r2.biglietto.slug).toBe(slug);
    expect(r2.biglietto.messaggioGruppo).toBe("Ciao <b>tutti</b>");
    // ora il link è occupato per gli altri, libero per lui
    const occ = await json(await verificaSlug(req(`${B}/biglietti/slug?s=${slug}`)));
    expect(occ.disponibile).toBe(false);
    expect(occ.suggerito).toBe(`${slug}-2`);
    expect((await json(await verificaSlug(req(`${B}/biglietti/slug?s=${slug}&id=${id}`)))).disponibile).toBe(true);

    // un'altra bozza non può prendere lo stesso link: 409 con suggerimento
    const altra = await nuovaBozza();
    const conflitto = await salva(req(`${B}/biglietti/${altra.id}`, { method: "PATCH", headers: altra.h, body: { dettagli: dettagli(slug) } }), ctx({ id: altra.id }));
    expect(conflitto.status).toBe(409);
    expect((await json(conflitto)).suggerito).toBe(`${slug}-2`);

    await salva(req(`${B}/biglietti/${id}`, { method: "PATCH", headers: h, body: { copertina: { modelloId: "compleanno-torta", variante: 1, titolo: "Nicola" } } }), ctx({ id }));

    // pubblicare richiede un account
    expect((await pubblica(req(`${B}/biglietti/${id}/pubblica`, { method: "POST", headers: h, body: {} }), ctx({ id }))).status).toBe(401);
    const hu = { ...h, "x-uid-prova": "org-1", "x-nome-prova": "Sara" };
    const pub = await json(await pubblica(req(`${B}/biglietti/${id}/pubblica`, { method: "POST", headers: hu, body: {} }), ctx({ id })));
    expect(pub.biglietto.stato).toBe("aperto");
    expect(pub.biglietto.organizzatoreUid).toBe("org-1");
    // dopo la pubblicazione, l'account basta anche senza chiave
    expect((await leggi(req(`${B}/biglietti/${id}`, { headers: { "x-uid-prova": "org-1" } }), ctx({ id }))).status).toBe(200);
    expect((await leggi(req(`${B}/biglietti/${id}`, { headers: { "x-uid-prova": "altro" } }), ctx({ id }))).status).toBe(404);

    // la vista pubblica non contiene dati privati
    const vista = await pubblico(req(`${B}/b/${slug}`), ctx({ slug }));
    const testoVista = await vista.text();
    expect(testoVista).not.toContain("nicola@example.com");
    expect(testoVista).not.toContain("tokenDestinatario");

    // firma: stessa chiave = stessa firma (aggiorna, non duplica)
    const kf = { "x-chiave-firmatario": "a".repeat(43) };
    const corpo = { messaggioHtml: "Auguri <i>Nico</i>!<img src=x onerror=alert(1)>", stile: { font: "poppins", colore: "#ff0000", dimensione: "l" }, immagine: { tipo: "caricata", dataUrl: PNG_1PX, larghezza: 1, altezza: 1 }, daParteDi: "Luca", nome: "Luca", cognome: "", email: "" };
    const f1 = await json(await firma(req(`${B}/b/${slug}/firma`, { method: "POST", headers: kf, body: corpo }), ctx({ slug })));
    expect(f1.nuova).toBe(true);
    const f2 = await json(await firma(req(`${B}/b/${slug}/firma`, { method: "POST", headers: kf, body: { ...corpo, immagine: { tipo: "mantieni" }, messaggioHtml: "Auguri di nuovo" } }), ctx({ slug })));
    expect(f2.nuova).toBe(false);
    expect(f2.firmaId).toBe(f1.firmaId);
    const mia = await json(await miaFirma(req(`${B}/b/${slug}/mia-firma`, { headers: kf }), ctx({ slug })));
    expect(mia.firma.messaggioHtml).toBe("Auguri di nuovo");
    expect(mia.firma.stile).toEqual({ font: "poppins", colore: "#FF0000", dimensione: "l" });
    expect(mia.firma.tokenModifica).toBeUndefined();
    const url = mia.firma.immagine.url as string;
    const [, , , , idImg, nomeImg] = url.split("/");
    const rimg = await immagine(req(`http://localhost${url}`), ctx({ id: idImg, nome: nomeImg }));
    expect(rimg.headers.get("content-type")).toBe("image/png");

    const pub2 = await json(await pubblico(req(`${B}/b/${slug}`), ctx({ slug })));
    expect(pub2.biglietto.nFirme).toBe(1);
    expect(pub2.firme[0].nome).toBe("");
    const org = await json(await firmeOrg(req(`${B}/biglietti/${id}/firme`, { headers: hu }), ctx({ id })));
    expect(org.firme[0].nome).toBe("Luca");
  });

  it("rifiuta firme vuote, troppo lunghe o senza nome; immagini non valide", async () => {
    const { id, h } = await nuovaBozza();
    const slug = `prova-limiti-${Date.now().toString(36)}`;
    await salva(req(`${B}/biglietti/${id}`, { method: "PATCH", headers: h, body: { dettagli: dettagli(slug), copertina: { modelloId: "auguri-neutro" } } }), ctx({ id }));
    await pubblica(req(`${B}/biglietti/${id}/pubblica`, { method: "POST", headers: { ...h, "x-uid-prova": "org-2" }, body: {} }), ctx({ id }));
    const kf = { "x-chiave-firmatario": "b".repeat(43) };
    const base = { messaggioHtml: "Ciao", daParteDi: "Io", nome: "Io" };
    const prova = (body: unknown) => firma(req(`${B}/b/${slug}/firma`, { method: "POST", headers: kf, body }), ctx({ slug }));
    expect((await prova({ ...base, messaggioHtml: "<b> </b>" })).status).toBe(400);
    expect((await prova({ ...base, messaggioHtml: "x".repeat(1001) })).status).toBe(400);
    expect((await prova({ ...base, nome: "" })).status).toBe(400);
    expect((await prova({ ...base, email: "non-email" })).status).toBe(400);
    expect((await prova({ ...base, immagine: { tipo: "caricata", dataUrl: "data:image/png;base64,SGVsbG8=" } })).status).toBe(400);
    expect((await prova({ ...base, immagine: { tipo: "giphy", url: "https://evil.example.com/x.gif" } })).status).toBe(400);
    expect((await prova({ ...base, messaggioHtml: "x".repeat(1000) })).status).toBe(200);
    // senza chiave del firmatario
    expect((await firma(req(`${B}/b/${slug}/firma`, { method: "POST", body: base }), ctx({ slug }))).status).toBe(400);
  });

  it("copertina con immagine caricata, e data passata blocca la pubblicazione", async () => {
    const { id, h } = await nuovaBozza();
    const c = await json(await copertina(req(`${B}/biglietti/${id}/copertina`, { method: "POST", headers: h, body: { modelloId: "foto-intera", dataUrl: PNG_1PX } }), ctx({ id })));
    expect(c.ok).toBe(true);
    expect(c.biglietto.copertina.immagineUrl).toMatch(new RegExp(`^/api/img/b/${id}/c-`));
    const passato = { ...dettagli(`passato-${Date.now().toString(36)}`), data: "2020-01-01" };
    const r = await salva(req(`${B}/biglietti/${id}`, { method: "PATCH", headers: h, body: { dettagli: passato } }), ctx({ id }));
    expect(r.status).toBe(400);
    expect((await json(r)).campi.data).toBeTruthy();
    // bozza senza dettagli: non si pubblica
    const p = await pubblica(req(`${B}/biglietti/${id}/pubblica`, { method: "POST", headers: { ...h, "x-uid-prova": "o" }, body: {} }), ctx({ id }));
    expect(p.status).toBe(409);
  });
});
