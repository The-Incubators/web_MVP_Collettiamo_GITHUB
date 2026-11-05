"use client";

// I passi del wizard che chiedono dati (prototipi/crea.html): 1 per chi è, 2 da dove vuoi iniziare, 3A la quota,
// 4 la chat e la data limite, 5 i rimborsi. Il passo 3B (i regali) sta in PassoRegali, l'accesso in PassoAccesso.

import { CampoModulo, Chip, Contatore, Input, InputImporto, SceltaGrande, SpuntaRiga } from "@/components/ui";
import { aggiungiGiorni, giornoInIso, giornoRoma } from "@/lib/dominio/date";
import { formattaEuro } from "@/lib/dominio/importi";
import { OCCASIONI_REGALO } from "@/lib/regalo/dati";
import { inVotazione, intervalloQuote, MAX_PERSONE, MIN_PERSONE, personeDivisione, quotaDaStato } from "@/lib/wizard/stato";
import { FotoRegalo } from "./Anteprima";
import type { PropsPasso } from "./tipi";

/** Il testo dell'errore accanto al campo; `id` lo collega al campo con aria-describedby. */
function Errore({ id, testo }: { id: string; testo?: string }) {
  return testo ? (
    <p className="errore-testo" id={id} role="alert">
      {testo}
    </p>
  ) : null;
}

export function PassoPerChi({ s, cambia, errori, adesso }: PropsPasso) {
  return (
    <>
      <CampoModulo id="nome" etichetta="Nome del festeggiato o della festeggiata" errore={errori.festeggiato}>
        <Input
          id="nome"
          larghezza="nome"
          value={s.festeggiato}
          onChange={(e) => cambia({ festeggiato: e.target.value })}
          errore={!!errori.festeggiato}
          aria-describedby={errori.festeggiato ? "nome-errore" : undefined}
          autoComplete="off"
          maxLength={60}
        />
      </CampoModulo>
      <div className="campo">
        <span className="etichetta" id="l-occ">
          Occasione
        </span>
        <div className="chips" role="radiogroup" aria-labelledby="l-occ">
          {OCCASIONI_REGALO.map((o) => (
            <Chip key={o.id} modo="radio" scelto={s.occasione === o.id} onClick={() => cambia({ occasione: o.id })}>
              {o.etichetta}
            </Chip>
          ))}
        </div>
      </div>
      <CampoModulo id="data" etichetta="Quando festeggiamo" errore={errori.dataRegalo}>
        <Input
          id="data"
          type="date"
          larghezza="data"
          min={giornoInIso(aggiungiGiorni(giornoRoma(adesso), 1))}
          value={s.dataRegalo}
          onChange={(e) => cambia({ dataRegalo: e.target.value })}
          errore={!!errori.dataRegalo}
          aria-describedby={errori.dataRegalo ? "data-errore" : undefined}
        />
      </CampoModulo>
    </>
  );
}

export function PassoPartenza({ s, cambia }: PropsPasso) {
  const regali = s.regali;
  return (
    <div role="radiogroup" aria-label="Da dove vuoi iniziare" className="scelte">
      <SceltaGrande scelto={s.partenza === "adesioni"} nome="Prima raccolgo le adesioni" onScegli={() => cambia({ partenza: "adesioni" })}>
        Proponi una quota a testa. Il regalo lo scegliete dopo, nel budget.
      </SceltaGrande>
      <SceltaGrande
        scelto={s.partenza === "regalo"}
        nome="Ho scelto il regalo"
        onScegli={() => cambia({ partenza: "regalo" })}
        extra={
          regali.length ? (
            <span className="regali-scelti">
              {regali.map((p, i) => (
                <span key={`${p.nome}-${i}`} className="regalo-scelto piccolo">
                  <span className="lastra">
                    <FotoRegalo p={p} />
                  </span>
                  <span className="n">
                    {p.nome}
                    <br />
                    <span className="t-cifra">{formattaEuro(p.prezzoCent)}</span>
                  </span>
                </span>
              ))}
            </span>
          ) : null
        }
      >
        Dal catalogo o da un link. Puoi aggiungerne altri da votare.
      </SceltaGrande>
    </div>
  );
}

export function PassoQuota({ s, cambia, errori }: PropsPasso) {
  return (
    <CampoModulo id="quota" etichetta="Quota proposta" errore={errori.quotaEuro}>
      <InputImporto
        id="quota"
        value={s.quotaEuro}
        onChange={(e) => cambia({ quotaEuro: e.target.value })}
        className={`input w-importo${errori.quotaEuro ? " errore" : ""}`}
        aria-invalid={errori.quotaEuro ? true : undefined}
        aria-describedby={errori.quotaEuro ? "quota-errore" : undefined}
      />
    </CampoModulo>
  );
}

