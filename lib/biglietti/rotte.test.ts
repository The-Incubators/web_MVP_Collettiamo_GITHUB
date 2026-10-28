// Il percorso completo del biglietto sulle rotte server, nella modalità senza Firebase (archivio in memoria).

import { describe, expect, it } from "vitest";
import { POST as creaBozza } from "@/app/api/biglietti/route";
import { GET as leggi, PATCH as salva } from "@/app/api/biglietti/[id]/route";
import { GET as verificaSlug } from "@/app/api/biglietti/slug/route";
import { POST as pubblica } from "@/app/api/biglietti/[id]/pubblica/route";
import { POST as copertina } from "@/app/api/biglietti/[id]/copertina/route";
import { GET as firmeOrg } from "@/app/api/biglietti/[id]/firme/route";
import { DELETE as eliminaOrg, PATCH as moderaOrg } from "@/app/api/biglietti/[id]/firme/[firmaId]/route";
import { POST as consegna } from "@/app/api/biglietti/[id]/consegna/route";
import { DELETE as togliMusica, POST as caricaMusica } from "@/app/api/biglietti/[id]/musica/route";
import { GET as audio } from "@/app/api/audio/b/[id]/[nome]/route";
import { GET as pubblico } from "@/app/api/b/[slug]/route";
import { DELETE as eliminaFirma, POST as firma } from "@/app/api/b/[slug]/firma/route";
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
    const corpo = { messaggioHtml: "Auguri <i>Nico</i>!<img src=x onerror=alert(1)>", stile: { font: "poppins", colore: "#ff0000", dimensione: "l" }, immagine: { tipo: "caricata", dataUrl: PNG_1PX, larghezza: 1, altezza: 1 }, daParteDi: "Luca", ruolo: "  Amico del liceo, da sempre e per sempre, insieme  ", nome: "Luca", cognome: "", email: "" };
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
    // il ruolo si vede sul biglietto: ripulito e tagliato a 40 caratteri
    expect(pub2.firme[0].ruolo).toBe("Amico del liceo, da sempre e per sempre,");
    const org = await json(await firmeOrg(req(`${B}/biglietti/${id}/firme`, { headers: hu }), ctx({ id })));
    expect(org.firme[0].nome).toBe("Luca");
  });

  it("bacheca: colore del bigliettino; chi ha firmato elimina il suo messaggio", async () => {
    const { id, h } = await nuovaBozza();
    const slug = `prova-bacheca-${Date.now().toString(36)}`;
    await salva(req(`${B}/biglietti/${id}`, { method: "PATCH", headers: h, body: { dettagli: dettagli(slug), copertina: { modelloId: "auguri-neutro" } } }), ctx({ id }));
    await pubblica(req(`${B}/biglietti/${id}/pubblica`, { method: "POST", headers: { ...h, "x-uid-prova": "org-3" }, body: {} }), ctx({ id }));
    const kf = { "x-chiave-firmatario": "c".repeat(43) };
    const base = { messaggioHtml: "Auguri!", daParteDi: "Anna", nome: "Anna", immagine: { tipo: "caricata", dataUrl: PNG_1PX, larghezza: 1, altezza: 1 } };
    const manda = (body: unknown) => firma(req(`${B}/b/${slug}/firma`, { method: "POST", headers: kf, body }), ctx({ slug }));
    await manda({ ...base, coloreNota: "#dde3e4" });
    const mia = async () => (await json(await miaFirma(req(`${B}/b/${slug}/mia-firma`, { headers: kf }), ctx({ slug })))).firma;
    // un colore che non è della carta non si salva
    expect((await mia()).coloreNota).toBeNull();
    await manda({ ...base, immagine: { tipo: "mantieni" }, coloreNota: "#ddf3e4" });
    expect((await mia()).coloreNota).toBe("#DDF3E4");
    // dalla vecchia pagina (senza colore) il colore resta quello di prima
    await manda({ ...base, immagine: { tipo: "mantieni" } });
    expect((await mia()).coloreNota).toBe("#DDF3E4");
    const url = (await mia()).immagine.url as string;
    const [, , , , idImg, nomeImg] = url.split("/");

    const r = await json(await eliminaFirma(req(`${B}/b/${slug}/firma`, { method: "DELETE", headers: kf }), ctx({ slug })));
    expect(r.eliminata).toBe(true);
    expect(await mia()).toBeNull();
    expect((await json(await pubblico(req(`${B}/b/${slug}`), ctx({ slug })))).biglietto.nFirme).toBe(0);
    // la foto se ne va con il messaggio
    expect((await immagine(req(`http://localhost${url}`), ctx({ id: idImg, nome: nomeImg }))).status).toBe(404);
    // una seconda volta non c'è più niente da eliminare
    expect((await json(await eliminaFirma(req(`${B}/b/${slug}/firma`, { method: "DELETE", headers: kf }), ctx({ slug })))).eliminata).toBe(false);
  });

  it("chi organizza nasconde, elimina, consegna e riapre", async () => {
    const { id, h } = await nuovaBozza();
    const slug = `prova-consegna-${Date.now().toString(36)}`;
    await salva(req(`${B}/biglietti/${id}`, { method: "PATCH", headers: h, body: { dettagli: dettagli(slug), copertina: { modelloId: "auguri-neutro" } } }), ctx({ id }));
    const hu = { "x-uid-prova": "org-4" };
    await pubblica(req(`${B}/biglietti/${id}/pubblica`, { method: "POST", headers: { ...h, ...hu }, body: {} }), ctx({ id }));
    const firmaDi = async (lettera: string, nome: string, foto = false) =>
      (
        await json(
          await firma(
            req(`${B}/b/${slug}/firma`, {
              method: "POST",
              headers: { "x-chiave-firmatario": lettera.repeat(43) },
              body: { messaggioHtml: `Auguri da ${nome}`, daParteDi: nome, nome, ...(foto ? { immagine: { tipo: "caricata", dataUrl: PNG_1PX, larghezza: 1, altezza: 1 } } : {}) },
            }),
            ctx({ slug }),
          ),
        )
      ).firmaId as string;
    const anna = await firmaDi("d", "Anna");
    const bruno = await firmaDi("e", "Bruno", true);
    const visibili = async () => (await json(await pubblico(req(`${B}/b/${slug}`), ctx({ slug })))).firme.map((f: { daParteDi: string }) => f.daParteDi);
    const modera = (firmaId: string, headers: Record<string, string>, body?: unknown) =>
      moderaOrg(req(`${B}/biglietti/${id}/firme/${firmaId}`, { method: "PATCH", headers, body }), ctx({ id, firmaId }));

    // nascondere: solo chi organizza; il messaggio sparisce dalla vista pubblica ma resta per chi organizza
    expect((await modera(anna, { "x-uid-prova": "intruso" }, { nascosta: true })).status).toBe(404);
    expect((await modera(anna, hu, { nascosta: "sì" })).status).toBe(400);
    expect((await modera("non-esiste", hu, { nascosta: true })).status).toBe(404);
    expect((await modera(anna, hu, { nascosta: true })).status).toBe(200);
    expect(await visibili()).toEqual(["Bruno"]);
    const org = await json(await firmeOrg(req(`${B}/biglietti/${id}/firme`, { headers: hu }), ctx({ id })));
    expect(org.firme.find((f: { id: string }) => f.id === anna).nascosta).toBe(true);
    // se Anna modifica il suo messaggio resta nascosto
    await firmaDi("d", "Anna");
    expect(await visibili()).toEqual(["Bruno"]);
    await modera(anna, hu, { nascosta: false });
    expect((await visibili()).sort()).toEqual(["Anna", "Bruno"]);

    // consegna: nessuno scrive più, la rivelazione si può ancora cambiare, il resto no
    expect((await consegna(req(`${B}/biglietti/${id}/consegna`, { method: "POST", headers: { "x-uid-prova": "intruso" }, body: { azione: "consegna" } }), ctx({ id }))).status).toBe(404);
    expect((await consegna(req(`${B}/biglietti/${id}/consegna`, { method: "POST", headers: hu, body: { azione: "boh" } }), ctx({ id }))).status).toBe(400);
    const c = await json(await consegna(req(`${B}/biglietti/${id}/consegna`, { method: "POST", headers: hu, body: { azione: "consegna" } }), ctx({ id })));
    expect(c.biglietto.stato).toBe("consegnato");
    expect(c.biglietto.consegnatoIl).toBeGreaterThan(0);
    const tardi = await firma(req(`${B}/b/${slug}/firma`, { method: "POST", headers: { "x-chiave-firmatario": "f".repeat(43) }, body: { messaggioHtml: "Tardi", daParteDi: "Carla", nome: "Carla" } }), ctx({ slug }));
    expect(tardi.status).toBe(409);
    const riv = await json(await salva(req(`${B}/biglietti/${id}`, { method: "PATCH", headers: hu, body: { rivelazione: "film" } }), ctx({ id })));
    expect(riv.biglietto.rivelazione).toBe("film");
    expect((await json(await pubblico(req(`${B}/b/${slug}`), ctx({ slug })))).biglietto.rivelazione).toBe("film");
    expect((await salva(req(`${B}/biglietti/${id}`, { method: "PATCH", headers: hu, body: { rivelazione: "griglia", colonne: 3 } }), ctx({ id }))).status).toBe(409);

    // dopo la consegna chi organizza può ancora eliminare (con la foto); nFirme scende
    const conFoto = (await json(await firmeOrg(req(`${B}/biglietti/${id}/firme`, { headers: hu }), ctx({ id })))).firme.find((f: { id: string }) => f.id === bruno);
    const [, , , , idImg, nomeImg] = (conFoto.immagine.url as string).split("/");
    expect((await eliminaOrg(req(`${B}/biglietti/${id}/firme/${bruno}`, { method: "DELETE", headers: { "x-uid-prova": "intruso" } }), ctx({ id, firmaId: bruno }))).status).toBe(404);
    expect((await json(await eliminaOrg(req(`${B}/biglietti/${id}/firme/${bruno}`, { method: "DELETE", headers: hu }), ctx({ id, firmaId: bruno })))).eliminata).toBe(true);
    expect((await immagine(req(`http://localhost${conFoto.immagine.url}`), ctx({ id: idImg, nome: nomeImg }))).status).toBe(404);
    const dopo = await json(await pubblico(req(`${B}/b/${slug}`), ctx({ slug })));
    expect(dopo.biglietto.nFirme).toBe(1);
    expect(dopo.firme.map((f: { daParteDi: string }) => f.daParteDi)).toEqual(["Anna"]);

    // riaprire: si torna a scrivere
    const r = await json(await consegna(req(`${B}/biglietti/${id}/consegna`, { method: "POST", headers: hu, body: { azione: "riapri" } }), ctx({ id })));
    expect(r.biglietto.stato).toBe("aperto");
    expect(r.biglietto.consegnatoIl).toBeNull();
    expect((await firma(req(`${B}/b/${slug}/firma`, { method: "POST", headers: { "x-chiave-firmatario": "f".repeat(43) }, body: { messaggioHtml: "Eccomi", daParteDi: "Carla", nome: "Carla" } }), ctx({ slug }))).status).toBe(200);
  });

  it("musica: carica, si ascolta anche a pezzi, si sostituisce e si toglie", async () => {
    const { id, h } = await nuovaBozza();
    const slug = `prova-musica-${Date.now().toString(36)}`;
    await salva(req(`${B}/biglietti/${id}`, { method: "PATCH", headers: h, body: { dettagli: dettagli(slug), copertina: { modelloId: "auguri-neutro" } } }), ctx({ id }));
    await pubblica(req(`${B}/biglietti/${id}/pubblica`, { method: "POST", headers: { ...h, "x-uid-prova": "org-5" }, body: {} }), ctx({ id }));
    // un finto MP3: etichetta ID3 e poi byte qualsiasi
    const mp3 = (n: number) => {
      const b = new Uint8Array(n);
      b.set([0x49, 0x44, 0x33, 0x04]);
      for (let i = 4; i < n; i++) b[i] = i % 251;
      return b;
    };
    const carica = (body: Uint8Array, headers: Record<string, string> = h, nome = "Tanti auguri.mp3") =>
      caricaMusica(new Request(`${B}/biglietti/${id}/musica?nome=${encodeURIComponent(nome)}`, { method: "POST", headers: { "content-type": "audio/mpeg", ...headers }, body: Buffer.from(body) }), ctx({ id }));
    const ascolta = (url: string, range?: string) => {
      const [, , , , idA, nomeA] = url.split("/");
      return audio(new Request(`http://localhost${url}`, { headers: range ? { range } : {} }), ctx({ id: idA, nome: nomeA }));
    };

    expect((await carica(mp3(2000), { "x-chiave-biglietto": "z".repeat(43) })).status).toBe(404);
    expect((await carica(new Uint8Array([0x4f, 0x67, 0x67, 0x53, 1, 2, 3]))).status).toBe(400);
    expect((await carica(mp3(3 * 1024 * 1024 + 1))).status).toBe(413);

    const r1 = await json(await carica(mp3(2000)));
    expect(r1.biglietto.musica).toMatchObject({ nome: "Tanti auguri.mp3", byte: 2000 });
    const url1 = r1.biglietto.musica.url as string;
    // la vista pubblica ha l'indirizzo, non il nome del file
    const pub = await json(await pubblico(req(`${B}/b/${slug}`), ctx({ slug })));
    expect(pub.biglietto.musica).toEqual({ url: url1 });

    const tutto = await ascolta(url1);
    expect(tutto.status).toBe(200);
    expect(tutto.headers.get("content-type")).toBe("audio/mpeg");
    expect(tutto.headers.get("accept-ranges")).toBe("bytes");
    expect(new Uint8Array(await tutto.arrayBuffer())).toEqual(mp3(2000));
    const pezzo = await ascolta(url1, "bytes=0-1");
    expect(pezzo.status).toBe(206);
    expect(pezzo.headers.get("content-range")).toBe("bytes 0-1/2000");
    expect([...new Uint8Array(await pezzo.arrayBuffer())]).toEqual([0x49, 0x44]);
    expect((await ascolta(url1, "bytes=5000-")).status).toBe(416);

    // un'altra musica prende il posto della prima, che sparisce
    const r2 = await json(await carica(mp3(3000), h, "Altra.mp3"));
    expect(r2.biglietto.musica.nome).toBe("Altra.mp3");
    expect((await ascolta(url1)).status).toBe(404);
    // anche dopo la consegna si può cambiare o togliere
    await consegna(req(`${B}/biglietti/${id}/consegna`, { method: "POST", headers: h, body: { azione: "consegna" } }), ctx({ id }));
    const r3 = await json(await togliMusica(req(`${B}/biglietti/${id}/musica`, { method: "DELETE", headers: h }), ctx({ id })));
    expect(r3.biglietto.musica).toBeNull();
    expect((await ascolta(r2.biglietto.musica.url)).status).toBe(404);
    expect((await json(await pubblico(req(`${B}/b/${slug}`), ctx({ slug })))).biglietto.musica).toBeNull();
  });

  it("una bozza non si consegna", async () => {
    const { id, h } = await nuovaBozza();
    expect((await consegna(req(`${B}/biglietti/${id}/consegna`, { method: "POST", headers: h, body: { azione: "consegna" } }), ctx({ id }))).status).toBe(409);
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
