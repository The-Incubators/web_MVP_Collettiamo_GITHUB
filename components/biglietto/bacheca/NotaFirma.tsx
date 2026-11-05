"use client";

import type { ReactNode } from "react";
import { Icona, type NomeIcona } from "@/components/ui";
import type { Firma } from "@/lib/tipi";

/** La foto del messaggio, se c'è. */
function Foto({ f }: { f: Firma }) {
  if (!f.immagine) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={f.immagine.url} alt="" loading="lazy" width={f.immagine.larghezza || undefined} height={f.immagine.altezza || undefined} />
  );
}

/** Testo (HTML già ripulito dal server: solo <b> <i> <u> <br>) e il nome di chi firma. */
function Corpo({ f }: { f: Firma }) {
  return (
    <>
      <div className="whitespace-normal break-words" dangerouslySetInnerHTML={{ __html: f.messaggioHtml }} />
      {/* solo il nome: il ruolo («Collega») sotto la firma è stato tolto il 4 novembre 2026 */}
      <span className="chi">{f.daParteDi}</span>
      {f.immagine?.attribuzione ? <span className="text-[12px] opacity-60">{f.immagine.attribuzione}</span> : null}
    </>
  );
}

/**
 * Un messaggio come foglietto firmato (design.md §4, `.foglietto-firma`): carta del colore scelto da chi firma, un po'
 * storta. `children`: i pulsanti in fondo (il proprio messaggio, la moderazione di chi organizza).
 */
export function NotaFirma({
  f,
  colore,
  evidenziata,
  accento,
  attenuata,
  etichette = [],
  className = "",
  children,
}: {
  f: Firma;
  colore: string;
  /** la posizione (non più usata per la rotazione, che fa il CSS) */
  i?: number;
  /** il proprio messaggio: bordo nel colore d'accento */
  evidenziata?: boolean;
  accento?: string;
  /** nascosto dalla moderazione (lo vede solo chi organizza) */
  attenuata?: boolean;
  /** in cima, piccole: «Tuo», «Nascosto» */
  etichette?: string[];
  className?: string;
  children?: ReactNode;
}) {
  return (
    <article
      id={`nota-${f.id}`}
      aria-label={`Messaggio di ${f.daParteDi}`}
      className={`foglietto-firma ${attenuata ? "opacity-60" : ""} ${className}`.replace(/\s+/g, " ").trim()}
      style={{ backgroundColor: colore, ...(evidenziata && accento ? { boxShadow: `0 0 0 3px ${accento}` } : {}) }}
    >
      {etichette.length ? (
        <span className="flex flex-wrap gap-1">
          {etichette.map((e) => (
            <span key={e} className="whitespace-nowrap rounded-full bg-black/5 px-2 py-0.5 text-[12px] font-bold">
              {e}
            </span>
          ))}
        </span>
      ) : null}
      <Foto f={f} />
      <Corpo f={f} />
      {children ? <div className="-mb-2 -mr-2 flex flex-wrap items-center justify-end gap-1">{children}</div> : null}
    </article>
  );
}

/** Il foglietto grande, uno alla volta (apertura: storia e film). */
export function NotaGrande({ f, colore, className = "" }: { f: Firma; colore: string; className?: string }) {
  return (
    <article aria-label={`Messaggio di ${f.daParteDi}`} className={`foglietto-firma grande-r ${className}`.trim()} style={{ backgroundColor: colore }}>
      <Foto f={f} />
      <Corpo f={f} />
    </article>
  );
}

/** Un pulsante rotondo in fondo al foglietto (matita, cestino, occhio). */
export function BottoneNota({ icona, etichetta, onClick }: { icona: NomeIcona; etichetta: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={etichetta} title={etichetta} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-black/5">
      <Icona nome={icona} dimensione={20} />
    </button>
  );
}
