"use client";

import { useState } from "react";
import { Avviso, Campo, Interruttore } from "@/components/ui";
import { formattaIban } from "@/lib/dominio/iban";
import type { PropsPasso } from "./tipi";

export function Passo4Pagamenti({ s, cambia, errori }: PropsPasso) {
  const [ibanVisitato, setIbanVisitato] = useState(false);
  return (
    <div className="flex flex-col gap-5">
      <Avviso tono="positivo">
        <p>Questi dati li vede solo chi apre il link della colletta. I soldi arrivano direttamente a te: il servizio non li tocca mai.</p>
      </Avviso>

      {errori.metodi ? (
        <p data-errore="true" role="alert" className="text-sm font-semibold text-error before:mr-1 before:content-['⚠']">
          {errori.metodi}
        </p>
      ) : null}

      <section className={`contenitore flex flex-col gap-3 p-4 ${errori.metodi ? "!border-2 !border-error !bg-error-field" : ""}`} aria-label="PayPal">
        <Interruttore etichetta="PayPal" descrizione="Chi paga apre il tuo link paypal.me con l’importo già scritto." attivo={s.paypalAttivo} onCambia={(paypalAttivo) => cambia({ paypalAttivo })} />
        {s.paypalAttivo ? (
          <Campo etichetta="Nome utente o link PayPal.me" value={s.paypal} onChange={(e) => cambia({ paypal: e.target.value })} errore={errori.paypal} placeholder="marco.rossi o paypal.me/marco.rossi" autoCapitalize="none" autoCorrect="off" />
        ) : null}
      </section>

      <section className={`contenitore flex flex-col gap-3 p-4 ${errori.metodi ? "!border-2 !border-error !bg-error-field" : ""}`} aria-label="Satispay">
        <Interruttore etichetta="Satispay" descrizione="Chi paga vede il tuo numero e lo copia con un tocco." attivo={s.satispayAttivo} onCambia={(satispayAttivo) => cambia({ satispayAttivo })} />
        {s.satispayAttivo ? (
          <Campo etichetta="Numero di telefono collegato a Satispay" type="tel" inputMode="tel" value={s.satispay} onChange={(e) => cambia({ satispay: e.target.value })} errore={errori.satispay} placeholder="333 123 4567" />
        ) : null}
      </section>

      <section className={`contenitore flex flex-col gap-3 p-4 ${errori.metodi ? "!border-2 !border-error !bg-error-field" : ""}`} aria-label="Bonifico">
        <Interruttore etichetta="Bonifico" descrizione="IBAN, causale e importo da copiare, più un codice QR da inquadrare con la banca." attivo={s.bonificoAttivo} onCambia={(bonificoAttivo) => cambia({ bonificoAttivo })} />
        {s.bonificoAttivo ? (
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
          </>
        ) : null}
      </section>

      <section className={`contenitore p-4 ${errori.metodi ? "!border-2 !border-error !bg-error-field" : ""}`} aria-label="Contanti">
        <Interruttore etichetta="Contanti" descrizione="Chi sceglie i contanti ti consegna i soldi di persona: li segni tu quando li ricevi." attivo={s.contantiAttivo} onCambia={(contantiAttivo) => cambia({ contantiAttivo })} />
      </section>
    </div>
  );
}
