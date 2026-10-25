"use client";

import { useApp } from "./AppProvider";

/**
 * L'apertura della home: «Ciao Nome!» a chi ha un account, la promessa del servizio a tutti gli altri.
 * Chi partecipa a una colletta ha un'identità anonima: non è un account, e qui conta come visitatore.
 */
export function Saluto() {
  const { utente, pronto } = useApp();
  const conAccount = pronto && utente && !utente.anonimo ? utente : null;
  const nome = conAccount?.nome?.trim().split(/\s+/)[0];

  if (nome) {
    return (
      <div className="flex flex-col gap-1">
        <h1 className="text-[32px] font-extrabold leading-tight text-ink">Ciao {nome}!</h1>
        <p className="text-ink-soft">Che regalo organizziamo oggi?</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-[32px] font-extrabold leading-[38px] text-ink">Il regalo di gruppo, senza dover rincorrere tutti.</h1>
      <p className="text-ink-soft">Un solo link, tutti dentro, e tu sai sempre chi manca.</p>
    </div>
  );
}
