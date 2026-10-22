import { describe, expect, it } from "vitest";
import { TAG_AFFILIATO_AMAZON as TAG } from "../dominio/amazon";
import { creaBackup, daScrivere, eseguiPiano, pianifica, ripristina, type Archivio, type VoceLink } from "./migrazioneLink";

function archivioFinto(iniziali: VoceLink[]) {
  const dati = new Map(iniziali.map((v) => [`${v.percorso}#${v.campo}`, { ...v }]));
  const scritture: string[] = [];
  const archivio: Archivio = {
    async leggi() {
      return [...dati.values()].map((v) => ({ ...v }));
    },
    async scrivi(percorso, campo, valore) {
      const v = dati.get(`${percorso}#${campo}`);
      if (!v) throw new Error("documento inesistente");
      v.attuale = valore;
      scritture.push(`${percorso}#${campo}`);
    },
  };
  return { archivio, dati, scritture };
}

const voce = (percorso: string, attuale: string | null, extra: Partial<VoceLink> = {}): VoceLink => ({
  percorso,
  campo: "urlEsterno",
  attuale,
  asin: null,
  ambito: "catalogo",
  daCatalogo: true,
  ...extra,
});

const CASI: VoceLink[] = [
  voce("prodotti/semplice", "https://www.amazon.it/dp/B0C4P1MF8V", { asin: "B0C4P1MF8V" }),
  voce("prodotti/parametri", "https://www.amazon.it/dp/B0F6V789N8?th=1&psc=1#recensioni"),
  voce("prodotti/tag-vecchio", "https://www.amazon.it/dp/B0C8HD6F5W?tag=altro-21&th=1"),
  voce("prodotti/gia-a-posto", `https://www.amazon.it/dp/B07J5PGC8W?tag=${TAG}`),
  voce("prodotti/solo-asin", null, { asin: "B0B8P52RKW" }),
  voce("prodotti/vuoto", "", { asin: "B0B8P52RK" }),
  voce("prodotti/non-amazon", "https://negozio-esempio.it/p/lampada", { asin: "B0C4P1MF8V" }),
  voce("prodotti/malformato", "https:/www.amazon it/dp/B0C4P1MF8V"),
  voce("collette/c1", "https://www.amazon.it/dp/B0C4P1MF8V", { campo: "prodotto.urlEsterno", ambito: "colletta" }),
  voce("collette/c1/proposte/p1", "https://www.amazon.it/dp/B0C4P1MF8V", { campo: "prodotto.urlEsterno", ambito: "proposta", daCatalogo: false }),
];

describe("migrazione dei link affiliati", () => {
  it("decide caso per caso", () => {
    const p = pianifica(CASI);
    const per = Object.fromEntries(p.decisioni.map((d) => [d.percorso, d]));
    expect(per["prodotti/semplice"]).toMatchObject({ stato: "convertito", dopo: `https://www.amazon.it/dp/B0C4P1MF8V?tag=${TAG}` });
    expect(per["prodotti/parametri"]).toMatchObject({ stato: "convertito", dopo: `https://www.amazon.it/dp/B0F6V789N8?th=1&psc=1&tag=${TAG}#recensioni` });
    expect(per["prodotti/tag-vecchio"]).toMatchObject({ stato: "convertito", dopo: `https://www.amazon.it/dp/B0C8HD6F5W?tag=${TAG}&th=1` });
    expect(per["prodotti/gia-a-posto"]).toMatchObject({ stato: "invariato", dopo: null });
    expect(per["prodotti/solo-asin"]).toMatchObject({ stato: "creato", prima: null, dopo: `https://www.amazon.it/dp/B0B8P52RKW?tag=${TAG}` });
    expect(per["prodotti/vuoto"].stato).toBe("mancante");
    expect(per["prodotti/non-amazon"].stato).toBe("ignorato");
    expect(per["prodotti/malformato"].stato).toBe("malformato");
    expect(per["collette/c1"].stato).toBe("convertito");
    expect(per["collette/c1/proposte/p1"].stato).toBe("non-pertinente"); // link scelto a mano
    expect(p.riepilogo).toMatchObject({ convertito: 4, creato: 1, invariato: 1, ignorato: 1, malformato: 1, mancante: 1, "non-pertinente": 1 });
    expect(daScrivere(p)).toHaveLength(5);
  });

  it("scrive solo ciò che deve e solo il campo del link", async () => {
    const { archivio, dati, scritture } = archivioFinto(CASI);
    const r = await eseguiPiano(archivio, pianifica(await archivio.leggi()));
    expect(r.scritti).toBe(5);
    expect(new Set(scritture).has("prodotti/non-amazon#urlEsterno")).toBe(false);
    expect(new Set(scritture).has("prodotti/malformato#urlEsterno")).toBe(false);
    expect(new Set(scritture).has("collette/c1/proposte/p1#prodotto.urlEsterno")).toBe(false);
    expect(dati.get("prodotti/non-amazon#urlEsterno")?.attuale).toBe("https://negozio-esempio.it/p/lampada");
  });

  it("è idempotente: la seconda esecuzione non scrive nulla", async () => {
    const { archivio, scritture } = archivioFinto(CASI);
    await eseguiPiano(archivio, pianifica(await archivio.leggi()));
    const dopoPrima = scritture.length;
    const secondo = pianifica(await archivio.leggi());
    expect(daScrivere(secondo)).toHaveLength(0);
    expect((await eseguiPiano(archivio, secondo)).scritti).toBe(0);
    expect(scritture).toHaveLength(dopoPrima);
    expect(secondo.riepilogo.convertito).toBe(0);
    expect(secondo.riepilogo.creato).toBe(0);
    // e nessun link ha più di un tag
    for (const v of await archivio.leggi()) if (v.attuale?.includes("amazon.it")) expect(v.attuale.match(/tag=/g)?.length ?? 0).toBeLessThanOrEqual(1);
  });

  it("il backup permette di tornare indietro, senza toccare ciò che è cambiato dopo", async () => {
    const { archivio, dati } = archivioFinto(CASI);
    const originali = new Map(CASI.map((v) => [v.percorso, v.attuale]));
    const piano = pianifica(await archivio.leggi());
    const backup = creaBackup(piano, new Date("2026-10-16T10:00:00Z"));
    expect(backup).toMatchObject({ creatoIl: "2026-10-16T10:00:00.000Z", tag: TAG });
    expect(backup.voci).toHaveLength(5);
    await eseguiPiano(archivio, piano);
    // qualcuno cambia un link dopo la migrazione
    dati.get("prodotti/semplice#urlEsterno")!.attuale = "https://www.amazon.it/dp/B0C4P1MF8V?tag=un-altro-21";
    const r = await ripristina(archivio, backup);
    expect(r).toEqual({ ripristinati: 4, saltati: 1 });
    for (const v of CASI) {
      if (v.percorso === "prodotti/semplice") continue;
      const att = dati.get(`${v.percorso}#${v.campo}`)!.attuale;
      expect(att ?? "").toBe(originali.get(v.percorso) ?? ""); // anche il «solo ASIN» torna vuoto
    }
  });
});
