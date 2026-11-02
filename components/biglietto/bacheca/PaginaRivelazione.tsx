"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icona } from "@/components/ui";
import { testoSu } from "@/lib/dominio/bacheca";
import type { BigliettoPubblico, Firma } from "@/lib/tipi";
import { baseUrlClient } from "@/lib/url";
import { Finestra } from "../comuni";
import { aspettoDaBiglietto } from "./AnteprimaBacheca";
import { Avviso, condividiLink, useAvviso } from "./Avviso";
import { Rivelazione } from "./Rivelazione";
import { useOrganizzatore } from "./useOrganizzatore";

/**
 * /b/[slug] dopo la consegna (o, con `anteprima`, la demo che chi organizza guarda prima di consegnare).
 * Chi organizza ha in fondo «Manda a …» e «Riapri».
 */
export function PaginaRivelazione({ b, firme, anteprima = false }: { b: BigliettoPubblico; firme: Firma[]; anteprima?: boolean }) {
  const router = useRouter();
  const { organizzatore, api } = useOrganizzatore(b);
  const [avviso, setAvviso] = useAvviso();
  const [riapri, setRiapri] = useState(false);
  const [invio, setInvio] = useState(false);
  const accento = aspettoDaBiglietto(b).colori.accento;

  async function manda() {
    const url = `${baseUrlClient()}/b/${b.slug}`;
    setAvviso(await condividiLink(url, b.nome, `${b.festeggiato}, c’è una sorpresa per te 🎁`));
  }

  async function confermaRiapri() {
    setInvio(true);
    try {
      await api(`/api/biglietti/${b.id}/consegna`, { metodo: "POST", bigliettoId: b.id, corpo: { azione: "riapri" } });
      setRiapri(false);
      router.refresh();
    } catch (e) {
      setAvviso(e instanceof Error ? e.message : "Non sono riuscito a riaprire il biglietto. Riprova.");
    } finally {
      setInvio(false);
    }
  }

  const alto = anteprima ? (
    <Link href={`/b/${b.slug}`} className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white/90 py-1 pl-2 pr-4 text-sm font-semibold text-[#16241F] shadow-sollevata hover:bg-white">
      <Icona nome="close" dimensione={20} />
      Anteprima · torna alla bacheca
    </Link>
  ) : null;

  const basso =
    !anteprima && organizzatore ? (
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void manda()}
          className="inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full px-5 text-[17px] font-bold shadow-sollevata"
          style={{ backgroundColor: accento, color: testoSu(accento) }}
        >
          <Icona nome="share" dimensione={22} />
          Manda a {b.festeggiato}
        </button>
        <button type="button" onClick={() => setRiapri(true)} className="inline-flex min-h-14 items-center gap-1.5 rounded-full bg-white px-5 font-semibold text-[#16241F] shadow-sollevata hover:bg-white/90">
          <Icona nome="lock_open" dimensione={20} />
          Riapri
        </button>
      </div>
    ) : null;

  return (
    <>
      <Rivelazione b={b} firme={firme} alto={alto} basso={basso} />
      <Avviso testo={avviso} />
      <Finestra aperta={riapri} onChiudi={() => setRiapri(false)} titolo="Riaprire il biglietto?">
        <div className="flex flex-col gap-4">
          <p>Il link torna a essere la bacheca e si potranno aggiungere altri messaggi. La sorpresa si rivede quando lo consegni di nuovo.</p>
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <button type="button" disabled={invio} onClick={() => void confermaRiapri()} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-accent-2 px-5 font-bold text-white disabled:opacity-60">
              {invio ? "Un momento…" : "Riapri"}
            </button>
            <button type="button" onClick={() => setRiapri(false)} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full border border-line px-5 font-semibold hover:bg-surface-2">
              Annulla
            </button>
          </div>
        </div>
      </Finestra>
    </>
  );
}
