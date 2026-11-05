import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { IconaTratto } from "./IconaTratto";

/**
 * Il chip di Gifty UX v2 (design.md §4, prototipi/sistema.css `.chip`): tondo, 44 px. Scelta multipla con
 * `aria-pressed` (`modo="multi"`) o singola dentro un `role="radiogroup"` (`modo="radio"`, `aria-checked`).
 * Selezionato: verde pieno con la spunta.
 */
export function Chip({
  scelto,
  modo = "multi",
  children,
  className = "",
  ...resto
}: { scelto: boolean; modo?: "multi" | "radio"; children: ReactNode } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "role">) {
  const stato = modo === "radio" ? { role: "radio" as const, "aria-checked": scelto } : { "aria-pressed": scelto };
  return (
    <button type="button" className={`chip ${className}`.trim()} {...stato} {...resto}>
      {scelto && modo === "multi" ? <IconaTratto nome="spunta" /> : null}
      {children}
    </button>
  );
}

/** Un chip che porta altrove: le risposte modificabili dei risultati, con la matita («Cambia: …» per chi legge lo schermo). */
export function ChipLink({ href, children, etichetta }: { href: string; children: ReactNode; etichetta?: string }) {
  return (
    <Link href={href} className="chip" aria-label={etichetta}>
      {children}
      <IconaTratto nome="matita" className="mat" />
    </Link>
  );
}

/** Segmenti a scelta singola (fasce di prezzo): una barra `wall` con il segmento scelto bianco. */
export function Segmenti<T extends string>({
  etichetta,
  opzioni,
  valore,
  onScegli,
}: {
  etichetta: string;
  opzioni: readonly { valore: T; etichetta: string }[];
  valore: T;
  onScegli: (v: T) => void;
}) {
  return (
    <div className="segmenti" role="radiogroup" aria-label={etichetta}>
      {opzioni.map((o) => (
        <button key={o.valore} type="button" role="radio" aria-checked={o.valore === valore} onClick={() => onScegli(o.valore)}>
          {o.etichetta}
        </button>
      ))}
    </div>
  );
}
