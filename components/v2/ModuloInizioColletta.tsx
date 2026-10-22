"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import { BottoneGoogle } from "@/components/BottoneGoogle";
import { Avviso } from "@/components/ui";
import { Icona } from "@/components/v2/Icona";

/**
 * Primo passo di UX_V2: chi organizza e per quale occasione.
 *
 * Le due risposte non restano qui: vanno al wizard vero (`/crea`), che le riceve come parametri e
 * riparte da dove si era arrivati invece di richiedere le stesse cose. I passi 2 e 3 disegnati nello
 * stepper sono quelli del wizard: finché non arrivano i layout di UX_V2 per quei passi, è il wizard di
 * UX_V1 a portare a termine la colletta, così il percorso funziona davvero da cima a fondo.
 */

/** Le occasioni del mockup. Il valore è quello del dominio (`OCCASIONI` in lib/tipi.ts); «altro» non
 *  ne ha uno, quindi non si passa niente e la sceglie il wizard. */
const OCCASIONI_V2 = [
  { valore: "compleanno", emoji: "🎂", etichetta: "Compleanno" },
  { valore: "laurea", emoji: "🎓", etichetta: "Laurea" },
  { valore: "nascita", emoji: "👶", etichetta: "Nascita" },
  { valore: "matrimonio", emoji: "💍", etichetta: "Matrimonio" },
  { valore: "", emoji: "🥂", etichetta: "Altro evento" },
] as const;

export function ModuloInizioColletta() {
  const router = useRouter();
  const { utente } = useApp();
  const [nome, setNome] = useState("");
  const [occasione, setOccasione] = useState<string>("compleanno");
  const [errore, setErrore] = useState<string | null>(null);

  const nomeScelto = nome.trim() || utente?.nome?.trim() || "";

  function prosegui() {
    if (!nomeScelto) {
      setErrore("Scrivi come ti chiami: il nome comparirà nel messaggio che mandi al gruppo.");
      return;
    }
    const q = new URLSearchParams({ nome: nomeScelto });
    if (occasione) q.set("occasione", occasione);
    router.push(`/crea?${q.toString()}`);
  }

  return (
    <div className="relative mb-6 overflow-hidden rounded-xl bg-surface-cream-card p-5 shadow-md">
      <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-tangerine-tint opacity-70" />

      <div className="relative z-10 mb-5">
        <p className="mb-2 text-center font-label-md text-label-md font-bold text-primary-container">
          {utente ? "Hai già l'accesso: ritrovi la colletta quando vuoi" : "Accesso rapido con 1 tocco:"}
        </p>
        {utente ? (
          <p className="text-center font-body-sm text-[12px] text-text-muted">
            Sei dentro come <strong className="text-primary-container">{utente.nome || utente.email}</strong>.
          </p>
        ) : (
          <>
            <BottoneGoogle />
            <p className="mt-2 text-center font-body-sm text-[12px] text-text-muted">
              Serve solo per farti ritrovare la colletta e modificare i dettagli
            </p>
          </>
        )}
      </div>

      {!utente ? (
        <div className="relative mb-5 flex items-center py-2">
          <div className="h-[1.5px] flex-grow rounded-full bg-surface-container-high" />
          <span className="mx-3 flex-shrink bg-surface-cream-card px-2 font-label-sm text-[12px] uppercase tracking-wider text-text-muted">
            oppure inserisci a mano
          </span>
          <div className="h-[1.5px] flex-grow rounded-full bg-surface-container-high" />
        </div>
      ) : null}

      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="nome-organizzatore" className="mb-1.5 flex items-center justify-between font-label-md text-label-md font-bold text-primary-container">
            <span>
              Come ti chiami? <span className="text-secondary">*</span>
            </span>
            <span className="rounded-full bg-tangerine-tint px-2 py-0.5 font-label-sm text-[11px] font-semibold text-secondary">Visibile nel link</span>
          </label>
          <div className="relative flex items-center">
            <div className="pointer-events-none absolute left-3.5 flex items-center text-primary-container">
              <Icona nome="badge" dimensione={20} />
            </div>
            <input
              id="nome-organizzatore"
              type="text"
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                setErrore(null);
              }}
              placeholder={utente?.nome ? utente.nome : "Es. Chiara, Marco…"}
              maxLength={60}
              autoComplete="given-name"
              className="h-[52px] w-full rounded-xl bg-surface-container-lowest pl-11 pr-4 font-body-md text-body-md text-on-surface shadow-inner transition-colors focus:bg-surface-bright focus:outline-none focus:ring-2 focus:ring-primary-container"
            />
          </div>
          <p className="mt-1.5 flex items-center gap-1 font-body-sm text-[12px] text-text-muted">
            <Icona nome="info" dimensione={14} className="text-primary-container" />
            Questo nome comparirà nel messaggio inviato al gruppo.
          </p>
        </div>

        <div className="pt-1">
          <p className="mb-2 font-label-md text-label-md font-bold text-primary-container" id="occasione-v2">
            Per quale occasione festeggiate?
          </p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="occasione-v2">
            {OCCASIONI_V2.map((o) => {
              const scelta = o.valore === occasione;
              return (
                <button
                  key={o.etichetta}
                  type="button"
                  role="radio"
                  aria-checked={scelta}
                  onClick={() => setOccasione(o.valore)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 font-label-sm text-label-sm transition-all ${
                    scelta ? "bg-secondary-container text-on-secondary shadow-sm" : "bg-surface-container-low text-on-surface hover:bg-forest-tint"
                  }`}
                >
                  <span aria-hidden="true">{o.emoji}</span>
                  <span>{o.etichetta}</span>
                </button>
              );
            })}
          </div>
        </div>

        {errore ? (
          <Avviso tono="attenzione" live>
            <p>{errore}</p>
          </Avviso>
        ) : null}

        <div className="pt-3">
          <button
            type="button"
            onClick={prosegui}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-secondary-container font-label-lg text-label-lg font-bold tracking-wide text-on-secondary shadow-md transition-all hover:bg-secondary hover:shadow-lg active:scale-[0.98]"
          >
            <span>Prosegui verso i dettagli regalo</span>
            <Icona nome="arrow_forward" dimensione={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
