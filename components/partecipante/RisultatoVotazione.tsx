import { Avviso } from "@/components/ui";
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
      <Avviso tono="positivo" titolo="Il gruppo ha scelto">
        {vincente ? (
          <p>
            Ha vinto <strong>{vincente.proposta.prodotto.nome}</strong>
            {vincente.nVoti > 0 ? `, con ${mediaInTesto(vincente.media)} stelle di media su ${vincente.nVoti} ${vincente.nVoti === 1 ? "voto" : "voti"}` : ", scelta fra le idee senza voti"}. Ora si
            parte con la colletta.
          </p>
        ) : (
          <p>La votazione è chiusa. Ora si parte con la colletta.</p>
        )}
      </Avviso>
      {ordine.length > 1 ? (
        <details className="rounded-controllo border border-line bg-surface p-3">
          <summary className="min-h-tocco cursor-pointer py-2 text-sm font-semibold">Vedi com’è andata</summary>
          <ol className="flex flex-col gap-2 pt-2">
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
