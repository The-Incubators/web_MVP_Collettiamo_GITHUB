"use client";

import { AnteprimaChat } from "@/components/AnteprimaChat";
import { BloccoInvito } from "@/components/BloccoInvito";
import { Avviso, Bottone } from "@/components/ui";
import { linkColletta, messaggioInvito, messaggioVotazione } from "@/lib/dominio/messaggi";
import { ORE } from "@/lib/dominio/votazione";
import { baseUrlClient } from "@/lib/url";
import type { Colletta } from "@/lib/tipi";
import { campiDaStato, prodottoDaStato } from "./stato";
import type { PropsPasso } from "./tipi";

export function Passo6Invita({ s, adesso, onApri, apro }: PropsPasso & { onApri: () => void; apro: boolean }) {
  const campi = campiDaStato(s, adesso);
  const base = baseUrlClient();
  const url = linkColletta(base, s.slug ?? "…");
  const messaggio = s.votazioneAttiva
    ? messaggioVotazione({ festeggiato: s.festeggiato.trim(), scade: Date.now() + s.votazioneOre * ORE, url })
    : messaggioInvito({
        festeggiato: s.festeggiato.trim(),
        quotaCent: campi.quotaCent ?? 0,
        scadenza: campi.scadenza ?? adesso,
        url,
      });
  return (
    <div className="flex flex-col gap-6">
      <AnteprimaChat
        dominio={base.replace(/^https?:\/\//, "")}
        colletta={{
          festeggiato: s.festeggiato.trim(),
          sorpresa: s.sorpresa,
          prodotto: prodottoDaStato(s) as Colletta["prodotto"],
          votazione: s.votazioneAttiva,
          organizzatoreNome: s.organizzatoreNome.trim(),
          quotaCent: campi.quotaCent ?? 0,
        }}
      />
      <BloccoInvito url={url} messaggio={messaggio} />
      <Avviso>
        <p>
          {s.votazioneAttiva ? `Il link si attiva quando apri la raccolta, e da quel momento la votazione dura ${s.votazioneOre} ore. ` : "Il link si attiva quando apri la raccolta. "}
          Lo ritrovi sempre nella tua dashboard.
        </p>
      </Avviso>
      <Bottone pieno onClick={onApri} disabled={apro}>
        {apro ? "Apro la raccolta…" : "Apri la raccolta"}
      </Bottone>
    </div>
  );
}
