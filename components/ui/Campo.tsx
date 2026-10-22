"use client";

import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

const CLASSI_CONTROLLO =
  "min-h-tocco w-full min-w-0 max-w-full rounded-controllo border border-line bg-surface px-3 py-2 text-base text-ink placeholder:text-ink-soft aria-[invalid=true]:border-2 aria-[invalid=true]:border-error aria-[invalid=true]:bg-error-field";

interface Comuni {
  etichetta: string;
  suggerimento?: ReactNode;
  errore?: string | null;
  /** nasconde l'etichetta alla vista ma la lascia per gli screen reader */
  etichettaNascosta?: boolean;
}

function Guscio({
  id,
  etichetta,
  etichettaNascosta,
  suggerimento,
  errore,
  children,
}: Comuni & { id: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={etichettaNascosta ? "sr-only" : "text-sm font-medium text-ink"}>
        {etichetta}
      </label>
      {children}
      {suggerimento && !errore ? (
        <p id={`${id}-aiuto`} className="text-sm text-ink-soft">
          {suggerimento}
        </p>
      ) : null}
      {errore ? (
        <p id={`${id}-errore`} role="alert" className="text-sm font-semibold text-error before:mr-1 before:content-['⚠']">
          {errore}
        </p>
      ) : null}
    </div>
  );
}

function descrizione(id: string, p: Comuni): string | undefined {
  if (p.errore) return `${id}-errore`;
  return p.suggerimento ? `${id}-aiuto` : undefined;
}

export function Campo({
  etichetta,
  suggerimento,
  errore,
  etichettaNascosta,
  className = "",
  ...resto
}: Comuni & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <Guscio id={id} {...{ etichetta, suggerimento, errore, etichettaNascosta }}>
      <input
        id={id}
        className={`${CLASSI_CONTROLLO} ${className}`}
        aria-invalid={errore ? true : undefined}
        aria-describedby={descrizione(id, { etichetta, suggerimento, errore })}
        {...resto}
      />
    </Guscio>
  );
}

export function CampoTesto({
  etichetta,
  suggerimento,
  errore,
  etichettaNascosta,
  className = "",
  ...resto
}: Comuni & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <Guscio id={id} {...{ etichetta, suggerimento, errore, etichettaNascosta }}>
      <textarea
        id={id}
        className={`${CLASSI_CONTROLLO} min-h-24 resize-y ${className}`}
        aria-invalid={errore ? true : undefined}
        aria-describedby={descrizione(id, { etichetta, suggerimento, errore })}
        {...resto}
      />
    </Guscio>
  );
}

export function CampoSelezione({
  etichetta,
  suggerimento,
  errore,
  etichettaNascosta,
  className = "",
  children,
  ...resto
}: Comuni & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <Guscio id={id} {...{ etichetta, suggerimento, errore, etichettaNascosta }}>
      <select
        id={id}
        className={`${CLASSI_CONTROLLO} ${className}`}
        aria-invalid={errore ? true : undefined}
        aria-describedby={descrizione(id, { etichetta, suggerimento, errore })}
        {...resto}
      >
        {children}
      </select>
    </Guscio>
  );
}
