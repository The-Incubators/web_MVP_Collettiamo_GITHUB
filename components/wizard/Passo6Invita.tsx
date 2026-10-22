"use client";

import { AnteprimaChat } from "@/components/AnteprimaChat";
import { BloccoInvito } from "@/components/BloccoInvito";
import { Bottone, Icona, Interruttore } from "@/components/ui";
import { linkColletta, messaggioInvito, messaggioVotazione } from "@/lib/dominio/messaggi";
import { ORE } from "@/lib/dominio/votazione";
import { baseUrlClient } from "@/lib/url";
import type { Colletta } from "@/lib/tipi";
import { campiDaStato, prodottoDaStato } from "./stato";
import type { PropsPasso } from "./tipi";

/** L'ultimo passo: modalità sorpresa accanto all'anteprima che cambia, il messaggio pronto, «Apri la raccolta». */
export function Passo6Invita({ s, cambia, adesso, onApri, apro }: PropsPasso & { onApri: () => void; apro: boolean }) {
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
    <div className="flex flex-col gap-5">
      <p className="inline-flex items-center gap-1.5 self-start rounded-full bg-ok-field px-3 py-1 text-xs font-bold text-ok">
        <Icona nome="celebration" dimensione={16} />
        Tutto pronto
      </p>

      <div className="rounded-3xl bg-surface p-4 shadow-carta">
        <Interruttore
          icona="visibility_off"
          tintaIcona="bg-accent text-on-accent"
          etichetta="Modalità sorpresa"
          descrizione={`Il link non svela regalo né nome, se ${s.festeggiato.trim() || "il festeggiato"} vede la chat.`}
          attivo={s.sorpresa}
          onCambia={(sorpresa) => cambia({ sorpresa })}
        />
      </div>

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

      <div className="flex flex-col gap-2 pt-2">
        <Bottone variante="azione" pieno onClick={onApri} disabled={apro}>
          <Icona nome="rocket_launch" dimensione={22} />
          {apro ? "Apro la raccolta…" : "Apri la raccolta"}
        </Bottone>
        <p className="flex items-start justify-center gap-1.5 text-center text-xs text-ink-soft">
          <Icona nome="info" dimensione={16} />
          {s.votazioneAttiva
            ? `Il link si attiva quando apri la raccolta; la votazione dura ${s.votazioneOre} ore.`
            : "Il link si attiva quando apri la raccolta. Lo ritrovi sempre nella dashboard."}
        </p>
      </div>
    </div>
  );
}
