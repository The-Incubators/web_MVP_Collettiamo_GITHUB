"use client";

import { Avviso, BottoneLink, PannelloCopia } from "@/components/ui";
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

/** Il pannello che si apre alla scelta del metodo (sezione 10.5). */
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
      <div className="flex flex-col gap-3">
        <p className="text-lg">
          Darai {importo ?? "la tua quota"} a {org} di persona, li segnerà lui.
        </p>
        <p className="text-sm text-ink-soft">Non devi fare altro adesso: quando {org} li riceve, la tua quota risulta pagata.</p>
      </div>
    );
  }

  const intestazione = importo ? (
    <p className="text-center">
      <span className="text-sm text-ink-soft">Importo</span>
      <span className="cifre block text-4xl font-bold">{importo}</span>
    </p>
  ) : null;

  if (metodo === "paypal") {
    const link = linkPaypal(colletta.metodi.paypal.valore, importoCent);
    return (
      <div className="flex flex-col gap-3">
        {intestazione}
        {link ? (
          <>
            <BottoneLink href={link.conImporto ?? link.profilo} esterno pieno>
              Apri PayPal{importo ? ` e paga ${importo}` : ""}
            </BottoneLink>
            {link.conImporto ? (
              <p className="text-sm text-ink-soft">
                Se PayPal non mostra l’importo, <a className="font-semibold text-accent-2 underline underline-offset-4" href={link.profilo} target="_blank" rel="nofollow noopener noreferrer">apri il profilo di {org}</a> e scrivilo tu.
              </p>
            ) : null}
          </>
        ) : (
          <Avviso tono="attenzione">Il link PayPal non è valido. Scrivi a {org}.</Avviso>
        )}
        <PannelloCopia etichetta="Nel messaggio scrivi" valore={causale} />
      </div>
    );
  }

  if (metodo === "satispay") {
    return (
      <div className="flex flex-col gap-3">
        {intestazione}
        <PannelloCopia etichetta={`Numero Satispay di ${org}`} valore={colletta.metodi.satispay.valore} copiabile={colletta.metodi.satispay.valore.replace(/[\s.-]/g, "")} grande />
        <ol className="list-decimal pl-5 text-sm">
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
      {intestazione}
      <p className="text-sm text-ink-soft">Intestato a <strong className="text-ink">{b.intestatario}</strong></p>
      <PannelloCopia etichetta="IBAN" valore={formattaIban(b.valore)} copiabile={iban} />
      <PannelloCopia etichetta="Causale" valore={causale} />
      {importoCent ? <PannelloCopia etichetta="Importo" valore={importoPerCopia(importoCent)} /> : null}
      {importoCent ? (
        <details className="rounded-controllo border border-line bg-surface-2 p-3">
          <summary className="min-h-tocco cursor-pointer py-2 font-semibold">Oppure inquadra il codice con l’app della tua banca</summary>
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
