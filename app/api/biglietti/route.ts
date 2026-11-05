import { archivioBiglietti } from "@/lib/biglietti";
import { impronta, nuovaChiave, nuovoId, utenteDa } from "@/lib/biglietti/accesso";
import { corpoJson, errore, risposta } from "@/lib/biglietti/rotte";
import type { BigliettoServer } from "@/lib/biglietti/tipi";
import { datiServer } from "@/lib/dati";
import { occasioneBigliettoValida } from "@/lib/dominio/bacheca";
import { slugValido } from "@/lib/dominio/slug";

export const dynamic = "force-dynamic";

/** Passo 1: crea la bozza. Restituisce l'id (va nell'URL) e la chiave segreta della bozza (resta nel browser). */
export async function POST(richiesta: Request) {
  const c = await corpoJson(richiesta);
  const occasione = typeof c?.occasione === "string" ? c.occasione : "";
  if (!occasioneBigliettoValida(occasione)) return errore("Scegli un'occasione.");
  const utente = await utenteDa(richiesta);
  // «Prepara il biglietto» dal regalo di gruppo (spec §7.7): solo chi organizza quel regalo lo collega
  let collettaSlug: string | null = null;
  if (typeof c?.collettaSlug === "string" && c.collettaSlug) {
    const slug = c.collettaSlug;
    const g = slugValido(slug) ? await datiServer().colletta(slug).catch(() => null) : null;
    if (!g || !utente || g.organizzatoreUid !== utente.uid) return errore("Solo chi organizza il regalo prepara il suo biglietto.", 403);
    collettaSlug = slug;
  }
  const chiave = nuovaChiave();
  const adesso = Date.now();
  const b: BigliettoServer = {
    id: nuovoId(),
    slug: "",
    organizzatoreUid: utente?.uid ?? "",
    organizzatoreNome: utente?.nome ?? null,
    tipo: collettaSlug ? "con-colletta" : "solo-biglietto",
    collettaSlug,
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
