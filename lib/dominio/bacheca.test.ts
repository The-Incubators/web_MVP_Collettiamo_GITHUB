import { describe, expect, it } from "vitest";
import { MODELLI_BIGLIETTO } from "../dati/modelli-biglietto";
import { OCCASIONI_BIGLIETTO } from "../tipi";
import {
  coloreDellaNota,
  coloreNotaValido,
  COLORI_NOTA,
  coloriDelModello,
  coloriValidi,
  dataEventoValida,
  elencoNomi,
  inizialiDi,
  nomeOccasione,
  occasioneBigliettoValida,
  OCCASIONI_EDITOR,
  stileCartaDi,
  STILI_CARTA,
  titoloAnteprima,
  titoloDopoCambioOccasione,
  durataLettura,
  htmlDaTestoSemplice,
  NOME_ESEMPIO,
  rivelazioneValida,
  scurisciValido,
  slugPerFesteggiato,
  testoSu,
  titoloEffettivo,
  titoloPredefinito,
} from "./bacheca";
import { slugBigliettoValido } from "./biglietti";

describe("titolo della bacheca", () => {
  it("ogni occasione ha il suo titolo con il nome", () => {
    for (const o of OCCASIONI_BIGLIETTO) expect(titoloPredefinito(o.valore, "Luca")).toContain("Luca");
    expect(titoloPredefinito("compleanno", "Luca")).toBe("Buon compleanno, Luca!");
  });
  it("senza nome usa quello d'esempio; occasione sconosciuta come «altro»", () => {
    expect(titoloPredefinito("compleanno", "  ")).toContain(NOME_ESEMPIO);
    expect(titoloPredefinito("boh", "Luca")).toBe("Per Luca");
  });
  it("il titolo scritto vince sul predefinito", () => {
    expect(titoloEffettivo("  Evviva!  ", "compleanno", "Luca")).toBe("Evviva!");
    expect(titoloEffettivo("", "pensione", "Luca")).toBe("Buona pensione, Luca!");
  });
});

describe("colori", () => {
  it("ogni tema ha tre colori validi", () => {
    for (const m of MODELLI_BIGLIETTO) expect(coloriValidi(coloriDelModello(m))).not.toBeNull();
  });
  it("rifiuta colori incompleti o non esadecimali", () => {
    expect(coloriValidi({ sfondo1: "#fff", sfondo2: "#FFFFFF", accento: "#000000" })).toBeNull();
    expect(coloriValidi({ sfondo1: "#ffffff", sfondo2: "#FFFFFF" })).toBeNull();
    expect(coloriValidi({ sfondo1: "#aabbcc", sfondo2: "#FFFFFF", accento: "#000000" })).toEqual({ sfondo1: "#AABBCC", sfondo2: "#FFFFFF", accento: "#000000" });
  });
  it("testo leggibile: bianco sullo scuro, scuro sul chiaro", () => {
    expect(testoSu("#033922")).toBe("#FFFFFF");
    expect(testoSu("#FFF3C4")).toBe("#16241F");
    expect(testoSu("rosso")).toBe("#16241F");
  });
});

describe("valori dal browser", () => {
  it("scurisci resta tra 0 e 0,8", () => {
    expect(scurisciValido(2)).toBe(0.8);
    expect(scurisciValido(-1)).toBe(0);
    expect(scurisciValido("x")).toBe(0.3);
    expect(scurisciValido(0.456)).toBe(0.46);
  });
  it("rivelazione: solo i quattro modi, altrimenti storie", () => {
    expect(rivelazioneValida("film")).toBe("film");
    expect(rivelazioneValida("diapositive")).toBe("storie");
  });
  it("rivelazione: più il messaggio è lungo, più resta a schermo, ma con un tetto", () => {
    expect(durataLettura("")).toBe(4000);
    expect(durataLettura("x".repeat(100))).toBe(8500);
    expect(durataLettura("x".repeat(1000))).toBe(14000);
    expect(durataLettura("ciao", true)).toBe(durataLettura("ciao") + 1500);
  });
  it("data dell'evento facoltativa e nel formato AAAA-MM-GG", () => {
    expect(dataEventoValida("2026-11-03")).toBe("2026-11-03");
    expect(dataEventoValida("03/11/2026")).toBe("");
    expect(dataEventoValida(undefined)).toBe("");
  });
  it("il benvenuto è testo: niente tag, gli a capo restano", () => {
    expect(htmlDaTestoSemplice("Ciao <b>tutti</b>\nA presto")).toBe("Ciao &lt;b&gt;tutti&lt;/b&gt;<br>A presto");
  });
});

describe("link dal nome del festeggiato", () => {
  it("nome leggibile + codice di 6 caratteri, sempre valido", () => {
    const s = slugPerFesteggiato("Nicòla Rossi", () => 0);
    expect(s).toBe("nicola-rossi-aaaaaa");
    expect(slugBigliettoValido(s)).toBe(true);
  });
  it("senza lettere usabili parte da «biglietto»", () => {
    const s = slugPerFesteggiato("🎉", () => 0.999);
    expect(s).toBe("biglietto-999999");
    expect(slugBigliettoValido(s)).toBe(true);
  });
});

