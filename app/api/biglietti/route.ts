import { archivioBiglietti } from "@/lib/biglietti";
import { impronta, nuovaChiave, nuovoId, utenteDa } from "@/lib/biglietti/accesso";
import { corpoJson, errore, risposta } from "@/lib/biglietti/rotte";
import type { BigliettoServer } from "@/lib/biglietti/tipi";
import { OCCASIONI_BIGLIETTO } from "@/lib/tipi";

export const dynamic = "force-dynamic";

/** Passo 1: crea la bozza. Restituisce l'id (va nell'URL) e la chiave segreta della bozza (resta nel browser). */
export async function POST(richiesta: Request) {
  const c = await corpoJson(richiesta);
  const occasione = typeof c?.occasione === "string" ? c.occasione : "";
  if (!OCCASIONI_BIGLIETTO.some((o) => o.valore === occasione)) return errore("Scegli un'occasione.");
  const utente = await utenteDa(richiesta);
  const chiave = nuovaChiave();
  const adesso = Date.now();
  const b: BigliettoServer = {
    id: nuovoId(),
    slug: "",
    organizzatoreUid: utente?.uid ?? "",
    organizzatoreNome: utente?.nome ?? null,
    tipo: "solo-biglietto",
    collettaSlug: null,
    occasione,
    festeggiato: "",
    daParteDi: "",
    destinatario: "festeggiato",
    emailDestinatario: "",
    consegna: { quando: 0, fuso: "Europe/Rome", data: "", ora: "" },
    messaggioGruppo: "",
    nome: "",
    copertina: { modelloId: "", variante: 1, titolo: "", sottotitolo: null, immagineUrl: null },
    colonne: 2,
    ordineFirme: null,
    stato: "bozza",
    nFirme: 0,
    creatoIl: adesso,
    aggiornatoIl: adesso,
    consegnatoIl: null,
    hashChiave: impronta(chiave),
    tokenDestinatario: nuovaChiave(),
  };
  await archivioBiglietti().crea(b);
  return risposta({ ok: true, id: b.id, chiave });
}
