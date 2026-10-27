"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";
import { erroriDettagli, MAX_NOME_BIGLIETTO, slugDaNome, type DatiDettagli } from "@/lib/dominio/biglietti";
import { ErroreApi, leggiSessione, scriviSessione, useApi } from "@/lib/biglietti/client";
import { baseUrlClient } from "@/lib/url";
import type { Biglietto } from "@/lib/tipi";
import { BottonePillola, CLASSI_INPUT, EtichettaCampo, IntestazioneWizard } from "../comuni";
import { AnteprimaLink, CampoRicco, fusoDelBrowser, SelettoreData, SelettoreFuso, SelettoreOra, type StatoLink } from "../campi";
import { StatoBozza } from "../StatoBozza";
import { useBozza } from "../useBozza";

interface Modulo {
  d: DatiDettagli & { messaggioGruppo: string };
  slug: string;
  slugManuale: boolean;
}

function daBiglietto(b: Biglietto): Modulo {
  const salvato = !!b.nome;
  const altra = b.emailAlternativa ?? "";
  return {
    d: {
      festeggiato: b.festeggiato,
      daParteDi: b.daParteDi,
      destinatario: salvato ? b.destinatario : null,
      emailFesteggiato: b.destinatario === "festeggiato" ? b.emailDestinatario : altra,
      emailMia: b.destinatario === "organizzatore" ? b.emailDestinatario : altra,
      // creato dal wizard V2: si propone il giorno dell'evento
      data: b.consegna.data || b.dataEvento || "",
      ora: b.consegna.ora,
      fuso: salvato ? b.consegna.fuso : fusoDelBrowser(),
      nome: b.nome,
      messaggioGruppo: b.messaggioGruppo,
    },
    slug: b.slug,
    slugManuale: !!b.slug && b.slug !== slugDaNome(b.nome),
  };
}

