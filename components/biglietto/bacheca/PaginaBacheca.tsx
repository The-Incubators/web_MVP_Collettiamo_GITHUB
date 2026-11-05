"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icona } from "@/components/ui";
import { cambiaFirmatario, leggiSessione, scriviSessione, useApi } from "@/lib/biglietti/client";
import { coloreDellaNota, htmlDaTestoSemplice, testoSu } from "@/lib/dominio/bacheca";
import { firmeOrdinate } from "@/lib/dominio/biglietto";
import { STILE_PREDEFINITO, testoDaHtml } from "@/lib/dominio/biglietti";
import type { BigliettoPubblico, Firma } from "@/lib/tipi";
import { baseUrlClient } from "@/lib/url";
import { Finestra } from "../comuni";
import { immaginePerServer } from "../firma/bozza";
import { aspettoDaBiglietto, stileSfondo, TestaBacheca, testoSopra } from "./AnteprimaBacheca";
import { Avviso, condividiLink, useAvviso } from "./Avviso";
import { Coriandoli } from "./Coriandoli";
import { EditorNota, NOTA_VUOTA, type NotaInCorso } from "./EditorNota";
import { BottoneNota, NotaFirma } from "./NotaFirma";
import { useOrganizzatore } from "./useOrganizzatore";

const chiaveBozza = (slug: string) => `colletta.nota.${slug}`;

function notaDaFirma(f: Firma, colore: string): NotaInCorso {
  return {
    testo: testoDaHtml(f.messaggioHtml),
    nome: f.daParteDi,
    colore,
    foto: f.immagine ? { tipo: "mantieni", url: f.immagine.url, larghezza: f.immagine.larghezza, altezza: f.immagine.altezza, attribuzione: f.immagine.attribuzione } : null,
  };
}

/** I pulsanti delle finestre di conferma: azione a destra (sopra, sul telefono), «Annulla» accanto. */
function Conferma({ etichetta, pericolo, invio, onConferma, onAnnulla }: { etichetta: string; pericolo?: boolean; invio?: boolean; onConferma: () => void; onAnnulla: () => void }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row-reverse">
      <button type="button" disabled={invio} aria-busy={invio || undefined} onClick={onConferma} className={`btn flex-1 ${pericolo ? "bg-error text-white" : "btn-primario"}`}>
        {etichetta}
      </button>
      <button type="button" onClick={onAnnulla} className="btn btn-contorno flex-1">
        Annulla
      </button>
    </div>
  );
}

/**
 * La bacheca di chi firma (/b/[slug]): titolo, benvenuto e i messaggi come bigliettini.
 * «Lascia il tuo messaggio» apre un bigliettino in cima che è anche l'editor; pubblicato, piovono i coriandoli.
 * Chi ha già firmato da questo dispositivo ritrova il suo bigliettino, e può modificarlo o eliminarlo.
 * Chi organizza vede anche i messaggi nascosti, li nasconde o li elimina, e consegna il biglietto (🎁);
 * con «Vista ospiti» la vede come tutti gli altri.
 */
