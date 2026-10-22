"use client";

import { Bottone, Campo, IconaSpunta } from "@/components/ui";
import { formattaEuro } from "@/lib/dominio/importi";
import { METODI, type Metodo, type Partecipante } from "@/lib/tipi";
import { NOMI_METODO, PannelloPagamento } from "./PannelloPagamento";
import type { Partecipazione } from "./usePartecipazione";

const DESCRIZIONI: Record<Metodo, string> = {
  paypal: "Apri PayPal con l’importo già scritto",
  satispay: "Copia il numero e invia il denaro",
  bonifico: "IBAN, causale e importo da copiare, o un codice QR",
  contanti: "Li dai di persona e li segna chi organizza",
};

export function PassoMetodo({
  p,
  riga,
  metodo,
  onScegli,
  importo,
  importoLibero,
  onImportoLibero,
  erroreImporto,
  onPagato,
  onContanti,
}: {
  p: Partecipazione;
  riga: Partecipante | null;
  metodo: Metodo | null;
  onScegli: (m: Metodo) => void;
  /** l'importo da pagare, in centesimi */
  importo: number | null;
  importoLibero: string;
  onImportoLibero: (t: string) => void;
  erroreImporto: string | null;
  onPagato: () => void;
  onContanti: () => void;
}) {
  const c = p.colletta;
  const attivi = METODI.filter((m) => c.metodi[m].attivo);
  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-2xl">Come vuoi pagare?</h2>

      {c.modoQuota === "libera" ? (
        <Campo
          etichetta="Quanto metti? (€)"
          inputMode="decimal"
          value={importoLibero}
          onChange={(e) => onImportoLibero(e.target.value)}
          errore={erroreImporto}
          suggerimento={`Suggeriti ${formattaEuro(c.quotaCent)}. L’importo lo vede solo ${c.organizzatoreNome}.`}
        />
      ) : null}

      <div role="radiogroup" aria-label="Metodo di pagamento" className="flex flex-col gap-2">
        {attivi.map((m) => {
          const scelto = metodo === m;
          return (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={scelto}
              onClick={() => onScegli(m)}
              className={`flex min-h-tocco items-center gap-3 rounded-contenitore border p-4 text-left transition-colors ${scelto ? "border-accent bg-accent-field" : "border-line bg-surface hover:bg-surface-2"}`}
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-display text-lg font-bold">{NOMI_METODO[m]}</span>
                <span className="text-sm text-ink-soft">{DESCRIZIONI[m]}</span>
              </span>
              {scelto ? <IconaSpunta className="text-accent" /> : null}
            </button>
          );
        })}
      </div>

      {metodo ? (
        <div className="flex flex-col gap-4 rounded-contenitore border border-line bg-surface p-4">
          <PannelloPagamento colletta={c} metodo={metodo} importoCent={importo} causale={riga?.causale ?? ""} />
          {metodo === "contanti" ? (
            <Bottone pieno onClick={onContanti}>
              Ho capito
            </Bottone>
          ) : (
            <Bottone pieno onClick={onPagato}>
              Fatto, ho pagato
            </Bottone>
          )}
        </div>
      ) : null}
    </div>
  );
}
