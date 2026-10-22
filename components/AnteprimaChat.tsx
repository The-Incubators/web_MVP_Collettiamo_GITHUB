import { ImmagineProdotto } from "@/components/ui";
import { formattaEuro } from "@/lib/dominio/importi";
import { descrizionePubblica, titoloPubblico } from "@/lib/dominio/messaggi";
import type { Colletta } from "@/lib/tipi";

/** Come apparirà il link nella chat: la prima impressione del servizio. */
export function AnteprimaChat({ colletta, dominio }: { colletta: Pick<Colletta, "festeggiato" | "sorpresa" | "prodotto" | "organizzatoreNome" | "quotaCent"> & { votazione?: boolean }; dominio: string }) {
  const titolo = titoloPubblico({ festeggiato: colletta.festeggiato, quotaCent: colletta.quotaCent, sorpresa: colletta.sorpresa, votazione: colletta.votazione });
  const descrizione = descrizionePubblica({ prodottoNome: colletta.prodotto.nome, organizzatoreNome: colletta.organizzatoreNome, sorpresa: colletta.sorpresa, votazione: colletta.votazione });
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-sm font-semibold text-ink-soft">Così appare nella chat</figcaption>
      <div className="overflow-hidden rounded-contenitore border border-line bg-surface">
        {colletta.sorpresa || colletta.votazione ? (
          <div className="flex aspect-[1.91/1] items-center justify-center bg-accent text-on-accent">
            <div className="flex flex-col items-center gap-1 px-4 text-center">
              <span className="font-display text-2xl font-bold">{colletta.votazione ? "Vota il regalo" : "Un regalo a sorpresa"}</span>
              {colletta.votazione ? <span className="text-lg">★★★★★</span> : <span className="cifre text-3xl font-bold">{formattaEuro(colletta.quotaCent)} a testa</span>}
            </div>
          </div>
        ) : (
          <ImmagineProdotto prodotto={colletta.prodotto} className="aspect-[1.91/1] object-cover" />
        )}
        <div className="flex flex-col gap-0.5 border-t border-line p-3">
          <span className="text-xs uppercase tracking-wide text-ink-soft">{dominio}</span>
          <span className="font-semibold">{titolo}</span>
          <span className="text-sm text-ink-soft">{descrizione}</span>
        </div>
      </div>
    </figure>
  );
}
