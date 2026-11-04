// I prodotti fatti da Gifty (non da Amazon): stanno qui nel codice e non nel database `prodotti`, perché non hanno
// un link Amazon e non passano dalle collette né da «Trova il regalo». Si vedono per primi nella home nuova
// («I Regali più amati dai nostri clienti…») e nel catalogo, con una scheda tutta loro (SchedaProdottoGifty).

export interface PassoProdottoGifty {
  titolo: string;
  /** le immagini del passo, in public/ (la prima davanti) */
  immagini: string[];
}

export interface ProdottoGifty {
  id: string;
  slug: string;
  nome: string;
  prezzoCent: number;
  descrizione: string;
  /** il voto di Gifty, da 1 a 5: questi prodotti non sono nel backoffice del catalogo */
  stelle: number;
  /** come si crea, in tre passi: le foto, il fumetto, il prodotto finito */
  passi: PassoProdottoGifty[];
  /** dove porta «Provalo con le tue foto (gratis)»: una pagina esterna; null finché non c'è */
  urlProva: string | null;
  /** per i filtri del catalogo, come i prodotti Amazon */
  destinatari: string[];
  temi: string[];
}

const CARTELLA = "/prodotti-gifty/cover-iphone";

export const PRODOTTI_GIFTY: ProdottoGifty[] = [
  {
    // «Prodotto Gifty TEST_1» (4 novembre 2026). Immagini ridotte a 300 px di altezza (circa 3 volte come si vedono).
    id: "GIFTY-TEST-1",
    slug: "cover-iphone-personalizzata",
    nome: "Cover iPhone personalizzata",
    prezzoCent: 3299,
    descrizione: "Le tue foto diventano un fumetto stampato sulla cover del telefono.",
    stelle: 5,
    passi: [
      { titolo: "Le tue foto", immagini: [`${CARTELLA}/foto-1.jpg`, `${CARTELLA}/foto-2.jpg`] },
      { titolo: "Il tuo fumetto", immagini: [`${CARTELLA}/fumetto.jpg`] },
      { titolo: "La tua cover", immagini: [`${CARTELLA}/cover.png`] },
    ],
    urlProva: "https://your-pet-comics.web.app/",
    destinatari: ["uomo", "donna"],
    temi: ["tecnologia"],
  },
];

/** Prende un prodotto Gifty se nel catalogo passa i filtri attivi: per chi, categoria, prezzo e testo cercato. */
export function prodottoGiftyNeiFiltri(
  p: ProdottoGifty,
  f: { per?: string; tema?: string; prezzo?: { minCent: number; maxCent: number }; testo?: string; altriFiltri?: boolean },
): boolean {
  if (f.altriFiltri) return false;
  if (f.per && !p.destinatari.includes(f.per)) return false;
  if (f.tema && !p.temi.includes(f.tema)) return false;
  if (f.prezzo && !(p.prezzoCent > f.prezzo.minCent && p.prezzoCent <= f.prezzo.maxCent)) return false;
  if (f.testo && !`${p.nome} ${p.descrizione}`.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().includes(f.testo)) return false;
  return true;
}
