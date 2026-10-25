"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avviso, SchedaScelta } from "@/components/ui";
import { COOKIE_UX, DURATA_COOKIE_UX, VARIANTI_UX } from "@/lib/ux";

/**
 * La scelta della variante di front-end. Scrive il cookie dal browser — è una preferenza di interfaccia,
 * non un dato da proteggere — e poi chiede al server di ricostruire la pagina, così la variante attiva
 * mostrata qui è quella vera, letta dal cookie, e non una copia tenuta a parte.
 */
export function SceltaUx({ attiva }: { attiva: string }) {
  const router = useRouter();
  const [messaggio, setMessaggio] = useState<string | null>(null);

  function scegli(id: string) {
    document.cookie = `${COOKIE_UX}=${encodeURIComponent(id)}; path=/; max-age=${DURATA_COOKIE_UX}; SameSite=Lax`;
    const scelta = VARIANTI_UX.find((v) => v.id === id);
    setMessaggio(`Ora navighi con ${scelta?.nome ?? id}.`);
    // Si va subito nella variante scelta: restare qui, che è una pagina di UX_V4, non mostrerebbe il cambio.
    if (scelta && scelta.percorso !== "/scegli-ux") router.push(scelta.percorso);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="radiogroup" aria-label="Variante di navigazione" className="flex flex-col gap-3">
        {VARIANTI_UX.map((v) => {
          const selezionata = v.id === attiva;
          if (!v.disponibile) {
            // Annunciata ma non pronta: si vede, non si sceglie. Niente scheda cliccabile che non fa nulla.
            return (
              <div key={v.id} className="flex items-start gap-3 rounded-3xl border border-dashed border-line-forte bg-surface-2 p-4">
                <span aria-hidden="true" className="mt-0.5 h-6 w-6 shrink-0 rounded-full border border-dashed border-line" />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="font-display text-lg font-bold leading-tight">
                    {v.nome} <span className="font-sans text-sm font-semibold text-ink-soft">· {v.sommario}</span>
                  </p>
                  <p className="text-sm text-ink-soft">{v.descrizione}</p>
                </div>
              </div>
            );
          }
          return (
            <SchedaScelta
              key={v.id}
              titolo={`${v.nome} · ${v.sommario}`}
              descrizione={v.descrizione}
              selezionata={selezionata}
              onSeleziona={() => scegli(v.id)}
              extra={selezionata ? <span className="mt-1 self-start rounded-full bg-ok-field px-3 py-0.5 text-xs font-bold text-ok">In uso adesso</span> : null}
            />
          );
        })}
      </div>
      {messaggio ? (
        <Avviso tono="positivo" live>
          <p>{messaggio}</p>
        </Avviso>
      ) : null}
    </div>
  );
}
