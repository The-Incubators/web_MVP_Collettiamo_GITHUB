import { archivioBiglietti } from "@/lib/biglietti";
import { senzaSegreti } from "@/lib/biglietti/accesso";
import { bigliettoDelProprietario, corpoJson, errore, risposta, testo } from "@/lib/biglietti/rotte";
import { modelloPerId } from "@/lib/dati/modelli-biglietto";
import {
  coloriDelModello,
  coloriValidi,
  dataEventoValida,
  htmlDaTestoSemplice,
  rivelazioneValida,
  scurisciValido,
  slugPerFesteggiato,
  titoloEffettivo,
} from "@/lib/dominio/bacheca";
import {
  erroriDettagli,
  istanteConsegna,
  MAX_MESSAGGIO_GRUPPO,
  MAX_NOME_BIGLIETTO,
  ripulisciHtml,
  slugBigliettoValido,
  suggerisciSlug,
  testoDaHtml,
  type DatiDettagli,
} from "@/lib/dominio/biglietti";
import type { CopertinaBiglietto } from "@/lib/tipi";
import type { BigliettoServer } from "@/lib/biglietti/tipi";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(richiesta: Request, { params }: Ctx) {
  const { id } = await params;
  const { b, esito } = await bigliettoDelProprietario(id, richiesta);
  if (!b) return esito;
  return risposta({ ok: true, biglietto: senzaSegreti(b) });
}

/**
 * Salva un passo del wizard (o le modifiche dalla gestione). Parti accettate:
 * - dettagli (passo 2): tutti i campi + slug, validati insieme; lo slug si prenota in transazione.
 * - copertina (passo 3): modello, variante, titolo, sottotitolo.
 * - bacheca (wizard V2, /biglietto/nuovo): festeggiato, titolo, benvenuto, data dell'evento, tema, colori, sfondo, rivelazione.
 *   Il link si crea qui dal nome del festeggiato; email e consegna si scelgono dopo, dalla gestione.
 * - colonne.
 */