/** Il modulo del passo 2, riusato anche nella finestra «Modifica i dettagli» dell'anteprima. */
export function ModuloDettagli({
  b,
  testoBottone,
  onSalvato,
  chiaveSessione,
}: {
  b: Biglietto;
  testoBottone: string;
  onSalvato: (b: Biglietto) => void;
  chiaveSessione: string;
}) {
  const api = useApi();
  const [m, setM] = useState<Modulo>(() => leggiSessione<Modulo>(chiaveSessione) ?? daBiglietto(b));
  const [statoLink, setStatoLink] = useState<StatoLink>("vuoto");
  const [invio, setInvio] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [giro, setGiro] = useState(0);
  const [dominio, setDominio] = useState("");
  useEffect(() => setDominio(baseUrlClient().replace(/^https?:\/\//, "")), []);
  const id = useId();
  const d = m.d;

  // la bozza dei campi resta in sessionStorage a ogni battitura (ricaricare non perde nulla)
  useEffect(() => scriviSessione(chiaveSessione, m), [m, chiaveSessione]);

  const imposta = <K extends keyof Modulo["d"]>(k: K, v: Modulo["d"][K]) => setM((x) => ({ ...x, d: { ...x.d, [k]: v } }));
  const errori = useMemo(() => erroriDettagli(d), [d]);
  // un biglietto già aperto può tenere la data salvata anche se nel frattempo è passata
  const stessaData = b.stato !== "bozza" && d.data === b.consegna.data && d.ora === b.consegna.ora && d.fuso === b.consegna.fuso;
  const erroriEffettivi = Object.keys(errori).filter((k) => !(stessaData && (k === "data" || k === "consegna")));
  const valido = erroriEffettivi.length === 0 && statoLink === "libero";

  async function salva() {
    if (!valido) return;
    setInvio(true);
    setErrore(null);
    try {
      const r = await api<{ biglietto: Biglietto }>(`/api/biglietti/${b.id}`, { metodo: "PATCH", bigliettoId: b.id, corpo: { dettagli: { ...d, slug: m.slug } } });
      scriviSessione(chiaveSessione, null);
      onSalvato(r.biglietto);
    } catch (e) {
      if (e instanceof ErroreApi && e.status === 409 && (e.dati.campi as Record<string, string> | undefined)?.slug) {
        // preso da qualcun altro tra la verifica e il salvataggio: stesso avviso del passo 2
        setGiro((g) => g + 1);
      } else setErrore(e instanceof Error ? e.message : "Non sono riuscito a salvare. Riprova.");
      setInvio(false);
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <EtichettaCampo per={`${id}-f`} aiuto="Scrivi il nome o il soprannome di chi riceverà il biglietto.">
          Per chi è il biglietto?
        </EtichettaCampo>
        <input id={`${id}-f`} className={CLASSI_INPUT} placeholder="Nome del festeggiato" maxLength={80} autoComplete="off" value={d.festeggiato} onChange={(e) => imposta("festeggiato", e.target.value)} />
      </div>

      <div className="flex flex-col gap-2">
        <EtichettaCampo per={`${id}-p`} aiuto="Scrivi il nome della persona, del gruppo o dell’ente da cui arriva il biglietto.">
          Da parte di chi?
        </EtichettaCampo>
        <input id={`${id}-p`} className={CLASSI_INPUT} placeholder="Es. I colleghi del marketing" maxLength={120} autoComplete="off" value={d.daParteDi} onChange={(e) => imposta("daParteDi", e.target.value)} />
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 font-medium">A chi lo mandiamo?</legend>
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          {(
            [
              ["festeggiato", "All’email del festeggiato"],
              ["organizzatore", "A me"],
            ] as const
          ).map(([v, t]) => (
            <label key={v} className="flex min-h-tocco cursor-pointer items-center gap-2">
              <input type="radio" name={`${id}-dest`} checked={d.destinatario === v} onChange={() => imposta("destinatario", v)} className="h-5 w-5 accent-[var(--accent)]" />
              {t}
            </label>
          ))}
        </div>
        {d.destinatario === "festeggiato" ? (
          <div key="f" className="flex flex-col gap-1 animate-[apri_150ms_ease-out] animate-apri">
            <p className="text-sm text-ink-soft">Ti avvisiamo quando gli è stato consegnato.</p>
            <input aria-label="Email del festeggiato" type="email" inputMode="email" autoComplete="off" className={CLASSI_INPUT} placeholder="Email del festeggiato" value={d.emailFesteggiato} onChange={(e) => imposta("emailFesteggiato", e.target.value)} />
          </div>
        ) : d.destinatario === "organizzatore" ? (
          <div key="o" className="animate-[apri_150ms_ease-out] animate-apri">
            <input aria-label="La tua email" type="email" inputMode="email" autoComplete="email" className={CLASSI_INPUT} placeholder="La tua email" value={d.emailMia} onChange={(e) => imposta("emailMia", e.target.value)} />
          </div>
        ) : null}
      </fieldset>

      <div className="flex flex-col gap-2">
        <EtichettaCampo per={`${id}-d`} aiuto="Manderemo il biglietto in automatico alla data e all’ora che scegli. Ti ricordiamo tutto via email il giorno prima, con un link per modificarlo.">
          Quando lo mandiamo?
        </EtichettaCampo>
        <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
          <SelettoreData id={`${id}-d`} valore={d.data} onScegli={(v) => imposta("data", v)} />
          <SelettoreOra valore={d.ora} onScegli={(v) => imposta("ora", v)} />
        </div>
        <SelettoreFuso valore={d.fuso} onScegli={(v) => imposta("fuso", v)} />
        {errori.consegna && !stessaData && !errori.data ? <p className="text-sm font-semibold text-error">Data e ora sono già passate.</p> : null}
      </div>

      <div className="flex flex-col gap-2">
        <span id={`${id}-m`} className="font-medium">
          Messaggio per il gruppo
        </span>
        <CampoRicco etichettaId={`${id}-m`} valore={d.messaggioGruppo} onCambia={(v) => imposta("messaggioGruppo", v)} segnaposto="Racconta al gruppo che cosa state preparando e che cosa devono fare." />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={`${id}-n`} className="font-medium">
          Dai un nome al tuo biglietto
        </label>
        <p className="text-sm text-ink-soft">Lo usiamo nelle email al gruppo e per creare il link da condividere.</p>
        <input id={`${id}-n`} className={CLASSI_INPUT} placeholder="Es. Compleanno dei 30 di Nicola" autoComplete="off" value={d.nome} onChange={(e) => imposta("nome", e.target.value)} />
        {d.nome.trim().length > MAX_NOME_BIGLIETTO ? <p className="text-sm font-semibold text-error">Il nome supera i 100 caratteri.</p> : null}
        <AnteprimaLink
          bigliettoId={b.id}
          nome={d.nome}
          slug={m.slug}
          manuale={m.slugManuale}
          dominio={dominio}
          onSlug={(slug, manuale) => setM((x) => ({ ...x, slug, slugManuale: manuale }))}
          onStato={setStatoLink}
          ricontrolla={giro}
        />
      </div>

      <RiquadroRegalo />

      {errore ? (
        <p role="alert" className="text-sm font-semibold text-error">
          {errore}
        </p>
      ) : null}
      <BottonePillola disabled={!valido || invio} onClick={() => void salva()}>
        {invio ? "Un momento…" : testoBottone}
      </BottonePillola>
    </div>
  );
}

/** S2: al posto della gift card, un riquadro facoltativo (chiuso) che rimanda al catalogo e alla colletta. */
function RiquadroRegalo() {
  return (
    <details className="group rounded-3xl bg-surface-2">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 font-semibold [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-3">
          <span aria-hidden="true">🎁</span> Vuoi anche fare un regalo di gruppo?
        </span>
        <span aria-hidden="true" className="transition-transform group-open:rotate-180">
          ⌄
        </span>
      </summary>
      <div className="flex flex-col gap-3 px-4 pb-4 text-sm">
        <p>Con una colletta ognuno mette la sua quota: i soldi arrivano direttamente a chi organizza, mai a noi.</p>
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <Link href="/catalogo" className="inline-flex min-h-tocco items-center font-semibold text-accent-2 underline underline-offset-4">
            Sfoglia le idee regalo
          </Link>
          <Link href="/crea" className="inline-flex min-h-tocco items-center font-semibold text-accent-2 underline underline-offset-4">
            Organizza una colletta
          </Link>
        </div>
      </div>
    </details>
  );
}

/** Passo 2 — Le basi (spec 4.2). */
export function Passo2({ id }: { id: string }) {
  const router = useRouter();
  const { b, stato } = useBozza(id);
  return (
    <>
      <IntestazioneWizard indietro="/biglietto/nuovo" segmenti={3} percento={33.3} />
      <main className="gutter mx-auto flex w-full max-w-[600px] flex-col gap-6 pb-16 pt-6">
        {b ? (
          <>
            <h2 className="font-display text-[32px] font-bold leading-[38px] tracking-tight text-accent-2">Cominciamo dalle basi</h2>
            <ModuloDettagli b={b} testoBottone="Avanti" chiaveSessione={`colletta.biglietto.${id}.dettagli`} onSalvato={() => router.push(`/biglietto/${id}/design`)} />
          </>
        ) : (
          <StatoBozza stato={stato === "ok" ? "carica" : stato} />
        )}
      </main>
    </>
  );
}
