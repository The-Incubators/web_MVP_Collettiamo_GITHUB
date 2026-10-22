import { Icona } from "@/components/ui";
import { formattaEuro } from "@/lib/dominio/importi";
import { classifica, mediaInTesto } from "@/lib/dominio/votazione";
import type { Colletta, Proposta, Voto } from "@/lib/tipi";

/** Dopo il voto: ha vinto questo regalo, e come sono andate le altre idee. */
export function RisultatoVotazione({ colletta: c, proposte, voti }: { colletta: Colletta; proposte: Proposta[]; voti: Voto[] }) {
  const v = c.votazione;
  if (!v?.chiusa) return null;
  const ordine = classifica(proposte, voti);
  const vincente = ordine.find((x) => x.proposta.id === v.propostaVincenteId) ?? ordine[0];
  return (
    <div className="flex flex-col gap-2">
      <div role="status" className="flex items-start gap-3 rounded-3xl bg-gold-field p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-vivo text-ink">
          <Icona nome="emoji_events" dimensione={22} />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="font-bold">Il gruppo ha scelto</p>
          {vincente ? (
            <p className="text-sm">
              Ha vinto <strong>{vincente.proposta.prodotto.nome}</strong>
              {vincente.nVoti > 0 ? ` (${mediaInTesto(vincente.media)} ★ su ${vincente.nVoti} ${vincente.nVoti === 1 ? "voto" : "voti"})` : ""}. Ora si parte con la colletta.
            </p>
          ) : (
            <p className="text-sm">La votazione è chiusa. Ora si parte con la colletta.</p>
          )}
        </div>
      </div>
      {ordine.length > 1 ? (
        <details className="rounded-2xl bg-surface px-4 py-1 shadow-carta">
          <summary className="min-h-tocco cursor-pointer py-3 text-sm font-bold">Vedi com’è andata</summary>
          <ol className="flex flex-col gap-2 pb-3">
            {ordine.map((x, i) => (
              <li key={x.proposta.id} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0">
                  {i + 1}. {x.proposta.prodotto.nome} <span className="cifre text-ink-soft">({formattaEuro(x.proposta.prodotto.prezzoCent)})</span>
                </span>
                <span className="cifre shrink-0 font-bold">{x.nVoti ? `${mediaInTesto(x.media)} ★ · ${x.nVoti}` : "—"}</span>
              </li>
            ))}
          </ol>
        </details>
      ) : null}
    </div>
  );
}
