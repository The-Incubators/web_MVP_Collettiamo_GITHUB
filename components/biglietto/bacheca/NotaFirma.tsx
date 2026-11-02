"use client";

import type { ReactNode } from "react";
import { Icona, type NomeIcona } from "@/components/ui";
import type { Firma } from "@/lib/tipi";
import { CLASSI_NOTA, ROTAZIONI } from "./AnteprimaBacheca";

/** La foto del messaggio, se c'è. */
function Foto({ f, className }: { f: Firma; className: string }) {
  if (!f.immagine) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={f.immagine.url} alt="" loading="lazy" width={f.immagine.larghezza || undefined} height={f.immagine.altezza || undefined} className={className} />
  );
}

/** Testo (HTML già ripulito dal server: solo <b> <i> <u> <br>) e firma. */
function Corpo({ f, grande }: { f: Firma; grande?: boolean }) {
  return (
    <>
      <div className="whitespace-normal break-words" dangerouslySetInnerHTML={{ __html: f.messaggioHtml }} />
      <p className={`font-semibold opacity-75 ${grande ? "text-lg" : ""}`}>
        — {f.daParteDi}
        {f.ruolo ? <span className="block text-xs font-normal">{f.ruolo}</span> : null}
      </p>
      {f.immagine?.attribuzione ? <p className="text-[10px] opacity-60">{f.immagine.attribuzione}</p> : null}
    </>
  );
}

/**
 * Un messaggio della bacheca come bigliettino colorato, un po' storto.
 * `children`: i pulsanti in fondo (il proprio messaggio, la moderazione di chi organizza).
 */
export function NotaFirma({
  f,
  colore,
  i,
  evidenziata,
  accento,
  attenuata,
  etichette = [],
  children,
}: {
  f: Firma;
  colore: string;
  i: number;
  /** il proprio messaggio: bordo nel colore d'accento */
  evidenziata?: boolean;
  accento?: string;
  /** nascosto dalla moderazione (lo vede solo chi organizza) */
  attenuata?: boolean;
  /** in cima, piccole: «Tuo», «Nascosto» */
  etichette?: string[];
  children?: ReactNode;
}) {
  return (
    <article
      id={`nota-${f.id}`}
      aria-label={`Messaggio di ${f.daParteDi}`}
      className={`mb-4 flex break-inside-avoid flex-col gap-2 p-4 text-[15px] ${CLASSI_NOTA} ${ROTAZIONI[i % ROTAZIONI.length]} ${attenuata ? "opacity-60" : ""}`}
      style={{ backgroundColor: colore, ...(evidenziata && accento ? { boxShadow: `0 0 0 3px ${accento}, 0 6px 16px -6px rgba(0,0,0,0.25)` } : {}) }}
    >
      {etichette.length ? (
        <span className="-mt-1 flex flex-wrap gap-1">
          {etichette.map((e) => (
            <span key={e} className="whitespace-nowrap rounded-full bg-black/5 px-2 py-0.5 text-xs font-semibold opacity-80">
              {e}
            </span>
          ))}
        </span>
      ) : null}
      <Foto f={f} className="h-auto w-full rounded-xl object-cover" />
      <Corpo f={f} />
      {children ? <div className="-mb-2 -mr-2 flex flex-wrap items-center justify-end gap-1">{children}</div> : null}
    </article>
  );
}

/** Il bigliettino grande, uno alla volta (rivelazione: storie e film). */
export function NotaGrande({ f, colore, className = "" }: { f: Firma; colore: string; className?: string }) {
  return (
    <article aria-label={`Messaggio di ${f.daParteDi}`} className={`flex w-full max-w-md flex-col gap-3 p-6 text-xl ${CLASSI_NOTA} ${className}`} style={{ backgroundColor: colore }}>
      <Foto f={f} className="max-h-[38dvh] w-full rounded-2xl object-cover" />
      <Corpo f={f} grande />
    </article>
  );
}

/** Un pulsante rotondo in fondo al bigliettino (matita, cestino, occhio). */
export function BottoneNota({ icona, etichetta, onClick }: { icona: NomeIcona; etichetta: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={etichetta} title={etichetta} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-black/5">
      <Icona nome={icona} dimensione={20} />
    </button>
  );
}
