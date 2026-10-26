import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import catalogo from "../dati/catalogo-amazon.json";
import { ErroreArchivio, leggiFoglio, leggiZip } from "./excel";
import { colonneMancanti, rigaInCandidato } from "./valida";

const XLSX = "catalogo_amazon_evergreen/catalogo_amazon_evergreen_viaggio_creator_50_prodotti.xlsx";

/** Uno zip minimo «stored» (senza compressione) con i file dati. */
function zipStored(file: Record<string, string>): Uint8Array {
  const enc = new TextEncoder();
  const locali: Uint8Array[] = [];
  const centrali: Uint8Array[] = [];
  let offset = 0;
  for (const [nome, testo] of Object.entries(file)) {
    const n = enc.encode(nome);
    const d = enc.encode(testo);
    const l = new DataView(new ArrayBuffer(30));
    l.setUint32(0, 0x04034b50, true);
    l.setUint32(18, d.length, true);
    l.setUint32(22, d.length, true);
    l.setUint16(26, n.length, true);
    locali.push(new Uint8Array(l.buffer), n, d);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true);
    c.setUint32(20, d.length, true);
    c.setUint32(24, d.length, true);
    c.setUint16(28, n.length, true);
    c.setUint32(42, offset, true);
    centrali.push(new Uint8Array(c.buffer), n);
    offset += 30 + n.length + d.length;
  }
  const lungCentrale = centrali.reduce((s, x) => s + x.length, 0);
  const e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true);
  e.setUint16(8, Object.keys(file).length, true);
  e.setUint16(10, Object.keys(file).length, true);
  e.setUint32(12, lungCentrale, true);
  e.setUint32(16, offset, true);
  const parti = [...locali, ...centrali, new Uint8Array(e.buffer)];
  const out = new Uint8Array(parti.reduce((s, x) => s + x.length, 0));
  let p = 0;
  for (const x of parti) {
    out.set(x, p);
    p += x.length;
  }
  return out;
}

describe("lettura del pacchetto dell'agente", () => {
  it("legge il vero Excel dell'agente come lo script Python", async () => {
    const righe = await leggiFoglio(new Uint8Array(readFileSync(XLSX)));
    expect(righe).toHaveLength(50);
    expect(colonneMancanti(righe)).toEqual([]);
    const esiti = righe.map(rigaInCandidato);
    expect(esiti.filter((e) => !e.ok)).toEqual([]);
    // stessi valori del catalogo generato da scripts/importa_catalogo.py
    for (const e of esiti) {
      if (!e.ok) continue;
      const atteso = (catalogo as { id: string; nome: string; prezzoCent: number; asin: string; rilevatoIl: string; temi: string[]; destinatari: string[] }[]).find(
        (p) => p.id === e.dati.idOrigine,
      );
      expect(atteso, e.dati.idOrigine).toBeDefined();
      expect(e.dati).toMatchObject({ nome: atteso!.nome, prezzoCent: atteso!.prezzoCent, asin: atteso!.asin, rilevatoIl: atteso!.rilevatoIl, temi: atteso!.temi, destinatari: atteso!.destinatari });
    }
  });

  it("apre uno zip senza compressione, salta le cartelle", async () => {
    const z = zipStored({ "cartella/": "", "cartella/a.txt": "ciao", "b.txt": "àè" });
    const file = await leggiZip(z);
    expect([...file.keys()]).toEqual(["cartella/a.txt", "b.txt"]);
    expect(new TextDecoder().decode(file.get("b.txt"))).toBe("àè");
  });

  it("legge stringhe in linea ed entità XML", async () => {
    const foglio =
      '<worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Nome prodotto</t></is></c><c r="B1" t="inlineStr"><is><t>Prezzo</t></is></c></row>' +
      '<row r="2"><c r="A2" t="inlineStr"><is><t>Tazza &amp; piattino &#8364;</t></is></c><c r="B2"><v>12.5</v></c></row></sheetData></worksheet>';
    const righe = await leggiFoglio(zipStored({ "xl/worksheets/sheet1.xml": foglio }));
    expect(righe).toEqual([{ "Nome prodotto": "Tazza & piattino €", Prezzo: "12.5" }]);
  });

  it("rifiuta un file che non è un archivio", async () => {
    await expect(leggiZip(new TextEncoder().encode("non sono uno zip, solo testo qualunque"))).rejects.toBeInstanceOf(ErroreArchivio);
  });
});
