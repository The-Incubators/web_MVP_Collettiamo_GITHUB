"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { IconaTratto, Iniziali, SceltaGrande } from "@/components/ui";
import {
  coloreDellaNota,
  inizialiDi,
  MODI_RIVELAZIONE,
  nomeOccasione,
  nomeRivelazione,
  OCCASIONI_EDITOR,
  EFFETTI_APERTURA,
  effettoDi,
  FONT_TITOLO_PREDEFINITO,
  fontTitoloValido,
  rivelazioneValida,
  testoSu,
} from "@/lib/dominio/bacheca";
import { fontPerId, messaggioInvitoBiglietto } from "@/lib/dominio/biglietti";
import { firmeOrdinate } from "@/lib/dominio/biglietto";
import { linkWhatsApp } from "@/lib/dominio/messaggi";
import { VOCI_ACCOUNT } from "@/lib/navigazione";
import { baseUrlClient } from "@/lib/url";
import type { Biglietto, Firma, ModoRivelazione } from "@/lib/tipi";
import { CartaBiglietto, aspettoDaBiglietto } from "../bacheca/AnteprimaBacheca";
import { Avviso, condividiLink, useAvviso } from "../bacheca/Avviso";
import { NotaFirma } from "../bacheca/NotaFirma";
import { SceltaMusica } from "../bacheca/SceltaMusica";
import { Finestra } from "../comuni";
import { StatoBozza } from "../StatoBozza";
import { useBozza } from "../useBozza";
import { NomeColore, SceltaAspetto, type ValoreAspetto } from "../crea/SceltaAspetto";

const MIEI_BIGLIETTI = VOCI_ACCOUNT.find((v) => v.testo === "I miei biglietti")?.href ?? "/account";

type Modifica = "occasione" | "aspetto" | "rivelazione" | "musica" | "effetto";

/** «Colori e font» di un biglietto salvato; quelli di prima partono dai colori del loro stile. */
function valoreAspetto(b: Biglietto): ValoreAspetto {
  const a = aspettoDaBiglietto(b);
  return {
    sfondo: a.immagine ? "foto" : "colore",
    coloreSfondo: a.colori.sfondo1,
    fontTitolo: fontTitoloValido(b.copertina.fontTitolo) ?? FONT_TITOLO_PREDEFINITO,
    coloreTitolo: b.copertina.coloreTitolo ?? (testoSu(a.colori.sfondo1) === "#FFFFFF" ? "#FFFFFF" : a.colori.accento),
  };
}

/**
 * La gestione del biglietto (Gifty UX v2, design.md §5, prototipi/biglietto-gestisci.html): indietro verso «I miei
 * biglietti», l'anteprima, Firme con «Manda il link a chi firma», «Manda il biglietto a Marta», le scelte come righe con
 * la matita. La moderazione dei messaggi resta sulla bacheca (/b/[slug]), dove chi organizza nasconde ed elimina.
 */
