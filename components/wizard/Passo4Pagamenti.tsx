"use client";

import { useState, type ReactNode } from "react";
import { Campo, Icona, Interruttore, type NomeIcona } from "@/components/ui";
import { formattaIban } from "@/lib/dominio/iban";
import type { PropsPasso } from "./tipi";

/** «Come ti pagano?»: nella stessa schermata della quota, sotto. */
export function Passo4Pagamenti({ s, cambia, errori }: PropsPasso) {
  const [ibanVisitato, setIbanVisitato] = useState(false);
  const riquadro = (
    etichetta: string,
    icona: NomeIcona,
    tinta: string,
    descrizione: string,
    attivo: boolean,
    onCambia: (v: boolean) => void,
    campi?: ReactNode,
  ) => (
    <section aria-label={etichetta} className={`flex flex-col gap-3 rounded-3xl bg-surface p-4 shadow-carta ${errori.metodi ? "ring-2 ring-error" : ""}`}>
      <Interruttore etichetta={etichetta} descrizione={descrizione} attivo={attivo} onCambia={onCambia} icona={icona} tintaIcona={tinta} />
      {attivo && campi ? <div className="flex flex-col gap-3">{campi}</div> : null}
    </section>
  );

  return (
    <section aria-labelledby="come-ti-pagano" className="flex flex-col gap-3 pt-2">
      <div className="flex flex-col gap-1">
        <h2 id="come-ti-pagano" className="text-2xl font-bold text-accent-2">
          Come ti pagano?
        </h2>
        <p className="text-sm text-ink-soft">Scegli dove ricevere i soldi del gruppo.</p>
      </div>
      <p className="flex items-start gap-2 rounded-2xl bg-accent-field p-3 text-sm font-semibold text-accent-2">
        <Icona nome="verified_user" dimensione={20} className="text-accent" />
        I soldi arrivano direttamente a te: Gifty non li tocca. Questi dati li vede solo chi apre il link.
      </p>

      {errori.metodi ? (
        <p data-errore="true" role="alert" className="text-sm font-semibold text-error before:mr-1 before:content-['⚠']">
          {errori.metodi}
        </p>
      ) : null}

      {riquadro(
        "PayPal",
        "payments",
        "bg-accent-field text-accent",
        "Link paypal.me con l’importo già scritto",
        s.paypalAttivo,
        (paypalAttivo) => cambia({ paypalAttivo }),
        <Campo
          etichetta="Nome utente o link PayPal.me"
          value={s.paypal}
          onChange={(e) => cambia({ paypal: e.target.value })}
          errore={errori.paypal}
          placeholder="marco.rossi o paypal.me/marco.rossi"
          autoCapitalize="none"
          autoCorrect="off"
        />,
      )}
      {riquadro(
        "Satispay",
        "smartphone",
        "bg-ok-field text-accent-2",
        "Chi paga copia il tuo numero",
        s.satispayAttivo,
        (satispayAttivo) => cambia({ satispayAttivo }),
        <Campo
          etichetta="Numero collegato a Satispay"
          type="tel"
          inputMode="tel"
          value={s.satispay}
          onChange={(e) => cambia({ satispay: e.target.value })}
          errore={errori.satispay}
          placeholder="333 123 4567"
        />,
      )}
      {riquadro(
        "Bonifico",
        "account_balance",
        "bg-accent text-on-accent",
        "IBAN e intestatario",
        s.bonificoAttivo,
        (bonificoAttivo) => cambia({ bonificoAttivo }),
        <>
          <Campo
            etichetta="IBAN"
            value={s.iban}
            onChange={(e) => cambia({ iban: e.target.value.toUpperCase() })}
            onBlur={() => {
              setIbanVisitato(true);
              cambia({ iban: formattaIban(s.iban) });
            }}
            errore={ibanVisitato || errori.iban ? errori.iban : null}
            placeholder="IT60 X054 2811 1010 0000 0123 456"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
          />
          <Campo etichetta="Intestatario del conto" value={s.intestatario} onChange={(e) => cambia({ intestatario: e.target.value })} errore={errori.intestatario} autoComplete="name" />
        </>,
      )}
      {riquadro("Contanti", "handshake", "bg-gold-field text-gold", "Te li danno di persona, li segni tu", s.contantiAttivo, (contantiAttivo) => cambia({ contantiAttivo }))}
    </section>
  );
}
