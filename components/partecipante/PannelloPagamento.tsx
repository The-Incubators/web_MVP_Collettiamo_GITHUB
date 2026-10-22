"use client";

import { Avviso, BottoneLink, Icona, PannelloCopia } from "@/components/ui";
import { formattaEuro } from "@/lib/dominio/importi";
import { formattaIban } from "@/lib/dominio/iban";
import { payloadEpc } from "@/lib/dominio/epc";
import { linkPaypal } from "@/lib/dominio/paypal";
import type { Colletta, Metodo } from "@/lib/tipi";
import { CodiceQr } from "./CodiceQr";

export const NOMI_METODO: Record<Metodo, string> = {
  paypal: "PayPal",
  satispay: "Satispay",
  bonifico: "Bonifico",
  contanti: "Contanti",
};

const importoPerCopia = (cent: number) => (cent / 100).toFixed(2).replace(".", ",");

/** Il pannello che si apre dentro la scheda del metodo scelto (sezione 10.5). L'importo è già nel titolo della pagina. */
export function PannelloPagamento({
  colletta,
  metodo,
  importoCent,
  causale,
}: {
  colletta: Colletta;
  metodo: Metodo;
  importoCent: number | null;
  causale: string;
}) {
  const org = colletta.organizzatoreNome;
  const importo = importoCent ? formattaEuro(importoCent) : null;

  if (metodo === "contanti") {
    return (
      <div className="flex flex-col gap-1 rounded-2xl bg-gold-field p-4">
        <p className="font-bold">
          Darai {importo ?? "la tua quota"} a {org} di persona.
        </p>
        <p className="text-sm">Non devi fare altro: quando {org} li riceve, li segna lui.</p>
      </div>
    );
  }

  if (metodo === "paypal") {
    const link = linkPaypal(colletta.metodi.paypal.valore, importoCent);
    return (
      <div className="flex flex-col gap-3">
        {link ? (
          <>
            <BottoneLink href={link.conImporto ?? link.profilo} esterno pieno variante="azione">
              {importo ? `Paga ${importo} con PayPal` : "Apri PayPal"} <Icona nome="open_in_new" dimensione={20} />
            </BottoneLink>
            {link.conImporto ? (
              <p className="text-sm text-ink-soft">
                Se PayPal non mostra l’importo, <a className="font-semibold text-accent underline underline-offset-4" href={link.profilo} target="_blank" rel="nofollow noopener noreferrer">apri il profilo di {org}</a> e scrivilo tu.
              </p>
            ) : null}
          </>
        ) : (
          <Avviso tono="attenzione">Il link PayPal non è valido: chiedi a {org} un altro modo per pagare.</Avviso>
        )}
        <PannelloCopia etichetta="Nel messaggio scrivi" valore={causale} />
      </div>
    );
  }

  if (metodo === "satispay") {
    return (
      <div className="flex flex-col gap-3">
        <PannelloCopia etichetta={`Numero Satispay di ${org}`} valore={colletta.metodi.satispay.valore} copiabile={colletta.metodi.satispay.valore.replace(/[\s.-]/g, "")} grande />
        <ol className="list-decimal pl-5 text-sm text-ink-soft">
          <li>Apri Satispay e scegli «Invia denaro».</li>
          <li>Incolla il numero e scrivi {importo ?? "la tua quota"}.</li>
        </ol>
        <PannelloCopia etichetta="Nel messaggio scrivi" valore={causale} />
      </div>
    );
  }

  const b = colletta.metodi.bonifico;
  const iban = b.valore.replace(/\s+/g, "");
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ink-soft">Intestato a <strong className="text-ink">{b.intestatario}</strong></p>
      <PannelloCopia etichetta="IBAN" valore={formattaIban(b.valore)} copiabile={iban} />
      <PannelloCopia etichetta="Causale" valore={causale} />
      {importoCent ? <PannelloCopia etichetta="Importo" valore={importoPerCopia(importoCent)} /> : null}
      {importoCent ? (
        <details className="rounded-2xl bg-surface-2 px-4 py-1">
          <summary className="min-h-tocco cursor-pointer py-3 text-sm font-bold">Oppure inquadra il QR con l’app della tua banca</summary>
          <div className="flex flex-col items-center gap-2 pt-2">
            <CodiceQr
              testo={payloadEpc({ iban, intestatario: b.intestatario, importoCent, causale })}
              descrizione={`Codice QR per il bonifico di ${importo} a ${b.intestatario}`}
            />
            <p className="text-center text-xs text-ink-soft">Giro-code (EPC): da verificare su app bancarie italiane. Se non funziona, usa i dati qui sopra.</p>
          </div>
        </details>
      ) : null}
    </div>
  );
}