export function PaginaBacheca({ b, firme: iniziali }: { b: BigliettoPubblico; firme: Firma[] }) {
  const api = useApi();
  const router = useRouter();
  const aspetto = useMemo(() => aspettoDaBiglietto(b), [b]);
  const accento = aspetto.colori.accento;
  const aperto = b.stato === "aperto";
  const org = useOrganizzatore(b);
  const [comeOspite, setComeOspite] = useState(false);
  const moderazione = org.organizzatore && !comeOspite;

  const [firme, setFirme] = useState(iniziali);
  const [mia, setMia] = useState<Firma | null>(null);
  const [nota, setNota] = useState<NotaInCorso | null>(null);
  const [invio, setInvio] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [scatto, setScatto] = useState(0);
  const [daMostrare, setDaMostrare] = useState<string | null>(null);
  const [avviso, setAvviso] = useAvviso();
  const [elimina, setElimina] = useState(false);
  const [daEliminare, setDaEliminare] = useState<Firma | null>(null);
  const [consegna, setConsegna] = useState(false);
  const [attesa, setAttesa] = useState(false);
  const rifEditor = useRef<HTMLDivElement>(null);

  // ho già firmato da questo dispositivo? Il mio bigliettino si riconosce e si modifica, non si duplica.
  useEffect(() => {
    if (!aperto) return;
    api<{ firma: Firma | null }>(`/api/b/${b.slug}/mia-firma`, { firmatario: b.slug })
      .then(({ firma }) => setMia(firma))
      .catch(() => {});
  }, [aperto, api, b.slug]);

  // chi organizza vede anche i nascosti (attenuati); gli altri solo quelli visibili
  const ordinate = useMemo(() => moderazione && org.tutte ? firmeOrdinate(org.tutte, b.ordineFirme, true) : firmeOrdinate(firme, b.ordineFirme), [moderazione, org.tutte, firme, b.ordineFirme]);
  const colori = useMemo(() => new Map(ordinate.map((f, i) => [f.id, coloreDellaNota(f.coloreNota, i)])), [ordinate]);
  const nVisibili = ordinate.filter((f) => !f.nascosta).length;

  // dopo la pubblicazione si scorre fino al proprio bigliettino
  useEffect(() => {
    if (!daMostrare) return;
    document.getElementById(`nota-${daMostrare}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    setDaMostrare(null);
  }, [daMostrare, firme]);

  const cambia = useCallback(
    (n: NotaInCorso | null) => {
      setNota(n);
      scriviSessione(chiaveBozza(b.slug), n);
    },
    [b.slug],
  );

  /** Rilegge i messaggi (quelli di tutti e, per chi organizza, anche i nascosti): compaiono anche quelli arrivati nel frattempo. */
  async function rileggi() {
    const { firme: nuove } = await api<{ firme: Firma[] }>(`/api/b/${b.slug}`);
    setFirme(nuove);
    if (org.organizzatore) await org.ricarica();
  }

  function apri() {
    setErrore(null);
    const salvata = leggiSessione<NotaInCorso>(chiaveBozza(b.slug));
    setNota(salvata ?? (mia ? notaDaFirma(mia, colori.get(mia.id) ?? coloreDellaNota(mia.coloreNota, 0)) : NOTA_VUOTA));
    requestAnimationFrame(() => rifEditor.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function annulla() {
    setErrore(null);
    cambia(null);
  }

  /** Su un dispositivo condiviso: da qui in poi firma un'altra persona, senza toccare il messaggio di prima. */
  function altraPersona() {
    cambiaFirmatario(b.slug);
    setMia(null);
    setErrore(null);
    cambia(NOTA_VUOTA);
  }

  async function pubblica() {
    if (!nota) return;
    setInvio(true);
    setErrore(null);
    const firma = nota.nome.trim();
    try {
      const r = await api<{ firmaId: string; nuova: boolean }>(`/api/b/${b.slug}/firma`, {
        metodo: "POST",
        firmatario: b.slug,
        corpo: {
          messaggioHtml: htmlDaTestoSemplice(nota.testo.trim()),
          // chi aveva firmato dalla pagina di prima tiene stile, ruolo e dati che aveva lasciato
          stile: mia?.stile ?? STILE_PREDEFINITO,
          immagine: immaginePerServer(nota.foto),
          daParteDi: firma,
          nome: mia?.nome || firma,
          cognome: mia?.cognome ?? "",
          ruolo: mia?.ruolo ?? "",
          email: mia?.email ?? "",
          coloreNota: nota.colore,
        },
      });
      const [{ firma: salvata }] = await Promise.all([api<{ firma: Firma | null }>(`/api/b/${b.slug}/mia-firma`, { firmatario: b.slug }), rileggi()]);
      setMia(salvata);
      cambia(null);
      setDaMostrare(r.firmaId);
      setScatto(Date.now());
      setAvviso(r.nuova ? "Fatto! Il tuo messaggio è sul biglietto." : "Modifiche salvate.");
    } catch (e) {
      setErrore(e instanceof Error ? e.message : "Non sono riuscito a pubblicare il messaggio. Riprova.");
    } finally {
      setInvio(false);
    }
  }

  async function confermaElimina() {
    setElimina(false);
    try {
      await api(`/api/b/${b.slug}/firma`, { metodo: "DELETE", firmatario: b.slug });
      setFirme((x) => x.filter((f) => f.id !== mia?.id));
      org.setTutte((x) => x && x.filter((f) => f.id !== mia?.id));
      setMia(null);
      scriviSessione(chiaveBozza(b.slug), null);
      setAvviso("Messaggio eliminato.");
    } catch (e) {
      setAvviso(e instanceof Error ? e.message : "Non sono riuscito a eliminare il messaggio. Riprova.");
    }
  }

  // ---------- chi organizza ----------

  async function nascondi(f: Firma) {
    try {
      await org.api(`/api/biglietti/${b.id}/firme/${f.id}`, { metodo: "PATCH", bigliettoId: b.id, corpo: { nascosta: !f.nascosta } });
      await rileggi();
      setAvviso(f.nascosta ? "Il messaggio è di nuovo visibile." : "Messaggio nascosto: lo vedi solo tu.");
    } catch (e) {
      setAvviso(e instanceof Error ? e.message : "Non ci sono riuscito. Riprova.");
    }
  }

  async function confermaEliminaOrg() {
    const f = daEliminare;
    if (!f) return;
    setAttesa(true);
    try {
      await org.api(`/api/biglietti/${b.id}/firme/${f.id}`, { metodo: "DELETE", bigliettoId: b.id });
      if (f.id === mia?.id) setMia(null);
      await rileggi();
      setAvviso("Messaggio eliminato.");
    } catch (e) {
      setAvviso(e instanceof Error ? e.message : "Non sono riuscito a eliminare il messaggio. Riprova.");
    } finally {
      setAttesa(false);
      setDaEliminare(null);
    }
  }

  async function consegnaOra() {
    setAttesa(true);
    try {
      await org.api(`/api/biglietti/${b.id}/consegna`, { metodo: "POST", bigliettoId: b.id, corpo: { azione: "consegna" } });
      setConsegna(false);
      // la pagina si rifà dal server: lo stesso link ora è la rivelazione
      router.refresh();
    } catch (e) {
      setAvviso(e instanceof Error ? e.message : "Non sono riuscito a consegnare il biglietto. Riprova.");
    } finally {
      setAttesa(false);
    }
  }

  async function condividi() {
    const url = `${baseUrlClient()}/b/${b.slug}`;
    setAvviso(await condividiLink(url, aspetto.titolo, `Stiamo preparando un biglietto per ${b.festeggiato}: lascia anche tu un messaggio, ci vuole un minuto.`));
  }

  const coloreTesto = testoSopra(aspetto);
  const visibili = nota && mia ? ordinate.filter((f) => f.id !== mia.id) : ordinate;

  return (
    <div className="relative flex min-h-dvh flex-col">
      <div aria-hidden="true" className="fixed inset-0 z-0" style={stileSfondo(aspetto)} />

      <div className="relative z-10 mx-auto flex w-full max-w-[760px] flex-1 flex-col px-4 pb-36 pt-4">
        <div className="flex items-start justify-between gap-2">
          {org.organizzatore ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setComeOspite((x) => !x)}
                aria-pressed={comeOspite}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white/90 py-1 pl-3 pr-4 text-sm font-semibold text-[#16241F] shadow-sollevata hover:bg-white"
              >
                <Icona nome={comeOspite ? "visibility_off" : "visibility"} dimensione={20} />
                {comeOspite ? "Torna a gestire" : "Vista ospiti"}
              </button>
              {!comeOspite ? (
                <Link
                  href={`/biglietto/${b.id}/gestisci`}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-black/25 py-1 pl-3 pr-4 text-sm font-semibold text-white backdrop-blur hover:bg-black/40"
                >
                  <Icona nome="tune" dimensione={20} />
                  Gestisci
                </Link>
              ) : null}
            </div>
          ) : (
            <span />
          )}
          <Link
            href="/biglietto/nuovo"
            aria-label="Crea anche tu un biglietto di gruppo"
            title="Crea anche tu un biglietto di gruppo"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur hover:bg-black/40"
          >
            <Icona nome="auto_awesome" dimensione={22} />
          </Link>
        </div>

        <div className="mb-6 mt-2">
          <TestaBacheca aspetto={aspetto} nMessaggi={nVisibili} vera />
        </div>

        {nota ? (
          <div ref={rifEditor} className="mx-auto mb-6 w-full max-w-md scroll-mt-4">
            <EditorNota
              nota={nota}
              onNota={cambia}
              onPubblica={() => void pubblica()}
              onAnnulla={annulla}
              onAltraPersona={mia ? altraPersona : undefined}
              accento={accento}
              modifica={!!mia}
              invio={invio}
              errore={errore}
            />
          </div>
        ) : null}

        {visibili.length > 0 ? (
          <div className="columns-2 gap-4 sm:columns-3">
            {visibili.map((f, i) => {
              const propria = !!mia && f.id === mia.id;
              const etichette = [propria ? "Tuo" : "", moderazione && f.nascosta ? "Nascosto" : ""].filter(Boolean);
              const mieAzioni = propria && aperto;
              return (
                <NotaFirma key={f.id} f={f} i={i} className="mb-4 break-inside-avoid" colore={colori.get(f.id) ?? coloreDellaNota(f.coloreNota, i)} evidenziata={propria} accento={accento} attenuata={moderazione && f.nascosta} etichette={etichette}>
                  {mieAzioni || moderazione ? (
                    <>
                      {mieAzioni ? <BottoneNota icona="edit" etichetta="Modifica il tuo messaggio" onClick={apri} /> : null}
                      {moderazione ? (
                        <BottoneNota
                          icona={f.nascosta ? "visibility" : "visibility_off"}
                          etichetta={f.nascosta ? `Mostra il messaggio di ${f.daParteDi}` : `Nascondi il messaggio di ${f.daParteDi}`}
                          onClick={() => void nascondi(f)}
                        />
                      ) : null}
                      {moderazione ? (
                        <BottoneNota icona="delete" etichetta={`Elimina il messaggio di ${f.daParteDi}`} onClick={() => setDaEliminare(f)} />
                      ) : mieAzioni ? (
                        <BottoneNota icona="delete" etichetta="Elimina il tuo messaggio" onClick={() => setElimina(true)} />
                      ) : null}
                    </>
                  ) : null}
                </NotaFirma>
              );
            })}
          </div>
        ) : !nota ? (
          <div className="mx-auto mt-6 flex max-w-xs flex-col items-center gap-2 rounded-3xl bg-white/85 p-6 text-center text-[#16241F] shadow-carta">
            <span aria-hidden="true" className="text-4xl">
              💬
            </span>
            <p className="font-semibold">{aperto ? "Ancora nessun messaggio" : "Nessun messaggio"}</p>
            {aperto ? <p className="text-sm opacity-70">Scrivi tu il primo: gli altri seguiranno.</p> : null}
          </div>
        ) : null}

        <p className="firma-g mt-6" style={{ color: coloreTesto }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/gifty-nastro.svg" alt="" />
          Fatto con Gifty
        </p>
      </div>

      {/* in basso: scrivere, condividere e (chi organizza) consegnare; sparisce mentre si scrive: il bigliettino ha il suo pulsante */}
      {!nota ? (
        <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/30 to-transparent pb-[max(1rem,env(safe-area-inset-bottom))] pt-6">
          <div className="mx-auto flex w-full max-w-[520px] items-center gap-3 px-4">
            {aperto ? (
              <>
                <button
                  type="button"
                  onClick={apri}
                  className="inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full px-6 text-[18px] font-bold shadow-sollevata"
                  style={{ backgroundColor: accento, color: testoSu(accento) }}
                >
                  <Icona nome={mia ? "edit" : "draw"} dimensione={22} />
                  {mia ? "Modifica il tuo messaggio" : "Lascia il tuo messaggio"}
                </button>
                <button
                  type="button"
                  onClick={() => void condividi()}
                  aria-label="Condividi il link del biglietto"
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-[#16241F] shadow-sollevata hover:bg-white/90"
                >
                  <Icona nome="share" dimensione={22} />
                </button>
                {moderazione ? (
                  <button
                    type="button"
                    onClick={() => setConsegna(true)}
                    aria-label="Consegna il biglietto"
                    title="Consegna il biglietto"
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-2xl shadow-sollevata hover:bg-white/90"
                  >
                    <span aria-hidden="true">🎁</span>
                  </button>
                ) : null}
              </>
            ) : (
              <p className="flex-1 rounded-full bg-white/90 px-5 py-4 text-center font-semibold text-[#16241F] shadow-sollevata">Questo biglietto non accetta più messaggi.</p>
            )}
          </div>
        </div>
      ) : null}

      <Avviso testo={avviso} />
      <Coriandoli scatto={scatto} emoji={aspetto.emoji || "🎉"} />

      <Finestra aperta={elimina} onChiudi={() => setElimina(false)} titolo="Eliminare il tuo messaggio?">
        <div className="flex flex-col gap-4">
          <p>Sparisce dal biglietto, con la sua foto. Se cambi idea potrai scriverne uno nuovo.</p>
          <Conferma etichetta="Elimina" pericolo onConferma={() => void confermaElimina()} onAnnulla={() => setElimina(false)} />
        </div>
      </Finestra>

      <Finestra aperta={!!daEliminare} onChiudi={() => setDaEliminare(null)} titolo={`Eliminare il messaggio di ${daEliminare?.daParteDi ?? ""}?`}>
        <div className="flex flex-col gap-4">
          <p>Sparisce per sempre, con la sua foto. Se vuoi solo toglierlo dalla vista, nascondilo: potrai rimostrarlo quando vuoi.</p>
          <Conferma etichetta="Elimina" pericolo invio={attesa} onConferma={() => void confermaEliminaOrg()} onAnnulla={() => setDaEliminare(null)} />
        </div>
      </Finestra>

      <Finestra aperta={consegna} onChiudi={() => setConsegna(false)} titolo={`Consegnare il biglietto a ${b.festeggiato}?`}>
        <div className="flex flex-col gap-4">
          <p>
            Da quel momento nessuno potrà più scrivere e questo stesso link mostrerà la sorpresa. Poi mandalo a {b.festeggiato}. Se serve, potrai riaprirlo.
          </p>
          <Link href={`/b/${b.slug}?anteprima=1`} className="btn btn-quieto justify-self-start self-start">
            Guarda prima come lo vedrà
          </Link>
          <Conferma etichetta="Consegna" invio={attesa} onConferma={() => void consegnaOra()} onAnnulla={() => setConsegna(false)} />
        </div>
      </Finestra>
    </div>
  );
}