export function PassoChat({ s, cambia, errori }: PropsPasso) {
  const persone = personeDivisione(s);
  const quota = quotaDaStato(s);
  const intervallo = intervalloQuote(s);
  return (
    <>
      <div className="campo">
        <span className="etichetta" id="l-pers">
          Quante persone ci sono nella chat
        </span>
        <Contatore
          etichettaId="l-pers"
          valore={s.chat}
          min={MIN_PERSONE}
          max={MAX_PERSONE}
          onCambia={(chat) => cambia({ chat })}
          etichettaMeno="Una persona in meno"
          etichettaPiu="Una persona in più"
        />
        <Errore id="chat-errore" testo={errori.chat} />
      </div>
      <SpuntaRiga checked={s.partecipo} onChange={(e) => cambia({ partecipo: e.target.checked })}>
        Partecipi anche tu alla divisione?
      </SpuntaRiga>
      {s.partenza === "regalo" && (quota || intervallo) ? (
        <div className="calcolo" aria-live="polite">
          <span>{inVotazione(s) ? "Quota a testa, secondo il regalo che vince" : `Quota a testa, divisa fra ${persone}`}</span>
          <span className="t-cifra">{intervallo ? `${formattaEuro(intervallo[0])} – ${formattaEuro(intervallo[1])}` : formattaEuro(quota ?? 0)}</span>
        </div>
      ) : null}
      <div className="campo">
        <span className="etichetta" id="l-lim">
          Fino a quando si può aderire
        </span>
        <div className="riga" role="group" aria-labelledby="l-lim">
          <Input
            type="date"
            larghezza="data"
            aria-label="Data limite"
            value={s.limiteData}
            onChange={(e) => cambia({ limiteData: e.target.value, limiteToccato: true })}
            errore={!!errori.limite}
            aria-describedby={errori.limite ? "limite-errore" : undefined}
          />
          <Input
            type="time"
            larghezza="ora"
            aria-label="Ora limite"
            value={s.limiteOra}
            onChange={(e) => cambia({ limiteOra: e.target.value, limiteToccato: true })}
            errore={!!errori.limite}
            aria-describedby={errori.limite ? "limite-errore" : undefined}
          />
        </div>
        <Errore id="limite-errore" testo={errori.limite} />
      </div>
    </>
  );
}

export function PassoRimborsi({ s, cambia, errori }: PropsPasso) {
  return (
    <div>
      <div className="metodo">
        <SpuntaRiga checked={s.paypalAttivo} onChange={(e) => cambia({ paypalAttivo: e.target.checked })}>
          PayPal
        </SpuntaRiga>
        {s.paypalAttivo ? (
          <>
            <Input
              aria-label="Il tuo link PayPal"
              value={s.paypal}
              onChange={(e) => cambia({ paypal: e.target.value })}
              errore={!!errori.paypal}
              aria-describedby={errori.paypal ? "paypal-errore" : undefined}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
            <Errore id="paypal-errore" testo={errori.paypal} />
          </>
        ) : null}
      </div>
      <div className="metodo">
        <SpuntaRiga checked={s.satispayAttivo} onChange={(e) => cambia({ satispayAttivo: e.target.checked })}>
          Satispay
        </SpuntaRiga>
        {s.satispayAttivo ? (
          <>
            <Input
              type="tel"
              inputMode="tel"
              aria-label="Numero di telefono Satispay"
              value={s.satispay}
              onChange={(e) => cambia({ satispay: e.target.value })}
              errore={!!errori.satispay}
              aria-describedby={errori.satispay ? "satispay-errore" : undefined}
              autoComplete="tel"
            />
            <Errore id="satispay-errore" testo={errori.satispay} />
          </>
        ) : null}
      </div>
      <div className="metodo">
        <SpuntaRiga checked={s.bonificoAttivo} onChange={(e) => cambia({ bonificoAttivo: e.target.checked })}>
          Bonifico
        </SpuntaRiga>
        {s.bonificoAttivo ? (
          <>
            <Input
              aria-label="IBAN"
              value={s.iban}
              onChange={(e) => cambia({ iban: e.target.value.toUpperCase() })}
              errore={!!errori.iban}
              aria-describedby={errori.iban ? "iban-errore" : undefined}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
            />
            <Errore id="iban-errore" testo={errori.iban} />
            <Input
              aria-label="Intestatario del conto"
              value={s.intestatario}
              onChange={(e) => cambia({ intestatario: e.target.value })}
              errore={!!errori.intestatario}
              aria-describedby={errori.intestatario ? "intestatario-errore" : undefined}
              autoComplete="name"
            />
            <Errore id="intestatario-errore" testo={errori.intestatario} />
          </>
        ) : null}
      </div>
      <div className="metodo">
        <SpuntaRiga checked={s.contantiAttivo} onChange={(e) => cambia({ contantiAttivo: e.target.checked })}>
          Contanti
        </SpuntaRiga>
      </div>
      <Errore id="metodi-errore" testo={errori.metodi} />
    </div>
  );
}
