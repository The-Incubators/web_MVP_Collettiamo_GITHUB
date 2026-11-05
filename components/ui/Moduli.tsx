import type { InputHTMLAttributes, ReactNode } from "react";
import { IconaTratto } from "./IconaTratto";

/**
 * I campi di Gifty UX v2 (design.md §4, prototipi/sistema.css `.campo`, `.input`): etichetta sopra, 48 px, bordo
 * `line-strong`, larghezza secondo il valore (`w-nome`, `w-importo`, `w-data`, `w-ora`, `w-numero`). L'errore sta
 * accanto al campo e il testo scritto non si cancella. Li usa il wizard (PR 3).
 */
export function CampoModulo({
  id,
  etichetta,
  aiuto,
  errore,
  children,
}: {
  id: string;
  etichetta: ReactNode;
  aiuto?: ReactNode;
  errore?: string;
  children: ReactNode;
}) {
  return (
    <div className="campo">
      <label htmlFor={id}>{etichetta}</label>
      {aiuto ? (
        <p className="aiuto" id={`${id}-aiuto`}>
          {aiuto}
        </p>
      ) : null}
      {children}
      {errore ? (
        <p className="errore-testo" id={`${id}-errore`} role="alert">
          {errore}
        </p>
      ) : null}
    </div>
  );
}

/** L'input del sistema; `larghezza` sceglie la misura secondo il valore atteso. */
export function Input({
  larghezza,
  errore = false,
  className = "",
  ...resto
}: { larghezza?: "nome" | "importo" | "data" | "ora" | "numero"; errore?: boolean } & InputHTMLAttributes<HTMLInputElement>) {
  const w = larghezza ? `w-${larghezza}` : "";
  return <input className={`input ${w} ${errore ? "errore" : ""} ${className}`.replace(/\s+/g, " ").trim()} aria-invalid={errore || undefined} {...resto} />;
}

/** Un importo con «€» dentro a destra. */
export function InputImporto(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <span className="con-unita">
      <input className="input w-importo" inputMode="decimal" {...props} />
      <span aria-hidden="true">€</span>
    </span>
  );
}

/** Un numero con il contatore −/+. */
export function Contatore({
  id,
  valore,
  min,
  max,
  onCambia,
  etichettaMeno,
  etichettaPiu,
  etichettaId,
}: {
  id?: string;
  /** l'id dell'etichetta visibile: il contatore diventa un gruppo con quel nome */
  etichettaId?: string;
  valore: number;
  min: number;
  max: number;
  onCambia: (n: number) => void;
  etichettaMeno: string;
  etichettaPiu: string;
}) {
  return (
    <span className="contatore" role={etichettaId ? "group" : undefined} aria-labelledby={etichettaId}>
      <button type="button" aria-label={etichettaMeno} disabled={valore <= min} onClick={() => onCambia(Math.max(min, valore - 1))}>
        <IconaTratto nome="meno" />
      </button>
      <output id={id} aria-live="polite">
        {valore}
      </output>
      <button type="button" aria-label={etichettaPiu} disabled={valore >= max} onClick={() => onCambia(Math.min(max, valore + 1))}>
        <IconaTratto nome="piu" />
      </button>
    </span>
  );
}

/** Una casella da spuntare con il testo accanto, alta almeno 44 px. */
export function SpuntaRiga({ children, ...resto }: { children: ReactNode } & Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  return (
    <label className="spunta-riga">
      <input type="checkbox" {...resto} />
      <span>{children}</span>
    </label>
  );
}

/** La scelta grande: radio visibile, nome Urbanist 20, una riga di supporto. Va dentro un `role="radiogroup"`. */
export function SceltaGrande({
  scelto,
  nome,
  children,
  onScegli,
  extra,
  className = "",
}: {
  scelto: boolean;
  nome: ReactNode;
  children?: ReactNode;
  /** sotto la riga di supporto (il regalo già scelto, nel wizard) */
  extra?: ReactNode;
  onScegli: () => void;
  className?: string;
}) {
  return (
    <button type="button" role="radio" aria-checked={scelto} className={`scelta ${className}`.trim()} onClick={onScegli}>
      <span className="radio" aria-hidden="true" />
      <span className="grid gap-1">
        <span className="nome">{nome}</span>
        {children ? <span className="muted">{children}</span> : null}
        {extra}
      </span>
    </button>
  );
}
