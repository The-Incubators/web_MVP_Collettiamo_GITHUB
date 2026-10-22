import type { Prodotto, ProdottoColletta } from "../tipi";

export function daProdotto(p: Prodotto): ProdottoColletta {
  return {
    prodottoId: p.slug,
    nome: p.nome,
    prezzoCent: p.prezzoCent,
    consegnaGiorni: p.consegnaGiorni,
    urlEsterno: p.urlEsterno,
    immagine: p.immagine,
  };
}

/** Lo stesso regalo: stesso prodotto del catalogo, oppure stesso nome, prezzo e link. */
export function stessoRegalo(a: ProdottoColletta, b: ProdottoColletta): boolean {
  if (a.prodottoId && b.prodottoId) return a.prodottoId === b.prodottoId;
  return a.nome.trim().toLowerCase() === b.nome.trim().toLowerCase() && a.prezzoCent === b.prezzoCent && a.urlEsterno === b.urlEsterno;
}

export function contiene(lista: ProdottoColletta[], p: ProdottoColletta): boolean {
  return lista.some((x) => stessoRegalo(x, p));
}

/** Aggiunge senza duplicare. */
export function conRegalo(lista: ProdottoColletta[], p: ProdottoColletta): ProdottoColletta[] {
  return contiene(lista, p) ? lista : [...lista, p];
}

const formatoGiorno = new Intl.DateTimeFormat("it-IT", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" });

/** "15 ottobre 2026" */
export function testoGiornoRilevazione(iso: string): string {
  return formatoGiorno.format(new Date(`${iso}T12:00:00Z`));
}

/** I giorni di rilevazione dei prezzi del catalogo: "14 ottobre 2026", "14 e 15 ottobre 2026" oppure "14, 15 e 16 ottobre 2026". */
export function testoRilevazioneCatalogo(prodotti: { rilevatoIl?: string }[]): string {
  const giorni = [...new Set(prodotti.map((p) => p.rilevatoIl).filter((x): x is string => !!x))].sort();
  if (giorni.length === 0) return "";
  if (giorni.length === 1) return testoGiornoRilevazione(giorni[0]);
  const prima = testoGiornoRilevazione(giorni[0]);
  const ultima = testoGiornoRilevazione(giorni[giorni.length - 1]);
  const stessoMese = prima.split(" ").slice(1).join(" ") === ultima.split(" ").slice(1).join(" ");
  if (!stessoMese) return `dal ${prima} al ${ultima}`;
  const numeri = giorni.map((g) => testoGiornoRilevazione(g).split(" ")[0]);
  return `${numeri.slice(0, -1).join(", ")} e ${ultima}`;
}

/** "Lampade da tavolo" → "lampade-da-tavolo": serve a mettere la sottocategoria nell'indirizzo del filtro. */
export function chiaveSottocategoria(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
