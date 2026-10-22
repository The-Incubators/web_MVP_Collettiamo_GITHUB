"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { OCCASIONI_BIGLIETTO } from "@/lib/tipi";
import { salvaChiaveBozza, useApi } from "@/lib/biglietti/client";
import { BottonePillola, IntestazioneWizard, SchedaRadio } from "../comuni";
import { Tendina } from "../campi";

/** Passo 1 — Che cosa vuoi fare (spec 4.1). */
export function Passo1() {
  const router = useRouter();
  const api = useApi();
  const [banner, setBanner] = useState(true);
  const [tipo, setTipo] = useState<"firma" | "regalo" | null>(null);
  const [occasione, setOccasione] = useState<string | null>(null);
  const [invio, setInvio] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const idEtichetta = useId();

  async function avanti() {
    if (!tipo || !occasione) return;
    // S1: il regalo insieme passa dalla colletta esistente, con il biglietto collegato. Nessun pagamento qui.
    if (tipo === "regalo") {
      router.push(`/crea?biglietto=1&occasione=${encodeURIComponent(occasione)}`);
      return;
    }
    setInvio(true);
    setErrore(null);
    try {
      const r = await api<{ id: string; chiave: string }>("/api/biglietti", { metodo: "POST", corpo: { occasione } });
      salvaChiaveBozza(r.id, r.chiave);
      router.push(`/biglietto/${r.id}/dettagli`);
    } catch {
      setErrore("Non sono riuscito a creare il biglietto. Riprova.");
      setInvio(false);
    }
  }

  return (
    <>
      <IntestazioneWizard indietro="/" segmenti={3} percento={0} />
      <main className="gutter mx-auto flex w-full max-w-[600px] flex-col gap-6 pb-16 pt-6">
        {banner ? (
          <div className="flex items-start gap-3 rounded-3xl bg-surface-2 p-4">
            <span aria-hidden="true" className="text-xl">
              💌
            </span>
            <p className="flex-1 text-sm">Il biglietto è gratuito. Se vuoi anche raccogliere i soldi per un regalo, scegli la seconda opzione.</p>
            <button type="button" onClick={() => setBanner(false)} aria-label="Chiudi" className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl hover:bg-surface">
              <span aria-hidden="true">×</span>
            </button>
          </div>
        ) : null}

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 font-display text-[32px] font-bold leading-[38px] tracking-tight text-accent-2">Voglio invitare il gruppo a…</legend>
          <SchedaRadio nome="tipo" valore="firma" scelto={tipo === "firma"} onScegli={() => setTipo("firma")} etichetta="Firmare un biglietto" info="Ognuno aggiunge il suo messaggio a un biglietto di gruppo." />
          <SchedaRadio
            nome="tipo"
            valore="regalo"
            scelto={tipo === "regalo"}
            onScegli={() => setTipo("regalo")}
            etichetta="Fare un regalo insieme e firmare il biglietto"
            info="Ognuno mette la sua quota per il regalo e firma il biglietto di gruppo."
          />
        </fieldset>

        <div className="flex items-center gap-3 text-sm text-ink-soft" role="separator">
          <span className="h-px flex-1 bg-line" />
          oppure
          <span className="h-px flex-1 bg-line" />
        </div>

        <Link href="/catalogo" className="flex items-center gap-4 rounded-3xl bg-surface-2 p-4 hover:ring-accent">
          <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-controllo bg-accent-field text-3xl">
            🎁
          </span>
          <span className="flex flex-col">
            <span className="font-semibold">Cerchi un’idea regalo?</span>
            <span className="text-sm text-ink-soft">Sfoglia le nostre idee per occasione</span>
            <span className="text-sm font-semibold text-accent-2">Scopri di più ›</span>
          </span>
        </Link>

        <div className="flex flex-col gap-2">
          <span id={idEtichetta} className={`font-medium ${tipo ? "" : "opacity-50"}`}>
            Per quale occasione?
          </span>
          <Tendina
            id={`${idEtichetta}-campo`}
            etichettaId={idEtichetta}
            valore={occasione}
            disabilitata={!tipo}
            segnaposto="Scegli"
            onScegli={setOccasione}
            opzioni={OCCASIONI_BIGLIETTO.map((o) => ({
              valore: o.valore,
              testo: o.voce,
              etichetta: (
                <span className="flex items-center gap-3">
                  <span aria-hidden="true" className="text-xl">
                    {o.emoji}
                  </span>
                  {o.voce}
                </span>
              ),
            }))}
          />
        </div>

        {errore ? (
          <p role="alert" className="text-sm font-semibold text-error">
            {errore}
          </p>
        ) : null}
        <BottonePillola disabled={!tipo || !occasione || invio} onClick={() => void avanti()}>
          {invio ? "Un momento…" : "Avanti"}
        </BottonePillola>
        <Link href="/#come-funziona" className="mx-auto inline-flex min-h-tocco items-center text-sm font-semibold underline underline-offset-4">
          Come funziona
        </Link>
      </main>
    </>
  );
}
