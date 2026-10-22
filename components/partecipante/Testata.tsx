import { Barra, ImmagineProdotto } from "@/components/ui";
import { dataBreve, dataConGiorno } from "@/lib/dominio/date";
import { formattaEuro } from "@/lib/dominio/importi";
import { avanzamento } from "@/lib/dominio/partecipanti";
import { quotaEffettiva } from "@/lib/dominio/quota";
import type { Colletta } from "@/lib/tipi";

const maiuscola = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export function testoPartecipazione(c: Colletta): string {
  const n = c.nConfermati;
  const m = Math.max(c.previsti, c.nAttesi);
  if (n === 0) return c.nAderenti > 0 ? "Le prime quote sono in arrivo" : "Nessuno ha ancora partecipato";
  return `${n} ${n === 1 ? "persona" : "persone"} su ${m} ${n === 1 ? "ha" : "hanno"} già partecipato`;
}

/** La prima schermata, nell'ordine: chi organizza, titolo, occasione e data, regalo, quota, avanzamento. */
export function Testata({ colletta: c, scaduta }: { colletta: Colletta; scaduta: boolean }) {
  const a = avanzamento(c);
  const quota = quotaEffettiva(c);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-ink-soft">{c.organizzatoreNome} organizza</p>
        <h1 className="text-3xl leading-tight">Il regalo per {c.festeggiato}</h1>
        <p className="text-ink-soft">
          {maiuscola(c.occasione)} · {dataConGiorno(c.dataRegalo)}
        </p>
      </div>

      <div className="contenitore overflow-hidden">
        <ImmagineProdotto prodotto={c.prodotto} className="max-h-48 object-cover" />
        <div className="flex items-baseline justify-between gap-3 p-4">
          <p className="min-w-0 font-medium leading-snug">{c.prodotto.nome}</p>
          <p className="cifre shrink-0 text-ink-soft">{formattaEuro(c.prodotto.prezzoCent)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-1 rounded-contenitore border border-accent bg-accent-field p-4 text-center">
        {c.modoQuota === "libera" ? (
          <>
            <p className="text-sm font-semibold text-accent-2">Metti quello che vuoi</p>
            <p className="cifre text-4xl font-bold">{formattaEuro(quota)}</p>
            <p className="text-sm text-ink-soft">suggeriti a testa</p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-accent-2">La tua quota</p>
            <p className="cifre text-5xl font-bold">{formattaEuro(quota)}</p>
            <p className="text-sm text-ink-soft">a testa</p>
          </>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Barra percento={a.percento} etichetta="Avanzamento della raccolta" alta />
        <p className="text-sm" aria-live="polite">
          {testoPartecipazione(c)}
        </p>
        {c.stato === "aperta" ? (
          <p className="text-sm text-ink-soft">
            {scaduta ? "La raccolta è scaduta" : `Si chiude il ${dataBreve(c.scadenza)} alle 20:00`}
          </p>
        ) : null}
      </div>
    </div>
  );
}
