// Link affiliati ad Amazon.it. Una sola regola, usata ovunque: importazione del catalogo, migrazione dei dati
// già salvati e pulsanti del sito.
//
// La conversione è idempotente: un link già a posto resta identico, un link con il tag sbagliato (o ripetuto)
// diventa un link con un solo tag giusto. Gli altri parametri e il frammento (#…) restano com'erano.
// Si toccano solo i link di amazon.it: ogni altro indirizzo si lascia com'è.

export const TAG_AFFILIATO_AMAZON = "pacestefano77-21";

const HOST_AMAZON_IT = new Set(["amazon.it", "www.amazon.it", "m.amazon.it"]);

export type EsitoLink =
  /** il tag è stato aggiunto o corretto */
  | { stato: "convertito"; url: string }
  /** era già a posto */
  | { stato: "invariato"; url: string }
  /** non c'era il link: creato dal codice ASIN */
  | { stato: "creato"; url: string }
  /** non è un link di amazon.it: non si tocca */
  | { stato: "ignorato"; url: string; motivo: string }
  /** non si capisce come indirizzo: da segnalare, non si tocca */
  | { stato: "malformato"; url: string; motivo: string }
  /** né link né ASIN valido */
  | { stato: "mancante"; motivo: string };

/** Un ASIN è di 10 caratteri maiuscoli e cifre (gli ISBN-10 sono validi: 10 cifre, a volte con una X finale). */
export function asinValido(asin: string | null | undefined): asin is string {
  return typeof asin === "string" && /^[A-Z0-9]{10}$/.test(asin.trim().toUpperCase());
}

export function linkDaAsin(asin: string, tag = TAG_AFFILIATO_AMAZON): string {
  return `https://www.amazon.it/dp/${asin.trim().toUpperCase()}?tag=${tag}`;
}

export function affiliaLink(link: string | null | undefined, asin?: string | null, tag = TAG_AFFILIATO_AMAZON): EsitoLink {
  const t = (link ?? "").trim();
  if (t === "") {
    return asinValido(asin) ? { stato: "creato", url: linkDaAsin(asin, tag) } : { stato: "mancante", motivo: "nessun link e nessun ASIN valido" };
  }
  // Spazi o caratteri di controllo dentro l'indirizzo: non è un link che si possa riscrivere con sicurezza.
  if (/[\s\u0000-\u001f]/.test(t)) return { stato: "malformato", url: t, motivo: "contiene spazi o caratteri di controllo" };

  let u: URL;
  try {
    u = new URL(t);
  } catch {
    return { stato: "malformato", url: t, motivo: "non è un indirizzo valido" };
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return { stato: "malformato", url: t, motivo: `protocollo non supportato (${u.protocol})` };
  if (!HOST_AMAZON_IT.has(u.hostname.toLowerCase())) return { stato: "ignorato", url: t, motivo: `dominio diverso da amazon.it (${u.hostname})` };
  if (u.username || u.password) return { stato: "malformato", url: t, motivo: "contiene credenziali" };

  // Si lavora sul testo e non su URLSearchParams, che riscriverebbe (e altererebbe) gli altri parametri.
  const posFrammento = t.indexOf("#");
  const frammento = posFrammento >= 0 ? t.slice(posFrammento) : "";
  const senzaFrammento = posFrammento >= 0 ? t.slice(0, posFrammento) : t;
  const posQuery = senzaFrammento.indexOf("?");
  const base = posQuery >= 0 ? senzaFrammento.slice(0, posQuery) : senzaFrammento;
  const query = posQuery >= 0 ? senzaFrammento.slice(posQuery + 1) : "";

  const parti: string[] = [];
  let messo = false;
  for (const parte of query === "" ? [] : query.split("&")) {
    if (parte.split("=")[0] === "tag") {
      // il primo tag diventa quello giusto, gli altri (se ci sono) spariscono
      if (!messo) parti.push(`tag=${tag}`);
      messo = true;
    } else {
      parti.push(parte);
    }
  }
  if (!messo) parti.push(`tag=${tag}`);

  const nuovo = `${base}?${parti.join("&")}${frammento}`;
  return nuovo === t ? { stato: "invariato", url: t } : { stato: "convertito", url: nuovo };
}

/** Il link da dare ai pulsanti del sito: affiliato se è di amazon.it, com'è in ogni altro caso. */
export function urlPerAcquisto(url: string | null | undefined): string {
  const esito = affiliaLink(url);
  return esito.stato === "convertito" || esito.stato === "invariato" ? esito.url : (url ?? "");
}

/** `rel` per i link ai prodotti: sponsorizzati (affiliazione), senza passare il referrer. */
export const REL_LINK_PRODOTTO = "sponsored nofollow noopener noreferrer";

/**
 * Il link alla scheda Amazon **senza tag affiliato**, costruito dall'ASIN. Serve all'area riservata, dove si
 * guardano i prodotti per decidere l'ordine: sono clic nostri, non traffico da monetizzare, e l'unico posto
 * del progetto in cui un link ad Amazon non è affiliato (altrove vale sempre `urlPerAcquisto`).
 * L'ASIN si controlla prima di metterlo in un indirizzo; se manca o è storto si ripiega sul link del prodotto.
 */
export function linkSchedaAmazon(asin: string | null | undefined, urlEsterno: string): string {
  return asin && /^[A-Z0-9]{10}$/.test(asin) ? `https://www.amazon.it/dp/${asin}` : urlEsterno;
}

/**
 * La dichiarazione che il Programma Affiliazione Amazon chiede di mostrare sul sito (testo del contratto operativo).
 * Va tenuta nel piè di pagina di ogni pagina con link ai prodotti.
 */
export const DICHIARAZIONE_AFFILIATO_AMAZON = "In qualità di Affiliato Amazon io ricevo un guadagno dagli acquisti idonei.";