export async function PATCH(richiesta: Request, { params }: Ctx) {
  const { id } = await params;
  const { b, esito } = await bigliettoDelProprietario(id, richiesta);
  if (!b) return esito;
  if (b.stato === "consegnato") return errore("Il biglietto è già stato consegnato.", 409);
  const c = await corpoJson(richiesta);
  if (!c) return errore("Richiesta non valida.");
  const archivio = archivioBiglietti();
  const patch: Partial<BigliettoServer> = {};

  if (c.dettagli && typeof c.dettagli === "object") {
    const d = c.dettagli as Record<string, unknown>;
    const dati: DatiDettagli = {
      festeggiato: testo(d.festeggiato, 80),
      daParteDi: testo(d.daParteDi, 120),
      destinatario: d.destinatario === "festeggiato" || d.destinatario === "organizzatore" ? d.destinatario : null,
      emailFesteggiato: testo(d.emailFesteggiato, 254),
      emailMia: testo(d.emailMia, 254),
      data: testo(d.data, 10),
      ora: testo(d.ora, 5),
      fuso: testo(d.fuso, 64),
      nome: typeof d.nome === "string" ? d.nome.trim() : "",
    };
    const e = erroriDettagli(dati);
    // Un biglietto già aperto può tenere la sua data anche se nel frattempo è passata solo se non la si cambia.
    const stessaData = b.stato !== "bozza" && dati.data === b.consegna.data && dati.ora === b.consegna.ora && dati.fuso === b.consegna.fuso;
    if (stessaData) {
      delete e.data;
      delete e.consegna;
    }
    if (Object.keys(e).length) return errore("Controlla i dati.", 400, { campi: e });
    const slug = testo(d.slug, 80);
    if (!slugBigliettoValido(slug)) return errore("Il link non è valido.", 400, { campi: { slug: "Il link non è valido." } });
    if (slug !== b.slug && !(await archivio.prenotaSlug(id, slug))) {
      const suggerito = await suggerisciSlug(slug, (s) => archivio.slugOccupato(s, id));
      return errore("Questo nome è già usato.", 409, { campi: { slug: "occupato" }, suggerito });
    }
    const messaggio = ripulisciHtml(typeof d.messaggioGruppo === "string" ? d.messaggioGruppo : "");
    if ([...testoDaHtml(messaggio)].length > MAX_MESSAGGIO_GRUPPO) return errore("Il messaggio per il gruppo è troppo lungo.");
    Object.assign(patch, {
      festeggiato: dati.festeggiato,
      daParteDi: dati.daParteDi,
      destinatario: dati.destinatario,
      emailDestinatario: dati.destinatario === "festeggiato" ? dati.emailFesteggiato : dati.emailMia,
      consegna: { quando: istanteConsegna(dati), fuso: dati.fuso, data: dati.data, ora: dati.ora },
      nome: dati.nome.slice(0, MAX_NOME_BIGLIETTO),
      messaggioGruppo: messaggio,
      // la bozza ricorda anche l'altra email digitata, come il modulo (vedi spec 4.2)
      emailAlternativa: dati.destinatario === "festeggiato" ? dati.emailMia : dati.emailFesteggiato,
    });
  }

  if (c.copertina && typeof c.copertina === "object") {
    const k = c.copertina as Record<string, unknown>;
    const modello = typeof k.modelloId === "string" ? modelloPerId(k.modelloId) : null;
    if (!modello) return errore("Modello non valido.");
    const copertina: CopertinaBiglietto = {
      modelloId: modello.id,
      variante: typeof k.variante === "number" && k.variante >= 1 && k.variante <= 9 ? Math.floor(k.variante) : 1,
      titolo: testo(k.titolo, 80),
      sottotitolo: modello.sottotitolo ? testo(k.sottotitolo, 160) || null : null,
      // l'immagine si cambia solo dalla rotta della copertina: qui si conserva
      immagineUrl: b.copertina.immagineUrl,
    };
    patch.copertina = copertina;
  }

  if (c.bacheca && typeof c.bacheca === "object") {
    const k = c.bacheca as Record<string, unknown>;
    const festeggiato = testo(k.festeggiato, 80);
    if (!festeggiato) return errore("Scrivi per chi è il biglietto.", 400, { campi: { festeggiato: "Scrivi per chi è il biglietto." } });
    const modello = typeof k.modelloId === "string" ? modelloPerId(k.modelloId) : null;
    if (!modello) return errore("Tema non valido.");
    const messaggio = ripulisciHtml(htmlDaTestoSemplice(typeof k.benvenuto === "string" ? k.benvenuto : ""));
    if ([...testoDaHtml(messaggio)].length > MAX_MESSAGGIO_GRUPPO) return errore("Il messaggio di benvenuto è troppo lungo.");
    const titolo = titoloEffettivo(testo(k.titolo, 80), b.occasione, festeggiato);
    // il link nasce dal nome del festeggiato e non cambia più (è già nei messaggi mandati al gruppo)
    if (!b.slug) {
      let slug = "";
      for (let i = 0; i < 5 && !slug; i++) {
        const s = slugPerFesteggiato(festeggiato);
        if (await archivio.prenotaSlug(id, s)) slug = s;
      }
      if (!slug) return errore("Non sono riuscito a creare il link. Riprova.", 503);
      patch.slug = slug;
    }
    Object.assign(patch, {
      festeggiato,
      nome: titolo.slice(0, MAX_NOME_BIGLIETTO),
      messaggioGruppo: messaggio,
      dataEvento: dataEventoValida(k.dataEvento),
      rivelazione: rivelazioneValida(k.rivelazione),
      copertina: {
        ...b.copertina,
        modelloId: modello.id,
        titolo,
        sottotitolo: null,
        colori: coloriValidi(k.colori) ?? coloriDelModello(modello),
        scurisci: scurisciValido(k.scurisci),
      },
    });
  }

  if (c.colonne === 1 || c.colonne === 2 || c.colonne === 3) patch.colonne = c.colonne;

  if (Object.keys(patch).length === 0) return errore("Niente da salvare.");
  patch.aggiornatoIl = Date.now();
  await archivio.aggiorna(id, patch);
  const dopo = await archivio.leggi(id);
  return risposta({ ok: true, biglietto: dopo ? senzaSegreti(dopo) : null });
}
