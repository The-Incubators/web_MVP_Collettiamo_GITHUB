// Che cosa trova Google (docs/product/gifty/Gifty-ingressi-e-uscite.md §1.1): le pagine pubbliche e le schede prodotto.
// Le pagine personali (account, gruppi, biglietti, procedure) restano fuori: noindex sulla pagina e, dove non serve
// l'anteprima nelle chat, anche fuori dal robots.txt.

import type { Metadata } from "next";

/** Pagine pubbliche fisse della sitemap, con la loro priorità. */
export const PAGINE_PUBBLICHE: { percorso: string; priorita: number }[] = [
  { percorso: "/", priorita: 1 },
  { percorso: "/idee", priorita: 0.9 },
  { percorso: "/catalogo", priorita: 0.9 },
  { percorso: "/regalo-di-gruppo", priorita: 0.8 },
  { percorso: "/biglietto", priorita: 0.8 },
  { percorso: "/psicologia-del-dono", priorita: 0.7 },
  { percorso: "/privacy", priorita: 0.2 },
  { percorso: "/termini", priorita: 0.2 },
];

/**
 * Percorsi chiusi ai motori nel robots.txt. Non ci sono /c/ e /b/: i link dei gruppi e dei biglietti devono restare
 * leggibili dalle anteprime di WhatsApp; li tiene fuori da Google il noindex sulla pagina.
 */
export const PERCORSI_CHIUSI = [
  "/api/",
  "/account",
  "/accedi",
  "/backoffice",
  "/crea",
  "/gestisci/",
  "/biglietto/nuovo",
  "/preferiti",
  "/reminder",
  "/le-mie-collette",
];

/** La foto della home: l'anteprima di chi condivide una pagina del sito. Non è una foto Amazon. */
export const IMMAGINE_CONDIVISIONE = { url: "/home/scena-desktop.jpg", width: 1774, height: 887, alt: "Due biglietti su un tavolo uniti da un nastro arancio" };

/** Titolo, descrizione, indirizzo canonico e anteprima per una pagina pubblica. */
export function metaPubblica({ titolo, descrizione, percorso }: { titolo: string; descrizione: string; percorso: string }): Metadata {
  return {
    title: titolo,
    description: descrizione,
    alternates: { canonical: percorso },
    openGraph: {
      type: "website",
      locale: "it_IT",
      siteName: "Gifty",
      url: percorso,
      title: titolo,
      description: descrizione,
      images: [IMMAGINE_CONDIVISIONE],
    },
    twitter: { card: "summary_large_image", title: titolo, description: descrizione, images: [IMMAGINE_CONDIVISIONE.url] },
  };
}

/** Pagine utili da visitare ma da non mettere nei risultati (dipendono dai parametri o sono un passaggio). */
export const NON_INDICIZZARE: Metadata["robots"] = { index: false, follow: true };