export function Gestione({ id }: { id: string }) {
  const { b, setB, stato, api } = useBozza(id);
  const [firme, setFirme] = useState<Firma[] | null>(null);
  const [url, setUrl] = useState("");
  const [avviso, setAvviso] = useAvviso();
  const [conferma, setConferma] = useState<"consegna" | "riapri" | null>(null);
  const [modifica, setModifica] = useState<Modifica | null>(null);
  const [attesa, setAttesa] = useState(false);
  const [caricaMusica, setCaricaMusica] = useState(false);
  const [erroreMusica, setErroreMusica] = useState<string | null>(null);
  // «Colori e font» si sceglie nel foglio e si salva con «Salva»; la foto è un dataUrl nuovo, l'indirizzo salvato o null
  const [aspettoInModifica, setAspettoInModifica] = useState<ValoreAspetto | null>(null);
  const [fotoInModifica, setFotoInModifica] = useState<string | null>(null);

  const caricaFirme = useCallback(() => {
    api<{ firme: Firma[] }>(`/api/biglietti/${id}/firme`, { bigliettoId: id })
      .then((r) => setFirme(r.firme))
      .catch(() => setFirme([]));
  }, [api, id]);
  useEffect(() => {
    if (b) caricaFirme();
  }, [b?.id, caricaFirme]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (b?.slug) setUrl(`${baseUrlClient()}/b/${b.slug}`);
  }, [b?.slug]);

  const ordinate = useMemo(() => (b && firme ? firmeOrdinate(firme, b.ordineFirme, true) : []), [b, firme]);
  const visibili = ordinate.filter((f) => !f.nascosta);

  /** Salva una scelta dalla gestione e chiude il foglio. */
  async function salva(corpo: Record<string, unknown>) {
    if (!b) return;
    setAttesa(true);
    try {
      const r = await api<{ biglietto: Biglietto }>(`/api/biglietti/${id}`, { metodo: "PATCH", bigliettoId: id, corpo });
      setB(r.biglietto);
      setModifica(null);
    } catch (e) {
      setAvviso(e instanceof Error ? e.message : "Non siamo riusciti a salvare. Riprova.");
    } finally {
      setAttesa(false);
    }
  }

  /** Carica (file) o toglie (null) la musica della sorpresa. */
  async function musica(f: File | null) {
    setCaricaMusica(true);
    setErroreMusica(null);
    try {
      const r = f
        ? await api<{ biglietto: Biglietto }>(`/api/biglietti/${id}/musica?nome=${encodeURIComponent(f.name)}`, { metodo: "POST", bigliettoId: id, file: f })
        : await api<{ biglietto: Biglietto }>(`/api/biglietti/${id}/musica`, { metodo: "DELETE", bigliettoId: id });
      setB(r.biglietto);
      setAvviso(f ? "Musica caricata." : "Musica tolta.");
    } catch (e) {
      setErroreMusica(e instanceof Error ? e.message : "Non siamo riusciti a caricare la musica. Riprova.");
    } finally {
      setCaricaMusica(false);
    }
  }

  function apriAspetto() {
    if (!b) return;
    setAspettoInModifica(valoreAspetto(b));
    setFotoInModifica(b.copertina.immagineUrl);
    setModifica("aspetto");
  }

  /** Salva «Colori e font»: colori e titolo con la rotta del biglietto, la foto (nuova o tolta) con quella della copertina. */
  async function salvaAspetto() {
    if (!b || !aspettoInModifica) return;
    const v = aspettoInModifica;
    setAttesa(true);
    try {
      let r = await api<{ biglietto: Biglietto }>(`/api/biglietti/${id}`, {
        metodo: "PATCH",
        bigliettoId: id,
        corpo: { aspetto: { coloreSfondo: v.coloreSfondo, fontTitolo: v.fontTitolo, coloreTitolo: v.coloreTitolo } },
      });
      const foto = v.sfondo === "foto" ? fotoInModifica : null;
      if (foto !== b.copertina.immagineUrl) {
        r = await api<{ biglietto: Biglietto }>(`/api/biglietti/${id}/copertina`, { metodo: "POST", bigliettoId: id, corpo: { sfondo: true, dataUrl: foto } });
      }
      setB(r.biglietto);
      setModifica(null);
    } catch (e) {
      setAvviso(e instanceof Error ? e.message : "Non siamo riusciti a salvare. Riprova.");
    } finally {
      setAttesa(false);
    }
  }

  async function manda() {
    if (!b) return;
    setAvviso(await condividiLink(url, b.nome, `${b.festeggiato}, c’è una sorpresa per te 🎁`));
  }

  async function consegna(azione: "consegna" | "riapri") {
    setAttesa(true);
    try {
      const r = await api<{ biglietto: Biglietto }>(`/api/biglietti/${id}/consegna`, { metodo: "POST", bigliettoId: id, corpo: { azione } });
      setB(r.biglietto);
      setConferma(null);
      if (azione === "consegna") await manda();
      else setAvviso("Biglietto riaperto: si può di nuovo scrivere.");
    } catch (e) {
      setAvviso(e instanceof Error ? e.message : "Non ci siamo riusciti. Riprova.");
    } finally {
      setAttesa(false);
    }
  }

  async function copia() {
    try {
      await navigator.clipboard.writeText(url);
      setAvviso("Link copiato: incollalo dove vuoi.");
    } catch {
      setAvviso(url);
    }
  }

  const indietro = (
    <Link className="btn btn-quieto" href={MIEI_BIGLIETTI}>
      <IconaTratto nome="sx" />I miei biglietti
    </Link>
  );

  if (!b) {
    return (
      <div className="gestione-b pagina">
        <div className="su">{indietro}</div>
        <StatoBozza stato={stato === "ok" ? "carica" : stato} />
      </div>
    );
  }

  const aspetto = aspettoDaBiglietto(b);
  const modo = rivelazioneValida(b.rivelazione);
  const consegnato = b.stato === "consegnato";
  const valore = valoreAspetto(b);
  const effetto = effettoDi(b.effetto);

  return (
    <div className="gestione-b pagina">
      <div className="su">
        {indietro}
        <h1 className="t-pagina">Il biglietto per {b.festeggiato}</h1>
      </div>

      {b.stato === "bozza" ? (
        <Link href={`/biglietto/${id}/anteprima`} className="btn btn-primario">
          Vai all’anteprima per pubblicarlo
        </Link>
      ) : (
        <div className="corpo">
          <div className="colonna-carta">
            <CartaBiglietto aspetto={aspetto}>
              {visibili.slice(0, 6).map((f, i) => (
                <NotaFirma key={f.id} f={f} colore={coloreDellaNota(f.coloreNota, i)} />
              ))}
            </CartaBiglietto>
            <Link href={`/b/${b.slug}`} className="btn btn-quieto">
              Apri il biglietto
            </Link>
          </div>

          <div>
            <section className="blocco" aria-labelledby="t-firme">
              <h2 id="t-firme" className="t-sezione">
                Firme
              </h2>
              {visibili.length ? (
                <ul className="firme-b">
                  {visibili.map((f) => (
                    <li key={f.id}>
                      <Iniziali testo={inizialiDi(f.daParteDi)} />
                      {f.daParteDi}
                    </li>
                  ))}
                </ul>
              ) : null}
              {b.stato === "aperto" && url ? (
                <div className="azioni">
                  <a className="btn btn-primario" href={linkWhatsApp(messaggioInvitoBiglietto(b, url))} target="_blank" rel="noopener noreferrer">
                    <IconaTratto nome="whatsapp" />
                    Manda il link a chi firma
                  </a>
                  <button type="button" className="btn btn-contorno" onClick={() => void copia()}>
                    <IconaTratto nome="copia" />
                    Copia il link
                  </button>
                </div>
              ) : null}
            </section>

            <section className="blocco" aria-labelledby="t-consegna">
              <h2 id="t-consegna" className="t-sezione">
                Consegna a {b.festeggiato}
              </h2>
              <div className="azioni">
                <button type="button" className="btn btn-contorno" onClick={() => (consegnato ? void manda() : setConferma("consegna"))}>
                  <IconaTratto nome="regalo" />
                  Manda il biglietto a {b.festeggiato}
                </button>
                {consegnato ? (
                  <button type="button" className="btn btn-quieto" onClick={() => setConferma("riapri")}>
                    Riapri per altri messaggi
                  </button>
                ) : (
                  <Link href={`/b/${b.slug}?anteprima=1`} className="btn btn-quieto">
                    Guarda come lo vedrà {b.festeggiato}
                  </Link>
                )}
              </div>
            </section>

            <section className="blocco" aria-labelledby="t-scelte">
              <h2 id="t-scelte" className="t-sezione">
                Le tue scelte
              </h2>
              <dl className="riep-b">
                {(
                  [
                    ["Occasione", nomeOccasione(b.occasione), "occasione", !consegnato, "Modifica l'occasione"],
                    ["Sfondo", valore.sfondo === "foto" ? "Foto" : <NomeColore key="s" colore={valore.coloreSfondo} />, "aspetto", !consegnato, "Modifica colori e font"],
                    ["Font del titolo", <span key="f" style={{ fontFamily: fontPerId(valore.fontTitolo).css }}>{fontPerId(valore.fontTitolo).nome}</span>, "aspetto", !consegnato, "Modifica colori e font"],
                    ["Colore del titolo", <NomeColore key="c" colore={valore.coloreTitolo} />, "aspetto", !consegnato, "Modifica colori e font"],
                    ["Come lo scopre", nomeRivelazione(modo), "rivelazione", true, "Modifica come lo scopre"],
                    ["Musica", b.musica?.nome ?? "Nessuna", "musica", true, "Modifica la musica"],
                    ["Effetto all’apertura", effetto.nome, "effetto", true, "Modifica l'effetto all'apertura"],
                  ] as const
                ).map(([k, v, m, attiva, etichetta]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v || "–"}</dd>
                    {attiva ? (
                      <button type="button" className="icona-btn" aria-label={etichetta} onClick={() => (m === "aspetto" ? apriAspetto() : setModifica(m))}>
                        <IconaTratto nome="matita" />
                      </button>
                    ) : null}
                  </div>
                ))}
              </dl>
            </section>
          </div>
        </div>
      )}

      <Avviso testo={avviso} />

      <Finestra aperta={modifica === "occasione"} onChiudi={() => setModifica(null)} titolo="Che cosa si festeggia?">
        <div className="chips" role="radiogroup" aria-label="Occasione">
          {OCCASIONI_EDITOR.map((o) => (
            <button key={o.id} type="button" className="chip" role="radio" aria-checked={b.occasione === o.id} disabled={attesa} onClick={() => void salva({ occasione: o.id })}>
              {o.etichetta}
            </button>
          ))}
        </div>
      </Finestra>

      <Finestra aperta={modifica === "aspetto"} onChiudi={() => setModifica(null)} titolo="Colori e font">
        {aspettoInModifica ? (
          <div className="grid gap-5">
            <SceltaAspetto
              valore={aspettoInModifica}
              onCambia={(v) => setAspettoInModifica((x) => (x ? { ...x, ...v } : x))}
              foto={fotoInModifica}
              onFoto={setFotoInModifica}
              onTogliFoto={() => (setFotoInModifica(null), setAspettoInModifica((x) => (x ? { ...x, sfondo: "colore" } : x)))}
              attesa={attesa}
            />
            <button type="button" className="btn btn-primario" disabled={attesa || (aspettoInModifica.sfondo === "foto" && !fotoInModifica)} aria-busy={attesa || undefined} onClick={() => void salvaAspetto()}>
              Salva
            </button>
          </div>
        ) : null}
      </Finestra>

      <Finestra aperta={modifica === "effetto"} onChiudi={() => setModifica(null)} titolo="Effetto all’apertura">
        <div className="chips" role="radiogroup" aria-label="Effetto all’apertura">
          {EFFETTI_APERTURA.map((e) => (
            <button key={e.id} type="button" className="chip" role="radio" aria-checked={effetto.id === e.id} disabled={attesa} onClick={() => void salva({ effetto: e.id })}>
              {e.emoji[0] ? <span aria-hidden="true">{e.emoji[0]}</span> : null}
              {e.nome}
            </button>
          ))}
        </div>
      </Finestra>

      <Finestra aperta={modifica === "rivelazione"} onChiudi={() => setModifica(null)} titolo="Come lo scoprirà">
        <div role="radiogroup" aria-label="Come lo scoprirà" className="grid gap-3">
          {MODI_RIVELAZIONE.map((m) => (
            <SceltaGrande key={m.id} scelto={modo === m.id} nome={m.nome} onScegli={() => void salva({ rivelazione: m.id as ModoRivelazione })}>
              {m.descrizione}
            </SceltaGrande>
          ))}
        </div>
      </Finestra>

      <Finestra aperta={modifica === "musica"} onChiudi={() => setModifica(null)} titolo="Musica">
        <SceltaMusica nome={b.musica?.nome ?? null} url={b.musica?.url ?? null} onFile={(f) => void musica(f)} onTogli={() => void musica(null)} attesa={caricaMusica} errore={erroreMusica} />
      </Finestra>

      <Finestra
        aperta={!!conferma}
        onChiudi={() => setConferma(null)}
        titolo={conferma === "riapri" ? "Riaprire il biglietto?" : `Consegnare il biglietto a ${b.festeggiato}?`}
      >
        <div className="grid gap-4">
          <p className="m-0">
            {conferma === "riapri"
              ? "Il link torna a essere la bacheca e si potranno aggiungere altri messaggi. La sorpresa si rivede quando lo consegni di nuovo."
              : `Da quel momento nessuno potrà più scrivere e il link mostrerà la sorpresa. Poi mandalo a ${b.festeggiato}.`}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <button type="button" disabled={attesa} aria-busy={attesa || undefined} onClick={() => conferma && void consegna(conferma)} className="btn btn-primario flex-1">
              {conferma === "riapri" ? "Riapri" : "Consegna"}
            </button>
            <button type="button" onClick={() => setConferma(null)} className="btn btn-contorno flex-1">
              Annulla
            </button>
          </div>
        </div>
      </Finestra>
    </div>
  );
}