describe("colore dei bigliettini", () => {
  it("ammette solo i colori della carta, in maiuscolo", () => {
    expect(coloreNotaValido(COLORI_NOTA[2].toLowerCase())).toBe(COLORI_NOTA[2]);
    expect(coloreNotaValido("#000000")).toBeNull();
    expect(coloreNotaValido(undefined)).toBeNull();
  });
  it("le firme senza colore lo prendono a turno dalla posizione", () => {
    expect(coloreDellaNota(null, 0)).toBe(COLORI_NOTA[0]);
    expect(coloreDellaNota(undefined, COLORI_NOTA.length + 1)).toBe(COLORI_NOTA[1]);
    expect(coloreDellaNota(COLORI_NOTA[4], 0)).toBe(COLORI_NOTA[4]);
  });
});

describe("occasioni dell'editor (elenco unico)", () => {
  it("sono le dieci, ognuna con il titolo che contiene il nome", () => {
    expect(OCCASIONI_EDITOR).toHaveLength(10);
    for (const o of OCCASIONI_EDITOR) expect(titoloPredefinito(o.id, "Luca")).toContain("Luca");
    expect(titoloPredefinito("natale", "Luca")).toBe("Buon Natale, Luca!");
  });
  it("il server accetta le dieci e quelle di prima, nient'altro", () => {
    expect(occasioneBigliettoValida("san-valentino")).toBe(true);
    expect(occasioneBigliettoValida("condoglianze")).toBe(true);
    expect(occasioneBigliettoValida("boh")).toBe(false);
    expect(occasioneBigliettoValida(3)).toBe(false);
  });
  it("il nome da mostrare, anche per le occasioni di prima", () => {
    expect(nomeOccasione("san-valentino")).toBe("San Valentino");
    expect(nomeOccasione("guarisci")).toBe("Rimettiti presto");
  });
});

describe("cambio dell'occasione dalla gestione", () => {
  it("il titolo proposto segue la nuova occasione", () => {
    expect(titoloDopoCambioOccasione("Buon compleanno, Marta!", "compleanno", "laurea", "Marta")).toBe("Complimenti per la laurea, Marta!");
    expect(titoloDopoCambioOccasione("", "compleanno", "natale", "Marta")).toBe("Buon Natale, Marta!");
  });
  it("il titolo scritto da chi organizza resta", () => {
    expect(titoloDopoCambioOccasione("Evviva Marta", "compleanno", "laurea", "Marta")).toBe("Evviva Marta");
  });
});

describe("stili della carta e nomi", () => {
  it("quattro stili con colori validi, riconosciuti dal modello", () => {
    expect(STILI_CARTA.map((s) => s.nome)).toEqual(["Avorio", "Menta", "Pesca", "Verde"]);
    for (const s of STILI_CARTA) expect(coloriValidi(s.colori)).not.toBeNull();
    expect(stileCartaDi("carta-menta")?.nome).toBe("Menta");
    expect(stileCartaDi("compleanno-palloncini")).toBeNull();
  });
  it("i modelli degli stili esistono, così il server li accetta", () => {
    for (const s of STILI_CARTA) expect(MODELLI_BIGLIETTO.some((m) => m.id === s.id)).toBe(true);
  });
  it("i nomi in fila con la «e», senza doppioni né vuoti", () => {
    expect(elencoNomi(["Chiara", "Paolo", " ", "Chiara", "Luca"])).toBe("Chiara, Paolo e Luca");
    expect(elencoNomi(["Chiara"])).toBe("Chiara");
    expect(elencoNomi([])).toBe("");
  });
  it("le iniziali sono le prime due lettere", () => {
    expect(inizialiDi(" chiara")).toBe("CH");
    expect(inizialiDi("É")).toBe("É");
  });
});

describe("titolo dell'anteprima dell'editor", () => {
  it("senza nome toglie il nome, con il nome è il predefinito", () => {
    expect(titoloAnteprima("compleanno", "")).toBe("Buon compleanno!");
    expect(titoloAnteprima("compleanno", "Marta")).toBe("Buon compleanno, Marta!");
    expect(titoloAnteprima("altro", " ")).toBe("Auguri!");
  });
});

describe("colori e font, effetto all'apertura", () => {
  it("accetta solo i caratteri del titolo in elenco", async () => {
    const { fontTitoloValido, FONT_TITOLO } = await import("./bacheca");
    for (const f of FONT_TITOLO) expect(fontTitoloValido(f)).toBe(f);
    expect(fontTitoloValido("comic-sans")).toBeNull();
    expect(fontTitoloValido(42)).toBeNull();
  });

  it("accetta qualsiasi colore #RRGGBB, in maiuscolo", async () => {
    const { coloreValido } = await import("./bacheca");
    expect(coloreValido("#2a9d8f")).toBe("#2A9D8F");
    expect(coloreValido("red")).toBeNull();
    expect(coloreValido("#fff")).toBeNull();
  });

  it("l'effetto sconosciuto o mancante torna ai coriandoli, come nei biglietti di prima", async () => {
    const { effettoValido, effettoDi } = await import("./bacheca");
    expect(effettoValido("palloncini")).toBe("palloncini");
    expect(effettoValido(undefined)).toBe("coriandoli");
    expect(effettoValido("fuochi")).toBe("coriandoli");
    expect(effettoDi("nessuno").emoji).toEqual([]);
    expect(effettoDi("palloncini").sale).toBe(true);
  });

  it("il modello su misura esiste, così la foto di sfondo si può caricare", async () => {
    const { MODELLO_LIBERO } = await import("./bacheca");
    expect(MODELLI_BIGLIETTO.some((m) => m.id === MODELLO_LIBERO)).toBe(true);
  });
});
