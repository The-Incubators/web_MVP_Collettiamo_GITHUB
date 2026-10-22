"use client";

import { useRef } from "react";
import { BottoneCopia } from "@/components/ui";
import { linkWhatsApp } from "@/lib/dominio/messaggi";
import { classiBottone } from "@/components/ui/Bottone";

/** Il link e il messaggio già scritto, con copia e «Apri WhatsApp». Il pulsante di copia c'è sempre: su desktop wa.me può non fare nulla. */
export function BloccoInvito({ url, messaggio }: { url: string; messaggio: string }) {
  const refUrl = useRef<HTMLElement | null>(null);
  const refMessaggio = useRef<HTMLElement | null>(null);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h3 className="font-sans text-sm font-semibold text-ink-soft">Il link</h3>
        <div className="flex flex-col gap-2 rounded-controllo border border-line bg-surface-2 p-3 sm:flex-row sm:items-center">
          <span ref={refUrl} className="min-w-0 flex-1 break-all font-medium">
            {url}
          </span>
          <BottoneCopia testo={url} etichetta="Copia il link" sorgente={refUrl} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="font-sans text-sm font-semibold text-ink-soft">Il messaggio per il gruppo</h3>
        <p ref={refMessaggio as React.RefObject<HTMLParagraphElement>} className="whitespace-pre-wrap rounded-controllo border border-line bg-surface-2 p-3">
          {messaggio}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <BottoneCopia testo={messaggio} etichetta="Copia il messaggio" sorgente={refMessaggio} piccolo={false} />
          <a href={linkWhatsApp(messaggio)} target="_blank" rel="noopener noreferrer" className={classiBottone("primario", "normale")}>
            Apri WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
