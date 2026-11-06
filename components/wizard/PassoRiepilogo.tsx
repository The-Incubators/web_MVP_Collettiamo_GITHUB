"use client";

import type { ReactNode } from "react";
import { dataBreve, giornoDaIso, ilGiorno, istanteRoma } from "@/lib/dominio/date";
import { formattaEuro } from "@/lib/dominio/importi";
import { etichettaOccasione } from "@/lib/regalo/dati";
import { budgetPrevisto, fineVotoDaStato, oraDi, quotaDaStato, scadenzaDaStato, testoMetodi, type Passo } from "@/lib/wizard/stato";
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
 * passo e poi torna qui. La data limite delle adesioni si sceglie al passo 2, con le persone (revisione di Cri, 6 nov).
 */
export function PassoRiepilogo({ s, errori, adesso, onCambia }: PropsPasso & { onCambia: (p: Passo) => void }) {
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
      <Riga dt="Persone invitate a partecipare" dd={String(s.chat)} nome="le persone" onCambia={() => onCambia(2)} />
      {centro}
      <Riga dt="Si aderisce fino al" dd={dataOra(scadenzaDaStato(s, adesso))} nome="la data limite per aderire" onCambia={() => onCambia(2)} />
      <Errore id="limite-errore" testo={errori.limite} />
      <Riga dt="Metodo di rimborso" dd={testoMetodi(s) ? testoMetodi(s).charAt(0).toUpperCase() + testoMetodi(s).slice(1) : "–"} nome="i rimborsi" onCambia={() => onCambia(5)} />
    </dl>
  );
}
