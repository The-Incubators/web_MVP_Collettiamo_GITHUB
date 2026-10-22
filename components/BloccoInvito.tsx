"use client";

import { useRef } from "react";
import { BottoneCopia, Icona } from "@/components/ui";
import { linkWhatsApp } from "@/lib/dominio/messaggi";

/**
 * Il messaggio già scritto (come apparirà in WhatsApp) e il link, con copia e «Condividi su WhatsApp».
 * Il pulsante di copia c'è sempre: su desktop wa.me può non fare nulla. Il verde di WhatsApp con il testo
 * bianco non è leggibile (2:1), quindi il testo è scuro.
 */
export function BloccoInvito({ url, messaggio }: { url: string; messaggio: string }) {
  const refUrl = useRef<HTMLElement | null>(null);
  const refMessaggio = useRef<HTMLElement | null>(null);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-ink-soft">Il messaggio per il gruppo</h3>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-soft">
            <Icona nome="chat" dimensione={16} />
            Pronto da inviare
          </span>
        </div>
        <div className="rounded-3xl bg-surface-2 p-3">
          <p
            ref={refMessaggio as React.RefObject<HTMLParagraphElement>}
            className="whitespace-pre-wrap break-words rounded-2xl rounded-tl-sm bg-[#dcf8c6] p-3 text-sm text-[#111b21] shadow-carta"
          >
            {messaggio}
          </p>
        </div>
        <BottoneCopia testo={messaggio} etichetta="Copia il messaggio" sorgente={refMessaggio} piccolo={false} pieno />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-ink-soft">Il link diretto</h3>
        <div className="flex items-center gap-2 rounded-full bg-surface py-1.5 pl-4 pr-1.5 shadow-carta">
          <Icona nome="link" dimensione={20} className="text-ink-soft" />
          <span ref={refUrl} className="min-w-0 flex-1 truncate text-sm font-semibold">
            {url}
          </span>
          <BottoneCopia testo={url} etichetta="Copia" sorgente={refUrl} />
        </div>
      </div>

      <a
        href={linkWhatsApp(messaggio)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-azione w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 font-bold text-[#0b3d21] transition-colors hover:bg-[#1fbe5b]"
      >
        <Icona nome="chat" dimensione={22} />
        Condividi su WhatsApp
      </a>
    </div>
  );
}
