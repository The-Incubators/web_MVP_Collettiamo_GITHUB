"use client";

import { useState, type ReactNode } from "react";
import { Input } from "@/components/ui";
import { dataBreve, giornoDaIso, giornoInIso, giornoRoma, ilGiorno, istanteRoma } from "@/lib/dominio/date";
import { formattaEuro } from "@/lib/dominio/importi";
import { etichettaOccasione } from "@/lib/regalo/dati";
import { budgetPrevisto, fineVotoDaStato, limite, oraDi, quotaDaStato, scadenzaDaStato, testoMetodi, type Passo } from "@/lib/wizard/stato";
import { Errore } from "./PassiDati";
import type { PropsPasso } from "./tipi";

/** Le occasioni che nella frase vanno in minuscolo («Mauro, compleanno il 14 dicembre»); i nomi propri restano. */
const IN_MINUSCOLO = new Set(["compleanno", "laurea", "pensione", "nascita", "matrimonio", "anniversario", "saluto"]);

/** "Mauro, compleanno il 14 dicembre" */
export function testoPerChi(s: PropsPasso["s"]): string {
  const giorno = giornoDaIso(s.dataRegalo);
  const quando = giorno ? ilGiorno(istanteRoma(giorno, 12)) : "";
  const occ = s.occasione === "altro" ? "" : IN_MINUSCOLO.has(s.occasione) ? etichettaOccasione(s.occasione).toLowerCase() : etichettaOccasione(s.occasione);
  return [s.festeggiato.trim(), [occ, quando].filter(Boolean).join(" ")].filter(Boolean).join(", ");
}

/** "13 dicembre, 20:00" */
const dataOra = (ms: number | null) => (ms === null ? "–" : `${dataBreve(ms)}, ${oraDi(ms)}`);

function Riga({ dt, dd, nome, onCambia, children }: { dt: string; dd?: ReactNode; nome: string; onCambia?: () => void; children?: ReactNode }) {
  return (
    <div>
      <dt>{dt}</dt>
      {dd !== undefined ? <dd>{dd}</dd> : null}
      {onCambia ? (
        <button type="button" className="btn btn-quieto" onClick={onCambia}>
          Cambia<span className="sr-only"> {nome}</span>
        </button>
      ) : null}
      {children}
    </div>
  );
}

/**
 * Passo 6 (design.md §10.1, decisione 10; GOV.UK «Check answers»): una riga per risposta con «Cambia», che porta al
 * passo e poi torna qui. La data limite delle adesioni è proposta e si cambia qui, sul posto (decisione 7).
 */
export function PassoRiepilogo({ s, cambia, errori, adesso, onCambia }: PropsPasso & { onCambia: (p: Passo) => void }) {
  const [modificaLimite, setModificaLimite] = useState(!!errori.limite);
  const l = limite(s, adesso);
  const persone = `${s.chat}${s.partecipo ? ", partecipi anche tu" : ""}`;
  const centro =
    s.partenza === "adesioni" ? (
      <Riga
        dt="Quota a testa"
        dd={`${formattaEuro(quotaDaStato(s) ?? 0)}, budget previsto ${formattaEuro(budgetPrevisto(s) ?? 0)}`}
        nome="la quota"
        onCambia={() => onCambia(4)}
      />
    ) : s.partenza === "voto" ? (
      <>
        <Riga dt="Regali da votare" dd={s.regali.map((p) => p.nome).join(", ")} nome="i regali da votare" onCambia={() => onCambia(4)} />
        <Riga dt="Si vota fino al" dd={dataOra(fineVotoDaStato(s, adesso))} nome="la fine della votazione" onCambia={() => onCambia(4)} />
      </>
    ) : s.regali[0] ? (
      <Riga
        dt="Regalo"
        dd={`${s.regali[0].nome}, ${formattaEuro(quotaDaStato(s) ?? 0)} a testa`}
        nome="il regalo"
        onCambia={() => onCambia(s.daProdotto ? 2 : 4)}
      />
    ) : null;
  return (
    <dl className="riep">
      <Riga dt="Per chi" dd={testoPerChi(s)} nome="per chi" onCambia={() => onCambia(1)} />
      <Riga dt="Persone nella chat" dd={persone} nome="le persone" onCambia={() => onCambia(2)} />
      {centro}
      {modificaLimite ? (
        <Riga dt="Si aderisce fino al" nome="la data limite per aderire">
          <div className="modifica">
            <Input
              type="date"
              larghezza="data"
              aria-label="Data in cui si chiudono le adesioni"
              min={giornoInIso(giornoRoma(adesso))}
              value={l.data}
              onChange={(e) => cambia({ limiteData: e.target.value, limiteOra: l.ora })}
              errore={!!errori.limite}
              aria-describedby={errori.limite ? "limite-errore" : undefined}
            />
            <Input
              type="time"
              larghezza="ora"
              aria-label="Ora in cui si chiudono le adesioni"
              value={l.ora}
              onChange={(e) => cambia({ limiteData: l.data, limiteOra: e.target.value })}
              errore={!!errori.limite}
              aria-describedby={errori.limite ? "limite-errore" : undefined}
            />
            <Errore id="limite-errore" testo={errori.limite} />
          </div>
        </Riga>
      ) : (
        <Riga dt="Si aderisce fino al" dd={dataOra(scadenzaDaStato(s, adesso))} nome="la data limite per aderire" onCambia={() => setModificaLimite(true)} />
      )}
      <Riga dt="Come ti rimborsano" dd={testoMetodi(s) ? testoMetodi(s).charAt(0).toUpperCase() + testoMetodi(s).slice(1) : "–"} nome="i rimborsi" onCambia={() => onCambia(5)} />
    </dl>
  );
}
