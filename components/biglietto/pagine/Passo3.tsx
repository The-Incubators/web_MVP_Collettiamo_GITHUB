"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { modelloPerId } from "@/lib/dati/modelli-biglietto";
import { leggiSessione, scriviSessione } from "@/lib/biglietti/client";
import type { Biglietto, ModelloBiglietto } from "@/lib/tipi";
import { BottonePillola, Fumetto, IntestazioneWizard, useCoachmark } from "../comuni";
import { Copertina } from "../Copertina";
import { FinestraImmagine, type ImmagineScelta, type Librerie } from "../FinestraImmagine";
import { Galleria, SegnapostoCarica } from "../Galleria";
import { StatoBozza } from "../StatoBozza";
import { useBozza } from "../useBozza";
import { useLarghezza } from "../useLarghezza";
import { ricercaPerOccasione } from "../firma/EditorFirma";
import { RAPPORTO_CARTA } from "@/lib/dominio/biglietto";

interface Testi {
  titolo: string;
  sottotitolo: string;
}

/** Passo 3 — La copertina (spec 4.3). */
export function Passo3({ id, librerie }: { id: string; librerie: Librerie }) {
  const router = useRouter();
  const params = useSearchParams();
  const { b, setB, stato, api } = useBozza(id);
  const chiaveSessione = `colletta.biglietto.${id}.copertina`;
  const [testi, setTesti] = useState<Testi | null>(null);
  const [finestra, setFinestra] = useState<null | "carica" | "libreria">(null);
  const [lavoro, setLavoro] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [rif, larghezza] = useLarghezza(560);

  const idModello = params.get("modello") ?? (b?.copertina.modelloId || null);
  const modello = idModello ? modelloPerId(idModello) : null;
  const [coach, chiudiCoach] = useCoachmark("biglietto.titolo", !!modello);

  // i testi della copertina: dalla bozza, o da sessionStorage se si stava scrivendo
  useEffect(() => {
    if (b && !testi) setTesti(leggiSessione<Testi>(chiaveSessione) ?? { titolo: b.copertina.titolo, sottotitolo: b.copertina.sottotitolo ?? "" });
  }, [b, testi, chiaveSessione]);

  // salvataggio della copertina (titolo compreso) poco dopo l'ultima battitura
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const salva = async (m: ModelloBiglietto, t: Testi): Promise<Biglietto | null> => {
    try {
      const r = await api<{ biglietto: Biglietto }>(`/api/biglietti/${id}`, {
        metodo: "PATCH",
        bigliettoId: id,
        corpo: { copertina: { modelloId: m.id, variante: Number(params.get("variante")) || 1, titolo: t.titolo, sottotitolo: t.sottotitolo } },
      });
      setB(r.biglietto);
      return r.biglietto;
    } catch {
      return null;
    }
  };
  const cambiaTesti = (t: Testi) => {
    setTesti(t);
    scriviSessione(chiaveSessione, t);
    if (timer.current) clearTimeout(timer.current);
    if (modello) timer.current = setTimeout(() => void salva(modello, t), 800);
  };
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const scegli = (m: ModelloBiglietto) => {
    // l'URL diventa condivisibile e ricaricabile; il titolo resta e prende lo stile del nuovo modello
    router.replace(`/biglietto/${id}/design?modello=${m.id}&variante=1`, { scroll: false });
    if (testi) void salva(m, testi);
    requestAnimationFrame(() => document.getElementById("anteprima-copertina")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  async function immagine(img: ImmagineScelta | null) {
    if (!modello) return;
    setFinestra(null);
    setLavoro(true);
    setErrore(null);
    try {
      const corpo = img === null ? { modelloId: modello.id, dataUrl: null } : img.tipo === "caricata" ? { modelloId: modello.id, dataUrl: img.dataUrl } : { modelloId: modello.id, url: img.url };
      const r = await api<{ biglietto: Biglietto }>(`/api/biglietti/${id}/copertina`, { metodo: "POST", bigliettoId: id, corpo });
      setB(r.biglietto);
    } catch (e) {
      setErrore(e instanceof Error ? e.message : "Non sono riuscito a caricare l'immagine.");
    } finally {
      setLavoro(false);
    }
  }

  async function avanti() {
    if (!modello || !b || !testi) return;
    if (timer.current) clearTimeout(timer.current);
    setLavoro(true);
    // titolo vuoto: vale il nome del festeggiato
    const t = { ...testi, titolo: testi.titolo.trim() || b.festeggiato };
    const ok = await salva(modello, t);
    setLavoro(false);
    if (!ok) {
      setErrore("Non sono riuscito a salvare. Riprova.");
      return;
    }
    scriviSessione(chiaveSessione, null);
    router.push(`/biglietto/${id}/anteprima`);
  }

  const conImmagine = modello && modello.tipo !== "illustrato";
  const immagineUrl = b?.copertina.immagineUrl ?? null;
  const pronto = !!modello && (!conImmagine || !!immagineUrl);

  return (
    <>
      <IntestazioneWizard indietro={`/biglietto/${id}/dettagli`} segmenti={3} percento={66.6} />
      <main className="gutter mx-auto flex w-full max-w-[600px] flex-1 flex-col gap-5 pb-28 pt-6">
        {!b || !testi ? (
          <StatoBozza stato={stato === "ok" ? "carica" : stato} />
        ) : (
          <>
            <h2 className="font-display text-[32px] font-bold leading-[38px] tracking-tight text-accent-2">Scegli la copertina</h2>
            <div ref={rif} className="h-0 w-full" />
            {modello ? (
              <section id="anteprima-copertina" aria-label="Anteprima della copertina" className="relative flex scroll-mt-28 flex-col items-center gap-3 rounded-3xl bg-surface-2 px-4 py-6">
                {coach ? (
                  <div className="absolute left-1/2 z-40 -translate-x-1/2" style={{ top: Math.max(8, 24 + (larghezza - 32) * RAPPORTO_CARTA * (modello.titolo.y / 100) - 150) }}>
                    <Fumetto verso="alto" testo="Tocca «Il tuo titolo qui» per scrivere il nome sul biglietto" onChiudi={chiudiCoach} />
                  </div>
                ) : null}
                <Copertina
                  modello={modello}
                  titolo={testi.titolo}
                  sottotitolo={testi.sottotitolo}
                  immagineUrl={immagineUrl}
                  larghezza={Math.max(200, larghezza - 32)}
                  onTitolo={(t) => cambiaTesti({ ...testi, titolo: t })}
                  onSottotitolo={(t) => cambiaTesti({ ...testi, sottotitolo: t })}
                  segnapostoImmagine={
                    modello.tipo === "carica-immagine" ? (
                      <SegnapostoCarica conGif={librerie.gif} onCarica={() => setFinestra("carica")} onGif={() => setFinestra("libreria")} />
                    ) : modello.tipo === "foto-intera" ? (
                      <button type="button" onClick={() => setFinestra("carica")} style={{ background: "transparent", border: "3px dashed rgba(255,255,255,.7)", color: "#FFF", borderRadius: 16, padding: "40px 50px", fontSize: 34, fontWeight: 700, letterSpacing: 2, cursor: "pointer" }}>
                        📷 CARICA LA TUA FOTO
                      </button>
                    ) : undefined
                  }
                />
                {conImmagine ? (
                  <div className="flex flex-wrap justify-center gap-x-6">
                    {lavoro ? <span className="text-sm text-ink-soft">Carico l’immagine…</span> : null}
                    {immagineUrl && !lavoro ? (
                      <>
                        <button type="button" onClick={() => setFinestra("carica")} className="min-h-tocco text-sm font-semibold text-accent-2 underline underline-offset-4">
                          Cambia immagine
                        </button>
                        <button type="button" onClick={() => void immagine(null)} className="min-h-tocco text-sm font-semibold text-ink-soft underline underline-offset-4">
                          Togli l’immagine
                        </button>
                      </>
                    ) : null}
                  </div>
                ) : null}
                {errore ? (
                  <p role="alert" className="text-sm font-semibold text-error">
                    {errore}
                  </p>
                ) : null}
              </section>
            ) : null}
            <Galleria occasione={b.occasione} scelto={modello?.id ?? null} titolo={testi.titolo} immagineUrl={immagineUrl} conGif={librerie.gif} onScegli={scegli} />
          </>
        )}
      </main>
      {b && testi ? (
        <div className="no-stampa sticky bottom-0 z-30 border-t border-line bg-surface/95 py-3 backdrop-blur">
          <div className="gutter mx-auto max-w-[600px]">
            <BottonePillola disabled={!pronto || lavoro} onClick={() => void avanti()}>
              Avanti
            </BottonePillola>
          </div>
        </div>
      ) : null}
      <FinestraImmagine
        aperta={finestra !== null}
        onChiudi={() => setFinestra(null)}
        onScegli={(img) => void immagine(img)}
        librerie={{ gif: librerie.gif, foto: librerie.foto }}
        ricercaIniziale={ricercaPerOccasione(b?.occasione ?? "altro")}
        schedaIniziale={finestra === "libreria" ? "libreria" : "carica"}
        titolo="Immagine della copertina"
      />
    </>
  );
}
