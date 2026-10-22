"use client";

import { Avviso, Bottone, Campo, Icona, type NomeIcona } from "@/components/ui";
import { formattaEuro } from "@/lib/dominio/importi";
import { METODI, type Metodo, type Partecipante } from "@/lib/tipi";
import { NOMI_METODO, PannelloPagamento } from "./PannelloPagamento";
import { PassoConferma } from "./PassoConferma";
import type { Partecipazione } from "./usePartecipazione";

const DESCRIZIONI: Record<Metodo, string> = {
  paypal: "Apri PayPal con l’importo già scritto",
  satispay: "Copia il numero e invia il denaro",
  bonifico: "IBAN, causale e importo da copiare",
  contanti: "Li dai di persona a chi organizza",
};

const ICONE: Record<Metodo, { icona: NomeIcona; tinta: string }> = {
  paypal: { icona: "payments", tinta: "bg-accent-field text-accent" },
  satispay: { icona: "smartphone", tinta: "bg-cta-field text-cta-2" },
  bonifico: { icona: "account_balance", tinta: "bg-surface-2 text-ink" },
  contanti: { icona: "handshake", tinta: "bg-gold-field text-gold" },
};

/** Come pagare e, subito sotto, «Hai pagato?»: nel disegno di UX_V4 sono una schermata sola. */
export function PassoMetodo({
  p,
  riga,
  metodo,
  onScegli,
  importo,
  importoLibero,
  onImportoLibero,
  erroreImporto,
  onDichiara,
  onDopo,
  problema,
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
  onDichiara: () => Promise<void>;
  onDopo: () => void;
  problema: string | null;
}) {
  const c = p.colletta;
  const attivi = METODI.filter((m) => c.metodi[m].attivo);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-[32px] font-bold leading-[38px] tracking-tight text-accent-2">Paga la tua quota a {c.organizzatoreNome}</h2>
        <p className="text-ink-soft">
          {importo ? <strong className="cifre text-lg font-extrabold text-cta-2">{formattaEuro(importo)}</strong> : null} per il regalo di {c.festeggiato}
        </p>
      </div>

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

      <div className="flex flex-col gap-2">
        <p id="titolo-metodi" className="text-xs font-bold uppercase tracking-widest text-ink-soft">
          Scegli come pagare
        </p>
        <div role="radiogroup" aria-labelledby="titolo-metodi" className="flex flex-col gap-3">
          {attivi.map((m) => {
            const scelto = metodo === m;
            return (
              <div key={m} className={`rounded-3xl bg-surface shadow-carta ${scelto ? "ring-2 ring-accent" : ""}`}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={scelto}
                  onClick={() => onScegli(m)}
                  className="flex min-h-tocco w-full items-center gap-4 p-4 text-left"
                >
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${ICONE[m].tinta}`}>
                    <Icona nome={ICONE[m].icona} dimensione={26} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-display text-xl font-semibold">{NOMI_METODO[m]}</span>
                    <span className="text-sm text-ink-soft">{DESCRIZIONI[m]}</span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${scelto ? "bg-accent text-on-accent" : "bg-line"}`}
                  >
                    {scelto ? <Icona nome="check" dimensione={18} /> : null}
                  </span>
                </button>
                {scelto ? (
                  <div className="px-4 pb-4">
                    <PannelloPagamento colletta={c} metodo={m} importoCent={importo} causale={riga?.causale ?? ""} />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {problema ? (
        <Avviso tono="attenzione" live>
          <p>{problema}</p>
        </Avviso>
      ) : null}

      {metodo === "contanti" ? (
        <Bottone pieno onClick={onDopo}>
          Ho capito
        </Bottone>
      ) : metodo ? (
        <PassoConferma p={p} importo={importo} importoLibero={importoLibero} onImportoLibero={onImportoLibero} chiediImporto={false} onSi={onDichiara} onNo={onDopo} />
      ) : null}

      <p className="flex items-start gap-3 rounded-2xl bg-surface-2 p-4 text-sm text-ink-soft">
        <Icona nome="lock" dimensione={20} className="mt-0.5" />
        <span>
          <strong className="text-ink">Regaloop non tocca i tuoi soldi:</strong> paghi direttamente {c.organizzatoreNome}.
        </span>
      </p>
    </div>
  );
}
